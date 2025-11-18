"""Flask API entrypoint for the Spa AI Data Analytics Platform."""
from __future__ import annotations

import logging
import threading
from typing import Any, Dict

from flask import Flask, jsonify, request
from flask_cors import CORS

from ai_modules import analyzer, anomaly, forecast, gemini_advice, segment, utils, recommender


app = Flask(__name__)
CORS(app)
logger = logging.getLogger(__name__)


@app.get("/api/ping")
def ping() -> tuple[dict[str, str], int]:
    """Basic health-check endpoint."""
    return {"status": "ok"}, 200


@app.get("/api/analyze")
def api_analyze():
    """Return KPI summary."""
    try:
        tables = utils.load_dataframes()
        summary = analyzer.compute_kpis(tables)
        return jsonify(summary)
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": str(exc)}), 500


@app.get("/api/forecast")
def api_forecast():
    """Return 30-day revenue forecast."""
    try:
        days = int(request.args.get("days", 30))
        tables = utils.load_dataframes()
        revenue_daily = analyzer.daily_revenue(tables)
        forecast_payload = forecast.forecast_revenue(revenue_daily, periods=days)
        return jsonify(forecast_payload)
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": str(exc)}), 500



@app.get("/api/recommendation/kpi")
def api_recommendation_kpi():
    """Return KPI summary for an optional recent window (days)."""
    try:
        window = int(request.args.get("window", 30))
        tables = utils.load_dataframes()
        summary = analyzer.compute_kpis_window(tables, window_days=window)
        return jsonify(summary)
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": str(exc)}), 500


@app.get("/api/segment")
def api_segment():
    """Return customer segmentation based on RFM."""
    try:
        tables = utils.load_dataframes()
        data = segment.segment_customers(tables)
        return jsonify(data)
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": str(exc)}), 500


@app.get("/api/anomaly")
def api_anomaly():
    """Return anomaly detection results for revenue."""
    try:
        tables = utils.load_dataframes()
        revenue_daily = analyzer.daily_revenue(tables)
        anomalies = anomaly.detect_anomalies(revenue_daily)
        return jsonify(anomalies)
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": str(exc)}), 500


@app.post("/api/advice")
def api_advice():
    """Return AI-generated business advice using Gemini."""
    payload = request.get_json(silent=True) or {}
    try:
        if not payload:
            tables = utils.load_dataframes()
            kpis = analyzer.compute_kpis(tables)
            forecast_payload = forecast.forecast_revenue(analyzer.daily_revenue(tables))
            segments = segment.segment_customers(tables)
            anomalies = anomaly.detect_anomalies(analyzer.daily_revenue(tables))
            payload = {
                "kpi": kpis,
                "forecast": forecast_payload,
                "segments": segments,
                "anomaly": anomalies,
            }
        insights = gemini_advice.generate_insights(payload)
        return jsonify({"advice": insights})
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": str(exc)}), 500


def _run_recommendation_job(force_refresh: bool) -> Dict[str, Any]:
    """Execute the full analytics pipeline and export outputs."""
    try:
        logger.info("Starting recommendation analytics job")
        result = analyzer.run_recommendation(force_refresh=force_refresh)
        logger.info("Recommendation analytics job completed")
        return result
    except Exception as exc:  # noqa: BLE001
        logger.exception("Recommendation job failed: %s", exc)
        return {"error": str(exc)}


@app.post("/api/recommendation/run")
def api_recommendation_run():
    """Trigger the analytics job asynchronously."""
    payload = request.get_json(silent=True) or {}
    force_refresh = bool(payload.get("force_refresh", True))
    try:
        thread = threading.Thread(target=_run_recommendation_job, args=(force_refresh,), daemon=True)
        thread.start()
        return jsonify({"status": "started"}), 202
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to start recommendation job: %s", exc)
        return jsonify({"status": "error", "detail": str(exc)}), 500


@app.get("/api/recommendation/customer/<int:customer_id>")
def api_recommendation_customer(customer_id: int):
    """Return customer-specific recommendations (k query param)."""
    try:
        k = int(request.args.get("k", 6))
    except Exception:
        k = 6
    try:
        result = recommender.recommend_for_customer(customer_id, k=k)
        return jsonify(result), 200
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to compute recommendations for %s: %s", customer_id, exc)
        return jsonify({"error": str(exc)}), 500


@app.get("/api/recommendation/top-services")
def api_recommendation_top_services():
    try:
        limit = int(request.args.get("limit", 6))
    except Exception:
        limit = 6
    try:
        result = recommender.top_services(k=limit)
        return jsonify(result), 200
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to get top services: %s", exc)
        return jsonify({"error": str(exc)}), 500


@app.post("/api/recommendation/train")
def api_recommendation_train():
    payload = request.get_json(silent=True) or {}
    factors = int(payload.get("factors", 64))
    iterations = int(payload.get("iterations", 15))
    regularization = float(payload.get("regularization", 0.01))
    try:
        result = recommender.train_als(factors=factors, regularization=regularization, iterations=iterations)
        return jsonify(result), 200
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to train recommender: %s", exc)
        return jsonify({"ok": False, "error": str(exc)}), 500


@app.get("/api/recommendation/status")
def api_recommendation_status():
    """Return status of recommender (e.g., whether ALS model is loaded)."""
    try:
        status = recommender.model_status()
        return jsonify(status), 200
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to get recommender status: %s", exc)
        return jsonify({"ok": False, "error": str(exc)}), 500


@app.post("/api/recommendation/evaluate")
def api_recommendation_evaluate():
    """Run evaluation on the current ALS model (Precision@K)."""
    payload = request.get_json(silent=True) or {}
    try:
        k = int(payload.get("k", 6))
    except Exception:
        k = 6
    try:
        sample_users = payload.get("sample_users")
        if sample_users is not None:
            sample_users = int(sample_users)
        result = recommender.evaluate_model(k=k, sample_users=sample_users)
        return jsonify(result), 200
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to evaluate recommender: %s", exc)
        return jsonify({"ok": False, "error": str(exc)}), 500


if __name__ == "__main__":
    # Running with debug=True for local development convenience
    logging.basicConfig(level=logging.INFO)
    app.run(host="0.0.0.0", port=8000, debug=True)
