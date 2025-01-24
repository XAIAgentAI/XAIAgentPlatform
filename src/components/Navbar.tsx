'use client';

import { CustomButton as Button } from "@/components/ui-custom/custom-button"
import { GradientBorderButton } from "@/components/ui-custom/gradient-border-button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import Link from "next/link"
import { Search, Menu, X, Wallet } from "lucide-react"
import { useWallet } from "@/hooks/useWallet"
import { useToast } from "@/components/ui/use-toast"
import ThemeToggle from "./ThemeToggle"
import { useState } from "react"

const navigationLinks = [
  {
    id: "trading",
    href: "/",
    label: "Trading AI Agent"
  },
  {
    id: "explore",
    href: "/agents",
    label: "Explore AI Agent"
  },
  {
    id: "creating",
    href: "#",
    label: "Creating AI Agent",
    comingSoon: true
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

  const handleComingSoonClick = (e: React.MouseEvent, isComingSoon?: boolean) => {
    if (isComingSoon) {
      e.preventDefault();
      toast({
        description: "Coming soon! Stay tuned for updates.",
      })
    }
  }

  return (
    <>
      <nav className="sticky top-0 left-0 right-0 w-full h-20 bg-background z-50">
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
                  key={link.id}
                  href={link.href}
                  className="text-text-primary text-xs font-normal font-['Sora'] leading-7 whitespace-nowrap"
                  onClick={(e) => handleComingSoonClick(e, link.comingSoon)}
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
            <Wallet 
              className="text-[#FF540E] cursor-pointer hover:text-[#FF540E]/90 lg:hidden w-6 h-6 text-text-primary" 
              onClick={handleWalletClick}
            />

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

            <GradientBorderButton>
              BUY DBC
            </GradientBorderButton>

            <GradientBorderButton>
              BUY XAA
            </GradientBorderButton>

            <Button 
              className="h-[38.50px]"
              onClick={handleWalletClick}
              disabled={isConnecting}
            >
              {isConnecting ? "Connecting..." : address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connect wallet"}
            </Button>

            <ThemeToggle />
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="lg:hidden absolute top-20 left-0 right-0 bg-background border-b border-border-color p-4 space-y-4 z-50 flex flex-col items-center">
              {navigationLinks.map((link) => (
                <Link
                  key={link.id}
                  href={link.href}
                  className="w-full block text-center text-text-primary text-base lg:text-sm font-normal font-['Sora']"
                >
                  {link.label}
                </Link>
              ))}

              <GradientBorderButton 
                containerClassName="w-full max-w-[220px]"
              >
                BUY DBC
              </GradientBorderButton>

              <GradientBorderButton 
                containerClassName="w-full max-w-[220px]"
              >
                BUY XAA
              </GradientBorderButton>
            </div>
          )}
        </div>
      </nav>
    </>
  )
}

export default Navbar; 