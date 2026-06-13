import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase-admin";

export const runtime = "nodejs";

const categoryMap: Record<string, string> = {
  general: "notice",
  maintenance: "maintenance",
  agm: "agm",
  urgent: "emergency",
  event: "society_event"
};

export async function POST(req: NextRequest) {
  try {
    const input = await req.json();
    const title = String(input.title || "").trim();
    const body = String(input.body || "").trim();
    if (!title || !body) {
      return NextResponse.json({ error: "Title and body are required." }, { status: 400 });
    }

    const targetFlatNos = Array.isArray(input.targetFlatNos)
      ? input.targetFlatNos.map(Number).filter(Boolean)
      : [];
    const actor = String(input.actor || "MC user");
    const supabase = supabaseAdmin();
    const { data: notice, error } = await supabase.from("notices").insert({
      code: `n-${Date.now()}`,
      title,
      body,
      category: categoryMap[String(input.category || "general")] || "notice",
      visibility: "members",
      is_pinned: Boolean(input.pinned),
      published_at: input.date ? new Date(input.date).toISOString() : new Date().toISOString(),
      meta: {
        target_flat_nos: targetFlatNos,
        audience: targetFlatNos.length ? "selected_flats" : "all_members",
        actor
      }
    }).select("id,title").single();
    if (error) throw error;

    await supabase.from("activity_log").insert({
      actor_display: actor,
      action: "notice.published",
      target_table: "notices",
      target_id: notice.id,
      target_label: title,
      diff: {
        audience: targetFlatNos.length ? targetFlatNos : "all_members",
        pinned: Boolean(input.pinned)
      }
    });

    return NextResponse.json({ notice });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not publish notice." }, { status: 500 });
  }
}
