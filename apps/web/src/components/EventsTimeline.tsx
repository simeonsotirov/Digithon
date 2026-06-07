import type { Event } from "../api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_DOT: Record<Event["status"], string> = {
  started:   "bg-primary animate-pulse",
  succeeded: "bg-emerald-500",
  failed:    "bg-red-500",
  skipped:   "bg-muted-foreground",
};

const STATUS_LABEL: Record<Event["status"], string> = {
  started:   "bg-primary/10 text-primary border-primary/20",
  succeeded: "bg-emerald-100 text-emerald-800 border-emerald-200",
  failed:    "bg-red-100 text-red-800 border-red-200",
  skipped:   "bg-muted text-muted-foreground border-border",
};

const STEP_LABELS: Record<string, string> = {
  claim_run:                   "Claim Run",
  resolve_source:              "Resolve Source",
  fetch_file:                  "Fetch File",
  parse_tabular_data:          "Parse File",
  store_raw_rows:              "Store Raw Rows",
  normalize_python:            "Normalize Records",
  persist_normalized_rows:     "Save Normalized Rows",
  generate_inventory_predictions: "Generate Predictions",
  emit_summary_events:         "Emit Summary",
  mark_run_complete:           "Complete Run",
};

function formatStep(step: string) {
  return STEP_LABELS[step] ?? step.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

type Props = { events: Event[]; loading?: boolean };

export function EventsTimeline({ events, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="w-2.5 h-2.5 rounded-full mt-1 shrink-0 bg-slate-800" />
            <Skeleton className="h-12 flex-1 bg-slate-800" />
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm font-semibold text-foreground">No events yet</p>
        <p className="text-xs text-muted-foreground mt-1">Events appear as the workflow runs.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[420px]">
      <ol className="relative border-l border-border ml-1.5 space-y-4 pr-2">
        {events.map((event) => (
          <li key={event.id} className="pl-5 relative">
            {/* Status dot on the rail */}
            <span className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full ${STATUS_DOT[event.status]}`} />

            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <span className="text-sm font-semibold text-foreground">
                {formatStep(event.step_name)}
              </span>
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_LABEL[event.status]}`}>
                {event.status}
              </span>
            </div>

            <p className="text-xs text-muted-foreground">{event.event_type}</p>

            <time className="text-xs text-muted-foreground font-mono">
              {new Date(event.created_at).toLocaleTimeString()}
            </time>
          </li>
        ))}
      </ol>
    </ScrollArea>
  );
}
