import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import CryptoChart from "@/components/crypto-chart/CryptoChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TokenInfo } from "./TokenInfo";
import { HoldersList } from "./HoldersList";

interface AgentInfoProps {
  agentId: string;
}

export function AgentInfo({ agentId }: AgentInfoProps) {
  return (
    <Card className="p-6 bg-[#1C1C1C]">
      {/* Agent基本信息 */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <img
              src="/placeholder-avatar.jpg"
              alt="Agent avatar"
              className="h-full w-full object-cover"
            />
          </Avatar>
          
          <div>
            <h1 className="text-xl font-semibold">Prefrontal Cortex Convo Agent</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500">{agentId}</span>
              <button className="text-sm text-gray-500 hover:text-gray-700">
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
              </button>
            </div>
            <div className="mt-1 text-sm text-gray-500">
              Created 4 months ago
            </div>
          </div>
        </div>

        <Button variant="default" className="bg-orange-500 hover:bg-orange-600">
          Chatting
        </Button>
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