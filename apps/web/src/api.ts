export type Run = {
  id: string;
  user_id: string;
  source_filename: string;
  workflow_id: string | null;
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
  calendar_event_id: string;
  event_name: string;
  product_name: string;
  baseline_quantity: number;
  available_stock: number;
  predicted_quantity: number;
  uplift_multiplier: number;
  recommended_reorder_quantity: number;
  confidence: "low" | "medium" | "high";
  reasons: string[];
  created_at: string;
};

export type Dashboard = {
  kpis: {
    total_raw_rows: number;
    total_normalized_rows: number;
    quality_issue_count: number;
    reorder_count: number;
    stockout_count: number;
    prediction_count: number;
    recommended_reorder_quantity_total: number;
  };
  runs: Run[];
  stores: Store[];
  records: NormalizedRecord[];
  upcoming_events: CalendarEvent[];
  predictions: InventoryPrediction[];
  events: Event[];
};

const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export async function getDashboard() {
  const response = await fetch(`${apiBase}/dashboard`);
  if (!response.ok) {
    throw new Error("Failed to load dashboard");
  }
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

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  const response = await fetch(`${apiBase}/calendar-events`);
  if (!response.ok) throw new Error("Failed to load calendar events");
  return response.json();
}

export async function getPredictions(): Promise<InventoryPrediction[]> {
  const response = await fetch(`${apiBase}/predictions`);
  if (!response.ok) throw new Error("Failed to load predictions");
  return response.json();
}

export async function createIngest(): Promise<Run> {
  const response = await fetch(`${apiBase}/ingest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source_filename: "db/seed/messy_sales.csv" }),
  });
  if (!response.ok) throw new Error("Failed to create ingest run");
  return response.json();
}
