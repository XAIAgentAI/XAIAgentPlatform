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
      <div ref={sidebarRef} className={`fixed z-20 top-[114px] lg:top-[70px] xl:left-[1.6vw] 2xl:top-[70px] ${smallHidden} lg:flex flex-col lg:w-[20vw] bg-stone-200 dark:bg-zinc-800 p-4 text-white h-[calc(98vh-105px)] lg:h-[calc(97vh-88px)] rounded-md`} style={{zIndex:12000}}>
        <div className="flex justify-between">
        <div className="self-start w-full relative">
        <svg className="icon absolute top-1/2 transform -translate-y-1/2 left-2 w-5 h-5 text-stone-400" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4803" width="16" height="20"><path d="M212.194304 726.972416c33.760256 33.760256 73.08288 60.269568 116.876288 78.792704 45.357056 19.18464 93.518848 28.911616 143.147008 28.911616s97.788928-9.728 143.145984-28.911616c25.648128-10.848256 49.750016-24.457216 72.112128-40.63744l156.345344 156.484608c6.677504 6.683648 15.43168 10.025984 24.18688 10.025984 8.74496 0 17.490944-3.334144 24.1664-10.00448 13.35808-13.345792 13.36832-34.994176 0.021504-48.35328L739.03616 719.985664c30.533632-32.160768 54.736896-69.082112 71.99744-109.889536 19.183616-45.357056 28.911616-93.518848 28.911616-143.147008s-9.728-97.789952-28.911616-143.147008c-18.523136-43.792384-45.033472-83.115008-78.792704-116.876288-33.76128-33.760256-73.083904-60.270592-116.876288-78.793728-45.35808-19.18464-93.518848-28.911616-143.147008-28.911616s-97.789952 9.728-143.147008 28.911616c-43.793408 18.523136-83.116032 45.033472-116.876288 78.793728s-60.269568 73.083904-78.792704 116.876288c-19.183616 45.357056-28.911616 93.518848-28.911616 143.147008s9.728 97.789952 28.911616 143.147008C151.923712 653.888512 178.434048 693.21216 212.194304 726.972416zM260.547584 255.279104c56.539136-56.539136 131.710976-87.676928 211.670016-87.676928 79.958016 0 155.13088 31.137792 211.670016 87.676928s87.675904 131.710976 87.675904 211.670016S740.425728 622.08 683.887616 678.619136c-56.539136 56.539136-131.712 87.676928-211.670016 87.676928-79.95904 0-155.13088-31.136768-211.670016-87.675904s-87.675904-131.712-87.675904-211.670016S204.008448 311.81824 260.547584 255.279104z" fill="#cdcdcd" p-id="4804"></path></svg>
          <input
            type="text"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-[94%] h-[32px] placeholder:text-[#cdcdcd] text-neutral-700 pl-8 focus:outline-none rounded-sm focus:ring-1 focus:ring-stone-300 focus:border-stone-300 transition duration-300"
          />
        </div>
          <motion.button
           whileTap={{ scale: 0.95 }}
           className="relative"
           onClick={lessHandler}
          >
            <Menu></Menu>
          </motion.button>
        </div>
        <div className="flex flex-col flex-1 space-y-2 overflow-y-auto my-4 hide-scrollbar">
          {query.length > 0 ? (
            searchResults.map((msg) => (
              <div key={msg.id} onClick={() => handleConversationClick(msg.convid)} className="pl-1 py-1 w-full text-stone-500 dark:text-white rounded-md hover:bg-stone-300 dark:hover:bg-zinc-900">
                {msg.content.substring(0, 12)}
              </div>
            ))
          ) : (
            <>
              <div className="text-sm mt-[-2px] mb-[-1] text-stone-400 dark:text-white">{t("7daysago")}</div>
              {goAnimate? (
                <>
                  {uniqueConversations.map((msg: any) => (
                    <div key={msg.convid} onClick={() => handleConversationClick(msg.convid)} className="ml-[-1] pl-2 py-1 w-full text-stone-500 dark:text-white rounded-md hover:bg-stone-300 dark:hover:bg-zinc-900">
                      {msg.content.substring(0, 12) + "..."}
                    </div>
                  ))}
                </>
              ) : (
                <div className="flex justify-start items-center h-[10px] gap-2 ml-1">
                  <div className="w-2 h-2 rounded-full bg-stone-300 animate-pulse-ball"></div>
                  <div className="w-2 h-2 rounded-full bg-stone-300 animate-pulse-ball" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-2 rounded-full bg-stone-300 animate-pulse-ball" style={{ animationDelay: "0.4s" }}></div>
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
