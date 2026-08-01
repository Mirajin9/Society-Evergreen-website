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
import { readFileGalleryIndex } from "@/app/lib/gallery-file-store";

type Supabase = ReturnType<typeof supabaseAdmin>;

export const runtime = "nodejs";

export async function GET() {
  let supabaseError: unknown = null;
  try {
    const supabase = supabaseAdmin();
    const tableItems = await readTableItems(supabase);
    const storageItems = await readStorageIndex(supabase);
    const fileItems = await readFileGalleryIndex();
    return NextResponse.json({ items: mergeGalleryItems(tableItems, storageItems, fileItems) });
  } catch (error) {
    supabaseError = error;
  }

  const fileItems = await readFileGalleryIndex();
  return NextResponse.json({
    items: fileItems,
    warning: errorMessage(supabaseError) || "Supabase gallery unavailable; using Hostinger file gallery."
  });
}

async function readTableItems(supabase: Supabase): Promise<GalleryItem[]> {
  const query = supabase
    .from("gallery_items")
    .select("id,title,caption,category,event_date,storage_bucket,storage_path,featured,published_at,meta")
    .is("deleted_at", null)
    .lte("published_at", new Date().toISOString())
    .order("featured", { ascending: false })
    .order("event_date", { ascending: false })
    .order("published_at", { ascending: false });

  const { data, error } = await query;
  if (!error) return (data || []).map((item) => rowToItem(supabase, item));

  if (isMissingGalleryTable(error)) return [];

  if (isMissingColumn(error, "deleted_at")) {
    const fallback = await supabase
      .from("gallery_items")
      .select("id,title,caption,category,event_date,storage_bucket,storage_path,featured,published_at,meta")
      .lte("published_at", new Date().toISOString())
      .order("featured", { ascending: false })
      .order("event_date", { ascending: false })
      .order("published_at", { ascending: false });
    if (fallback.error) throw fallback.error;
    return (fallback.data || []).map((item) => rowToItem(supabase, item));
  }

  throw error;
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

function mergeGalleryItems(...sources: GalleryItem[][]) {
  const seen = new Set<string>();
  return sources.flat()
    .filter((item) => {
      const key = item.id || item.imageUrl;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort(sortGalleryItems);
}

function isMissingColumn(error: { code?: string; message?: string }, column: string) {
  return error.code === "42703" || new RegExp(column, "i").test(error.message || "");
}

function errorMessage(error: unknown) {
  if (!error) return "";
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message || "");
  }
  return String(error);
}
