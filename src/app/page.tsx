'use client'

import { useState } from 'react'
import AgentCard from '@/components/AgentCard'

const mockAgents = [
  {
    id: 'game-agent',
    name: 'G.A.M.E',
    image: '/images/game.png',
    marketCap: '$339.1m',
    percentageChange: '+16.15%',
    totalValue: '$35.8m',
    holders: '158,807',
    volume: '$7.9m',
    influence: '2,087,945',
    tag: 'Productivity'
  },
  {
    id: 'cortex-agent',
    name: 'Prefrontal Cortex Convo Agent',
    image: '/images/cortex.png',
    marketCap: '$36.6m',
    percentageChange: '+5.64%',
    totalValue: '$19m',
    holders: '108,080',
    volume: '$8.5m',
    influence: '1,225,393',
    tag: 'Productivity'
  },
  // Add more mock data as needed
]

export default function Home() {
  const [sortBy, setSortBy] = useState<'marketCap' | 'latest'>('marketCap')

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-foreground dark:text-white">
          AI Agents
        </h1>
        {/* Sort Options */}
        <div className="flex items-center space-x-3">
          <span className="text-sm text-text-tertiary mr-2">Sort by:</span>
          <button
            onClick={() => setSortBy('marketCap')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              sortBy === 'marketCap'
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                : 'text-text-tertiary hover:text-foreground hover:bg-card-hover border border-transparent dark:hover:text-white dark:hover:bg-white/5'
            }`}
          >
            Market Cap
          </button>
          <button
            onClick={() => setSortBy('latest')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              sortBy === 'latest'
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                : 'text-text-tertiary hover:text-foreground hover:bg-card-hover border border-transparent dark:hover:text-white dark:hover:bg-white/5'
            }`}
          >
            Latest
          </button>
        </div>
      </div>

      {/* Agents List */}
      <div className="space-y-px bg-card-hover/50 rounded-2xl border border-border dark:border-white/10 shadow-sm">
        {mockAgents.map((agent) => (
          <AgentCard key={agent.id} {...agent} />
        ))}
      </div>
    </div>
  )
}
