import type { Event, NormalizedRecord, Run, Store } from "../api";
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

/* ── Rows by Store ─────────────────────────────────────────────────────── */

type RowsByStoreProps = {
  records: NormalizedRecord[];
  stores: Store[];
  loading?: boolean;
};

export function RowsByStore({ records, stores, loading }: RowsByStoreProps) {
  const counts = stores.map((store) => ({
    name: store.display_name,
    total: records.filter((r) => r.store_id === store.id).length,
    reorders: records.filter((r) => r.store_id === store.id && (r.reorder_signal === "reorder" || r.reorder_signal === "stockout")).length,
  })).sort((a, b) => b.total - a.total);

  return (
    <div>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full bg-slate-800" />
          ))}
        </div>
      ) : counts.length === 0 ? (
        <p className="text-xs text-slate-500 py-4 text-center">No store data yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-xs uppercase tracking-[0.12em] text-slate-400">Store</TableHead>
              <TableHead className="text-xs uppercase tracking-[0.12em] text-slate-400 text-right">Rows</TableHead>
              <TableHead className="text-xs uppercase tracking-[0.12em] text-slate-400 text-right">At risk</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {counts.map(({ name, total, reorders }) => (
              <TableRow key={name} className="border-slate-800/60 hover:bg-cyan-400/5 transition-colors">
                <TableCell className="text-sm font-medium text-slate-100">{name}</TableCell>
                <TableCell className="text-right tabular-nums text-slate-300 text-sm">{total}</TableCell>
                <TableCell className="text-right tabular-nums text-sm">
                  {reorders > 0
                    ? <span className="text-orange-300 font-semibold">{reorders}</span>
                    : <span className="text-slate-500">—</span>
                  }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

/* ── Recent Runs ───────────────────────────────────────────────────────── */

const RUN_STATUS_CLASSES: Record<Run["status"], string> = {
  queued:    "bg-amber-400/15 text-amber-300 border-amber-400/30",
  running:   "bg-cyan-400/15 text-cyan-300 border-cyan-400/30",
  completed: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
  failed:    "bg-red-400/15 text-red-300 border-red-400/30",
};

type RecentRunsProps = { runs: Run[]; loading?: boolean };

export function RecentRuns({ runs, loading }: RecentRunsProps) {
  const recent = runs.slice(0, 8);

  return (
    <ScrollArea className="h-[220px]">
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full bg-slate-800" />
          ))}
        </div>
      ) : recent.length === 0 ? (
        <p className="text-xs text-slate-500 py-4 text-center">No runs yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-xs uppercase tracking-[0.12em] text-slate-400">Run ID</TableHead>
              <TableHead className="text-xs uppercase tracking-[0.12em] text-slate-400">Status</TableHead>
              <TableHead className="text-xs uppercase tracking-[0.12em] text-slate-400">Source</TableHead>
              <TableHead className="text-xs uppercase tracking-[0.12em] text-slate-400">Started</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recent.map((run) => (
              <TableRow key={run.id} className="border-slate-800/60 hover:bg-cyan-400/5 transition-colors">
                <TableCell className="font-mono text-xs text-slate-400">{run.id.slice(0, 8)}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${RUN_STATUS_CLASSES[run.status]}`}>
                    {run.status}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-slate-400 max-w-[120px] truncate">
                  {run.source_filename}
                </TableCell>
                <TableCell className="text-xs text-slate-500 tabular-nums">
                  {run.started_at ? new Date(run.started_at).toLocaleTimeString() : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </ScrollArea>
  );
}

/* ── Workflow Event Counts ─────────────────────────────────────────────── */

const EVENT_STATUS_CLASSES = {
  succeeded: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
  started:   "bg-cyan-400/15 text-cyan-300 border-cyan-400/30",
  failed:    "bg-red-400/15 text-red-300 border-red-400/30",
  skipped:   "bg-slate-400/15 text-slate-300 border-slate-400/30",
} as const;

type EventCountsProps = { events: Event[]; loading?: boolean };

export function WorkflowEventCounts({ events, loading }: EventCountsProps) {
  const byStep = events.reduce<Record<string, Record<string, number>>>((acc, e) => {
    const step = e.step_name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    acc[step] ??= {};
    acc[step][e.status] = (acc[step][e.status] ?? 0) + 1;
    return acc;
  }, {});

  const rows = Object.entries(byStep);

  return (
    <ScrollArea className="h-[220px]">
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full bg-slate-800" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-xs text-slate-500 py-4 text-center">No events yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-xs uppercase tracking-[0.12em] text-slate-400">Step</TableHead>
              {(["succeeded", "started", "failed", "skipped"] as const).map((s) => (
                <TableHead key={s} className="text-xs uppercase tracking-[0.12em] text-slate-400 text-right">{s}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(([step, counts]) => (
              <TableRow key={step} className="border-slate-800/60 hover:bg-cyan-400/5 transition-colors">
                <TableCell className="text-xs font-medium text-slate-200">{step}</TableCell>
                {(["succeeded", "started", "failed", "skipped"] as const).map((s) => (
                  <TableCell key={s} className="text-right">
                    {counts[s] ? (
                      <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-xs font-semibold tabular-nums ${EVENT_STATUS_CLASSES[s]}`}>
                        {counts[s]}
                      </span>
                    ) : (
                      <span className="text-slate-700 text-xs">—</span>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </ScrollArea>
  );
}