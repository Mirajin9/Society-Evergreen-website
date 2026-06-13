import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

const FILES: Record<string, string> = {
  "form 20.pdf": "form-20.pdf",
  "form-20.pdf": "form-20.pdf",
  "form 21.pdf": "form-21.pdf",
  "form-21.pdf": "form-21.pdf",
  "nomination form.pdf": "nomination-form.pdf",
  "nomination-form.pdf": "nomination-form.pdf",
  "modelbylawscghs-delhi.pdf": "model-bye-laws-cghs-delhi.pdf",
  "model-bye-laws-cghs-delhi.pdf": "model-bye-laws-cghs-delhi.pdf",
  "evergreen cghs bye-laws.docx": "evergreen-cghs-bye-laws.docx",
  "evergreen-cghs-bye-laws.docx": "evergreen-cghs-bye-laws.docx"
};

export async function GET(req: NextRequest) {
  const name = (req.nextUrl.searchParams.get("name") || "").trim().toLowerCase();
  const fileName = FILES[name];
  if (!fileName) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  return NextResponse.redirect(new URL(`/files/${fileName}`, req.nextUrl.origin));
}
