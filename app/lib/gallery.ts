// Shared gallery shapes + helpers used by both the public read route and the
// admin write/delete route. A "post" can now hold multiple images. Older posts
// stored only a single cover image, so `withImages` synthesizes an `images`
// array from the cover fields to keep everything backward compatible.

export const GALLERY_BUCKET = "public-assets";
export const GALLERY_INDEX_PATH = "gallery/index.json";
export const GALLERY_CATEGORIES = new Set([
  "activities",
  "visits",
  "celebrations",
  "maintenance",
  "community"
]);
export const MAX_IMAGE_SIZE = 8_000_000;
export const MAX_IMAGES_PER_POST = 12;

export interface GalleryImage {
  imageUrl: string;
  storagePath: string;
  imageName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface GalleryItem {
  id: string;
  title: string;
  caption: string;
  category: string;
  eventDate: string;
  featured: boolean;
  publishedAt: string;
  // Cover fields mirror images[0] for backward compatibility.
  imageName: string;
  mimeType: string;
  sizeBytes: number;
  imageUrl: string;
  storagePath: string;
  images: GalleryImage[];
}

// Guarantee a non-empty `images` array and keep the cover fields in sync with
// images[0]. Accepts both new multi-image items and legacy single-image items.
export function withImages(raw: any): GalleryItem {
  const fromArray: GalleryImage[] = Array.isArray(raw?.images)
    ? raw.images
        .filter((img: any) => img && img.imageUrl)
        .map((img: any) => ({
          imageUrl: String(img.imageUrl),
          storagePath: String(img.storagePath || ""),
          imageName: String(img.imageName || "image"),
          mimeType: String(img.mimeType || "image/jpeg"),
          sizeBytes: Number(img.sizeBytes || 0)
        }))
    : [];

  const images = fromArray.length
    ? fromArray
    : [
        {
          imageUrl: String(raw?.imageUrl || ""),
          storagePath: String(raw?.storagePath || ""),
          imageName: String(raw?.imageName || "image"),
          mimeType: String(raw?.mimeType || "image/jpeg"),
          sizeBytes: Number(raw?.sizeBytes || 0)
        }
      ];

  const cover = images[0];
  return {
    id: String(raw?.id || ""),
    title: String(raw?.title || ""),
    caption: String(raw?.caption || ""),
    category: String(raw?.category || "activities"),
    eventDate: String(raw?.eventDate || raw?.event_date || ""),
    featured: Boolean(raw?.featured),
    publishedAt: String(raw?.publishedAt || raw?.published_at || ""),
    imageName: cover.imageName,
    mimeType: cover.mimeType,
    sizeBytes: cover.sizeBytes,
    imageUrl: cover.imageUrl,
    storagePath: cover.storagePath,
    images
  };
}

export function sortGalleryItems(a: GalleryItem, b: GalleryItem) {
  if (a.featured !== b.featured) return a.featured ? -1 : 1;
  const aTime = new Date(a.eventDate || a.publishedAt).getTime();
  const bTime = new Date(b.eventDate || b.publishedAt).getTime();
  return bTime - aTime;
}

export function isMissingGalleryTable(error: { code?: string; message?: string }) {
  return error.code === "42P01" || /gallery_items/i.test(error.message || "");
}
