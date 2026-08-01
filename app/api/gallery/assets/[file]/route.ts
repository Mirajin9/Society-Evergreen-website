import { readFile, stat } from "node:fs/promises";
import { NextResponse, type NextRequest } from "next/server";
import { localGalleryFilePath } from "@/app/lib/gallery-file-store";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const filePath = localGalleryFilePath(file);
  if (!filePath) {
    return NextResponse.json({ error: "Invalid gallery file." }, { status: 400 });
  }

  try {
    const [info, bytes] = await Promise.all([stat(filePath), readFile(filePath)]);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": mimeType(file),
        "Content-Length": String(info.size),
        "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=60"
      }
    });
  } catch {
    return NextResponse.json({ error: "Gallery file not found." }, { status: 404 });
  }
}

function mimeType(fileName: string) {
  if (/\.png$/i.test(fileName)) return "image/png";
  if (/\.webp$/i.test(fileName)) return "image/webp";
  if (/\.gif$/i.test(fileName)) return "image/gif";
  return "image/jpeg";
}
