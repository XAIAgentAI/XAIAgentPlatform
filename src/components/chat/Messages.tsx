import React, { FC } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline'; // 使用@heroicons/react库中的XMarkIcon（outline版）

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string; // 修正为string类型以匹配page.tsx中的定义
}

interface MessagesComponentProps {
  messages: Message[];
  isLoading: boolean;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  messagesEndRef: any;
}

const MessagesComponent: FC<MessagesComponentProps> = ({ messages, isLoading, setMessages, messagesEndRef }) => {
  return (
    <div className="flex flex-col flex-grow bg-background w-full md:w-[80vw] md:ml-[18vw] px-2 py-6">
      {messages.length > 0 && (
        <div className="flex justify-end items-center p-4 bg-background w-full md:w-[80vw]">
          <button
            type="button"
            className="flex items-center justify-center px-2 py-1 bg-zinc-800 text-zinc-700 rounded-full"
            onClick={() => setMessages([])}
          >
            <XMarkIcon className="w-4 h-4 text-zinc-700" />
          </button>
        </div>
      )}
      <div className="flex flex-col space-y-6">
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
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div
            className={`flex justify-center`}
          >
            <p className="text-sm text-gray-500">正在加载...</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessagesComponent;
