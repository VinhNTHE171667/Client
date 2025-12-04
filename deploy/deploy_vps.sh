#!/usr/bin/env bash
set -euo pipefail

# Simple deploy script for VPS
# Usage: run as a user that can run docker, e.g. ssh user@34.142.150.3 && sudo -s; ./deploy_vps.sh

REPO_DIR="$(pwd)"
COMPOSE="docker compose"

echo "Updating repository and building containers in ${REPO_DIR}"
git fetch --all || true
git checkout dev-minh || true
git pull origin dev-minh || true

echo "Pull images if available (ignore errors)"
$COMPOSE pull || true

echo "Starting stack (build if necessary)"
$COMPOSE up -d --build --remove-orphans

echo "Waiting for 'init' job to finish (timeout 5m)"
timeout=300
start=$(date +%s)
while true; do
  if $COMPOSE logs init --no-color --tail 200 | grep -q "Init tasks finished"; then
    echo "Init finished"
    break
  fi
  if $COMPOSE logs init --no-color --tail 200 | grep -q "MinIO init failed"; then
    echo "Warning: MinIO init failed (check logs)"
    break
  fi
  now=$(date +%s)
  if [ $((now - start)) -gt $timeout ]; then
    echo "Timeout waiting for init"
    break
  fi
  echo "Waiting for init..."
  sleep 5
done

echo "Running DB migrations inside server container"
# Try running TypeORM migration using compiled data-source
$COMPOSE run --rm server sh -c "node ./node_modules/typeorm/cli.js -d dist/db/data-source.js migration:run" || {
  echo "Migration failed; inspect server logs and ensure DB is reachable" >&2
}

echo "Optional: seed data"
read -p "Run seed:data script? (y/N) " runseed
if [[ "$runseed" =~ ^[Yy]$ ]]; then
  $COMPOSE run --rm server npm run seed:data
fi

echo "Deploy finished. Use '$COMPOSE ps' and '$COMPOSE logs -f' to inspect services."
