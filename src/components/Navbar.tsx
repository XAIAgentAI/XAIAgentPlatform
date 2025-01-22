'use client';

import { CustomButton as Button } from "@/components/ui-custom/custom-button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import Link from "next/link"
import { Search, Menu, X } from "lucide-react"
import { useWallet } from "@/hooks/useWallet"
import { useToast } from "@/components/ui/use-toast"
import ThemeToggle from "./ThemeToggle"
import { useState } from "react"

const navigationLinks = [
  {
    href: "/trading",
    label: "Trading AI Agent",
    mobileName: "Trading"
  },
  {
    href: "/agents",
    label: "Explore AI Agent",
    mobileName: "Explore"
  },
  {
    href: "/create",
    label: "Creating AI Agent",
    mobileName: "Creating"
  }
]

const Navbar = () => {
  const { address, isConnecting, error, connect, disconnect } = useWallet()
  const { toast } = useToast()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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
        {/* Logo and Navigation Links */}
        <div className="flex items-center justify-start pr-5 gap-8">
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
          <div className="hidden lg:flex items-center gap-8">
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-text-primary text-xs font-normal font-['Sora'] leading-7 whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile Menu Button and Theme Toggle */}
        <div className="flex items-center gap-4 lg:gap-8">
          <button 
            className="lg:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <ThemeToggle className="lg:hidden" />
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-4 flex-1 justify-end">
          <div className="relative flex-1 max-w-[200px] lg:max-w-[250px] xl:max-w-[300px]">
            <Input
              type="search"
              placeholder="Search Agents/CA"
              className="w-full pl-[15px] pr-[85.50px] py-2.5 bg-transparent border-text-primary/30 rounded-[100px] text-text-primary text-xs font-normal font-['Sora'] leading-10 placeholder:text-text-secondary focus-visible:ring-0"
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
                <linearGradient id="buttonGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: '#FF540E' }} />
                  <stop offset="40%" style={{ stopColor: '#A0A0A0' }} />
                  <stop offset="100%" style={{ stopColor: '#A0A0A0' }} />
                </linearGradient>
              </defs>
              <rect 
                width="100%" 
                height="100%" 
                fill="none" 
                stroke="url(#buttonGradient2)" 
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

          <ThemeToggle />
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden absolute top-20 left-0 right-0 bg-background border-b border-border-color p-4 space-y-4 z-50">
            <div className="relative">
              <Input
                type="search"
                placeholder="Search Agents/CA"
                className="w-full pl-4 pr-10 py-2 bg-transparent border-text-primary/30 rounded-[100px]"
              />
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
            </div>
          
            <div className="flex flex-row gap-4">
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-text-primary text-sm font-normal font-['Sora']"
                >
                  {link.mobileName}
                </Link>
              ))}
            </div>

            <div className="flex flex-row gap-4">
              <Button className="w-full border border-[#ff540e] bg-transparent hover:bg-transparent text-text-primary">
                BUY DBC
              </Button>
              <Button className="w-full border border-[#ff540e] bg-transparent hover:bg-transparent text-text-primary">
                BUY XAA
              </Button>
            </div>

            <Button 
              className="w-full"
              onClick={handleWalletClick}
              disabled={isConnecting}
            >
              {isConnecting ? "连接中..." : address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connect wallet"}
            </Button>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar; 