'use client';

import React, { useState } from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'; // 假设您使用的是heroicons库
import AgentSelector from './AgentSelector'; // 根据您的项目结构调整路径

interface AgentDescription {
  metrics: string;
  prompt: string;
  examples: string[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface HeaderComponentProps {
  userName: string | null;
  agentId: string;
  selectedAgent: string;
  handleAgentSelect: (agent: string) => void;
  isAgentListOpen: boolean;
  setIsAgentListOpen: React.Dispatch<React.SetStateAction<boolean>>;
  agentDescriptions: { [key: string]: AgentDescription };
  setConversations: React.Dispatch<React.SetStateAction<{ [id: string]: Message[] }>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  conversations: { [id: string]: Message[] };
  setUserStatus: React.Dispatch<React.SetStateAction<boolean>>;
}

const HeaderComponent: React.FC<HeaderComponentProps> = ({ setUserStatus, userName, agentId, setIsLoading, selectedAgent, handleAgentSelect, isAgentListOpen, setIsAgentListOpen, agentDescriptions, setConversations, conversations }) => {
  return (
    <div className="flex catcher flex-col items-center justify-center h-[80vh] space-y-2 mt-4 md:justify-start">
      {/* Agent Selection */}
      <div className="relative w-full max-w-sm md:w-[80vw] md:ml-[18vw]">
        <button
          type="button"
          className="flex font-light items-center justify-between px-2 py-1 text-foreground text-lg rounded-full fixed left-[4vw] md:left-[11vw] lg:left-[21vw] xl:left-[calc(22vw+66px)] top-16"
          onClick={() => setIsAgentListOpen(!isAgentListOpen)}
        >
          {selectedAgent}
          {isAgentListOpen ? (
            <ArrowUpIcon className="w-5 h-5 mb-[2px] font-light text-foreground" />
          ) : (
            <ArrowDownIcon className="w-5 h-5 mb-[2px] font-light text-foreground" />
          )}
        </button>
        {isAgentListOpen && (
          <AgentSelector handleAgentSelect={handleAgentSelect} />
        )}
      </div>

      <div className="ml-auto md:ml-42 md:pl-26 h-[78vh]">
        <div className="w-24 h-24 mx-auto">
          <svg className="w-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="12" stroke="white" strokeWidth="0.5" fill="white" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-center">{selectedAgent}</p>
        <p className="text-md text-center">{agentDescriptions[selectedAgent]?.metrics}</p>
        <p className="text-sm text-neutral-700 text-center">
          Created by: <a className="underline text-sm text-neutral-700" href="https://app.xaiagent.com">app.xaiagent.com</a>
        </p>
        <div className="mt-6 flex flex-col items-center justify-center space-y-2">
          <p className="text-center min-w-[72vw] max-w-[72vw]">{agentDescriptions[selectedAgent]?.prompt}</p>
          <div className="flex compress flex-wrap justify-center gap-4">
            {agentDescriptions[selectedAgent]?.examples?.map((example, index) => (
              <div key={index} 
                   className="hover:bg-slate-400 rounded-xl bg-zinc-800 px-4 py-6 text-zinc-700 text-sm flex items-center justify-center w-[210px] md:w-[180px] lg:w-19vw min-h-[4rem]"
                   onClick={async () => {
                     if (!userName) {
                       setUserStatus(false);
                       setTimeout(() => {
                        setUserStatus(true);
                       }, 1000);
                       return;
                     }
                     
                     const userMessage: Message = {
                       id: Date.now().toString(),
                       role: 'user',
                       content: example,
                       timestamp: new Date().toISOString(),
                     };

                     setConversations(prev => ({ ...prev, [agentId]: [...prev[agentId] || [], userMessage] }));
                     setIsLoading(true);

                     try {
                       const response = await fetch(`/api/chat/${agentId}/messages`, {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify({ message: example, user: userName, thing: "message", isNew: "yes" }),
                       });

                       const data = await response.json();
                       setIsLoading(false);

                       setConversations(prev => ({ ...prev, [agentId]: [...prev[agentId] || [], {
                         id: `${data.convid}-${Date.now()}`,
                         role: 'assistant',
                         content: data.assistant,
                         timestamp: new Date().toISOString(),
                       }] }));

                     } catch (error) {
                       console.error('Failed to send message:', error);
                     }
                   }}
              >
                {example}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 添加媒体查询以适应屏幕宽度小于400px的情况 */}
      <style jsx>{`
        @media (max-width: 400px) {
          .catcher {
            height:80vh;
          }
          .compress {
            max-height:100px;
            overflow:scroll;
          }
        }
      `}</style>
    </div>
  );
};

export default HeaderComponent;
