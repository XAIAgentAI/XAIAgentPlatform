import { Card } from "@/components/ui/card";

export function TokenInfoCard() {
  const tokenInfo = [
    "The total amount of AIXBT issued is: 1000M",
    "Total amount of liquid tokens: 800M",
    "The founder holds 200M tokens in total: 100M tokens with unlock schedule to be announced, and another 100M tokens reserved for ecosystem development with unlock schedule to be announced",
    "The amount of SAIXBT and SXAA Pool1 tokens is 30.34M and 4.78M, respectively",
    "The amount of SAIXBT and SXAA Pool2 tokens is 80.34M and 1.23M, respectively",
    "The number of SAIXBT and SDBC Pool tokens is 70.34M and 50.67K, respectively",
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