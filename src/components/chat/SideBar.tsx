'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid'; // 引入uuid库

interface SideBarProps {
  userName: string | null;
  setUserName: any;
  setConversations: any;
  setConvid: any;
  setIsNew: any;
  conversations: any;
  agent: string;
}

interface Sentence {
  convid: string;
  user?: string;
  assistant?: string;
  agent?: string;
  time?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string; // 假设后端返回timestamp字段
  convid: string;
  agent?: string;
}

const SideBar = ({ agent, conversations, setIsNew, setConvid, setConversations, userName, setUserName }: SideBarProps) => {
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [bgCopy, setBgCopy] = useState<string>('bg-stone-700');
  const [query, setQuery] = useState('');
  const [smallHidden, setSmallHidden] = useState('hidden');
  const [moreground, setMoreground] = useState('bg-stone-200');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const [goAnimate, setGoAnimate] = useState(false);
  
  const locale = useLocale();
  const t = useTranslations("chat");

  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages();
    }, 5000);
    return () => clearInterval(interval);
  }, ["1", userName]);

  const fetchMessages = async () => {
    if (true && userName) {
      try {
        const response = await fetch(`/api/chat/messages?user=${userName}`, {
          headers: { 'Content-Type': 'application/json' },
          method: 'GET',
        });
        
        const data: Sentence[] = await response.json();

        const newMessages: Message[] = data.map((sentence: Sentence) => ({
          id: uuidv4(),
          role: sentence.user ? 'user' : 'assistant',
          content: sentence.user || sentence.assistant || '',
          time: sentence.time || new Date().toISOString(), // 如果后端没有返回timestamp，则在此处生成
          convid: sentence.convid,
          agent: sentence.agent || ''
        }));
        //console.log(data)

        setMessages(newMessages);
        setGoAnimate(true); // 在设置消息之后设置动画
      } catch (error) {
        console.log("Your internet is not available");
      }
    }
  };

  useEffect(() => {
    if (query.length > 0) {
      const results = messages.filter(msg =>
        msg.content.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [query, messages]);

  const moreHandler = () => {
    setSmallHidden("transition-discrete duration-300 block flex z-20 w-[245px]");
    setMoreground("bg-stone-500");
  }

  const lessHandler = () => {
    setSmallHidden("hidden");
    setMoreground("bg-stone-300");
  }

  useEffect(()=>{
    const handleClickOutside = (event: MouseEvent) => {
      if(smallHidden !== "hidden" && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)){
        setSmallHidden("hidden");
      }
    };

    // 如果侧边栏不是隐藏状态，则添加事件监听器
    if (smallHidden !== "hidden") {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // 清理事件监听器，防止内存泄漏
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  },[smallHidden])

  // 修改消息点击处理函数
  const handleConversationClick = (convid: string) => {
    setIsNew("no");
    setConvid(convid);
    const conversationMessages = messages.filter(msg => msg.convid === convid);
    setConversations({
      ["1"]: conversationMessages
    });
    console.log(conversations);
  }

  // 对messages进行分组---选择特定agent;每个convid只取第一条消息
  let specificMessages = messages.filter(msg => msg.agent === agent);
  let uniqueConversations = Array.from(new Set(specificMessages.map(msg => msg.convid)))
  .map(convid => specificMessages.find(msg => msg.convid === convid));

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.95 }}
        className="fixed top-[116px] left-[calc(1.9vw+16px)] md:left-[calc(2.6vw+10px)] lg:hidden"
        onClick={moreHandler}
      >
        <Menu></Menu>
      </motion.button>
      <div ref={sidebarRef} className={`fixed z-20 top-[114px] lg:top-[70px] xl:left-[1.6vw] 2xl:top-[70px] ${smallHidden} lg:flex flex-col lg:w-[20vw] bg-[#E9E9E9] dark:bg-[rgb(22,22,22)] p-4 text-white h-[calc(98vh-105px)] lg:h-[calc(97vh-88px)] rounded-md`} style={{zIndex:12000}}>
        <div className="flex justify-between">
        <div className="self-start w-full relative -top-[10px]">
        <svg style={{zIndex:66666}} className="translate-y-[30.4px] translate-x-3 relative text-foreground" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 17C13.866 17 17 13.866 17 10C17 6.13401 13.866 3 10 3C6.13401 3 3 6.13401 3 10C3 13.866 6.13401 17 10 17Z" stroke="white" stroke-width="1"/>
          <path d="M15 15L21 21" stroke="white" stroke-width="1" stroke-linecap="round"/>
        </svg>   
          <input
            type="text"
            placeholder="Search history"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-[94%] lg:w-full h-9 placeholder:text-[rgba(22,22,22,0.5)] dark:placeholder:text-stone-200 text-neutral-700 dark:text-gray-200 pl-10 focus:outline-none rounded-full bg-gray-100/70 dark:bg-black/40 backdrop-blur-sm border border-gray-300/50 dark:border-gray-600/30 focus:ring-1 focus:ring-[#222222] transition duration-300"
          />
        </div>
          <motion.button
           whileTap={{ scale: 0.95 }}
           className="relative lg:hidden"
           onClick={lessHandler}
          >
            <Menu></Menu>
          </motion.button>
        </div>
        <div className="flex flex-col flex-1 space-y-2 overflow-y-auto my-4 hide-scrollbar">
          {query.length > 0 ? (
            searchResults.map((msg) => (
              <div key={msg.id} onClick={() => handleConversationClick(msg.convid)} className="pl-1 py-1 w-full text-[#222222] dark:text-white rounded-md hover:bg-[#EDEDED] dark:hover:bg-zinc-800">
                {msg.content.substring(0, 12)}
              </div>
            ))
          ) : (
            <>
              <div className="text-sm mt-[-2px] mb-[-2] text-[rgba(22,22,22,0.4)] dark:text-white">{t("7daysago")}</div>
              {goAnimate? (
                <>
                  {uniqueConversations.map((msg: any) => (
                    <div key={msg.convid} onClick={() => handleConversationClick(msg.convid)} className="ml-[-1] pl-2 py-1 w-full text-[#222222] dark:text-white rounded-md hover:bg-[#EDEDED] dark:hover:bg-zinc-800">
                      {msg.content.substring(0, 12) + "..."}
                    </div>
                  ))}
                </>
              ) : (
                <div className="flex justify-start items-center h-[10px] gap-2 ml-1">
                  <div className="w-2 h-2 rounded-full bg-[#dedede] animate-pulse-ball"></div>
                  <div className="w-2 h-2 rounded-full bg-[#dedede] animate-pulse-ball" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-2 rounded-full bg-[#dedede] animate-pulse-ball" style={{ animationDelay: "0.4s" }}></div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default SideBar;
