import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const now = new Date();
  const dateLabel = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="min-h-screen bg-background">

      {/* Sticky navbar */}
      <header className="sticky top-0 z-10 border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center shrink-0">
              <span className="text-primary font-black text-sm">Q</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground leading-none">SignalOps Inventory</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Retail Inventory Intelligence &middot; Quant @ Digithon 2026</p>
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

        {/* Finance Dashboard header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-foreground">Inventory Dashboard</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{dateLabel}</p>
          </div>
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
        </div>

        {/* Row 1: 4 KPI cards */}
        <KpiCards kpis={data?.kpis} loading={loading} />

        {/* Row 2: Prediction KPI band */}
        <PredictionKpiCards
          predictions={predictions.data ?? []}
          calendarEvents={calendarEvents.data ?? []}
          loading={predictions.isLoading || calendarEvents.isLoading}
        />

        {/* Row 3: 3-col middle — Finance: Income Sources | Monthly Chart | Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Income Sources -> Inventory by Store */}
          <Card className="rounded-xl border shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground">Inventory by Store</CardTitle>
                <span className="text-xs text-muted-foreground">All runs</span>
              </div>
              <div className="mt-1">
                <p className="text-2xl font-black text-foreground tabular-nums">
                  {loading ? "—" : (data?.records ?? []).length.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">total normalized records</p>
              </div>
            </CardHeader>
            <CardContent>
              <RowsByStore
                records={data?.records ?? []}
                stores={data?.stores ?? []}
                loading={loading}
              />
            </CardContent>
          </Card>

          {/* Monthly chart -> Workflow Events */}
          <Card className="rounded-xl border shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground">Workflow Events</CardTitle>
                <span className="text-xs text-muted-foreground">by step</span>
              </div>
            </CardHeader>
            <CardContent>
              <WorkflowEventCounts events={data?.events ?? []} loading={loading} />
            </CardContent>
          </Card>

          {/* Summary -> Upcoming Demand Events */}
          <Card className="rounded-xl border shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground">Upcoming Events</CardTitle>
                <span className="text-xs text-muted-foreground">demand signals</span>
              </div>
            </CardHeader>
            <CardContent>
              <UpcomingEventsPanel
                events={calendarEvents.data ?? []}
                loading={calendarEvents.isLoading}
              />
            </CardContent>
          </Card>

        </div>

        {/* Row 4: Transactions table + sidebar panels */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_0.8fr] gap-6">

          {/* Left: Normalized Records + Predictions */}
          <div className="space-y-6 min-w-0">
            <Card className="rounded-xl border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-foreground">Normalized Records</CardTitle>
                  <span className="text-xs text-muted-foreground">View All</span>
                </div>
              </CardHeader>
              <CardContent>
                <RecordsTable records={records} loading={loading} />
              </CardContent>
            </Card>

            <Card className="rounded-xl border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground">Predicted Stock Needs</CardTitle>
              </CardHeader>
              <CardContent>
                <PredictionTable
                  predictions={predictions.data ?? []}
                  loading={predictions.isLoading}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right: Recent Runs + Events Timeline */}
          <div className="space-y-6">
            <Card className="rounded-xl border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-foreground">Recent Runs</CardTitle>
                  <span className="text-xs text-muted-foreground">{data?.runs.length ?? 0} total</span>
                </div>
              </CardHeader>
              <CardContent>
                <RecentRuns runs={data?.runs ?? []} loading={loading} />
              </CardContent>
            </Card>

            <Card className="rounded-xl border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground">Workflow Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <EventsTimeline events={events} loading={eventsLoading} />
              </CardContent>
            </Card>
          </div>

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
