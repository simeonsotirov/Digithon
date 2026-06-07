export type Run = {
  id: string;
  user_id: string;
  source_filename: string;
  status: "queued" | "running" | "completed" | "failed";
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
};

export type Store = {
  id: string;
  canonical_name: string;
  display_name: string;
  created_at: string;
};

export type Event = {
  id: string;
  run_id: string;
  workflow_id: string;
  step_name: string;
  event_type: string;
  status: "started" | "succeeded" | "failed" | "skipped";
  payload: Record<string, unknown>;
  created_at: string;
};

export type NormalizedRecord = {
  id: string;
  raw_data_id: string;
  run_id: string;
  store_id: string;
  store_name: string;
  product_name: string;
  quantity: number;
  price: number;
  sale_date: string;
  normalized_payload: Record<string, unknown>;
  quality_notes: string[];
  reorder_signal: "ok" | "watch" | "reorder" | "stockout";
  created_at: string;
};

export type Dashboard = {
  kpis: {
    total_raw_rows: number;
    total_normalized_rows: number;
    quality_issue_count: number;
    reorder_count: number;
    stockout_count: number;
  };
  runs: Run[];
  stores: Store[];
  records: NormalizedRecord[];
  events: Event[];
};

export type CalendarEvent = {
  id: string;
  event_name: string;
  event_type: "holiday" | "sports" | "shopping" | "seasonal" | "local_event";
  starts_on: string;
  ends_on: string;
  country: string;
  region: string | null;
  city: string | null;
  impact_scope: "national" | "regional" | "local";
  impact_score: number;
  product_tags: string[];
  payload: Record<string, unknown>;
  created_at: string;
};

export type InventoryPrediction = {
  id: string;
  run_id: string;
  store_id: string;
  store_name: string;
  product_name: string;
  forecast_date: string;
  baseline_quantity: number;
  predicted_quantity: number;
  event_uplift: number;
  risk_level: "ok" | "watch" | "reorder" | "stockout";
  related_event_id: string | null;
  related_event_name: string | null;
  explanation_notes: string[];
  payload: Record<string, unknown>;
  created_at: string;
};

export type PredictionKpis = {
  predicted_reorder_count: number;
  predicted_stockout_count: number;
  upcoming_event_count: number;
  high_impact_event_count: number;
};

export type IngestSource =
  | { type: "seed" }
  | { type: "file"; file: File }
  | { type: "drive"; driveId: string };

const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export async function getDashboard() {
  const response = await fetch(`${apiBase}/dashboard`);
  if (!response.ok) throw new Error("Failed to load dashboard");
  return response.json() as Promise<Dashboard>;
}

export async function getRuns(): Promise<Run[]> {
  const response = await fetch(`${apiBase}/runs`);
  if (!response.ok) throw new Error("Failed to load runs");
  return response.json();
}

export async function getEvents(runId: string): Promise<Event[]> {
  const response = await fetch(`${apiBase}/events?run_id=${encodeURIComponent(runId)}`);
  if (!response.ok) throw new Error("Failed to load events");
  return response.json();
}

export async function getCalendarEvents(params?: { from_date?: string; to_date?: string }): Promise<CalendarEvent[]> {
  const query = new URLSearchParams();
  if (params?.from_date) query.set("from_date", params.from_date);
  if (params?.to_date) query.set("to_date", params.to_date);
  const response = await fetch(`${apiBase}/calendar-events?${query}`);
  if (!response.ok) throw new Error("Failed to load calendar events");
  return response.json();
}

export async function getPredictions(params?: { run_id?: string; store_id?: string; risk_level?: string }): Promise<InventoryPrediction[]> {
  const query = new URLSearchParams();
  if (params?.run_id) query.set("run_id", params.run_id);
  if (params?.store_id) query.set("store_id", params.store_id);
  if (params?.risk_level) query.set("risk_level", params.risk_level);
  const response = await fetch(`${apiBase}/predictions?${query}`);
  if (!response.ok) throw new Error("Failed to load predictions");
  return response.json();
}

export async function createIngest(source: IngestSource = { type: "seed" }): Promise<Run> {
  if (source.type === "file") {
    const form = new FormData();
    form.append("file", source.file);
    const response = await fetch(`${apiBase}/ingest`, { method: "POST", body: form });
    if (!response.ok) throw new Error("Failed to create ingest run");
    return response.json();
  }

  const body =
    source.type === "drive"
      ? { source_uri: source.driveId, source_type: "google_drive" }
      : { source_filename: "db/seed/messy_sales.csv" };

  const response = await fetch(`${apiBase}/ingest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error("Failed to create ingest run");
  return response.json();
}
