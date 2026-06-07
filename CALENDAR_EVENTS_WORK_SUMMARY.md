# Calendar Events Work Summary

## What We Added

We added a durable `calendar_events` foundation for demand-aware inventory prediction. The table stores US public holidays and recurring retail demand events such as Super Bowl, Black Friday, back-to-school season, Prime Day, March Madness, and Cyber Monday.

The table is named `calendar_events` instead of `public_holidays` because it needs to support holidays, sports events, shopping events, seasonal periods, and future local events.

## Files Created

```text
CALENDAR_EVENTS_IMPLEMENTATION_PLAN.md
CALENDAR_EVENTS_WORK_SUMMARY.md
db/migrations/003_calendar_events.sql
db/migrations/004_more_calendar_events.sql
```

## Files Updated

```text
apps/api/app/routes.py
apps/api/app/schemas.py
apps/web/src/api.ts
```

## Database Changes

Created `calendar_events` with these fields:

```text
id
event_name
starts_on
ends_on
country
region
city
impact_scope
impact_score
product_tags JSONB
payload JSONB
created_at
```

Added constraints and indexes for:

```text
unique event identity
starts_on
impact_scope
product_tags GIN
```

## Seed Data

Initial migration `003_calendar_events.sql` seeded 34 events across 2026 and 2027.

Follow-up migration `004_more_calendar_events.sql` added 32 more recurring demand events.

Current total after applying both migrations:

```text
66 calendar events
```

Current event type breakdown:

```text
holiday: 38
shopping: 16
seasonal: 6
sports: 6
```

## API Changes

Added a typed FastAPI response model:

```text
CalendarEvent
```

Added read-only endpoint:

```text
GET /calendar-events
```

Supported query parameters:

```text
from_date
limit
```

Extended dashboard response with:

```text
upcoming_events
```

## Frontend Contract Changes

Added TypeScript type:

```text
CalendarEvent
```

Extended `Dashboard` type with:

```text
upcoming_events: CalendarEvent[]
```

Added API helper:

```text
getCalendarEvents()
```

## Verification Completed

Code checks passed:

```text
python -m compileall apps/api/app
PYTHONPATH=apps/api python -c "from app.main import app; assert app.title == 'Digithon API'"
npm --workspace apps/web run typecheck
npm --workspace apps/web run build
```

Database migration was applied to Docker Postgres on `localhost:55432`.

Verification queries confirmed:

```text
calendar_event_count = 66
```

Upcoming event query returned expected 2026 events such as Father’s Day, Independence Day, Prime Day, back-to-school season, Labor Day, NFL kickoff, and National Coffee Day.

## Next Step

The prediction engine can now use `calendar_events.product_tags`, `event_type`, `impact_score`, and event dates to generate deterministic `inventory_predictions` from normalized sales data.
