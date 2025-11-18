# Spa AI Data Analytics Platform

## Overview

This project delivers a complete microservice-style analytics solution for spa businesses. A Flask backend exposes AI-powered endpoints, while a Streamlit dashboard consumes those APIs to visualise KPIs, forecasts, customer segments, anomaly alerts, and Gemini-generated strategic advice.

## Project Structure

```
recommendation/
├── backend/
│   ├── app.py
│   └── ai_modules/
│       ├── __init__.py
│       ├── analyzer.py
│       ├── anomaly.py
│       ├── forecast.py
│       ├── gemini_advice.py
│       ├── segment.py
│       └── utils.py
├── frontend/
│   └── dashboard.py
├── outputs/
│   ├── kpi_summary.json
│   └── advice.json
├── docs/
│   └── README.md
├── .env.example
├── requirements.txt
└── README.md
```

## Quick Start

```powershell
# 1. Create virtual environment (optional but recommended)
python -m venv .venv
.\.venv\Scripts\activate

# 2. Install dependencies for both backend and frontend
pip install -r requirements.txt

# 3. Configure environment
copy .env.example .env

Update the `.env` file with valid MySQL credentials and Gemini API details. Ví dụ với MySQL Workbench đang chạy `root@127.0.0.1:3306` mật khẩu `root`:

```
MYSQL_USER=root
MYSQL_PASS=root
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DB=gen_spa
```

### Load the `gen_spa` schema

```powershell
mysql -h 127.0.0.1 -u root -p < C:\Users\MINH\Downloads\DB3.sql
```

Nhập mật khẩu `root` khi được hỏi. Sau khi import, bảng dữ liệu thực tế đã sẵn sàng cho backend sử dụng.
```

### Run the backend API

```powershell
$env:FLASK_APP="backend/app.py"
python backend/app.py
```

The API serves at `http://127.0.0.1:8000` by default.

### Run the Streamlit dashboard

```powershell
streamlit run frontend/dashboard.py
```

The dashboard expects the backend to be available at `API_BASE_URL` (default `http://127.0.0.1:8000`).

## Sample Data & Fallbacks

If the MySQL database is unreachable, the backend automatically falls back to a synthetic dataset so that the API and dashboard remain functional for demos.

## Outputs

The modules export illustrative JSON into the `outputs/` directory. Replace these samples with your production runs or integrate them into CI pipelines.

## Next Steps

1. Replace the synthetic dataset with a real connection to the `gen_spa` MySQL database.
2. Configure Vertex AI Gemini credentials for live strategic recommendations.
3. Add automated tests (pytest) to cover the analytics modules and API routes.
4. Containerise both services using Docker for deployment.
