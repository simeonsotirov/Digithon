import type { NormalizedRecord } from "../api";
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

const SIGNAL_CLASSES: Record<NormalizedRecord["reorder_signal"], string> = {
  ok:       "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
  watch:    "bg-amber-400/15 text-amber-300 border-amber-400/30",
  reorder:  "bg-orange-400/15 text-orange-300 border-orange-400/30",
  stockout: "bg-red-400/15 text-red-300 border-red-400/30",
};

type Props = { records: NormalizedRecord[]; loading?: boolean };

export function RecordsTable({ records, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full bg-slate-800" />
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm font-semibold text-slate-300">No records yet</p>
        <p className="text-xs text-slate-500 mt-1">Run an ingest to normalize your data.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[420px]">
      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-xs uppercase tracking-[0.12em] text-slate-400">Store</TableHead>
              <TableHead className="text-xs uppercase tracking-[0.12em] text-slate-400">Product</TableHead>
              <TableHead className="text-xs uppercase tracking-[0.12em] text-slate-400 text-right">Qty</TableHead>
              <TableHead className="text-xs uppercase tracking-[0.12em] text-slate-400 text-right">Price</TableHead>
              <TableHead className="text-xs uppercase tracking-[0.12em] text-slate-400">Date</TableHead>
              <TableHead className="text-xs uppercase tracking-[0.12em] text-slate-400">Signal</TableHead>
              <TableHead className="text-xs uppercase tracking-[0.12em] text-slate-400">Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow
                key={record.id}
                className="border-slate-800/60 hover:bg-cyan-400/5 transition-colors"
              >
                <TableCell className="font-medium text-slate-100 text-sm">{record.store_name}</TableCell>
                <TableCell className="font-medium text-slate-100 text-sm">{record.product_name}</TableCell>
                <TableCell className="text-right tabular-nums text-slate-300 text-sm">{record.quantity}</TableCell>
                <TableCell className="text-right tabular-nums text-slate-300 text-sm">
                  ${Number(record.price).toFixed(2)}
                </TableCell>
                <TableCell className="text-slate-400 text-sm tabular-nums">{record.sale_date}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${SIGNAL_CLASSES[record.reorder_signal]}`}>
                    {record.reorder_signal}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-slate-500 max-w-[160px] truncate">
                  {record.quality_notes.join(", ") || "clean"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </ScrollArea>
  );
}
