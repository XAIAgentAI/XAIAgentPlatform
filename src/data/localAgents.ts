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
  descriptionEN?: string;
  totalSupply?: string;
  useCases?: string[];
  socialLinks?: string;
  chatEntry?: string;
}

export const localAgents: LocalAgent[] = [
  {
    id: 1,
    name: "XAIAgent",
    tokens: "0x16d83F6B17914a4e88436251589194CA5AC0f452",
    avatar: "/logo/XAIAgent.png",
    symbol: "XAA",
    type: "Platform",
    marketCap: "TBA",
    change24h: "0",
    lifetime: "",
    tvl: "$0",
    holdersCount: 0,
    volume24h: "$0",
    status: "IAO launching soon.",
    description: "XAIAgent tracks CT discussions and leverages its proprietary engine to identify high momentum plays, and play games. XAIAgent token holders gain access to its analytics platform.",
    createdAt: "4 months ago",
    creatorAddress: "0x1C4C...F463a3",
    detailDescription: "XAIAgent is a decentralized AI Agent platform on the DBC chain, offering AI Agent creation, operation, and trading. It features the XAIAgent Platform for no-code Agent creation and the XAgentScope Framework for advanced development.",
    useCases: [
      "Find the latest research about AI",
      "I'll provide a research paper link. Please analyze it",
      "I will upload a PDF paper! Use critical skills to read it",
      "Type 'LS' to list my built-in critical reading skills",
    ],
    socialLinks: "https://x.com/XAIAgentAI, https://github.com/XAIAgentAI, https://t.me/XAIAgentAI",
  },
  {
    id: 2,
    name: "SuperImage",
    tokens: "0x07D325030dA1A8c1f96C414BFFbe4fBD539CED45",
    avatar: "/logo/SuperImage.png",
    symbol: "SIC",
    type: "Infrastructure",
    marketCap: "TBA",
    change24h: "0",
    lifetime: "",
    tvl: "$0",
    holdersCount: 0,
    volume24h: "$0",
    status: "TBA",
    description: "SuperImage is a Decentralized Image Generation AI with multiple latent text-to-image diffusion models, empowering billions to create stunning art within seconds through its AI Agent infrastructure.",
    createdAt: "3 months ago",
    creatorAddress: "0x2D5D...E574b4",
    detailDescription: "SuperImage has multiple latent text-to-image diffusion models for generating photo-realistic images given any text input, fostering autonomous freedom to produce incredible imagery, empowering billions of people to create stunning art within seconds.",
    descriptionEN: "SuperImage is a Decentralized Image Generation AI. SuperImage has multiple latent text-to-image diffusion models of generating photo-realistic images given any text input, cultivates autonomous freedom to produce incredible imagery, empowers billions of people to create stunning art within seconds. SuperImage is the infrastructure for AI Agents, providing API interfaces for AI Agents to utilize. Official website address: www.superimage.ai",
    totalSupply: "5 Billion SIC",
    useCases: [
      "Draw a picture of a girl with festive holiday costume",
      "Red and white striped Christmas hat and clothes",
      "Dark brown hair with delicate makeup",
      "Christmas tree in background",
      "A photorealistic wildlife portrait of a snow leopard"
    ],
    socialLinks: "https://x.com/SuperImageAI, https://t.me/SuperImageAI, https://t.me/SuperImageKorea, https://t.me/SuperImageJapan",
    chatEntry: "https://app.superimage.ai"
  },
  {
    id: 3,
    name: "DecentralGPT",
    tokens: "0x18386F368e7C211E84324337fA8f62d5093272E1",
    avatar: "/logo/DecentralGPT.png",
    symbol: "DGC",
    type: "Infrastructure",
    marketCap: "TBA",
    change24h: "0",
    lifetime: "",
    tvl: "$0",
    holdersCount: 0,
    volume24h: "$0",
    status: "TBA",
    description: "DecentralGPT is a Decentralized LLM AI supporting worldwide deployment of top-tier large language models, focused on building safe, privacy-protective, and universally accessible AGI.",
    createdAt: "5 months ago",
    creatorAddress: "0x3E6E...F685c5",
    detailDescription: "DecentralGPT is a decentralized LLM AI inference network. DecentralGPT supports a variety of open-source large language models. It is committed to building a safe, privacy-protective, democratic, transparent, open-source, and universally accessible AGI.",
    descriptionEN: "DecentralGPT is a Decentralized Large Language Model AI. DGPT supports decentralized deployment of various top-tier large language models (LLMs) worldwide, significantly reducing the cost of using LLMs. It is committed to building a safe, privacy-protective, democratic, transparent, open-source, and universally accessible AGI. DecentralGPT is the infrastructure for AI Agents, providing API interfaces for AI Agents to utilize. Official website address: www.decentralgpt.org",
    totalSupply: "5 Billion DGC",
    useCases: [
      "Write an article about DecentralGPT's features",
      "Help me solve this math problem",
      "Help me optimize the content below to make it concise and easy to understand",
      "Summarize the differences between DecentralGPT and ChatGPT"
    ],
    socialLinks: "https://x.com/DecentralGPT, https://t.me/DecentralGPT, https://medium.com/@DecentralGPT",
    chatEntry: "https://www.degpt.ai"
  },
  {
    id: 4,
    name: "XPersonity",
    tokens: "",
    avatar: "/logo/XPersonity.png",
    symbol: "XPER",
    type: "AI Agent",
    marketCap: "TBA",
    change24h: "0",
    lifetime: "",
    tvl: "$0",
    holdersCount: 0,
    volume24h: "$0",
    status: "TBA",
    description: "XPersonity analyzes X accounts to provide personality insights, matchmaking between accounts, and creates digital twins that can interact on social platforms on your behalf.",
    createdAt: "2 months ago",
    creatorAddress: "0x4F7F...G796d6",
    detailDescription: "XPersonity creates unique AI personalities for various applications. Token holders can create and trade AI personalities.",
    descriptionEN: "XPersonity is a super fun and incredibly useful tool designed to uncover the personality secrets behind any X account! By analyzing users' posting history, it delivers witty personality analysis. It can matchmake two X accounts and create a digital twin based on your posting history that learns your style and can interact on social platforms on your behalf.",
    totalSupply: "3 Billion XPER",
    useCases: [
      "Analyze @xxxx",
      "Match @xxx and @xxxx",
      "Train my digital twin",
      "Remember the following content: xxxxx"
    ],
    socialLinks: "https://x.com/XPersonity",
    chatEntry: "None"
  },
  {
    id: 5,
    name: "ASIXT",
    tokens: "",
    avatar: "/logo/ASIXT.png",
    symbol: "ASIXT",
    type: "AI Agent",
    marketCap: "TBA",
    change24h: "0",
    lifetime: "",
    tvl: "$0",
    holdersCount: 0,
    volume24h: "$0",
    status: "TBA",
    description: "ASIXT is an AI-powered crypto market assistant that analyzes data from 1000+ KOLs and social media to provide real-time market insights and investment opportunities.",
    createdAt: "1 month ago",
    creatorAddress: "0x5G8G...H807e7",
    detailDescription: "ASIXT provides AI-powered trading signals and market analysis. Token holders get exclusive access to premium signals.",
    descriptionEN: "ASIXT is a smart assistant helping investors catch crypto market opportunities. It analyzes data from 1000+ KOLs and social media to track market trends and sentiment. Holding 100,000 ASIXT tokens unlocks exclusive analysis tools for better investment decisions.",
    totalSupply: "3 Billion ASIXT",
    useCases: [
      "Top 10 meme coins by trading volume in the last 24 hours",
      "What are the new tokens most mentioned by KOLs in the last 24 hours",
      "Send me hourly email notifications about tokens with obvious upward trends",
      "Instantly notify me of genuine tokens issued by well-known figures"
    ],
    socialLinks: "https://x.com/ASIXTAI",
    chatEntry: "None"
  }
]; 