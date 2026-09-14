import { NextResponse, type NextRequest } from "next/server";
import { authenticate } from "@/app/lib/auth/accounts";
import { authErrorResponse, noStore, sessionFor, withSessionCookie } from "@/app/lib/auth/request";

export const runtime = "nodejs";

// Per-IP limit on top of the per-account lockout, so one visitor can't sweep many accounts.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES_PER_IP = 30;
const failuresByIp = new Map<string, { count: number; resetAt: number }>();

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const bucket = failuresByIp.get(ip);
    if (bucket && bucket.resetAt > Date.now() && bucket.count >= MAX_FAILURES_PER_IP) {
      return noStore(NextResponse.json({ error: "Too many failed attempts. Try again in 15 minutes." }, { status: 429 }));
    }

    const body = (await req.json().catch(() => ({}))) as { username?: unknown; password?: unknown };
    const username = typeof body.username === "string" ? body.username : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!username.trim() || !password) {
      return noStore(NextResponse.json({ error: "Enter your username and password." }, { status: 400 }));
    }

    const result = password.length > 256 ? { ok: false as const, reason: "invalid" as const } : await authenticate(username, password);
    if (!result.ok) {
      recordFailure(ip);
      const locked = result.reason === "locked";
      const error = locked
        ? `Too many failed attempts on this account. Try again in ${result.retryAfterMinutes} minute${result.retryAfterMinutes === 1 ? "" : "s"}.`
        : "Invalid username or password.";
      return noStore(NextResponse.json({ error }, { status: locked ? 429 : 401 }));
    }

    return withSessionCookie(req, NextResponse.json({ session: sessionFor(result.account) }), result.account);
  } catch (error) {
    return authErrorResponse(error);
  }
}

function clientIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

function recordFailure(ip: string) {
  const now = Date.now();
  const bucket = failuresByIp.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    failuresByIp.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    bucket.count += 1;
  }
  if (failuresByIp.size > 5000) {
    for (const [key, value] of failuresByIp) {
      if (value.resetAt <= now) failuresByIp.delete(key);
    }
  }
}
