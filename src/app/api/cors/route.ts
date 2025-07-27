import { NextResponse } from 'next/server';
import { getAllowedOrigins, addAllowedOrigin, removeAllowedOrigin } from '@/lib/cors';

// 获取允许的域名列表
export async function GET() {
  try {
    const allowedOrigins = getAllowedOrigins();
    return NextResponse.json({
      success: true,
      data: {
        allowedOrigins,
        count: allowedOrigins.length
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get allowed origins', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// 添加新的允许域名
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { origin } = body;

    if (!origin) {
      return NextResponse.json(
        { error: 'Missing origin parameter' },
        { status: 400 }
      );
    }

    addAllowedOrigin(origin);
    const allowedOrigins = getAllowedOrigins();

    return NextResponse.json({
      success: true,
      message: `Origin ${origin} added successfully`,
      data: {
        allowedOrigins,
        count: allowedOrigins.length
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add origin', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// 删除允许的域名
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get('origin');

    if (!origin) {
      return NextResponse.json(
        { error: 'Missing origin parameter' },
        { status: 400 }
      );
    }

    removeAllowedOrigin(origin);
    const allowedOrigins = getAllowedOrigins();

    return NextResponse.json({
      success: true,
      message: `Origin ${origin} removed successfully`,
      data: {
        allowedOrigins,
        count: allowedOrigins.length
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to remove origin', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// 处理OPTIONS请求
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
} 