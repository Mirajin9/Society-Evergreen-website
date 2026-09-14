import { NextResponse, type NextRequest } from "next/server";
import { listAccounts } from "@/app/lib/auth/accounts";
import { authErrorResponse, noStore, requireAccount } from "@/app/lib/auth/request";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await requireAccount(req, { admin: true });
    return noStore(NextResponse.json({ accounts: await listAccounts() }));
  } catch (error) {
    return authErrorResponse(error);
  }
}
