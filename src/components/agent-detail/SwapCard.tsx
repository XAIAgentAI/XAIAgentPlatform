import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CustomButton } from "@/components/ui-custom/custom-button";

export function SwapCard() {
  return (
    <Card className="p-6 bg-[#1C1C1C]">
      <h2 className="text-xl font-semibold mb-6 pb-4 border-b border-gray-800">Swap</h2>
      
      {/* You pay section */}
      <div className="relative space-y-[20px]">
        <div className="flex flex-col gap-2 p-4 bg-[#2C2C2C] rounded-lg">
          <label className="text-sm text-gray-500">You pay</label>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 flex-1">
              <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
                <span className="text-xs">D</span>
              </div>
              <span className="text-gray-300">DRC</span>
            </div>
            <div className="relative flex-1 max-w-[140px]">
              <Input
                type="text"
                placeholder="0.0"
                className="bg-transparent border-none text-right text-lg font-medium text-gray-300 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-500"
              />
            </div>
          </div>
        </div>

        <div className="absolute left-1/2 top-[calc(50%-20px)] -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-[#2C2C2C] rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors z-10 border border-gray-700">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 8L12 3L7 8M7 16L12 21L17 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div className="flex flex-col gap-2 p-4 bg-[#2C2C2C] rounded-lg">
          <label className="text-sm text-gray-500">You receive</label>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 flex-1">
              <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
                <span className="text-xs">D</span>
              </div>
              <span className="text-gray-300">DRC</span>
            </div>
            <div className="relative flex-1 max-w-[140px]">
              <Input
                type="text"
                placeholder="0.0"
                className="bg-transparent border-none text-right text-lg font-medium text-gray-300 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Swap button */}
      <CustomButton 
        className="w-full mt-6 text-base font-medium rounded-[100px]"
      >
        Swap
      </CustomButton>

      {/* Powered by text */}
      <div className="text-center mt-4 text-sm text-gray-500">
        Powered by DECSwap
      </div>
    </Card>
  );
} 