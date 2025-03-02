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
      {/* Header and Prompt section */}
      {!messages.length && (
        <div className="flex flex-col items-center justify-center h-[65vh] space-y-2 mt-4 md:justify-start">
          {/* Agent Selection */}
          <div className="relative w-full max-w-sm md:w-[80vw] md:ml-[18vw]">
            <button
              type="button"
              className="flex items-center justify-between px-2 py-1 bg-zinc-800 text-zinc-700 rounded-full fixed left-[4vw] md:left-[11vw] lg:left-[16vw] xl:left-[calc(21vw+6%)] top-16"
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
              <div className="fixed top-[100px] left-[1.84vw] md:left-[9.6vw] lg:left-[14.6vw] xl:left-[26.2vw] w-[26vw] max-w-[150px] bg-zinc-800 rounded-b-lg shadow-lg">
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
          
          <div className="ml-auto md:ml-42 md:pl-26">
              <div className="w-24 h-24 overflow-scroll mx-auto">
              <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="12" stroke="white" strokeWidth="0.5" fill="white" />
              </svg>
              </div>
              <p className="text-lg font-semibold text-center">{selectedAgent}</p> {/* 添加text-center以居中 */}
              <p className="text-md text-center">{agentDescriptions[selectedAgent].metrics}</p> {/* 添加text-center以居中 */}
              <p className="text-sm text-neutral-700 text-center">Created by: {/* 添加text-center以居中 */}
                  <a className="underline text-sm text-neutral-700" href="https://app.xaiagent.com">app.xaiagent.com</a>
              </p>
              <div className="mt-6 flex flex-col items-center justify-center space-y-2">
                  <p className="text-center min-w-[75vw]">{agentDescriptions[selectedAgent].prompt}</p>
                  <div className="flex flex-wrap justify-center gap-4">
                      {agentDescriptions[selectedAgent].examples.map((example, index) => (
                          <div key={index} className="rounded-xl bg-zinc-800 px-4 py-6 text-zinc-700 text-sm flex items-center justify-center w-[210px] md:w-[200px] lg:w-19vw min-h-[4rem]">
                              {example}
                          </div>
                      ))}
                  </div>
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
      <div className="flex flex-col flex-grow bg-background w-full md:w-[80vw] md:ml-[18vw] px-2 py-6">
        <div className="flex flex-col space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-gray-600 text-white' // 用户消息，灰色背景，白色字体
                    : 'text-white' // 助手消息，白色字体，无背景色
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-white/70' : 'text-white/70' // 修改为可视化白色的淡色
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="fixed bottom-12 w-[97vw] ml-auto">
      <div className="max-w-3xl px-4 py-4 w-full rounded-2xl md:w-[calc(100%_-_160px)] md:ml-auto md:mr-[calc(4vw+10px)] lg:ml-auto lg:mr-[calc(4.2vw)] xl:ml-auto xl:mr-[calc(8vw-0.8%)]">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="w-full relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Send a message"
            className="w-full font-light rounded-full bg-zinc-800 px-4 py-2 text-primary placeholder-text-tertiary focus:outline-none border-none focus:text-slate-200 focus:caret-slate-200 pr-10"
            disabled={isLoading}
          />
        </div>
      </form>
      <div className="mt-2 text-center text-neutral-700 text-xs">AI agent might make mistakes. Please check important information.</div>
      </div>
      </div>
    </div>
  );
}
