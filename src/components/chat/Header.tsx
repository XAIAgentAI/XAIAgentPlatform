'use client';

import React, { useState, useEffect } from 'react';
import { GradientBorderButton } from "@/components/ui-custom/gradient-border-button";
import { useLocale, useTranslations } from 'next-intl';
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
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [symbol, setSymbol] = useState("XAA");
  const [count,setCount] = useState<string>("-");
  const [userNumber,setUserNumber] = useState<string>("-");
  const t = useTranslations("agentList");
  const tl = useTranslations("chat");
  const fetchUserCount = async () => {
    const response = await fetch("/api/chat/data");
    const {count,userNumber} = await response.json();
    setCount(count);
    setUserNumber(userNumber);
  }

  useEffect(()=>{fetchUserCount()},[]);

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

  const fetchUserCount = async () => {
      const response = await fetch("/api/chat/data");
      const {count,userNumber} = await response.json();
      setCount(count);
      setUserNumber(userNumber);
  }
  
  useEffect(()=>{fetchUserCount()},[]);
  
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
          <div className="flex flex-row justify-center">
          <p className="text-lg font-semibold text-end relative left-[30px] lg:left-0">{agent}</p>
          <div className="relative inline-block lg:hidden">
            {/* Button */}
            <button
              onClick={() => setIsTooltipVisible(!isTooltipVisible)}
              className="px-3 ml-4 relative left-[23px] py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-md shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 active:bg-green-700"
            >
              {tl("tips")}
            </button>

            {/* Tooltip */}
            {isTooltipVisible && (
              <>
                {/* Overlay to close tooltip when clicking outside */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsTooltipVisible(false)}
                />
                
                {/* Tooltip content */}
                <div className="absolute z-50 mt-2 w-64 p-4 bg-white dark:bg-[rgb(22,22,22)] rounded-lg shadow-xl border border-gray-200 dark:border-neutral-700 transform -translate-x-1/2 left-1/2">
                  {/* Close button */}
                  <button
                    onClick={() => setIsTooltipVisible(false)}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    aria-label="Close"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Content */}
                  <div className="flex flex-col space-y-2">
                    <div className="flex flex-col items-center">
                      <p className="text-sm text-neutral-700 dark:text-neutral-300 text-center opacity-75">
                        {tl("bottom.rule1")}
                      </p>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300 text-center opacity-75">
                        {tl("bottom.rule2")}
                      </p>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300 text-center opacity-75">
                        {tl("bottom.rule3")}
                      </p>
                    </div>

                    <div className="border-t border-gray-200 dark:border-[rgba(22,22,22,0.3)] my-2"></div>

                    <div className="text-center text-xs text-neutral-600 dark:text-neutral-400">
                      {tl("bottom.auser")} {userNumber} | {tl("bottom.apic")} {count}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          </div>
          <div className="text-md text-center flex flex-row items-center justify-center gap-1">
            <p>{symbol}</p>
            <p className={agentMarket[index]?.priceChange24h < 0 ? "text-red-500" : agentMarket[index]?.priceChange24h > 0 ? "text-green-500" : ""}>
              {agentMarket[index]?.priceChange24h < 0 ? "" : "+"}
              {agentMarket[index]?.priceChange24h || "0.00"}%
            </p>
            <p>|</p>
            <p>{t("marketCap")}: {agentMarket[index]?.marketCap || "$0"}</p>
            <p className="hidden lg:block">|</p>
            <p className="hidden lg:block">
              {t("tvl")}: {agentMarket[index]?.marketCap? `$${Number(agentMarket[index]?.marketCap.substring(1))/(Number(agentMarket[index]?.marketCapTokenNumber)||100000000000)}` : "$0"}
            </p>
          </div>
          <div className="flex flex-row justify-center lg:hidden text-sm"><p>{t("tvl")}: {agentMarket[index]?.marketCap? `$${Number(agentMarket[index]?.marketCap.substring(1))/(Number(agentMarket[index]?.marketCapTokenNumber)||100000000000)}` : "$0"}</p></div>
          <div className="lg:flex w-full flex-row justify-center hidden"> 
            <p className="text-sm text-neutral-700 dark:text-neutral-300 text-center ml-1 opacity-75">
              {tl("bottom.rule1")} |
            </p>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 text-center ml-1 opacity-75">
              {tl("bottom.rule2")} |
            </p>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 text-center ml-1 opacity-75">
              {tl("bottom.rule3")}
            </p>
          </div>    
          <div className="mt-6 flex flex-col items-center justify-center space-y-4">
            <p className="text-center w-full max-w-[72vw]">
              {agentDescriptions[selectedAgent]?.prompt}
            </p>
          
            {agent === "StyleID" && (
              <>
                {/* Mobile view (collapsible) */}
                <div className="lg:hidden w-[280px] mx-auto mt-1 mb-2 overflow-hidden">
                  <div 
                    className="transition-all duration-300 ease-in-out"
                    style={{ height: isExpanded ? 'auto' : '20px' }}
                  >
                    <div 
                      className="flex items-center justify-around cursor-pointer py-0.5 relative"
                      onClick={() => setIsExpanded(!isExpanded)}
                    >
                      <p className={`text-xs text-[#666666] dark:text-[#999999] font-medium tracking-tight opacity-80 ${locale==="zh"?"relative left-[3.7px]":""}`}>
                        Tips: {tl("need")}
                      </p>
                      <svg
                        className={`w-3 h-3 transition-transform duration-300 text-[#666666] dark:text-[#999999] relative opacity-80 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    {isExpanded && (
                      <div className="w-full flex flex-row justify-around">
                        <div className={`mt-0.5 text-xs text-[#666666] dark:text-[#999999] opacity-80 space-y-0.5 relative ${(locale==="zh")?"left-[2px]":""} ${(locale==="ja")?"left-[3.4px]":""} ${(locale==="ko")?"left-[9.4px]":""}`}>
                          <p className={`font-medium relative left-[2px] ${(locale==="ko"||locale==="ja")?"left-[3px]":"left-[2.4px]"}`}>Price: {tl("bottom.price")}</p>
                          <ol className="list-decimal pl-4 space-y-0.5">
                            <li>{tl("bottom.rule1")}</li>
                            <li>{tl("bottom.rule2")}</li>
                            <li>{tl("bottom.rule3")}</li>
                          </ol>
                        </div>
                        <p className="h-0 w-0"></p>
                      </div>
                    )}

                    {isExpanded && (
                      <div className="w-full flex flex-row justify-around">
                        <div className={`mt-0.5 flex items-center text-xs text-[#666666] dark:text-[#999999] opacity-80 relative ${(locale==="ko")?"left-[4.8px]":""}`}>
                          <svg 
                            className="w-3 h-3 mr-1 text-[#666666] dark:text-[#999999] opacity-80" 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                          >
                            <path 
                              fillRule="evenodd" 
                              d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" 
                              clipRule="evenodd" 
                            />
                          </svg>
                          <span>{tl("bottom.auser")} {userNumber||"-"}</span>
                          <span className="ml-2">{tl("bottom.apic")} {count||"-"}</span>
                        </div>
                        <p className="w-0 h-0"></p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Desktop view (always expanded) */}
                <div className="hidden lg:block w-full max-w-[70vw] -mt-2 mb-4">
                  <div className="text-xs text-[#666666] dark:text-[#999999] opacity-80">
                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
                      <span className="font-medium">Tips: {tl("need")}</span>
                      <span className="font-medium">Price: {tl("bottom.price")}</span>
                      <span>1. {tl("bottom.rule1")}</span>
                      <span>2. {tl("bottom.rule2")}</span>
                      <span>3. {tl("bottom.rule3")}</span>
                      <span className="flex items-center">
                        <svg 
                          className="w-3 h-3 mr-1 text-[#666666] dark:text-[#999999] opacity-80" 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path 
                            fillRule="evenodd" 
                            d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" 
                            clipRule="evenodd" 
                          />
                        </svg>
                        {tl("bottom.auser")} {userNumber||"-"}
                      </span>
                      <span className="ml-2">{tl("bottom.apic")} {count||"-"}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
            
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