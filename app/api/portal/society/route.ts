import { NextResponse, type NextRequest } from "next/server";
import { authErrorResponse, noStore, requireAccount } from "@/app/lib/auth/request";
import { updateSociety } from "@/app/lib/server/portal-store";

export const runtime = "nodejs";

export async function PUT(req: NextRequest) {
  try {
    const account = await requireAccount(req, { admin: true });
    const society = await updateSociety(account, await req.json().catch(() => ({})));
    return noStore(NextResponse.json({ society }));
  } catch (error) {
    return authErrorResponse(error);
  }
}
