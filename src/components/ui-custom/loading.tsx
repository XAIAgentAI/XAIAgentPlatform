import { cn } from "@/lib/utils"

interface LoadingProps {
  className?: string
}

export const Loading = ({ className }: LoadingProps) => {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
      </div>
    </div>
  )
} 