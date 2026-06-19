/** @type {import('next').NextConfig} */
const isStaticExport = process.env.STATIC_EXPORT === "true";

const nextConfig = {
  reactStrictMode: true,
  ...(isStaticExport && {
    output: "export",
    basePath: "/Society-Evergreen-website",
    trailingSlash: true,
    images: { unoptimized: true },
  }),
};

export default nextConfig;
