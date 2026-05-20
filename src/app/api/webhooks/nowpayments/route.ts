import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { verifyNowPaymentsIpnSignature } from "@/lib/payments/nowpayments";
import { markOrderPaid } from "@/lib/orders";
import { getStoreSettings } from "@/lib/settings";
import { createRequestPerf } from "@/lib/perf";

const PAID_STATUSES = new Set(["finished", "confirmed"]);
const FAILED_STATUSES = new Set(["failed", "expired", "canceled"]);
const REFUNDED_STATUSES = new Set(["refunded"]);

export async function POST(request: Request) {
  const perf = createRequestPerf("api.webhooks.nowpayments.POST");
  const settings = await perf.time("get_store_settings", getStoreSettings);
  const ipnSecret = settings.nowpaymentsIpnSecret;
  if (!ipnSecret) {
    perf.flush({ ok: false, statusCode: 503, reason: "missing_ipn_secret" });
    return NextResponse.json({ error: "IPN not configured" }, { status: 503 });
  }

  const body = await perf.time("parse_body", async () => (await request.json()) as Record<string, unknown>);
  const signature = request.headers.get("x-nowpayments-sig");

  const signatureOk = await perf.time("verify_signature", async () =>
    verifyNowPaymentsIpnSignature(signature, body, ipnSecret),
  );
  if (!signatureOk) {
    perf.flush({ ok: false, statusCode: 401, reason: "invalid_signature" });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const paymentStatus = String(body.payment_status ?? "");
  perf.setFields({ paymentStatus });

  const replayHash = createHash("sha256")
    .update(
      JSON.stringify({
        paymentId: body.payment_id ?? null,
        orderId: body.order_id ?? null,
        paymentStatus,
      }),
    )
    .digest("hex");

  const replayInserted = await perf.time("webhook_event_insert", async () => {
    try {
      await db.webhookEvent.create({
        data: {
          provider: "NOWPAYMENTS",
          eventHash: replayHash,
        },
      });
      return true;
    } catch {
      return false;
    }
  });
  if (!replayInserted) {
    perf.flush({ ok: true, statusCode: 200, skipped: true, reason: "duplicate_event" });
    return NextResponse.json({ ok: true });
  }

  const orderId = body.order_id ? String(body.order_id) : null;
  const paymentId = body.payment_id ? String(body.payment_id) : null;
  perf.setFields({ hasOrderId: Boolean(orderId), hasPaymentId: Boolean(paymentId) });

  const order = orderId
    ? await perf.time("lookup_order_by_id", () => db.order.findUnique({ where: { id: orderId } }))
    : paymentId
      ? await perf.time("lookup_order_by_invoice", () =>
          db.order.findFirst({ where: { cryptoInvoiceId: paymentId } }),
        )
      : null;

  perf.setFields({ foundOrder: Boolean(order), alreadyCompleted: order?.paymentStatus === "COMPLETED" });
  if (!order) {
    perf.flush({ ok: true, statusCode: 200, skipped: true, reason: "order_not_found" });
    return NextResponse.json({ ok: true });
  }

  if (PAID_STATUSES.has(paymentStatus)) {
    if (order.paymentStatus !== "COMPLETED") {
      await perf.time("mark_order_paid", () => markOrderPaid(order.id));
    }
  } else if (FAILED_STATUSES.has(paymentStatus)) {
    if (order.paymentStatus !== "COMPLETED") {
      await perf.time("mark_order_failed", () =>
        db.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED", paymentStatus: "FAILED" },
        }),
      );
    }
  } else if (REFUNDED_STATUSES.has(paymentStatus)) {
    await perf.time("mark_order_refunded", () =>
      db.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED", paymentStatus: "REFUNDED" },
      }),
    );
  } else {
    perf.flush({ ok: true, statusCode: 200, skipped: true, reason: "non_terminal_status" });
    return NextResponse.json({ ok: true });
  }

  perf.flush({ ok: true, statusCode: 200 });
  return NextResponse.json({ ok: true });
}
