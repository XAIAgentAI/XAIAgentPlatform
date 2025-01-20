"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ButtonHTMLAttributes } from "react"

interface CustomButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string
}

export const CustomButton = ({ className, children, ...props }: CustomButtonProps) => {
  return (
    <Button 
      size="sm"
      className={cn(
        "h-[38.50px] px-4 py-3.5 bg-[#ff540e] hover:bg-[#ff540e]/90 text-white rounded-lg",
        "text-center text-xs font-normal font-['Sora'] leading-10",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}

CustomButton.displayName = "CustomButton" 