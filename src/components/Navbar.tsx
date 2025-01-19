'use client';

import { Search } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-xl">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-primary">Logo</span>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center space-x-1">
              <Button variant="ghost" asChild>
                <Link href="/trading">Trading AI Agent</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/explore">Explore AI Agent</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/create">Creating AI Agent</Link>
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search Agents/CA"
                className="pl-10 bg-white/5 border-white/10"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <Button variant="secondary">BUY DBC</Button>
            <Button variant="secondary">BUY XAA</Button>
            <Button>Connect wallet</Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 