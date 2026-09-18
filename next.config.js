/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Mengabaikan error TypeScript saat proses build di Vercel
    ignoreBuildErrors: true,
  },
  eslint: {
    // Mengabaikan error ESLint saat proses build di Vercel
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
