create table if not exists calendar_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  event_type text not null check (event_type in ('holiday', 'sports', 'shopping', 'seasonal', 'local_event')),
  starts_on date not null,
  ends_on date not null,
  country text not null default 'US',
  region text,
  city text,
  impact_scope text not null check (impact_scope in ('national', 'regional', 'local')),
  impact_score numeric(5, 2) not null check (impact_score >= 0),
  product_tags jsonb not null default '[]'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create unique index if not exists idx_calendar_events_unique_event
  on calendar_events (event_name, starts_on, country, coalesce(region, ''), coalesce(city, ''));

create index if not exists idx_calendar_events_starts_on on calendar_events(starts_on);
create index if not exists idx_calendar_events_event_type on calendar_events(event_type);
create index if not exists idx_calendar_events_impact_scope on calendar_events(impact_scope);
create index if not exists idx_calendar_events_product_tags_gin on calendar_events using gin(product_tags);

insert into calendar_events (
  event_name, event_type, starts_on, ends_on, country, region, city,
  impact_scope, impact_score, product_tags, payload
) values
  ('New Year''s Day', 'holiday', '2026-01-01', '2026-01-01', 'US', null, null, 'national', 0.55, '["coffee beans", "tea bags", "beverages", "groceries"]'::jsonb, '{"source":"seed","notes":"Federal holiday with hosting and recovery demand.","default_uplift_multiplier":0.35,"event_window_days":2}'::jsonb),
  ('Martin Luther King Jr. Day', 'holiday', '2026-01-19', '2026-01-19', 'US', null, null, 'national', 0.25, '["coffee beans", "beverages", "snacks"]'::jsonb, '{"source":"seed","notes":"Federal holiday with moderate traffic shifts.","default_uplift_multiplier":0.35,"event_window_days":1}'::jsonb),
  ('Presidents'' Day', 'holiday', '2026-02-16', '2026-02-16', 'US', null, null, 'national', 0.30, '["coffee beans", "beverages", "snacks"]'::jsonb, '{"source":"seed","notes":"Federal holiday and retail promotion period.","default_uplift_multiplier":0.35,"event_window_days":1}'::jsonb),
  ('Super Bowl', 'sports', '2026-02-08', '2026-02-08', 'US', null, null, 'national', 0.90, '["snacks", "chips", "soda", "frozen pizza", "beverages"]'::jsonb, '{"source":"seed","notes":"High snack and party demand. Use a short pre-event demand window.","default_uplift_multiplier":0.60,"event_window_days":3}'::jsonb),
  ('Valentine''s Day', 'holiday', '2026-02-14', '2026-02-14', 'US', null, null, 'national', 0.45, '["gifts", "coffee beans", "tea bags", "seasonal items"]'::jsonb, '{"source":"seed","notes":"Gift and specialty item demand.","default_uplift_multiplier":0.35,"event_window_days":2}'::jsonb),
  ('Mother''s Day', 'holiday', '2026-05-10', '2026-05-10', 'US', null, null, 'national', 0.50, '["gifts", "coffee beans", "tea bags", "seasonal items"]'::jsonb, '{"source":"seed","notes":"Gift and brunch-related demand.","default_uplift_multiplier":0.35,"event_window_days":3}'::jsonb),
  ('Father''s Day', 'holiday', '2026-06-21', '2026-06-21', 'US', null, null, 'national', 0.45, '["gifts", "snacks", "beverages", "coffee beans"]'::jsonb, '{"source":"seed","notes":"Gift and gathering demand.","default_uplift_multiplier":0.35,"event_window_days":3}'::jsonb),
  ('Memorial Day', 'holiday', '2026-05-25', '2026-05-25', 'US', null, null, 'national', 0.65, '["snacks", "chips", "soda", "beverages", "groceries"]'::jsonb, '{"source":"seed","notes":"Long-weekend gathering and cookout demand.","default_uplift_multiplier":0.35,"event_window_days":4}'::jsonb),
  ('Independence Day', 'holiday', '2026-07-04', '2026-07-04', 'US', null, null, 'national', 0.75, '["snacks", "chips", "soda", "beverages", "groceries"]'::jsonb, '{"source":"seed","notes":"High cookout and party demand.","default_uplift_multiplier":0.35,"event_window_days":4}'::jsonb),
  ('Labor Day', 'holiday', '2026-09-07', '2026-09-07', 'US', null, null, 'national', 0.60, '["snacks", "chips", "soda", "beverages", "groceries"]'::jsonb, '{"source":"seed","notes":"Long-weekend demand and end-of-summer traffic.","default_uplift_multiplier":0.35,"event_window_days":4}'::jsonb),
  ('Back-to-school season', 'seasonal', '2026-08-01', '2026-09-15', 'US', null, null, 'national', 0.60, '["snacks", "beverages", "lunch items", "stationery"]'::jsonb, '{"source":"seed","notes":"Multi-week seasonal demand window.","default_uplift_multiplier":0.30,"event_window_days":46}'::jsonb),
  ('Halloween', 'holiday', '2026-10-31', '2026-10-31', 'US', null, null, 'national', 0.55, '["snacks", "candy", "beverages", "seasonal items"]'::jsonb, '{"source":"seed","notes":"Seasonal party and candy demand.","default_uplift_multiplier":0.35,"event_window_days":5}'::jsonb),
  ('Thanksgiving', 'holiday', '2026-11-26', '2026-11-26', 'US', null, null, 'national', 0.80, '["groceries", "tea bags", "coffee beans", "seasonal items"]'::jsonb, '{"source":"seed","notes":"Holiday grocery and hosting demand.","default_uplift_multiplier":0.35,"event_window_days":5}'::jsonb),
  ('Black Friday', 'shopping', '2026-11-27', '2026-11-27', 'US', null, null, 'national', 0.85, '["coffee beans", "espresso pods", "checkout supplies", "snacks", "beverages"]'::jsonb, '{"source":"seed","notes":"High traffic and staff/customer refreshment demand.","default_uplift_multiplier":0.55,"event_window_days":1}'::jsonb),
  ('Christmas Eve', 'holiday', '2026-12-24', '2026-12-24', 'US', null, null, 'national', 0.80, '["coffee beans", "tea bags", "gifts", "seasonal items"]'::jsonb, '{"source":"seed","notes":"Gift, hosting, and holiday foot traffic demand.","default_uplift_multiplier":0.35,"event_window_days":4}'::jsonb),
  ('Christmas Day', 'holiday', '2026-12-25', '2026-12-25', 'US', null, null, 'national', 0.80, '["coffee beans", "tea bags", "gifts", "seasonal items"]'::jsonb, '{"source":"seed","notes":"Gift, hosting, and holiday foot traffic demand.","default_uplift_multiplier":0.35,"event_window_days":4}'::jsonb),
  ('New Year''s Eve', 'holiday', '2026-12-31', '2026-12-31', 'US', null, null, 'national', 0.70, '["snacks", "soda", "beverages", "seasonal items"]'::jsonb, '{"source":"seed","notes":"Party and celebration demand.","default_uplift_multiplier":0.35,"event_window_days":3}'::jsonb),
  ('New Year''s Day', 'holiday', '2027-01-01', '2027-01-01', 'US', null, null, 'national', 0.55, '["coffee beans", "tea bags", "beverages", "groceries"]'::jsonb, '{"source":"seed","notes":"Federal holiday with hosting and recovery demand.","default_uplift_multiplier":0.35,"event_window_days":2}'::jsonb),
  ('Martin Luther King Jr. Day', 'holiday', '2027-01-18', '2027-01-18', 'US', null, null, 'national', 0.25, '["coffee beans", "beverages", "snacks"]'::jsonb, '{"source":"seed","notes":"Federal holiday with moderate traffic shifts.","default_uplift_multiplier":0.35,"event_window_days":1}'::jsonb),
  ('Presidents'' Day', 'holiday', '2027-02-15', '2027-02-15', 'US', null, null, 'national', 0.30, '["coffee beans", "beverages", "snacks"]'::jsonb, '{"source":"seed","notes":"Federal holiday and retail promotion period.","default_uplift_multiplier":0.35,"event_window_days":1}'::jsonb),
  ('Super Bowl', 'sports', '2027-02-14', '2027-02-14', 'US', null, null, 'national', 0.90, '["snacks", "chips", "soda", "frozen pizza", "beverages"]'::jsonb, '{"source":"seed","notes":"High snack and party demand. Use a short pre-event demand window.","default_uplift_multiplier":0.60,"event_window_days":3}'::jsonb),
  ('Valentine''s Day', 'holiday', '2027-02-14', '2027-02-14', 'US', null, null, 'national', 0.45, '["gifts", "coffee beans", "tea bags", "seasonal items"]'::jsonb, '{"source":"seed","notes":"Gift and specialty item demand.","default_uplift_multiplier":0.35,"event_window_days":2}'::jsonb),
  ('Mother''s Day', 'holiday', '2027-05-09', '2027-05-09', 'US', null, null, 'national', 0.50, '["gifts", "coffee beans", "tea bags", "seasonal items"]'::jsonb, '{"source":"seed","notes":"Gift and brunch-related demand.","default_uplift_multiplier":0.35,"event_window_days":3}'::jsonb),
  ('Father''s Day', 'holiday', '2027-06-20', '2027-06-20', 'US', null, null, 'national', 0.45, '["gifts", "snacks", "beverages", "coffee beans"]'::jsonb, '{"source":"seed","notes":"Gift and gathering demand.","default_uplift_multiplier":0.35,"event_window_days":3}'::jsonb),
  ('Memorial Day', 'holiday', '2027-05-31', '2027-05-31', 'US', null, null, 'national', 0.65, '["snacks", "chips", "soda", "beverages", "groceries"]'::jsonb, '{"source":"seed","notes":"Long-weekend gathering and cookout demand.","default_uplift_multiplier":0.35,"event_window_days":4}'::jsonb),
  ('Independence Day', 'holiday', '2027-07-04', '2027-07-04', 'US', null, null, 'national', 0.75, '["snacks", "chips", "soda", "beverages", "groceries"]'::jsonb, '{"source":"seed","notes":"High cookout and party demand.","default_uplift_multiplier":0.35,"event_window_days":4}'::jsonb),
  ('Labor Day', 'holiday', '2027-09-06', '2027-09-06', 'US', null, null, 'national', 0.60, '["snacks", "chips", "soda", "beverages", "groceries"]'::jsonb, '{"source":"seed","notes":"Long-weekend demand and end-of-summer traffic.","default_uplift_multiplier":0.35,"event_window_days":4}'::jsonb),
  ('Back-to-school season', 'seasonal', '2027-08-01', '2027-09-15', 'US', null, null, 'national', 0.60, '["snacks", "beverages", "lunch items", "stationery"]'::jsonb, '{"source":"seed","notes":"Multi-week seasonal demand window.","default_uplift_multiplier":0.30,"event_window_days":46}'::jsonb),
  ('Halloween', 'holiday', '2027-10-31', '2027-10-31', 'US', null, null, 'national', 0.55, '["snacks", "candy", "beverages", "seasonal items"]'::jsonb, '{"source":"seed","notes":"Seasonal party and candy demand.","default_uplift_multiplier":0.35,"event_window_days":5}'::jsonb),
  ('Thanksgiving', 'holiday', '2027-11-25', '2027-11-25', 'US', null, null, 'national', 0.80, '["groceries", "tea bags", "coffee beans", "seasonal items"]'::jsonb, '{"source":"seed","notes":"Holiday grocery and hosting demand.","default_uplift_multiplier":0.35,"event_window_days":5}'::jsonb),
  ('Black Friday', 'shopping', '2027-11-26', '2027-11-26', 'US', null, null, 'national', 0.85, '["coffee beans", "espresso pods", "checkout supplies", "snacks", "beverages"]'::jsonb, '{"source":"seed","notes":"High traffic and staff/customer refreshment demand.","default_uplift_multiplier":0.55,"event_window_days":1}'::jsonb),
  ('Christmas Eve', 'holiday', '2027-12-24', '2027-12-24', 'US', null, null, 'national', 0.80, '["coffee beans", "tea bags", "gifts", "seasonal items"]'::jsonb, '{"source":"seed","notes":"Gift, hosting, and holiday foot traffic demand.","default_uplift_multiplier":0.35,"event_window_days":4}'::jsonb),
  ('Christmas Day', 'holiday', '2027-12-25', '2027-12-25', 'US', null, null, 'national', 0.80, '["coffee beans", "tea bags", "gifts", "seasonal items"]'::jsonb, '{"source":"seed","notes":"Gift, hosting, and holiday foot traffic demand.","default_uplift_multiplier":0.35,"event_window_days":4}'::jsonb),
  ('New Year''s Eve', 'holiday', '2027-12-31', '2027-12-31', 'US', null, null, 'national', 0.70, '["snacks", "soda", "beverages", "seasonal items"]'::jsonb, '{"source":"seed","notes":"Party and celebration demand.","default_uplift_multiplier":0.35,"event_window_days":3}'::jsonb)
on conflict do nothing;
