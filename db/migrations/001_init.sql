create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists ingest_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  source_filename text not null,
  status text not null check (status in ('queued', 'running', 'completed', 'failed')),
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists stores (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null unique,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists raw_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  run_id uuid not null references ingest_runs(id),
  source_filename text not null,
  source_row_number integer not null,
  source_row_hash text not null,
  raw_payload jsonb not null,
  created_at timestamptz not null default now(),
  unique (run_id, source_row_hash)
);

create table if not exists normalized_data (
  id uuid primary key default gen_random_uuid(),
  raw_data_id uuid not null references raw_data(id),
  run_id uuid not null references ingest_runs(id),
  store_id uuid not null references stores(id),
  product_name text not null,
  quantity integer not null,
  price numeric(12, 2) not null,
  sale_date date not null,
  normalized_payload jsonb not null,
  quality_notes jsonb not null default '[]'::jsonb,
  reorder_signal text not null check (reorder_signal in ('ok', 'watch', 'reorder', 'stockout')),
  created_at timestamptz not null default now(),
  unique (raw_data_id)
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references ingest_runs(id),
  workflow_id text not null,
  step_name text not null,
  event_type text not null,
  status text not null check (status in ('started', 'succeeded', 'failed', 'skipped')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_ingest_runs_status on ingest_runs(status);
create index if not exists idx_events_run_id on events(run_id);
create index if not exists idx_events_workflow_id on events(workflow_id);
create index if not exists idx_events_step_name on events(step_name);
create index if not exists idx_events_created_at on events(created_at);
create index if not exists idx_normalized_data_run_id on normalized_data(run_id);

insert into users (id, email, display_name)
values ('00000000-0000-0000-0000-000000000001', 'demo@digithon.local', 'Demo User')
on conflict (email) do nothing;
