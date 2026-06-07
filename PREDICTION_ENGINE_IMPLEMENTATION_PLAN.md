# Prediction Engine Implementation Plan

## Goal

Add a deterministic, event-aware prediction engine that turns normalized retail sales and inventory data into explainable reorder recommendations.

The engine should not be positioned as generic AI forecasting. The differentiator is the full loop:

```text
messy retail CSV
  -> normalized product/store/inventory truth
  -> calendar event matching
  -> event-aware demand uplift
  -> reorder recommendation with reasons
```

## Scope

1. Expand `db/seed/messy_sales.csv` to 500-1000 generated rows with richer inventory fields.
2. Keep the seed data intentionally messy: aliases, invalid values, duplicate rows, expired inventory, missing inventory, and damaged inventory.
3. Update the normalizer to parse richer fields while preserving compatibility with the original CSV shape.
4. Add a durable `inventory_predictions` table.
5. Add a worker step that generates predictions after normalized rows are persisted.
6. Expose predictions through FastAPI and include them in the dashboard response.
7. Render predictions in the React dashboard.

## Seed CSV Contract

Use this expanded CSV shape:

```text
store
product
quantity_sold
current_stock
missing_stock
damaged_stock
expired_stock
price
sale_date
expiry_date
supplier
category
event_hint
```

`event_hint` is only for seeded demo observability. The prediction engine must not depend on it.

Generate roughly 750 rows using a fixed random seed, 6 stores, 40-50 products, and dates from `2026-03-01` through `2026-10-15` so the data overlaps existing `calendar_events` windows.

## Calendar Event Alignment

Generated product categories and tags should intentionally cover existing `calendar_events.product_tags`:

```text
coffee beans
espresso pods
tea bags
beverages
snacks
chips
soda
frozen pizza
groceries
gifts
candy
seasonal items
checkout supplies
lunch items
stationery
```

## Normalizer Changes

Parse these additional fields:

```text
quantity_sold
current_stock
missing_stock
damaged_stock
expired_stock
expiry_date
supplier
category
event_hint
```

Derive and store in `normalized_payload`:

```text
available_stock = max(0, current_stock - missing_stock - damaged_stock - expired_stock)
inventory_risk = ok | low_stock | stockout | shrinkage | expiry_risk
```

Keep `quantity` as the normalized top-level quantity for backward compatibility, mapped from `quantity_sold` when present.

## Database Contract

Add `inventory_predictions`:

```text
id
run_id
store_id
calendar_event_id
product_name
baseline_quantity
available_stock
predicted_quantity
uplift_multiplier
recommended_reorder_quantity
confidence
reasons JSONB
created_at
```

Required constraints and indexes:

```text
unique (run_id, store_id, product_name, calendar_event_id)
index run_id
index store_id
index calendar_event_id
index product_name
```

## Prediction Formula

For each store/product matched to an upcoming event:

```text
baseline_quantity = average quantity_sold for store/product
event_uplift = calendar_events.payload.default_uplift_multiplier
predicted_quantity = ceil(baseline_quantity * (1 + event_uplift * impact_score))
recommended_reorder_quantity = max(0, predicted_quantity - available_stock)
```

Confidence:

```text
high = 5+ rows and direct tag match
medium = 2-4 rows or category tag match
low = fallback baseline or sparse data
```

## API Contract

Add `InventoryPrediction` and expose:

```text
GET /predictions
GET /dashboard -> predictions
```

## Frontend Contract

Add prediction types and a dashboard section showing:

```text
event
store
product
baseline
available stock
predicted demand
recommended reorder
confidence
reason
```

## Definition Of Done

The change is complete when:

```text
messy CSV has 500-1000 richer rows
normalizer emits inventory-aware payloads
workflow persists retry-safe predictions
API returns typed predictions
dashboard displays event-aware recommendations
focused backend/frontend checks pass
```
