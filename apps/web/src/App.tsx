import { useDashboard, useIngestMutation } from "./queries";
import { useUiStore } from "./store";

function App() {
  const { selectedStore, selectedRun, setSelectedStore, setSelectedRun } = useUiStore();
  const dashboard = useDashboard();
  const ingest = useIngestMutation();

  const data = dashboard.data;
  const latestRun = data?.runs[0];

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

      {dashboard.isError && (
        <p className="error">API unavailable — start the backend with <code>poetry run api</code>.</p>
      )}
      {dashboard.isLoading && <p className="loading">Connecting to API…</p>}

      {latestRun && (
        <div className={`run-status run-status--${latestRun.status}`}>
          <span>Latest run</span>
          <strong>{latestRun.status}</strong>
          <code>{latestRun.id.slice(0, 8)}</code>
          {latestRun.error_message && (
            <span className="run-error">{latestRun.error_message}</span>
          )}
        </div>
      )}

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
          <select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)}>
            <option value="all">All stores</option>
            {(data?.stores ?? []).map((store) => (
              <option key={store.id} value={store.id}>{store.display_name}</option>
            ))}
          </select>
        </label>
        <label>
          Run
          <select value={selectedRun} onChange={(e) => setSelectedRun(e.target.value)}>
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
          {records.length === 0 ? (
            <p className="empty">No records yet — trigger an ingest run above.</p>
          ) : (
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
                      <td>
                        <span className={`signal ${record.reorder_signal}`}>
                          {record.reorder_signal}
                        </span>
                      </td>
                      <td>{record.quality_notes.join(", ") || "clean"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="panel timeline-panel">
          <h2>Workflow Events</h2>
          {events.length === 0 ? (
            <p className="empty">No events yet.</p>
          ) : (
            <ol className="timeline">
              {events.map((event) => (
                <li key={event.id}>
                  <time>{new Date(event.created_at).toLocaleTimeString()}</time>
                  <span className={event.status}>{event.status}</span>
                  <strong>{event.step_name}</strong>
                  <small>{event.event_type}</small>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </main>
  );
}

export default App;
