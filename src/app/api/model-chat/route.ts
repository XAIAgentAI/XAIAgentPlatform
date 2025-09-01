import { NextRequest } from 'next/server'

// 移除 Edge Runtime 配置，因为我们需要使用 Node.js 的 WebSocket
// export const runtime = 'edge'

export async function GET(req: NextRequest) {
  if (req.headers.get('upgrade') !== 'websocket') {
    return new Response('Expected Upgrade: websocket', { status: 426 })
  }

  try {
    const { searchParams } = new URL(req.url)
    
    // 返回一个标准的 WebSocket 升级响应
    const responseHeaders = new Headers({
      'Upgrade': 'websocket',
      'Connection': 'Upgrade',
      'Sec-WebSocket-Accept': req.headers.get('sec-websocket-key') || '',
      'Sec-WebSocket-Protocol': req.headers.get('sec-websocket-protocol') || '',
    })

    return new Response(null, {
      status: 101,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error('WebSocket setup error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
} 