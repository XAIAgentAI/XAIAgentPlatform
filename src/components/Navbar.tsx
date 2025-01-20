'use client';

import { CustomButton as Button } from "@/components/ui-custom/custom-button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import Link from "next/link"
import { Search } from "lucide-react"

const Navbar = () => {
  return (
    <nav className="w-full h-20 relative flex-col justify-start items-start">
      <div className="container mx-auto h-full flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Logo"
              width={50}
              height={50}
              className="w-[50px] h-[50.10px]"
            />
          </Link>
          <div className="flex items-center gap-8">
            <Link
              href="/trading"
              className="text-white text-xs font-normal font-['Sora'] leading-7 hover:text-white/80 transition-colors"
            >
              Trading AI Agent
            </Link>
            <Link
              href="/explore"
              className="text-white text-xs font-normal font-['Sora'] leading-7 hover:text-white/80 transition-colors"
            >
              Explore AI Agent
            </Link>
            <Link
              href="/create"
              className="text-white text-xs font-normal font-['Sora'] leading-7 hover:text-white/80 transition-colors"
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
              className="pl-[15px] pr-[85.50px] py-2.5 bg-transparent border-white/30 rounded-[100px] text-white text-xs font-normal font-['Sora'] leading-10 placeholder:text-white/50 w-[300px] focus-visible:ring-0"
            />
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
          </div>
          <div className="w-max inline-block p-[1px] rounded-lg bg-gradient-to-r from-[#FF540E] to-[#A0A0A0]">
            <Button 
              className="h-[38.50px] px-4 bg-black hover:bg-black/90 text-white rounded-[7px] text-xs font-normal font-['Sora']"
            >
              BUY DBC
            </Button>
          </div>

          <div className="w-max inline-block p-[1px] rounded-lg bg-gradient-to-r from-[#FF540E] to-[#A0A0A0]">
            <Button 
              className="h-[38.50px] px-4 bg-black hover:bg-black/90 text-white rounded-[7px] text-xs font-normal font-['Sora']"
            >
              BUY XAA
            </Button>
          </div>

          <Button className="h-[38.50px]">
            Connect wallet
          </Button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar; 