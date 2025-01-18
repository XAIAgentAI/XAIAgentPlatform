import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  if (req.headers.get('upgrade') !== 'websocket') {
    return new Response('Expected Upgrade: websocket', { status: 426 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const { socket, response } = new WebSocketPair()

    socket.accept()

    socket.addEventListener('message', async (event) => {
      try {
        const data = JSON.parse(event.data)
        
        // 这里处理与模型的交互
        const reply = {
          role: 'assistant',
          content: `收到消息: ${data.content}`,
        }
        
        socket.send(JSON.stringify(reply))
      } catch (error) {
        console.error('Error processing message:', error)
      }
    })

    return response
  } catch (error) {
    console.error('WebSocket setup error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
} 