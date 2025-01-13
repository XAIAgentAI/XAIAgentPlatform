/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  experimental: {
    outputFileTracingRoot: process.env.NODE_ENV === 'production' ? '/home/ubuntu/repos/XAIAgentPlatform' : undefined,
  },
  async rewrites() {
    return [
      {
        source: '/:path*',
        destination: '/:path*',
      },
    ]
  },
  // Ensure static assets are copied
  distDir: '.next',
  assetPrefix: '',
}

module.exports = nextConfig
