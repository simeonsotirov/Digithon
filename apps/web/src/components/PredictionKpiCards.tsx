import type { CalendarEvent, InventoryPrediction } from "../api";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  predictions: InventoryPrediction[];
  calendarEvents: CalendarEvent[];
  loading?: boolean;
};

export function PredictionKpiCards({ predictions, calendarEvents, loading }: Props) {
  const predictedReorders = predictions.filter((p) => p.risk_level === "reorder").length;
  const predictedStockouts = predictions.filter((p) => p.risk_level === "stockout").length;
  const upcomingEvents = calendarEvents.length;
  const highImpactEvents = calendarEvents.filter((e) => e.impact_score >= 0.7).length;

  const CARDS = [
    {
      label: "Predicted Reorders",
      value: predictedReorders,
      context: "Next 30 days",
      accent: "border-fuchsia-400/25 from-slate-900 to-fuchsia-950/30",
      metric: "text-fuchsia-300",
      dot: "bg-fuchsia-400",
    },
    {
      label: "Predicted Stockouts",
      value: predictedStockouts,
      context: "Critical risk items",
      accent: "border-red-400/25 from-slate-900 to-red-950/30",
      metric: "text-red-300",
      dot: "bg-red-400",
    },
    {
      label: "Upcoming Events",
      value: upcomingEvents,
      context: "Demand-driving calendar",
      accent: "border-cyan-400/25 from-slate-900 to-cyan-950/30",
      metric: "text-cyan-300",
      dot: "bg-cyan-400",
    },
    {
      label: "High Impact Events",
      value: highImpactEvents,
      context: "Score ≥ 0.70",
      accent: "border-orange-400/25 from-slate-900 to-orange-950/30",
      metric: "text-orange-300",
      dot: "bg-orange-400",
    },
  ] as const;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {CARDS.map(({ label, value, context, accent, metric, dot }) => (
        <div
          key={label}
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
            <p className={`text-3xl font-semibold tabular-nums ${metric}`}>{value}</p>
          )}
          <p className="text-xs text-slate-500 mt-1">{context}</p>
        </div>
      ))}
    </div>
  );
}
