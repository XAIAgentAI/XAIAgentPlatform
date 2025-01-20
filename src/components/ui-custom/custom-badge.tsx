"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type AgentType = "Productivity" | "Entertainment"

interface CustomBadgeProps {
  type: AgentType
  className?: string
  children?: React.ReactNode
}

const getTypeColor = (type: AgentType) => {
  const colors = {
    Productivity: "bg-[#99632d]",
    Entertainment: "bg-[#2791a0]"
  }
  return colors[type]
}

export const CustomBadge = ({ type, className, children }: CustomBadgeProps) => {
  return (
    <Badge 
      variant="secondary" 
      className={cn(
        getTypeColor(type),
        "h-[21px] px-[5px] py-1.5 border-none text-white rounded-[100px]",
        "text-center text-[10px] font-normal font-['Sora'] leading-10",
        className
      )}
    >
      <div className="flex items-center gap-1">
        {type}
        {children}
      </div>

    </Badge>
  )
}

CustomBadge.displayName = "CustomBadge" 