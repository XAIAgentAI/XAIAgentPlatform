import { NextResponse } from 'next/server';
import { setCorsHeaders } from './cors';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleError(error: unknown, request?: Request) {
  console.error('API Error:', error);

  let response: NextResponse;

  if (error instanceof ApiError) {
    response = NextResponse.json(
      {
        code: error.statusCode,
        message: error.message,
        details: error.details,
      },
      { status: error.statusCode }
    );
  } else {
    // 处理其他类型的错误
    response = NextResponse.json(
      {
        code: 500,
        message: '服务器错误',
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }

  // 添加CORS头
  if (request) {
    const origin = request.headers.get('origin');
    return setCorsHeaders(response, origin);
  }

  return response;
}

export function createSuccessResponse<T>(data: T, message = '操作成功', request?: Request) {
  // 处理 BigInt 序列化问题
  const safeData = JSON.parse(JSON.stringify(data, (_, value) => 
    typeof value === 'bigint' ? value.toString() : value
  ));
  
  const response = NextResponse.json({
    code: 200,
    message,
    data: safeData,
  });

  // 添加CORS头
  if (request) {
    const origin = request.headers.get('origin');
    return setCorsHeaders(response, origin);
  }

  return response;
} 