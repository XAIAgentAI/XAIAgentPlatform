'use client'

import { useState } from 'react'
import AgentCard from '@/components/AgentCard'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const mockAgents = [
  {
    id: 'cortex-agent-1',
    name: 'Prefrontal Cortex Convo Agent',
    image: '/images/cortex.png',
    marketCap: '$96.6m',
    percentageChange: '+5.64%',
    totalValue: '$19m',
    holders: '108,080',
    volume: '$8.5m',
    influence: '1,225,393',
    tag: 'Productivity',
    $CONVO: '$CONVO'
  },
  {
    id: 'cortex-agent-2',
    name: 'Prefrontal Cortex Convo Agent',
    image: '/images/cortex.png',
    marketCap: '$96.6m',
    percentageChange: '+5.64%',
    totalValue: '$19m',
    holders: '108,080',
    volume: '$8.5m',
    influence: '1,225,393',
    tag: 'Productivity',
    $CONVO: '$CONVO'
  },
  {
    id: 'cortex-agent-3',
    name: 'Prefrontal Cortex Convo Agent',
    image: '/images/cortex.png',
    marketCap: '$96.6m',
    percentageChange: '+5.64%',
    totalValue: '$19m',
    holders: '108,080',
    volume: '$8.5m',
    influence: '1,225,393',
    tag: 'Entertainment',
    $CONVO: '$CONVO'
  },
]

export default function Home() {
  const [sortBy, setSortBy] = useState<'marketCap' | 'latest'>('marketCap')

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Sort Options */}
      <div className="flex items-center space-x-3 mb-4">
        <span className="text-sm text-muted-foreground">Sort by</span>
        <Button
          variant={sortBy === 'marketCap' ? 'secondary' : 'ghost'}
          onClick={() => setSortBy('marketCap')}
        >
          Market Cap
        </Button>
        <Button
          variant={sortBy === 'latest' ? 'secondary' : 'ghost'}
          onClick={() => setSortBy('latest')}
        >
          Latest
        </Button>
      </div>

      {/* Table */}
      <div className="w-full bg-white/[0.02] rounded-xl border border-white/10">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-muted-foreground">AI Agents</TableHead>
              <TableHead className="text-muted-foreground">Market Cap</TableHead>
              <TableHead className="text-muted-foreground">24h</TableHead>
              <TableHead className="text-muted-foreground">Total Value Locked</TableHead>
              <TableHead className="text-muted-foreground">Holders Count</TableHead>
              <TableHead className="text-muted-foreground">24H Vol</TableHead>
              <TableHead className="text-muted-foreground">Inferences</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockAgents.map((agent) => (
              <AgentCard key={agent.id} {...agent} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
