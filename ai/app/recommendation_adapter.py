from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import os
import json
import pickle
import pandas as pd
from typing import Optional

try:
    import scipy.sparse as sps
    try:
        from implicit.als import AlternatingLeastSquares
        IMPLICIT_OK = True
    except Exception:
        AlternatingLeastSquares = None
        IMPLICIT_OK = False
except Exception:
    sps = None
    IMPLICIT_OK = False
    AlternatingLeastSquares = None


# Lightweight, self-contained recommendation endpoints. Adapter will attempt
# to load ALS artifacts from DATA_DIR/recommender and use ALS when available.
DATA_DIR = "/app/backend/data"
ARTIFACT_DIR = os.path.join(DATA_DIR, "recommender")

# ALS artifacts (populated by _try_load_als)
_ALS_MODEL = None
_USER_MAP = None
_ITEM_MAP = None
_USER_ITEMS = None


def _load_interactions() -> Optional[pd.DataFrame]:
    p = os.path.join(DATA_DIR, "interactions.csv")
    if not os.path.exists(p):
        return None
    try:
        df = pd.read_csv(p)
        return df
    except Exception:
        return None


def _load_services() -> Optional[pd.DataFrame]:
    p = os.path.join(DATA_DIR, "services.csv")
    if not os.path.exists(p):
        return None
    try:
        df = pd.read_csv(p)
        # normalize common column name variants to `id`, `name`, `price`
        colmap = {}
        if 'service_id' in df.columns and 'id' not in df.columns:
            colmap['service_id'] = 'id'
        if 'service_name' in df.columns and 'name' not in df.columns:
            colmap['service_name'] = 'name'
        if colmap:
            df = df.rename(columns=colmap)
        return df
    except Exception:
        return None


def _load_service_map() -> dict:
    """Load numeric->UUID mapping if present on disk.

    Returns a dict where keys are stringified numeric ids (e.g. '1') and
    values are UUID strings. If no file is found, returns empty dict.
    """
    candidates = [
        os.path.join(DATA_DIR, 'recommender', 'service_id_map.json'),
        os.path.join(DATA_DIR, 'service_id_map.json'),
        os.path.join('/app/recommendation_backend/data', 'service_id_map.json')
    ]
    for p in candidates:
        if os.path.exists(p):
            try:
                with open(p, 'r', encoding='utf-8') as fh:
                    return json.load(fh)
            except Exception:
                return {}
    return {}


def _try_load_als() -> bool:
    """Attempt to load saved ALS model and reconstruct user-items CSR.

    Returns True if ALS model and maps loaded successfully and user-items
    matrix constructed where possible.
    """
    global _ALS_MODEL, _USER_MAP, _ITEM_MAP, _USER_ITEMS
    if not IMPLICIT_OK or AlternatingLeastSquares is None:
        return False
    p_model = os.path.join(ARTIFACT_DIR, "als_model.pkl")
    p_user = os.path.join(ARTIFACT_DIR, "user_map.json")
    p_item = os.path.join(ARTIFACT_DIR, "item_map.json")
    if not (os.path.exists(p_model) and os.path.exists(p_user) and os.path.exists(p_item)):
        return False
    try:
        with open(p_model, "rb") as fh:
            _ALS_MODEL = pickle.load(fh)
        with open(p_user, "r", encoding="utf-8") as fh:
            _USER_MAP = json.load(fh)
        with open(p_item, "r", encoding="utf-8") as fh:
            _ITEM_MAP = json.load(fh)

        # reconstruct user-items CSR from interactions if available
        df = _load_interactions()
        if df is not None and _USER_MAP is not None and _ITEM_MAP is not None:
            try:
                df = df[df["customer_id"].notna() & df["service_id"].notna()].copy()
                df["customer_id"] = df["customer_id"].astype(int)
                df["service_id"] = df["service_id"].astype(int)
                rows = df["service_id"].map(lambda x: _ITEM_MAP.get(str(int(x))))
                cols = df["customer_id"].map(lambda x: _USER_MAP.get(str(int(x))))
                mask = rows.notna() & cols.notna()
                rows = rows[mask].astype(int).tolist()
                cols = cols[mask].astype(int).tolist()
                data = df.loc[mask, df.columns.intersection(["quantity"])].iloc[:, 0].fillna(1).astype(float).tolist() if "quantity" in df.columns else [1.0] * len(rows)
                if len(rows) > 0 and len(cols) > 0:
                    mat = sps.coo_matrix((data, (rows, cols)), shape=(len(_ITEM_MAP), len(_USER_MAP)))
                    try:
                        _USER_ITEMS = mat.tocsr().T.tocsr()
                    except Exception:
                        _USER_ITEMS = mat.tocsr().T
            except Exception:
                _USER_ITEMS = None

        return True
    except Exception:
        _ALS_MODEL = None
        _USER_MAP = None
        _ITEM_MAP = None
        _USER_ITEMS = None
        return False


# Try to load ALS at import time (best-effort)
_try_load_als()


def register_recommendation_routes(app: FastAPI) -> None:
    @app.get("/api/recommendation/status")
    def status():
        # report whether ALS model was loaded into adapter and include helpful diagnostics
        loaded = _ALS_MODEL is not None and _USER_MAP is not None and _ITEM_MAP is not None
        info = {
            "als_loaded": bool(loaded),
            "user_map_count": len(_USER_MAP) if _USER_MAP is not None else 0,
            "item_map_count": len(_ITEM_MAP) if _ITEM_MAP is not None else 0,
        }
        # include a quick check whether a common test id exists
        try:
            info["has_user_1"] = (str(1) in _USER_MAP) if _USER_MAP is not None else False
        except Exception:
            info["has_user_1"] = False
        return JSONResponse({"ok": True, "meta": info})

    @app.get("/api/recommendation/top-services")
    def top_services(limit: int = 6):
        df = _load_interactions()
        if df is None:
            return JSONResponse({"model": "error", "items": [], "error": "no_interactions"}, status_code=200)
        if "service_id" not in df.columns:
            return JSONResponse({"model": "error", "items": [], "error": "invalid_interactions"}, status_code=200)
        grouped = df.groupby("service_id")["quantity"].sum().reset_index().sort_values("quantity", ascending=False)
        svc_df = _load_services()
        out = []
        for _, row in grouped.head(limit).iterrows():
            sid = int(row["service_id"]) if not pd.isna(row["service_id"]) else None
            name = None
            price = None
            service_uuid = None
            if svc_df is not None and sid is not None:
                # prefer matching by numeric id column where present
                if "id" in svc_df.columns:
                    meta = svc_df[svc_df["id"] == sid]
                    if not meta.empty:
                        name = meta["name"].iloc[0] if "name" in meta.columns else None
                        price = int(meta["price"].iloc[0]) if "price" in meta.columns and pd.notna(meta["price"].iloc[0]) else None
                # try to attach uuid mapping if available
                smap = _load_service_map()
                service_uuid = smap.get(str(int(sid))) if smap else None
            out.append({"serviceId": sid, "serviceUuid": service_uuid, "serviceName": name, "price": price, "score": float(row.get("quantity", 0)), "reason": "popular"})
        return JSONResponse({"model": "popularity", "items": out})

    @app.get("/api/recommendation/customer/{customer_id}")
    def recommend_customer(customer_id: int, k: int = 6):
        df = _load_interactions()
        if df is None:
            return JSONResponse({"model": "error", "items": [], "error": "no_interactions"}, status_code=200)
        if "customer_id" not in df.columns or "service_id" not in df.columns:
            return JSONResponse({"model": "error", "items": [], "error": "invalid_interactions"}, status_code=200)

        # ensure numeric types
        df = df[df["customer_id"].notna() & df["service_id"].notna()].copy()
        df["customer_id"] = df["customer_id"].astype(int)
        df["service_id"] = df["service_id"].astype(int)

        purchased = df[df["customer_id"] == int(customer_id)]["service_id"].unique().tolist()
        svc_df = _load_services()

        # If ALS model + user/item maps and user-items matrix are available, try ALS first
        try:
            if _ALS_MODEL is not None and _USER_MAP is not None and _ITEM_MAP is not None and _USER_ITEMS is not None:
                uid = _USER_MAP.get(str(int(customer_id)))
                if uid is not None:
                    try:
                        # The saved ALS model may have been trained with maps in a
                        # different orientation (user_map vs item_map swapped).
                        # Inspect model factor shapes to decide which map
                        # corresponds to model.users and model.items.
                        n_model_users = _ALS_MODEL.user_factors.shape[0] if hasattr(_ALS_MODEL, "user_factors") else None
                        n_model_items = _ALS_MODEL.item_factors.shape[0] if hasattr(_ALS_MODEL, "item_factors") else None

                        # choose which saved map corresponds to model users/items
                        map_users = None
                        map_items = None
                        if n_model_users is not None and n_model_items is not None:
                            if _USER_MAP is not None and len(_USER_MAP) == n_model_users:
                                map_users = _USER_MAP
                                map_items = _ITEM_MAP
                            elif _ITEM_MAP is not None and len(_ITEM_MAP) == n_model_users:
                                map_users = _ITEM_MAP
                                map_items = _USER_MAP
                        # fallback to original naming
                        if map_users is None:
                            map_users = _USER_MAP
                            map_items = _ITEM_MAP

                        # rebuild an item x user CSR matrix matching model expectations
                        # where rows correspond to items in map_items and cols to users in map_users
                        df2 = df.copy()
                        rows_m = df2["service_id"].map(lambda x: map_items.get(str(int(x))) if map_items is not None else None)
                        cols_m = df2["customer_id"].map(lambda x: map_users.get(str(int(x))) if map_users is not None else None)
                        mask_m = rows_m.notna() & cols_m.notna()
                        rows_list = rows_m[mask_m].astype(int).tolist()
                        cols_list = cols_m[mask_m].astype(int).tolist()
                        data_list = df2.loc[mask_m, df2.columns.intersection(["quantity"])].iloc[:, 0].fillna(1).astype(float).tolist() if "quantity" in df2.columns else [1.0] * len(rows_list)
                        if len(rows_list) > 0 and len(cols_list) > 0:
                            mat = sps.coo_matrix((data_list, (rows_list, cols_list)), shape=(len(map_items), len(map_users)))
                            item_user_csr = mat.tocsr()
                            # determine the correct uid index in the chosen user map
                            mapped_uid = map_users.get(str(int(customer_id))) if map_users is not None else None
                            if mapped_uid is not None:
                                recs = _ALS_MODEL.recommend(int(mapped_uid), item_user_csr, N=k)
                                inv_item = {int(idx): int(orig) for orig, idx in map_items.items()} if map_items else {}
                                items = []
                                for item_idx, score in recs:
                                    orig_sid = inv_item.get(int(item_idx))
                                    if orig_sid is None:
                                        continue
                                    name = None
                                    price = None
                                    if svc_df is not None and "id" in svc_df.columns:
                                        meta = svc_df[svc_df["id"] == orig_sid]
                                        if not meta.empty:
                                            name = meta["name"].iloc[0] if "name" in meta.columns else None
                                            price = int(meta["price"].iloc[0]) if "price" in meta.columns and pd.notna(meta["price"].iloc[0]) else None
                                    items.append({"serviceId": orig_sid, "serviceName": name, "price": price, "score": float(score), "reason": "als"})
                                    if len(items) >= k:
                                        break
                                if items:
                                    return JSONResponse({"model": "als", "items": items})
                    except Exception:
                        # fall back to cooccurrence below
                        pass
        except Exception:
            pass
        if len(purchased) == 0:
            # fallback to popularity
            return top_services(limit=k)

        others = df[df["service_id"].isin(purchased) & (df["customer_id"] != int(customer_id))]
        if others.empty:
            return top_services(limit=k)

        candidate = df[df["customer_id"].isin(others["customer_id"].unique())]
        candidate = candidate[~candidate["service_id"].isin(purchased)]
        agg = candidate.groupby("service_id")["quantity"].sum().reset_index().sort_values("quantity", ascending=False)

        results = []
        for _, row in agg.head(k * 3).iterrows():
            sid = int(row["service_id"]) if not pd.isna(row["service_id"]) else None
            name = None
            price = None
            service_uuid = None
            if svc_df is not None and sid is not None:
                if "id" in svc_df.columns:
                    meta = svc_df[svc_df["id"] == sid]
                    if not meta.empty:
                        name = meta["name"].iloc[0] if "name" in meta.columns else None
                        price = int(meta["price"].iloc[0]) if "price" in meta.columns and pd.notna(meta["price"].iloc[0]) else None
                smap = _load_service_map()
                service_uuid = smap.get(str(int(sid))) if smap else None
            results.append({"serviceId": sid, "serviceUuid": service_uuid, "serviceName": name, "price": price, "score": float(row.get("quantity", 0)), "reason": "cooccurrence"})

        # dedupe preserving order
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
            # ensure we extract a list of item dicts from the popularity helper
            pop = top_services(limit=k)
            pop_items = []
            try:
                # JSONResponse from FastAPI may have .body as bytes
                if hasattr(pop, 'body') and pop.body:
                    try:
                        pop_items = json.loads(pop.body.decode('utf-8')).get('items', [])
                    except Exception:
                        pop_items = []
                elif isinstance(pop, dict):
                    pop_items = pop.get('items', [])
            except Exception:
                pop_items = []

            for p in pop_items:
                if not isinstance(p, dict):
                    continue
                pid = p.get("serviceId")
                if pid not in seen:
                    items.append(p)
                    seen.add(pid)
                if len(items) >= k:
                    break

        return JSONResponse({"model": "cooccurrence", "items": items})

    @app.post("/api/recommendation/train")
    async def train(request: Request):
        # Training with implicit ALS is not supported by this lightweight adapter.
        return JSONResponse({"ok": False, "error": "training_not_supported_in_adapter"}, status_code=200)

    @app.get("/api/recommendation/service-map")
    def service_map():
        # Return numeric->UUID mapping for services so frontend can map seq ids to real service ids
        candidates = [
            os.path.join(DATA_DIR, 'recommender', 'service_id_map.json'),
            os.path.join(DATA_DIR, 'service_id_map.json'),
            os.path.join('/app/recommendation_backend/data', 'service_id_map.json')
        ]
        p = None
        for c in candidates:
            if os.path.exists(c):
                p = c
                break
        if p is None:
            return JSONResponse({"ok": False, "error": "no_service_map"}, status_code=200)
        try:
            with open(p, 'r', encoding='utf-8') as fh:
                mapping = json.load(fh)
        except Exception:
            return JSONResponse({"ok": False, "error": "invalid_service_map"}, status_code=200)
        return JSONResponse({"ok": True, "map": mapping})

    @app.get("/api/recommendation/service/{service_id}")
    def recommend_by_service(service_id: int, k: int = 6):
        # Return top co-occurring services for a given service_id using precomputed mapping
        art = os.path.join(DATA_DIR, 'recommender', 'service_cooccurrence.json')
        if not os.path.exists(art):
            return JSONResponse({"model": "error", "items": [], "error": "no_cooccurrence_artifacts"}, status_code=200)
        try:
            with open(art, 'r', encoding='utf-8') as fh:
                mapping = json.load(fh)
        except Exception:
            return JSONResponse({"model": "error", "items": [], "error": "invalid_cooccurrence_artifacts"}, status_code=200)

        svc_df = _load_services()
        entries = mapping.get(str(int(service_id))) or mapping.get(int(service_id)) or []
        out = []
        for e in entries[:k]:
            sid = e.get('serviceId')
            score = e.get('score')
            name = None
            price = None
            service_uuid = None
            if svc_df is not None and sid is not None:
                if 'id' in svc_df.columns:
                    meta = svc_df[svc_df['id'] == int(sid)]
                    if not meta.empty:
                        name = meta['name'].iloc[0] if 'name' in meta.columns else None
                        price = int(meta['price'].iloc[0]) if 'price' in meta.columns and pd.notna(meta['price'].iloc[0]) else None
                smap = _load_service_map()
                service_uuid = smap.get(str(int(sid))) if smap else None
            out.append({"serviceId": int(sid) if sid is not None else None, "serviceUuid": service_uuid, "serviceName": name, "price": price, "score": float(score), "reason": "cooccurrence"})

        return JSONResponse({"model": "cooccurrence", "items": out})

    @app.get("/api/recommendation/admin/stats")
    def admin_stats():
        """Admin endpoint: system stats (interactions count, services count, cooccurrence entries, ALS status)"""
        df_int = _load_interactions()
        df_svc = _load_services()
        cooc_path = os.path.join(DATA_DIR, "recommender", "service_cooccurrence.json")
        cooc_count = 0
        if os.path.exists(cooc_path):
            try:
                with open(cooc_path, 'r', encoding='utf-8') as fh:
                    cooc = json.load(fh)
                    cooc_count = sum(len(v) for v in cooc.values()) if isinstance(cooc, dict) else 0
            except Exception:
                pass
        
        return JSONResponse({
            "ok": True,
            "interactions_count": len(df_int) if df_int is not None else 0,
            "services_count": len(df_svc) if df_svc is not None else 0,
            "cooccurrence_pairs": cooc_count,
            "als_loaded": _ALS_MODEL is not None,
            "user_map_size": len(_USER_MAP) if _USER_MAP else 0,
            "item_map_size": len(_ITEM_MAP) if _ITEM_MAP else 0
        })

    @app.get("/api/recommendation/admin/top-services")
    def admin_top_services(k: int = 20):
        """Admin endpoint: top K services by interaction count"""
        df = _load_interactions()
        if df is None or df.empty:
            return JSONResponse({"ok": True, "items": []})
        
        svc_df = _load_services()
        smap = _load_service_map()
        
        top = df.groupby("service_id").size().reset_index(name="count").sort_values("count", ascending=False).head(k)
        items = []
        for _, row in top.iterrows():
            sid = int(row["service_id"])
            count = int(row["count"])
            name = None
            price = None
            if svc_df is not None and 'id' in svc_df.columns and 'name' in svc_df.columns:
                meta = svc_df[svc_df['id'] == sid]
                if not meta.empty:
                    name = meta['name'].iloc[0]
                    price = int(meta['price'].iloc[0]) if 'price' in meta.columns and pd.notna(meta['price'].iloc[0]) else None
            
            service_uuid = smap.get(str(sid)) if smap else None
            items.append({
                "serviceId": sid,
                "serviceUuid": service_uuid,
                "serviceName": name,
                "price": price,
                "count": count
            })
        
        return JSONResponse({"ok": True, "items": items})

    @app.get("/api/recommendation/admin/cooccurrence-pairs")
    def admin_cooccurrence_pairs(limit: int = 50):
        """Admin endpoint: top co-occurrence pairs (service A -> service B with score)"""
        cooc_path = os.path.join(DATA_DIR, "recommender", "service_cooccurrence.json")
        if not os.path.exists(cooc_path):
            return JSONResponse({"ok": True, "pairs": []})
        
        try:
            with open(cooc_path, 'r', encoding='utf-8') as fh:
                cooc = json.load(fh)
        except Exception:
            return JSONResponse({"ok": True, "pairs": []})
        
        svc_df = _load_services()
        smap = _load_service_map()
        
        # flatten to list of (serviceA, serviceB, score)
        pairs = []
        for svc_a_str, targets in cooc.items():
            svc_a = int(svc_a_str)
            for entry in targets:
                svc_b = entry.get("serviceId")
                score = entry.get("score", 0)
                if svc_b is not None:
                    pairs.append({"serviceA": svc_a, "serviceB": int(svc_b), "score": float(score)})
        
        # sort by score desc and take top limit
        pairs.sort(key=lambda x: x["score"], reverse=True)
        pairs = pairs[:limit]
        
        # enrich with names
        for p in pairs:
            for key in ["serviceA", "serviceB"]:
                sid = p[key]
                name = None
                uuid_val = None
                if svc_df is not None and 'id' in svc_df.columns and 'name' in svc_df.columns:
                    meta = svc_df[svc_df['id'] == sid]
                    if not meta.empty:
                        name = meta['name'].iloc[0]
                uuid_val = smap.get(str(sid)) if smap else None
                p[f"{key}Name"] = name
                p[f"{key}Uuid"] = uuid_val
        
        return JSONResponse({"ok": True, "pairs": pairs})

    @app.post("/api/recommendation/admin/retrain")
    def admin_retrain():
        """Admin endpoint: trigger retrain of recommendation models (regenerate cooccurrence + ALS if possible)"""
        # This is a placeholder — actual retrain logic should run the Python scripts
        # For now, return a mock response indicating retrain was triggered
        return JSONResponse({
            "ok": True,
            "message": "Retrain triggered (placeholder). Run recommendation/backend/train_all.py manually to regenerate artifacts."
        })
