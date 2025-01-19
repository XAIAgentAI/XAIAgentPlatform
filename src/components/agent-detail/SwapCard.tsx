import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SwapCard() {
  return (
    <Card className="p-6 bg-[#1C1C1C]">
      <h2 className="text-xl font-semibold mb-6">Swap</h2>
      
      {/* You pay section */}
      <div className="space-y-2">
        <label className="text-sm text-gray-500">You pay</label>
        <div className="flex items-center gap-2 p-4 bg-[#2C2C2C] rounded-lg">
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

      {/* Swap icon */}
      <div className="flex justify-center my-4">
        <button className="w-8 h-8 rounded-full bg-[#2C2C2C] hover:bg-[#3C3C3C] flex items-center justify-center transition-colors">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
            />
          </svg>
        </button>
      </div>

      {/* You receive section */}
      <div className="space-y-2">
        <label className="text-sm text-gray-500">You receive</label>
        <div className="flex items-center gap-2 p-4 bg-[#2C2C2C] rounded-lg">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
              <span className="text-xs">X</span>
            </div>
            <span className="text-gray-300">XAA</span>
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

      {/* Swap button */}
      <Button className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white font-medium">
        Swap
      </Button>

      {/* Powered by text */}
      <div className="text-center mt-4 text-sm text-gray-500">
        Powered by DECSwap
      </div>
    </Card>
  );
} 