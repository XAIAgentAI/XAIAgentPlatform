"use client"

import { Avatar } from "@/components/ui/avatar"
import { CustomBadge, AgentType } from "@/components/ui-custom/custom-badge"
import { CustomButton } from "@/components/ui-custom/custom-button"
import Image from "next/image"

interface AgentCardProps {
  name: string
  symbol: string
  type: AgentType
  marketCap: string
  change24h: string
  tvl: string
  holdersCount: number
  volume24h: string
  inferences: number
  avatar: string
}

const AgentCard = ({
  name,
  symbol,
  type,
  marketCap,
  change24h,
  tvl,
  holdersCount,
  volume24h,
  inferences,
  avatar,
}: AgentCardProps) => {
  return (
    <div className="grid grid-cols-9 gap-4 items-center px-4 py-4 border-b border-white/10">
      <div className="col-span-2 flex items-center gap-4">
        <Avatar className="w-[60px] h-[60px] rounded-[100px]">
          <img src={avatar} alt={name} className="object-cover" />
        </Avatar>
        <div className="space-y-2">
          <h3 className="text-white/80 text-sm font-normal font-['Sora'] leading-[10px]">{name}</h3>
          <div className="flex items-center gap-2">
            <CustomBadge type={type} >
              <Image src="/images/person.svg" alt="Person" width={8} height={8} />
            </CustomBadge>
            <span className="text-white/50 text-[10px] font-normal font-['Sora'] leading-[10px]">${symbol}</span>
          </div>
        </div>
      </div>

      <div className="text-white/80 text-sm font-normal font-['Sora'] leading-[10px]">{marketCap}</div>
      <div className="text-[#5bfd42] text-sm font-normal font-['Sora'] leading-[10px]">{change24h}</div>
      <div className="text-white/80 text-sm font-normal font-['Sora'] leading-[10px]">{tvl}</div>
      <div className="text-white/80 text-sm font-normal font-['Sora'] leading-[10px]">{holdersCount.toLocaleString()}</div>
      <div className="text-white/80 text-sm font-normal font-['Sora'] leading-[10px]">{volume24h}</div>
      <div className="text-white/80 text-sm font-normal font-['Sora'] leading-[10px]">{inferences.toLocaleString()}</div>
      <div>
        <CustomButton className="flex items-center gap-2">
          <Image src="/images/chat.svg" alt="Chatting" width={12} height={12} />
          Chatting
        </CustomButton>
      </div>
    </div>
  )
}

AgentCard.displayName = "AgentCard"

export default AgentCard 