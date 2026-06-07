import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createIngest, getDashboard } from "./api";
import { useUiStore } from "./store";

function App() {
  const queryClient = useQueryClient();
  const { selectedStore, selectedRun, setSelectedStore, setSelectedRun } = useUiStore();
  const dashboard = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    refetchInterval: 3000,
  });
  const ingest = useMutation({
    mutationFn: createIngest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
  });

  const data = dashboard.data;
  const records = (data?.records ?? []).filter((record) => {
    const storeMatches = selectedStore === "all" || record.store_id === selectedStore;
    const runMatches = selectedRun === "all" || record.run_id === selectedRun;
    return storeMatches && runMatches;
  });
  const events = (data?.events ?? []).filter(
    (event) => selectedRun === "all" || event.run_id === selectedRun,
  );

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Messy CSV to durable inventory truth</p>
          <h1>Digithon Inventory Normalizer</h1>
          <p>
            Trigger an ingest run, let the worker normalize chaotic retail exports, and watch the
            persisted workflow events explain every step.
          </p>
        </div>
        <button disabled={ingest.isPending} onClick={() => ingest.mutate()}>
          {ingest.isPending ? "Queueing..." : "Ingest messy CSV"}
        </button>
      </section>

      {dashboard.isError ? <p className="error">API unavailable. Start `poetry run api`.</p> : null}

      <section className="kpis">
        <article><span>Raw rows</span><strong>{data?.kpis.total_raw_rows ?? 0}</strong></article>
        <article><span>Normalized</span><strong>{data?.kpis.total_normalized_rows ?? 0}</strong></article>
        <article><span>Quality fixes</span><strong>{data?.kpis.quality_issue_count ?? 0}</strong></article>
        <article><span>Reorders</span><strong>{data?.kpis.reorder_count ?? 0}</strong></article>
        <article><span>Stockouts</span><strong>{data?.kpis.stockout_count ?? 0}</strong></article>
      </section>

      <section className="controls">
        <label>
          Store
          <select value={selectedStore} onChange={(event) => setSelectedStore(event.target.value)}>
            <option value="all">All stores</option>
            {(data?.stores ?? []).map((store) => (
              <option key={store.id} value={store.id}>{store.display_name}</option>
            ))}
          </select>
        </label>
        <label>
          Run
          <select value={selectedRun} onChange={(event) => setSelectedRun(event.target.value)}>
            <option value="all">All runs</option>
            {(data?.runs ?? []).map((run) => (
              <option key={run.id} value={run.id}>{run.status} · {run.id.slice(0, 8)}</option>
            ))}
          </select>
        </label>
      </section>

      <section className="grid">
        <div className="panel table-panel">
          <h2>Normalized Records</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Store</th><th>Product</th><th>Qty</th><th>Price</th><th>Date</th><th>Signal</th><th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>{record.store_name}</td>
                    <td>{record.product_name}</td>
                    <td>{record.quantity}</td>
                    <td>${Number(record.price).toFixed(2)}</td>
                    <td>{record.sale_date}</td>
                    <td><span className={`signal ${record.reorder_signal}`}>{record.reorder_signal}</span></td>
                    <td>{record.quality_notes.join(", ") || "clean"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel timeline-panel">
          <h2>Workflow Events</h2>
          <ol className="timeline">
            {events.map((event) => (
              <li key={event.id}>
                <span className={event.status}>{event.status}</span>
                <strong>{event.step_name}</strong>
                <small>{event.event_type}</small>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}

export default App;
