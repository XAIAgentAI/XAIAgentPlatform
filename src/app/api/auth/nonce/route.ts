import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // 生成随机 nonce
    const nonce = randomBytes(32).toString('hex');
    const message = `Please sign to log in XAIAgent\n\nNonce: ${nonce}`;

    // 设置过期时间为 5 分钟后
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // 存储 nonce
    await prisma.authNonce.create({
      data: {
        nonce,
        address: '', // 在验证时更新
        expiresAt,
      },
    });

    return NextResponse.json({
      code: 200,
      message: '获取 nonce 成功',
      data: {
        nonce,
        message,
      },
    });
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