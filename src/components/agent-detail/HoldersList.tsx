import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import React, { useState } from 'react';
import { useDBCHolders } from "@/hooks/useDBCHolders";
import { useTranslations } from 'next-intl';

interface HolderItem {
  address: {
    hash: string;
    is_contract: boolean;
  };
  value: string;
  token?: {
    total_supply: string;
  };
}

interface HoldersListProps {
  tokenAddress: string;
  holders: string;
  hasTokenAddress?: boolean;
}

export function HoldersList({ tokenAddress, holders, hasTokenAddress }: HoldersListProps) {
  const { holdersData, loading, error } = useDBCHolders(tokenAddress);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const t = useTranslations('holderDistribution');

  // Calculate total pages
  const totalPages = Math.ceil((holdersData?.items?.length || 0) / itemsPerPage);

  // Get current page data
  const currentHolders = holdersData?.items?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ) || [];

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  const totalSupply = holdersData?.items?.[0]?.token?.total_supply 
    ? BigInt(holdersData.items[0].token.total_supply) 
    : BigInt(0);

  // Format percentage with 2 decimal places
  const formatPercentage = (value: string) => {
    if (!value || !totalSupply) return '0.00';
    const percentage = (Number(BigInt(value) * BigInt(10000) / totalSupply) / 100).toFixed(2);
    return percentage;
  };

  if (loading) {
    return (
      <Card className="p-4 bg-card-inner">
        <div className="text-center text-muted-foreground">{t('loading')}</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 bg-card-inner">
        <div className="text-center text-destructive">{error}</div>
      </Card>
    );
  }

  // 检查代币是否已创建：如果代币地址不存在，显示提示信息
  const shouldShowTokenNotCreatedMessage = !hasTokenAddress || !tokenAddress;

  if (shouldShowTokenNotCreatedMessage) {
    return (
      <div className="font-['Sora']">
        <div className="text-s mb-4">
          {t('title', { count: Number(holders || 0).toLocaleString() })}
        </div>

        <Card className="p-6 bg-card-inner">
          <div className="text-center text-muted-foreground">
            {t('tokenNotCreated')}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="font-['Sora']">
      <div className="text-s mb-4">
        {t('title', { count: Number(holders).toLocaleString() })}
      </div>
      
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border dark:border-border">
            <TableHead className="w-16">#</TableHead>
            <TableHead>{t('address')}</TableHead>
            <TableHead className="text-right">{t('percentage')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentHolders.map((holder: HolderItem, index: number) => (
            <TableRow key={holder.address.hash} className="border-b border-border dark:border-border">
              <TableCell className="font-medium">
                {(currentPage - 1) * itemsPerPage + index + 1}
              </TableCell>
              <TableCell>
                <a 
                  href={`https://www.dbcscan.io/address/${holder.address.hash}`}
                  target="_blank"
                  className="hover:text-primary transition-colors"
                >
                  <span className="hidden sm:inline">{holder.address.hash}</span>
                  <span className="sm:hidden">{`${holder.address.hash.slice(0, 6)}...${holder.address.hash.slice(-6)}`}</span>
                </a>
              </TableCell>
              <TableCell className="text-right">
                {formatPercentage(holder.value)}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-end gap-2 mt-4">
        <Button
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
          variant="outline"
          size="sm"
          className="text-xs px-3 py-1 h-7"
        >
          {t('previous')}
        </Button>
        <Button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          variant="outline"
          size="sm"
          className="text-xs px-3 py-1 h-7"
        >
          {t('next')}
        </Button>
      </div>
    </div>
  );
} 