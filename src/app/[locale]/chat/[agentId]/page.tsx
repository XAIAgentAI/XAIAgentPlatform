'use client';

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
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
    fetchMessages();
  }, [agentId]);

  // 自动滚动到最新消息
  useEffect(() => {
    scrollToBottom();
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
      {/* Chat header */}
      <div className="border-b border-border-color bg-card-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-xl font-semibold text-primary">AI Agent Chat</h1>
        </div>
      </div>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto bg-background">
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
      <div className="border-t border-border-color bg-card-background">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="flex space-x-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-full border border-border-color bg-background px-4 py-2 text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-t-2 border-primary-foreground rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 