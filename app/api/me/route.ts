import { NextResponse } from "next/server";
import { getMe } from "@/backend/api/me";
import { routeError, supabaseFromRequest } from "@/app/lib/api-route";

export async function GET(req: Request) {
  try {
    const supabase = supabaseFromRequest(req);
    return NextResponse.json(await getMe(supabase));
  } catch (error) {
    return routeError(error);
  }
}
