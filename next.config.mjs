/** @type {import('next').NextConfig} */
const isStaticExport = process.env.STATIC_EXPORT === "true";

const nextConfig = {
  reactStrictMode: true,
  ...(!isStaticExport && {
    async headers() {
      return [
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
  }),
  ...(isStaticExport && {
    output: "export",
    basePath: "/Society-Evergreen-website",
    trailingSlash: true,
    images: { unoptimized: true },
  }),
};

export default nextConfig;
