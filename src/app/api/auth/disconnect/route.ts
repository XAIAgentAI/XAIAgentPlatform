import { NextResponse } from 'next/server';
import { createSuccessResponse, handleError } from '@/lib/error';

// 断开钱包连接
export async function POST() {
  try {
    // 由于 middleware 已经验证了 token，这里不需要再验证
    // 前端会清除 token，服务端不需要维护 token 状态
    return createSuccessResponse(null, '断开连接成功');
  } catch (error) {
    return handleError(error);
  }
} 