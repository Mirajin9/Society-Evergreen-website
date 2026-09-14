import { mkdirSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve, sep } from "node:path";

export type StorageSource = "env" | "domain-root" | "home" | "app-folder";

export interface StorageInfo {
  dir: string;
  source: StorageSource;
  // False only on Hostinger when nothing outside the app folder was writable,
  // because deploys replace the app folder and would wipe the data.
  persistent: boolean;
  domainRoot: string | null;
}

// Folders Hostinger manages and replaces on deploy; saved data must never live inside them.
const BUILD_FOLDERS = new Set([".builds", "hbuilds"]);

let cached: StorageInfo | null = null;

// Everything the site saves at runtime (gallery photos, logins, notices, documents) lives
// here. On Hostinger that is ~/domains/<domain>/evergreen-data, beside nodejs/ and
// public_html/, so GitHub pushes and redeploys never touch it.
export function storageInfo(): StorageInfo {
  if (cached) return cached;
  const appRoot = process.cwd();
  const domainRoot = findDomainRoot(appRoot);
  const fromEnv = process.env.DATA_DIR?.trim();

  if (fromEnv) {
    cached = { dir: resolve(/*turbopackIgnore: true*/ fromEnv), source: "env", persistent: true, domainRoot };
  } else if (domainRoot && isWritableDir(join(domainRoot, "evergreen-data"))) {
    cached = { dir: join(domainRoot, "evergreen-data"), source: "domain-root", persistent: true, domainRoot };
  } else if (domainRoot && isWritableDir(join(homedir(), "evergreen-data", basename(domainRoot)))) {
    cached = { dir: join(homedir(), "evergreen-data", basename(domainRoot)), source: "home", persistent: true, domainRoot };
  } else {
    // Local development (no public_html beside the app) keeps using the git-ignored uploads/ folder.
    cached = { dir: join(/*turbopackIgnore: true*/ appRoot, "uploads"), source: "app-folder", persistent: !domainRoot, domainRoot };
  }
  return cached;
}

export function dataPath(...parts: string[]) {
  return join(storageInfo().dir, ...parts);
}

// Hostinger keeps each site in ~/domains/<domain>/ with public_html beside the app folder.
function findDomainRoot(start: string): string | null {
  let dir = resolve(/*turbopackIgnore: true*/ start);
  for (let depth = 0; depth < 10; depth++) {
    const insideBuildFolder = dir.split(sep).some((segment) => BUILD_FOLDERS.has(segment));
    if (!insideBuildFolder && isDirectory(join(dir, "public_html"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

function isDirectory(path: string) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function isWritableDir(dir: string) {
  try {
    mkdirSync(dir, { recursive: true });
    const probe = join(dir, `.write-test-${process.pid}`);
    writeFileSync(probe, "ok");
    unlinkSync(probe);
    return true;
  } catch {
    return false;
  }
}
