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
      const agents = await agentAPI.getAllAgents();
      console.log("fetchAgents", agents);
      
      set({ agents, loading: false });
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      set({ loading: false });
    }
  },
  updateAgentsWithTokens: (tokens) => {
    const updatedAgents = get().agents.map(agent => {
      const tokenData = tokens.find(token => token.address === agent.tokens)
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