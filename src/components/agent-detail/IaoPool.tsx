import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CustomButton } from "@/components/ui-custom/custom-button";

export function IaoPool() {
  return (
    <Card className="p-6 bg-card">
        <h2 className="text-xl font-semibold mb-3 pb-2 border-b border-border-dark">IAO Pool</h2>
        <div className="text-sm flex items-center mt-2">
            <p className="text-xs text-muted-foreground opacity-50 mr-1">Total XAA in the IAO pool :</p>
            <p className="text-foreground">20,000,000,000</p>
        </div>
        <div className="text-sm flex items-center">
            <p className="text-xs text-muted-foreground opacity-50 mr-1">Current total of DBC in the IAO pool :</p>
            <p className="text-foreground">1000</p>
        </div>
        <div className="text-sm flex items-center">
            <p className="text-xs text-muted-foreground opacity-50 mr-1">End countdown :</p>
            <p className="text-foreground">24h 45m 35s</p>
        </div>
        <div className="flex flex-col gap-2 mt-4 p-4 bg-card-inner rounded-lg">
            <label className="text-sm text-muted-foreground">You send</label>
            <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 flex-1">
                <div className="w-6 h-6 rounded-full bg-card-inner-hover flex items-center justify-center">
                <span className="text-xs">D</span>
                </div>
                <span className="text-secondary">DBC</span>
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

      {/* Send button */}
      <CustomButton 
        className="w-full mt-6 text-base font-medium rounded-[100px]"
      >
        Send
      </CustomButton>

      <div className="text-center mt-4 text-xs text-muted-foreground">
        I have transferred the number of DBC to the IAO pool: 100
      </div>
    </Card>
  );
} 