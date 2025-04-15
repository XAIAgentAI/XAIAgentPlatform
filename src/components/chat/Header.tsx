'use client';

import React, { useState, useEffect } from 'react';
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
  const [isStyleOpen, setIsStyleOpen] = useState(false);
  
  const src: {[key:string]:string} = {
    "Xaiagent":"/logo/XAIAgent.png",
    "StyleID":"/logo/StyleID.png",
    "LogoLift":"/logo/LogoLift.png",
    "PicSpan":"/logo/PicSpan.png"
  };

  // Stable Diffusion style presets
  const stylePresets = [
    { name: "Cinematic", prompt: "cinematic lighting, dramatic atmosphere, film grain, 35mm lens" },
    { name: "Anime", prompt: "anime style, vibrant colors, sharp details, studio ghibli inspired" },
    { name: "Cyberpunk", prompt: "neon lights, futuristic cityscape, rain reflections, cyberpunk 2077 style" },
    { name: "Fantasy", prompt: "ethereal lighting, magical atmosphere, highly detailed, digital painting" },
    { name: "Watercolor", prompt: "soft watercolor texture, gentle brush strokes, pastel colors" },
    { name: "Low Poly", prompt: "low poly geometric shapes, vibrant colors, minimalist 3d style" },
    { name: "Portrait", prompt: "professional portrait photography, shallow depth of field, 85mm lens" },
    { name: "Oil Painting", prompt: "oil on canvas, textured brush strokes, classical art style" }
  ];

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

  const handleStyleSelect = (stylePrompt: string) => {
    setInput(stylePrompt);
    setIsStyleOpen(false);
  };

  return (
    <div className="flex flex-col items-center justify-center h-[70vh] md:h-[78vh] space-y-2 mt-4 md:justify-start md:mt-12">
      <div className="w-[80vw] mx-auto lg:ml-[20vw] flex flex-row justify-center h-[70vh] lg:h-[78vh]">
        <div className="h-[78vh]">
          <div className="w-24 h-24 mx-auto mb-4">
            <Image 
              src={`${src[agent]}`} 
              width={96}
              height={96}
              alt="logo" 
              className="mx-auto rounded-full"
            />
          </div>
          <p className="text-lg font-semibold text-center">{agent}</p>
          <p className="text-md text-center">
            Data {agentMarket[index]?.priceChange24h < 0 ? "" : "+"}{agentMarket[index]?.priceChange24h || "0.00"}% | 
            Market Cap: {agentMarket[index]?.marketCap || "$0"}
          </p>
          <p className="text-sm text-neutral-700 dark:text-neutral-300 text-center">
            Created by: <a className="underline" href="https://app.xaiagent.io">app.xaiagent.io</a>
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
                      onClick={() => handleExampleClick(example)}
                    >
                      <p>{example}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Style selector - only shown for StyleID agent */}
            {agent === "StyleID" && (
              <div className="relative w-full max-w-[72vw] bottom-4">
                <div 
                  className={`flex items-center justify-center space-x-2 ${
                    isStyleOpen ? 'w-full' : 'w-fit'
                  } mx-auto transition-all duration-300 ease-in-out`}
                >
                  <button
                    onClick={() => setIsStyleOpen(!isStyleOpen)}
                    className={`flex items-center space-x-2 rounded-full ${
                      isStyleOpen 
                        ? 'px-4 py-2 bg-card-inner-hover dark:bg-[rgba(30,30,30,0.9)] shadow-md' 
                        : 'px-4 py-2 bg-card-inner dark:bg-[rgba(22,22,22,0.8)] hover:bg-card-inner-hover dark:hover:bg-[rgba(30,30,30,0.9)]'
                    } transition-all duration-200`}
                  >
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      className="flex-shrink-0 text-neutral-600 dark:text-neutral-300"
                    >
                      <path 
                        d="M13 2L3 14H12L11 22L21 10H12L13 2Z" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        fill="currentColor"
                      />
                    </svg>
                    <span className={`${isStyleOpen ? 'opacity-100' : 'opacity-100'} whitespace-nowrap overflow-hidden transition-all duration-200 text-neutral-600 dark:text-neutral-300`}>
                      Styles
                    </span>
                    <p className="text-neutral-600 dark:text-neutral-300">8</p>
                  </button>
                  
                  {isStyleOpen && (
                    <div className="flex space-x-2 overflow-x-auto scroll-container pl-2">
                      {stylePresets.map((style, index) => (
                        <button
                          key={index}
                          onClick={() => handleStyleSelect(style.prompt)}
                          className="px-3 py-1.5 text-xs rounded-full bg-card-inner dark:bg-[rgba(22,22,22,0.8)] hover:bg-card-inner-hover dark:hover:bg-[rgba(30,30,30,0.9)] whitespace-nowrap transition-colors duration-150 text-neutral-600 dark:text-neutral-300"
                        >
                          {style.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
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