import { useEffect, useRef } from 'react'
import io, { Socket } from 'socket.io-client'

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null)
  const isConnectedRef = useRef(false)

  useEffect(() => {
    // 如果已经连接，直接返回
    if (isConnectedRef.current || socketRef.current) {
      return
    }

    isConnectedRef.current = true
    
    // 创建socket连接
    const socket = io('http://127.0.0.1:5000', {
      transports: ['websocket'],
      autoConnect: true,
      withCredentials: false,
      extraHeaders: {
        'Access-Control-Allow-Origin': '*'
      }
    })

    socket.on('connect', () => {
      console.log('Connected to server')
      socket.emit("join", {run_id: "run_20250118-182748_twsumb"});

    })

    socket.on('connect_error', (error) => {
      console.error('连接错误:', error.message)
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from server')
      isConnectedRef.current = false
    })

    socketRef.current = socket

    return () => {
      // socket.disconnect()
      // isConnectedRef.current = false
    }
  }, [])

  return socketRef.current
}