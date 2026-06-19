import { NextResponse, type NextRequest } from "next/server";

const APEX_HOST = "evergreenapartment.in";
const WWW_HOST = `www.${APEX_HOST}`;
const NO_STORE =
  "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0].toLowerCase();

  if (host === WWW_HOST) {
    const url = request.nextUrl.clone();
    url.hostname = APEX_HOST;

    const response = NextResponse.redirect(url, 308);
    response.headers.set("Cache-Control", NO_STORE);
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  }

  const response = NextResponse.next();
  response.headers.set("Cache-Control", NO_STORE);
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|images/|files/).*)",
  ],
};
