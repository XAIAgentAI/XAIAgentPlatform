import React, { FC, useEffect, useState, useRef, RefObject, Dispatch, SetStateAction } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
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

const MessagesComponent: FC<MessagesComponentProps> = ({ agent, setIsNew, userName, isLoading, conversations, isLoadingImage, setConversations, messagesEndRef }) => {
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

  const handleCopyImage = async (imageUrl: string) => {
    try {
      // Changed to copy just the URL text instead of the image
      await navigator.clipboard.writeText(imageUrl);
    } catch (err) {
      console.error('Failed to copy image URL: ', err);
    }
  };

  const handleDownloadImage = (imageUrl: string) => {
    // Improved download function that works on both mobile and desktop
    const link = document.createElement('a');
    link.href = imageUrl;
    
    // Extract filename from URL or use a default one
    const filename = imageUrl.split('/').pop() || 'chat-image.png';
    link.download = filename;
    
    // Required for Firefox
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
    <div className="fixed top-[120px] flex flex-col flex-grow bg-background w-full lg:w-[78vw] lg:ml-[22vw] xl:w-[71vw] xl:ml-[28vw] px-2" style={{ maxHeight:"65vh" }}>
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
      <div className="relative z-1 top-[8px] flex flex-col space-y-6 overflow-y-auto hide-scrollbar max-h-[76vh]">
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
                      alt="Chat image" 
                      className="max-w-full max-h-[300px] object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setExpandedImage(expandedImage === message.content ? null : message.content)}
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
                      <button
                        onClick={() => {
                          handleCopyImage(message.content);
                          setCopiedMessageId(message.id);
                          setTimeout(() => setCopiedMessageId(null), 2000);
                        }}
                        className="p-1 rounded-full bg-gray-200 dark:bg-[rgba(22,22,22,0.8)] hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors relative group mt-[2px]"
                        title="Copy image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <div className={`absolute -top-[28px] left-1/2 transform -translate-x-1/2 bg-background text-foreground text-xs rounded py-1 px-2 whitespace-nowrap transition-opacity duration-300 ${copiedMessageId === message.id ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                          Copied!
                        </div>
                      </button>
                      <button
                        onClick={() => handleDownloadImage(message.content)}
                        className="p-1 rounded-full bg-gray-200 dark:bg-[rgba(22,22,22,0.8)] hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors mt-[2px]"
                        title="Download image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleLike(message.id)}
                        className={`p-1 mt-[2px] rounded-full transition-colors ${likedMessages[message.id] ? 'text-red-500' : 'bg-gray-200 dark:bg-[rgba(22,22,22,0.8)] hover:bg-gray-300 dark:hover:bg-neutral-700'}`}
                        title="Like"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={likedMessages[message.id] ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDislike(message.id)}
                        className={`p-1 mt-[2px] rounded-full transition-colors ${dislikedMessages[message.id] ? 'text-red-500' : 'bg-gray-200 dark:bg-[rgba(22,22,22,0.8)] hover:bg-gray-300 dark:hover:bg-neutral-700'}`}
                        title="Dislike"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={dislikedMessages[message.id] ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                        </svg>
                      </button>
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

                      <button
                        onClick={() => handleLike(message.id)}
                        className={`p-1 rounded-full transition-colors ${likedMessages[message.id] ? 'text-red-500' : 'bg-gray-200 dark:bg-[rgba(22,22,22,0.8)] hover:bg-gray-300 dark:hover:bg-neutral-700'}`}
                        title="Like"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={likedMessages[message.id] ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDislike(message.id)}
                        className={`p-1 rounded-full transition-colors ${dislikedMessages[message.id] ? 'text-red-500' : 'bg-gray-200 dark:bg-[rgba(22,22,22,0.8)] hover:bg-gray-300 dark:hover:bg-neutral-700'}`}
                        title="Dislike"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={dislikedMessages[message.id] ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <div className="h-0"></div>
                  )}
                </div>
              </div>
              {expandedImage === message.content && (
                <div 
                  ref={expandedImageRef}
                  className="fixed left-[calc(50vw-170px)] top-[calc(45vh-170px)] md:left-[calc(50vw-200px)] md:top-[calc(45vh-200px)] flex items-center justify-center" 
                  style={{zIndex:5000}}
                  onClick={() => setExpandedImage(null)}
                >
                  <div className="w-[340px] h-[340px] md:w-[400px] md:h-[400px] rounded-lg hide-scrollbar">
                    <img 
                      src={message.content} 
                      alt="Expanded chat image" 
                      className="rounded-lg object-contain"
                      style={{zIndex:5000}}
                    />
                  </div>
                </div>
              )}
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