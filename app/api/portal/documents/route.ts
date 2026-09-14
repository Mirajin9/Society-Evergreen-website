import { NextResponse, type NextRequest } from "next/server";
import { authErrorResponse, noStore, requireAccount } from "@/app/lib/auth/request";
import { createDocument } from "@/app/lib/server/portal-store";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const account = await requireAccount(req, { admin: true });
    const document = await createDocument(account, await req.formData());
    return noStore(NextResponse.json({ document }));
  } catch (error) {
    return authErrorResponse(error);
  }
}
