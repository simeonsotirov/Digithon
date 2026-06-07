#!/usr/bin/env bash
set -euo pipefail

SESSION="digiton"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATABASE_URL_VALUE="${DATABASE_URL:-postgresql://postgres:postgres@localhost:55432/digithon}"

if ! command -v tmux >/dev/null 2>&1; then
  echo "tmux is required. Install it first, then rerun ./start-local.sh."
  exit 1
fi

if tmux has-session -t "$SESSION" 2>/dev/null; then
  if [ -t 0 ]; then
    tmux attach-session -t "$SESSION"
  else
    echo "tmux session '$SESSION' is already running. Attach with: tmux attach -t $SESSION"
  fi
  exit 0
fi

tmux new-session -d -s "$SESSION" -n "terminal" -c "$ROOT_DIR"
tmux send-keys -t "$SESSION:terminal" "export DATABASE_URL='$DATABASE_URL_VALUE'" C-m

tmux new-window -t "$SESSION" -n "docker" -c "$ROOT_DIR"
tmux send-keys -t "$SESSION:docker" "docker compose up" C-m

tmux new-window -t "$SESSION" -n "api" -c "$ROOT_DIR"
tmux send-keys -t "$SESSION:api" "export DATABASE_URL='$DATABASE_URL_VALUE'" C-m
tmux send-keys -t "$SESSION:api" "poetry install && until psql \"\$DATABASE_URL\" -c 'select 1' >/dev/null 2>&1; do sleep 1; done && psql \"\$DATABASE_URL\" -f db/migrations/001_init.sql && poetry run api" C-m

tmux new-window -t "$SESSION" -n "workers" -c "$ROOT_DIR"
tmux send-keys -t "$SESSION:workers" "export DATABASE_URL='$DATABASE_URL_VALUE'" C-m
tmux send-keys -t "$SESSION:workers" "npm install && until psql \"\$DATABASE_URL\" -c 'select 1' >/dev/null 2>&1; do sleep 1; done && npm run worker" C-m

tmux new-window -t "$SESSION" -n "react ui" -c "$ROOT_DIR"
tmux send-keys -t "$SESSION:react ui" "npm install && npm run web" C-m

tmux new-window -t "$SESSION" -n "clean" -c "$ROOT_DIR"
tmux send-keys -t "$SESSION:clean" "export DATABASE_URL='$DATABASE_URL_VALUE'" C-m
tmux send-keys -t "$SESSION:clean" "printf 'Cleanup helpers:\n  docker compose down\n  docker compose down -v\n  tmux kill-session -t $SESSION\n'" C-m

tmux select-window -t "$SESSION:terminal"
if [ -t 0 ]; then
  tmux attach-session -t "$SESSION"
else
  echo "tmux session '$SESSION' started. Attach with: tmux attach -t $SESSION"
fi
