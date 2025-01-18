'use client'

import { useEffect, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSocket } from '@/lib/socket'

type Message = {
    role?: 'user' | 'assistant' | 'system'
    content: string
    name: string
    url?: string | string[]
    run_id?: string
    agent_id?: string
    id?: string
    metadata?: any
    timestamp?: string
}

export default function ChatDemo() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isConnected, setIsConnected] = useState(false)
    const [isInputEnabled, setIsInputEnabled] = useState(true)
    const scrollRef = useRef<HTMLDivElement>(null)
    const socket = useSocket()

    useEffect(() => {
        if (!socket) {
            console.log('Socket未初始化')
            return
        }

        console.log('Socket已初始化:', socket.id)

        socket.on('connect', () => {
            setIsConnected(true)
            console.log('已连接到服务器, Socket ID:', socket.id)
        })

        socket.on('disconnect', () => {
            setIsConnected(false)
            console.log('与服务器断开连接')
        })

        // 监听消息显示事件
        socket.on('display_message', (message: Message) => {
            console.log('收到display_message事件:', JSON.stringify(message, null, 2))
            setMessages(prev => [...prev, message])
            setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
            }, 100)
        })

        // 监听输入控制事件
        socket.on('enable_user_input', () => {
            setIsInputEnabled(true)
        })

        socket.on('fetch_user_input', () => {
            setIsInputEnabled(true)
        })

        // 监听错误事件
        socket.on('error', (error: any) => {
            console.error('Socket错误:', error)
        })

        socket.on('connect_error', (error: any) => {
            console.error('Socket连接错误:', error)
        })

        return () => {
            console.log('清理socket监听器')
            socket.off('connect')
            socket.off('disconnect')
            socket.off('display_message')
            socket.off('enable_user_input')
            socket.off('fetch_user_input')
            socket.off('error')
            socket.off('connect_error')
        }
    }, [socket])

    const handleSend = () => {
        if (!input.trim() || !socket || !isInputEnabled) return

        const message: Message = {
            run_id: "run_20250118-182748_twsumb",
            agent_id: "8317a1cf00404b70b07653d1831de27e",
            name: "User",
            role: "user",
            url: [],
            content: input.trim(),
            timestamp: new Date().toISOString()
        }

        console.log('发送消息:', JSON.stringify(message, null, 2))
        socket.emit('user_input_ready', message)
        setInput('')
        setIsInputEnabled(false)
        setTimeout(() => {
            scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <Card className="flex flex-col w-full max-w-4xl mx-auto my-8">
            <div className="flex flex-col h-[600px]">
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {messages.map((msg, i) => {
                            const isUser = msg.role === "user"
                            return (
                                <div
                                    key={i}
                                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-lg p-3 ${
                                            isUser
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="font-medium">{msg.name}</div>
                                            {msg.timestamp && (
                                                <div className="text-xs opacity-50">
                                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-1 whitespace-pre-wrap">{msg.content}</div>
                                        {msg.url && (
                                            <div className="mt-2">
                                                {Array.isArray(msg.url) ? (
                                                    msg.url.map((url, i) => (
                                                        <a
                                                            key={i}
                                                            href={url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-500 hover:underline block"
                                                        >
                                                            {url}
                                                        </a>
                                                    ))
                                                ) : (
                                                    <a
                                                        href={msg.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-500 hover:underline"
                                                    >
                                                        {msg.url}
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>
                <div className="p-4 border-t">
                    <div className="flex gap-2">
                        <Input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message..."
                            className="flex-1"
                            disabled={!isInputEnabled}
                        />
                        <Button 
                            onClick={handleSend} 
                            disabled={!isConnected || !isInputEnabled}
                        >
                            Send
                        </Button>
                    </div>
                    {!isConnected && (
                        <div className="text-sm text-red-500 mt-2">
                            与服务器断开连接
                        </div>
                    )}
                    {!isInputEnabled && isConnected && (
                        <div className="text-sm text-yellow-500 mt-2">
                            等待响应中...
                        </div>
                    )}
                </div>
            </div>
        </Card>
    )
} 