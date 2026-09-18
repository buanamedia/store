/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Memaksa Vercel mengabaikan error TypeScript saat build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Memaksa Vercel mengabaikan error ESLint saat build
    ignoreDuringBuilds: true,
  },
  swcMinify: true,
};

module.exports = nextConfig;
