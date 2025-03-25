
import React, { FC, useEffect, useState, RefObject, Dispatch, SetStateAction } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image' ;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  convid: string;
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
  agentId: string;
  setIsNew: React.Dispatch<SetStateAction<string>>;
  agent: string;
}

async function deleteMessages(setIsNew:Dispatch<SetStateAction<string>>, userName: string | null, agentId: string, setConversations: Dispatch<SetStateAction<Conversations>>): Promise<void> {
  const url = `/api/chat/${agentId}/messages`;
  setIsNew("yes");
  // 更新本地的 conversations 状态，清空指定 agentId 的部分消息
  setConversations((prev: Conversations): Conversations => {
    const newConversations = { ...prev };
    newConversations[agentId] = [];
    return newConversations;
  });
}

const MessagesComponent: FC<MessagesComponentProps> = ({ agent, setIsNew, userName, agentId, isLoading, conversations, setConversations, messagesEndRef }) => {
  const [messages, setMessages] = useState<Message[]>(conversations[agentId] || []);

  useEffect(() => {
    setMessages(conversations[agentId] || []);
  }, [conversations[agentId]]);  

  // 自动滚动到最新消息
  useEffect(() => {
    scrollToBottom();
  }, [messages]); // 监听 messages 的变化

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }
  
  const isValidDate = (dateString: string): boolean => {
    return !isNaN(Date.parse(dateString));
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
                await deleteMessages(setIsNew, userName, agentId, setConversations);
              } catch (error) {
                console.error(error);
              }
            }}
          >
            <XMarkIcon className="w-4 h-4 text-white" />
          </button>
        </div>
      )}
      <div className="relative z-1 top-[22px] flex flex-col space-y-6 overflow-y-auto max-h-[76vh]">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start flex-col'}`}
          > 
            <div className="flex flex-row">
            <Image alt={agent} src="/logo/ArgusAI.png" width={24} height={24} className={`${message.role === "user" ? "hidden":"ml-4 rounded-full"}`} style={{width:"28px",height:"28px"}}/>
            <div className={`${message.role === "user" ? 'hidden' : 'text-foreground ml-2 text-md font-semibold'}`}>{agent}</div>
            </div>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-stone-300 dark:bg-zinc-800 text-white'
                  : 'text-foreground'
              }`}
            >
              <p className="text-sm text-justify">{message.content}</p>
              <p className={`text-xs mt-1 text-white/70`}>
                {isValidDate(message.timestamp) ? new Date(message.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessagesComponent;