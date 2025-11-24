FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# system deps needed for some ML wheels and builds (and libgomp for implicit)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    git \
    ca-certificates \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirement files (if present). We prefer the recommendation requirements
# but also install the root requirements.txt when available.
COPY recommendation/requirements.txt /app/reco-requirements.txt
COPY requirements.txt /app/root-requirements.txt

RUN python -m pip install --upgrade pip setuptools wheel
RUN if [ -f /app/root-requirements.txt ]; then pip install --no-cache-dir -r /app/root-requirements.txt || true; fi
RUN if [ -f /app/reco-requirements.txt ]; then pip install --no-cache-dir -r /app/reco-requirements.txt || true; fi

# Copy application sources for both the main app and recommendation
COPY recommendation/backend /app/recommendation_backend
COPY app /app/app

WORKDIR /app

# Add a tiny supervisor script to start both the main app (uvicorn) and the
# recommendation Flask app. This is acceptable for a single-container dev setup.
COPY docker/start_services.sh /app/start_services.sh
RUN chmod +x /app/start_services.sh

EXPOSE 8000

CMD ["/app/start_services.sh"]
