import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CustomButton } from "@/components/ui-custom/custom-button";

export function SwapCard() {
  return (
    <Card className="p-6 bg-card">
      <h2 className="text-xl font-semibold mb-6 pb-4 border-b border-border-dark">Swap</h2>
      
      {/* You pay section */}
      <div className="relative space-y-[20px]">
        <div className="flex flex-col gap-2 p-4 bg-card-inner rounded-lg">
          <label className="text-sm text-muted-foreground">You pay</label>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 flex-1">
              <div className="w-6 h-6 rounded-full bg-card-inner-hover flex items-center justify-center">
                <span className="text-xs">D</span>
              </div>
              <span className="text-secondary">DRC</span>
            </div>
            <div className="relative flex-1 max-w-[140px]">
              <Input
                type="text"
                placeholder="0.0"
                className="bg-transparent border-none text-right text-lg font-medium text-secondary p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>

        <div className="absolute left-1/2 top-[calc(50%-20px)] -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-card-inner rounded-full flex items-center justify-center cursor-pointer hover:bg-card-inner-hover transition-colors z-10 border border-border-dark">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 8L12 3L7 8M7 16L12 21L17 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div className="flex flex-col gap-2 p-4 bg-card-inner rounded-lg">
          <label className="text-sm text-muted-foreground">You receive</label>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 flex-1">
              <div className="w-6 h-6 rounded-full bg-card-inner-hover flex items-center justify-center">
                <span className="text-xs">D</span>
              </div>
              <span className="text-secondary">DRC</span>
            </div>
            <div className="relative flex-1 max-w-[140px]">
              <Input
                type="text"
                placeholder="0.0"
                className="bg-transparent border-none text-right text-lg font-medium text-secondary p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
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
      <div className="text-center mt-4 text-xs text-muted-foreground">
        Power by DECSwap
      </div>
    </Card>
  );
} 