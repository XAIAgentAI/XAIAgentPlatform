export interface NFTConfig {
  id: number;
  name: string;
  image: string;
  dailyReward: number;
  iaoExtraPercentage: number;
  price: number;
}

export const NFT_CONFIGS: NFTConfig[] = [
  {
    id: 1,
    name: "Starter Node",
    image: "https://raw.githubusercontent.com/XAIAgentAI/NodeNFTForXAA/main/resource/image/1.png",
    dailyReward: 1250,
    iaoExtraPercentage: 3,
    price: 99
  },
  {
    id: 2,
    name: "Pro Node",
    image: "https://raw.githubusercontent.com/XAIAgentAI/NodeNFTForXAA/main/resource/image/2.png",
    dailyReward: 1667,
    iaoExtraPercentage: 5,
    price: 199
  },
  {
    id: 3,
    name: "Master Node",
    image: "https://raw.githubusercontent.com/XAIAgentAI/NodeNFTForXAA/main/resource/image/3.png",
    dailyReward: 2500,
    iaoExtraPercentage: 10,
    price: 299
  }
];

export const getNFTConfigById = (id: number): NFTConfig | undefined => {
  return NFT_CONFIGS.find(config => config.id === id);
}; 