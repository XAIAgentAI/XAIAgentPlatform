import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { socket: ws, response } = Object.assign(new WebSocket(null), {
    socket: null,
    response: null,
  })

  ws.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data.toString())
      
      // 这里处理与模型的交互
      const reply = {
        role: 'assistant',
        content: `收到消息: ${data.content}`,
      }
      
      ws.send(JSON.stringify(reply))
    } catch (error) {
      console.error('Error processing message:', error)
    }
  }

  return response
} 