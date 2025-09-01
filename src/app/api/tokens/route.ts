import { NextResponse } from 'next/server';
import { TokenListService } from '@/services/tokenListService';

export async function GET(request: Request) {
  try {
    const tokenList = await TokenListService.getActiveTokens();
    return NextResponse.json(tokenList);
  } catch (error) {
    console.error('Error fetching token list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token list', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// 处理OPTIONS请求（预检请求）
export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204 });
} 