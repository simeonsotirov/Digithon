import type { InventoryPrediction } from "../api";
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

const RISK_CLASSES: Record<InventoryPrediction["risk_level"], string> = {
  ok:       "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
  watch:    "bg-amber-400/15 text-amber-300 border-amber-400/30",
  reorder:  "bg-orange-400/15 text-orange-300 border-orange-400/30",
  stockout: "bg-red-400/15 text-red-300 border-red-400/30",
};

function formatNote(note: string) {
  return note.replace(/_/g, " ");
}

type Props = { predictions: InventoryPrediction[]; loading?: boolean };

export function PredictionTable({ predictions, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full bg-slate-800" />
        ))}
      </div>
    );
  }

  if (predictions.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm font-semibold text-slate-300">No predictions yet</p>
        <p className="text-xs text-slate-500 mt-1">
          Run an ingest to generate event-aware stock needs.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <ScrollArea className="h-[420px]">
        <Table className="min-w-[820px]">
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-xs uppercase tracking-[0.12em] text-slate-400">Store</TableHead>
              <TableHead className="text-xs uppercase tracking-[0.12em] text-slate-400">Product</TableHead>
              <TableHead className="text-xs uppercase tracking-[0.12em] text-slate-400">Forecast</TableHead>
              <TableHead className="text-xs uppercase tracking-[0.12em] text-slate-400 text-right">Baseline</TableHead>
              <TableHead className="text-xs uppercase tracking-[0.12em] text-slate-400 text-right">Predicted</TableHead>
              <TableHead className="text-xs uppercase tracking-[0.12em] text-slate-400 text-right">Uplift</TableHead>
              <TableHead className="text-xs uppercase tracking-[0.12em] text-slate-400">Risk</TableHead>
              <TableHead className="text-xs uppercase tracking-[0.12em] text-slate-400">Event</TableHead>
              <TableHead className="text-xs uppercase tracking-[0.12em] text-slate-400">Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {predictions.map((p) => (
              <TableRow
                key={p.id}
                className="border-slate-800/60 hover:bg-cyan-400/5 transition-colors"
              >
                <TableCell className="font-medium text-slate-100 text-sm">{p.store_name}</TableCell>
                <TableCell className="font-medium text-slate-100 text-sm">{p.product_name}</TableCell>
                <TableCell className="text-slate-400 text-sm tabular-nums">{p.forecast_date}</TableCell>
                <TableCell className="text-right tabular-nums text-slate-400 text-sm">{p.baseline_quantity}</TableCell>
                <TableCell className="text-right tabular-nums text-cyan-300 font-semibold text-sm">{p.predicted_quantity}</TableCell>
                <TableCell className="text-right tabular-nums text-fuchsia-300 text-sm">
                  {p.event_uplift > 0 ? `+${p.event_uplift}` : "—"}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${RISK_CLASSES[p.risk_level]}`}>
                    {p.risk_level}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-fuchsia-300/80">
                  {p.related_event_name ?? "—"}
                </TableCell>
                <TableCell className="text-xs text-slate-500 max-w-[180px] truncate" title={p.explanation_notes.map(formatNote).join(", ")}>
                  {p.explanation_notes.map(formatNote).join(", ") || "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
