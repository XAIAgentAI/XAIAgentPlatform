import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ModelChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [ws, setWs] = useState<WebSocket | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:3000/api/model-chat')
    
    websocket.onopen = () => {
      console.log('WebSocket连接已建立')
    }

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data)
      setMessages(prev => [...prev, { role: 'assistant', content: message.content }])
    }

    websocket.onclose = () => {
      console.log('WebSocket连接已关闭')
    }

    setWs(websocket)

    return () => {
      websocket.close()
    }
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || !ws) return

    const message: Message = {
      role: 'user',
      content: input
    }

    ws.send(JSON.stringify(message))
    setMessages(prev => [...prev, message])
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-screen p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">模型对话</h1>
      
      <Card className="flex-1 mb-4 p-4">
        <ScrollArea ref={scrollRef} className="h-[calc(100vh-200px)]">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-4 p-3 rounded-lg ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground ml-auto max-w-[80%]' 
                  : 'bg-muted max-w-[80%]'
              }`}
            >
              {msg.content}
            </div>
          ))}
        </ScrollArea>
      </Card>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息..."
          className="flex-1"
        />
        <Button onClick={handleSend}>发送</Button>
      </div>
    </div>
  )
} 