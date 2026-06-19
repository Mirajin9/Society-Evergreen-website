import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase-admin";

const BUCKET = "public-assets";
const INDEX_PATH = "gallery/index.json";

export async function GET() {
  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("gallery_items")
      .select("id,title,caption,category,event_date,image_name,mime_type,size_bytes,storage_bucket,storage_path,featured,published_at")
      .is("deleted_at", null)
      .lte("published_at", new Date().toISOString())
      .order("featured", { ascending: false })
      .order("event_date", { ascending: false })
      .order("published_at", { ascending: false });

    if (!error) {
      const tableItems = (data || []).map((item) => toPublicItem(supabase, item));
      const storageItems = await readStorageIndex(supabase);
      return NextResponse.json({ items: mergeGalleryItems(tableItems, storageItems) });
    }

    if (!isMissingGalleryTable(error)) throw error;
    return NextResponse.json({ items: await readStorageIndex(supabase) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load gallery." },
      { status: 500 }
    );
  }
}

function toPublicItem(supabase: ReturnType<typeof supabaseAdmin>, item: any) {
  const { data } = supabase.storage.from(item.storage_bucket || BUCKET).getPublicUrl(item.storage_path);
  return {
    id: item.id,
    title: item.title,
    caption: item.caption,
    category: item.category,
    eventDate: item.event_date,
    imageName: item.image_name,
    mimeType: item.mime_type,
    sizeBytes: item.size_bytes,
    imageUrl: data.publicUrl,
    featured: item.featured,
    publishedAt: item.published_at
  };
}

async function readStorageIndex(supabase: ReturnType<typeof supabaseAdmin>) {
  const { data, error } = await supabase.storage.from(BUCKET).download(INDEX_PATH);
  if (error || !data) return [];
  const text = await data.text();
  const parsed = JSON.parse(text) as { items?: unknown[] };
  return Array.isArray(parsed.items) ? parsed.items : [];
}

function mergeGalleryItems(tableItems: any[], storageItems: any[]) {
  const seen = new Set<string>();
  return [...tableItems, ...storageItems]
    .filter((item) => {
      const key = item.id || item.imageUrl;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return new Date(b.eventDate || b.publishedAt).getTime() - new Date(a.eventDate || a.publishedAt).getTime();
    });
}

function isMissingGalleryTable(error: { code?: string; message?: string }) {
  return error.code === "42P01" || /gallery_items/i.test(error.message || "");
}
