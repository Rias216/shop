import { NextResponse } from "next/server";
import { setCouponCodeCookie } from "@/lib/coupon-cookie";
import { clientIpFromHeaders, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const couponLimiter = rateLimit({
    key: `coupon-clear:${clientIpFromHeaders(request.headers)}`,
    limit: 60,
    windowMs: 60_000,
  });
  if (!couponLimiter.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(couponLimiter.retryAfterSec) },
      },
    );
  }

  await setCouponCodeCookie(null);
  return NextResponse.json({ ok: true });
}
