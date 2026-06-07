import type { Event } from "../api";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_VARIANT: Record<Event["status"], "default" | "secondary" | "destructive" | "outline"> = {
  started: "secondary",
  succeeded: "default",
  failed: "destructive",
  skipped: "outline",
};

type Props = { events: Event[]; loading?: boolean };

export function EventsTimeline({ events, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground mt-3">No events yet.</p>;
  }

  return (
    <ScrollArea className="h-[420px]">
      <ol className="space-y-3">
        {events.map((event) => (
          <li key={event.id} className="border-l-4 border-[#3B82F6] pl-3 grid gap-1">
            <time className="text-xs text-muted-foreground">
              {new Date(event.created_at).toLocaleTimeString()}
            </time>
            <div className="flex items-center gap-2">
              <Badge variant={STATUS_VARIANT[event.status]}>{event.status}</Badge>
              <span className="font-semibold text-sm">{event.step_name}</span>
            </div>
            <span className="text-xs text-muted-foreground">{event.event_type}</span>
          </li>
        ))}
      </ol>
    </ScrollArea>
  );
}
