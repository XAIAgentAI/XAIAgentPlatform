'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar } from '@/components/ui/avatar'
import Image from 'next/image'
import { agentAPI } from '@/services/api'
import { fetchDBCTokens } from "@/services/dbcScan"
import { LocalAgent } from '@/types/agent'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { transformToLocalAgent, updateAgentsWithPrices, updateAgentsWithTokens } from "@/services/agentService"
import { format } from 'date-fns'

interface LocalizedAgent extends LocalAgent {
  statusJA?: string;
  statusKO?: string;
  statusZH?: string;
  descriptionJA?: string;
  descriptionKO?: string;
  descriptionZH?: string;
}

const tabs = [
  { value: "prototype", label: "agents.prototype" },
  { value: "writing", label: "agents.writing" },
  { value: "productivity", label: "agents.productivity" },
  { value: "research", label: "agents.research" },
  { value: "education", label: "agents.education" },
  { value: "lifestyle", label: "agents.lifestyle" },
  { value: "programming", label: "agents.programming" },
]

export default function AgentsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<"Infrastructure" | "AIAgent">("Infrastructure")
  const [agents, setAgents] = useState<LocalizedAgent[]>([])
  const [loading, setLoading] = useState(true)
  const t = useTranslations()
  const locale = useLocale()
  
  // 获取搜索参数
  const searchKeyword = searchParams?.get('searchKeyword') || ''
  
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        
        // 构建API参数，包含搜索关键词
        const apiParams: any = { pageSize: 30 };
        if (searchKeyword) {
          apiParams.searchKeyword = searchKeyword;
        }
        
        const [response, tokens] = await Promise.all([
          agentAPI.getAllAgents(apiParams),
          fetchDBCTokens()
        ]);
  
        if (response.code === 200 && response.data?.items) {
          // 先转换基础字段，再添加多语言和价格相关字段
          let agents: LocalizedAgent[] = response.data.items.map(agent => {
            const baseAgent = transformToLocalAgent(agent);
            return {
              ...baseAgent,
              // 多语言字段
              statusJA: agent.status,
              statusKO: agent.status,
              statusZH: agent.status,
              descriptionJA: agent.description,
              descriptionKO: agent.description,
              descriptionZH: agent.description,
              // 确保 marketCap 存在
              marketCap: agent.marketCap || "0",
              iaoTokenAmount: baseAgent.iaoTokenAmount || 0
            };
          });
  
          // 更新价格信息（确保这个函数不会覆盖已有字段）
          agents = await updateAgentsWithPrices(agents);
  
          // 更新代币持有者信息
          if (tokens.length > 0) {
            agents = updateAgentsWithTokens(agents, tokens);
          }
  
          setAgents(agents);
        }
      } catch (error) {
        console.error('Failed to fetch agents:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchAgents();
  }, [searchKeyword]); // 当搜索关键词变化时重新获取数据

  // 根据选择的标签过滤代理
  const filteredAgents = tab === "AIAgent" 
    ? agents.filter(agent => agent.type === "AI Agent") // AI Agent: id 4和5
    : agents.filter(agent => agent.type === "Infrastructure") // Infrastructure: id 2和3

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto py-4 px-4 lg:py-8 lg:px-0">
        <div className="w-full max-w-[1400px] mx-auto bg-card rounded-[15px] p-4 lg:p-6">
          {/* 搜索结果显示 */}
          {searchKeyword && (
            <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-sm font-medium text-primary">
                  {t('common.searchResults')}: "{searchKeyword}"
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {filteredAgents.length > 0 
                  ? t('common.foundResults', { count: filteredAgents.length })
                  : t('common.noResultsFound')
                }
              </p>
            </div>
          )}

          <div className="flex items-center gap-4 mb-6 overflow-x-auto hide-scrollbar">
            <Tabs defaultValue="Infrastructure" className="w-auto">
              <TabsList className="bg-transparent border border-border">
                <TabsTrigger 
                  value="Infrastructure"
                  className="data-[state=active]:bg-foreground data-[state=active]:text-background"
                  onClick={() => setTab("Infrastructure")}
                >
                  {t('agents.infrastructure')}
                </TabsTrigger>
                <TabsTrigger 
                  value="AIAgent"
                  className="data-[state=active]:bg-foreground data-[state=active]:text-background whitespace-nowrap"
                  onClick={() => setTab("AIAgent")}
                >
                  {t('agents.aiAgent')}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Category Tabs */}
          <Tabs defaultValue="prototype" className="w-full">
            <div className="border-t border-border pt-4 lg:pt-6">
              {filteredAgents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                  {filteredAgents.map((agent) => (
                    <div 
                      key={agent.id} 
                      onClick={() => router.push(`/${locale}/agent-detail/${agent.id}`)}
                      className="group rounded-lg p-4 transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center gap-2">
                          <Avatar className="h-10 w-10 rounded-full bg-card-inner">
                            {agent.avatar && (
                              <Image 
                                src={agent.avatar}
                                alt={agent.name} 
                                width={40} 
                                height={40}
                                className="object-cover"
                              />
                            )}
                          </Avatar>
                          <span className="text-[10px] lg:text-xs text-muted-foreground">
                            {format(new Date(agent.createdAt), 'yyyy-MM-dd HH:mm')}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium truncate text-foreground">{agent.name}</span>
                          </div>
                          <p className="text-[10px] lg:text-xs text-primary mt-1 truncate">
                            {agent.symbol} | {t('agents.marketCap')}: {agent.marketCap}
                          </p>
                          <p className="text-[10px] lg:text-xs text-muted-foreground mt-1">{t('agents.status')}: {agent.status}</p>
                          <p className="text-foreground/50 text-[10px] lg:text-xs font-normal font-['Sora'] leading-[14px] mt-4 line-clamp-2 group-hover:text-primary/90 transition-colors">
                            {locale === 'en' && agent.description}
                            {locale === 'ja' && agent.descriptionJA}
                            {locale === 'ko' && agent.descriptionKO}
                            {locale === 'zh' && agent.descriptionZH}
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
                      <h3 className="mt-4 text-sm font-semibold text-foreground">
                        {searchKeyword ? t('common.noSearchResults') : t('agents.noAgentsFound')}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {searchKeyword 
                          ? t('common.noSearchResultsDesc', { keyword: searchKeyword })
                          : t('agents.noAgentsFoundDesc')
                        }
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