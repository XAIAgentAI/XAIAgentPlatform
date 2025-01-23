'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar } from '@/components/ui/avatar'
import Image from 'next/image'

const mockAgents = [
  {
    id: '1',
    type: 'Data Analysis',
    stats: '$DATA +46.67% | Market Cap: $522.M',
    createdBy: '@base',
    description: 'Create a website in seconds! Describe your website idea and write copy for your website. Powered by BI...',
    avatar: '/images/avatar-1.png',
    timeAgo: '21 days ago'
  },
  {
    id: '2',
    type: 'Data Analysis',
    stats: '$DATA +46.67% | Market Cap: $522.M',
    createdBy: '@base',
    description: 'Create a website in seconds! Describe your website idea and write copy for your website. Powered by BI...',
    avatar: '/images/avatar-2.png',
    timeAgo: '21 days ago'
  },
  {
    id: '3',
    type: 'Data Analysis',
    stats: '$DATA +46.67% | Market Cap: $522.M',
    createdBy: '@base',
    description: 'Create a website in seconds! Describe your website idea and write copy for your website. Powered by BI...',
    avatar: '/images/avatar-3.png',
    timeAgo: '21 days ago'
  },
  {
    id: '4',
    type: 'Data Analysis',
    stats: '$DATA +46.67% | Market Cap: $522.M',
    createdBy: '@base',
    description: 'Create a website in seconds! Describe your website idea and write copy for your website. Powered by BI...',
    avatar: '/images/avatar-4.png',
    timeAgo: '21 days ago'
  },
  {
    id: '5',
    type: 'Data Analysis',
    stats: '$DATA +46.67% | Market Cap: $522.M',
    createdBy: '@base',
    description: 'Create a website in seconds! Describe your website idea and write copy for your website. Powered by BI...',
    avatar: '/images/avatar-5.png',
    timeAgo: '21 days ago'
  },
  {
    id: '6',
    type: 'Data Analysis',
    stats: '$DATA +46.67% | Market Cap: $522.M',
    createdBy: '@base',
    description: 'Create a website in seconds! Describe your website idea and write copy for your website. Powered by BI...',
    avatar: '/images/avatar-6.png',
    timeAgo: '21 days ago'
  }
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
  const [tab, setTab] = useState<"Classification" | "PrototypeAgents">("Classification")

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto py-4 px-4 lg:py-8 lg:px-0">
        <div className="w-full max-w-[1400px] mx-auto bg-card rounded-[15px] p-4 lg:p-6">
          <div className="flex items-center gap-4 mb-6 overflow-x-auto">
            <Tabs defaultValue="Classification" className="w-auto">
              <TabsList className="bg-transparent border border-border">
                <TabsTrigger 
                  value="Classification"
                  className="data-[state=active]:bg-foreground data-[state=active]:text-background"
                  onClick={() => setTab("Classification")}
                >
                  Classification
                </TabsTrigger>
                <TabsTrigger 
                  value="PrototypeAgents"
                  className="data-[state=active]:bg-foreground data-[state=active]:text-background whitespace-nowrap"
                  onClick={() => setTab("PrototypeAgents")}
                >
                  Prototype Agents
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Category Tabs */}
          <Tabs defaultValue="prototype" className="w-full">
            <TabsList className="bg-transparent w-full justify-start gap-4 lg:gap-6 h-auto pb-2 overflow-x-auto">
              {tabs.map((tab) => (
                <TabsTrigger 
                  key={tab.value}
                  value={tab.value} 
                  className="text-foreground text-[10px] font-normal font-['Sora'] leading-[10px] data-[state=active]:bg-transparent px-4 h-8 whitespace-nowrap"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="border-t border-border pt-4 lg:pt-6">
              <h2 className="text-lg lg:text-xl font-semibold mb-4 lg:mb-6">Featured Agents</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {mockAgents.map((agent) => (
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
            </div>
          </Tabs>
        </div>
      </main>
    </div>
  )
} 