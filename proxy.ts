import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/app/lib/auth/session-token";

const CHANGE_PASSWORD_PATH = "/change-password";

// First line of defence for the portal. Route handlers re-check the session against the
// accounts file, which also catches sessions ended by a password change or reset.
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const claims = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);

  if (!claims) {
    if (isApi) return deny(401, "Please sign in.");
    const login = new URL("/login", req.url);
    login.searchParams.set("next", `${pathname}${search}`);
    return redirect(login);
  }

  if (claims.m && pathname !== CHANGE_PASSWORD_PATH) {
    if (isApi) return deny(403, "Please change your password before continuing.");
    return redirect(new URL(CHANGE_PASSWORD_PATH, req.url));
  }

  const needsAdmin = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (needsAdmin && !claims.r.includes("admin")) {
    if (isApi) return deny(403, "MC access is required.");
    return redirect(new URL("/member/dashboard", req.url));
  }

  return noStore(NextResponse.next());
}

// Keep Hostinger's CDN from caching a redirect or page decided by one visitor's cookie.
function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

function redirect(url: URL) {
  return noStore(NextResponse.redirect(url));
}

function deny(status: number, error: string) {
  return noStore(NextResponse.json({ error }, { status }));
}

export const config = {
  matcher: ["/member/:path*", "/admin/:path*", "/api/admin/:path*", "/api/portal/:path*", "/change-password"]
};
