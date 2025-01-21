'use client';

import { CustomButton as Button } from "@/components/ui-custom/custom-button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import Link from "next/link"
import { Search } from "lucide-react"
import { useWallet } from "@/hooks/useWallet"
import { useToast } from "@/components/ui/use-toast"

const Navbar = () => {
  const { address, isConnecting, error, connect, disconnect } = useWallet()
  const { toast } = useToast()

  const handleWalletClick = async () => {
    try {
      if (address) {
        await disconnect()
      } else {
        await connect()
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "错误",
        description: error instanceof Error ? error.message : "操作失败",
      })
    }
  }

  return (
    <nav className="w-full h-20 relative flex-col justify-start items-start">
      <div className="container mx-auto h-full flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex flex-shrink-0 items-center gap-2">
            <Image
              src="/logo.png"
              alt="Logo"
              width={50}
              height={50}
              className="w-[50px] h-[50px] object-cover flex-shrink-0"
              priority
              unoptimized
            />
          </Link>
          <div className="flex items-center gap-8">
            <Link
              href="/trading"
              className="text-text-primary text-xs font-normal font-['Sora'] leading-7"
            >
              Trading AI Agent
            </Link>
            <Link
              href="/agents"
              className="text-text-primary text-xs font-normal font-['Sora'] leading-7"
            >
              Explore AI Agent
            </Link>
            <Link
              href="/create"
              className="text-text-primary text-xs font-normal font-['Sora'] leading-7"
            >
              Creating AI Agent
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Input
              type="search"
              placeholder="Search Agents/CA"
              className="pl-[15px] pr-[85.50px] py-2.5 bg-transparent border-text-primary/30 rounded-[100px] text-text-primary text-xs font-normal font-['Sora'] leading-10 placeholder:text-text-secondary w-[300px] focus-visible:ring-0"
            />
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
          </div>

          <div className="relative">
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="buttonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: '#FF540E' }} />
                  <stop offset="40%" style={{ stopColor: '#A0A0A0' }} />
                  <stop offset="100%" style={{ stopColor: '#A0A0A0' }} />
                </linearGradient>
              </defs>
              <rect 
                width="100%" 
                height="100%" 
                fill="none" 
                stroke="url(#buttonGradient)" 
                strokeWidth="1" 
                rx="8" 
                ry="8"
              />
            </svg>
            <Button 
              className="relative bg-transparent hover:bg-transparent text-text-primary px-4 py-3.5 rounded-lg"
            >
              BUY DBC
            </Button>
          </div>

          <div className="relative">
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="buttonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: '#FF540E' }} />
                  <stop offset="40%" style={{ stopColor: '#A0A0A0' }} />
                  <stop offset="100%" style={{ stopColor: '#A0A0A0' }} />
                </linearGradient>
              </defs>
              <rect 
                width="100%" 
                height="100%" 
                fill="none" 
                stroke="url(#buttonGradient)" 
                strokeWidth="1" 
                rx="8" 
                ry="8"
              />
            </svg>
            <Button 
              className="relative bg-transparent hover:bg-transparent text-text-primary px-4 py-3.5 rounded-lg"
            >
              BUY XAA
            </Button>
          </div>

          <Button 
            className="h-[38.50px]"
            onClick={handleWalletClick}
            disabled={isConnecting}
          >
            {isConnecting ? "连接中..." : address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connect wallet"}
          </Button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar; 