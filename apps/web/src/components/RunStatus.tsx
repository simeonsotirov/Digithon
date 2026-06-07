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
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm">
      <span className="text-slate-400 font-semibold text-xs uppercase tracking-wide">Latest run</span>

      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASSES[run.status]}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[run.status]}`} />
        {run.status}
      </span>

      <code className="text-xs text-slate-500 font-mono">{run.id.slice(0, 8)}</code>

      {run.workflow_id && (
        <code className="text-xs text-slate-600 font-mono">wf {run.workflow_id.slice(0, 8)}</code>
      )}

      {run.started_at && (
        <span className="text-xs text-slate-500">
          {new Date(run.started_at).toLocaleTimeString()}
        </span>
      )}

      {run.error_message && (
        <span className="text-red-400 text-xs font-semibold ml-auto">{run.error_message}</span>
      )}
    </div>
  );
}
