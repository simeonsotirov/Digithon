import { useIngestMutation } from "../queries";

export function IngestPanel() {
  const ingest = useIngestMutation();

  return (
    <div className="ingest-panel">
      <button disabled={ingest.isPending} onClick={() => ingest.mutate()}>
        {ingest.isPending ? "Queueing…" : "Ingest messy CSV"}
      </button>
      {ingest.isError && (
        <p className="error">Failed to queue run. Is the API running?</p>
      )}
    </div>
  );
}
