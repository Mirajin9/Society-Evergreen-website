import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { loadSourceMembers, type SourceMember } from "@/app/lib/member-source";
import { MC_ROLES_BY_FLAT } from "@/app/lib/society-roles";
import { generateTemporaryPassword, hashPassword, passwordProblem, verifyPassword } from "@/app/lib/auth/password";
import { authDataDir, type AuthRole } from "@/app/lib/auth/session-token";

export interface StoredAccount {
  username: string;
  flatNo: number;
  roles: AuthRole[];
  label: string | null;
  note: string | null;
  passwordHash: string;
  passwordVersion: number;
  mustChangePassword: boolean;
  passwordChangedAt: string | null;
  failedAttempts: number;
  lockedUntil: string | null;
  lastLoginAt: string | null;
}

export type AccountSummary = Omit<StoredAccount, "passwordHash">;

interface AccountsFile {
  version: 1;
  createdAt: string;
  accounts: StoredAccount[];
}

export class AuthError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

export type LoginResult =
  | { ok: true; account: StoredAccount }
  | { ok: false; reason: "invalid" }
  | { ok: false; reason: "locked"; retryAfterMinutes: number };

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

const accountsPath = () => join(authDataDir(), "accounts.json");

// Serialises every read-modify-write so concurrent logins can't overwrite each other.
let queue: Promise<unknown> = Promise.resolve();
function exclusive<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

let dummyHash: Promise<string> | null = null;

export function normalizeUsername(value: string) {
  const trimmed = value.trim().toLowerCase();
  const digits = trimmed.replace(/\D/g, "");
  // Accept "+91 98100 00000" style entries for mobile-number usernames.
  return /^[\d\s+()-]+$/.test(trimmed) && digits.length >= 10 ? digits.slice(-10) : trimmed;
}

export function authenticate(username: string, password: string): Promise<LoginResult> {
  return exclusive(async () => {
    const data = await loadAccounts();
    const account = data.accounts.find((item) => item.username === normalizeUsername(username));
    if (!account) {
      // Spend the same time as a real check so usernames can't be probed by timing.
      await verifyPassword(password, await (dummyHash ??= hashPassword("not-a-real-password")));
      return { ok: false, reason: "invalid" };
    }

    const now = Date.now();
    if (account.lockedUntil && Date.parse(account.lockedUntil) > now) {
      return { ok: false, reason: "locked", retryAfterMinutes: Math.ceil((Date.parse(account.lockedUntil) - now) / 60000) };
    }

    if (!(await verifyPassword(password, account.passwordHash))) {
      account.failedAttempts += 1;
      if (account.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        account.failedAttempts = 0;
        account.lockedUntil = new Date(now + LOCK_MINUTES * 60000).toISOString();
        await writeAccountsFile(data);
        return { ok: false, reason: "locked", retryAfterMinutes: LOCK_MINUTES };
      }
      await writeAccountsFile(data);
      return { ok: false, reason: "invalid" };
    }

    account.failedAttempts = 0;
    account.lockedUntil = null;
    account.lastLoginAt = new Date(now).toISOString();
    await writeAccountsFile(data);
    return { ok: true, account };
  });
}

export async function findAccount(username: string): Promise<StoredAccount | null> {
  const data = await exclusive(loadAccounts);
  return data.accounts.find((item) => item.username === normalizeUsername(username)) ?? null;
}

export function changePassword(username: string, currentPassword: string, newPassword: string): Promise<StoredAccount> {
  return exclusive(async () => {
    const data = await loadAccounts();
    const account = data.accounts.find((item) => item.username === username);
    if (!account) throw new AuthError(401, "Please sign in again.");
    if (!(await verifyPassword(currentPassword, account.passwordHash))) {
      throw new AuthError(400, "Your current password is incorrect.");
    }
    const problem = passwordProblem(newPassword, account.username);
    if (problem) throw new AuthError(400, problem);
    if (newPassword === currentPassword) {
      throw new AuthError(400, "Choose a password that's different from your current one.");
    }

    account.passwordHash = await hashPassword(newPassword);
    account.passwordVersion += 1;
    account.mustChangePassword = false;
    account.passwordChangedAt = new Date().toISOString();
    account.failedAttempts = 0;
    account.lockedUntil = null;
    await writeAccountsFile(data);
    return account;
  });
}

export function resetPassword(username: string): Promise<{ account: StoredAccount; temporaryPassword: string }> {
  return exclusive(async () => {
    const data = await loadAccounts();
    const account = data.accounts.find((item) => item.username === normalizeUsername(username));
    if (!account) throw new AuthError(404, "That login was not found.");

    const temporaryPassword = generateTemporaryPassword();
    account.passwordHash = await hashPassword(temporaryPassword);
    account.passwordVersion += 1;
    account.mustChangePassword = true;
    account.failedAttempts = 0;
    account.lockedUntil = null;
    await writeAccountsFile(data);
    return { account, temporaryPassword };
  });
}

export async function listAccounts(): Promise<AccountSummary[]> {
  const data = await exclusive(loadAccounts);
  return data.accounts
    .map(({ passwordHash: _passwordHash, ...summary }) => summary)
    .sort((a, b) => (a.flatNo || Number.MAX_SAFE_INTEGER) - (b.flatNo || Number.MAX_SAFE_INTEGER));
}

async function loadAccounts(): Promise<AccountsFile> {
  const existing = await readAccountsFile();
  if (existing) return existing;
  const created: AccountsFile = {
    version: 1,
    createdAt: new Date().toISOString(),
    accounts: await initialAccounts()
  };
  await writeAccountsFile(created);
  return created;
}

async function readAccountsFile(): Promise<AccountsFile | null> {
  let raw: string;
  try {
    raw = await readFile(accountsPath(), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
  // A damaged file must fail loudly: silently re-creating it would reset every password.
  const parsed = JSON.parse(raw) as AccountsFile;
  if (!Array.isArray(parsed.accounts)) throw new Error("Accounts file is invalid.");
  return parsed;
}

async function writeAccountsFile(data: AccountsFile) {
  await mkdir(authDataDir(), { recursive: true });
  const tmp = `${accountsPath()}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2), { encoding: "utf8", mode: 0o600 });
  await rename(tmp, accountsPath());
}

// First run only: recreate the logins members were already given (mobile number +
// membership number, mc<flat> for the committee), each forced to change on first sign-in.
async function initialAccounts(): Promise<StoredAccount[]> {
  const members = [...(await loadSourceMembers())].sort((a, b) => Number(a.flat) - Number(b.flat));
  const taken = new Set<string>();
  const seeds: Array<ReturnType<typeof initialCredential>> = [];
  for (const member of members) {
    const seed = initialCredential(member);
    if (taken.has(seed.username)) {
      seed.note = `Mobile ${seed.username} is shared with another flat, so this login is flat${seed.flatNo}.`;
      seed.username = `flat${seed.flatNo}`;
    }
    taken.add(seed.username);
    seeds.push(seed);
  }
  seeds.push({
    username: "kumar.sanu",
    password: "MC@Kumar2026",
    flatNo: 0,
    roles: ["admin"],
    label: "Kumar Sanu - employee",
    note: "Employee account. Contact: 7042117183."
  });

  return Promise.all(seeds.map(async ({ password, ...seed }) => ({
    ...seed,
    passwordHash: await hashPassword(password),
    passwordVersion: 1,
    mustChangePassword: true,
    passwordChangedAt: null,
    failedAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null
  })));
}

function initialCredential(member: SourceMember) {
  const flatNo = Number(member.flat);
  const mobile = firstTenDigitNumber(member.phone) || firstTenDigitNumber(member.alternatePhone);
  const membership = String(member.membership ?? "").trim();
  const committeeRole = MC_ROLES_BY_FLAT[flatNo] || null;
  if (committeeRole) {
    const suffix = mobile?.slice(-4) || String(flatNo).padStart(3, "0");
    return {
      username: `mc${flatNo}`,
      password: `MC@${flatNo}${suffix}`,
      flatNo,
      roles: ["member", "admin"] as AuthRole[],
      label: committeeRole as string | null,
      note: null as string | null
    };
  }
  return {
    username: mobile || `flat${flatNo}`,
    password: membership || `EA@${String(flatNo).padStart(3, "0")}`,
    flatNo,
    roles: ["member"] as AuthRole[],
    label: null as string | null,
    note: null as string | null
  };
}

function firstTenDigitNumber(value: unknown) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  return digits.match(/[6-9]\d{9}/)?.[0] || digits.slice(0, 10);
}
