import type { CalendarEvent } from "../api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

const EVENT_TYPE_CLASSES: Record<CalendarEvent["event_type"], string> = {
  holiday:     "bg-fuchsia-400/15 text-fuchsia-300 border-fuchsia-400/30",
  sports:      "bg-cyan-400/15 text-cyan-300 border-cyan-400/30",
  shopping:    "bg-violet-400/15 text-violet-300 border-violet-400/30",
  seasonal:    "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
  local_event: "bg-orange-400/15 text-orange-300 border-orange-400/30",
};

function impactColor(score: number) {
  if (score >= 0.7) return "bg-fuchsia-400/20 text-fuchsia-300";
  if (score >= 0.4) return "bg-amber-400/20 text-amber-300";
  return "bg-slate-400/20 text-slate-400";
}

function formatDateRange(starts: string, ends: string) {
  const s = new Date(starts);
  const e = new Date(ends);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return starts === ends ? fmt(s) : `${fmt(s)} – ${fmt(e)}`;
}

type Props = { events: CalendarEvent[]; loading?: boolean };

export function UpcomingEventsPanel({ events, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full bg-slate-800" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm font-semibold text-slate-300">No upcoming events</p>
        <p className="text-xs text-slate-500 mt-1">Calendar events drive stock predictions.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[340px]">
      <div className="space-y-2 pr-1">
        {events.map((event) => (
          <div
            key={event.id}
            className="rounded-xl border border-fuchsia-400/15 bg-gradient-to-br from-slate-900 to-fuchsia-950/20 p-3 space-y-1.5"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-slate-100 leading-tight">{event.event_name}</p>
              <span className={`shrink-0 text-xs font-bold rounded-full px-2 py-0.5 tabular-nums ${impactColor(event.impact_score)}`}>
                {event.impact_score.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${EVENT_TYPE_CLASSES[event.event_type]}`}>
                {event.event_type.replace("_", " ")}
              </span>
              <span className="text-xs text-slate-500 tabular-nums">
                {formatDateRange(event.starts_on, event.ends_on)}
              </span>
            </div>

            {event.product_tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {event.product_tags.slice(0, 4).map((tag) => (
                  <span key={tag} className="text-xs text-slate-500 bg-slate-800 rounded px-1.5 py-0.5">
                    {tag}
                  </span>
                ))}
                {event.product_tags.length > 4 && (
                  <span className="text-xs text-slate-600">+{event.product_tags.length - 4}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
