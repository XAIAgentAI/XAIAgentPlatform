'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Menu, Copy, MoreHorizontal } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

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
  time: string;
  convid: string;
  agent?: string;
}

const SideBar = ({ agent, conversations, setIsNew, setConvid, setConversations, userName, setUserName }: SideBarProps) => {
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [bgCopy, setBgCopy] = useState<string>('bg-stone-700');
  const [query, setQuery] = useState('');
  const [smallHidden, setSmallHidden] = useState('hidden');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const [goAnimate, setGoAnimate] = useState(false);
  const [stroke, setStroke] = useState("black");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

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
          id: uuidv4(), // This ensures each message has a unique ID
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
    setStroke(isDark ? 'white' : 'black');
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isNowDark = document.documentElement.classList.contains('dark');
          setStroke(isNowDark ? 'white' : 'black');
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
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
    navigator.clipboard.writeText(url);
    setActiveDropdown(null);
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
    
    // Create a map to store the most recent message for each conversation
    const conversationMap = new Map<string, Message>();
    
    messages.forEach(msg => {
      if (!msg.time) return;
      
      // Only keep the most recent message for each conversation
      if (!conversationMap.has(msg.convid) || 
          new Date(msg.time) > new Date(conversationMap.get(msg.convid)!.time)) {
        conversationMap.set(msg.convid, msg);
      }
    });
    
    // Now group the unique conversations by time
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
    
    // Remove empty groups
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
        className="fixed top-[86px] left-[calc(1.9vw+16px)] md:left-[calc(2.6vw+10px)] lg:hidden"
        onClick={moreHandler}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 12H21" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 6H21" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 18H21" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      
      <div 
        ref={sidebarRef} 
        className={`fixed z-20 top-[84px] lg:top-[70px] xl:left-[1.6vw] 2xl:top-[70px] ${smallHidden} lg:flex flex-col min-w-[250px] lg:w-[20vw] bg-[rgb(248,248,248)] dark:bg-[rgb(22,22,22)] p-4 text-white h-[calc(98vh-75px)] lg:h-[calc(97vh-88px)] rounded-md border-[1px] dark:border-none`} 
        style={{zIndex:12000}}
      >
        <div className="flex justify-between items-center">
          <div className="self-start w-full relative">
            <svg 
              className="absolute left-3 top-1/2 transform -translate-y-1/2" 
              style={{zIndex:100000}}
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M10 17C13.866 17 17 13.866 17 10C17 6.13401 13.866 3 10 3C6.13401 3 3 6.13401 3 10C3 13.866 6.13401 17 10 17Z" 
                stroke={stroke} 
                strokeWidth="1.5"
              />
              <path 
                d="M15 15L21 21" 
                stroke={stroke} 
                strokeWidth="1.5" 
                strokeLinecap="round"
              />
            </svg>   
            <input
              type="text"
              placeholder="Search conversations"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-10 placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:font-light text-neutral-700 dark:text-gray-200 pl-10 pr-4 focus:outline-none rounded-full bg-gray-100/70 dark:bg-black/40 backdrop-blur-sm border border-[hsl(0,0%,15%)] dark:border-gray-300/50 focus:border-none focus:ring-1 focus:ring-[#ff8533] transition ease-in-out duration-300"
            />
          </div>
          <button
            className="ml-2 lg:hidden"
            onClick={lessHandler}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 7H19" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 12H19" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 17H19" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        {goAnimate && <div className="w-full h-2"></div>}
        <div className="flex flex-col flex-1 space-y-4 overflow-y-auto my-2 hide-scrollbar">
          {query.length > 0 ? (
            <div className="space-y-1">
              {searchResults.map((msg) => (
                <div 
                  key={`search-${msg.id}`} // Use message id for search results
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
                        key={`conversation-${msg.convid}-${msg.id}`} // Combine convid and id for uniqueness
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyConversationUrl(msg.convid);
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
                  <div className="relative w-2 h-2 rounded-full bg-[#ffffff] dark:bg-zinc-600 animate-pulse-ball mt-1" style={{zIndex:1200000}}></div>
                  <div className="relative w-2 h-2 rounded-full bg-[#ffffff] dark:bg-zinc-600 animate-pulse-ball mt-1" style={{ animationDelay: "0.2s",zIndex:1200000 }}></div>
                  <div className="relative w-2 h-2 rounded-full bg-[#ffffff] dark:bg-zinc-600 animate-pulse-ball mt-1" style={{ animationDelay: "0.4s",zIndex:1200000 }}></div>
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