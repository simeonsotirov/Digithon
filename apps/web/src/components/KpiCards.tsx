import { Skeleton } from "@/components/ui/skeleton";

type Kpis = {
  total_raw_rows: number;
  total_normalized_rows: number;
  quality_issue_count: number;
  reorder_count: number;
  stockout_count: number;
};

type Props = { kpis: Kpis | undefined; loading?: boolean };

const CARDS = [
  {
    key: "total_raw_rows" as const,
    label: "Rows Ingested",
    context: "Total parsed source rows",
    accent: "border-cyan-400/25 from-slate-900 to-cyan-950/30",
    metric: "text-cyan-300",
    dot: "bg-cyan-400",
  },
  {
    key: "total_normalized_rows" as const,
    label: "Rows Normalized",
    context: "Canonical records stored",
    accent: "border-violet-400/25 from-slate-900 to-violet-950/30",
    metric: "text-violet-300",
    dot: "bg-violet-400",
  },
  {
    key: "quality_issue_count" as const,
    label: "Quality Issues",
    context: "Corrections & warnings",
    accent: "border-amber-400/25 from-slate-900 to-amber-950/30",
    metric: "text-amber-300",
    dot: "bg-amber-400",
  },
  {
    key: "reorder_count" as const,
    label: "Reorder Signals",
    context: "Products below threshold",
    accent: "border-orange-400/25 from-slate-900 to-orange-950/30",
    metric: "text-orange-300",
    dot: "bg-orange-400",
  },
  {
    key: "stockout_count" as const,
    label: "Stockout Risk",
    context: "Critical stock warnings",
    accent: "border-red-400/25 from-slate-900 to-red-950/30",
    metric: "text-red-300",
    dot: "bg-red-400",
  },
] as const;

export function KpiCards({ kpis, loading }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {CARDS.map(({ key, label, context, accent, metric, dot }) => (
        <div
          key={key}
          className={`rounded-2xl border bg-gradient-to-br ${accent} p-5 shadow-sm`}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className={`w-2 h-2 rounded-full ${dot}`} />
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
              {label}
            </p>
          </div>
          {loading ? (
            <Skeleton className="h-9 w-20 mb-1 bg-slate-800" />
          ) : (
            <p className={`text-3xl font-semibold tabular-nums ${metric}`}>
              {kpis?.[key] ?? 0}
            </p>
          )}
          <p className="text-xs text-slate-500 mt-1">{context}</p>
        </div>
      ))}
    </div>
  );
}
