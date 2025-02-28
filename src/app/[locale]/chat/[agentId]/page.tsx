'use client';
import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowUpIcon, ArrowDownIcon, XMarkIcon } from '@heroicons/react/24/solid'; // 使用HeroIcons库中的向上箭头图标和退出图标
import Image from 'next/image';

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

      {/* Header and Prompt section */}
      {!messages.length && (
        <div className="flex flex-col items-center justify-center h-[65vh] space-y-2 mt-4">
          {/* Agent Selection */}
          <div className="relative w-full max-w-sm">
            <button
              type="button"
              className="flex items-center justify-between px-2 py-1 bg-zinc-800 text-zinc-700 rounded-full fixed left-[4vw] top-16"
              onClick={() => setIsAgentListOpen(!isAgentListOpen)}
            >
              {selectedAgent}
              {isAgentListOpen ? (
                <ArrowUpIcon className="w-4 h-4 text-zinc-700" />
              ) : (
                <ArrowDownIcon className="w-4 h-4 text-zinc-700" />
              )}
            </button>
            {isAgentListOpen && (
              <div className="fixed top-[100px] left-4 w-[26vw] max-w-[150px] bg-zinc-800 rounded-b-lg shadow-lg">
                <button
                  type="button"
                  className="flex items-center justify-between w-full px-4 py-2 text-zinc-700 hover:bg-zinc-700 hover:text-white"
                  onClick={() => handleAgentSelect('Scholar GPT')}
                >
                  Scholar GPT
                </button>
                <button
                  type="button"
                  className="flex items-center justify-between w-full px-4 py-2 text-zinc-700 hover:bg-zinc-700 hover:text-white"
                  onClick={() => handleAgentSelect('DeepSeek V3')}
                >
                  DeepSeek V3
                </button>
                <button
                  type="button"
                  className="flex items-center justify-between w-full px-4 py-2 text-zinc-700 hover:bg-zinc-700 hover:text-white"
                  onClick={() => handleAgentSelect('DeepSeek R1')}
                >
                  DeepSeek R1
                </button>
                <button
                  type="button"
                  className="flex items-center justify-between w-full px-4 py-2 text-zinc-700 hover:bg-zinc-700 hover:text-white"
                  onClick={() => handleAgentSelect('Chatgpt o4')}
                >
                  Chatgpt o4
                </button>
              </div>
            )}
          </div>

          <div className="w-24 h-24 overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="12" stroke="white" strokeWidth="0.5" fill="white" />
            </svg>
          </div>
          <p className="text-lg font-semibold">{selectedAgent}</p>
          <p className="text-md">{agentDescriptions[selectedAgent].metrics}</p>
          <p className="text-sm text-neutral-700">Created by: app.xaiagent.com</p>
          <div className="mt-6 flex flex-col items-center justify-center space-y-2">
            <p className="text-center">{agentDescriptions[selectedAgent].prompt}</p>
            <div className="flex flex-wrap justify-center gap-4">
              {agentDescriptions[selectedAgent].examples.map((example, index) => (
                <div key={index} className="rounded-xl bg-zinc-800 px-4 py-6 text-zinc-700 text-sm flex items-center justify-center w-[210px] md:w-[200px] lg:w-19vw min-h-[4rem]">
                  {example}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header for messages section */}
      {messages.length > 0 && (
        <div className="flex justify-end items-center p-4 bg-background w-full md:w-[80vw]">
          <button
            type="button"
            className="flex items-center justify-center px-2 py-1 bg-zinc-800 text-zinc-700 rounded-full"
            onClick={clearMessages}
          >
            <XMarkIcon className="w-4 h-4 text-zinc-700" />
          </button>
        </div>
      )}

      {/* Messages container */}
      <div className="flex flex-col flex-grow bg-background w-full md:w-[80vw] px-2 py-6">
        <div className="flex flex-col space-y-6">
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
      <div className="bg-card-background fixed bottom-10 w-full">
        <div className="max-w-3xl mx-auto px-4 py-4 w-full">
          <form onSubmit={handleSubmit} className="w-full">
            <div className="w-full relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Send a message"
                className="w-full rounded-full bg-zinc-800 px-4 py-2 text-primary placeholder-text-tertiary focus:outline-none border-none focus:text-slate-200 focus:caret-slate-200 pr-10"
                disabled={isLoading}
              />
              <button
                type="submit" 
                disabled={isLoading}
                className="absolute right-[4px] top-1 opacity-40 z-2 w-8 h-8 rounded-full bg-slate-200 focus:outline-none focus:opacity-90 focus:border-primary"
              >
                {isLoading ? (
                  <Image
                    src="/images/vector.png"
                    alt="Submitting"
                    width={32}
                    height={32}
                    className="z-2000 absolute bottom-1 text-slate-100 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  />
                ) : (
                  <ArrowUpIcon className="z-2000 absolute bottom-1 text-slate-100 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                )}
              </button>
            </div>
          </form>
          <div className="mt-2 text-center text-neutral-700 text-xs">AI Agent might make mistakes. Please check important information.</div>
        </div>
      </div>
    </div>
  );
}
