'use client'

import React, { useState } from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'; // 假设您使用的是heroicons库
import AgentSelector from './AgentSelector'; // 根据您的项目结构调整路径

interface AgentDescription {
  metrics: string;
  prompt: string;
  examples: string[];
}

interface HeaderComponentProps {
  selectedAgent: string;
  handleAgentSelect: (agent: string) => void;
  isAgentListOpen: boolean;
  setIsAgentListOpen: React.Dispatch<React.SetStateAction<boolean>>;
  agentDescriptions: { [key: string]: AgentDescription };
}

const HeaderComponent: React.FC<HeaderComponentProps> = ({ selectedAgent, handleAgentSelect, isAgentListOpen, setIsAgentListOpen, agentDescriptions }) => {
  return (
    <div className="flex flex-col items-center justify-center h-[65vh] space-y-2 mt-4 md:justify-start">
      {/* Agent Selection */}
      <div className="relative w-full max-w-sm md:w-[80vw] md:ml-[18vw]">
        <button
          type="button"
          className="flex items-center justify-between px-2 py-1 bg-zinc-800 text-zinc-700 rounded-full fixed left-[4vw] md:left-[11vw] lg:left-[21vw] xl:left-[calc(21vw+6%)] top-16"
          onClick={() => setIsAgentListOpen(!isAgentListOpen)}
        >
          {selectedAgent}
          {isAgentListOpen ? (
            <ArrowUpIcon className="w-4 h-4 text-zinc-700" />
          ) : (
            <ArrowDownIcon className="w-4 h-4 text-zinc-700" />
          )}
        </button>
        {isAgentListOpen && (
          <AgentSelector handleAgentSelect={handleAgentSelect} />
        )}
      </div>

      <div className="ml-auto md:ml-42 md:pl-26">
        <div className="w-24 h-24 overflow-scroll mx-auto">
          <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          <div className="flex flex-wrap justify-center gap-4">
            {agentDescriptions[selectedAgent]?.examples?.map((example, index) => (
              <div key={index} className="rounded-xl bg-zinc-800 px-4 py-6 text-zinc-700 text-sm flex items-center justify-center w-[210px] md:w-[180px] lg:w-19vw min-h-[4rem]">
                {example}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeaderComponent;
