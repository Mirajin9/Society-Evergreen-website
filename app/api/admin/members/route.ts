import { NextResponse } from "next/server";
import { listMembers, type ListMembersParams } from "@/backend/api/members";
import { routeError, supabaseFromRequest } from "@/app/lib/api-route";

const FILTERS = new Set(["all", "has_email", "missing_email", "missing_phone", "logins_enabled", "pending_invite", "deceased", "no_membership"]);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const filter = url.searchParams.get("filter") || "all";
    const params: ListMembersParams = {
      filter: FILTERS.has(filter) ? filter as ListMembersParams["filter"] : "all",
      search: url.searchParams.get("search") || undefined,
      limit: Number(url.searchParams.get("limit") || 100),
      offset: Number(url.searchParams.get("offset") || 0)
    };
    const supabase = supabaseFromRequest(req);
    return NextResponse.json(await listMembers(supabase, params));
  } catch (error) {
    return routeError(error);
  }
}
