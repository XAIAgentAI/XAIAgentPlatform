const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: false,
  trailingSlash: true,
  images: {
    unoptimized: true,
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
