import { existsSync } from "node:fs";
import { join } from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { noStore, requireAccount } from "@/app/lib/auth/request";
import {
  ensureGalleryMigrated,
  fileNameFromStoragePath,
  galleryDir,
  galleryMigrationStatus,
  readFileGalleryIndex
} from "@/app/lib/gallery-file-store";
import { dataPath, storageInfo } from "@/app/lib/server/data-dir";
import { portalCounts } from "@/app/lib/server/portal-store";

export const runtime = "nodejs";

// Post-deploy check: is saved data outside the app folder, and is every gallery photo present?
// Folder paths are only shown to a signed-in MC account.
export async function GET(req: NextRequest) {
  await ensureGalleryMigrated();
  const info = storageInfo();
  const items = await readFileGalleryIndex();
  const photos = items.flatMap((item) => item.images);
  const missingPhotos = photos.filter((image) => {
    const name = fileNameFromStoragePath(image.storagePath);
    return name ? !existsSync(join(galleryDir(), name)) : false;
  }).length;
  const portal = await portalCounts().catch(() => null);
  const isAdmin = await requireAccount(req, { admin: true }).then(() => true, () => false);

  return noStore(NextResponse.json({
    ok: info.persistent && missingPhotos === 0,
    storage: {
      persistent: info.persistent,
      location: info.source,
      ...(isAdmin ? { dir: info.dir, domainRoot: info.domainRoot, galleryMigration: galleryMigrationStatus() } : {})
    },
    gallery: { posts: items.length, photos: photos.length, missingPhotos },
    logins: { ready: existsSync(dataPath("auth", "accounts.json")) },
    portal
  }));
}
