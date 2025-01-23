import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { CustomButton } from "@/components/ui-custom/custom-button";
import CryptoChart from "@/components/crypto-chart/CryptoChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TokenInfo } from "./TokenInfo";
import { HoldersList } from "./HoldersList";
import Image from "next/image";
import { useEffect, useState } from "react";
import { MarketData } from "./MarketData";
import { LocalAgent, localAgents } from "@/data/localAgents";

interface AgentInfoProps {
  agentId: string;
}

export function AgentInfo({ agentId }: AgentInfoProps) {
  const [agentData, setAgentData] = useState<LocalAgent | null>(null);

  useEffect(() => {
    const agent = localAgents.find(a => a.id === Number(agentId));
    if (agent) {
      setAgentData(agent);
    }
  }, [agentId]);

  if (!agentData) {
    return (
      <Card className="p-6 bg-card">
        <div className="text-foreground text-center">Agent not found</div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-card">
      {/* Agent基本信息 */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="h-10 w-10">
            <img
              src={agentData.avatar}
              alt="Agent avatar"
              className="h-full w-full object-cover"
            />
          </Avatar>
          
          <div>
            <h1 className="text-xl font-semibold">{agentData.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="text-muted-color text-[10px] font-normal font-['Sora'] leading-[10px]">{agentData.symbol}</div>
              <div className="w-[120px] h-[21px] pl-2 pr-[9.54px] pt-1.5 pb-[6.08px] bg-white/10 rounded-[100px] justify-center items-center inline-flex overflow-hidden relative">
                <div className="text-tertiary-color text-[10px] font-normal font-['Sora'] leading-[10px]">{agentData.creatorAddress}</div>
                <CustomButton 
                  className="p-0 bg-transparent hover:bg-transparent text-gray-500 hover:text-gray-700 ml-[10px]"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </CustomButton>
              </div>
            </div>

            <CustomButton 
              className="flex items-center gap-2 mt-3"
              isChat
            >
              <Image src="/images/chat.svg" alt="Chatting" width={12} height={12} />
              Chatting
            </CustomButton>

          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Created by:</span>
            <Avatar className="h-7 w-7">
              <img
                src={agentData.avatar}
                alt="Creator avatar"
                className="h-full w-full object-cover rounded-full"
              />
            </Avatar>
          </div>
          <div className="text-xs text-muted-foreground">
            {agentData.createdAt}
          </div>
        </div>
      </div>

      {/* K线图 */}
      <div className="mt-6">
        <CryptoChart />
      </div>

      {/* 标签页内容 */}
      <div className="mt-6">
        <Tabs defaultValue="information" className="w-full mt-6">
          <TabsList className="bg-transparent border border-border p-1 mb-4">
            <TabsTrigger 
              value="information"
              className="data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:border data-[state=active]:border-border px-4 py-1"
            >
              Information
            </TabsTrigger>
            <TabsTrigger 
              value="holders"
              className="data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:border data-[state=active]:border-border px-4 py-1"
            >
              Holders
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="information">
            <MarketData agentData={agentData} />
          </TabsContent>
          
          <TabsContent value="holders">
            <HoldersList />
          </TabsContent>
        </Tabs>
      </div>

      {/* Description */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Description</h2>
        <p className="text-sm text-muted-foreground">
          {agentData.detailDescription}
        </p>
      </div>
    </Card>
  );
} 