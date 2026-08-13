/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverComponentsExternalPackages: [] },
  allowedDevOrigins: ['*.e2b.app']
};
module.exports = nextConfig;
