/** @type {import('next').NextConfig} */
const isStaticExport = process.env.STATIC_EXPORT === "true";

const nextConfig = {
  reactStrictMode: true,
  ...(!isStaticExport && {
    async headers() {
      const noStoreHeaders = [
        {
          key: "Cache-Control",
          value: "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0",
        },
        { key: "Pragma", value: "no-cache" },
        { key: "Expires", value: "0" },
      ];

      return [
        {
          source:
            "/((?!_next/static|_next/image|images/|files/|favicon.ico|robots.txt|sitemap.xml).*)",
          headers: noStoreHeaders,
        },
        {
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
    async redirects() {
      return [
        {
          source: "/:path*",
          has: [{ type: "host", value: "www.evergreenapartment.in" }],
          destination: "https://evergreenapartment.in/:path*",
          permanent: true,
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
