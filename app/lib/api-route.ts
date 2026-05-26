import { NextResponse } from "next/server";
import { supabaseForUser } from "@/backend/lib/supabase-server";

export function supabaseFromRequest(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (!token) {
    const err = new Error("Missing bearer token");
    (err as Error & { status?: number }).status = 401;
    throw err;
  }
  return supabaseForUser(token);
}

export function routeError(error: unknown) {
  const err = error as Error & { status?: number; code?: string };
  const status = err.status || 500;
  return NextResponse.json({ error: err.message || "Unexpected server error" }, { status });
}
