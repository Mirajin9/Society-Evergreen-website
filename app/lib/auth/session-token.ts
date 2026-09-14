import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { dataPath } from "@/app/lib/server/data-dir";

export type AuthRole = "member" | "admin";

export const SESSION_COOKIE = "ea_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

// u: username, f: flat number, r: roles, m: must change password,
// pv: password version (bumped on change/reset), exp: expiry in unix seconds.
export interface SessionClaims {
  u: string;
  f: number;
  r: AuthRole[];
  m: boolean;
  pv: number;
  exp: number;
}

// Kept in the persistent data folder so logins and changed passwords survive redeploys.
export function authDataDir() {
  return dataPath("auth");
}

let cachedSecret: Buffer | null = null;

// Prefer AUTH_SECRET from the environment; otherwise generate one once and keep it
// beside the accounts file so sessions survive restarts without extra Hostinger setup.
function sessionSecret(): Buffer {
  if (cachedSecret) return cachedSecret;
  const fromEnv = process.env.AUTH_SECRET?.trim();
  if (fromEnv && fromEnv.length >= 32) {
    cachedSecret = Buffer.from(fromEnv, "utf8");
    return cachedSecret;
  }
  const dir = authDataDir();
  const file = join(dir, "session-secret");
  if (!existsSync(file)) {
    mkdirSync(dir, { recursive: true });
    try {
      writeFileSync(file, randomBytes(48).toString("base64url"), { encoding: "utf8", mode: 0o600, flag: "wx" });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
  }
  const stored = readFileSync(file, "utf8").trim();
  if (stored.length < 32) throw new Error("Session secret file is invalid.");
  cachedSecret = Buffer.from(stored, "utf8");
  return cachedSecret;
}

function signature(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function signSession(claims: Omit<SessionClaims, "exp">): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const payload = Buffer.from(JSON.stringify({ ...claims, exp }), "utf8").toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export function verifySessionToken(token: string | null | undefined): SessionClaims | null {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const given = Buffer.from(token.slice(dot + 1), "base64url");
  const expected = Buffer.from(signature(payload), "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionClaims;
    if (typeof claims.u !== "string" || !Array.isArray(claims.r) || typeof claims.exp !== "number") return null;
    if (claims.exp * 1000 <= Date.now()) return null;
    return claims;
  } catch {
    return null;
  }
}
