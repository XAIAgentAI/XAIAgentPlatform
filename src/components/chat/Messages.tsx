import React, { FC } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  conversation: number;
}

interface MessagesComponentProps {
  messages: Message[];
  isLoading: boolean;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  messagesEndRef: any;
  agentId: string;
}

async function deleteMessages(agentId: string): Promise<void> {
  const url = `/api/chat/${agentId}/messages`;
  const response = await fetch(url, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete messages: ${errorText}`);
  }

}

const MessagesComponent: FC<MessagesComponentProps> = ({ agentId, messages, isLoading, setMessages, messagesEndRef }) => {
  return (
    <div className="flex flex-col flex-grow bg-background w-full lg:w-[78vw] lg:ml-[22vw] xl:w-[71vw] xl:ml-[28vw] px-2 py-6" style={{ height: '75vh' }}>
      {messages.length > 0 && (
        <div className="flex justify-end items-center p-4 bg-background w-full lg:w-[71vw]">
          <button
            type="button"
            className="flex items-center justify-center px-2 py-1 bg-zinc-800 text-zinc-700 rounded-full"
            onClick={() => {setMessages([]);(async () => {
              try {
                await deleteMessages(agentId);
              } catch (error) {
                console.error(error);
              }
            })();
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
                {new Date(message.timestamp).toLocaleTimeString()}
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
