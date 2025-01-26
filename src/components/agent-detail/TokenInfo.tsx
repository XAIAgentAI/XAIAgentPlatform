export function TokenInfo() {
  const tokenInfo = [
    {
      id: 1,
      text: "The total supply of XAA is: 100B",
    },
    {
      id: 2,
      text: "20% of the tokens will be sold through IAO, accepting only $DBC. Investors will receive $XAA proportional to their $DBC investment.",
    },
    {
      id: 3,
      text: "During the 14-day IAO, 50% of the $DBC will be allocated to the project team for ecosystem development, and the remaining 50% will be allocated to on-chain liquidity pools.",
    },
    {
      id: 4,
      text: "After the IAO ends, $XAA and $DBC will immediately establish a trading pair on DBCSwap, enabling free trading of $XAA.",
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