"""Train an ALS recommender using `implicit` when available.

Produces model artifacts under backend/data/recommender/

Usage:
    python train_recommender.py

Requirements (install in backend env):
    pip install pandas scipy implicit scikit-learn
"""
from pathlib import Path
import json
import pickle
import time
import argparse

import numpy as np
import pandas as pd

try:
    from scipy.sparse import coo_matrix
    import implicit
    IMPLICIT_AVAILABLE = True
except Exception:
    IMPLICIT_AVAILABLE = False


DATA_DIR = Path(__file__).resolve().parents[1] / "data"
INTERACTIONS_CSV = DATA_DIR / "interactions.csv"
OUT_DIR = DATA_DIR / "recommender"
OUT_DIR.mkdir(parents=True, exist_ok=True)


def build_mappings(df):
    user_ids = df['customer_id'].unique().tolist()
    item_ids = df['service_id'].unique().tolist()
    user_map = {u: i for i, u in enumerate(user_ids)}
    item_map = {s: i for i, s in enumerate(item_ids)}
    return user_map, item_map


def make_sparse(df, user_map, item_map):
    rows = df['service_id'].map(item_map)
    cols = df['customer_id'].map(user_map)
    data = df['quantity'].astype(float)
    mat = coo_matrix((data, (rows, cols)), shape=(len(item_map), len(user_map)))
    return mat


def train_als(args):
    if not IMPLICIT_AVAILABLE:
        print("implicit or scipy not available. Install with: pip install implicit scipy")
        return

    df = pd.read_csv(INTERACTIONS_CSV)
    user_map, item_map = build_mappings(df)
    mat = make_sparse(df, user_map, item_map)

    print("Training ALS with implicit...\nitems x users shape:", mat.shape)
    model = implicit.als.AlternatingLeastSquares(factors=args.factors, regularization=args.reg, iterations=args.iter)
    start = time.time()
    # implicit expects item-user matrix
    model.fit(mat)
    print(f"Trained in {time.time()-start:.1f}s")

    # save model and maps
    with open(OUT_DIR / 'als_model.pkl', 'wb') as fh:
        pickle.dump(model, fh)
    with open(OUT_DIR / 'user_map.json', 'w', encoding='utf-8') as fh:
        json.dump(user_map, fh, ensure_ascii=False)
    with open(OUT_DIR / 'item_map.json', 'w', encoding='utf-8') as fh:
        json.dump(item_map, fh, ensure_ascii=False)
    with open(OUT_DIR / 'meta.json', 'w', encoding='utf-8') as fh:
        json.dump({'factors': args.factors, 'reg': args.reg, 'iter': args.iter}, fh)

    print(f"Saved model + maps to {OUT_DIR}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--factors', type=int, default=64)
    parser.add_argument('--reg', type=float, default=0.01)
    parser.add_argument('--iter', type=int, default=15)
    args = parser.parse_args()

    if not INTERACTIONS_CSV.exists():
        print(f"Interactions CSV not found at {INTERACTIONS_CSV}. Generate it first (gen_interactions.py) or export from DB.")
    else:
        train_als(args)
