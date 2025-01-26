import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { CustomButton } from "@/components/ui-custom/custom-button";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CryptoChart from "@/components/crypto-chart/CryptoChart";
import { HoldersList } from "./HoldersList";
import { MarketData } from "./MarketData";
import { useAgentStore } from "@/store/useAgentStore";
import { toast } from "@/components/ui/use-toast";
import { useDBCToken } from "@/hooks/useDBCToken";

interface AgentInfoProps {
  agentId: string;
}

export function AgentInfo({ agentId }: AgentInfoProps) {
  const { getAgentById } = useAgentStore();
  const agent = getAgentById(Number(agentId));
  const { tokenData, loading, error } = useDBCToken(agent?.tokens || null);

  if (loading) {
    return (
      <Card className="p-6 bg-card">
        <div className="text-foreground text-center">Loading...</div>
      </Card>
    );
  }

  if (error || !agent || !tokenData) {
    return (
      <Card className="p-6 bg-card">
        <div className="text-foreground text-center">
          {error || "Agent not found"}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-card">
      {/* Agent Basic Information */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <img
              src={agent.avatar}
              alt="Agent avatar"
              className="h-full w-full object-cover"
            />
          </Avatar>
          
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold">{tokenData.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="text-muted-color text-[10px] font-normal font-['Sora'] leading-[10px]">${tokenData.symbol}</div>
              <div className="min-w-[80px] max-w-full h-[21px] pl-2 pr-[9.54px] pt-1.5 pb-[6.08px] bg-white/10 rounded-[100px] flex items-center overflow-hidden">
                <div className="text-tertiary-color text-[10px] font-normal font-['Sora'] leading-[10px] truncate">
                  {tokenData.address}
                </div>
                <CustomButton 
                  className="p-0 bg-transparent hover:bg-transparent text-gray-500 hover:text-gray-700 ml-[10px] flex-shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(tokenData.address);
                    toast({
                      description: "Contract address copied to clipboard",
                    });
                  }}
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

        <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Created by:</span>
            <Avatar className="h-7 w-7">
              <img
                src={agent.avatar}
                alt="Creator avatar"
                className="h-full w-full object-cover rounded-full"
              />
            </Avatar>
          </div>
          <div className="text-xs text-muted-foreground">
            {agent.createdAt}
          </div>
        </div>
      </div>

      {/* Candlestick Chart */}
      <div className="mt-6">
        <CryptoChart />
      </div>

      {/* Tabs */}
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
            <MarketData tokenData={tokenData} />
          </TabsContent>
          
          <TabsContent value="holders">
            <HoldersList tokenAddress={tokenData.address} holders={tokenData.holders} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Description */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Description</h2>
        <p className="text-sm text-muted-foreground">
          {agent.detailDescription}
        </p>
      </div>
    </Card>
  );
} 