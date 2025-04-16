import React, { FC, useEffect, useState, RefObject, Dispatch, SetStateAction } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
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

  // 检查是否是图片URL
  const isImageUrl = (content: string): boolean => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(content) || 
           content?.startsWith('https://') || 
           content?.startsWith('http://');
  };

  // 复制图片到剪贴板
  const handleCopyImage = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
    } catch (err) {
      console.error('Failed to copy image: ', err);
    }
  };

  // 下载图片
  const handleDownloadImage = (imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'chat-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="z-1 flex flex-col flex-grow bg-background w-full lg:w-[78vw] lg:ml-[22vw] xl:w-[71vw] xl:ml-[28vw] px-2 py-6" style={{ maxHeight:"72vh" }}>
      {messages.length > 0 && (
        <div className="flex justify-end items-center p-4 bg-background w-full lg:w-[71vw]">
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
            <div className="flex flex-row">
              <Image alt={agent} src={`${src[message.agent]||"/logo/XAIAgent.png"}`} width={24} height={24} className={`${message.role === "user" ? "hidden":"ml-4 rounded-full"}`} style={{width:"28px",height:"28px"}}/>
              <div className={`${message.role === "user" ? 'hidden' : 'text-foreground ml-2 text-md font-semibold'}`}>{message.agent || "Xaiagent"}</div>
            </div>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-[rgb(236,236,236)] dark:bg-zinc-800 text-[rgb(30,30,30)] dark:text-white'
                  : 'text-foreground'
              }`}
            >
              {isImageUrl(message.content) ? (
                <div className="relative">
                  <img 
                    src={message.content} 
                    alt="Chat image" 
                    className="max-w-full max-h-[300px] object-contain rounded-lg"
                  />
                  <div className="flex justify-start space-x-4 mt-2">
                    <button
                      onClick={() => handleCopyImage(message.content)}
                      className="p-2 rounded-full bg-gray-200 dark:bg-[rgba(22,22,22,0.8)] hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors"
                      title="Copy image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDownloadImage(message.content)}
                      className="p-2 rounded-full bg-gray-200 dark:bg-[rgba(22,22,22,0.8)] hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors"
                      title="Download image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : message.role === 'assistant' ? (
                  <ReactMarkdown>{message.content}</ReactMarkdown>
              ) : (
                <p className="text-sm text-justify">{message.content}</p>
              )}
              <p className={`text-xs mt-1 text-[rgb(30,30,30)] dark:text-white`}>
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
              <Skeleton className="text-foreground ml-2 text-md font-semibold">
                {agent}
              </Skeleton>
              <Skeleton className="text-foreground ml-2 text-md font-semibold">
                正在思考...
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
              <Skeleton className="text-foreground ml-2 text-md font-semibold">
                {agent}
              </Skeleton>
              <Skeleton className="text-foreground ml-2 text-md font-semibold">
                正在思考...
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