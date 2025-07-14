const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: false,
  trailingSlash: false,
  images: {
    unoptimized: true,
  },
  // 使用rewrites代替redirects，不会产生实际的重定向
  async rewrites() {
    return [
      // 处理API路径，确保无论带不带斜杠都能正确处理
      {
        source: '/api/:path*/',
        destination: '/api/:path*',
      }
    ];
  },
  experimental: {
    outputFileTracingRoot: process.cwd(),
    outputFileTracingIncludes: {
      '/**/*': [
        './public/**/*',
        './src/**/*'
      ]
    },
    // 启用 instrumentation 功能
    instrumentationHook: true
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL || ''
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });

    // Disable minification for problematic files
    if (config.optimization) {
      config.optimization.minimize = false;
    }

    return config;
  },
}

module.exports = withNextIntl(nextConfig);
