import { NextResponse, type NextRequest } from "next/server";
import { withoutSessionCookie } from "@/app/lib/auth/request";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return withoutSessionCookie(req, NextResponse.json({ ok: true }));
}
