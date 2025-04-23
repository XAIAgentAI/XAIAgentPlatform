'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import New from '@/components/create/New';
import MessagesComponent from '@/components/chat/Messages';
import InputComponent from '@/components/chat/Input';
import SideBar from '@/components/chat/SideBar';
import { useLocale, useTranslations } from 'next-intl';
import { GradientBorderButton } from "@/components/ui-custom/gradient-border-button";
import AgentSelector from '@/components/chat/AgentSelector'; 
import { useSearchParams } from 'next/navigation';
import { fetchDBCTokens } from "@/hooks/useDBCScan"
import { LocalAgent } from "@/types/agent"
import { agentAPI } from "@/services/api"
import { transformToLocalAgent, updateAgentsWithPrices, updateAgentsWithTokens } from "@/services/agentService"

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
  convid: string;
  agent: string;
}

// 新增Sentence接口
interface Sentence {
  user?: string; 
  assistant?: string;
  convid: string;
  agent: string;
  time?: string;
}

interface Conversations {
  [id: string]: Message[];
}

// 定义路由参数的类型
type ChatParams = {
  locale: string;
  agentId: string;
}

// 定义agentDescriptions的类型
interface AgentDescription {
  prompt: string;
  examples: string[];
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const prompt = searchParams?.get('prompt') || '';
  const [conversations, setConversations] = useState<{ [id: string]: Message[] }>({});
  const [agentMarket,setAgentMarket] = useState<LocalAgent[]>([])
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [convid, setConvid] = useState<string>("");
  const [isNew, setIsNew] = useState<string>("yes");
  const [agent, setAgent] = useState<string>("StyleID");
  const [isAgentListOpen, setIsAgentListOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null); 
  const [userStatus, setUserStatus] = useState<boolean>(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const locale = useLocale();
  const t = useTranslations("chat");

  // 获取代理列表
  const fetchAgentsData = async () => {
    try {
      // 并行获取 agents 和 tokens 数据
      const [response, tokens] = await Promise.all([
        agentAPI.getAllAgents({ pageSize: 30 }),
        fetchDBCTokens()
      ]);

      if (response.code === 200 && response.data?.items) {
        // 转换数据
        let agents = response.data.items.map(transformToLocalAgent);

        // 更新价格信息
        agents = await updateAgentsWithPrices(agents);

        // 更新代币持有者信息
        if (tokens.length > 0) {
          agents = updateAgentsWithTokens(agents, tokens);
        }

        setAgentMarket(agents);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };

  useEffect(() => {
    fetchAgentsData();
  }, []);
    
  const agentDescriptions: { [key: string]: AgentDescription } = {
    'Xaiagent': {
      prompt: t("data.Xaiagent.description"),
      examples: [
        t("data.Xaiagent.prompts.0"),
        t("data.Xaiagent.prompts.1"),
        t("data.Xaiagent.prompts.2"),
        t("data.Xaiagent.prompts.3")
      ]
    },
    'StyleID': {
      prompt: t("data.StyleID.description"),
      examples: [
        t("data.StyleID.prompts.0"),
        t("data.StyleID.prompts.1"),
        t("data.StyleID.prompts.2"),
        t("data.StyleID.prompts.3")
      ]
    },
    'LogoLift': {
      prompt: t("data.LogoLift.description"),
      examples: [
        t("data.LogoLift.prompts.0"),
        t("data.LogoLift.prompts.1"),
        t("data.LogoLift.prompts.2"),
        t("data.LogoLift.prompts.3")
      ]
    },
    'PicSpan': {
      prompt: t("data.PicSpan.description"),
      examples: [
        t("data.PicSpan.prompts.0"),
        t("data.PicSpan.prompts.1"),
        t("data.PicSpan.prompts.2"),
        t("data.PicSpan.prompts.3")
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
      time: new Date().toISOString(),
      convid: convid,
      agent: agent
    };

    setConversations(prev => ({ ...prev, ["1"]: [...(prev["1"] || []), userMessage] }));
    setInput('');
    setIsLoading(true);

    try {
      console.log(isNew);
      const response = await fetch(`/api/chat/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, user: userName, thing: "message", isNew: isNew, convid: convid, model: "DeepSeek V3", agent: agent }),
      });

      const data: Sentence = await response.json();
      const aiMessage: Message = {
        id: `${data.convid}-${Date.now()}`, // 使用convid和当前时间戳确保唯一性
        role: 'assistant',
        content: data.assistant || '',
        time: data.time || "",
        convid: data.convid,
        agent: data.agent
      };

      setConversations(prev => ({ ...prev, ["1"]: [...(prev["1"] || []), aiMessage] }));

    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
      setIsNew("no");
    }
  };

  const handleAgentSelect = (agent: string) => {
    setIsNew("yes");
    setIsLoading(false);
    setIsLoadingImage(false);
    setAgent(agent);
    setConversations((prev: Conversations): Conversations => {
      const newConversations = { ...prev };
      newConversations["1"] = [];
      return newConversations;
    });
    setTimeout(()=>{setIsAgentListOpen(false)},200);
  };

  const handleAuth = async () => {
    const response = await fetch('/api/chat/messages', {
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
    <div className="2xs-[77vh] flex flex-col md:h-[80vh] px-2 bg-background">
      <SideBar agent={agent} conversations={conversations} setIsNew={setIsNew} setConvid={setConvid} setConversations={setConversations} userName={userName} setUserName={setUserName} setIsLoading={setIsLoading}/>
      {!conversations["1"]?.length && (
        <New></New>
      )}
      {conversations["1"]?.length > 0 && (<MessagesComponent 
        agent={agent}
        userName={userName}
        conversations={conversations}
        setConversations={setConversations}
        isLoading={isLoading} 
        isLoadingImage={isLoadingImage}
        messagesEndRef={messagesEndRef} 
        setIsNew={setIsNew}
      />)}
      <InputComponent 
        convid={convid}
        setConversations={setConversations}
        isNew={isNew}
        agent={"Xaiagent"}
        setIsLoading={setIsLoading}
        setIsLoadingImage={setIsLoadingImage}
        setagent={setAgent}
        prompt={prompt}
        conversations={conversations}
        setIsNew={setIsNew}
        input={input} 
        setInput={setInput} 
        setUserStatus={setUserStatus}
        userName={userName}
        isLoading={isLoading} 
        handleSubmit={handleSubmit} 
      />
    </div>
  );
}
