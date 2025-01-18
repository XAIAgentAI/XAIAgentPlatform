export const config = {
  ws: {
    serverUrl: process.env.NEXT_PUBLIC_WS_SERVER_URL || 'http://127.0.0.1:5000',
    path: process.env.NEXT_PUBLIC_WS_PATH || '/socket.io',
  }
} as const 