import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback) as (password: string, salt: Buffer, keyLength: number) => Promise<Buffer>;
const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, salt, key] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !key) return false;
  const expected = Buffer.from(key, "base64");
  const actual = await scrypt(password, Buffer.from(salt, "base64"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// Readable one-time password for MC-issued resets, e.g. "EA-k7Pqm-X3vtn".
export function generateTemporaryPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const chars = [...randomBytes(10)].map((byte) => alphabet[byte % alphabet.length]).join("");
  return `EA-${chars.slice(0, 5)}-${chars.slice(5)}`;
}

export function passwordProblem(password: string, username: string): string | null {
  if (password.length < 8) return "Use at least 8 characters.";
  if (password.length > 128) return "Use 128 characters or fewer.";
  if (password.toLowerCase() === username.toLowerCase()) return "Your password can't be the same as your username.";
  if (/^\d+$/.test(password)) return "Don't use only numbers. Add some letters too.";
  return null;
}
