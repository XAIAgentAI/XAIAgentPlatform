'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar } from '@/components/ui/avatar'
import Image from 'next/image'

interface Agent {
  id: string;
  type: string;
  stats: string;
  createdBy: string;
  description: string;
  avatar: string;
  timeAgo: string;
}

const mockAgents: Agent[] = [
  // {
  //   id: '1',
  //   type: 'Data Analysis',
  //   stats: '$DATA +46.67% | Market Cap: $522.M',
  //   createdBy: '@base',
  //   description: 'Create a website in seconds! Describe your website idea and write copy for your website. Powered by BI...',
  //   avatar: '/images/avatar-1.png',
  //   timeAgo: '21 days ago'
  // },
  // {
  //   id: '2',
  //   type: 'Data Analysis',
  //   stats: '$DATA +46.67% | Market Cap: $522.M',
  //   createdBy: '@base',
  //   description: 'Create a website in seconds! Describe your website idea and write copy for your website. Powered by BI...',
  //   avatar: '/images/avatar-2.png',
  //   timeAgo: '21 days ago'
  // },
]

const tabs = [
  { value: "prototype", label: "Prototype Agents" },
  { value: "writing", label: "Writing" },
  { value: "productivity", label: "Productivity" },
  { value: "research", label: "Research & Analysis" },
  { value: "education", label: "Education" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "programming", label: "Programming" },
]

export default function AgentsPage() {
  const [tab, setTab] = useState<"Infrastructure" | "AIAgent">("Infrastructure")
  const [agents, setAgents] = useState(mockAgents)

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto py-4 px-4 lg:py-8 lg:px-0">
        <div className="w-full max-w-[1400px] mx-auto bg-card rounded-[15px] p-4 lg:p-6">
          <div className="flex items-center gap-4 mb-6 overflow-x-auto hide-scrollbar">
            <Tabs defaultValue="Infrastructure" className="w-auto">
              <TabsList className="bg-transparent border border-border">
                <TabsTrigger 
                  value="Infrastructure"
                  className="data-[state=active]:bg-foreground data-[state=active]:text-background"
                  onClick={() => setTab("Infrastructure")}
                >
                  Infrastructure
                </TabsTrigger>
                <TabsTrigger 
                  value="AIAgent"
                  className="data-[state=active]:bg-foreground data-[state=active]:text-background whitespace-nowrap"
                  onClick={() => setTab("AIAgent")}
                >
                  AI Agent
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Category Tabs */}
          <Tabs defaultValue="prototype" className="w-full">
            <div className="border-t border-border pt-4 lg:pt-6">
              <h2 className="text-lg lg:text-xl font-semibold mb-4 lg:mb-6">Featured Agents</h2>
              {agents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                  {agents.map((agent) => (
                    <div 
                      key={agent.id} 
                      className="group rounded-lg p-4 transition-colors cursor-pointer hover:bg-card-hover"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center gap-2">
                          <Avatar className="h-10 w-10 rounded-full bg-card-inner">
                            <Image 
                              src='/logo.png' 
                              alt={agent.type} 
                              width={40} 
                              height={40}
                              className="object-cover"
                            />
                          </Avatar>
                          <span className="text-[10px] lg:text-xs text-muted-foreground">{agent.timeAgo}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium truncate text-foreground">{agent.type}</span>
                          </div>
                          <p className="text-[10px] lg:text-xs text-primary mt-1 truncate">{agent.stats}</p>
                          <p className="text-[10px] lg:text-xs text-muted-foreground mt-1">Created by {agent.createdBy}</p>
                          <p className="text-foreground/50 text-[10px] lg:text-xs font-normal font-['Sora'] leading-[14px] mt-4 line-clamp-2 group-hover:text-primary/90 transition-colors">
                            {agent.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-full max-w-md">
                    <div className="rounded-lg  bg-card p-8 text-center animate-in fade-in-50 duration-500">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <svg
                          className="h-12 w-12 text-primary"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                          />
                        </svg>
                      </div>
                      <h3 className="mt-4 text-sm font-semibold text-foreground">No Agents Found</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Get started by creating your first agent or exploring featured agents.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Tabs>
        </div>
      </main>
    </div>
  )
} 