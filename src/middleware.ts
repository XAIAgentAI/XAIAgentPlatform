import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';
import createIntlMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

const JWT_SECRET = new TextEncoder().encode('xaiagent-jwt-secret-2024');

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
  
  // 如果是 API 路由，跳过语言处理
  if (path.startsWith('/api/')) {
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
    return NextResponse.next();
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