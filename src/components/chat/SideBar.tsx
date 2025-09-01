'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Copy, MoreHorizontal } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { copyToClipboard } from '@/lib/utils';

interface Conversations {
  [id: string]: Message[];
}

interface SideBarProps {
  userName: string | null;
  setUserName: any;
  setConversations: any;
  setIsLoading: any;
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
  time: string;
  convid: string;
  agent?: string;
}

const SideBar = ({ agent, setIsLoading, conversations, setIsNew, setConvid, setConversations, userName, setUserName }: SideBarProps) => {
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [bgCopy, setBgCopy] = useState<string>('bg-stone-700');
  const [query, setQuery] = useState('');
  const [smallHidden, setSmallHidden] = useState('hidden');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const [goAnimate, setGoAnimate] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  const locale = useLocale();
  const t = useTranslations("chat");

  async function deleteMessages(setIsNew: any, setConversations: any): Promise<void> {
    setIsNew("yes");
    setIsLoading(false);
    setConversations((prev: Conversations): Conversations => {
      const newConversations = { ...prev };
      newConversations["1"] = [];
      return newConversations;
    });
  }

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
          time: sentence.time || new Date().toISOString(),
          convid: sentence.convid,
          agent: sentence.agent || ''
        }));

        setMessages(newMessages);
        setGoAnimate(true);
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

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isNowDark = document.documentElement.classList.contains('dark');
          setIsDarkMode(isNowDark);
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const moreHandler = () => {
    setSmallHidden("transition-discrete duration-300 block flex z-20 w-[245px]");
  }

  const lessHandler = () => {
    setSmallHidden("hidden");
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (smallHidden !== "hidden" && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setSmallHidden("hidden");
      }
      setActiveDropdown(null);
    };

    if (smallHidden !== "hidden") {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [smallHidden]);

  const handleConversationClick = (convid: string) => {
    setIsNew("no");
    setConvid(convid);
    const conversationMessages = messages.filter(msg => msg.convid === convid);
    setConversations({
      ["1"]: conversationMessages
    });
  }

  const toggleDropdown = (convid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === convid ? null : convid);
  }

  const copyConversationUrl = (convid: string) => {
    const url = `${window.location.origin}${window.location.pathname}?convid=${convid}`;
    return url;
  }

  const groupMessagesByTime = (messages: Message[]) => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 30);
    
    const last3Months = new Date(today);
    last3Months.setMonth(last3Months.getMonth() - 3);
    
    const last6Months = new Date(today);
    last6Months.setMonth(last6Months.getMonth() - 6);
    
    const lastYear = new Date(today);
    lastYear.setFullYear(lastYear.getFullYear() - 1);
    
    const groups: Record<string, Message[]> = {
      'Today': [],
      'Yesterday': [],
      'This Week': [],
      'Last 30 Days': [],
      'Last 3 Months': [],
      'Last 6 Months': [],
      'Last Year': [],
      'Older': []
    };
    
    const conversationMap = new Map<string, Message>();
    
    messages.forEach(msg => {
      if (!msg.time) return;
      
      if (!conversationMap.has(msg.convid) || 
          new Date(msg.time) > new Date(conversationMap.get(msg.convid)!.time)) {
        conversationMap.set(msg.convid, msg);
      }
    });
    
    Array.from(conversationMap.values()).forEach(msg => {
      if (!msg.time) return;
      
      const parts = msg.time.split('-');
      if (parts.length < 6) return;
      
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const hour = parseInt(parts[3], 10);
      const minute = parseInt(parts[4], 10);
      const second = parseInt(parts[5], 10);
      
      const msgDate = new Date(year, month, day, hour, minute, second);
      
      if (msgDate >= today) {
        groups['Today'].push(msg);
      } else if (msgDate >= yesterday) {
        groups['Yesterday'].push(msg);
      } else if (msgDate >= lastWeek) {
        groups['This Week'].push(msg);
      } else if (msgDate >= last30Days) {
        groups['Last 30 Days'].push(msg);
      } else if (msgDate >= last3Months) {
        groups['Last 3 Months'].push(msg);
      } else if (msgDate >= last6Months) {
        groups['Last 6 Months'].push(msg);
      } else if (msgDate >= lastYear) {
        groups['Last Year'].push(msg);
      } else {
        groups['Older'].push(msg);
      }
    });
    
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });
    
    return groups;
  };

  const specificMessages = messages.filter(msg => msg.agent === agent);
  const groupedMessages = groupMessagesByTime(specificMessages);

  return (
    <>
      <button
        className="fixed top-[93px] left-[calc(1.9vw+16px)] md:left-[calc(2.6vw+10px)]"
        onClick={moreHandler}
      >
        <Image
          src={isDarkMode ? "/images/chat/two.png" : "/images/chat/darktwo.png"}
          alt="Menu"
          width={24}
          height={24}
        />
      </button>
      
      <div 
        ref={sidebarRef} 
        className={`fixed z-20 top-[84px] lg:top-[70px] xl:left-[1.6vw] 2xl:top-[70px] ${smallHidden} lg:flex flex-col min-w-[250px] lg:w-[20vw] bg-[rgb(248,248,248)] dark:bg-[rgb(22,22,22)] p-4 text-white h-[calc(98vh-75px)] lg:h-[calc(98.2vh-86px)] rounded-md border-[1px] dark:border-none`} 
        style={{zIndex:12}}
      >
        <div className="flex justify-between items-center gap-2">
            <button
              className="ml-1"
              onClick={lessHandler}
            >
              <Image
                src={isDarkMode ? "/images/chat/two.png" : "/images/chat/darktwo.png"}
                alt="Close"
                width={20}
                height={20}
              />
            </button>

          <motion.div 
            className="flex-1 relative"
            initial={{ width: 0, opacity: 0 }}
            animate={{ 
              width: showSearch ? '100%' : 0,
              opacity: showSearch ? 1 : 0,
            }}
            transition={{ duration: 0.3 }}
          >
            {showSearch && (
              <>
                <input
                  type="text"
                  placeholder="Search history"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full h-8 placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:font-light text-neutral-700 dark:text-gray-200 pl-[12px] pr-4 focus:outline-none rounded-full bg-gray-100/70 dark:bg-black/40 backdrop-blur-sm border border-[hsl(0,0%,15%)] dark:border-gray-300/50 focus:border-none focus:ring-1 focus:ring-[#ff8533] transition ease-in-out duration-300 text-sm"
                />
              </>
            )}
          </motion.div>

          <div className="flex items-center gap-1">
            <button 
              onClick={() => setShowSearch(!showSearch)}
              className="p-1 rounded-full"
            >
              <Image
                src={isDarkMode ? "/images/chat/search.png" : "/images/chat/darksearch.png"}
                alt="Search"
                width={18}
                height={18}
              />
            </button>

            <button 
              type="button"
              onClick={() => deleteMessages(setIsNew, setConversations)}
              className="p-1 rounded-full"
            >
              <Image
                src={isDarkMode ? "/images/chat/write.png" : "/images/chat/darkwrite.png"}
                alt="New Chat"
                width={20}
                height={20}
              />
            </button>
          </div>
        </div>

        {goAnimate && <div className="w-full h-2"></div>}
        <div className="flex flex-col flex-1 space-y-4 overflow-y-auto my-2 hide-scrollbar">
          {query.length > 0 ? (
            <div className="space-y-1">
              {searchResults.map((msg) => (
                <div 
                  key={`search-${msg.id}`}
                  onClick={() => handleConversationClick(msg.convid)} 
                  className="group relative flex items-center justify-between px-3 py-[5px] w-full text-[#222222] dark:text-gray-200 rounded-md hover:bg-[#eaeaea] dark:hover:bg-zinc-800 transition-colors duration-200"
                >
                  <div className="w-[80%] overflow-hidden whitespace-nowrap text-ellipsis">
                    {msg.content.substring(0, 30)}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                    <MoreHorizontal className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" size={18} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {goAnimate ? (
                Object.entries(groupedMessages).map(([timePeriod, messages]) => (
                  <div key={timePeriod} className="space-y-1">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {timePeriod}
                    </div>
                    {messages.map((msg) => (
                      <div 
                        key={`conversation-${msg.convid}-${msg.id}`}
                        onClick={() => handleConversationClick(msg.convid)} 
                        className="group relative flex items-center justify-between px-3 py-[5px] w-full text-[#222222] dark:text-gray-200 rounded-md hover:bg-[#eaeaea] dark:hover:bg-zinc-800 transition-colors duration-200"
                      >
                        <div className="w-[80%] overflow-hidden whitespace-nowrap text-ellipsis">
                          {msg.content.substring(0, 30)}
                        </div>
                        <div className="relative">
                          <button 
                            onClick={(e) => toggleDropdown(msg.convid, e)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mt-1"
                          >
                            <MoreHorizontal size={18} />
                          </button>
                          {activeDropdown === msg.convid && (
                            <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-zinc-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-zinc-700">
                              <button
                                onClick={async () => {
                                  const url = copyConversationUrl(msg.convid);
                                  const ok = await copyToClipboard(url);
                                  // Assuming toast is available globally or imported
                                  // If not, you'll need to import it or define it.
                                  // For now, commenting out as it's not defined in the original file.
                                  // toast({
                                  //   title: ok ? t('copied') : t('copyFailed'),
                                  //   duration: 2000,
                                  //   variant: ok ? undefined : 'destructive',
                                  // });
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700"
                              >
                                <Copy className="mr-2" size={14} />
                                Copy Link
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="flex justify-center items-center gap-2">
                  <div className="relative w-2 h-2 rounded-full bg-gray-300 dark:bg-zinc-600 animate-pulse-ball mt-1" style={{zIndex:1200000}}></div>
                  <div className="relative w-2 h-2 rounded-full bg-gray-300 dark:bg-zinc-600 animate-pulse-ball mt-1" style={{ animationDelay: "0.2s",zIndex:1200000 }}></div>
                  <div className="relative w-2 h-2 rounded-full bg-gray-300 dark:bg-zinc-600 animate-pulse-ball mt-1" style={{ animationDelay: "0.4s",zIndex:1200000 }}></div>
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