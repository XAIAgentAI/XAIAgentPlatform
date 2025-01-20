import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verify } from 'jsonwebtoken';
import { rateLimit } from './lib/rate-limit';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 不需要认证的路由
const publicPaths = [
  '/api/auth/nonce',
  '/api/auth/wallet-connect',
  '/api/auth/verify-signature',
  '/api/auth/disconnect',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 应用速率限制
  const rateLimitResponse = rateLimit(request, {
    limit: publicPaths.some(path => pathname.startsWith(path)) ? 20 : 100, // 未认证用户 20次/分钟，已认证用户 100次/分钟
    windowMs: 60 * 1000,
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // 如果是公开路由，直接放行
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 验证 token
  const token = request.headers.get('authorization')?.split(' ')[1];

  if (!token) {
    return NextResponse.json(
      {
        code: 401,
        message: '未授权',
      },
      { status: 401 }
    );
  }

  try {
    // 验证 token
    const decoded = verify(token, JWT_SECRET);
    
    // 将用户信息添加到请求头中
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', (decoded as any).userId);
    requestHeaders.set('x-user-address', (decoded as any).address);

    // 克隆请求并添加修改后的头部
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        code: 401,
        message: 'token无效',
      },
      { status: 401 }
    );
  }
}

// 配置需要进行中间件处理的路由
export const config = {
  matcher: '/api/:path*',
}; 