import { NextResponse, type NextRequest } from "next/server";
import { authErrorResponse, noStore, requireAccount } from "@/app/lib/auth/request";
import { reviewChangeRequest } from "@/app/lib/server/portal-store";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const account = await requireAccount(req, { admin: true });
    const { id } = await params;
    const request = await reviewChangeRequest(account, id, await req.json().catch(() => ({})));
    return noStore(NextResponse.json({ request }));
  } catch (error) {
    return authErrorResponse(error);
  }
}
