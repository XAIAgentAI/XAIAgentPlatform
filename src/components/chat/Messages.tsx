import React, { FC, useEffect, useState, RefObject, Dispatch, SetStateAction } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
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
}

async function deleteMessages(userName: string | null, agentId: string, setConversations: Dispatch<SetStateAction<Conversations>>): Promise<void> {
  const url = `/api/chat/${agentId}/messages`;

  // 构建请求体
  const requestBody = {
    user: userName, // 将userName赋值给user参数
  };

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json', // 设置请求头
    },
    body: JSON.stringify(requestBody), // 将请求体转换为JSON字符串
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete messages: ${errorText}`);
  }

  // 更新本地的 conversations 状态，清空指定 agentId 的消息数组
  setConversations((prev: Conversations): Conversations => {
    const newConversations = { ...prev };
    newConversations[agentId] = [];
    return newConversations;
  });
}

const MessagesComponent: FC<MessagesComponentProps> = ({ userName, agentId, isLoading, conversations, setConversations, messagesEndRef }) => {
  const [messages, setMessages] = useState<Message[]>(conversations[agentId] || []);

  useEffect(() => {
    setMessages(conversations[agentId] || []);
  }, [conversations, agentId]);

  const isValidDate = (dateString: string): boolean => {
    return !isNaN(Date.parse(dateString));
  };

  return (
    <div className="flex flex-col flex-grow bg-background w-full lg:w-[78vw] lg:ml-[22vw] xl:w-[71vw] xl:ml-[28vw] px-2 py-6" style={{ height: '75vh' }}>
      {messages.length > 0 && (
        <div className="flex justify-end items-center p-4 bg-background w-full lg:w-[71vw]">
          <button
            type="button"
            className="flex items-center justify-center px-2 py-1 bg-zinc-800 text-zinc-700 rounded-full"
            onClick={async () => {
              try {
                await deleteMessages(userName, agentId, setConversations);
              } catch (error) {
                console.error(error);
              }
            }}
          >
            <XMarkIcon className="w-4 h-4 text-zinc-700" />
          </button>
        </div>
      )}
      <div className="flex flex-col space-y-6 overflow-y-auto max-h-[76vh]">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-gray-600 text-white'
                  : 'text-white'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className={`text-xs mt-1 text-white/70`}>
                {isValidDate(message.timestamp) ? new Date(message.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className={`flex justify-center`}>
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessagesComponent;
