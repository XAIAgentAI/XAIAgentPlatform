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

  const shareToTwitter = async (imageUrl: string) => {
    try {
      // 1. 下载图片到前端
      const response = await fetch(imageUrl.startsWith('//') ? `https:${imageUrl}` : imageUrl);
      const blob = await response.blob();
      
      // 2. 创建临时对象URL
      const blobUrl = URL.createObjectURL(blob);
      
      // 3. 构造分享文本
      const shareText = `This is how AI sees me — I picked the ${selectedStyle || 'Custom'} Style! ✨\nTry it now 👉 https://app.xaiagent.io/styleid\n\n#StyleIDChallenge #AIArt #XAIAGENT`;
      
      // 4. 创建隐藏的表单进行分享
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://api.x.com/2/tweets';
      form.target = '_blank';
      form.style.display = 'none';
      
      // 5. 添加文本参数
      const textInput = document.createElement('input');
      textInput.type = 'hidden';
      textInput.name = 'text';
      textInput.value = shareText;
      form.appendChild(textInput);
      
      // 6. 添加媒体文件
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.name = 'media';
      
      // 转换Blob为File对象
      const file = new File([blob], 'ai-artwork.jpg', { type: 'image/jpeg' });
      
      // 特殊技巧：通过DataTransfer设置文件
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInput.files = dataTransfer.files;
      form.appendChild(fileInput);
      
      // 7. 触发提交
      document.body.appendChild(form);
      form.submit();
      
      // 8. 清理
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
        document.body.removeChild(form);
      }, 1000);
      
    } catch (error) {
      console.error('分享失败:', error);
      // 降级方案：使用原始URL分享
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(
        `Check out my AI artwork: ${imageUrl}\n\n#StyleIDChallenge #AIArt`
      )}`, '_blank');
    }
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

  const handleDownloadImage = (imageUrl: string) => {
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
    <div className="fixed top-[120px] flex flex-col flex-grow bg-background w-full lg:w-[78vw] lg:ml-[22vw] xl:w-[71vw] xl:ml-[28vw] px-2" style={{ maxHeight: "65vh" }}>
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
      <div className="relative z-1 top-[8px] flex flex-col space-y-6 overflow-y-auto hide-scrollbar max-h-[76vh] pb-[54px] lg:pb-0">
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
                      onClick={() => handleDownloadImage(message.content.startsWith('//') ? `https:${message.content}` : message.content)}
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
                        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                        if (isMobile) {
                          window.open(`instagram://library?AssetPath=${encodeURIComponent(message.content)}`);
                        } else {
                          window.open('https://www.instagram.com/', '_blank');
                        }
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
                      onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(message.content)}`, '_blank', 'width=600,height=400')}
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
                          ? `whatsapp://send?text=${encodeURIComponent('Check out this image: ' + message.content)}`
                          : `https://web.whatsapp.com/send?text=${encodeURIComponent('Check out this image: ' + message.content)}`;
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