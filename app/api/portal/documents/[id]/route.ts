import { readFile } from "node:fs/promises";
import { NextResponse, type NextRequest } from "next/server";
import { authErrorResponse, requireAccount } from "@/app/lib/auth/request";
import { documentFile } from "@/app/lib/server/portal-store";

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
