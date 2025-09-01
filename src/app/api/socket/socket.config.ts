import { Server as NetServer, Socket } from 'net'
import { NextApiRequest, NextApiResponse } from 'next'
import { Server as ServerIO } from 'socket.io'

export const config = {
  api: {
    bodyParser: false,
  },
}

export type NextApiResponseServerIO = NextApiResponse & {
  socket: Socket & {
    server: NetServer & {
      io: ServerIO
    }
  }
}

export interface SocketMessage {
  role: 'user' | 'assistant'
  content: string
} 