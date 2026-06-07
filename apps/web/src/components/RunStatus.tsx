import type { Run } from "../api";
import { Badge } from "./ui/badge";

type Props = { run: Run | undefined };

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
