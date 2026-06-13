import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase-admin";

export const runtime = "nodejs";

const categoryMap: Record<string, string> = {
  agm: "agm",
  mc: "mc_resolution",
  share_certificates: "share_certificates",
  finance: "audit",
  notices: "notice",
  elections: "election",
  vehicles: "vehicles",
  forms: "form"
};

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
    }

    const title = String(form.get("title") || file.name).trim();
    const category = String(form.get("category") || "forms");
    const visibility = String(form.get("visibility") || "members");
    const description = String(form.get("description") || "");
    const actor = String(form.get("actor") || "MC user");
    const code = `mc-${Date.now()}-${slug(file.name)}`;
    const storagePath = `${category}/${Date.now()}-${slug(file.name)}${extension(file.name)}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const supabase = supabaseAdmin();

    const upload = await supabase.storage
      .from("documents")
      .upload(storagePath, bytes, { contentType: file.type || "application/octet-stream", upsert: false });
    if (upload.error) throw upload.error;

    const { data: document, error } = await supabase.from("documents").insert({
      code,
      title,
      description,
      category: categoryMap[category] || "other",
      visibility,
      storage_bucket: "documents",
      storage_path: storagePath,
      size_bytes: file.size,
      mime_type: file.type || "application/octet-stream",
      document_date: new Date().toISOString().slice(0, 10),
      is_published: true,
      meta: { uploaded_from: "mc_portal", actor }
    }).select("id,title,storage_path").single();
    if (error) throw error;

    await supabase.from("activity_log").insert({
      actor_display: actor,
      action: "document.uploaded",
      target_table: "documents",
      target_id: document.id,
      target_label: title,
      diff: { category, visibility, storage_path: storagePath }
    });

    return NextResponse.json({ document });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed." }, { status: 500 });
  }
}

function slug(value: string) {
  return value.toLowerCase().replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function extension(value: string) {
  const match = value.match(/\.[a-z0-9]+$/i);
  return match?.[0].toLowerCase() || "";
}
