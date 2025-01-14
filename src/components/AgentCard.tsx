'use client';

import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AgentCardProps {
  id: string;
  name: string;
  image: string;
  marketCap: string;
  percentageChange: string;
  totalValue: string;
  holders: string;
  volume: string;
  influence: string;
  tag?: string;
}

const AgentCard = ({
  id,
  name,
  image,
  marketCap,
  percentageChange,
  totalValue,
  holders,
  volume,
  influence,
  tag
}: AgentCardProps) => {
  const router = useRouter();
  const isPositiveChange = !percentageChange.startsWith('-');

  const handleChatClick = () => {
    router.push(`/chat/${id}`);
  };

  return (
    <div className="group flex items-center justify-between p-5 hover:bg-card-hover border-b border-border transition-all duration-200 dark:hover:bg-white/[0.02] dark:border-white/10 first:rounded-t-xl last:rounded-b-xl hover:shadow-sm">
      {/* Left section - Image and Name */}
      <div className="flex items-center space-x-5 w-1/4">
        <div className="relative h-12 w-12 flex-shrink-0 transform group-hover:scale-105 transition-transform duration-200">
          <Image
            src={image}
            alt={name}
            fill
            className="rounded-xl object-cover ring-2 ring-border/5 dark:ring-white/5"
          />
        </div>
        <div>
          <h3 className="font-semibold text-foreground group-hover:text-primary/90 transition-colors dark:text-white mb-1">{name}</h3>
          {tag && (
            <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary shadow-sm">
              {tag}
            </span>
          )}
        </div>
      </div>

      {/* Middle section - Stats */}
      <div className="grid grid-cols-6 gap-6 w-2/3">
        <div className="text-sm">
          <p className="text-foreground font-semibold group-hover:text-primary/90 transition-colors dark:text-white">{marketCap}</p>
          <p className={`text-sm font-medium ${isPositiveChange ? 'text-success' : 'text-error'}`}>
            {percentageChange}
          </p>
        </div>
        <div className="text-sm col-span-1">
          <p className="text-text-tertiary text-xs font-medium mb-1">Total Value</p>
          <p className="text-text-secondary font-medium group-hover:text-foreground transition-colors dark:group-hover:text-white">{totalValue}</p>
        </div>
        <div className="text-sm col-span-1">
          <p className="text-text-tertiary text-xs font-medium mb-1">Holders</p>
          <p className="text-text-secondary font-medium group-hover:text-foreground transition-colors dark:group-hover:text-white">{holders}</p>
        </div>
        <div className="text-sm col-span-1">
          <p className="text-text-tertiary text-xs font-medium mb-1">24h Vol</p>
          <p className="text-text-secondary font-medium group-hover:text-foreground transition-colors dark:group-hover:text-white">{volume}</p>
        </div>
        <div className="text-sm col-span-1">
          <p className="text-text-tertiary text-xs font-medium mb-1">Influence</p>
          <p className="text-text-secondary font-medium group-hover:text-foreground transition-colors dark:group-hover:text-white">{influence}</p>
        </div>
      </div>

      {/* Right section - Action button */}
      <div className="flex-shrink-0">
        <button
          onClick={handleChatClick}
          className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20 hover:border-primary transition-all duration-200 shadow-sm hover:shadow-md"
        >
          开始聊天
          <ArrowUpRight className="ml-2 h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default AgentCard; 