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
      className="cursor-pointer transition-all hover:bg-white/5"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick(e as unknown as React.MouseEvent)}
    >
      <div className="grid grid-cols-9 gap-4 items-center px-4 py-4">
        {/* AI Agents - col-span-3 */}
        <div className="col-span-3 flex items-center gap-4">
          <Avatar className="w-[60px] h-[60px] rounded-[100px]">
            <img src={avatar} alt={name} className="object-cover" />
          </Avatar>
          <div className="space-y-2">
            <h3 className="text-white/80 text-sm font-normal font-['Sora'] leading-[10px]">{name}</h3>
            <div className="flex items-center gap-2">
              <CustomBadge>
                {type}
              </CustomBadge>
              <span className="text-white/50 text-[10px] font-normal font-['Sora'] leading-[10px]">
                {symbol}
              </span>
            </div>
          </div>
        </div>

        {/* Market Cap */}
        <div className="text-white/80 text-sm font-normal font-['Sora'] leading-[10px]">
          {marketCap}
        </div>

        {/* Change 24h */}
        <div className="text-[#5BFE42] text-sm font-normal font-['Sora'] leading-[10px]">
          {change24h}
        </div>

        {/* TVL */}
        <div className="text-white/80 text-sm font-normal font-['Sora'] leading-[10px]">
          {tvl}
        </div>

        {/* Holders Count */}
        <div className="text-white/80 text-sm font-normal font-['Sora'] leading-[10px]">
          {holdersCount.toLocaleString()}
        </div>

        {/* Volume 24h */}
        <div className="text-white/80 text-sm font-normal font-['Sora'] leading-[10px]">
          {volume24h}
        </div>

        {/* Status */}
        <div className="text-white/80 text-sm font-normal font-['Sora'] leading-[10px] whitespace-nowrap">
          {status}
        </div>

      </div>
    </div>
  )
}

AgentCard.displayName = "AgentCard"

export default AgentCard