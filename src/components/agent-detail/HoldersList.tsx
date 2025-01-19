import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function HoldersList() {
  const holders = Array(11).fill(null).map((_, index) => ({
    id: index + 1,
    address: "0x4cof...6d4be5",
    percentage: "14.454%",
  }));

  return (
    <div>
      <div className="text-sm text-gray-500 mb-4">
        Holder Distribution (119,022 holders)
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">#</TableHead>
            <TableHead>Address</TableHead>
            <TableHead className="text-right">Percentage</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {holders.map((holder) => (
            <TableRow key={holder.id}>
              <TableCell className="font-medium">{holder.id}</TableCell>
              <TableCell>{holder.address}</TableCell>
              <TableCell className="text-right">{holder.percentage}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 