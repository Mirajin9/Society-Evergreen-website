import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MOCK_OTP = "123456";

// In-memory OTP store for mock mode (per-process only, resets on server restart).
// In production, replace this with Supabase phone auth or MSG91/Twilio.
const pendingOtps = new Map<string, { otp: string; expiresAt: number }>();

export async function POST(req: Request) {
  try {
    const { mobile } = await req.json() as { mobile?: string };
    if (!mobile || !/^\d{10}$/.test(mobile.replace(/\D/g, ""))) {
      return NextResponse.json({ error: "Invalid mobile number" }, { status: 400 });
    }
    const normalized = mobile.replace(/\D/g, "");

    // TODO (Supabase): replace block below with a real member lookup:
    //   const { data } = await supabase.from("members").select("flat_no").or(`phone.eq.${normalized},alternate_phone.eq.${normalized}`).single();
    //   if (!data) return NextResponse.json({ error: "not_registered" }, { status: 404 });
    //
    // For now, accept any 10-digit number (mock mode).
    // The client-side requestOtp() in local-store.ts checks against the real member list.

    pendingOtps.set(normalized, { otp: MOCK_OTP, expiresAt: Date.now() + 5 * 60 * 1000 });

    // TODO: replace console.log with the chosen OTP delivery provider:
    //   await sendSms({ to: `+91${normalized}`, body: `Your Evergreen Apartments OTP is: ${MOCK_OTP}. Valid for 5 minutes.` });
    console.log(`[DEV] OTP for +91${normalized}: ${MOCK_OTP}`);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
