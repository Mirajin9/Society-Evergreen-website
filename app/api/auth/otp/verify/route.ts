import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MOCK_OTP = "123456";

// Shared in-process OTP store (matches /api/auth/otp/request/route.ts).
// In production: remove this and use Supabase phone auth session tokens.
const pendingOtps = new Map<string, { otp: string; expiresAt: number }>();

export async function POST(req: Request) {
  try {
    const { mobile, otp } = await req.json() as { mobile?: string; otp?: string };
    if (!mobile || !otp) {
      return NextResponse.json({ error: "mobile and otp are required" }, { status: 400 });
    }
    const normalized = mobile.replace(/\D/g, "");

    // Mock mode: accept MOCK_OTP ("123456") always, ignore expiry check server-side
    // (client handles its own expiry in local-store.ts)
    if (otp.trim() !== MOCK_OTP) {
      return NextResponse.json({ error: "invalid_otp" }, { status: 401 });
    }

    pendingOtps.delete(normalized);

    // Return a mock session token.
    // In production: return the real Supabase access_token from above.
    return NextResponse.json({
      success: true,
      mock_token: `mock_${normalized}_${Date.now()}`
    });
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
