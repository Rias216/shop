import { NextResponse } from "next/server";
import { z } from "zod";
import { setCouponCodeCookie } from "@/lib/coupon-cookie";
import { validateCouponCode } from "@/lib/coupons";
import { clientIpFromHeaders, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  code: z.string().min(1).max(40),
  subtotalCents: z.number().int().min(0),
});

export async function POST(request: Request) {
  try {
    const couponLimiter = rateLimit({
      key: `coupon-validate:${clientIpFromHeaders(request.headers)}`,
      limit: 40,
      windowMs: 60_000,
    });
    if (!couponLimiter.ok) {
      return NextResponse.json(
        { error: "Too many coupon attempts. Please wait and try again." },
        {
          status: 429,
          headers: { "Retry-After": String(couponLimiter.retryAfterSec) },
        },
      );
    }

    const body = schema.parse(await request.json());
    const result = await validateCouponCode(body.code, body.subtotalCents);
    if (!result.ok) {
      await setCouponCodeCookie(null);
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    await setCouponCodeCookie(result.coupon.code);
    return NextResponse.json({ coupon: result.coupon });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
