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
    description: `XAIAgent is a blockchain-based decentralized AI agent platform that integrates the creation, use, deployment, and trading of AI agents.\n\n
It offers no-code development tools for everyday users while providing the XAgentScope framework for advanced developers.\n\n
Powered by the GPU miner network on the DBC blockchain, XAIAgent ensures fully decentralized AI operations, offering advantages like data privacy, high performance, and low costs.\n\n
The platform comes preloaded with various AI models, enabling complex tasks and multi-turn conversational scenarios.\n\n
Its multi-token economic model fosters sustainable ecosystem growth, making XAIAgent a comprehensive platform for merging AI and blockchain technologies.`,
    createdAt: "4 months ago",
    creatorAddress: "0x1C4C...F463a3",
    totalSupply: "20,000,000,000 XAA",

    useCases: [
      "Help me create an Al Agent",
      "What functions do you have?",
      "What types of Al Agents can you create?",
      "Can you tell me how to use xx as an Agent?",
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
    description: "SuperImage is a Decentralized Image Generation AI. SuperImage has multiple latent text-to-image diffusion models of generating photo-realistic images given any text input, cultivates autonomous freedom to produce incredible imagery, empowers billions of people to create stunning art within seconds. SuperImage is the infrastructure for AI Agents, providing API interfaces for AI Agents to utilize. Official website address: www.superimage.ai",
    createdAt: "3 months ago",
    creatorAddress: "0x2D5D...E574b4",
    descriptionEN: "SuperImage is a Decentralized Image Generation AI. SuperImage has multiple latent text-to-image diffusion models of generating photo-realistic images given any text input, cultivates autonomous freedom to produce incredible imagery, empowers billions of people to create stunning art within seconds. SuperImage is the infrastructure for AI Agents, providing API interfaces for AI Agents to utilize. Official website address: www.superimage.ai",
    totalSupply: "5,000,000,000 SIC",
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
    description: "DecentralGPT is a Decentralized Large Language Model AI.\nDGPT supports decentralized deployment of various top-tier large language models (LLMs) worldwide, significantly reducing the cost of using LLMs. It is committed to building a safe, privacy-protective, democratic, transparent, open-source, and universally accessible AGI.\nDecentralGPT is the infrastructure for AI Agents, providing API interfaces for AI Agents to utilize.Official website address:www.decentralgpt.org",
    createdAt: "5 months ago",
    creatorAddress: "0x3E6E...F685c5",
    descriptionEN: "DecentralGPT is a Decentralized Large Language Model AI. DGPT supports decentralized deployment of various top-tier large language models (LLMs) worldwide, significantly reducing the cost of using LLMs. It is committed to building a safe, privacy-protective, democratic, transparent, open-source, and universally accessible AGI. DecentralGPT is the infrastructure for AI Agents, providing API interfaces for AI Agents to utilize. Official website address: www.decentralgpt.org",
    totalSupply: "5,000,000,000 DGC",
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
    createdAt: "2 months ago",
    creatorAddress: "0x4F7F...G796d6",
    description: "XPersonity is a super fun and incredibly useful tool designed to uncover the personality secrets behind any X account! By diving deep into the posting history of X users, it delivers a sharp, witty, and often hilarious personality analysis that's guaranteed to make you smile.  \nBut that's not all—XPersonity also lets you 'matchmake' two X accounts to see how compatible their personalities are, like having your very own personality pairing expert. And the coolest part? It can create a one-of-a-kind 'digital twin' based on your own posting history! This digital twin learns your style, gets better over time, and can even post, reply to fans, and handle tasks for you on platforms like X, Discord, and Telegram.\nWhether you're looking to uncover some laughs, match up friends, or build your personal digital twin, XPersonity has you covered. Give it a try and take your X social game to the next level!",
    descriptionEN: "XPersonity is a super fun and incredibly useful tool designed to uncover the personality secrets behind any X account! By analyzing users' posting history, it delivers witty personality analysis. It can matchmake two X accounts and create a digital twin based on your posting history that learns your style and can interact on social platforms on your behalf.",
    totalSupply: "3,000,000,000 XPER",
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
    description: "ASIXT is a smart assistant designed to help investors stay ahead of the game in the ever-changing crypto market. Whether you're curious about what the top influencers on social media are buzzing about or searching for promising tokens, ASIXT leverages AI technology to deliver real-time insights tailored to your needs.\n\n" +
      "What makes ASIXT stand out is its ability to sift through massive amounts of data from over 1,000 industry KOLs (key opinion leaders) and social media platforms like Twitter and YouTube. It quickly highlights market trends and dominant sentiments, saving you the hassle of endless searching. With ASIXT, you get a clear and instant snapshot of the market's pulse, all in one place.\n\n" +
      "Holding over 100,000 ASIXT tokens unlocks exclusive features, granting you access to deeper, more personalized analysis tools to boost your confidence in making investment decisions.\n\n" +
      "Imagine this: with just a few taps, you can keep up with the hottest market trends, follow the moves of top influencers, and even spot the next breakout token before it takes off. Try ASIXT today and make investing simpler, smarter, and more efficient!"
    ,
    createdAt: "1 month ago",
    creatorAddress: "0x5G8G...H807e7",
    descriptionEN: "ASIXT is a smart assistant designed to help investors stay ahead of the game in the ever-changing crypto market. Whether you're curious about what the top influencers on social media are buzzing about or searching for promising tokens, ASIXT leverages AI technology to deliver real-time insights tailored to your needs. What makes ASIXT stand out is its ability to sift through massive amounts of data from over 1,000 industry KOLs (key opinion leaders) and social media platforms like Twitter and YouTube. It quickly highlights market trends and dominant sentiments, saving you the hassle of endless searching. With ASIXT, you get a clear and instant snapshot of the market's pulse, all in one place. Holding over 100,000 ASIXT tokens unlocks exclusive features, granting you access to deeper, more personalized analysis tools to boost your confidence in making investment decisions. Imagine this: with just a few taps, you can keep up with the hottest market trends, follow the moves of top influencers, and even spot the next breakout token before it takes off. Try ASIXT today and make investing simpler, smarter, and more efficient!",
    totalSupply: "3,000,000,000 ASIXT",
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