"use client"

import AgentListDesktop from "@/components/AgentListDesktop"
import AgentListMobile from "@/components/AgentListMobile"
import { useSearchParams } from "next/navigation"
import { useAgentList } from "@/hooks/useAgentList"

export default function Home() {
  const searchParams = useSearchParams()
  
  // 从URL参数中获取排序方式和搜索关键词
  const sortBy = searchParams?.get('sortBy')
  const sortOrder = searchParams?.get('sortOrder')
  const searchKeyword = searchParams?.get('searchKeyword') || ''

  // 使用自定义Hook管理数据获取逻辑
  const { 
    agents, 
    loading, 
    statusFilter, 
    setStatusFilter 
  } = useAgentList({
    sortBy,
    sortOrder,
    searchKeyword,
    initialStatusFilter: ""
  })
  
  return (
    <>
      <div className="container flex-1 flex flex-col container mx-auto px-4 py-2 hidden md:block">
        <AgentListDesktop 
          agents={agents} 
          loading={loading}
          onStatusFilterChange={setStatusFilter}
          currentStatusFilter={statusFilter}
          searchKeyword={searchKeyword}
        />
      </div>
      <div className="container flex-1 flex flex-col container mx-auto px-4 py-2 md:hidden">
        <AgentListMobile 
          agents={agents} 
          loading={loading}
          onStatusFilterChange={setStatusFilter}
          currentStatusFilter={statusFilter}
          searchKeyword={searchKeyword}
        />
      </div>
    </>
  )
}
