import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  request: NextRequest,
  config: RateLimitConfig = { limit: 100, windowMs: 60 * 1000 }
) {
  const ip = request.ip || 'unknown';
  const now = Date.now();
  const windowMs = config.windowMs;

  let requestInfo = requestCounts.get(ip);

  if (!requestInfo || now > requestInfo.resetTime) {
    // 如果没有记录或者已经过了时间窗口，重置计数
    requestInfo = {
      count: 1,
      resetTime: now + windowMs,
    };
  } else {
    // 增加计数
    requestInfo.count++;
  }

  requestCounts.set(ip, requestInfo);

  // 如果超过限制，返回 429 错误
  if (requestInfo.count > config.limit) {
    return NextResponse.json(
      {
        code: 429,
        message: '请求过于频繁，请稍后再试',
        details: {
          retryAfter: Math.ceil((requestInfo.resetTime - now) / 1000),
        },
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((requestInfo.resetTime - now) / 1000).toString(),
        },
      }
    );
  }

  return null;
}

// 清理过期的记录
setInterval(() => {
  const now = Date.now();
  for (const [ip, info] of requestCounts.entries()) {
    if (now > info.resetTime) {
      requestCounts.delete(ip);
    }
  }
}, 60 * 1000); // 每分钟清理一次 