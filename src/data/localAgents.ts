export interface LocalAgent {
  id: number;
  name: string;
  avatar: string;
  symbol: string;
  type: "Platform" | "Infrastructure" | "AI Agent";
  marketCap: string;
  change24h: string;
  tvl: string;
  holdersCount: number;
  volume24h: string;
  status: string;
  description?: string;
  detailDescription?: string;
  lifetime?: string;
  createdAt?: string;
  creatorAddress?: string;
}

export const localAgents: LocalAgent[] = [
  {
    id: 1,
    name: "XAIAgent",
    avatar: "/logo/XAIAgent.png",
    symbol: "$XAA",
    type: "Platform",
    marketCap: "TBA",
    change24h: "0",
    lifetime: '',
    tvl: "$0",
    holdersCount: 39596,
    volume24h: "$0",
    status: "IAO is about to begin.",
    description: "XAIAgent tracks CT discussions and leverages its proprietary engine to identify high momentum plays, and play games. XAIAgent token holders gain access to its analytics platform.",
    createdAt: "4 months ago",
    creatorAddress: "0x1C4C...F463a3",
    detailDescription: "XAIAgent tracks CT discussions and leverages its proprietary engine to identify high momentum plays, and play games. XAIAgent token holders gain access to its analytics platform."
  },
  {
    id: 2,
    name: "SuperImage",
    avatar: "/logo/SuperImage.png",
    symbol: "$SIC",
    type: "Infrastructure",
    marketCap: "TBA",
    change24h: "0",
    lifetime: '',
    tvl: "$0",
    holdersCount: 30233,
    volume24h: "$0",
    status: "TBA",
    description: "SuperImage is an AI-powered image generation and editing platform. Token holders can access premium features and participate in governance.",
    createdAt: "3 months ago",
    creatorAddress: "0x2D5D...E574b4",
    detailDescription: "SuperImage is an AI-powered image generation and editing platform. Token holders can access premium features and participate in governance."
  },
  {
    id: 3,
    name: "DecentralGPT",
    avatar: "/logo/DecentralGPT.png",
    symbol: "$DGC",
    type: "Infrastructure",
    marketCap: "TBA",
    change24h: "0",
    lifetime: '',
    tvl: "$0",
    holdersCount: 949586,
    volume24h: "$0",
    status: "TBA",
    description: "DecentralGPT is a decentralized language model platform. Token holders can contribute to model training and earn rewards.",
    createdAt: "5 months ago",
    creatorAddress: "0x3E6E...F685c5",
    detailDescription: "DecentralGPT is a decentralized language model platform. Token holders can contribute to model training and earn rewards."
  },
  {
    id: 4,
    name: "XPersonity",
    avatar: "/logo/XPersonity.png",
    symbol: "$XPE",
    type: "AI Agent",
    marketCap: "TBA",
    change24h: "0",
    lifetime: '',
    tvl: "$0",
    holdersCount: 0,
    volume24h: "$0",
    status: "TBA",
    description: "XPersonity creates unique AI personalities for various applications. Token holders can create and trade AI personalities.",
    createdAt: "2 months ago",
    creatorAddress: "0x4F7F...G796d6",
    detailDescription: "XPersonity creates unique AI personalities for various applications. Token holders can create and trade AI personalities."
  },
  {
    id: 5,
    name: "ASIXT",
    avatar: "/logo/ASIXT.png",
    symbol: "$ASIXT",
    type: "AI Agent",
    marketCap: "TBA",
    change24h: "0",
    lifetime: '',
    tvl: "$0",
    holdersCount: 0,
    volume24h: "$0",
    status: "TBA",
    description: "ASIXT provides AI-powered trading signals and market analysis. Token holders get exclusive access to premium signals.",
    createdAt: "1 month ago",
    creatorAddress: "0x5G8G...H807e7",
    detailDescription: "ASIXT provides AI-powered trading signals and market analysis. Token holders get exclusive access to premium signals."
  }
]; 