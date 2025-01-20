import { NextResponse } from 'next/server';

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

export function handleError(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        code: error.statusCode,
        message: error.message,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  // 处理其他类型的错误
  return NextResponse.json(
    {
      code: 500,
      message: '服务器错误',
      error: error instanceof Error ? error.message : '未知错误',
    },
    { status: 500 }
  );
}

export function createSuccessResponse<T>(data: T, message = '操作成功') {
  return NextResponse.json({
    code: 200,
    message,
    data,
  });
} 