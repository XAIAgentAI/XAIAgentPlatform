'use client';

import { Search } from 'lucide-react';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-primary">Logo</span>
            <span className="bg-primary/10 text-primary px-2.5 py-1 text-xs font-medium rounded-lg">Debug</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Link href="/trading" className="px-4 py-2 rounded-xl text-sm font-medium text-text-secondary hover:text-primary hover:bg-card-hover transition-all duration-200">
              Trading AI Agent
            </Link>
            <Link href="/explore" className="px-4 py-2 rounded-xl text-sm font-medium text-text-secondary hover:text-primary hover:bg-card-hover transition-all duration-200">
              探索AI Agent
            </Link>
            <Link href="/create" className="px-4 py-2 rounded-xl text-sm font-medium text-text-secondary hover:text-primary hover:bg-card-hover transition-all duration-200">
              创建AI Agent
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-text-tertiary" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-4 py-2 text-sm border border-border rounded-xl leading-5 bg-card-hover/50 placeholder-text-tertiary text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/20 transition-all duration-200"
                placeholder="Search AI Agent/CTA"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            <Link
              href="/buy-dbc"
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl text-text-secondary hover:text-primary border border-border hover:border-primary/20 bg-transparent transition-all duration-200 hover:bg-card-hover"
            >
              BUY DBC
            </Link>
            <Link
              href="/buy-xaa"
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl text-text-secondary hover:text-primary border border-border hover:border-primary/20 bg-transparent transition-all duration-200 hover:bg-card-hover"
            >
              BUY XAA
            </Link>
            <Link
              href="/wallet"
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl text-primary-foreground bg-primary hover:bg-primary-hover border border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
            >
              连接钱包
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 