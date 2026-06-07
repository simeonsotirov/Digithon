import { EventsTimeline } from "./components/EventsTimeline";
import { IngestPanel } from "./components/IngestPanel";
import { KpiCards } from "./components/KpiCards";
import { RecordsTable } from "./components/RecordsTable";
import { RunStatus } from "./components/RunStatus";
import { StoreFilter } from "./components/StoreFilter";
import { useDashboard, useEvents } from "./queries";
import { useUiStore } from "./store";

function App() {
  const { selectedStore, selectedRun, setSelectedStore, setSelectedRun } = useUiStore();
  const dashboard = useDashboard();
  const eventsQuery = useEvents(selectedRun === "all" ? null : selectedRun);

  const data = dashboard.data;
  const latestRun = data?.runs[0];

  const records = (data?.records ?? []).filter((record) => {
    const storeMatches = selectedStore === "all" || record.store_id === selectedStore;
    const runMatches = selectedRun === "all" || record.run_id === selectedRun;
    return storeMatches && runMatches;
  });

  // When a specific run is selected use the dedicated events query; otherwise use dashboard events
  const events =
    selectedRun !== "all"
      ? (eventsQuery.data ?? [])
      : (data?.events ?? []);

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
        <IngestPanel />
      </section>

      {dashboard.isError && (
        <p className="error">API unavailable — start the backend with <code>poetry run api</code>.</p>
      )}
      {dashboard.isLoading && <p className="loading">Connecting to API…</p>}

      <RunStatus run={latestRun} />

      <KpiCards kpis={data?.kpis} />

      <StoreFilter
        stores={data?.stores ?? []}
        runs={data?.runs ?? []}
        selectedStore={selectedStore}
        selectedRun={selectedRun}
        onStoreChange={setSelectedStore}
        onRunChange={setSelectedRun}
      />

      <section className="grid">
        <div className="panel table-panel">
          <h2>Normalized Records</h2>
          <RecordsTable records={records} />
        </div>

        <div className="panel timeline-panel">
          <h2>Workflow Events</h2>
          <EventsTimeline events={events} />
        </div>
      </section>
    </main>
  );
}

export default App;
