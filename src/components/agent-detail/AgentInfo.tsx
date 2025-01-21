import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { CustomButton } from "@/components/ui-custom/custom-button";
import CryptoChart from "@/components/crypto-chart/CryptoChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TokenInfo } from "./TokenInfo";
import { HoldersList } from "./HoldersList";
import Image from "next/image";

interface AgentInfoProps {
  agentId: string;
  name: string;
  avatar: string;
  createdAt: string;
  creatorAddress: string;
}

export function AgentInfo({ agentId, name, avatar, createdAt, creatorAddress }: AgentInfoProps) {
  return (
    <Card className="p-6 bg-[#1C1C1C]">
      {/* Agent基本信息 */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="h-10 w-10">
            <img
              src="/logo.png"
              alt="Agent avatar"
              className="h-full w-full object-cover"
            />
          </Avatar>
          
          <div>
            <h1 className="text-xl font-semibold">Prefrontal Cortex Convo Agent</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="text-white text-[10px] font-normal font-['Sora'] leading-[10px] opacity-50">$CONVO</div>
              <div className="w-[120px] h-[21px] pl-2 pr-[9.54px] pt-1.5 pb-[6.08px] bg-white/10 rounded-[100px] justify-center items-center inline-flex overflow-hidden relative">
                <div className="text-white text-[10px] font-normal font-['Sora'] leading-[10px] opacity-70">0x1C4C...F463a3</div>
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
            >
              <Image src="/images/chat.svg" alt="Chatting" width={12} height={12} />
              Chatting
            </CustomButton>

          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Created by:</span>
            <Avatar className="h-10 w-10">
              <img
                src="/logo.png"
                alt="Creator avatar"
                className="h-full w-full object-cover rounded-full"
              />
            </Avatar>
          </div>
          <div className="text-sm text-gray-500">
            4 months ago
          </div>
        </div>
      </div>

      {/* K线图 */}
      <div className="mt-6">
        <CryptoChart />
      </div>

      {/* 市场数据 */}
      <div className="grid grid-cols-6 gap-6 mt-6 p-4 bg-[#2C2C2C] rounded-lg">
        <div className="text-sm">
          <p className="text-xs text-gray-500 mb-1">Market Cap</p>
          <p className="font-medium text-white">$96.6m</p>
          <p className="text-green-500">+5.64%</p>
        </div>
        <div className="text-sm">
          <p className="text-xs text-gray-500 mb-1">Total Value</p>
          <p className="font-medium text-white">$19m</p>
        </div>
        <div className="text-sm">
          <p className="text-xs text-gray-500 mb-1">Holders</p>
          <p className="font-medium text-white">108,080</p>
        </div>
        <div className="text-sm">
          <p className="text-xs text-gray-500 mb-1">24h Volume</p>
          <p className="font-medium text-white">$8.5m</p>
        </div>
        <div className="text-sm">
          <p className="text-xs text-gray-500 mb-1">Lifetime</p>
          <p className="font-medium text-white">1,225,393</p>
        </div>
      </div>

      {/* 标签页内容 */}
      <div className="mt-6">
        <Tabs defaultValue="information" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="information">Information</TabsTrigger>
            <TabsTrigger value="holders">Holders</TabsTrigger>
          </TabsList>
          
          <TabsContent value="information">
            <TokenInfo />
          </TabsContent>
          
          <TabsContent value="holders">
            <HoldersList />
          </TabsContent>
        </Tabs>
      </div>

      {/* Description */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Description</h2>
        <p className="text-sm text-gray-400">
          AIXBT tracks CT discussions and leverages its proprietary engine to identify high momentum plays, and play games. AIXBT token holders gain access to its analytics platform.
        </p>
      </div>
    </Card>
  );
} 