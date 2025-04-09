'use client';

import React, { useState,useEffect } from 'react';
import { GradientBorderButton } from "@/components/ui-custom/gradient-border-button";
import AgentSelector from './AgentSelector'; 
import Image from 'next/image';

interface AgentDescription {
  prompt: string;
  examples: string[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
  convid: string;
  agent: string;
}

interface HeaderComponentProps {
  agent: string,
  convid: string;
  userName: string | null;
  setUserName: any;
  selectedAgent: string;
  handleAgentSelect: (agent: string) => void;
  isAgentListOpen: boolean;
  setIsAgentListOpen: React.Dispatch<React.SetStateAction<boolean>>;
  agentDescriptions: { [key: string]: AgentDescription };
  setConversations: React.Dispatch<React.SetStateAction<{ [id: string]: Message[] }>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  conversations: { [id: string]: Message[] };
  setUserStatus: React.Dispatch<React.SetStateAction<boolean>>;
  setIsNew: React.Dispatch<React.SetStateAction<string>>;
  agentMarket: any;
}

const HeaderComponent: React.FC<HeaderComponentProps> = ({ agentMarket, setUserName, setIsNew, convid, setUserStatus, userName, agent, setIsLoading, selectedAgent, handleAgentSelect, isAgentListOpen, setIsAgentListOpen, agentDescriptions, setConversations, conversations }) => {
  const [index,setIndex] = useState(0);
  const src: {[key:string]:string} = {
    "Xaiagent":"/logo/XAIAgent.png",
    "StyleID":"/logo/StyleID.png",
    "LogoLift":"/logo/LogoLift.png",
    "PicSpan":"/logo/PicSpan.png"
  };
  useEffect(()=>{
    if(agent === "Xaiagent"){
      setIndex(0);
    } else if (agent === "StyleID"){
      setIndex(1);
    } else if (agent === "LogoLift"){
      setIndex(4);
    } else {
      setIndex(3);    
    }
  },[agent])
  return (
    <div className="flex catcher flex-col items-center justify-center h-[70vh] md:h-[78vh] space-y-2 mt-4 md:justify-start md:mt-12">
      <div className="w-[80vw] mx-auto lg:ml-[20vw] flex flex-row justify-center h-[70vh] lg:h-[78vh]">
      <div className="h-[78vh]">
        <div className="w-24 h-24 mx-auto mb-4">
          <Image src={`${src[agent]}`} width={24} height={24} alt="logo" className="mx-auto w-[10vh] h-[10vh] rounded-full relative top-2 md:top-4" style={{width:"96px",height:"96px"}}></Image>
        </div>
        <p className="text-lg font-semibold text-center">{agent}</p>
        <p className="text-md text-center">Data {agentMarket[index]?.priceChange24h < 0 ? "" : "+"}{agentMarket[index]?.priceChange24h || "0.00"}% | Market Cap: {agentMarket[index]?.marketCap || "$0"}</p>
        <p className="text-sm text-neutral-700 text-center">
          Created by: <a className="underline text-sm text-neutral-700" href="https://app.xaiagent.io">app.xaiagent.io</a>
        </p>
        <div className="mt-6 flex flex-col items-center justify-center space-y-2">
          <p className="text-center min-w-[72vw] max-w-[72vw]">{agentDescriptions[selectedAgent]?.prompt}</p>
          <div className="flex compress flex-wrap justify-center gap-4 max-h-[240px] overflow-y-hidden hide-scrollbar">
            {agentDescriptions[selectedAgent]?.examples?.map((example, index) => (
              <div key={index} 
                   className="bg-card-inner hover:bg-card-inner-hover dark:bg-[rgba(22,22,22,0.8)] dark:hover:bg-[rgba(22,22,22,0.96)] rounded-xl dark:bg-zinc-800 px-2 py-6 text-stone-700 dark:text-neutral-300 font-light text-sm text-center flex items-center justify-center w-[210px] md:w-[140px] lg:w-[180px] min-h-[5rem]"
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
                       time: new Date().toISOString(),
                       convid: convid,
                       agent: agent
                     };

                     setConversations(prev => ({ ...prev, ["1"]: [...prev["1"] || [], userMessage] }));
                     setIsLoading(true);

                     try {
                       const response = await fetch(`/api/chat/messages`, {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify({ message: example, user: userName, thing: "message", isNew: "yes", model: "DeepSeek V3", agent}),
                       });

                       setIsNew("no");

                       const data = await response.json();
                       setIsLoading(false);

                       setConversations(prev => ({ ...prev, ["1"]: [...prev["1"] || [], {
                         id: `${data.convid}-${Date.now()}`,
                         role: 'assistant',
                         content: data.assistant,
                         time: new Date().toISOString(),
                         convid: convid,
                         agent: agent
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
      </div>

      {/* 添加媒体查询以适应屏幕宽度小于500px的情况 */}
      <style jsx>{`
        @media (max-width: 560px) {
          .catcher {
            height:80vh;
          }
          .compress {
            max-height:180px;
            overflow:scroll;
          }
        }
      `}</style>
    </div>
  );
};

export default HeaderComponent;