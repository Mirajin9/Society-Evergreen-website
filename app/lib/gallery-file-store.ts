import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import {
  type GalleryImage,
  type GalleryItem,
  withImages,
  sortGalleryItems
} from "@/app/lib/gallery";

const GALLERY_DIR = join(/*turbopackIgnore: true*/ process.cwd(), "uploads", "gallery");
const INDEX_PATH = join(GALLERY_DIR, "index.json");
const LOCAL_PREFIX = "hostinger:";

export async function readFileGalleryIndex(): Promise<GalleryItem[]> {
  try {
    const raw = await readFile(INDEX_PATH, "utf8");
    const parsed = JSON.parse(raw) as { items?: unknown[] };
    return Array.isArray(parsed.items) ? parsed.items.map(withImages).sort(sortGalleryItems) : [];
  } catch {
    return [];
  }
}

export async function appendFileGalleryItem(item: GalleryItem) {
  const items = [item, ...(await readFileGalleryIndex())].sort(sortGalleryItems);
  await writeFileGalleryIndex(items);
}

export async function writeFileGalleryIndex(items: GalleryItem[]) {
  await mkdir(GALLERY_DIR, { recursive: true });
  await writeFile(INDEX_PATH, JSON.stringify({ items: items.sort(sortGalleryItems) }, null, 2), "utf8");
}

export async function saveFileGalleryImages(files: File[]): Promise<GalleryImage[]> {
  await mkdir(GALLERY_DIR, { recursive: true });
  const images: GalleryImage[] = [];
  for (const file of files) {
    const fileName = `${Date.now()}-${randomUUID().slice(0, 8)}-${slug(file.name)}${extension(file.name)}`;
    const filePath = join(GALLERY_DIR, fileName);
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, bytes);
    images.push({
      imageUrl: `/api/gallery/assets/${encodeURIComponent(fileName)}`,
      storagePath: `${LOCAL_PREFIX}${fileName}`,
      imageName: file.name,
      mimeType: file.type || mimeTypeFromName(file.name),
      sizeBytes: file.size
    });
  }
  return images;
}

export async function removeFileGalleryImages(paths: string[]) {
  for (const path of paths) {
    const fileName = fileNameFromStoragePath(path);
    if (!fileName) continue;
    const filePath = join(GALLERY_DIR, fileName);
    if (existsSync(filePath)) {
      await unlink(filePath).catch(() => undefined);
    }
  }
}

export function fileNameFromStoragePath(path: string) {
  if (!path.startsWith(LOCAL_PREFIX)) return null;
  const fileName = path.slice(LOCAL_PREFIX.length);
  return /^[a-zA-Z0-9._-]+$/.test(fileName) ? fileName : null;
}

export function localGalleryFilePath(fileName: string) {
  if (!/^[a-zA-Z0-9._-]+$/.test(fileName)) return null;
  return join(GALLERY_DIR, fileName);
}

function slug(value: string) {
  return value.toLowerCase().replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "image";
}

function extension(value: string) {
  const match = value.match(/\.[a-z0-9]+$/i);
  return match?.[0].toLowerCase() || ".jpg";
}

function mimeTypeFromName(value: string) {
  if (/\.png$/i.test(value)) return "image/png";
  if (/\.webp$/i.test(value)) return "image/webp";
  if (/\.gif$/i.test(value)) return "image/gif";
  return "image/jpeg";
}
