import { NextResponse, type NextRequest } from "next/server";
import { authErrorResponse, noStore, requireAccount } from "@/app/lib/auth/request";
import { portalSnapshot } from "@/app/lib/server/portal-store";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const account = await requireAccount(req);
    return noStore(NextResponse.json({ store: await portalSnapshot(account) }));
  } catch (error) {
    return authErrorResponse(error);
  }
}
