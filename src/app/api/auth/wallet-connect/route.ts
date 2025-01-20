import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { prisma } from '@/lib/prisma';
import { sign } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: Request) {
  try {
    const { address, signature, message } = await request.json();

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
      return NextResponse.json(
        {
          code: 400,
          message: '无效的消息格式',
        },
        { status: 400 }
      );
    }

    const nonce = nonceMatch[1];

    // 验证 nonce 是否存在且未过期
    const storedNonce = await prisma.authNonce.findUnique({
      where: { nonce },
    });

    if (!storedNonce) {
      return NextResponse.json(
        {
          code: 400,
          message: 'Nonce 不存在',
        },
        { status: 400 }
      );
    }

    if (storedNonce.expiresAt < new Date()) {
      return NextResponse.json(
        {
          code: 400,
          message: 'Nonce 已过期',
        },
        { status: 400 }
      );
    }

    // 验证签名
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
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

    // 生成 JWT token
    const token = sign(
      {
        userId: user.id,
        address: user.address,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

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