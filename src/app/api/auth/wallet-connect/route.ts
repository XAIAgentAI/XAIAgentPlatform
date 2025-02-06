import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';

// 禁用路由缓存
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 使用固定的 JWT_SECRET，确保前后端一致
const JWT_SECRET = new TextEncoder().encode('xaiagent-jwt-secret-2024');

export async function POST(request: Request) {
  try {
    const { address, signature, message } = await request.json();
    console.log('Wallet connect request:', { address, signature, message });

    if (!address || !signature || !message) {
      return NextResponse.json(
        {
          code: 400,
          message: '缺少必要参数',
        },
        { status: 400 }
      );
    }

    // 从消息中提取 nonce
    const nonceMatch = message.match(/Nonce: ([a-f0-9]+)/);
    if (!nonceMatch) {
      console.log('Invalid message format:', message);
      return NextResponse.json(
        {
          code: 400,
          message: '无效的消息格式',
        },
        { status: 400 }
      );
    }

    const nonce = nonceMatch[1];
    console.log('Extracted nonce:', nonce);

    // 验证 nonce 是否存在且未过期
    const storedNonce = await prisma.authNonce.findUnique({
      where: { nonce },
    });

    console.log('Stored nonce lookup result:', storedNonce);

    if (!storedNonce) {
      console.log('Nonce not found:', nonce);
      // 检查是否有其他有效的 nonce
      const allValidNonces = await prisma.authNonce.findMany({
        where: {
          expiresAt: {
            gt: new Date(),
          },
        },
      });
      console.log('All valid nonces:', allValidNonces);
      
      return NextResponse.json(
        {
          code: 400,
          message: 'Nonce 不存在或已过期，请重新获取',
        },
        { status: 400 }
      );
    }

    // 验证签名
    const recoveredAddress = ethers.verifyMessage(message, signature);
    console.log('Recovered address:', recoveredAddress);

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      console.log('Signature verification failed', {
        recovered: recoveredAddress.toLowerCase(),
        provided: address.toLowerCase(),
      });
      return NextResponse.json(
        {
          code: 401,
          message: '签名验证失败',
        },
        { status: 401 }
      );
    }

    // 查找或创建用户
    let user = await prisma.user.findUnique({
      where: { address: address.toLowerCase() },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          address: address.toLowerCase(),
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

    console.log('Generated token:', token);

    // 删除已使用的 nonce
    await prisma.authNonce.delete({
      where: { nonce },
    });

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