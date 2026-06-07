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

export async function createIngest(): Promise<Run> {
  const response = await fetch(`${apiBase}/ingest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source_filename: "db/seed/messy_sales.csv" }),
  });
  if (!response.ok) throw new Error("Failed to create ingest run");
  return response.json();
}
