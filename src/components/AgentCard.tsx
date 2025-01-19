'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';

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
  $CONVO: string;
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
  tag,
  $CONVO
}: AgentCardProps) => {
  const router = useRouter();
  const isPositiveChange = !percentageChange.startsWith('-');

  const handleChatClick = () => {
    router.push(`/chat/${id}`);
  };

  return (
    <TableRow className="border-white/10 hover:bg-white/[0.02]">
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 flex-shrink-0">
            <Image
              src={image}
              alt={name}
              fill
              className="rounded-lg object-cover"
            />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{name}</span>
              <span className="text-xs text-muted-foreground">{$CONVO}</span>
            </div>
            {tag && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-0">
                {tag}
              </Badge>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-sm text-foreground">
        {marketCap}
      </TableCell>
      <TableCell>
        <span className={isPositiveChange ? 'text-green-500' : 'text-red-500'}>
          {percentageChange}
        </span>
      </TableCell>
      <TableCell className="text-sm text-foreground">
        {totalValue}
      </TableCell>
      <TableCell className="text-sm text-foreground">
        {holders}
      </TableCell>
      <TableCell className="text-sm text-foreground">
        {volume}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground">{influence}</span>
          <Button variant="outline" onClick={handleChatClick}>
            Chatting
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default AgentCard; 