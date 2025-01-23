'use client';

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Countdown } from "../ui-custom/countdown";

export const IaoPool = () => {
  const [dbcAmount, setDbcAmount] = useState("0.0");

  // 假设剩余5分钟
  const remainingTime = 5 * 60 * 1000; // 5分钟，单位毫秒

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">IAO Pool</h2>

      <div className="space-y-4">
        <div className="text-base text-secondary-foreground">
          Total XAA in the IAO pool: 20,000,000,000
        </div>

        <div className="text-base text-secondary-foreground">
          Current total of DBC in the IAO pool: 1000
        </div>

        <div className="text-base text-secondary-foreground flex items-center gap-2">
          End countdown:
          To be announced
          {/* <Countdown 
            remainingTime={remainingTime}
            onEnd={() => console.log('倒计时结束')} 
          /> */}
        </div>

        <div className="mt-8 p-6 bg-muted rounded-lg">
          <h3 className="text-lg font-semibold mb-4">You send</h3>

          <div className="flex items-center gap-4 mb-6">
            <div className="font-medium">DBC</div>
            <Input
              type="number"
              value={dbcAmount}
              onChange={(e) => setDbcAmount(e.target.value)}
              className="flex-1"
              placeholder="0.0"
            />
          </div>

          <Button className="w-full bg-[#F47521] hover:bg-[#F47521]/90 text-white">
            Send
          </Button>

          <p className="mt-4 text-sm text-muted-foreground">
            I have transferred the number of DBC to the IAO pool: 100
          </p>
        </div>
      </div>
    </Card>
  );
}; 