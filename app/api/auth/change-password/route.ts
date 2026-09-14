import { NextResponse, type NextRequest } from "next/server";
import { changePassword } from "@/app/lib/auth/accounts";
import { authErrorResponse, requireAccount, sessionFor, withSessionCookie } from "@/app/lib/auth/request";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const account = await requireAccount(req, { allowPasswordChange: true });
    const body = (await req.json().catch(() => ({}))) as { currentPassword?: unknown; newPassword?: unknown };
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Enter your current password and a new password." }, { status: 400 });
    }

    const updated = await changePassword(account.username, currentPassword, newPassword);
    // Re-issue the cookie: the password version changed, which signs out every other device.
    return withSessionCookie(req, NextResponse.json({ session: sessionFor(updated) }), updated);
  } catch (error) {
    return authErrorResponse(error);
  }
}
