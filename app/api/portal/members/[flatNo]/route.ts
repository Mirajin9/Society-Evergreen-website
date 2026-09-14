import { NextResponse, type NextRequest } from "next/server";
import { authErrorResponse, noStore, requireAccount } from "@/app/lib/auth/request";
import { updateMemberRecord } from "@/app/lib/server/portal-store";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ flatNo: string }> }) {
  try {
    const account = await requireAccount(req, { admin: true });
    const { flatNo } = await params;
    const member = await updateMemberRecord(account, flatNo, await req.json().catch(() => ({})));
    return noStore(NextResponse.json({ member }));
  } catch (error) {
    return authErrorResponse(error);
  }
}
