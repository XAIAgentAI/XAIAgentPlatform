"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { ButtonHTMLAttributes } from "react"

interface CustomButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  isChat?: boolean;
}

export const CustomButton = ({
  className,
  isChat,
  onClick,
  ...props
}: CustomButtonProps) => {
  const { toast } = useToast()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
  }

  return (
    <Button
      className={cn(
        "bg-primary text-primary-foreground hover:bg-primary/90",
        className
      )}
      onClick={handleClick}
      {...props}
    />
  )
}

CustomButton.displayName = "CustomButton" 