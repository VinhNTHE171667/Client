"""Simple recommendation helpers.

Provides:
- recommend_for_customer(customer_id, k): co-occurrence based recommendations with popularity fallback
- top_services(k): top popular services
- train_als(...): optional ALS training when `implicit` is installed

This module intentionally keeps dependencies light and will fall back to
sample/demo behavior when MySQL or implicit aren't available.
"""
from __future__ import annotations

import json
import logging
import os
import pickle
from typing import Any, Dict, List, Optional

import pandas as pd

from . import utils

logger = logging.getLogger(__name__)

try:
    import scipy.sparse as sps
    from implicit.als import AlternatingLeastSquares
    IMPLICIT_OK = True
except Exception:
    IMPLICIT_OK = False

# possible persisted model artifacts
_MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "recommender")
_ALS_MODEL: Optional[AlternatingLeastSquares] = None
_USER_MAP: Optional[Dict[str, int]] = None
_ITEM_MAP: Optional[Dict[str, int]] = None
_TRAIN_MATRIX: Optional[sps.coo_matrix] = None
_USER_ITEMS = None  # csr matrix users x items


def _try_load_saved_model():
    """Attempt to load a saved ALS model and mappings from disk.

    Expected files under backend/data/recommender:
      - als_model.pkl
      - user_map.json
      - item_map.json
    If loaded, also construct the item-user sparse matrix from available data.
    """
    global _ALS_MODEL, _USER_MAP, _ITEM_MAP, _TRAIN_MATRIX, _USER_ITEMS
    try:
        if not IMPLICIT_OK:
            return False
        p_model = os.path.join(_MODEL_DIR, "als_model.pkl")
        p_user = os.path.join(_MODEL_DIR, "user_map.json")
        p_item = os.path.join(_MODEL_DIR, "item_map.json")
        if not (os.path.exists(p_model) and os.path.exists(p_user) and os.path.exists(p_item)):
            return False

        with open(p_model, "rb") as fh:
            _ALS_MODEL = pickle.load(fh)
        with open(p_user, "r", encoding="utf-8") as fh:
            _USER_MAP = json.load(fh)
        with open(p_item, "r", encoding="utf-8") as fh:
            _ITEM_MAP = json.load(fh)

        # build sparse item-user matrix from current interactions if available
        try:
            tables = utils.load_dataframes()
            merged = tables.invoice_detail.merge(tables.invoice[["id", "customer_id"]].rename(columns={"id": "invoice_id"}), on="invoice_id", how="left")
            # map to codes using maps
            rows = merged[merged.columns.intersection(["service_id"])].iloc[:, 0].map(lambda x: _ITEM_MAP.get(str(int(x))) if pd.notna(x) else None)
            cols = merged[merged.columns.intersection(["customer_id"])].iloc[:, 0].map(lambda x: _USER_MAP.get(str(int(x))) if pd.notna(x) else None)
            mask = rows.notna() & cols.notna()
            rows = rows[mask].astype(int).tolist()
            cols = cols[mask].astype(int).tolist()
            data = merged.loc[mask, merged.columns.intersection(["quantity"])].iloc[:, 0].fillna(1).astype(float).tolist()
            if len(rows) > 0 and len(cols) > 0:
                _TRAIN_MATRIX = sps.coo_matrix((data, (rows, cols)), shape=(len(_ITEM_MAP), len(_USER_MAP)))
                # ensure we expose a CSR matrix with rows = users and cols = items
                # implicit expects a CSR user-items matrix when calling recommend()
                try:
                    _USER_ITEMS = _TRAIN_MATRIX.tocsr().T.tocsr()
                except Exception:
                    _USER_ITEMS = _TRAIN_MATRIX.tocsr().T
        except Exception:
            # non-fatal: we can still serve recommendations using model if needed
            _TRAIN_MATRIX = None
            _USER_ITEMS = None
        return True
    except Exception as exc:
        logger.exception("Failed to load saved ALS model: %s", exc)
        _ALS_MODEL = None
        _USER_MAP = None
        _ITEM_MAP = None
        _TRAIN_MATRIX = None
        _USER_ITEMS = None
        return False


# try load at import time (best-effort)
_try_load_saved_model()


def _popularity_topk(tables: utils.DataFrames, k: int = 6) -> List[Dict[str, Any]]:
    df = tables.invoice_detail.copy()
    # normalised column names in utils: invoice_id, service_id, unit_price, quantity
    if "service_id" not in df.columns:
        df = utils._normalise_invoice_detail(df)
    grouped = df.groupby("service_id")["quantity"].sum().reset_index().sort_values("quantity", ascending=False)
    out = []
    srv = tables.service
    for _, row in grouped.head(k).iterrows():
        sid = int(row["service_id"]) if pd.notna(row["service_id"]) else None
        meta = srv[srv["id"] == sid]
        name = meta["name"].iloc[0] if not meta.empty and "name" in meta.columns else None
        price = int(meta["price"].iloc[0]) if not meta.empty and "price" in meta.columns else None
        out.append({"serviceId": sid, "serviceName": name, "price": price, "score": float(row["quantity"]), "reason": "popular"})
    return out


def recommend_for_customer(customer_id: int | str, k: int = 6) -> Dict[str, Any]:
    """Recommend up to k services for a customer using co-occurrence.

    Algorithm (simple):
    - Build a table of (customer_id, service_id) from invoice + invoice_detail
    - Find services the target customer has consumed
    - Find other customers who consumed the same services and aggregate other services they consumed
    - Rank by aggregated counts and return top-k excluding already consumed
    """
    try:
        tables = utils.load_dataframes()

        inv = tables.invoice.copy()
        invd = tables.invoice_detail.copy()

        # ensure normalised columns
        inv = inv.rename(columns={c: c.lower() for c in inv.columns})
        if "customer_id" not in inv.columns and "customerId" in inv.columns:
            inv = utils._normalise_invoice(inv)

        invd = invd.rename(columns={c: c.lower() for c in invd.columns})
        if "service_id" not in invd.columns:
            invd = utils._normalise_invoice_detail(invd)

        merged = invd.merge(inv[["id", "customer_id"]].rename(columns={"id": "invoice_id"}), how="left", left_on="invoice_id", right_on="invoice_id")

        # convert customer_id/service_id to int when possible
        merged["customer_id"] = merged["customer_id"].apply(lambda v: int(v) if pd.notna(v) else v)
        merged["service_id"] = merged["service_id"].apply(lambda v: int(v) if pd.notna(v) else v)

        target = int(customer_id)

        # If an ALS model is loaded, prefer ALS-based personalized recommendations
        try:
            if _ALS_MODEL is not None and _USER_MAP is not None and _ITEM_MAP is not None and _USER_ITEMS is not None:
                # user map keys are strings (we saved json), ensure we lookup as str
                uid = _USER_MAP.get(str(target))
                if uid is not None:
                    # model.recommend returns list of (item_idx, score)
                    recs = _ALS_MODEL.recommend(uid, _USER_ITEMS, N=k)
                    # invert item_map to get original service ids
                    inv_item = {int(int(v)): int(k) for k, v in _ITEM_MAP.items()} if _ITEM_MAP else {}
                    svc = tables.service
                    items = []
                    for item_idx, score in recs:
                        orig_sid = inv_item.get(int(item_idx))
                        if orig_sid is None:
                            continue
                        meta = svc[svc["id"] == orig_sid]
                        name = meta["name"].iloc[0] if not meta.empty and "name" in meta.columns else None
                        price = int(meta["price"].iloc[0]) if not meta.empty and "price" in meta.columns else None
                        items.append({"serviceId": orig_sid, "serviceName": name, "price": price, "score": float(score), "reason": "als"})
                        if len(items) >= k:
                            break
                    if items:
                        return {"model": "als", "items": items, "issuedAt": pd.Timestamp.now().isoformat()}
        except Exception:
            # fallback to co-occurrence if ALS fails
            logger.exception("ALS recommendation attempt failed, falling back to co-occurrence/popularity")

        purchased = merged[merged["customer_id"] == target]["service_id"].dropna().unique().tolist()

        if len(purchased) == 0:
            # fallback: popular
            items = _popularity_topk(tables, k)
            return {"model": "popularity_fallback", "items": items, "issuedAt": pd.Timestamp.now().isoformat()}

        # other rows from customers who bought same services
        others = merged[merged["service_id"].isin(purchased) & (merged["customer_id"] != target)]

        if others.empty:
            items = _popularity_topk(tables, k)
            return {"model": "popularity_fallback", "items": items, "issuedAt": pd.Timestamp.now().isoformat()}

        # aggregate other services these customers bought
        candidate = merged[merged["customer_id"].isin(others["customer_id"].unique())]
        candidate = candidate[~candidate["service_id"].isin(purchased)]
        agg = candidate.groupby("service_id")["quantity"].sum().reset_index().sort_values("quantity", ascending=False)

        # attach metadata from service table
        svc = tables.service
        results = []
        for _, row in agg.head(k * 3).iterrows():
            sid = int(row["service_id"]) if pd.notna(row["service_id"]) else None
            meta = svc[svc["id"] == sid]
            name = meta["name"].iloc[0] if not meta.empty and "name" in meta.columns else None
            price = int(meta["price"].iloc[0]) if not meta.empty and "price" in meta.columns else None
            results.append({"serviceId": sid, "serviceName": name, "price": price, "score": float(row.get("quantity", 0)), "reason": "cooccurrence"})

        # dedupe by serviceId preserving order
        seen = set()
        items = []
        for it in results:
            sid = it.get("serviceId")
            if sid in seen:
                continue
            seen.add(sid)
            items.append(it)
            if len(items) >= k:
                break

        if len(items) < k:
            # pad with popularity
            pop = _popularity_topk(tables, k)
            for p in pop:
                if p["serviceId"] not in seen:
                    items.append(p)
                    seen.add(p["serviceId"])
                if len(items) >= k:
                    break

        return {"model": "cooccurrence", "items": items, "issuedAt": pd.Timestamp.now().isoformat()}

    except Exception as exc:  # pragma: no cover
        logger.exception("recommend_for_customer failed: %s", exc)
        return {"model": "error", "items": [], "error": str(exc)}


def top_services(k: int = 6) -> Dict[str, Any]:
    try:
        tables = utils.load_dataframes()
        items = _popularity_topk(tables, k)
        return {"model": "popularity", "items": items, "issuedAt": pd.Timestamp.now().isoformat()}
    except Exception as exc:  # pragma: no cover
        logger.exception("top_services failed: %s", exc)
        return {"model": "error", "items": [], "error": str(exc)}


def train_als(factors: int = 64, regularization: float = 0.01, iterations: int = 15) -> Dict[str, Any]:
    """Train an implicit ALS model if available. Saves a pickled model in recommendation/data/model.json as a placeholder.

    If `implicit` isn't installed, return an informative message.
    """
    if not IMPLICIT_OK:
        return {"ok": False, "error": "implicit_not_installed"}

    try:
        # load interactions
        tables = utils.load_dataframes()
        merged = tables.invoice_detail.merge(tables.invoice[["id", "customer_id"]].rename(columns={"id": "invoice_id"}), on="invoice_id", how="left")

        # ensure numeric ids
        merged = merged[merged["customer_id"].notna() & merged["service_id"].notna()].copy()
        merged["customer_id"] = merged["customer_id"].astype(int)
        merged["service_id"] = merged["service_id"].astype(int)

        # build maps (original id -> index)
        user_ids = merged["customer_id"].unique().tolist()
        item_ids = merged["service_id"].unique().tolist()
        user_map = {str(u): i for i, u in enumerate(user_ids)}
        item_map = {str(s): i for i, s in enumerate(item_ids)}

        # build sparse item-user matrix expected by implicit (items x users)
        rows = merged["service_id"].map(lambda x: item_map.get(str(int(x))))
        cols = merged["customer_id"].map(lambda x: user_map.get(str(int(x))))
        data = merged.get("quantity", pd.Series(1, index=merged.index)).fillna(1).astype(float)
        mat = sps.coo_matrix((data, (rows, cols)), shape=(len(item_map), len(user_map)))

        model = AlternatingLeastSquares(factors=factors, regularization=regularization, iterations=iterations)
        model.fit(mat)

        # persist artifacts
        os.makedirs(_MODEL_DIR, exist_ok=True)
        with open(os.path.join(_MODEL_DIR, "als_model.pkl"), "wb") as fh:
            pickle.dump(model, fh)
        with open(os.path.join(_MODEL_DIR, "user_map.json"), "w", encoding="utf-8") as fh:
            json.dump(user_map, fh, ensure_ascii=False)
        with open(os.path.join(_MODEL_DIR, "item_map.json"), "w", encoding="utf-8") as fh:
            json.dump(item_map, fh, ensure_ascii=False)
        with open(os.path.join(_MODEL_DIR, "meta.json"), "w", encoding="utf-8") as fh:
            json.dump({"factors": factors, "regularization": regularization, "iterations": iterations}, fh)

        # update in-memory globals
        global _ALS_MODEL, _USER_MAP, _ITEM_MAP, _TRAIN_MATRIX, _USER_ITEMS
        _ALS_MODEL = model
        _USER_MAP = user_map
        _ITEM_MAP = item_map
        _TRAIN_MATRIX = mat
        try:
            # transpose then convert to CSR so rows == users, cols == items and type is csr
            _USER_ITEMS = _TRAIN_MATRIX.tocsr().T.tocsr()
        except Exception:
            _USER_ITEMS = None

        return {"ok": True, "detail": "trained_and_saved", "meta": {"factors": factors, "iterations": iterations}}
    except Exception as exc:
        logger.exception("train_als failed: %s", exc)
        return {"ok": False, "error": str(exc)}


def evaluate_model(k: int = 6, sample_users: int | None = 500) -> Dict[str, Any]:
    """Evaluate the currently loaded ALS model using a simple last-item holdout per user.

    Returns Precision@K and coverage. If ALS isn't available, returns an informative error.
    """
    if not IMPLICIT_OK:
        return {"ok": False, "error": "implicit_not_installed"}
    if _ALS_MODEL is None or _USER_MAP is None or _ITEM_MAP is None:
        return {"ok": False, "error": "model_not_loaded"}

    try:
        tables = utils.load_dataframes()
        merged = tables.invoice_detail.merge(tables.invoice[["id", "customer_id", "date" ]].rename(columns={"id": "invoice_id"}), on="invoice_id", how="left") if "date" in tables.invoice.columns else tables.invoice_detail.merge(tables.invoice[["id", "customer_id"]].rename(columns={"id": "invoice_id"}), on="invoice_id", how="left")
        merged = merged[merged["customer_id"].notna() & merged["service_id"].notna()].copy()
        merged["customer_id"] = merged["customer_id"].astype(int)
        merged["service_id"] = merged["service_id"].astype(int)

        # group interactions per user and hold out the last interaction (by date if present)
        if "date" in merged.columns or "timestamp" in merged.columns:
            time_col = "date" if "date" in merged.columns else "timestamp"
            merged[time_col] = pd.to_datetime(merged[time_col], errors="coerce")
            merged = merged.sort_values(["customer_id", time_col])
            test_idx = merged.groupby("customer_id").tail(1).index
        else:
            # fallback: random holdout per user
            test_idx = merged.groupby("customer_id").tail(1).index

        test = merged.loc[test_idx]
        train = merged.drop(index=test_idx)

        users = test["customer_id"].unique().tolist()
        if sample_users is not None and len(users) > sample_users:
            users = list(pd.Series(users).sample(sample_users, random_state=42))

        hits = 0
        total = 0
        inv_item = {int(v): int(k) for k, v in _ITEM_MAP.items()} if _ITEM_MAP else {}

        for u in users:
            uid = _USER_MAP.get(str(u))
            if uid is None:
                continue
            try:
                recs = _ALS_MODEL.recommend(uid, _USER_ITEMS, N=k)
            except Exception:
                continue
            rec_item_ids = [inv_item.get(int(item_idx)) for item_idx, _ in recs]
            # ground truth items in test for this user
            truth = test[test["customer_id"] == u]["service_id"].unique().tolist()
            if len(truth) == 0:
                continue
            total += 1
            if any(t in rec_item_ids for t in truth):
                hits += 1

        precision_at_k = hits / total if total > 0 else 0.0
        return {"ok": True, "precision_at_k": precision_at_k, "evaluated_users": total}
    except Exception as exc:
        logger.exception("evaluate_model failed: %s", exc)
        return {"ok": False, "error": str(exc)}


def model_status() -> Dict[str, Any]:
    """Return status of ALS model (loaded or not) and basic metadata."""
    ok = _ALS_MODEL is not None and _USER_MAP is not None and _ITEM_MAP is not None
    meta = {"als_loaded": bool(ok)}
    try:
        meta_path = os.path.join(_MODEL_DIR, "meta.json")
        if os.path.exists(meta_path):
            with open(meta_path, "r", encoding="utf-8") as fh:
                meta.update(json.load(fh))
    except Exception:
        pass
    return {"ok": True, "meta": meta}
