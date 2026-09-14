import { copyFile, mkdir, readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import {
  type GalleryImage,
  type GalleryItem,
  withImages,
  sortGalleryItems
} from "@/app/lib/gallery";
import { dataPath, storageInfo } from "@/app/lib/server/data-dir";

const LOCAL_PREFIX = "hostinger:";
const SKIP_WHILE_SEARCHING = new Set(["node_modules", ".next", ".git"]);

// Galleries recovered from Hostinger backups and committed to the repo. Each is merged into
// the data folder once; a marker file then stops posts the MC later deletes from coming back.
const BUNDLED_RESTORES = [
  { id: "backup-2026-09-13", dir: "restore/gallery-2026-09-13" }
];

export const galleryDir = () => dataPath("gallery");
const indexPath = () => join(galleryDir(), "index.json");

interface GalleryMigration {
  copiedFrom: string;
  posts: number;
  at: string;
}

let migration: Promise<void> | null = null;
let legacyCopy: GalleryMigration | null = null;
const bundledRestores: GalleryMigration[] = [];

export function galleryMigrationStatus() {
  return { legacyCopy, bundledRestores };
}

// Earlier builds saved the gallery inside the app folder, which Hostinger replaces on deploy.
// The first time this build touches the gallery, bring any surviving or backed-up posts into
// the persistent data folder. Every write below waits for this, so nothing races it.
export function ensureGalleryMigrated(): Promise<void> {
  migration ??= migrateLegacyGallery()
    .then(restoreBundledGalleries)
    .catch((error) => {
      migration = null;
      console.error("[gallery] could not copy the existing gallery", error);
    });
  return migration;
}

export async function readFileGalleryIndex(): Promise<GalleryItem[]> {
  await ensureGalleryMigrated();
  try {
    return await readIndexFile();
  } catch {
    return [];
  }
}

export async function appendFileGalleryItem(item: GalleryItem) {
  const items = [item, ...(await readFileGalleryIndex())].sort(sortGalleryItems);
  await writeFileGalleryIndex(items);
}

export async function writeFileGalleryIndex(items: GalleryItem[]) {
  await ensureGalleryMigrated();
  await writeIndexFile(items);
}

export async function saveFileGalleryImages(files: File[]): Promise<GalleryImage[]> {
  await ensureGalleryMigrated();
  await mkdir(galleryDir(), { recursive: true });
  const images: GalleryImage[] = [];
  for (const file of files) {
    const fileName = `${Date.now()}-${randomUUID().slice(0, 8)}-${slug(file.name)}${extension(file.name)}`;
    const filePath = join(galleryDir(), fileName);
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
    const filePath = join(galleryDir(), fileName);
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
  return join(galleryDir(), fileName);
}

// Throws on a damaged index (only a missing file counts as empty), so a merge never
// silently replaces posts it couldn't read.
async function readIndexFile(): Promise<GalleryItem[]> {
  let raw: string;
  try {
    raw = await readFile(indexPath(), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  const parsed = JSON.parse(raw) as { items?: unknown[] };
  return Array.isArray(parsed.items) ? parsed.items.map(withImages).sort(sortGalleryItems) : [];
}

async function writeIndexFile(items: GalleryItem[]) {
  await mkdir(galleryDir(), { recursive: true });
  const tmp = `${indexPath()}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, JSON.stringify({ items: [...items].sort(sortGalleryItems) }, null, 2), "utf8");
  await copyFile(tmp, indexPath());
  await unlink(tmp).catch(() => undefined);
}

async function migrateLegacyGallery() {
  const target = galleryDir();
  if (existsSync(join(target, "index.json"))) return;
  const source = await findLegacyGallery(target);
  if (!source) return;

  await mkdir(target, { recursive: true });
  for (const name of await readdir(source.dir)) {
    if (name === "index.json" || !/^[a-zA-Z0-9._-]+$/.test(name)) continue;
    if (!existsSync(join(target, name))) await copyFile(join(source.dir, name), join(target, name));
  }
  await copyFile(join(source.dir, "index.json"), join(target, "index.json"));
  legacyCopy = { copiedFrom: source.dir, posts: source.posts, at: new Date().toISOString() };
  console.info(`[gallery] copied ${source.posts} post(s) from ${source.dir} to ${target}`);
}

async function restoreBundledGalleries() {
  for (const bundle of BUNDLED_RESTORES) {
    const marker = join(galleryDir(), `.restored-${bundle.id}`);
    if (existsSync(marker)) continue;
    const source = join(/*turbopackIgnore: true*/ process.cwd(), bundle.dir);
    if (!existsSync(join(source, "index.json"))) continue;

    const parsed = JSON.parse(await readFile(join(source, "index.json"), "utf8")) as { items?: unknown[] };
    const bundled = Array.isArray(parsed.items) ? parsed.items.map(withImages) : [];
    const current = await readIndexFile();
    const known = new Set(current.map((item) => item.id));
    const missing = bundled.filter((item) => !known.has(item.id));

    await mkdir(galleryDir(), { recursive: true });
    for (const image of missing.flatMap((item) => item.images)) {
      const name = fileNameFromStoragePath(image.storagePath);
      if (!name || existsSync(join(galleryDir(), name)) || !existsSync(join(source, name))) continue;
      await copyFile(join(source, name), join(galleryDir(), name));
    }
    if (missing.length) await writeIndexFile([...current, ...missing]);
    await writeFile(marker, new Date().toISOString(), "utf8");
    bundledRestores.push({ copiedFrom: bundle.dir, posts: missing.length, at: new Date().toISOString() });
    console.info(`[gallery] restored ${missing.length} post(s) from ${bundle.dir}`);
  }
}

async function findLegacyGallery(target: string) {
  const { domainRoot } = storageInfo();
  const candidates = new Set<string>([join(/*turbopackIgnore: true*/ process.cwd(), "uploads", "gallery")]);
  if (domainRoot) {
    candidates.add(join(domainRoot, "nodejs", "uploads", "gallery"));
    for (const buildFolder of [".builds", "hbuilds"]) {
      await collectUploadGalleries(join(domainRoot, buildFolder), 0, candidates);
    }
  }

  // Prefer the most recently written gallery: that is the one the live site was using.
  let best: { dir: string; posts: number; modified: number } | null = null;
  for (const dir of candidates) {
    if (resolve(dir) === resolve(target)) continue;
    try {
      const file = join(dir, "index.json");
      const parsed = JSON.parse(await readFile(file, "utf8")) as { items?: unknown[] };
      const posts = Array.isArray(parsed.items) ? parsed.items.length : 0;
      const modified = (await stat(file)).mtimeMs;
      if (posts > 0 && (!best || modified > best.modified)) best = { dir, posts, modified };
    } catch {
      // Not a gallery folder.
    }
  }
  return best;
}

async function collectUploadGalleries(dir: string, depth: number, out: Set<string>) {
  if (depth > 6) return;
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || SKIP_WHILE_SEARCHING.has(entry.name)) continue;
    const child = join(dir, entry.name);
    if (entry.name === "uploads") out.add(join(child, "gallery"));
    else await collectUploadGalleries(child, depth + 1, out);
  }
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
