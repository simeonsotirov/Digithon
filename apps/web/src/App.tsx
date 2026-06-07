import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
  const loading = dashboard.isLoading;
  const latestRun = data?.runs[0];

  const records = (data?.records ?? []).filter((record) => {
    const storeMatches = selectedStore === "all" || record.store_id === selectedStore;
    const runMatches = selectedRun === "all" || record.run_id === selectedRun;
    return storeMatches && runMatches;
  });

  const events =
    selectedRun !== "all"
      ? (eventsQuery.data ?? [])
      : (data?.events ?? []);

  const eventsLoading = selectedRun !== "all" ? eventsQuery.isLoading : loading;

  return (
    <div className="min-h-screen bg-[#f5f1e8]">
      <main className="max-w-6xl mx-auto px-5 py-8 space-y-6">

        {/* Hero */}
        <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-[#14213d] text-white rounded-3xl p-8 shadow-2xl">
          <div>
            <p className="text-[#fca311] text-xs font-black uppercase tracking-widest mb-2">
              Messy CSV to durable inventory truth
            </p>
            <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-3">
              Digithon Inventory Normalizer
            </h1>
            <p className="text-white/70 max-w-lg">
              Trigger an ingest run, let the worker normalize chaotic retail exports, and watch the
              persisted workflow events explain every step.
            </p>
          </div>
          <IngestPanel />
        </section>

        {/* API error */}
        {dashboard.isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>API unavailable</AlertTitle>
            <AlertDescription>
              Start the backend with <code className="font-mono">poetry run api</code>.
            </AlertDescription>
          </Alert>
        )}

        {/* Run status */}
        <RunStatus run={latestRun} />

        {/* KPIs */}
        <KpiCards kpis={data?.kpis} loading={loading} />

        <Separator />

        {/* Filters */}
        <StoreFilter
          stores={data?.stores ?? []}
          runs={data?.runs ?? []}
          selectedStore={selectedStore}
          selectedRun={selectedRun}
          onStoreChange={setSelectedStore}
          onRunChange={setSelectedRun}
        />

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_0.8fr] gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Normalized Records</CardTitle>
            </CardHeader>
            <CardContent>
              <RecordsTable records={records} loading={loading} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workflow Events</CardTitle>
            </CardHeader>
            <CardContent>
              <EventsTimeline events={events} loading={eventsLoading} />
            </CardContent>
          </Card>
        </div>

      </main>
    </div>
  );
}

export default App;
