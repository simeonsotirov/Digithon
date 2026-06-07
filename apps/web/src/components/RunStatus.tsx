import type { Run } from "../api";

type Props = { run: Run | undefined };

const STATUS_CLASSES: Record<Run["status"], string> = {
  queued:    "bg-amber-400/15 text-amber-300 border-amber-400/30",
  running:   "bg-cyan-400/15 text-cyan-300 border-cyan-400/30",
  completed: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
  failed:    "bg-red-400/15 text-red-300 border-red-400/30",
};

const STATUS_DOT: Record<Run["status"], string> = {
  queued:    "bg-amber-400",
  running:   "bg-cyan-400 animate-pulse",
  completed: "bg-emerald-400",
  failed:    "bg-red-400",
};

export function RunStatus({ run }: Props) {
  if (!run) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl border px-4 py-3 my-4 text-sm font-semibold">
      <span className="text-muted-foreground">Latest run</span>
      <Badge variant={STATUS_VARIANT[run.status]}>{run.status}</Badge>
      <code className="text-xs opacity-50">{run.id.slice(0, 8)}</code>
      {run.workflow_id && <code className="text-xs opacity-50">wf {run.workflow_id.slice(0, 8)}</code>}
      {run.error_message && (
        <span className="text-red-400 text-xs font-semibold ml-auto">{run.error_message}</span>
      )}
    </div>
  );
}
