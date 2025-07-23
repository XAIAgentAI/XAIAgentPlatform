"use client"

import { useEffect, useState } from "react"
import AgentListDesktop from "@/components/AgentListDesktop"
import AgentListMobile from "@/components/AgentListMobile"
import { LocalAgent } from "@/types/agent"
import { agentAPI } from "@/services/api"
import { useSearchParams } from "next/navigation"

export default function Home() {
  const [agents, setAgents] = useState<LocalAgent[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  
  // 从URL参数中获取排序方式，不设置默认值
  const sortBy = searchParams?.get('sortBy')
  const sortOrder = searchParams?.get('sortOrder')

  // 获取代理列表
  const fetchAgentsData = async () => {
    try {
      setLoading(true)
      // 创建选项对象，只有当参数存在时才添加
      const options: {
        pageSize: number;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
      } = {
        pageSize: 30
      };
      
      // 只有当参数存在时才添加到选项中
      if (sortBy) options.sortBy = sortBy;
      if (sortOrder) options.sortOrder = sortOrder as "asc" | "desc";
      
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

  // 监听URL参数变化，重新获取数据
  useEffect(() => {
    fetchAgentsData();
  }, [sortBy, sortOrder]); // 依赖项中添加sortBy和sortOrder

  return (
    <>
      <div className="container flex-1 flex flex-col container mx-auto px-4 py-2 hidden md:block">
        <AgentListDesktop 
          agents={agents} 
          loading={loading} 
        />
      </div>
      <div className="container flex-1 flex flex-col container mx-auto px-4 py-2 md:hidden">
        <AgentListMobile 
          agents={agents} 
          loading={loading}
        />
      </div>
    </>
  )
}
