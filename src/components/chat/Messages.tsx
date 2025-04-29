import React, { FC, useEffect, useState, useRef, RefObject, Dispatch, SetStateAction } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import ReactDOM from 'react-dom';
import { useLocale, useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
  convid: string;
  agent: string;
}

interface Conversations {
  [id: string]: Message[];
}

interface MessagesComponentProps {
  userName: string | null;
  conversations: Conversations;
  isLoading: boolean;
  setConversations: Dispatch<SetStateAction<Conversations>>;
  selectedStyle: string | null;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  setIsNew: React.Dispatch<SetStateAction<string>>;
  agent: string;
  isLoadingImage: any;
}

async function deleteMessages(setIsNew:Dispatch<SetStateAction<string>>, userName: string | null, setConversations: Dispatch<SetStateAction<Conversations>>): Promise<void> {
  setIsNew("yes");
  setConversations((prev: Conversations): Conversations => {
    const newConversations = { ...prev };
    newConversations["1"] = [];
    return newConversations;
  });
}

const src: {[key:string]:string} = {
  "Xaiagent":"/logo/XAIAgent.png",
  "StyleID":"/logo/StyleID.png",
  "LogoLift":"/logo/LogoLift.png",
  "PicSpan":"/logo/PicSpan.png"
}

const MessagesComponent: FC<MessagesComponentProps> = ({ selectedStyle, agent, setIsNew, userName, isLoading, conversations, isLoadingImage, setConversations, messagesEndRef }) => {
  const [messages, setMessages] = useState<Message[]>(conversations["1"] || []);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [collapsedMessages, setCollapsedMessages] = useState<Record<string, boolean>>({});
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [likedMessages, setLikedMessages] = useState<Record<string, boolean>>({});
  const [dislikedMessages, setDislikedMessages] = useState<Record<string, boolean>>({});
  const expandedImageRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("chat");

  useEffect(() => {
    setMessages(conversations["1"] || []);
  }, [conversations["1"]]);  

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }
  
  async function shareToInstagram(message: {content: string}) {
    try {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const shareText = encodeURIComponent(t("share"));
      
      if (isMobile) {
        // 尝试使用Instagram应用分享
        const appUrl = `instagram://sharing?text=${shareText}`;
        window.location.href = appUrl;
        
        // 如果应用未安装，2秒后回退到网页版
        setTimeout(() => {
          const webUrl = `https://www.instagram.com/direct/inbox/?text=${shareText}`;
          window.open(webUrl, '_blank');
        }, 2000);
      } else {
        // 桌面端直接打开网页版
        const webUrl = `https://www.instagram.com/direct/inbox/?text=${shareText}`;
        window.open(webUrl, '_blank');
      }
    } catch (error) {
      console.error("Instagram分享失败:", error);
      // 兜底方案
      const webUrl = `https://www.instagram.com/direct/inbox/?text=${encodeURIComponent(t("share"))}`;
      window.open(webUrl, '_blank');
    }
  }

  function shareToWeChat(message: string) {
    // 直接尝试 weixin://dl/moments（朋友圈协议）
    window.location.href = 'weixin://dl/moments';
    
    // 1000ms 后检查是否跳转成功，若未成功则复制文本
    setTimeout(() => {
      if (!document.hidden) { // 如果页面仍然可见，说明跳转失败
        navigator.clipboard.writeText(message);
      }
    }, 1000);
  }
  
  const shareToTwitter = (imageUrl: string) => {
    const shareText = `${t("share")}`;
    const encodedText = encodeURIComponent(shareText);
    const encodedImageUrl = encodeURIComponent(imageUrl);
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
    window.open(tweetUrl, '_blank');
  }; 

  const isValidDate = (dateString: string): boolean => {
    const datePattern = /^\d{4}-\d{1,2}-\d{1,2}-\d{1,2}-\d{1,2}-\d{1,2}$/;
    return datePattern.test(dateString);
  };

  useEffect(() => {
    const handleClickOutside = (event:any) => {
      if (expandedImageRef.current && !expandedImageRef.current.contains(event.target)) {
        setExpandedImage(null);
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isImageUrl = (content: string): boolean => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(content) || 
           content?.startsWith('https://') || 
           content?.startsWith('http://');
  };

  const handleDownloadImage = (e: React.MouseEvent, imageUrl: string) => {
    e.preventDefault();
    // Ensure URL uses HTTPS
    let secureUrl = imageUrl;
  
    const link = document.createElement('a');
    link.href = secureUrl;
    const filename = secureUrl.split('/').pop() || 'chat-image.png';
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyText = (text: string, messageId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000); // Reset after 2 seconds
  };  

  const toggleCollapseMessage = (messageId: string) => {
    setCollapsedMessages(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const handleLike = (messageId: string) => {
    setLikedMessages(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
    // If disliked, remove dislike
    if (dislikedMessages[messageId]) {
      setDislikedMessages(prev => ({
        ...prev,
        [messageId]: false
      }));
    }
  };

  const handleDislike = (messageId: string) => {
    setDislikedMessages(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
    // If liked, remove like
    if (likedMessages[messageId]) {
      setLikedMessages(prev => ({
        ...prev,
        [messageId]: false
      }));
    }
  };

  return (
    <div className="fixed top-[120px] flex flex-col flex-grow bg-background w-full lg:w-[78vw] lg:ml-[22vw] xl:w-[71vw] xl:ml-[28vw] px-2 max-lg:max-h-[calc(100vh-280px)] lg:max-h-[calc(100vh-310px)]" style={{ overflowAnchor: "none" }}>
      {messages.length > 0 && (
        <div className="flex justify-end items-center bg-background w-full lg:w-[71vw]">
          <button
            type="button"
            className="fixed right-[10px] top-[83px] flex items-center justify-center px-2 py-1 hover:bg-[rgb(230,230,230)] dark:hover:bg-[rgba(22,22,22,0.8)] rounded-full"
            onClick={async () => {
              try {
                if(!isLoading){
                  await deleteMessages(setIsNew, userName, setConversations);
                }
              } catch (error) {
                console.error(error);
              }
            }}
          >
           <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20"
              className="size-5 fill-foreground stroke-foreground"
            >
              <path 
                d="M5.2 13.8L6.3 11a3.8 3.8 0 0 1 1-1.3L14.1 3a1.8 1.8 0 1 1 2.5 2.5l-6.8 6.8c-.3.3-.7.6-1.1.8l-3 1.1a.4.4 0 0 1-.5-.5z"
                strokeWidth="0"
                strokeLinejoin="miter"
                strokeMiterlimit="4"
                vectorEffect="non-scaling-stroke"
              />
              <path 
                d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z"
                strokeWidth="0"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </button>
        </div>
      )}
      <div className="relative z-1 top-[8px] flex flex-col space-y-6 overflow-y-auto hide-scrollbar max-h-[75vh] pb-[54px] lg:pb-0">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start flex-col'}`}
          > 
            <div className="flex flex-row relative -top-[6px]">
              <Image alt={agent} src={`${src[message.agent]||"/logo/XAIAgent.png"}`} width={24} height={24} className={`${message.role === "user" ? "hidden":"ml-4 rounded-full mt-2"}`} style={{width:"28px",height:"28px"}}/>
              <div className={`${message.role === "user" ? 'hidden' : 'text-foreground ml-2 text-md font-[500]'}`}>{message.agent || "Xaiagent"}</div>
              <p className={`${message.role === "user" ? 'hidden' : 'ml-2 mt-[5px] text-md'} text-xs mt-1 text-[rgb(30,30,30)] dark:text-white opacity-80`}>
                  {isValidDate(message.time) ? 
                    (() => {
                      const parts = message.time.split('-');
                      const year = parseInt(parts[0], 10);
                      const month = parseInt(parts[1], 10);
                      const day = parseInt(parts[2], 10);
                      const hour = parseInt(parts[3], 10);
                      const minute = parseInt(parts[4], 10);
                      const second = parseInt(parts[5], 10);
                      const messageDate = new Date(year, month - 1, day, hour, minute, second);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      if (messageDate.toDateString() === today.toDateString()) {
                        return `${messageDate.getHours()}:${messageDate.getMinutes().toString().padStart(2, '0')}`;
                      } else {
                        return `${(messageDate.getMonth() + 1).toString().padStart(2, '0')}-${messageDate.getDate().toString().padStart(2, '0')} ${messageDate.getHours()}:${messageDate.getMinutes().toString().padStart(2, '0')}`;
                      }
                    })() 
                    : `${new Date().getHours()}:${new Date().getMinutes().toString().padStart(2, '0')}`}
                </p>
            </div>
            {message.role === 'assistant' && (
              <div className="flex items-center ml-[52px] mt-[-12px] mb-[4px]">
                <span className="text-xs text-muted-foreground cursor-pointer" onClick={() => toggleCollapseMessage(message.id)}>{t("alreadyuseagent")}</span>
                <button 
                  onClick={() => toggleCollapseMessage(message.id)}
                  className="ml-[2px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    className="w-3 h-3"
                    fill="currentColor"
                  >
                    <path 
                      fillRule="evenodd" 
                      d={collapsedMessages[message.id] ? "M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z" : "M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"}
                      clipRule="evenodd" 
                    />
                  </svg>
                </button>
              </div>
            )}
            <div className={`flex ${message.role === 'user' ? 'justify-start' : 'justify-start'} ${expandedImage === message.content ? 'items-start' : ''}`}>
            <div
              className={`rounded-2xl px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-[rgb(236,236,236)] dark:bg-zinc-800 text-[rgb(30,30,30)] dark:text-white inline-block ml-auto max-w-[77vw] md:max-w-[75vw] lg:max-w-[60vw]'
                  : 'text-foreground max-w-[80%] ml-[38px]'
              }`}
            >
                {isImageUrl(message.content) ? (
                  <div className={`relative ${collapsedMessages[message.id] ? 'hidden' : ''}`}>
                    <img 
                      src={message.content} 
                      alt="Expanded chat image" 
                      style={{zIndex:50}}
                      onClick={() => setExpandedImage(expandedImage === message.content ? null : message.content)}
                      className="rounded-lg object-contain max-h-[80vh] relative"
                      onLoad={(e: React.SyntheticEvent<HTMLImageElement>) => {
                        const img = e.currentTarget;
                        if (img.naturalWidth && img.naturalHeight) {
                          const aspectRatio = img.naturalWidth / img.naturalHeight;
                          if( img.naturalWidth > 300 || img.naturalHeight > 500){
                            img.style.width="280px"
                          }
                          if (aspectRatio > 1.6) {
                            img.style.width = `${img.naturalHeight * 1.6}px`;
                          }
                        }
                      }}
                    />
                  </div>
                ) : message.role === 'assistant' ? (
                  <div className={collapsedMessages[message.id] ? 'hidden' : ''}>
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-justify">{message.content}</p>
                  </div>
                )}
                
                {/* Action buttons - now below the timestamp */}
                <div className="flex justify-start gap-2">
                  {isImageUrl(message.content) ? (
                    <>
                    {/* Download button - fixed mixed content issue */}
                    <button
                      onClick={(e) => handleDownloadImage(e,message.content.startsWith('//') ? `https:${message.content}` : message.content)}
                      className="p-1 rounded-full bg-gray-200 dark:bg-[rgba(22,22,22,0.8)] hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors mt-[2px]"
                      title="Download image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                    
                    {/* Twitter (X) Share with Image Preview */}
                    <button
                      onClick={() => shareToTwitter(message.content)}
                      className="p-1 rounded-full bg-gray-200 dark:bg-[rgba(22,22,22,0.8)] hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors mt-[2px]"
                      title="Share on X"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                      </svg>
                    </button>
                                        
                    {/* Instagram Share - Unified style */}
                    <button
                      onClick={() => {
                        shareToInstagram(message);
                      }}
                      className="p-1 rounded-full bg-gray-200 dark:bg-[rgba(22,22,22,0.8)] hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors mt-[2px]"
                      title="Share on Instagram"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 relative -top-[1px] -left-[1px]" fill="none" viewBox="0 0 21 21" stroke="currentColor" strokeWidth={1.5} width="5" height="5">
                        <rect x="5" y="5" width="14" height="14" rx="4" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="17.5" cy="7.5" r="1.5" fill="currentColor"/>
                        <rect x="10.5" y="17" width="3" height="1" rx="0.5" fill="currentColor"/>
                      </svg>
                    </button>
                    
                    {/* Facebook Share - Unified style */}
                    <button
                      onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${t("share")}`)}`, '_blank', 'width=600,height=400')}
                      className="p-1 rounded-full bg-gray-200 dark:bg-[rgba(22,22,22,0.8)] hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors mt-[2px]"
                      title="Share on Facebook"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                      </svg>
                    </button>

                    {/* WhatsApp Share - Unified style */}
                    <button
                      onClick={() => {
                        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                        const shareUrl = isMobile 
                          ? `whatsapp://send?text=${encodeURIComponent(`${t("share")}`)}`
                          : `https://web.whatsapp.com/send?text=${encodeURIComponent(`${t("share")}`)}`;
                        window.open(shareUrl, '_blank');
                      }}
                      className="p-1 rounded-full bg-gray-200 dark:bg-[rgba(22,22,22,0.8)] hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors mt-[2px]"
                      title="Share on WhatsApp"
                    >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        d="M8 11.5v0a1.5 1.5 0 000 3h7a1.5 1.5 0 000-3v0" 
                        transform="rotate(45, 12, 13)"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 8.5h.01v.01H10V8.5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 8.5h.01v.01H14V8.5z" />
                     </svg>
                    </button>
                    <>
                      <button
                        onClick={() => shareToWeChat(message.content)}
                        className="p-1 rounded-full bg-gray-200 dark:bg-[rgba(22,22,22,0.8)] hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors mt-[2px]"
                        title="Share on WeChat"
                      >
                        <svg className="text-foreground stroke-foreground fill-foreground" viewBox="0 0 1025 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5037" width="15" height="15"><path d="M498.816 345.056c26.336 0 43.936-17.632 43.936-43.904 0-26.56-17.568-43.744-43.936-43.744s-52.832 17.184-52.832 43.744C446.016 327.424 472.48 345.056 498.816 345.056zM253.088 257.408c-26.336 0-52.96 17.184-52.96 43.744 0 26.272 26.624 43.904 52.96 43.904 26.24 0 43.808-17.632 43.808-43.904C296.864 274.592 279.328 257.408 253.088 257.408zM1024 626.112c0-138.88-128.832-257.216-286.976-269.536 0.224-1.728 0.32-3.52-0.064-5.312-31.712-147.84-190.688-259.296-369.824-259.296C164.704 91.968 0 233.12 0 406.624c0 93.088 47.52 176.96 137.568 243.104l-31.392 94.368c-2.016 6.144-0.192 12.896 4.704 17.152 2.976 2.56 6.72 3.904 10.496 3.904 2.432 0 4.896-0.576 7.168-1.696L246.4 704.48l14.528 2.944c36.288 7.456 67.616 13.92 106.208 13.92 11.36 0 22.88-0.512 34.176-1.472 4.576-0.384 8.448-2.688 11.072-6.016 42.496 106.336 159.616 183.104 297.44 183.104 35.296 0 71.04-8.512 103.104-16.544l90.848 49.664c2.4 1.312 5.056 1.984 7.68 1.984 3.584 0 7.168-1.216 10.048-3.552 5.056-4.096 7.136-10.848 5.248-17.024l-23.2-77.152C981.344 772.864 1024 699.328 1024 626.112zM398.592 687.968c-10.4 0.896-20.96 1.344-31.424 1.344-35.328 0-65.216-6.112-99.776-13.248L247.296 672c-3.456-0.736-7.104-0.256-10.272 1.376l-88.288 44.192 22.944-68.928c2.24-6.752-0.224-14.112-6.016-18.176C76.96 568.64 32 493.312 32 406.624c0-155.84 150.336-282.656 335.136-282.656 163.36 0 308 99.392 337.856 231.584-171.296 2.24-309.888 122.656-309.888 270.56 0 21.504 3.264 42.336 8.768 62.432C402.208 688.128 400.448 687.808 398.592 687.968zM875.456 815.552c-5.344 4.032-7.616 10.976-5.696 17.376l15.136 50.336-62.112-33.984c-2.368-1.312-5.024-1.984-7.68-1.984-1.312 0-2.624 0.16-3.904 0.512-33.312 8.416-67.776 17.088-101.344 17.088-155.904 0-282.72-107.136-282.72-238.816 0-131.68 126.816-238.784 282.72-238.784 152.928 0 282.144 109.344 282.144 238.784C992 691.744 950.624 759.04 875.456 815.552zM612.992 511.968c-17.568 0-35.136 17.696-35.136 35.232 0 17.664 17.568 35.104 35.136 35.104 26.4 0 43.84-17.44 43.84-35.104C656.832 529.632 639.392 511.968 612.992 511.968zM806.016 511.968c-17.312 0-34.88 17.696-34.88 35.232 0 17.664 17.568 35.104 34.88 35.104 26.304 0 44.064-17.44 44.064-35.104C850.08 529.632 832.352 511.968 806.016 511.968z" p-id="5038"></path></svg>
                      </button>  
                      <div className={`relative right-[17.8px] flex flex-col justify-center -top-[26px] transform bg-zinc-800 -translate-x-1/2 dark:bg-white text-background text-xs rounded py-1 px-2 whitespace-nowrap z-50 ${copiedMessageId === 'wechat-share' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        {t("wechatcopied")}
                      </div>                  
                      {/* Line Share - Unified style 
                      <button
                        onClick={() => {
                          window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(t("share"))}`, '_blank');
                        }}
                        className="p-1 rounded-full bg-gray-200 dark:bg-[rgba(22,22,22,0.8)] hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors mt-[2px]"
                        title="Share on Line"
                      >
                        <svg className="text-foreground stroke-foreground fill-foreground" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="8964" width="16" height="16">
                            <path stroke-width="0.5" d="M938.666667 456.106667c0 76.245333-29.312 145.066667-90.581334 212.224-89.6 102.997333-289.621333 228.821333-335.530666 247.978666-45.824 19.242667-38.869333-12.245333-37.290667-22.912l5.845333-36.266666c1.450667-11.178667 2.901333-27.733333-1.365333-38.4-4.778667-11.818667-23.722667-18.090667-37.589333-20.992C237.141333 770.517333 85.333333 627.2 85.333333 456.106667c0-190.933333 191.445333-346.368 426.666667-346.368 235.178667 0 426.666667 155.434667 426.666667 346.368z m-153.6 154.666666c47.488-52.053333 68.266667-100.736 68.266666-154.666666 0-139.434667-149.76-261.034667-341.333333-261.034667s-341.333333 121.6-341.333333 261.034667c0 123.946667 116.394667 234.965333 282.709333 257.024l6.272 1.109333c45.994667 9.642667 80.384 26.197333 99.370667 72.874667l1.536 4.096c77.056-50.176 178.090667-127.146667 224.469333-180.437334z m-11.178667-170.666666a22.442667 22.442667 0 0 1 0 44.8h-62.421333v40.021333h62.378666a22.4 22.4 0 1 1 0 44.757333H689.066667a22.442667 22.442667 0 0 1-22.272-22.357333V377.685333c0-12.245333 10.026667-22.4 22.4-22.4h84.821333a22.4 22.4 0 0 1-0.128 44.8h-62.378667v40.021334h62.378667z m-137.088 107.221333a22.357333 22.357333 0 0 1-22.442667 22.272 21.973333 21.973333 0 0 1-18.133333-8.874667l-86.869333-117.930666v104.533333a22.4 22.4 0 0 1-44.672 0V377.685333a22.272 22.272 0 0 1 22.186666-22.314666c6.912 0 13.312 3.669333 17.578667 9.002666l87.552 118.4V377.685333c0-12.245333 10.026667-22.4 22.4-22.4 12.245333 0 22.4 10.154667 22.4 22.4v169.642667z m-204.117333 0a22.485333 22.485333 0 0 1-22.442667 22.357333 22.442667 22.442667 0 0 1-22.314667-22.357333V377.685333c0-12.245333 10.069333-22.4 22.4-22.4 12.330667 0 22.357333 10.154667 22.357334 22.4v169.642667z m-87.68 22.357333H260.138667a22.528 22.528 0 0 1-22.4-22.357333V377.685333a22.485333 22.485333 0 0 1 44.8 0v147.2h62.464a22.4 22.4 0 0 1 0 44.8z" p-id="8965"></path>
                        </svg>
                      </button>
                      */}
                    </>
                  </>
                  ) : message.role === 'assistant' ? (
                    <>
                      <button
                        onClick={() => handleCopyText(message.content, message.id)}
                        className="p-1 rounded-full bg-gray-200 dark:bg-[rgba(22,22,22,0.8)] hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors relative group"
                        title="Copy"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <div className={`absolute -top-[28px] left-1/2 transform -translate-x-1/2 bg-background text-foreground text-xs rounded py-1 px-2 whitespace-nowrap transition-opacity duration-300 ${copiedMessageId === message.id ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                          Copied!
                        </div>
                      </button>
                    </>
                  ) : (
                    <div className="h-0"></div>
                  )}
                </div>
              </div>
              {expandedImage === message.content && (
                ReactDOM.createPortal(
                <div 
                  ref={expandedImageRef}
                  style={{position:"fixed",zIndex:700}}
                  className="fixed inset-0 flex items-center justify-center"
                  onClick={() => setExpandedImage(null)}
                >
                  <div className="max-w-[90vw] max-h-[90vh] relative" style={{zIndex:50}}>
                    <img 
                      src={message.content} 
                      alt="Expanded chat image" 
                      style={{zIndex:50}}
                      className="rounded-lg object-contain max-h-[80vh] relative"
                    />
                  </div>
                </div>,document.body
              ))}
            </div>
          </div>
        ))}
        {isLoading && (
          <div>
          {isLoadingImage ? (
            <div className="flex flex-col justify-start">
              <div className="flex flex-row">
              <Skeleton>
                <Image alt={agent} src={`${src[agent]||"/logo/XAIAgent.png"}`} width={24} height={24} className={"ml-4 rounded-full"} style={{width:"28px",height:"28px"}}/>
              </Skeleton>
              <Skeleton className="text-foreground ml-2 text-md font-[500]">
                {agent}
              </Skeleton>
              <Skeleton className="text-foreground ml-2 text-md font-[500]">
                {t("isImageThinking")}
              </Skeleton>
              </div>
              <Skeleton className="ml-4 mt-2 w-[170px] h-[320px] rounded-md bg-gray-200 dark:bg-neutral-800"/>
            </div>
          ) : (
            <div className="flex flex-col justify-start">
            <div className="flex flex-row">
              <Skeleton>
                <Image alt={agent} src={`${src[agent]||"/logo/XAIAgent.png"}`} width={24} height={24} className={"ml-4 rounded-full"} style={{width:"28px",height:"28px"}}/>
              </Skeleton>
              <Skeleton className="text-foreground ml-2 text-md font-[500]">
                {agent}
              </Skeleton>
              <Skeleton className="text-foreground ml-2 text-md font-[500]">
                {t("thinking")}
              </Skeleton>
            </div>
            <div className="flex flex-col space-y-2 ml-4 mt-2">
              <Skeleton className="w-[52vw] h-[14px] rounded-full bg-gray-200 dark:bg-neutral-800"/>
              <div className="flex flex-row space-x-[1vw]">
                <Skeleton className="w-[28vw] h-[14px] rounded-full bg-gray-200 dark:bg-neutral-800"/>
                <Skeleton className="w-[23vw] h-[14px] rounded-full bg-gray-200 dark:bg-neutral-800"/>
              </div>
              <div className="flex flex-row space-x-[1vw]">
                <Skeleton className="w-[19.5vw] h-[14px] rounded-full bg-gray-200 dark:bg-neutral-800"/>
                <Skeleton className="w-[13vw] h-[14px] rounded-full bg-gray-200 dark:bg-neutral-800"/>
                <Skeleton className="w-[17.5vw] h-[14px] rounded-full bg-gray-200 dark:bg-neutral-800"/>
              </div>
            </div>
            </div>
          )}  
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessagesComponent;