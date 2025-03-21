'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid'; // 引入uuid库

interface SideBarProps {
  userName: string | null;
  setUserName: any;
  agentId: string;
  setConversations: any;
  setConvid: any;
  setIsNew: any;
  conversations: any;
}

interface Sentence {
  convid: string;
  user?: string;
  assistant?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string; // 假设后端返回timestamp字段
  convid: string;
}

const SideBar = ({ conversations, setIsNew, setConvid, setConversations, agentId, userName, setUserName }: SideBarProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [bgCopy, setBgCopy] = useState<string>('bg-stone-700');
  const [query, setQuery] = useState('');
  const [smallHidden, setSmallHidden] = useState('hidden');
  const [moreground, setMoreground] = useState('bg-stone-200');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const locale = useLocale();
  const t = useTranslations("chat");

  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages();
    }, 5000);
    return () => clearInterval(interval);
  }, [agentId, userName]);

  const fetchMessages = async () => {
    if (agentId && userName) {
      try {
        const response = await fetch(`/api/chat/${agentId}/messages?user=${userName}`, {
          headers: { 'Content-Type': 'application/json' },
          method: 'GET',
        });
        
        const data: Sentence[] = await response.json();

        const newMessages: Message[] = data.map((sentence: Sentence) => ({
          id: uuidv4(),
          role: sentence.user ? 'user' : 'assistant',
          content: sentence.user || sentence.assistant || '',
          timestamp: new Date().toISOString(), // 如果后端没有返回timestamp，则在此处生成
          convid: sentence.convid
        }));
        console.log(data)
  
        setMessages(newMessages);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
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

  const handleSearchOpen = () => {
    setIsSearchOpen(isSearchOpen ? false : true);
  };

  const moreHandler = () => {
    setSmallHidden("transition-discrete duration-300 block flex z-20 w-[245px]");
    setMoreground("bg-stone-500");
  }

  const lessHandler = () => {
    setSmallHidden("hidden");
    setMoreground("bg-stone-300");
  }

  // 修改消息点击处理函数
  const handleConversationClick = (convid: string) => {
    setIsNew("no");
    setConvid(convid);
    const conversationMessages = messages.filter(msg => msg.convid === convid);
    setConversations({
      [agentId]: conversationMessages
    });
    console.log(conversations);
  }

  // 对messages进行分组，每个convid只取第一条消息
  const uniqueConversations = Array.from(new Set(messages.map(msg => msg.convid)))
  .map(convid => messages.find(msg => msg.convid === convid));

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.95 }}
        className="fixed top-[116px] left-[calc(1.9vw+16px)] md:left-[calc(2.6vw+10px)] lg:hidden"
        onClick={moreHandler}
      >
        <Menu></Menu>
      </motion.button>
      <div className={`fixed z-20 top-[114px] lg:top-[70px] xl:left-[1.6vw] 2xl:top-[70px] ${smallHidden} lg:flex flex-col lg:w-[20vw] bg-stone-200 dark:bg-zinc-800 p-4 text-white h-[calc(98vh-105px)] lg:h-[calc(97vh-88px)] rounded-md`}>
        <div className="flex justify-end space-x-2">
          <div className="relative right-[88px] w-[50px] flex items-center self-start lg:right-[calc(8vw-20px)] xl:right-[calc(9vw-5px)] 2xl:right-[10vw]">
          </div>
          <Image src="/images/search.png" alt="Search" width={28} height={28} onClick={handleSearchOpen} className="cursor-pointer relative right-[4px]" />
          <motion.button
           whileTap={{ scale: 0.95 }}
           className="relative right-[4px]"
           onClick={lessHandler}
          >
            <Menu></Menu>
          </motion.button>
        </div>
        {isSearchOpen && (
          <div className="w-full flex items-center justify-between rounded mb-4 p-2">
            <input
              type="text"
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-[90%] h-[32px] text-neutral-700 mx-auto pl-2 focus:outline-none rounded-sm space-x-2 space-y-2 focus:ring-2 focus:ring-stone-300 focus:border-stone-300 transition duration-300"
            />
          </div>
        )}
        {isSearchOpen ? (
          <div className="flex flex-col flex-1 space-y-4 overflow-y-auto">
            {searchResults.map((msg) => (
              <div key={msg.id} onClick={() => handleConversationClick(msg.convid)} className="px-2 py-1 w-full text-white rounded-md bg-stone-300 hover:bg-stone-200 dark:bg-zinc-900 dark:hover:bg-zinc-800">
                {msg.content.substring(0, 12)+"..."}
              </div>
            ))}
          </div>
        ) : (
          <>
            <hr className="my-4 border-white" />
            <div className="text-sm mt-[-4px] mb-4 text-white">{t("7daysago")}</div>
            <div className="flex flex-col flex-1 overflow-y-auto space-y-4">
              {uniqueConversations.map((msg:any) => (
                <div key={msg.convid} onClick={() => handleConversationClick(msg.convid)} className="px-2 py-1 w-full text-white rounded-md bg-stone-300 hover:bg-stone-200 dark:bg-zinc-900 dark:hover:bg-zinc-800">
                  {msg.content.substring(0,12)+"..."}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default SideBar;
