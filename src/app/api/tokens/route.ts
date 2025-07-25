import { NextResponse } from 'next/server';
import { TokenListService } from '@/services/tokenListService';

export async function GET() {
  try {
    const tokenList = await TokenListService.getActiveTokens();
    
    // 设置CORS headers
    const response = NextResponse.json(tokenList);
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;
  } catch (error) {
    console.error('Error fetching token list:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to fetch token list' },
      { status: 500 }
    );
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    return errorResponse;
  }
}

// 处理OPTIONS请求
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
} 