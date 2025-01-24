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

interface HoldersListProps {
  tokenAddress: string;
  holders: string;
}

export function HoldersList({ tokenAddress, holders }: HoldersListProps) {
  const { holders: holdersList, loading, error } = useDBCHolders(tokenAddress);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate total pages
  const totalPages = Math.ceil(holdersList.length / itemsPerPage);

  // Get current page data
  const currentHolders = holdersList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  // Calculate total value of all holders
  const totalValue = holdersList.reduce((sum, holder) => sum + BigInt(holder.value), BigInt(0));

  // Format percentage with 2 decimal places
  const formatPercentage = (value: string) => {
    const percentage = (Number(BigInt(value) * BigInt(10000) / totalValue) / 100).toFixed(2);
    return percentage;
  };

  if (loading) {
    return (
      <Card className="p-4 bg-card-inner">
        <div className="text-center text-muted-foreground">Loading holders...</div>
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

  return (
    <div className="font-['Sora']">
      <div className="text-s mb-4">
        Holder Distribution ({Number(holders).toLocaleString()} holders)
      </div>
      
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border dark:border-border">
            <TableHead className="w-16">#</TableHead>
            <TableHead>Address</TableHead>
            <TableHead className="text-right">Percentage</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentHolders.map((holder, index) => (
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
          Previous
        </Button>
        <Button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          variant="outline"
          size="sm"
          className="text-xs px-3 py-1 h-7"
        >
          Next
        </Button>
      </div>
    </div>
  );
} 