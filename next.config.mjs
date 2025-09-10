/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Enable standalone output for Docker optimization
  output: 'standalone',
  // Experimental features for better performance
  experimental: {
    // Optimize bundle size
    optimizePackageImports: ['@radix-ui/react-icons'],
  },
}

export default nextConfig
