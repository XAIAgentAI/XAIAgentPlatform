/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'dist',
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizeCss: true,
    outputFileTracingRoot: process.cwd(),
    outputFileTracingIncludes: {
      '/**/*': [
        './public/**/*',
        './server.js',
        '.next/static/**/*',
        './node_modules/.prisma/**/*',
        './node_modules/@prisma/client/**/*',
        './prisma/**/*'
      ]
    }
  }
}

module.exports = nextConfig
