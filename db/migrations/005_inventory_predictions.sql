create table if not exists inventory_predictions (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references ingest_runs(id),
  store_id uuid not null references stores(id),
  calendar_event_id uuid not null references calendar_events(id),
  product_name text not null,
  baseline_quantity numeric(12, 2) not null,
  available_stock integer not null,
  predicted_quantity integer not null,
  uplift_multiplier numeric(8, 4) not null,
  recommended_reorder_quantity integer not null,
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  reasons jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (run_id, store_id, product_name, calendar_event_id)
);

create index if not exists idx_inventory_predictions_run_id on inventory_predictions(run_id);
create index if not exists idx_inventory_predictions_store_id on inventory_predictions(store_id);
create index if not exists idx_inventory_predictions_calendar_event_id on inventory_predictions(calendar_event_id);
create index if not exists idx_inventory_predictions_product_name on inventory_predictions(product_name);
create index if not exists idx_inventory_predictions_reorder_quantity on inventory_predictions(recommended_reorder_quantity);
