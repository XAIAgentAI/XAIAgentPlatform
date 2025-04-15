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

// 需要身份验证的路由
const authRoutes = [
  '/api/auth/disconnect',
  '/api/agents/[id]/history',
  '/api/user/profile',
  '/api/user/settings',
  '/api/user/assets',
];

// 检查路径是否匹配
function matchPath(path: string, pattern: string): boolean {
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');

  if (patternParts.length !== pathParts.length) {
    return false;
  }

  return patternParts.every((part, i) => {
    if (part.startsWith('[') && part.endsWith(']')) {
      return true;
    }
    return part === pathParts[i];
  });
}

// 检查是否需要身份验证
function needsAuth(path: string): boolean {
  return authRoutes.some(pattern => matchPath(path, pattern));
}

// 创建国际化中间件
const intlMiddleware = createIntlMiddleware(routing);

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
  
  // 如果是 API 路由，处理 CORS 和认证
  if (path.startsWith('/api/')) {
    // 获取请求的 origin
    const origin = request.headers.get('origin');
    console.log('Request origin:', origin);
    
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
      console.log('Domain not allowed:', origin);
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
    if (needsAuth(path)) {
      // 获取 token
      const authHeader = request.headers.get('authorization');
      console.log('Authorization header:', authHeader);

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('No valid authorization header found');
        return NextResponse.json(
          { code: 401, message: '未授权' },
          { status: 401 }
        );
      }

      const token = authHeader.split(' ')[1];
      console.log('Extracted token:', token);

      try {
        // 验证 token
        const { payload } = await jose.jwtVerify(token, JWT_SECRET);
        console.log('Decoded token:', payload);
        
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
        console.error('Token verification failed:', error);
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
  ],
}; 