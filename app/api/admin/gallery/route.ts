import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase-admin";

export const runtime = "nodejs";

const BUCKET = "public-assets";
const INDEX_PATH = "gallery/index.json";
const CATEGORIES = new Set(["activities", "visits", "celebrations", "maintenance", "community"]);
const MAX_IMAGE_SIZE = 8_000_000;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("image") as File | null;
    const title = String(form.get("title") || "").trim();
    const caption = String(form.get("caption") || "").trim();
    const rawCategory = String(form.get("category") || "activities");
    const category = CATEGORIES.has(rawCategory) ? rawCategory : "activities";
    const eventDate = String(form.get("eventDate") || new Date().toISOString().slice(0, 10));
    const featured = form.get("featured") === "on" || form.get("featured") === "true";
    const actor = String(form.get("actor") || "MC user").slice(0, 120);

    if (!title || !caption) {
      return NextResponse.json({ error: "Add both a title and caption." }, { status: 400 });
    }
    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Gallery uploads must be image files." }, { status: 400 });
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: "Keep gallery images and GIFs below 8 MB." }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    await ensurePublicAssetsBucket(supabase);

    const storagePath = `gallery/${Date.now()}-${slug(file.name)}${extension(file.name)}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const upload = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, bytes, { contentType: file.type || "image/jpeg", upsert: false });
    if (upload.error) throw upload.error;

    const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    const payload = {
      title,
      caption,
      category,
      event_date: eventDate,
      image_name: file.name,
      mime_type: file.type || "image/jpeg",
      size_bytes: file.size,
      storage_bucket: BUCKET,
      storage_path: storagePath,
      featured,
      meta: { uploaded_from: "mc_gallery", actor }
    };

    const { data: row, error } = await supabase
      .from("gallery_items")
      .insert(payload)
      .select("id,title,caption,category,event_date,image_name,mime_type,size_bytes,storage_path,featured,published_at")
      .single();

    if (!error) {
      return NextResponse.json({ item: toPublicItem(row, publicUrl.publicUrl) });
    }

    if (!isMissingGalleryTable(error)) throw error;
    const item = await appendStorageIndex(supabase, {
      id: `gal-${Date.now()}`,
      title,
      caption,
      category,
      eventDate,
      imageName: file.name,
      mimeType: file.type || "image/jpeg",
      sizeBytes: file.size,
      imageUrl: publicUrl.publicUrl,
      storagePath,
      featured,
      publishedAt: new Date().toISOString()
    });
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not publish gallery image." },
      { status: 500 }
    );
  }
}

function toPublicItem(item: any, imageUrl: string) {
  return {
    id: item.id,
    title: item.title,
    caption: item.caption,
    category: item.category,
    eventDate: item.event_date,
    imageName: item.image_name,
    mimeType: item.mime_type,
    sizeBytes: item.size_bytes,
    imageUrl,
    featured: item.featured,
    publishedAt: item.published_at
  };
}

async function ensurePublicAssetsBucket(supabase: ReturnType<typeof supabaseAdmin>) {
  const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
  if (error && !/already exists/i.test(error.message)) throw error;
}

async function appendStorageIndex(supabase: ReturnType<typeof supabaseAdmin>, item: any) {
  let items: any[] = [];
  const existing = await supabase.storage.from(BUCKET).download(INDEX_PATH);
  if (existing.data && !existing.error) {
    try {
      const parsed = JSON.parse(await existing.data.text()) as { items?: any[] };
      items = Array.isArray(parsed.items) ? parsed.items : [];
    } catch {
      items = [];
    }
  }
  const nextItems = [item, ...items].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
  });
  const index = new Blob([JSON.stringify({ items: nextItems }, null, 2)], { type: "application/json" });
  const upload = await supabase.storage.from(BUCKET).upload(INDEX_PATH, index, {
    contentType: "application/json",
    upsert: true
  });
  if (upload.error) throw upload.error;
  return item;
}

function isMissingGalleryTable(error: { code?: string; message?: string }) {
  return error.code === "42P01" || /gallery_items/i.test(error.message || "");
}

function slug(value: string) {
  return value.toLowerCase().replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "image";
}

function extension(value: string) {
  const match = value.match(/\.[a-z0-9]+$/i);
  return match?.[0].toLowerCase() || "";
}
