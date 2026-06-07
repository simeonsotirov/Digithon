import type { Run } from "../api";

type Props = { run: Run | undefined };

const STATUS_CLASSES: Record<Run["status"], string> = {
  queued:    "bg-amber-100 text-amber-800 border-amber-200",
  running:   "bg-primary/10 text-primary border-primary/20",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  failed:    "bg-red-100 text-red-800 border-red-200",
};

const STATUS_DOT: Record<Run["status"], string> = {
  queued:    "bg-amber-500",
  running:   "bg-primary animate-pulse",
  completed: "bg-emerald-500",
  failed:    "bg-red-500",
};

export function RunStatus({ run }: Props) {
  if (!run) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card px-3 py-2 text-sm">
      <span className="text-muted-foreground font-semibold text-xs uppercase tracking-wide">Latest run</span>

      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASSES[run.status]}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[run.status]}`} />
        {run.status}
      </span>

      <code className="text-xs text-muted-foreground font-mono">{run.id.slice(0, 8)}</code>

      {run.started_at && (
        <span className="text-xs text-muted-foreground">
          {new Date(run.started_at).toLocaleTimeString()}
        </span>
      )}

      {run.error_message && (
        <span className="text-red-600 text-xs font-semibold ml-auto">{run.error_message}</span>
      )}
    </div>
  );
}
