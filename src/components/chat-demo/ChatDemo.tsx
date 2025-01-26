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
            console.log('Socket not initialized')
            return
        }

        console.log('Socket initialized:', socket.id)

        socket.on('connect', () => {
            setIsConnected(true)
            console.log('Connected to server, Socket ID:', socket.id)
        })

        socket.on('disconnect', () => {
            setIsConnected(false)
            console.log('Disconnected from server')
        })

        // Listen for message display events
        socket.on('display_message', (message: Message) => {
            console.log('Received display_message event:', JSON.stringify(message, null, 2))
            setMessages(prev => [...prev, message])
            setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
            }, 100)
        })

        // Listen for input control events
        socket.on('enable_user_input', () => {
            setIsInputEnabled(true)
        })

        socket.on('fetch_user_input', () => {
            setIsInputEnabled(true)
        })

        // Listen for error events
        socket.on('error', (error: any) => {
            console.error('Socket error:', error)
        })

        socket.on('connect_error', (error: any) => {
            console.error('Socket connection error:', error)
        })

        return () => {
            console.log('Cleaning up socket listeners')
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

        console.log('Sending message:', JSON.stringify(message, null, 2))
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
                            Disconnected from server
                        </div>
                    )}
                    {!isInputEnabled && isConnected && (
                        <div className="text-sm text-yellow-500 mt-2">
                            Waiting for response...
                        </div>
                    )}
                </div>
            </div>
        </Card>
    )
} 