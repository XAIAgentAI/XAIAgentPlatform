"use client"

import { useEffect, useState } from "react"
import AgentList from "@/components/AgentList"
import { apiClient } from "@/lib/api-client"

interface Agent {
  id: string;
  name: string;
  description: string;
  category: string;
  avatar: string;
  status: string;
  capabilities: string[];
  rating: number;
  usageCount: number;
  creatorAddress: string;
  reviewCount: number;
  createdAt: string;
}
const mockAgents = [
  {
    id: "1",
    name: "XAIAgent",
    description: "Efficient AI assistant providing comprehensive productivity support",
    category: "Productivity",
    avatar: "/logo.png",
    status: "active",
    capabilities: ["Natural Language Processing", "Task Management", "Document Generation", "Data Analysis"],
    rating: 4.8,
    usageCount: 125393,
    creatorAddress: "0x1234...5678",
    reviewCount: 1280,
    createdAt: "2024-01-15"
  },
  {
    id: "2",
    name: "AIAssistant",
    description: "Entertainment-focused AI assistant for content creation",
    category: "Entertainment",
    avatar: "/ai-assistant.png",
    status: "active",
    capabilities: ["Story Creation", "Game Design", "Content Generation", "Interactive Dialogue"],
    rating: 4.6,
    usageCount: 98962,
    creatorAddress: "0x2345...6789",
    reviewCount: 856,
    createdAt: "2024-01-20"
  },
  {
    id: "3",
    name: "CreativeAI",
    description: "Expert in creative entertainment content generation",
    category: "Entertainment",
    avatar: "/creative-ai.png",
    status: "active",
    capabilities: ["Art Creation", "Music Generation", "Creative Writing", "Video Scripting"],
    rating: 4.7,
    usageCount: 86574,
    creatorAddress: "0x3456...7890",
    reviewCount: 723,
    createdAt: "2024-02-01"
  },
  {
    id: "4",
    name: "DataAnalyst",
    description: "Professional data analysis and visualization assistant",
    category: "Productivity",
    avatar: "/data-analyst.png",
    status: "active",
    capabilities: ["Data Analysis", "Report Generation", "Predictive Modeling", "Data Visualization"],
    rating: 4.9,
    usageCount: 167891,
    creatorAddress: "0x4567...8901",
    reviewCount: 1567,
    createdAt: "2024-02-10"
  },
  {
    id: "5",
    name: "CodeMaster",
    description: "Intelligent programming assistant",
    category: "Productivity",
    avatar: "/code-master.png",
    status: "active",
    capabilities: ["Code Generation", "Code Review", "Bug Fixing", "Performance Optimization"],
    rating: 4.7,
    usageCount: 89456,
    creatorAddress: "0x5678...9012",
    reviewCount: 945,
    createdAt: "2024-02-15"
  },
  {
    id: "6",
    name: "HealthBot",
    description: "Health management and medical consultation assistant",
    category: "Productivity",
    avatar: "/health-bot.png",
    status: "active",
    capabilities: ["Health Consultation", "Dietary Advice", "Exercise Planning", "Medical Knowledge"],
    rating: 4.5,
    usageCount: 45678,
    creatorAddress: "0x6789...0123",
    reviewCount: 534,
    createdAt: "2024-02-20"
  },
  {
    id: "7",
    name: "FinanceGPT",
    description: "Financial market analysis and entertainment predictions",
    category: "Entertainment",
    avatar: "/finance-gpt.png",
    status: "active",
    capabilities: ["Market Analysis", "Investment Advice", "Trend Prediction", "Risk Assessment"],
    rating: 4.8,
    usageCount: 156789,
    creatorAddress: "0x7890...1234",
    reviewCount: 1234,
    createdAt: "2024-02-25"
  }
]

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await apiClient.getAgents()
        setAgents(response.items)
      } catch (error) {
        console.error('Failed to fetch agents:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAgents()
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-black">
        <div className="container mx-auto py-10">
          <div className="text-white text-center">Loading...</div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black">
      <div className="container mx-auto py-10">
        <AgentList agents={mockAgents} />
      </div>
    </main>
  )
}
