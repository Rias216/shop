import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient, type PaymentStatus } from "../src/generated/prisma/client";

type PaymentState = PaymentStatus | "PENDING" | null;

const API_BASE = "https://api.nowpayments.io/v1";
const PAID_STATUSES = new Set(["finished", "confirmed"]);
const FAILED_STATUSES = new Set(["failed", "expired", "canceled"]);
const REFUNDED_STATUSES = new Set(["refunded"]);

function createClient(): { db: PrismaClient; cleanup: () => Promise<void> } {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";

  if (url.startsWith("file:")) {
    const adapter = new PrismaBetterSqlite3({ url });
    const db = new PrismaClient({ adapter });
    return {
      db,
      cleanup: async () => db.$disconnect(),
    };
  }

  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  const db = new PrismaClient({ adapter });
  return {
    db,
    cleanup: async () => {
      await db.$disconnect();
      await pool.end();
    },
  };
}

function normalizeProviderStatus(value: unknown): string | null {
  const raw = String(value ?? "").trim().toLowerCase();
  return raw || null;
}

function mapProviderStatus(raw: string | null): PaymentState {
  if (!raw) return null;
  if (PAID_STATUSES.has(raw)) return "COMPLETED";
  if (FAILED_STATUSES.has(raw)) return "FAILED";
  if (REFUNDED_STATUSES.has(raw)) return "REFUNDED";
  return "PENDING";
}

async function fetchInvoiceState(invoiceId: string, apiKey: string): Promise<PaymentState> {
  const res = await fetch(`${API_BASE}/invoice/${invoiceId}`, {
    headers: { "x-api-key": apiKey },
    cache: "no-store",
  });
  if (!res.ok) return null;

  const data = (await res.json()) as Record<string, unknown>;
  const direct = mapProviderStatus(
    normalizeProviderStatus(
      data.payment_status ?? data.invoice_status ?? data.order_status ?? data.status,
    ),
  );
  if (direct) return direct;

  const payments = Array.isArray(data.payments) ? data.payments : [];
  const states = payments
    .map((entry) =>
      mapProviderStatus(normalizeProviderStatus((entry as Record<string, unknown>)?.payment_status)),
    )
    .filter(Boolean) as Exclude<PaymentState, null>[];

  if (states.includes("COMPLETED")) return "COMPLETED";
  if (states.includes("REFUNDED")) return "REFUNDED";
  if (states.includes("FAILED")) return "FAILED";
  if (states.includes("PENDING")) return "PENDING";
  return null;
}

async function markOrderPaidSilently(db: PrismaClient, orderId: string): Promise<boolean> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || order.paymentStatus === "COMPLETED") return false;

  await db.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: "PAID", paymentStatus: "COMPLETED" },
    });
    await Promise.all(
      order.items.map((item) =>
        tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.qty } },
        }),
      ),
    );
  });

  return true;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const { db, cleanup } = createClient();

  try {
    const settings = await db.storeSettings.findFirst({
      select: { nowpaymentsApiKey: true },
    });
    const apiKey = settings?.nowpaymentsApiKey?.trim();
    if (!apiKey) {
      console.error("NOWPayments API key is not configured in store settings.");
      process.exitCode = 1;
      return;
    }

    const pendingOrders = await db.order.findMany({
      where: {
        paymentMethod: "CRYPTO",
        paymentStatus: "PENDING",
        cryptoInvoiceId: { not: null },
      },
      select: {
        id: true,
        cryptoInvoiceId: true,
      },
      orderBy: { createdAt: "asc" },
    });

    let completed = 0;
    let failed = 0;
    let refunded = 0;
    let unchanged = 0;
    let errors = 0;

    for (const order of pendingOrders) {
      try {
        const state = await fetchInvoiceState(order.cryptoInvoiceId as string, apiKey);

        if (state === "COMPLETED") {
          if (dryRun) {
            completed += 1;
          } else {
            const updated = await markOrderPaidSilently(db, order.id);
            if (updated) completed += 1;
            else unchanged += 1;
          }
          continue;
        }

        if (state === "FAILED") {
          if (dryRun) {
            failed += 1;
          } else {
            await db.order.update({
              where: { id: order.id },
              data: { status: "CANCELLED", paymentStatus: "FAILED" },
            });
            failed += 1;
          }
          continue;
        }

        if (state === "REFUNDED") {
          if (dryRun) {
            refunded += 1;
          } else {
            await db.order.update({
              where: { id: order.id },
              data: { status: "CANCELLED", paymentStatus: "REFUNDED" },
            });
            refunded += 1;
          }
          continue;
        }

        unchanged += 1;
      } catch (error) {
        errors += 1;
        console.error(
          `[order:${order.id}] backfill failed`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    const summary = {
      dryRun,
      scanned: pendingOrders.length,
      completed,
      failed,
      refunded,
      unchanged,
      errors,
    };

    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await cleanup();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
