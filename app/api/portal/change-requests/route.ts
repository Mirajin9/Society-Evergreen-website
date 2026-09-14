import { NextResponse, type NextRequest } from "next/server";
import { authErrorResponse, noStore, requireAccount } from "@/app/lib/auth/request";
import { createChangeRequest } from "@/app/lib/server/portal-store";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const account = await requireAccount(req);
    const request = await createChangeRequest(account, await req.json().catch(() => ({})));
    return noStore(NextResponse.json({ request }));
  } catch (error) {
    return authErrorResponse(error);
  }
}
