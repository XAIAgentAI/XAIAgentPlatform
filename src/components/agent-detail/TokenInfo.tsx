export function TokenInfo() {
  const tokenInfo = [
    {
      id: 1,
      text: "Total supply in first 8 years: 100 billion, with 5 billion mined annually thereafter",
    },
    {
      id: 2,
      text: "15% of tokens will be sold through IAO, only accepting $XAA. Investors will receive tokens proportional to their $XAA investment.",
    },
    {
      id: 3,
      text: "After the IAO period, 95% of $XAA will be allocated to the on-chain liquidity pool, never to be revoked, with LP tokens sent to a black hole address. 5% of $XAA will be burned.",
    },
    {
      id: 4,
      text: "After IAO ends, 10% of tokens and $XAA will immediately establish a liquidity pool on DBCSwap, enabling free trading.",
    },
  ];

  return (
    <div className="space-y-4">
      {tokenInfo.map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-2 text-sm text-gray-300"
        >
          <span className="text-gray-500">{item.id}.</span>
          <span>{item.text}</span>
        </div>
      ))}
    </div>
  );
} 