"use client"

import { Avatar } from "@/components/ui/avatar"
import { CustomBadge } from "@/components/ui-custom/custom-badge"
import { CustomButton } from "@/components/ui-custom/custom-button"
import Image from "next/image"
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'

interface AgentCardProps {
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

const AgentCard = ({
  id,
  name,
  description,
  category,
  avatar,
  status,
  capabilities,
  rating,
  usageCount,
  creatorAddress,
  reviewCount,
  createdAt,
}: AgentCardProps) => {

  const router = useRouter()

  const handleCardClick = (e: React.MouseEvent) => {
    const isButton = (e.target as HTMLElement).closest('button')
    if (isButton) {
      return
    }
    router.push(`/agent-detail/${id}`)
  }

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/chat/${id}`)
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
        {/* AI Agents - col-span-2 */}
        <div className="col-span-2 flex items-center gap-4">
          <Avatar className="w-[60px] h-[60px] rounded-[100px]">
            <img src={avatar} alt={name} className="object-cover" />
          </Avatar>
          <div className="space-y-2">
            <h3 className="text-white/80 text-sm font-normal font-['Sora'] leading-[10px]">{name}</h3>
            <div className="flex items-center gap-2">
              <CustomBadge>
                {category}
              </CustomBadge>
              <span className="text-white/50 text-[10px] font-normal font-['Sora'] leading-[10px]">
                {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="text-white/80 text-sm font-normal font-['Sora'] leading-[10px]">
          {rating.toFixed(1)}
        </div>

        {/* Category */}
        <div className="text-white/80 text-sm font-normal font-['Sora'] leading-[10px]">
          {category}
        </div>

        {/* Usage Count */}
        <div className="text-white/80 text-sm font-normal font-['Sora'] leading-[10px]">
          {usageCount.toLocaleString()}
        </div>

        {/* Reviews */}
        <div className="text-white/80 text-sm font-normal font-['Sora'] leading-[10px]">
          {reviewCount.toLocaleString()}
        </div>

        {/* Status */}
        <div className="text-white/80 text-sm font-normal font-['Sora'] leading-[10px]">
          {status}
        </div>

        {/* Creator */}
        <div className="text-white/50 text-sm font-normal font-['Sora'] leading-[10px] truncate" title={creatorAddress}>
          {creatorAddress.slice(0, 6)}...{creatorAddress.slice(-4)}
        </div>

        {/* Action Button */}
        <div>
          <CustomButton 
            onClick={handleButtonClick}
            className="flex items-center gap-2"
          >
            <Image src="/images/chat.svg" alt="Chatting" width={12} height={12} />
            Chat
          </CustomButton>
        </div>
      </div>
    </div>
  )
}

AgentCard.displayName = "AgentCard"

export default AgentCard