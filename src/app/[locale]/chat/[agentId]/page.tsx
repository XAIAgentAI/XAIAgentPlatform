'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowUpIcon, ArrowDownIcon, XMarkIcon } from '@heroicons/react/24/solid'; // 使用HeroIcons库中的向上箭头图标和退出图标
import Image from 'next/image';
import HeaderComponent from '@/components/chat/Header';
import MessagesComponent from '@/components/chat/Messages';
import InputComponent from '@/components/chat/Input';
import SideBar from '@/components/chat/SideBar';
import { useLocale, useTranslations } from 'next-intl';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  convid: string;
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

export default function ChatPage() {
  const params = useParams<ChatParams>();
  const agentId = params?.agentId;
  const [conversations, setConversations] = useState<{ [id: string]: Message[] }>({});
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [convid, setConvid] = useState<string>("");
  const [isNew, setIsNew] = useState<string>("yes");
  const [selectedAgent, setSelectedAgent] = useState('Scholar GPT');
  const [isAgentListOpen, setIsAgentListOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null); 
  const [userStatus, setUserStatus] = useState<boolean>(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const locale = useLocale();
  const t = useTranslations("chat");
    
  const agentDescriptions: { [key: string]: AgentDescription } = {
    'Scholar GPT': {
      metrics: t("Data.Scholar GPT.metrics"),
      prompt: t("Data.Scholar GPT.prompt"),
      examples: [
        t("Data.Scholar GPT.examples.0"),
        t("Data.Scholar GPT.examples.1"),
        t("Data.Scholar GPT.examples.2"),
        t("Data.Scholar GPT.examples.3")
      ]
    },
    'DeepSeek V3': {
      metrics: t("Data.DeepSeek V3.metrics"),
      prompt: t("Data.DeepSeek V3.prompt"),
      examples: [
        t("Data.DeepSeek V3.examples.0"),
        t("Data.DeepSeek V3.examples.1"),
        t("Data.DeepSeek V3.examples.2"),
        t("Data.DeepSeek V3.examples.3")
      ]
    },
    'DeepSeek R1': {
      metrics: t("Data.DeepSeek R1.metrics"),
      prompt: t("Data.DeepSeek R1.prompt"),
      examples: [
        t("Data.DeepSeek R1.examples.0"),
        t("Data.DeepSeek R1.examples.1"),
        t("Data.DeepSeek R1.examples.2"),
        t("Data.DeepSeek R1.examples.3")
      ]
    },
    'Chatgpt o4': {
      metrics: t("Data.Chatgpt o4.metrics"),
      prompt: t("Data.Chatgpt o4.prompt"),
      examples: [
        t("Data.Chatgpt o4.examples.0"),
        t("Data.Chatgpt o4.examples.1"),
        t("Data.Chatgpt o4.examples.2"),
        t("Data.Chatgpt o4.examples.3")
      ]
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !userName) return;
    
    const userMessage: Message = {
      id: `${Date.now()}-${userName}`, // 使用当前时间和用户名确保唯一性
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
      convid: convid
    };

    setConversations(prev => ({ ...prev, [agentId]: [...(prev[agentId] || []), userMessage] }));
    setInput('');
    setIsLoading(true);

    try {
      console.log(isNew);
      const response = await fetch(`/api/chat/${agentId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, user: userName, thing: "message", isNew: isNew }),
      });

      const data: Sentence = await response.json();
      const aiMessage: Message = {
        id: `${data.convid}-${Date.now()}`, // 使用convid和当前时间戳确保唯一性
        role: 'assistant',
        content: data.assistant || '',
        timestamp: new Date().toISOString(),
        convid: data.convid
      };

      setConversations(prev => ({ ...prev, [agentId]: [...(prev[agentId] || []), aiMessage] }));

    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
      setIsNew("no");
    }
  };

  const handleAgentSelect = (agent: string) => {
    setSelectedAgent(agent);
    setIsAgentListOpen(false);
  };

  const handleAuth = async () => {
    const response = await fetch('/api/chat/1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        thing: 'signup',
      })
    });

    const data = await response.json();
    const username = data.message;
    
    if (data.success) {
      setUserName(username); // 更新用户名
      localStorage.setItem('chat-username', username); // 存储用户名到localStorage
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('chat-username')) {
      handleAuth();
    } else {
      setUserName(localStorage.getItem('chat-username'));
    }
  }, []); // 空数组作为依赖项，确保只在组件初始化时执行一次

  return (
    <div className="2xs-[77vh] flex flex-col md:h-[80vh] px-2">
      <SideBar conversations={conversations} setIsNew={setIsNew} setConvid={setConvid} setConversations={setConversations} agentId={agentId} userName={userName} setUserName={setUserName}/>
      {!conversations[agentId]?.length && (
        <HeaderComponent 
          userName={userName}
          setUserName={setUserName}
          agentId={agentId}
          setIsLoading={setIsLoading}
          selectedAgent={selectedAgent} 
          handleAgentSelect={handleAgentSelect} // 修改这里，应该是handleAgentSelect
          isAgentListOpen={isAgentListOpen} 
          setIsAgentListOpen={setIsAgentListOpen} 
          agentDescriptions={agentDescriptions} 
          conversations={conversations}
          setConversations={setConversations}
          setUserStatus={setUserStatus}
          convid={convid}
          setIsNew={setIsNew}
        />
      )}
      {!userStatus && (
        <div className="border-2 px-4 border-solid border-stone-400 fixed w-auto top-[100px] left-[50vw] bg-stone-300 dark:bg-stone-700 rounded-lg p-4 text-center text-stone-900 transform -translate-x-1/2 -translate-y-1/2 flex items-center align-center">
          <p className="text-center h-[24px]">Please Connect a Wallet First</p>
        </div>
      )}
      <MessagesComponent 
        userName={userName}
        conversations={conversations}
        setConversations={setConversations}
        isLoading={isLoading} 
        agentId={agentId}
        messagesEndRef={messagesEndRef} 
        setIsNew={setIsNew}
      />
      <InputComponent 
        conversations={conversations}
        setIsNew={setIsNew}
        input={input} 
        agentId={agentId}
        setInput={setInput} 
        setUserStatus={setUserStatus}
        userName={userName}
        isLoading={isLoading} 
        handleSubmit={handleSubmit} 
      />
    </div>
  );
}
