'use client';

import React, { useState, useEffect } from 'react';
import { GradientBorderButton } from "@/components/ui-custom/gradient-border-button";
import { useTranslations } from 'next-intl';
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
  setInput: any;
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

const HeaderComponent: React.FC<HeaderComponentProps> = ({ 
  setInput, 
  agentMarket, 
  setUserName, 
  setIsNew, 
  convid, 
  setUserStatus, 
  userName, 
  agent, 
  setIsLoading, 
  selectedAgent, 
  handleAgentSelect, 
  isAgentListOpen, 
  setIsAgentListOpen, 
  agentDescriptions, 
  setConversations, 
  conversations 
}) => {
  const [index, setIndex] = useState(0);
  const [symbol, setSymbol] = useState("XAA");
  const t = useTranslations("agentList");

  useEffect(()=>{
    if(agent === "Xaiagent"){
      setSymbol("XAA");
    } else if (agent === "StyleID"){
      setSymbol("STID");
    } else if (agent === "LogoLift"){
      setSymbol("Logo");
    } else {
      setSymbol("PIS");
    }
  },[agent])
  
  const src: {[key:string]:string} = {
    "Xaiagent":"/logo/XAIAgent.png",
    "StyleID":"/logo/StyleID.png",
    "LogoLift":"/logo/LogoLift.png",
    "PicSpan":"/logo/PicSpan.png"
  };

  useEffect(() => {
    if(agent === "Xaiagent") {
      setIndex(0);
    } else if (agent === "StyleID") {
      setIndex(1);
    } else if (agent === "LogoLift") {
      setIndex(4);
    } else {
      setIndex(3);    
    }
  }, [agent]);

  const handleExampleClick = async (example: string) => {
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
  };

  const handleHeaderClick = (input:String) => {
    setInput(input);
  }

  return (
    <div className="fixed top-28 lg:top-32 left-[10vw] flex flex-col items-center justify-center h-[70vh] md:h-[78vh] space-y-2 md:justify-start">
      <div className="w-[80vw] mx-auto lg:ml-[10vw] flex flex-row justify-center h-[70vh] lg:h-[78vh]">
        <div className="h-[78vh]">
          <div className="w-24 h-24 mx-auto mb-1">
            <Image 
              src={`${src[agent]}`} 
              width={96}
              height={96}
              alt="logo" 
              className="mx-auto rounded-full"
            />
          </div>
          <p className="text-lg font-semibold text-center">{agent}</p>
          <div className="text-md text-center flex flex-row items-center justify-center gap-1">
            <p>{symbol}</p>
            <p className={agentMarket[index]?.priceChange24h < 0 ? "text-red-500" : agentMarket[index]?.priceChange24h > 0 ? "text-green-500" : ""}>
              {agentMarket[index]?.priceChange24h < 0 ? "" : "+"}
              {agentMarket[index]?.priceChange24h || "0.00"}%
            </p>
            <p>|</p>
            <p>{t("marketCap")}: {agentMarket[index]?.marketCap || "$0"}</p>
          </div>
          <p className="text-sm text-neutral-700 dark:text-neutral-300 text-center">
            {t("tvl")}: {agentMarket[index]?.marketCap? `$${Number(agentMarket[index]?.marketCap.substring(1))/(Number(agentMarket[index]?.marketCapTokenNumber)||100000000000)}` : "$0"}
          </p>
          
          <div className="mt-6 flex flex-col items-center justify-center space-y-4">
            <p className="text-center w-full max-w-[72vw]">
              {agentDescriptions[selectedAgent]?.prompt}
            </p>
            
            {/* Horizontal scrolling container for examples */}
            <div className="w-full max-w-[73vw] lg:max-w-[70vw] xl:max-w-[68vw] relative mx-auto flex justify-center">
              {/* Gradient fade indicators */}
              <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
                
              <div className="overflow-x-auto pb-4 scroll-container">
                <div className="flex space-x-4 w-full px-2">
                  {agentDescriptions[selectedAgent]?.examples?.map((example, index) => (
                    <div
                      key={index}
                      className="bg-card-inner hover:bg-card-inner-hover dark:bg-[rgba(22,22,22,0.8)] dark:hover:bg-[rgba(22,22,22,0.96)] 
                        rounded-xl px-4 py-6 text-stone-700 dark:text-neutral-300 font-light text-sm flex-shrink-0 
                        w-[250px] min-w-[200px] max-w-[280px] flex items-center justify-center transition-all duration-200 
                        hover:scale-[1.02] cursor-pointer shadow-sm"
                      onClick={() => handleHeaderClick(example)}
                    >
                      <p>{example}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .scroll-container {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        
        .scroll-container::-webkit-scrollbar {
          display: none; /* Chrome, Safari and Opera */
        }
      `}</style>
    </div>
  );
};

export default HeaderComponent;