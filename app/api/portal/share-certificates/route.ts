import { NextResponse, type NextRequest } from "next/server";
import { authErrorResponse, noStore, requireAccount } from "@/app/lib/auth/request";
import { saveShareCertificateRegister } from "@/app/lib/server/portal-store";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const account = await requireAccount(req, { admin: true });
    const register = await saveShareCertificateRegister(account, await req.json().catch(() => ({})));
    return noStore(NextResponse.json({ register }));
  } catch (error) {
    return authErrorResponse(error);
  }
}
