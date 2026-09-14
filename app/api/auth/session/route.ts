import { NextResponse, type NextRequest } from "next/server";
import { authErrorResponse, noStore, requireAccount, sessionFor, withoutSessionCookie } from "@/app/lib/auth/request";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const account = await requireAccount(req, { allowPasswordChange: true });
    return noStore(NextResponse.json({ session: sessionFor(account) }));
  } catch (error) {
    const res = authErrorResponse(error);
    return res.status === 401 ? withoutSessionCookie(req, res) : res;
  }
}
