export function TokenInfo() {
  const tokenInfo = [
    {
      id: 1,
      text: "The total amount of AIXBT issued is: 1000M",
    },
    {
      id: 2,
      text: "Total amount of liquid tokens: 800M",
    },
    {
      id: 3,
      text: "The founder has 200M tokens, of which 100M is unlocked after xxx%3m. The other 100M is used for ecological construction and will be unlocked after 1500%3km days",
    },
    {
      id: 4,
      text: "The amount of SAIXBT and SXAA Pool1 tokens is 30.34M and 4.78M, respectively",
    },
    {
      id: 5,
      text: "The amount of SAIXBT and SXAA Pool2 tokens is 80.34M and 1.23M, respectively",
    },
    {
      id: 6,
      text: "The number of SAIXBT and SDRC Pool tokens is 70.34M and 50.67K, respectively",
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