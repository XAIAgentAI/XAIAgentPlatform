import { Card } from "@/components/ui/card";

export function TokenInfoCard() {
  const tokenInfo = [
    "The total supply of XAA is: 100B",
    "20% of the tokens will be sold through IAO, accepting only $DBC. Investors will receive $XAA proportional to their $DBC investment.",
    "During the 14-day IAO, 50% of the $DBC will be allocated to the project team for ecosystem development, and the remaining 50% will be allocated to on-chain liquidity pools.",
    "After the IAO ends, $XAA and $DBC will immediately establish a trading pair on DBCSwap, enabling free trading of $XAA."
  ];

  return (
    <Card className="p-6 bg-card mt-6">
      <div className="space-y-3">
        {tokenInfo.map((info, index) => (
          <div key={index} className="flex items-start gap-2 text-sm opacity-50">
            <span className="text-muted-foreground">{index + 1}.</span>
            <span className="text-secondary">{info}</span>
          </div>
        ))}
      </div>
    </Card>
  );
} 