import { Server as SocketIOServer } from 'socket.io'
import { Server as NetServer } from 'http'
import { NextApiResponse } from 'next'

export const config = {
  api: {
    bodyParser: false,
  },
}

export const initSocket = (res: NextApiResponse) => {
  if (!(res.socket as any).server.io) {
    const httpServer: NetServer = (res.socket as any).server
    const io = new SocketIOServer(httpServer, {
      path: '/socket.io',
      cors: {
        origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
        methods: ["GET", "POST"],
        allowedHeaders: ["*"],
        credentials: true
      }
    })

    io.on('connection', (socket) => {
      console.log('Client connected')

      socket.on('message', (data) => {
        // 这里处理与模型的交互
        const reply = {
          role: 'assistant',
          content: `收到消息: ${data.content}`,
        }
        socket.emit('message', reply)
      })

      socket.on('disconnect', () => {
        console.log('Client disconnected')
      })
    })

    ;(res.socket as any).server.io = io
  }
  return (res.socket as any).server.io
}