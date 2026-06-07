import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RowsByStore, RecentRuns, WorkflowEventCounts } from "./components/AnalyticsPanels";
import { EventsTimeline } from "./components/EventsTimeline";
import { IngestPanel } from "./components/IngestPanel";
import { KpiCards } from "./components/KpiCards";
import { LandingPage } from "./components/LandingPage";
import { PredictionKpiCards } from "./components/PredictionKpiCards";
import { PredictionTable } from "./components/PredictionTable";
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

  const events =
    selectedRun !== "all" ? (eventsQuery.data ?? []) : (data?.events ?? []);
  const eventsLoading = selectedRun !== "all" ? eventsQuery.isLoading : loading;

  return (
    <div className="min-h-screen bg-background">

      {/* Top header bar */}
      <header className="sticky top-0 z-10 border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center shrink-0">
              <span className="text-primary font-black text-sm">Q</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground leading-none">SignalOps Inventory</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Retail Inventory Intelligence Â· Quant @ Digithon 2026</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <RunStatus run={latestRun} />
            <IngestPanel />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {dashboard.isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>API unavailable</AlertTitle>
            <AlertDescription>
              Start the backend with <code className="font-mono">poetry run api</code>.
            </AlertDescription>
          </Alert>
        )}

        {/* KPI stat cards â€” shadcnuikit Stat Card 1 pattern */}
        <KpiCards kpis={data?.kpis} loading={loading} />

        {/* Prediction KPI band */}
        <PredictionKpiCards
          predictions={predictions.data ?? []}
          calendarEvents={calendarEvents.data ?? []}
          loading={predictions.isLoading || calendarEvents.isLoading}
        />

        <Separator />

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

        {/* Main grid â€” wide left, narrow right */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_0.8fr] gap-6">

          {/* Left column */}
          <div className="space-y-6 min-w-0">
            <Card className="rounded-xl border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground uppercase tracking-[0.12em]">
                  Normalized Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RecordsTable records={records} loading={loading} />
              </CardContent>
            </Card>

            <Card className="rounded-xl border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground uppercase tracking-[0.12em]">
                  Predicted Stock Needs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PredictionTable
                  predictions={predictions.data ?? []}
                  loading={predictions.isLoading}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <Card className="rounded-xl border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground uppercase tracking-[0.12em]">
                  Workflow Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EventsTimeline events={events} loading={eventsLoading} />
              </CardContent>
            </Card>

            <Card className="rounded-xl border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground uppercase tracking-[0.12em]">
                  Upcoming Demand Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UpcomingEventsPanel
                  events={calendarEvents.data ?? []}
                  loading={calendarEvents.isLoading}
                />
              </CardContent>
            </Card>
          </div>

        </div>

        {/* Analytics row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="rounded-xl border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground uppercase tracking-[0.12em]">
                Rows by Store
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RowsByStore
                records={data?.records ?? []}
                stores={data?.stores ?? []}
                loading={loading}
              />
            </CardContent>
          </Card>

          <Card className="rounded-xl border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground uppercase tracking-[0.12em]">
                Recent Runs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RecentRuns runs={data?.runs ?? []} loading={loading} />
            </CardContent>
          </Card>

          <Card className="rounded-xl border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground uppercase tracking-[0.12em]">
                Events by Step
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WorkflowEventCounts events={data?.events ?? []} loading={loading} />
            </CardContent>
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
