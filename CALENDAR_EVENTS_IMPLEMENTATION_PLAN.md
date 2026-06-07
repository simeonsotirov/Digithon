# Calendar Events Implementation Plan

## Goal

Add a durable `calendar_events` table for US public holidays and recurring demand-driving events such as Super Bowl, Black Friday, and back-to-school season. This table will power deterministic inventory predictions without relying on external APIs during the MVP demo.

## Scope

1. Create a Postgres-backed `calendar_events` table.
2. Seed at least 50 national US events across the current demo year and following year.
3. Expose read-only FastAPI endpoints for upcoming events.
4. Include upcoming events in the dashboard response.
5. Keep prediction generation as a follow-up step that reads from `normalized_data` and `calendar_events`.

## Table Name Decision

Use `calendar_events` instead of `public_holidays` because the prediction engine needs holidays, sports events, shopping events, seasonal windows, and eventually regional or local events.

## Database Contract

```text
calendar_events:
- id
- event_name
- event_type
- starts_on
- ends_on
- country
- region
- city
- impact_scope
- impact_score
- product_tags JSONB
- payload JSONB
- created_at
```

## Required MVP Seed Events

```text
New Year's Day
Martin Luther King Jr. Day
Presidents' Day
Super Bowl
Valentine's Day
Mother's Day
Father's Day
Memorial Day
Independence Day
Labor Day
Back-to-school season
Halloween
Thanksgiving
Black Friday
Christmas Eve
Christmas Day
New Year's Eve
```

## Expanded Demand Event Seeds

The seed set should include at least 50 total rows so the predictor and dashboard have enough calendar coverage. Additional recurring demand events include sports periods, retail shopping events, and seasonal windows such as March Madness, Easter, Cinco de Mayo, graduation season, summer travel season, National Coffee Day, Veterans Day, Small Business Saturday, Cyber Monday, Hanukkah, and Green Monday.

## API Work

1. Add a `CalendarEvent` Pydantic response model.
2. Add `GET /calendar-events` with optional `from_date`, `to_date`, and bounded `limit` filters.
3. Extend `GET /dashboard` with `upcoming_events`.

## Prediction Follow-Up

The predictor should read `calendar_events` and match `product_tags` against normalized product names or a small deterministic category map. Prediction records should later be persisted in `inventory_predictions`.
