import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';
import createIntlMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

const JWT_SECRET = new TextEncoder().encode('xaiagent-jwt-secret-2024');

// 允许的域名列表
const ALLOWED_DOMAINS = [
  '*.xaiagent.io',
  'localhost',
];

// 检查域名是否允许
function isAllowedDomain(origin: string | null): boolean {
  if (!origin) return true; // 允许没有origin的请求
  
  try {
    const url = new URL(origin);
    const hostname = url.hostname;
    
    // 检查是否是允许的域名
    return ALLOWED_DOMAINS.some(domain => {
      if (domain.startsWith('*.')) {
        const baseDomain = domain.slice(2);
        return hostname.endsWith(baseDomain);
      }
      return hostname === domain || hostname.endsWith(domain);
    });
  } catch (error) {
    console.error('URL parsing error:', error);
    return false;
  }
}

// 需要身份认证的路由列表
function needsAuth(path: string, method: string): boolean {
  // 标准化路径（移除末尾斜杠）
  const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;

  // 不需要验证的路由列表
  const publicRoutes = [
    '/api/health',
    '/api/chat/translate',
    '/api/chat/messages',
    '/api/agents',
    '/api/image',
    '/api/stid',
    '/api/socket',
    '/api/model-chat',
    '/api/cron/update-prices',
    '/api/auth/nonce',
    '/api/auth/wallet-connect',
    '/api/auth/wallet-connect-no-sig',
    '/api/auth/disconnect',
    '/api/listener-status',
    '/api/restart-listener',
    '/api/token/distribute',
    '/api/user/profile',
  ];

  // GET 请求的公共路由
  const publicGetRoutes = [
    '/api/users',
    '/api/tasks',
  ];

  // 直接对比完整路径
  if (publicRoutes.includes(normalizedPath)) {
    return false;
  }

  // GET 请求特殊处理
  if (method === 'GET' && publicGetRoutes.some(route => normalizedPath.startsWith(route))) {
    return false;
  }

  // 处理动态路由，例如 /api/agents/[id]
  if (normalizedPath.startsWith('/api/agents/') && normalizedPath !== '/api/agents' && method === 'GET') {
    return false;
  }

  if (normalizedPath.startsWith('/api/agents/') && normalizedPath.includes('/reviews') && method === 'GET') {
    return false;
  }

  // 根据ID的任务路由
  if (normalizedPath.startsWith('/api/tasks/') && normalizedPath !== '/api/tasks' && method === 'GET') {
    return false;
  }

  // IAO 进度路由
  if (normalizedPath.startsWith('/api/iao/progress') && method === 'GET') {
    return false;
  }

  return true;
}

// 创建国际化中间件
const intlMiddleware = createIntlMiddleware({
  locales: routing.locales,
  defaultLocale: routing.defaultLocale,
  localePrefix: routing.localePrefix
});

// 获取用户首选语言
function getPreferredLanguage(acceptLanguage: string): string {
  // 支持的语言列表
  const supportedLanguages = ['en', 'ja', 'ko', 'zh'];
  
  if (!acceptLanguage) return 'en';

  // 将 Accept-Language 转换为语言代码数组
  const languages = acceptLanguage.split(',')
    .map(lang => lang.split(';')[0].trim().toLowerCase().substring(0, 2));

  // 查找第一个支持的语言
  const preferredLanguage = languages.find(lang => supportedLanguages.includes(lang));
  
  return preferredLanguage || 'en';
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // styleid重定向
  if (path === '/styleid') {
    return NextResponse.rewrite(new URL('/en/chat', request.url));
  }

  // 如果是 API 路由，处理 CORS 和认证
  if (path.startsWith('/api')) {
    // 获取请求的 origin
    const origin = request.headers.get('origin');
    
    // 设置基本的 CORS 头
    const headers = new Headers({
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET,DELETE,PATCH,POST,PUT,OPTIONS',
      'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
    });

    // 设置 Access-Control-Allow-Origin
    headers.set('Access-Control-Allow-Origin', origin || '*');

    // 处理 OPTIONS 请求
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers });
    }

    // 检查域名是否允许
    if (!isAllowedDomain(origin)) {
      return new NextResponse(
        JSON.stringify({ code: 403, message: '域名不被允许', origin }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            ...Object.fromEntries(headers.entries()),
          },
        }
      );
    }

    // 创建响应
    const response = NextResponse.next();
    
    // 复制所有CORS头到响应中
    headers.forEach((value, key) => {
      response.headers.set(key, value);
    });

    // 如果需要身份验证，进行验证
    if (needsAuth(path, request.method)) {
      // 获取 token
      const authHeader = request.headers.get('authorization');

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { code: 401, message: '未授权' },
          { status: 401 }
        );
      }

      const token = authHeader.split(' ')[1];

      try {
        // 验证 token
        const { payload } = await jose.jwtVerify(token, JWT_SECRET);
        
        // 创建新的 headers
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', payload.userId as string);
        requestHeaders.set('x-user-address', payload.address as string);

        // 返回修改后的请求
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } catch (error) {
        return NextResponse.json(
          { code: 401, message: 'token无效' },
          { status: 401 }
        );
      }
    }
    return response;
  }

  // 检查是否是直接访问的非 locale 路径
  const isDirectPath = !path.match(/^\/(en|ja|ko|zh)(\/|$)/);
  if (isDirectPath) {
    // 获取用户首选语言
    const acceptLanguage = request.headers.get('accept-language') || '';
    const defaultLocale = getPreferredLanguage(acceptLanguage);
    
    // 重定向到带有默认语言的路径
    const newUrl = new URL(`/${defaultLocale}${path === '/' ? '' : path}`, request.url);
    return NextResponse.redirect(newUrl);
  }

  // 处理国际化路由
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // 匹配所有路径
    '/',
    '/(en|ja|ko|zh)/:path*',
    // API 路由
    '/api/:path*',
    '/styleid'
  ],
}; 