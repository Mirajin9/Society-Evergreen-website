/** @type {import('next').NextConfig} */
const isStaticExport = process.env.STATIC_EXPORT === "true";

const nextConfig = {
  reactStrictMode: true,
  ...(!isStaticExport && {
    // Hostinger's CDN (hcdn) sits in front of the Next.js server and honors the
    // origin Cache-Control. Next.js emits `s-maxage=31536000` on prerendered HTML,
    // which let the CDN serve a year-old page that pointed at deleted, content-hashed
    // CSS chunks -> the unstyled white page. Force HTML to always revalidate while
    // leaving the immutable hashed assets in /_next/static cacheable forever.
    async headers() {
      return [
        {
          // Everything except build assets and static files in /public.
          source:
            "/((?!_next/static|_next/image|images/|files/|favicon.ico|robots.txt|sitemap.xml).*)",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=0, s-maxage=0, must-revalidate",
            },
          ],
        },
        {
          source: "/_next/static/:path*",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=31536000, immutable",
            },
          ],
        },
        {
          // Replaceable public images (e.g. the hero photo) should refresh quickly.
          source: "/images/:path*",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=300, s-maxage=300, stale-while-revalidate=60",
            },
          ],
        },
      ];
    },
  }),
  ...(isStaticExport && {
    output: "export",
    basePath: "/Society-Evergreen-website",
    trailingSlash: true,
    images: { unoptimized: true },
  }),
};

export default nextConfig;
