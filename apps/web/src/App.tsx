import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EventsTimeline } from "./components/EventsTimeline";
import { IngestPanel } from "./components/IngestPanel";
import { KpiCards } from "./components/KpiCards";
import { LandingPage } from "./components/LandingPage";
import { PredictionsTable } from "./components/PredictionsTable";
import { RecordsTable } from "./components/RecordsTable";
import { RunStatus } from "./components/RunStatus";
import { StoreFilter } from "./components/StoreFilter";
import { UpcomingEventsPanel } from "./components/UpcomingEventsPanel";
import { useCalendarEvents, useDashboard, useEvents, usePredictions } from "./queries";
import { useUiStore } from "./store";

function Dashboard() {
  const { selectedStore, selectedRun, selectedRisk, setSelectedStore, setSelectedRun, setSelectedRisk } = useUiStore();
  const dashboard = useDashboard();
  const eventsQuery = useEvents(selectedRun === "all" ? null : selectedRun);
  const calendarEvents = useCalendarEvents();
  const predictions = usePredictions({
    store_id: selectedStore !== "all" ? selectedStore : undefined,
    risk_level: selectedRisk !== "all" ? selectedRisk : undefined,
  });

  const data = dashboard.data;
  const loading = dashboard.isLoading;
  const latestRun = data?.runs[0];

  const records = (data?.records ?? []).filter((record) => {
    const storeMatches = selectedStore === "all" || record.store_id === selectedStore;
    const runMatches = selectedRun === "all" || record.run_id === selectedRun;
    return storeMatches && runMatches;
  });

  const predictions = (data?.predictions ?? []).filter((prediction) => {
    const storeMatches = selectedStore === "all" || prediction.store_id === selectedStore;
    const runMatches = selectedRun === "all" || prediction.run_id === selectedRun;
    return storeMatches && runMatches;
  });

  const events =
    selectedRun !== "all" ? (eventsQuery.data ?? []) : (data?.events ?? []);
  const eventsLoading = selectedRun !== "all" ? eventsQuery.isLoading : loading;

  return (
    <div className="min-h-screen bg-slate-950">
      <main className="max-w-7xl mx-auto px-4 sm:px-5 py-6 sm:py-8 space-y-5 sm:space-y-6">

        {/* Hero / status strip */}
        <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 rounded-2xl border border-cyan-400/15 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 shadow-lg shadow-cyan-950/20 p-6 sm:p-8">
          <div>
            <p className="text-cyan-400 text-xs font-black uppercase tracking-[0.18em] mb-2">
              Retail Inventory Intelligence
            </p>
            <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-slate-50 mb-2">
              SignalOps Inventory
            </h1>
            <p className="text-slate-400 text-sm max-w-lg">
              Upload messy retail exports, normalize them, and surface event-aware stock predictions.
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <IngestPanel />
          </div>
        </section>

        {dashboard.isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>API unavailable</AlertTitle>
            <AlertDescription>
              Start the backend with <code className="font-mono">poetry run api</code>.
            </AlertDescription>
          </Alert>
        )}

        <RunStatus run={latestRun} />

        {/* Ingest KPI band */}
        <KpiCards kpis={data?.kpis} loading={loading} />

        {/* Prediction KPI band */}
        <PredictionKpiCards
          predictions={predictions.data ?? []}
          calendarEvents={calendarEvents.data ?? []}
          loading={predictions.isLoading || calendarEvents.isLoading}
        />

        <Separator className="border-slate-800" />

        <StoreFilter
          stores={data?.stores ?? []}
          runs={data?.runs ?? []}
          selectedStore={selectedStore}
          selectedRun={selectedRun}
          selectedRisk={selectedRisk}
          onStoreChange={setSelectedStore}
          onRunChange={setSelectedRun}
          onRiskChange={setSelectedRisk}
        />

        <Card>
          <CardHeader>
            <CardTitle>Event-Aware Inventory Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <PredictionsTable predictions={predictions} loading={loading} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_0.8fr] gap-6">
          <Card>
            <CardHeader><CardTitle>Normalized Records</CardTitle></CardHeader>
            <CardContent><RecordsTable records={records} loading={loading} /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Workflow Events</CardTitle></CardHeader>
            <CardContent><EventsTimeline events={events} loading={eventsLoading} /></CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function App() {
  const [view, setView] = useState<"landing" | "dashboard">("landing");

  if (view === "landing") {
    return <LandingPage onLaunch={() => setView("dashboard")} />;
  }

  return <Dashboard />;
}

export default App;
