import React, { FC, useEffect, useState, RefObject, Dispatch, SetStateAction } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
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
}

async function deleteMessages(setIsNew:Dispatch<SetStateAction<string>>, userName: string | null, setConversations: Dispatch<SetStateAction<Conversations>>): Promise<void> {
  setIsNew("yes");
  // 更新本地的 conversations 状态，清空指定 agentId 的部分消息
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

const MessagesComponent: FC<MessagesComponentProps> = ({ agent, setIsNew, userName, isLoading, conversations, setConversations, messagesEndRef }) => {
  const [messages, setMessages] = useState<Message[]>(conversations["1"] || []);

  useEffect(() => {
    setMessages(conversations["1"] || []);
  }, [conversations["1"]]);  

  // 自动滚动到最新消息
  useEffect(() => {
    scrollToBottom();
  }, [messages]); // 监听 messages 的变化

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }
  
  const isValidDate = (dateString: string): boolean => {
    const datePattern = /^\d{4}-\d{1,2}-\d{1,2}-\d{1,2}-\d{1,2}-\d{1,2}$/;
    return datePattern.test(dateString);
  };  

  return (
    <div className="z-1 flex flex-col flex-grow bg-background w-full lg:w-[78vw] lg:ml-[22vw] xl:w-[71vw] xl:ml-[28vw] px-2 py-6" style={{ maxHeight:"75vh" }}>
      {messages.length > 0 && (
        <div className="flex justify-end items-center p-4 bg-background w-full lg:w-[71vw]">
          <button
            type="button"
            className="fixed right-[10px] top-[113px] flex items-center justify-center px-2 py-1 bg-stone-300 dark:bg-zinc-800 text-zinc-700 rounded-full"
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
            <XMarkIcon className="w-4 h-4 text-white" />
          </button>
        </div>
      )}
      <div className="relative z-1 top-[22px] flex flex-col space-y-6 overflow-y-auto hide-scrollbar max-h-[76vh]">
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
                  ? 'bg-stone-300 dark:bg-zinc-800 text-white'
                  : 'text-foreground'
              }`}
            >
              {message.role === 'assistant' ? (
                <ReactMarkdown>{message.content}</ReactMarkdown>
              ) : (
                <p className="text-sm text-justify">{message.content}</p>
              )}
              <p className={`text-xs mt-1 text-white/70`}>
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
          <div className="flex flex-row">
            <Image alt={agent} src={`${src[agent]||"/logo/XAIAgent.png"}`} width={24} height={24} className={"ml-4 rounded-full"} style={{width:"28px",height:"28px"}}/>
            <div className='text-foreground ml-2 text-md font-semibold'>
              {agent.split('').map((char, index) => (
                <span key={index} className={`inline-block animate-chatthink`}>
                  {char}
                </span>
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessagesComponent;
