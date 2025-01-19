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

export default function AgentsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="prototype" className="w-full">
          <TabsList className="bg-white/5 p-1 mb-8">
            <TabsTrigger value="prototype" className="data-[state=active]:bg-white/10">
              Prototype Agents
            </TabsTrigger>
            <TabsTrigger value="writing" className="data-[state=active]:bg-white/10">
              Writing
            </TabsTrigger>
            <TabsTrigger value="productivity" className="data-[state=active]:bg-white/10">
              Productivity
            </TabsTrigger>
            <TabsTrigger value="research" className="data-[state=active]:bg-white/10">
              Research & Analysis
            </TabsTrigger>
            <TabsTrigger value="education" className="data-[state=active]:bg-white/10">
              Education
            </TabsTrigger>
            <TabsTrigger value="lifestyle" className="data-[state=active]:bg-white/10">
              Lifestyle
            </TabsTrigger>
            <TabsTrigger value="programming" className="data-[state=active]:bg-white/10">
              Programming
            </TabsTrigger>
          </TabsList>

          <div className="space-y-8">
            <h2 className="text-xl font-semibold">Featured Agents</h2>
            <div className="grid grid-cols-3 gap-6">
              {mockAgents.map((agent) => (
                <div 
                  key={agent.id} 
                  className="group bg-white/5 rounded-lg p-4 border border-white/10 hover:border-primary/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10 rounded-lg">
                      <Image src={agent.avatar} alt={agent.type} width={40} height={40} />
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">{agent.type}</span>
                        <span className="text-xs text-muted-foreground">{agent.timeAgo}</span>
                      </div>
                      <p className="text-xs text-primary mt-1 truncate">{agent.stats}</p>
                      <p className="text-xs text-muted-foreground mt-1">Created by {agent.createdBy}</p>
                      <p className="text-sm mt-4 line-clamp-2 group-hover:text-primary/90 transition-colors">{agent.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Tabs>
      </main>
    </div>
  )
} 