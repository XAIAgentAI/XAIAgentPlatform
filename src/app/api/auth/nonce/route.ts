import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse } from '@/lib/error';

// 禁用路由缓存
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    // 生成随机 nonce
    const nonce = randomBytes(32).toString('hex');
    const message = `Please sign to log in XAIAgent\n\nNonce: ${nonce}`;

    // 设置过期时间为 5 分钟后
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // 存储 nonce
    try {
      const savedNonce = await prisma.authNonce.create({
        data: {
          nonce,
          address: '', // 在验证时更新
          expiresAt,
        },
      });
      

      return createSuccessResponse({
        nonce,
        message,
      }, '获取 nonce 成功');
    } catch (error) {
      console.error('Failed to save nonce:', error);
      return NextResponse.json(
        {
          code: 500,
          message: '保存 nonce 失败',
          error: error instanceof Error ? error.message : '未知错误',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('获取 nonce 失败:', error);
    return NextResponse.json(
      {
        code: 500,
        message: '服务器错误',
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
} 