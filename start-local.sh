#!/usr/bin/env bash
set -euo pipefail

SESSION="digiton"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATABASE_URL_VALUE="${DATABASE_URL:-postgresql://postgres:postgres@localhost:55432/digithon}"
DOCKER_SERVICES="postgres migrate openworkflow"

if ! command -v tmux >/dev/null 2>&1; then
  echo "tmux is required. Install it first, then rerun ./start-local.sh."
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required. Install Docker Desktop, start it, then rerun ./start-local.sh."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker is not running. Start Docker Desktop, then rerun ./start-local.sh."
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
tmux send-keys -t "$SESSION:terminal" "printf 'Digithon local stack\n  API: http://localhost:8000\n  Web: http://localhost:5173\n  OpenWorkflow: http://localhost:3001\n  Postgres: localhost:55432\n\nAttach windows with Ctrl-b n / Ctrl-b p.\n'" C-m

tmux new-window -t "$SESSION" -n "docker" -c "$ROOT_DIR"
tmux send-keys -t "$SESSION:docker" "docker compose up -d --build $DOCKER_SERVICES && docker compose ps && docker compose logs -f postgres openworkflow" C-m

tmux new-window -t "$SESSION" -n "api" -c "$ROOT_DIR"
tmux send-keys -t "$SESSION:api" "export DATABASE_URL='$DATABASE_URL_VALUE'" C-m
tmux send-keys -t "$SESSION:api" "poetry install && until docker compose exec -T postgres pg_isready -U postgres -d digithon >/dev/null 2>&1; do sleep 1; done && docker compose up migrate && poetry run api" C-m

tmux new-window -t "$SESSION" -n "workers" -c "$ROOT_DIR"
tmux send-keys -t "$SESSION:workers" "export DATABASE_URL='$DATABASE_URL_VALUE'" C-m
tmux send-keys -t "$SESSION:workers" "npm install && until docker compose exec -T postgres pg_isready -U postgres -d digithon >/dev/null 2>&1; do sleep 1; done && npm run worker" C-m

tmux new-window -t "$SESSION" -n "react ui" -c "$ROOT_DIR"
tmux send-keys -t "$SESSION:react ui" "npm install && npm run web" C-m

tmux new-window -t "$SESSION" -n "clean" -c "$ROOT_DIR"
tmux send-keys -t "$SESSION:clean" "export DATABASE_URL='$DATABASE_URL_VALUE'" C-m
tmux send-keys -t "$SESSION:clean" "printf 'Cleanup helpers:\n  docker compose down\n  docker compose down -v\n  tmux kill-session -t $SESSION\n\nUseful checks:\n  docker compose ps\n  docker compose logs migrate\n  docker compose logs postgres openworkflow\n'" C-m

tmux select-window -t "$SESSION:terminal"
if [ -t 0 ]; then
  tmux attach-session -t "$SESSION"
else
  echo "tmux session '$SESSION' started. Attach with: tmux attach -t $SESSION"
fi
