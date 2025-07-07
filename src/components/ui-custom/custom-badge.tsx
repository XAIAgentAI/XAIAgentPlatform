"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type AgentType = "Platform" | "Infrastructure" | "AI Agent"
export type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "lightSuccess" | "coffee"

interface CustomBadgeProps {
  className?: string
  children?: React.ReactNode
  variant?: BadgeVariant
}

const getCategoryColor = (category: string) => {
  const colors: Record<AgentType, string> = {
    "Platform": "bg-[#99642E]",
    "Infrastructure": "bg-[#74992E]",
    "AI Agent": "bg-[#2E6599]"
  }
  return colors[category as AgentType] || colors["Platform"]
}

const getVariantColor = (variant: BadgeVariant = "default") => {
  const colors: Record<BadgeVariant, string> = {
    "default": "!bg-[#2E9951]",
    "success": "bg-[#2E9951]",
    "lightSuccess": "bg-[#74992E]",
    "warning": "bg-[#FF8A00]",
    "coffee": "bg-[#99642E]",
    "error": "bg-[#992E2E]",
    "info": "bg-[#2E6599]"
  }
  return colors[variant]
}

export const CustomBadge = ({ className, children, variant }: CustomBadgeProps) => {
  const category = children?.toString() || "Platform"
  const bgColor = variant ? getVariantColor(variant) : getCategoryColor(category)
  
  return (
    <Badge 
      variant="secondary" 
      className={cn(
        bgColor,
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