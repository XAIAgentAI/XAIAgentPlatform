"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type AgentType = "Platform" | "Infrastructure" | "AI Agent"

interface CustomBadgeProps {
  className?: string
  children?: React.ReactNode
}

const getCategoryColor = (category: string) => {
  const colors: Record<AgentType, string> = {
    "Platform": "bg-[#99642E]",
    "Infrastructure": "bg-[#74992E]",
    "AI Agent": "bg-[#2E6599]"
  }
  return colors[category as AgentType] || colors["Platform"]
}

export const CustomBadge = ({ className, children }: CustomBadgeProps) => {
  const category = children?.toString() || "Platform"
  
  return (
    <Badge 
      variant="secondary" 
      className={cn(
        getCategoryColor(category),
        "h-[20px] px-[10px] border-none text-white rounded-[100px]",
        "text-center text-[10px] font-normal font-['Sora'] whitespace-nowrap",
        className
      )}
    >
      {children}
    </Badge>
  )
}

CustomBadge.displayName = "CustomBadge" 