import { NextResponse, type NextRequest } from "next/server";
import { sendLoginInvite } from "@/backend/api/members";
import { routeError, supabaseFromRequest } from "@/app/lib/api-route";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const supabase = supabaseFromRequest(req);
    return NextResponse.json(await sendLoginInvite(supabase, params.id));
  } catch (error) {
    return routeError(error);
  }
}
