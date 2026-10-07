import { readFile } from "node:fs/promises";
import { NextResponse, type NextRequest } from "next/server";
import { authErrorResponse, noStore, requireAccount } from "@/app/lib/auth/request";
import { AuthError } from "@/app/lib/auth/accounts";
import { deleteDocument, documentFile, updateDocument } from "@/app/lib/server/portal-store";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const account = await requireAccount(req);
    const { id } = await params;
    const document = await documentFile(account, id);
    const bytes = await readFile(document.path);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": document.mimeType,
        "Content-Length": String(bytes.length),
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(document.fileName)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const account = await requireAccount(req, { admin: true });
    const { id } = await params;
    const input = await req.json().catch(() => { throw new AuthError(400, "Send valid document details."); });
    const document = await updateDocument(account, id, input);
    return noStore(NextResponse.json({ document }));
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const account = await requireAccount(req, { admin: true });
    const { id } = await params;
    return noStore(NextResponse.json(await deleteDocument(account, id)));
  } catch (error) {
    return authErrorResponse(error);
  }
}
