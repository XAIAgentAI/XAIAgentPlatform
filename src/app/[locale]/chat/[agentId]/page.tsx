'use client';
import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowUpIcon, ArrowDownIcon, XMarkIcon } from '@heroicons/react/24/solid'; // 使用HeroIcons库中的向上箭头图标和退出图标
import Image from 'next/image';
import HeaderComponent from '@/components/chat/Header';
import MessagesComponent from '@/components/chat/Messages';
import InputComponent from '@/components/chat/Input';
import SideBar from '@/components/chat/SideBar';

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

// 定义agentDescriptions的类型
interface AgentDescription {
  metrics: string;
  prompt: string;
  examples: string[];
}

const agentDescriptions: { [key: string]: AgentDescription } = {
  'Scholar GPT': {
    metrics: 'DATA +45.67% | Market Cap: $222M',
    prompt: 'Enhance research with 200M+ resources and built-in critical reading skills. Access Google Scholar, PubMed, JSTOR, Arxiv, and more, effortlessly.',
    examples: [
      'Find the latest research about AI',
      'I\'ll provide a research paper link; Please review it critically.',
      'I\'ll upload a PDF paper; Use critical skills to read it.',
      'Type "ls" to list my built-in critical reading skills.'
    ]
  },
  'DeepSeek V3': {
    metrics: 'DATA +50.23% | Market Cap: $230M',
    prompt: 'Explore deep learning research with over 250M resources. Access specialized datasets and models.',
    examples: [
      'Find recent advancements in deep learning',
      'Review this research paper on neural networks.',
      'Analyze this PDF on convolutional neural networks.',
      'List my deep learning expertise.'
    ]
  },
  'DeepSeek R1': {
    metrics: 'DATA +48.33% | Market Cap: $225M',
    prompt: 'Dive into research on reinforcement learning. Access cutting-edge papers and models.',
    examples: [
      'Find the latest in reinforcement learning',
      'Critically review this research paper.',
      'Read this PDF on reinforcement learning.',
      'List my expertise in reinforcement learning.'
    ]
  },
  'Chatgpt o4': {
    metrics: 'DATA +44.67% | Market Cap: $220M',
    prompt: 'Conduct general research with GPT-4. Access a wide range of topics and resources.',
    examples: [
      'Find information on a general topic',
      'Review this research paper.',
      'Read this document.',
      'List my general research skills.'
    ]
  }
};

export default function ChatPage() {
  const params = useParams<ChatParams>();
  const agentId = params?.agentId;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('Scholar GPT');
  const [isAgentListOpen, setIsAgentListOpen] = useState(false);
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
    messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/chat/${agentId}/messages`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  }

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
        timestamp: data.timestamp
      }]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgentSelect = (agent: string) => {
    setSelectedAgent(agent);
    setIsAgentListOpen(false);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
      <div className="flex flex-col h-full px-2">
        <SideBar messages={messages} />
        {!messages.length && (
          <HeaderComponent 
            selectedAgent={selectedAgent} 
            handleAgentSelect={handleAgentSelect} 
            isAgentListOpen={isAgentListOpen} 
            setIsAgentListOpen={setIsAgentListOpen} 
            agentDescriptions={agentDescriptions} 
          />
        )}
          <MessagesComponent 
            setMessages={setMessages}
            messages={messages} 
            isLoading={isLoading} 
            messagesEndRef={messagesEndRef} 
          />
          <InputComponent 
            input={input} 
            setInput={setInput} 
            isLoading={isLoading} 
            handleSubmit={handleSubmit} 
          />
      </div>
  );
}