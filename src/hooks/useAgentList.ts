import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { LocalAgent } from '@/types/agent'
import { agentAPI } from '@/services/api'
import { createRequestManager } from '@/utils/requestManager'

interface UseAgentListParams {
  sortBy?: string | null
  sortOrder?: string | null
  searchKeyword?: string
  initialStatusFilter?: string
}

interface UseAgentListResult {
  agents: LocalAgent[]
  loading: boolean
  statusFilter: string
  setStatusFilter: (status: string) => void
  refetch: () => void
}

export function useAgentList({ 
  sortBy, 
  sortOrder, 
  searchKeyword = '', 
  initialStatusFilter = '' 
}: UseAgentListParams): UseAgentListResult {
  const [agents, setAgents] = useState<LocalAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilterState] = useState<string>(initialStatusFilter)
  
  // 为每个Hook实例创建独立的请求管理器
  const requestManager = useMemo(() => createRequestManager(), [])

  const fetchAgents = useCallback(async (params: {
    sortBy?: string | null
    sortOrder?: string | null
    searchKeyword: string
    statusFilter: string
  }) => {
    setLoading(true)

    try {
      // 生成请求的唯一键
      const requestKey = `agents-${JSON.stringify(params)}`

      const result = await requestManager.execute(requestKey, async () => {
        const options = {
          pageSize: 1000,
          sortBy: params.sortBy as string,
          sortOrder: params.sortOrder as "asc" | "desc",
          status: params.statusFilter === "" ? undefined : params.statusFilter,
          searchKeyword: params.searchKeyword || undefined,
        }

        console.log('Fetching agents with options:', options)
        return await agentAPI.getAllAgents(options)
      })

      // 如果请求被新请求覆盖，则忽略结果
      if (result === null) {
        return
      }

      if (result.code === 200 && result.data?.items) {
        // 过滤掉需要隐藏的项目
        const hiddenSymbols = ['SYNTH', 'MEET', 'SATORI', 'LINGXI', 'AKOL', 'LINK', 'ARGU', 'ASIXT', 'XPER', 'PASW', 'PIS', 'SPIX', 'OLD', 'QREA', 'LEMO']
        const filteredAgents = result.data.items.filter(agent => !hiddenSymbols.includes(agent.symbol))
        setAgents(filteredAgents)
      } else {
        setAgents([])
      }
    } catch (error) {
      console.error('Failed to fetch or process agent data:', error)
      setAgents([])
    } finally {
      setLoading(false)
    }
  }, [requestManager])

  // 当依赖项变化时获取数据
  useEffect(() => {
    fetchAgents({
      sortBy,
      sortOrder,
      searchKeyword,
      statusFilter,
    })
    
    // 清理函数：组件卸载时取消所有请求
    return () => {
      requestManager.cancelAll()
    }
  }, [fetchAgents, sortBy, sortOrder, searchKeyword, statusFilter, requestManager])

  // 状态筛选器更新函数
  const setStatusFilter = useCallback((newStatus: string) => {
    if (newStatus !== statusFilter) {
      // 立即清空当前列表，提供更好的用户体验
      setAgents([])
      setLoading(true)
    }
    setStatusFilterState(newStatus)
  }, [statusFilter])

  // 手动重新获取数据
  const refetch = useCallback(() => {
    fetchAgents({
      sortBy,
      sortOrder,
      searchKeyword,
      statusFilter,
    })
  }, [fetchAgents, sortBy, sortOrder, searchKeyword, statusFilter])

  return {
    agents,
    loading,
    statusFilter,
    setStatusFilter,
    refetch,
  }
}