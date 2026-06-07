#!/bin/sh
# Idempotent migration runner.
#
# Applies every db/migrations/*.sql file exactly once, in filename order,
# tracking applied files in a schema_migrations table. Re-running is a safe
# no-op: already-applied files are skipped, so adding new migrations later
# Just Works without manual intervention.
#
# Connection comes from PG* env vars (PGHOST/PGPORT/PGUSER/PGDATABASE/PGPASSWORD).
# Sensible defaults match the local docker-compose stack.
set -eu

export PGHOST="${PGHOST:-postgres}"
export PGPORT="${PGPORT:-5432}"
export PGUSER="${PGUSER:-postgres}"
export PGDATABASE="${PGDATABASE:-digithon}"

MIGRATIONS_DIR="${MIGRATIONS_DIR:-$(CDPATH= cd "$(dirname "$0")/migrations" && pwd)}"

psql -v ON_ERROR_STOP=1 -q -c \
  'create table if not exists schema_migrations (filename text primary key, applied_at timestamptz not null default now());'

for f in "$MIGRATIONS_DIR"/*.sql; do
  [ -e "$f" ] || continue
  name="$(basename "$f")"
  applied="$(psql -tAq -c "select 1 from schema_migrations where filename = '$name';")"
  if [ "$applied" = "1" ]; then
    echo "skip   $name (already applied)"
    continue
  fi
  echo "apply  $name"
  psql -v ON_ERROR_STOP=1 -q -1 -f "$f"
  psql -v ON_ERROR_STOP=1 -q -c "insert into schema_migrations (filename) values ('$name');"
done

echo "migrations up to date"
