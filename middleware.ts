import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Route protection middleware.
// In dev/local mode, session lives in localStorage (not accessible here).
// The AuthGate client component handles redirects for the localStorage-based session.
//
// This middleware is the production path: when Supabase auth is wired, it will
// check the Supabase session cookie and redirect unauthenticated users.
// Replace the TODO blocks below once Supabase is connected.

const PROTECTED_MEMBER = /^\/member(\/|$)/;
const PROTECTED_ADMIN = /^\/admin(\/|$)/;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // TODO (Supabase): Read the Supabase auth cookie and validate it:
  //   import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
  //   const supabase = createMiddlewareClient({ req, res: NextResponse.next() });
  //   const { data: { session } } = await supabase.auth.getSession();
  //
  // Then use `session` in the checks below instead of `sessionToken`.

  const sessionToken = req.cookies.get("evergreen_session")?.value;

  if (PROTECTED_ADMIN.test(pathname) && !sessionToken) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (PROTECTED_MEMBER.test(pathname) && !sessionToken) {
    // In local mode, localStorage-based AuthGate handles this client-side.
    // In production, uncomment the redirect below:
    //   const url = req.nextUrl.clone();
    //   url.pathname = "/login";
    //   url.searchParams.set("next", pathname);
    //   return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/member/:path*", "/admin/:path*"]
};
