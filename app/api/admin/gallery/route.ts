import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase-admin";
import {
  GALLERY_BUCKET as BUCKET,
  GALLERY_INDEX_PATH as INDEX_PATH,
  GALLERY_CATEGORIES as CATEGORIES,
  MAX_IMAGE_SIZE,
  MAX_IMAGES_PER_POST,
  type GalleryImage,
  type GalleryItem,
  withImages,
  sortGalleryItems,
  isMissingGalleryTable
} from "@/app/lib/gallery";
import {
  appendFileGalleryItem,
  readFileGalleryIndex,
  removeFileGalleryImages,
  saveFileGalleryImages,
  writeFileGalleryIndex
} from "@/app/lib/gallery-file-store";

export const runtime = "nodejs";

type Supabase = ReturnType<typeof supabaseAdmin>;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const title = String(form.get("title") || "").trim();
    const caption = String(form.get("caption") || "").trim();
    const rawCategory = String(form.get("category") || "activities");
    const category = CATEGORIES.has(rawCategory) ? rawCategory : "activities";
    const eventDate = String(form.get("eventDate") || new Date().toISOString().slice(0, 10));
    const featured = form.get("featured") === "on" || form.get("featured") === "true";
    const actor = String(form.get("actor") || "MC user").slice(0, 120);

    // Accept multiple files (name="images") and a single legacy file (name="image").
    const files = [...form.getAll("images"), form.get("image")].filter(
      (entry): entry is File => entry instanceof File && entry.size > 0
    );

    if (!title || !caption) {
      return NextResponse.json({ error: "Add both a title and caption." }, { status: 400 });
    }
    if (files.length === 0) {
      return NextResponse.json({ error: "Choose at least one image to upload." }, { status: 400 });
    }
    if (files.length > MAX_IMAGES_PER_POST) {
      return NextResponse.json(
        { error: `Add up to ${MAX_IMAGES_PER_POST} images per post.` },
        { status: 400 }
      );
    }
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        return NextResponse.json({ error: "Gallery uploads must be image files." }, { status: 400 });
      }
      if (file.size > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: "Keep each image or GIF below 8 MB." }, { status: 400 });
      }
    }

    try {
      return NextResponse.json({
        item: await publishToSupabase({ title, caption, category, eventDate, featured, actor, files })
      });
    } catch (supabaseError) {
      const item = await publishToFileGallery({ title, caption, category, eventDate, featured, actor, files });
      return NextResponse.json({
        item,
        warning: errorMessage(supabaseError) || "Supabase gallery unavailable; stored in Hostinger file gallery."
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: errorMessage(error) || "Could not publish gallery image." },
      { status: 500 }
    );
  }
}

// Delete a whole post (body: { id }) or a single image within a post
// (body: { id, storagePath }). Removes the underlying storage object(s) too.
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const id = String(body?.id || "").trim();
    const storagePath = body?.storagePath ? String(body.storagePath) : null;
    if (!id) {
      return NextResponse.json({ error: "Missing post id." }, { status: 400 });
    }

    const fileItems = await readFileGalleryIndex();
    const fileTarget = fileItems.find((entry) => entry.id === id);
    if (fileTarget) {
      const result = applyDelete(fileTarget, storagePath);
      await removeFileGalleryImages(result.removedPaths);
      const nextItems = result.item
        ? fileItems.map((entry) => (entry.id === id ? result.item! : entry))
        : fileItems.filter((entry) => entry.id !== id);
      await writeFileGalleryIndex(nextItems.sort(sortGalleryItems));
      return NextResponse.json({ item: result.item, deleted: !result.item });
    }

    const supabase = supabaseAdmin();

    // Try the table first; fall back to the storage index when it isn't present
    // or the post lives only in the index (legacy gal-* ids).
    let row: any = null;
    if (!id.startsWith("gal-")) {
      const lookup = await supabase
        .from("gallery_items")
        .select("id,title,caption,category,event_date,featured,published_at,storage_path,meta")
        .eq("id", id)
        .maybeSingle();
      if (lookup.error && !isMissingGalleryTable(lookup.error)) throw lookup.error;
      row = lookup.data;
    }

    if (row) {
      const item = rowToItem(row);
      const result = applyDelete(item, storagePath);
      await removeStorageObjects(supabase, result.removedPaths);
      if (result.item) {
        const { error } = await supabase
          .from("gallery_items")
          .update({
            storage_path: result.item.storagePath,
            image_name: result.item.imageName,
            mime_type: result.item.mimeType,
            size_bytes: result.item.sizeBytes,
            meta: { ...(row.meta || {}), images: result.item.images }
          })
          .eq("id", id);
        if (error) throw error;
        return NextResponse.json({ item: result.item, deleted: false });
      }
      const { error } = await supabase.from("gallery_items").delete().eq("id", id);
      if (error) throw error;
      return NextResponse.json({ deleted: true });
    }

    // Storage index path.
    const items = await readStorageIndex(supabase);
    const target = items.find((entry) => entry.id === id);
    if (!target) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }
    const result = applyDelete(target, storagePath);
    await removeStorageObjects(supabase, result.removedPaths);
    const nextItems = result.item
      ? items.map((entry) => (entry.id === id ? result.item! : entry))
      : items.filter((entry) => entry.id !== id);
    await writeStorageIndex(supabase, nextItems.sort(sortGalleryItems));
    return NextResponse.json({ item: result.item, deleted: !result.item });
  } catch (error) {
    return NextResponse.json(
      { error: errorMessage(error) || "Could not delete gallery post." },
      { status: 500 }
    );
  }
}

// Returns the updated item (or null when the whole post should be removed) plus
// the storage paths that need deleting.
function applyDelete(item: GalleryItem, storagePath: string | null) {
  if (!storagePath) {
    const removedPaths = item.images.map((img) => img.storagePath).filter(Boolean);
    return { item: null as GalleryItem | null, removedPaths };
  }
  const remaining = item.images.filter((img) => img.storagePath !== storagePath);
  if (remaining.length === 0) {
    const removedPaths = item.images.map((img) => img.storagePath).filter(Boolean);
    return { item: null as GalleryItem | null, removedPaths };
  }
  if (remaining.length === item.images.length) {
    // Nothing matched; leave the post untouched.
    return { item, removedPaths: [] as string[] };
  }
  return { item: withImages({ ...item, images: remaining }), removedPaths: [storagePath] };
}

async function publishToSupabase(input: {
  title: string;
  caption: string;
  category: string;
  eventDate: string;
  featured: boolean;
  actor: string;
  files: File[];
}) {
  const supabase = supabaseAdmin();
  await ensurePublicAssetsBucket(supabase);

  const images: GalleryImage[] = [];
  for (const file of input.files) {
    images.push(await uploadImage(supabase, file));
  }
  const cover = images[0];

  const payload = {
    title: input.title,
    caption: input.caption,
    category: input.category,
    event_date: input.eventDate,
    image_name: cover.imageName,
    mime_type: cover.mimeType,
    size_bytes: cover.sizeBytes,
    storage_bucket: BUCKET,
    storage_path: cover.storagePath,
    featured: input.featured,
    meta: { uploaded_from: "mc_gallery", actor: input.actor, images }
  };

  const { data: row, error } = await supabase
    .from("gallery_items")
    .insert(payload)
    .select("id,title,caption,category,event_date,featured,published_at,meta")
    .single();

  if (!error) return rowToItem(row);

  if (!isMissingGalleryTable(error)) throw error;

  const item = withImages({
    id: `gal-${Date.now()}`,
    title: input.title,
    caption: input.caption,
    category: input.category,
    eventDate: input.eventDate,
    featured: input.featured,
    publishedAt: new Date().toISOString(),
    images
  });
  await writeStorageIndex(supabase, [item, ...(await readStorageIndex(supabase))].sort(sortGalleryItems));
  return item;
}

async function publishToFileGallery(input: {
  title: string;
  caption: string;
  category: string;
  eventDate: string;
  featured: boolean;
  actor: string;
  files: File[];
}) {
  const images = await saveFileGalleryImages(input.files);
  const item = withImages({
    id: `hostinger-${Date.now()}`,
    title: input.title,
    caption: input.caption,
    category: input.category,
    eventDate: input.eventDate,
    featured: input.featured,
    publishedAt: new Date().toISOString(),
    images
  });
  await appendFileGalleryItem(item);
  return item;
}

async function uploadImage(supabase: Supabase, file: File): Promise<GalleryImage> {
  const storagePath = `gallery/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${slug(file.name)}${extension(file.name)}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const upload = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, bytes, { contentType: file.type || "image/jpeg", upsert: false });
  if (upload.error) throw upload.error;
  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return {
    imageUrl: publicUrl.publicUrl,
    storagePath,
    imageName: file.name,
    mimeType: file.type || "image/jpeg",
    sizeBytes: file.size
  };
}

function rowToItem(row: any): GalleryItem {
  return withImages({
    id: row.id,
    title: row.title,
    caption: row.caption,
    category: row.category,
    eventDate: row.event_date,
    featured: row.featured,
    publishedAt: row.published_at,
    images: row.meta?.images
  });
}

async function ensurePublicAssetsBucket(supabase: Supabase) {
  const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
  if (error && !/already exists/i.test(error.message)) throw error;
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

async function writeStorageIndex(supabase: Supabase, items: GalleryItem[]) {
  const index = new Blob([JSON.stringify({ items }, null, 2)], { type: "application/json" });
  const upload = await supabase.storage.from(BUCKET).upload(INDEX_PATH, index, {
    contentType: "application/json",
    upsert: true
  });
  if (upload.error) throw upload.error;
}

async function removeStorageObjects(supabase: Supabase, paths: string[]) {
  const clean = paths.filter(Boolean);
  if (clean.length === 0) return;
  // Best-effort: a failed object removal should not block index/table updates.
  await supabase.storage.from(BUCKET).remove(clean).catch(() => undefined);
}

function slug(value: string) {
  return value.toLowerCase().replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "image";
}

function extension(value: string) {
  const match = value.match(/\.[a-z0-9]+$/i);
  return match?.[0].toLowerCase() || "";
}

function errorMessage(error: unknown) {
  if (!error) return "";
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message || "");
  }
  return String(error);
}
