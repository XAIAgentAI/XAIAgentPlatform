"use client"

import { useEffect, useState } from "react"
import AgentListDesktop from "@/components/AgentListDesktop"
import AgentListMobile from "@/components/AgentListMobile"
import { LocalAgent } from "@/types/agent"
import { agentAPI } from "@/services/api"
import { useRouter, useSearchParams } from "next/navigation"

export default function Home() {
  const [agents, setAgents] = useState<LocalAgent[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const [statusFilter, setStatusFilter] = useState<string>("")
  
  // 从URL参数中获取排序方式，不设置默认值
  const sortBy = searchParams?.get('sortBy')
  const sortOrder = searchParams?.get('sortOrder')

  // 获取代理列表
  const fetchAgentsData = async () => {
    try {
      setLoading(true)
      // 使用当前排序参数和筛选参数
      const options = {
        pageSize: 30,
        sortBy: sortBy as string,
        sortOrder: sortOrder as "asc" | "desc",
        status: statusFilter === "" ? undefined : statusFilter,
      };

      console.log('Fetching agents with options:', options);

      // 获取agents数据
      const response = await agentAPI.getAllAgents(options);

      if (response.code === 200 && response.data?.items) {
        setAgents(response.data.items);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setLoading(false)
    }
  };

  // 当排序或状态筛选变化时重新获取数据
  useEffect(() => {
    fetchAgentsData();
  }, [sortBy, sortOrder, statusFilter]); 
  
  // 更新状态筛选器的处理函数
  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
  };
  
  return (
    <>
      <div className="container flex-1 flex flex-col container mx-auto px-4 py-2 hidden md:block">
        <AgentListDesktop 
          agents={agents} 
          loading={loading}
          onStatusFilterChange={handleStatusFilterChange}
          currentStatusFilter={statusFilter}
        />
      </div>
      <div className="container flex-1 flex flex-col container mx-auto px-4 py-2 md:hidden">
        <AgentListMobile 
          agents={agents} 
          loading={loading}
          onStatusFilterChange={handleStatusFilterChange}
          currentStatusFilter={statusFilter}
        />
      </div>
    </>
  )
}
