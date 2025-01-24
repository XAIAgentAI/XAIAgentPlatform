import { create } from 'zustand'
import { LocalAgent, localAgents } from '@/data/localAgents'

type State = {
  agents: LocalAgent[]
}

type Actions = {
  setAgents: (agents: LocalAgent[]) => void
  getAgentById: (id: number) => LocalAgent | undefined
  updateAgentsWithTokens: (tokens: any[]) => void
}

export const useAgentStore = create<State & Actions>((set, get) => ({
  agents: localAgents,
  setAgents: (agents: LocalAgent[]) => set({ agents }),
  getAgentById: (id: number) => get().agents.find(agent => agent.id === id),
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