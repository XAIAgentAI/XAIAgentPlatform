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
  tokens?: string;
}

export const localAgents: LocalAgent[] = [
  {
    id: 1,
    name: "XAIAgent",
    tokens: "0x16d83F6B17914a4e88436251589194CA5AC0f452",
    avatar: "/logo/XAIAgent.png",
    symbol: "$XAA",
    type: "Platform",
    marketCap: "TBA",
    change24h: "0",
    lifetime: '',
    tvl: "$0",
    holdersCount: 0,
    volume24h: "$0",
    status: "IAO launching soon.",
    description: "XAIAgent tracks CT discussions and leverages its proprietary engine to identify high momentum plays, and play games. XAIAgent token holders gain access to its analytics platform.",
    createdAt: "4 months ago",
    creatorAddress: "0x1C4C...F463a3",
    detailDescription: "XAIAgent is a decentralized AI Agent platform on the DBC chain, offering AI Agent creation, operation, and trading. It features the XAIAgent Platform for no-code Agent creation and the XAgentScope Framework for advanced development."
  },
  {
    id: 2,
    name: "SuperImage",
    tokens: "0x07D325030dA1A8c1f96C414BFFbe4fBD539CED45",
    avatar: "/logo/SuperImage.png",
    symbol: "$SIC",
    type: "Infrastructure",
    marketCap: "TBA",
    change24h: "0",
    lifetime: '',
    tvl: "$0",
    holdersCount: 0,
    volume24h: "$0",
    status: "TBA",
    description: "SuperImage is an AI-powered image generation and editing platform. Token holders can access premium features and participate in governance.",
    createdAt: "3 months ago",
    creatorAddress: "0x2D5D...E574b4",
    detailDescription: "SuperImage has multiple latent text-to-image diffusion models for generating photo-realistic images given any text input, fostering autonomous freedom to produce incredible imagery, empowering billions of people to create stunning art within seconds."
  },
  {
    id: 3,
    name: "DecentralGPT",
    tokens: "0x18386F368e7C211E84324337fA8f62d5093272E1",
    avatar: "/logo/DecentralGPT.png",
    symbol: "$DGC",
    type: "Infrastructure",
    marketCap: "TBA",
    change24h: "0",
    lifetime: '',
    tvl: "$0",
    holdersCount: 0,
    volume24h: "$0",
    status: "TBA",
    description: "DecentralGPT is a decentralized language model platform. Token holders can contribute to model training and earn rewards.",
    createdAt: "5 months ago",
    creatorAddress: "0x3E6E...F685c5",
    detailDescription: "DecentralGPT is a decentralized LLM AI inference network. DecentralGPT supports a variety of open-source large language models. It is committed to building a safe, privacy-protective, democratic, transparent, open-source, and universally accessible AGI."
  },
  {
    id: 4,
    name: "XPersonity",
    tokens: "", // TODO
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
    tokens: "", // TODO
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