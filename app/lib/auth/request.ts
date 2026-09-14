import { NextResponse, type NextRequest } from "next/server";
import { AuthError, findAccount, type StoredAccount } from "@/app/lib/auth/accounts";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  signSession,
  verifySessionToken,
  type AuthRole
} from "@/app/lib/auth/session-token";

export interface ServerSession {
  username: string;
  flatNo: number;
  roles: AuthRole[];
  activeRole: AuthRole;
  mustChangePassword: boolean;
  label: string | null;
}

// Route handlers call this even though proxy.ts already checked the cookie: it also
// rejects sessions ended by a password change or reset (passwordVersion mismatch).
export async function requireAccount(
  req: NextRequest,
  options: { admin?: boolean; allowPasswordChange?: boolean } = {}
): Promise<StoredAccount> {
  const claims = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!claims) throw new AuthError(401, "Please sign in.");
  const account = await findAccount(claims.u);
  if (!account || account.passwordVersion !== claims.pv) {
    throw new AuthError(401, "Your session has ended. Please sign in again.");
  }
  if (account.mustChangePassword && !options.allowPasswordChange) {
    throw new AuthError(403, "Please change your password before continuing.", "password_change_required");
  }
  if (options.admin && !account.roles.includes("admin")) {
    throw new AuthError(403, "MC access is required.");
  }
  return account;
}

export function sessionFor(account: StoredAccount): ServerSession {
  return {
    username: account.username,
    flatNo: account.flatNo,
    roles: account.roles,
    activeRole: account.roles.includes("admin") ? "admin" : "member",
    mustChangePassword: account.mustChangePassword,
    label: account.label
  };
}

export function withSessionCookie(req: NextRequest, res: NextResponse, account: StoredAccount) {
  const token = signSession({
    u: account.username,
    f: account.flatNo,
    r: account.roles,
    m: account.mustChangePassword,
    pv: account.passwordVersion
  });
  res.cookies.set(SESSION_COOKIE, token, cookieOptions(req, SESSION_MAX_AGE_SECONDS));
  return noStore(res);
}

export function withoutSessionCookie(req: NextRequest, res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", cookieOptions(req, 0));
  return noStore(res);
}

export function noStore<T extends Response>(res: T): T {
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

export function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return noStore(NextResponse.json({ error: error.message, code: error.code }, { status: error.status }));
  }
  console.error(error);
  return noStore(NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 }));
}

function cookieOptions(req: NextRequest, maxAge: number) {
  const host = req.headers.get("host") || "";
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
    secure: process.env.NODE_ENV === "production" && !/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)
  };
}
