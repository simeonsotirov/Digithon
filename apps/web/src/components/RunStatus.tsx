import type { Run } from "../api";
import { Badge } from "@/components/ui/badge";

type Props = { run: Run | undefined };

const STATUS_VARIANT: Record<Run["status"], "default" | "secondary" | "destructive" | "outline"> = {
  queued: "secondary",
  running: "outline",
  completed: "default",
  failed: "destructive",
};

export function RunStatus({ run }: Props) {
  if (!run) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl border px-4 py-3 my-4 text-sm font-semibold">
      <span className="text-muted-foreground">Latest run</span>
      <Badge variant={STATUS_VARIANT[run.status]}>{run.status}</Badge>
      <code className="text-xs opacity-50">{run.id.slice(0, 8)}</code>
      {run.error_message && (
        <span className="text-destructive text-xs">{run.error_message}</span>
      )}
    </div>
  );
}
