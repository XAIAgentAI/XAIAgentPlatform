import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

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

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  console.log('Middleware processing path:', path);

  // 如果不需要身份验证，直接放行
  if (!needsAuth(path)) {
    return NextResponse.next();
  }

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
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    return response;
  } catch (error) {
    console.error('Token verification failed:', error);
    return NextResponse.json(
      { code: 401, message: 'token无效' },
      { status: 401 }
    );
  }
}

// 配置需要处理的路由
export const config = {
  matcher: [
    '/api/auth/disconnect',
    '/api/agents/:id*/history',
    '/api/user/:path*',
  ],
}; 