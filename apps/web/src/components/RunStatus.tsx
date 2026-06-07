import type { Run } from "../api";

type Props = { run: Run | undefined };

export function RunStatus({ run }: Props) {
  if (!run) return null;

  return (
    <div className={`run-status run-status--${run.status}`}>
      <span>Latest run</span>
      <strong>{run.status}</strong>
      <code>{run.id.slice(0, 8)}</code>
      {run.error_message && (
        <span className="run-error">{run.error_message}</span>
      )}
    </div>
  );
}
