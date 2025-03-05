'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowUpIcon, ArrowDownIcon, XMarkIcon } from '@heroicons/react/24/solid'; // 使用HeroIcons库中的向上箭头图标和退出图标
import Image from 'next/image';
import HeaderComponent from '@/components/chat/Header';
import MessagesComponent from '@/components/chat/Messages';
import InputComponent from '@/components/chat/Input';
import SideBar from '@/components/chat/SideBar';
import AuthButton from '@/components/chat/SignUp'; // 假设SignUp.tsx导出了一个名为AuthButton的组件

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// 新增Sentence接口
interface Sentence {
  user?: string; 
  assistant?: string;
  convid: string;
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
  const [conversations, setConversations] = useState<{ [id: string]: Message[] }>({});
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('Scholar GPT');
  const [isAgentListOpen, setIsAgentListOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null); // 新增userName状态
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 获取历史消息
  useEffect(() => {
    if (agentId) {
      fetchMessages();
    }
  }, [agentId]);

  // 自动滚动到最新消息
  useEffect(() => {
    if (conversations[agentId]?.length > 0) {
      scrollToBottom();
    }
  }, [conversations, agentId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  const fetchMessages = async () => {
    if (!agentId) return;

    try {
      const response = await fetch(`/api/chat/${agentId}/messages`, {
        headers: { 'Content-Type': 'application/json' },
        method: 'GET',
      });
      
      const data: Sentence[] = await response.json();
      
      // 将后端Sentence数组转换为前端Message数组
      const messages: Message[] = data.map((sentence: Sentence) => ({
        id: `${sentence.convid}-${Date.now()}`, // 使用convid和当前时间戳确保唯一性
        role: sentence.user ? 'user' : 'assistant',
        content: sentence.user || sentence.assistant || '', // 确保content字段不为undefined
        timestamp: new Date().toISOString(),
      }));

      setConversations(prev => ({ ...prev, [agentId]: messages }));
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !userName) return;
    
    const userMessage: Message = {
      id: `${Date.now()}-${userName}`, // 使用当前时间和用户名确保唯一性
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setConversations(prev => ({ ...prev, [agentId]: [...(prev[agentId] || []), userMessage] }));
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`/api/chat/${agentId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, user: userName, thing: "message", isNew: "yes" }),
      });

      const data: Sentence = await response.json();
      const aiMessage: Message = {
        id: `${data.convid}-${Date.now()}`, // 使用convid和当前时间戳确保唯一性
        role: 'assistant',
        content: data.assistant || '',
        timestamp: new Date().toISOString(),
      };

      setConversations(prev => ({ ...prev, [agentId]: [...(prev[agentId] || []), aiMessage] }));

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

  return (
    <div className="2xs-[77vh] flex flex-col md:h-[80vh] px-2">
      <SideBar conversations={conversations} setUserName={setUserName} userName={userName}/>
      {!conversations[agentId]?.length && (
        <HeaderComponent 
          agentId={agentId}
          setIsLoading={setIsLoading}
          selectedAgent={selectedAgent} 
          handleAgentSelect={handleAgentSelect} // 修改这里，应该是handleAgentSelect
          isAgentListOpen={isAgentListOpen} 
          setIsAgentListOpen={setIsAgentListOpen} 
          agentDescriptions={agentDescriptions} 
          conversations={conversations}
          setConversations={setConversations}
        />
      )}
      <MessagesComponent 
        userName={userName}
        conversations={conversations}
        setConversations={setConversations}
        isLoading={isLoading} 
        agentId={agentId}
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
