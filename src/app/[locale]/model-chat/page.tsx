'use client'

import { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { config } from '@/lib/config'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ModelChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [socket, setSocket] = useState<Socket | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const socketIo = io(config.ws.serverUrl, {
      path: config.ws.path,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true
    })

    socketIo.on('connect', () => {
      console.log('Connected to Socket.IO server')
    })

    socketIo.on('message', (message: Message) => {
      setMessages(prev => [...prev, message])
    })

    socketIo.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server')
    })

    setSocket(socketIo)

    return () => {
      socketIo.disconnect()
    }
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || !socket) return

    const message: Message = {
      role: 'user',
      content: input
    }

    try {
      socket.emit('message', message)
      setMessages(prev => [...prev, message])
      setInput('')
    } catch (error) {
      console.error('发送消息错误:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-screen p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Model Chat</h1>
      
      <Card className="flex-1 mb-4 p-4">
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground ml-auto max-w-[80%]' 
                    : 'bg-muted max-w-[80%]'
                }`}
              >
                {msg.content}
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter message..."
          className="flex-1"
        />
        <Button onClick={handleSend}>Send</Button>
      </div>
    </div>
  )
} 