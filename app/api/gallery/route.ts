import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase-admin";
import {
  GALLERY_BUCKET as BUCKET,
  GALLERY_INDEX_PATH as INDEX_PATH,
  type GalleryItem,
  withImages,
  sortGalleryItems,
  isMissingGalleryTable
} from "@/app/lib/gallery";

type Supabase = ReturnType<typeof supabaseAdmin>;

export async function GET() {
  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("gallery_items")
      .select("id,title,caption,category,event_date,storage_bucket,storage_path,featured,published_at,meta")
      .is("deleted_at", null)
      .lte("published_at", new Date().toISOString())
      .order("featured", { ascending: false })
      .order("event_date", { ascending: false })
      .order("published_at", { ascending: false });

    if (!error) {
      const tableItems = (data || []).map((item) => rowToItem(supabase, item));
      const storageItems = await readStorageIndex(supabase);
      return NextResponse.json({ items: mergeGalleryItems(tableItems, storageItems) });
    }

    if (!isMissingGalleryTable(error)) throw error;
    return NextResponse.json({ items: (await readStorageIndex(supabase)).sort(sortGalleryItems) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load gallery." },
      { status: 500 }
    );
  }
}

function rowToItem(supabase: Supabase, item: any): GalleryItem {
  const coverUrl = item.storage_path
    ? supabase.storage.from(item.storage_bucket || BUCKET).getPublicUrl(item.storage_path).data.publicUrl
    : "";
  return withImages({
    id: item.id,
    title: item.title,
    caption: item.caption,
    category: item.category,
    eventDate: item.event_date,
    featured: item.featured,
    publishedAt: item.published_at,
    imageUrl: coverUrl,
    storagePath: item.storage_path,
    images: item.meta?.images
  });
}

async function readStorageIndex(supabase: Supabase): Promise<GalleryItem[]> {
  const { data, error } = await supabase.storage.from(BUCKET).download(INDEX_PATH);
  if (error || !data) return [];
  try {
    const parsed = JSON.parse(await data.text()) as { items?: unknown[] };
    return Array.isArray(parsed.items) ? parsed.items.map(withImages) : [];
  } catch {
    return [];
  }
}

function mergeGalleryItems(tableItems: GalleryItem[], storageItems: GalleryItem[]) {
  const seen = new Set<string>();
  return [...tableItems, ...storageItems]
    .filter((item) => {
      const key = item.id || item.imageUrl;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort(sortGalleryItems);
}
