import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';

// 禁用路由缓存
export const dynamic = 'force-dynamic';

// 使用固定的 JWT_SECRET，确保前后端一致
const JWT_SECRET = new TextEncoder().encode('xaiagent-jwt-secret-2024');

export async function POST(request: Request) {
  try {
    const { address } = await request.json();
    console.log('Wallet connect no signature request:', { address });

    if (!address) {
      return NextResponse.json(
        {
          code: 400,
          message: '缺少必要参数',
        },
        { status: 400 }
      );
    }

    const formattedAddress = address.toLowerCase();

    // 查找或创建用户
    let user = await prisma.user.findUnique({
      where: { address: formattedAddress },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          address: formattedAddress,
        },
      });
    }

    console.log('User:', user);

    // 生成 JWT token
    const token = await new jose.SignJWT({
      userId: user.id,
      address: user.address,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    return NextResponse.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        address: user.address,
      },
    });
  } catch (error) {
    console.error('钱包连接失败:', error);
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