"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type AgentCategory = "Productivity" | "Entertainment" | "Social" | "Education" | "Finance" | "Other"

interface CustomBadgeProps {
  className?: string
  children?: React.ReactNode
}

const getCategoryColor = (category: string) => {
  const colors: Record<AgentCategory, string> = {
    Productivity: "bg-[#99632d]",
    Entertainment: "bg-[#2791a0]",
    Social: "bg-[#7c3aed]",
    Education: "bg-[#2563eb]",
    Finance: "bg-[#16a34a]",
    Other: "bg-[#64748b]"
  }
  return colors[category as AgentCategory] || colors.Other
}

export const CustomBadge = ({ className, children }: CustomBadgeProps) => {
  const category = children?.toString() || "Other"
  
  return (
    <Badge 
      variant="secondary" 
      className={cn(
        getCategoryColor(category),
        "h-[21px] px-[5px] py-1.5 border-none text-white rounded-[100px]",
        "text-center text-[10px] font-normal font-['Sora'] leading-10",
        className
      )}
    >
      {children}
    </Badge>
  )
}

CustomBadge.displayName = "CustomBadge" 