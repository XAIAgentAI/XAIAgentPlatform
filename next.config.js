// 必须在任何其他导入之前加载环境变量
const { config } = require('dotenv');

// 根据 NODE_ENV 或 DOTENV_CONFIG_PATH 加载对应的环境变量文件
if (process.env.DOTENV_CONFIG_PATH) {
  config({ path: process.env.DOTENV_CONFIG_PATH, override: true });
} else if (process.env.NODE_ENV === 'test') {
  config({ path: '.env.test', override: true });
} else if (process.env.NODE_ENV === 'development') {
  config({ path: '.env.development', override: true });
}

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
    fastRefresh: true,
    outputFileTracingRoot: process.cwd(),
    outputFileTracingIncludes: {
      '/**/*': [
        './public/**/*',
        './src/**/*'
      ]
    },

  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL || '',
    _next_intl_trailing_slash: 'never'
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  webpack: (config, { dev }) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });

    // 只在生产环境禁用minification，开发环境保持默认设置
    if (!dev && config.optimization) {
      config.optimization.minimize = false;
    }

    return config;
  },
}

module.exports = withNextIntl(nextConfig);
