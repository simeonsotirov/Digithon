import type { NormalizedRecord } from "../api";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const SIGNAL_VARIANT: Record<NormalizedRecord["reorder_signal"], "default" | "secondary" | "destructive" | "outline"> = {
  ok: "secondary",
  watch: "outline",
  reorder: "default",
  stockout: "destructive",
};

type Props = { records: NormalizedRecord[]; loading?: boolean };

export function RecordsTable({ records, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return <p className="text-sm text-muted-foreground mt-3">No records yet — trigger an ingest run above.</p>;
  }

  return (
    <ScrollArea className="h-[420px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Store</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Signal</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell>{record.store_name}</TableCell>
              <TableCell>{record.product_name}</TableCell>
              <TableCell>{record.quantity}</TableCell>
              <TableCell>${Number(record.price).toFixed(2)}</TableCell>
              <TableCell>{record.sale_date}</TableCell>
              <TableCell>
                <Badge variant={SIGNAL_VARIANT[record.reorder_signal]}>
                  {record.reorder_signal}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {record.quality_notes.join(", ") || "clean"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
