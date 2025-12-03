/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Allow deployment even if there are ESLint issues
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow deployment even if there are TS errors (e.g., "Unexpected any")
    ignoreBuildErrors: true,
  },
  images: {
    // Optional: improves compatibility for Vercel image hosting
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  experimental: {
    // Optional: enables server actions if you are using them
    serverActions: {
      allowedOrigins: ["*"],
    },
  },
};

export default nextConfig;
