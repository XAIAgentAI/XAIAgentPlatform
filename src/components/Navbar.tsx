'use client';

import { CustomButton as Button } from "@/components/ui-custom/custom-button"
import { GradientBorderButton } from "@/components/ui-custom/gradient-border-button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import Link from "next/link"
import { Search, Menu, X, Wallet, ChevronDown } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import ThemeToggle from "./ThemeToggle"
import { useState, useEffect } from "react"
import { useAppKit, useAppKitAccount } from '@reown/appkit/react'
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from '@/hooks/useAuth'

const navigationLinks = [
  {
    id: "explore",
    href: "/agents",
    label: "Explore AI Agent"
  },
  {
    id: "trading",
    href: "#",
    label: "Trading AI Agent",
    comingSoon: true
  },
  {
    id: "creating",
    href: "#",
    label: "Creating AI Agent",
    comingSoon: true
  }
]

const Navbar = () => {
  const { toast } = useToast()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const { open } = useAppKit()
  const { address, isConnected, status } = useAppKitAccount()
  const { isAuthenticated, isLoading, error } = useAuth()

  // 关闭移动菜单当路由改变时
  useEffect(() => {
    setIsMenuOpen(false)
  }, [])

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        description: error,
      })
    }
  }, [error, toast])

  const handleComingSoonClick = (e: React.MouseEvent, isComingSoon?: boolean) => {
    if (isComingSoon) {
      e.preventDefault();
      toast({
        description: "Coming soon! Stay tuned for updates.",
      })
    }
  }

  const handleConnectWallet = () => {
    if (isConnected) {
      open({ view: 'Account' })
    } else {
      open({ view: 'Connect' })
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <nav className="sticky top-0 left-0 right-0 w-full h-20 bg-background/80 backdrop-blur-md z-50 border-b border-border-color/50">
      <div className="container mx-auto h-full flex items-center justify-between">
        {/* Logo and Navigation Links */}
        <div className="flex items-center justify-start pr-5 gap-8">
          <Link href="/" className="flex flex-shrink-0 items-center gap-2 transition-transform hover:scale-105">
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
                className={cn(
                  "text-text-primary text-xs font-normal font-['Sora'] leading-7 whitespace-nowrap",
                  "transition-colors hover:text-primary",
                  "relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary",
                  "hover:after:w-full after:transition-all"
                )}
                onClick={(e) => handleComingSoonClick(e, link.comingSoon)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile Menu Button and Theme Toggle */}
        <div className="flex items-center gap-4 lg:gap-8">
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="lg:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={isMenuOpen ? "close" : "menu"}
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </motion.div>
            </AnimatePresence>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleConnectWallet}
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary"
          >
            {status === 'connecting' ? (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : isConnected ? (
              <div className="relative">
                <Wallet className="w-5 h-5" />
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500" />
              </div>
            ) : (
              <Wallet className="w-5 h-5" />
            )}
          </motion.button>

          <ThemeToggle className="lg:hidden" />
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-4 flex-1 justify-end">
          <div className={cn(
            "relative flex-1 max-w-[300px] transition-all duration-300",
            isSearchFocused && "max-w-[400px]"
          )}>
            <Input
              type="search"
              placeholder="Search Agents/CA"
              className={cn(
                "w-full pl-[15px] pr-[85.50px] py-2.5 bg-transparent",
                "border-text-primary/30 rounded-[100px]",
                "text-text-primary text-xs font-normal font-['Sora'] leading-10",
                "placeholder:text-text-secondary focus-visible:ring-0",
                "transition-all duration-300",
                "focus:border-primary focus:ring-1 focus:ring-primary/30"
              )}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
          </div>

          <GradientBorderButton
            className="transition-transform hover:scale-105"
          >
            BUY DBC
          </GradientBorderButton>

          <GradientBorderButton
            className="transition-transform hover:scale-105"
          >
            BUY XAA
          </GradientBorderButton>

          <Button 
            onClick={handleConnectWallet}
            disabled={status === 'connecting' || isLoading}
            className={cn(
              "h-[38.50px] min-w-[160px] transition-all",
              "hover:scale-105 active:scale-95",
              (status === 'connecting' || isLoading) && "opacity-70"
            )}
          >
            {status === 'connecting' || isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {status === 'connecting' ? 'Connecting...' : 'Authenticating...'}
              </div>
            ) : isConnected && address ? (
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                {formatAddress(address)}
                <ChevronDown className="w-4 h-4" />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </div>
            )}
          </Button>
          <ThemeToggle />
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden absolute top-20 left-0 right-0 bg-background/95 backdrop-blur-md border-b border-border-color p-4 space-y-4 z-50"
            >
              <div className="relative w-full mb-4">
                <Input
                  type="search"
                  placeholder="Search Agents/CA"
                  className="w-full pl-[15px] pr-[85.50px] py-2.5 bg-transparent border-text-primary/30 rounded-[100px] text-text-primary text-xs font-normal font-['Sora'] leading-10 placeholder:text-text-secondary focus-visible:ring-0"
                />
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
              </div>

              {navigationLinks.map((link) => (
                <Link
                  key={link.id}
                  href={link.href}
                  className="w-full block text-center text-text-primary text-base lg:text-sm font-normal font-['Sora'] py-2 hover:bg-primary/10 rounded-lg transition-colors"
                  onClick={(e) => {
                    handleComingSoonClick(e, link.comingSoon)
                    setIsMenuOpen(false)
                  }}
                >
                  {link.label}
                </Link>
              ))}

              <GradientBorderButton
                containerClassName="w-full max-w-[220px] mx-auto"
                className="w-full"
              >
                BUY DBC
              </GradientBorderButton>

              <GradientBorderButton
                containerClassName="w-full max-w-[220px] mx-auto"
                className="w-full"
              >
                BUY XAA
              </GradientBorderButton>

              <Button 
                onClick={handleConnectWallet}
                disabled={status === 'connecting' || isLoading}
                className="w-full max-w-[220px] mx-auto"
              >
                {status === 'connecting' || isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {status === 'connecting' ? 'Connecting...' : 'Authenticating...'}
                  </div>
                ) : isConnected && address ? (
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    {formatAddress(address)}
                    <ChevronDown className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Connect Wallet
                  </div>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}

export default Navbar; 