'use client';
import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// 定义路由参数的类型
type ChatParams = {
  locale: string;
  agentId: string;
}

export default function ChatPage() {
  const params = useParams<ChatParams>();
  const agentId = params?.agentId;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 获取历史消息
  useEffect(() => {
    if (agentId) {
      fetchMessages();
    }
  }, [agentId]);

  // 自动滚动到最新消息
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/chat/${agentId}/messages`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`/api/chat/${agentId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      setMessages(prev => [...prev, {
        id: data.id,
        role: 'assistant',
        content: data.content,
        timestamp: data.timestamp,
      }]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">

      {/* Messages container */}
      <div className="flex overflow-y-auto float-right bg-background w-[80vw] h-[calc(90vh-4rem)]">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-primary-light text-primary'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-primary-foreground/70' : 'text-primary/70'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input form - Fixed at bottom */}
      <div className="bg-card-background">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="space-x-4">
            <div className="flex content-around gap-5 w-[calc(100vw-8rem)] md:w-[66vw] float-right">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Send a message"
              className="w-[80%] opacity-60 rounded-full bg-zinc-800 px-4 py-2 text-primary placeholder-text-tertiary focus:outline-none border-none focus:text-slate-200 focus:caret-slate-200"
              disabled={isLoading}
            />
            <button
              type="submit" 
              disabled={isLoading}
              className="opacity-40 w-8 h-8 rounded-full relative bg-slate-200 text-primary-foreground focus:outline-none focus:opacity-90 focus:border-primary top-1 right-14"
            >
             {isLoading ? (
                <img src="/public/images/vector.png"></img>
              ) : (
                <img src="/public/images/vector.png" className="z-2000"></img>
             )}
            </button>
            </div>
          </form>
          <div className="ml-[19vw] mt-4 text-xs text-neutral-700 text-sm mx:auto">AI Agent you can make mistakes. Please check important information.</div>
        </div>
      </div>
    </div>
  );
}