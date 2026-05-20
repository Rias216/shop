import { handlers } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { clientIpFromHeaders, rateLimit } from "@/lib/rate-limit";

export const GET = handlers.GET;

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const isCredentialsCallback = url.pathname.includes("/callback/credentials");
  if (isCredentialsCallback) {
    const limiter = rateLimit({
      key: `auth-credentials:${clientIpFromHeaders(request.headers)}`,
      limit: 15,
      windowMs: 60_000,
    });
    if (!limiter.ok) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait and try again." },
        {
          status: 429,
          headers: { "Retry-After": String(limiter.retryAfterSec) },
        },
      );
    }
  }
  return handlers.POST(request);
}
