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
    // If no record exists or time window has passed, reset count
    requestInfo = {
      count: 1,
      resetTime: now + windowMs,
    };
  } else {
    // Increment count
    requestInfo.count++;
  }

  requestCounts.set(ip, requestInfo);

  // If over limit, return 429 error
  if (requestInfo.count > config.limit) {
    return NextResponse.json(
      {
        code: 429,
        message: 'Too many requests, please try again later',
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

// Clean up expired records
setInterval(() => {
  const now = Date.now();
  for (const [ip, info] of requestCounts.entries()) {
    if (now > info.resetTime) {
      requestCounts.delete(ip);
    }
  }
}, 60 * 1000); // Clean up every minute 