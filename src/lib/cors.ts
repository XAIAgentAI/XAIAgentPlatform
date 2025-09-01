import { NextResponse } from 'next/server';

// 允许的域名白名单（支持通配符）
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://*.xaiagent.io',
  'https://xaiagent.io',
  'https://*.dbcswap.io',
  'https://dbcswap.io',
  'https://*.baidu.com',
  'https://baidu.com',
];

/**
 * 检查origin是否在允许列表中（支持通配符）
 * @param origin 请求的origin
 * @returns 是否允许
 */
function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false; // 不允许没有origin的请求
  
  try {
    const url = new URL(origin);
    const hostname = url.hostname;
    
    return ALLOWED_ORIGINS.some(allowedOrigin => {
      if (allowedOrigin.startsWith('https://*.')) {
        // 处理通配符域名，如 https://*.xaiagent.io
        const baseDomain = allowedOrigin.replace('https://*.', '');
        return hostname.endsWith('.' + baseDomain) || hostname === baseDomain;
      } else if (allowedOrigin.startsWith('http://*.')) {
        // 处理HTTP通配符域名
        const baseDomain = allowedOrigin.replace('http://*.', '');
        return hostname.endsWith('.' + baseDomain) || hostname === baseDomain;
      } else {
        // 精确匹配
        const allowedUrl = new URL(allowedOrigin);
        return hostname === allowedUrl.hostname;
      }
    });
  } catch (error) {
    console.error('Origin check error:', error);
    return false;
  }
}

/**
 * 设置CORS头到响应对象
 * @param response NextResponse对象
 * @param origin 请求的origin
 * @returns 设置了CORS头的响应对象
 */
export function setCorsHeaders(response: NextResponse, origin?: string | null): NextResponse {
  // 检查origin是否允许
  if (origin && !isAllowedOrigin(origin)) {
    // 如果origin不在允许列表中，返回403
    return NextResponse.json(
      { error: 'Origin not allowed', message: '请求来源不被允许' },
      { status: 403 }
    );
  }
  
  // 设置允许的origin
  const allowedOrigin = origin || ALLOWED_ORIGINS[0];
  response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version, If-None-Match, If-Modified-Since, Cache-Control, Pragma, DNT, User-Agent, If-Match, If-Range, Range, Accept-Encoding, Accept-Language, Referer, Sec-Fetch-Dest, Sec-Fetch-Mode, Sec-Fetch-Site, Sec-Fetch-User, Sec-CH-UA, Sec-CH-UA-Mobile, Sec-CH-UA-Platform');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24小时
  
  return response;
}

/**
 * 创建CORS预检响应
 * @param origin 请求的origin
 * @returns OPTIONS请求的响应
 */
export function createCorsPreflightResponse(origin?: string | null): NextResponse {
  const response = new NextResponse(null, { status: 204 });
  return setCorsHeaders(response, origin);
}

/**
 * 获取允许的域名列表
 * @returns 允许的域名数组
 */
export function getAllowedOrigins(): string[] {
  return [...ALLOWED_ORIGINS];
}

/**
 * 添加新的允许域名
 * @param origin 要添加的域名
 */
export function addAllowedOrigin(origin: string): void {
  if (!ALLOWED_ORIGINS.includes(origin)) {
    ALLOWED_ORIGINS.push(origin);
  }
}

/**
 * 移除允许的域名
 * @param origin 要移除的域名
 */
export function removeAllowedOrigin(origin: string): void {
  const index = ALLOWED_ORIGINS.indexOf(origin);
  if (index > -1) {
    ALLOWED_ORIGINS.splice(index, 1);
  }
} 