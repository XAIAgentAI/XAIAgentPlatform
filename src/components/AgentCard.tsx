"use client"

import { Avatar } from "@/components/ui/avatar"
import { CustomBadge } from "@/components/ui-custom/custom-badge"
import { CustomButton } from "@/components/ui-custom/custom-button"
import Image from "next/image"
import { useRouter } from 'next/navigation'

interface LocalAgentCardProps {
  id: number;
  name: string;
  avatar: string;
  symbol: string;
  type: string;
  marketCap: string;
  change24h: string;
  tvl: string;
  holdersCount: number;
  volume24h: string;
  status: string;
}

const AgentCard = ({
  id,
  name,
  avatar,
  symbol,
  type,
  marketCap,
  change24h,
  tvl,
  holdersCount,
  volume24h,
  status,
}: LocalAgentCardProps) => {

  const router = useRouter()

  const handleCardClick = (e: React.MouseEvent) => {
    const isButton = (e.target as HTMLElement).closest('button')
    if (isButton) {
      return
    }
    router.push(`/agent-detail/${id}`)
  }

  return (
    <div 
      onClick={handleCardClick}
      className="group cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick(e as unknown as React.MouseEvent)}
    >
      <div className="hover:bg-[#F8F8F8] dark:hover:bg-[#222222] transition-colors">
        <div className="transition-transform group-hover:translate-x-2 duration-300">
          <div className="grid grid-cols-9 gap-4 items-center  py-4">
            {/* AI Agents - col-span-3 */}
            <div className="col-span-3 flex items-center gap-4 sticky left-0 z-10 bg-white dark:bg-card group-hover:bg-[#F8F8F8] dark:group-hover:bg-[#222222]">
              <Avatar className="w-[60px] h-[60px] rounded-[100px]">
                <img src={avatar} alt={name} className="object-cover" />
              </Avatar>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-secondary-color text-sm font-normal font-['Sora'] leading-[10px]">{name}</h3>
                  <span className="text-muted-color text-[10px] font-normal font-['Sora'] leading-[10px]">
                    {symbol}
                  </span>
                </div>
                <CustomBadge>
                  {type}
                </CustomBadge>
              </div>
            </div>

            {/* Market Cap */}
            <div className="col-span-1 text-secondary-color text-sm font-normal font-['Sora'] leading-[10px]">
              {marketCap}
            </div>

            {/* Change 24h */}
            <div className="col-span-1 text-[#5BFE42] text-sm font-normal font-['Sora'] leading-[10px]">
              {change24h}
            </div>

            {/* TVL */}
            <div className="col-span-1.5 text-secondary-color text-sm font-normal font-['Sora'] leading-[10px] min-w-[140px]">
              {tvl}
            </div>

            {/* Holders Count */}
            <div className="col-span-1 text-secondary-color text-sm font-normal font-['Sora'] leading-[10px]">
              {holdersCount.toLocaleString()}
            </div>

            {/* Volume 24h */}
            <div className="text-secondary-color text-sm font-normal font-['Sora'] leading-[10px]">
              {volume24h}
            </div>

            {/* Status */}
            <div className="text-secondary-color text-sm font-normal font-['Sora'] leading-[10px] whitespace-nowrap">
              {status}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

AgentCard.displayName = "AgentCard"

export default AgentCard