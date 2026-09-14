import { NextResponse, type NextRequest } from "next/server";
import { normalizeUsername, resetPassword } from "@/app/lib/auth/accounts";
import { authErrorResponse, noStore, requireAccount } from "@/app/lib/auth/request";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAccount(req, { admin: true });
    const body = (await req.json().catch(() => ({}))) as { username?: unknown };
    const username = typeof body.username === "string" ? body.username : "";
    if (!username.trim()) {
      return noStore(NextResponse.json({ error: "Choose a login to reset." }, { status: 400 }));
    }
    if (normalizeUsername(username) === admin.username) {
      return noStore(NextResponse.json({ error: "Use Change password for your own account." }, { status: 400 }));
    }

    const { account, temporaryPassword } = await resetPassword(username);
    console.info(`[auth] ${admin.username} issued a temporary password for ${account.username}`);
    return noStore(NextResponse.json({ username: account.username, flatNo: account.flatNo, temporaryPassword }));
  } catch (error) {
    return authErrorResponse(error);
  }
}
