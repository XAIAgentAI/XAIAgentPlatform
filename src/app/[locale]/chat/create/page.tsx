'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import New from '@/components/create/New';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
  convid: string;
  agent: string;
}

export default function CreatePage() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState<string | null>(null); 
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("create.createAgent");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !userName) return;
    
    setIsLoading(true);
    setInput('');

    try {
      const response = await fetch(`/api/chat/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input, 
          user: userName, 
          thing: "message", 
          isNew: "yes", 
          convid: "1", 
          model: "DeepSeek V3", 
          agent: "Creator" 
        }),
      });

      await response.json();

    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="w-full max-w-4xl flex flex-col items-center">
        <New />
      </div>
    </div>
  );
}