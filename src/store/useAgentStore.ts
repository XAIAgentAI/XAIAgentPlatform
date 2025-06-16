import { create } from 'zustand'
import { LocalAgent } from '@/types/agent'
import { agentAPI } from '@/services/api'

type State = {
  agents: LocalAgent[]
  loading: boolean
}

type Actions = {
  setAgents: (agents: LocalAgent[]) => void
  getAgentById: (id: string) => LocalAgent | undefined
  fetchAgents: () => Promise<void>
  updateAgentsWithTokens: (tokens: any[]) => void
}

export const useAgentStore = create<State & Actions>((set, get) => ({
  agents: [],
  loading: false,
  setAgents: (agents: LocalAgent[]) => set({ agents }),
  getAgentById: (id: string) => get().agents.find(agent => agent.id === id),
  fetchAgents: async () => {
    try {
      set({ loading: true });
      const response = await agentAPI.getAllAgents();
      if (response.code === 200 && response.data?.items) {
        const agents = response.data.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          category: item.category,
          avatar: item.avatar || '/images/default-avatar.png',
          status: item.status,
          capabilities: item.capabilities || '',
          rating: item.rating || 0,
          usageCount: item.usageCount || 0,
          marketCap: item.marketCap || "$0",
          change24h: item.change24h || "0%",
          volume24h: item.volume24h || "$0",
          creatorId: item.creatorAddress,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.createdAt),
          type: item.type || item.category || 'Unknown',
          tvl: item.tvl || "$0",
          holdersCount: item.holdersCount || 0,
          socialLinks: item.socialLinks || '',
          token: item.tokenAddress || item.symbol || item.id,
          symbol: item.symbol || '',
        }));
        set({ agents });
      }
      set({ loading: false });
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      set({ loading: false });
    }
  },
  updateAgentsWithTokens: (tokens) => {
    const updatedAgents = get().agents.map(agent => {
      const tokenData = tokens.find(token => token.address === agent.tokenAddress)
      if (tokenData) {
        return {
          ...agent,
          holdersCount: parseInt(tokenData.holders)
        }
      }
      return agent
    })
    set({ agents: updatedAgents })
  }
})) 