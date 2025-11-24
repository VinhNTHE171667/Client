#!/usr/bin/env bash
set -euo pipefail

# Start the main FastAPI app (if app.main exists) on port 8000
# and the recommendation Flask app on the same process (Flask app will also bind 0.0.0.0:8000)
# To avoid port conflict, we run the main app with uvicorn and the Flask app as a background
# process served by the built-in Flask server on a different port (8001), then proxy requests
# by running a tiny nginx would be ideal, but to keep this simple for dev we run both and
# let the main app be the primary API. If both expose same routes, the main app should include
# or proxy to recommendation endpoints; otherwise consumers can call port 8001 directly.

# Start recommendation Flask app (if exists)
RECO_ADAPTER_PRESENT=false
if [ -f /app/app/recommendation_adapter.py ]; then
  echo "Recommendation adapter present in main app; will not start standalone Flask recom service."
  RECO_ADAPTER_PRESENT=true
fi

if [ "$RECO_ADAPTER_PRESENT" = false ] && [ -f /app/recommendation_backend/app.py ]; then
  echo "Starting recommendation Flask app on port 8000"
  # Ensure Python can import the main /app package and recommendation backend
  export PYTHONPATH=/app
  # run recommendation Flask app on container port 8000 so docker-compose port map exposes it
  (cd /app/recommendation_backend && PYTHONPATH=/app python app.py --port 8000) &
else
  if [ "$RECO_ADAPTER_PRESENT" = true ]; then
    echo "Skipping standalone recommendation Flask app because adapter will serve endpoints via FastAPI"
  else
    echo "No recommendation Flask app found at /app/recommendation_backend/app.py"
  fi
fi

# Start main FastAPI app (uvicorn)
if [ -f /app/app/main.py ] || [ -f /app/app/main.py ]; then
  echo "Starting main FastAPI app with uvicorn on port 8000"
  # run main FastAPI on 8000 so adapter endpoints are reachable via docker-compose port mapping
  uvicorn app.main:app --host 0.0.0.0 --port 8000
else
  echo "Main FastAPI app not found under /app/app. Falling back to running Flask app on 8000 if available."
  if [ -f /app/recommendation_backend/app.py ]; then
    (cd /app/recommendation_backend && python app.py) 
  else
    echo "No app to run. Exiting."
    exit 1
  fi
fi
