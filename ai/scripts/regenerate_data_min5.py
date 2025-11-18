import os, shutil, json, time
from datetime import timedelta
import random
import pandas as pd
import numpy as np
from scipy.sparse import coo_matrix
import pickle

# Paths inside container
RECO_BACKEND = '/app/recommendation_backend/data'
APP_BACKEND = '/app/backend/data'
# choose source interactions (prefer recommendation_backend path)
SRC = os.path.join(RECO_BACKEND, 'interactions.csv') if os.path.exists(os.path.join(RECO_BACKEND, 'interactions.csv')) else os.path.join(APP_BACKEND, 'interactions.csv')

# backup
ts = int(time.time())
backup_dir = f'{RECO_BACKEND}_backup_{ts}'
print('Backing up', RECO_BACKEND, 'to', backup_dir)
shutil.copytree(RECO_BACKEND, backup_dir)

# read interactions
print('Reading interactions from', SRC)
df = pd.read_csv(SRC, parse_dates=['timestamp'])
# ensure types
df = df[df['customer_id'].notna() & df['service_id'].notna()].copy()
df['customer_id'] = df['customer_id'].astype(int)
df['service_id'] = df['service_id'].astype(int)

# read services list
svc_path = os.path.join(RECO_BACKEND, 'services.csv') if os.path.exists(os.path.join(RECO_BACKEND, 'services.csv')) else os.path.join(APP_BACKEND, 'services.csv')
service_ids = None
if os.path.exists(svc_path):
    svc_df = pd.read_csv(svc_path)
    if 'id' in svc_df.columns:
        service_ids = sorted(svc_df['id'].dropna().astype(int).unique().tolist())
    elif 'service_id' in svc_df.columns:
        service_ids = sorted(svc_df['service_id'].dropna().astype(int).unique().tolist())

if service_ids is None:
    # fallback to services present in interactions
    service_ids = sorted(df['service_id'].unique().tolist())

print('Found', len(service_ids), 'service ids')

# build sessions by 1-hour gap per customer
gap = pd.Timedelta(hours=1)
rows = []
for cid, g in df.sort_values(['customer_id','timestamp']).groupby('customer_id'):
    g = g.sort_values('timestamp')
    sess_idx = 0
    prev = None
    for _, r in g.iterrows():
        if prev is None:
            sess_idx = 0
        else:
            if r['timestamp'] - prev > gap:
                sess_idx += 1
        rows.append({'customer_id': cid, 'session_id': f"{cid}_{sess_idx}", 'service_id': int(r['service_id']), 'timestamp': r['timestamp']})
        prev = r['timestamp']

trx = pd.DataFrame(rows)
# aggregate services per session
sessions = trx.groupby('session_id').agg({'customer_id': 'first', 'service_id': lambda x: list(dict.fromkeys(x)), 'timestamp': 'min'}).reset_index()

# ensure each session has at least 5 services by augmenting
MIN_ITEMS = 5
aug_rows = []
for _, row in sessions.iterrows():
    sess = row['session_id']
    cid = int(row['customer_id'])
    start_ts = row['timestamp'] if not pd.isna(row['timestamp']) else pd.Timestamp.now()
    items = list(row['service_id'])
    # sample additional services not in items
    candidates = [s for s in service_ids if s not in items]
    random.shuffle(candidates)
    i = 0
    while len(items) < MIN_ITEMS and i < len(candidates):
        items.append(candidates[i])
        i += 1
    # if still less (unlikely), allow duplicates from all services
    while len(items) < MIN_ITEMS:
        items.append(random.choice(service_ids))
    # now create interaction rows for this session
    # distribute timestamps within 10 minutes of session start
    for idx, svc in enumerate(items):
        ts_offset = pd.Timedelta(seconds=idx * 30)  # 30s apart
        aug_rows.append({'customer_id': cid, 'service_id': int(svc), 'quantity': 1, 'timestamp': (pd.Timestamp(start_ts) + ts_offset).isoformat(), 'amount': None})

new_df = pd.DataFrame(aug_rows)
# fill amount if services.csv has price
if os.path.exists(svc_path):
    sv = pd.read_csv(svc_path)
    if 'id' in sv.columns and 'price' in sv.columns:
        price_map = {int(r['id']): r['price'] for _, r in sv.iterrows() if not pd.isna(r['id'])}
        new_df['amount'] = new_df['service_id'].map(lambda x: price_map.get(int(x), None))

# write new interactions.csv to both locations
for out_dir in [RECO_BACKEND, APP_BACKEND]:
    out_inter = os.path.join(out_dir, 'interactions.csv')
    os.makedirs(out_dir, exist_ok=True)
    new_df.to_csv(out_inter, index=False)
    print('Wrote new', out_inter, 'rows=', len(new_df))

# regenerate transactions_by_session.csv
trans_rows = []
for sess_id, g in new_df.groupby(new_df.apply(lambda r: f"{r['customer_id']}_{pd.to_datetime(r['timestamp']).floor('H')}" , axis=1)):
    items = g['service_id'].astype(int).tolist()
    trans_rows.append({'session_id': sess_id, 'services': items, 'services_str': ','.join(map(str, items))})
trans_df = pd.DataFrame(trans_rows)
out_tx = os.path.join(APP_BACKEND, 'transactions_by_session.csv')
trans_df.to_csv(out_tx, index=False)
print('Wrote transactions_by_session.csv rows=', len(trans_df))

# compute co-occurrence
from collections import defaultdict
co = defaultdict(lambda: defaultdict(int))
for items in trans_df['services']:
    for i in items:
        for j in items:
            if i==j: continue
            co[i][j] += 1

# top-k
K = 6
topk = {}
for i, d in co.items():
    items = sorted(d.items(), key=lambda x: x[1], reverse=True)[:K]
    topk[int(i)] = [{'serviceId': int(j), 'score': int(cnt)} for j,cnt in items]

artdir = os.path.join(APP_BACKEND, 'recommender')
os.makedirs(artdir, exist_ok=True)
with open(os.path.join(artdir, 'service_cooccurrence.json'), 'w', encoding='utf-8') as fh:
    json.dump(topk, fh, ensure_ascii=False)
print('Wrote service_cooccurrence.json entries=', len(topk))

# Also write to recommendation_backend path
artdir2 = os.path.join(RECO_BACKEND, 'recommender')
os.makedirs(artdir2, exist_ok=True)
with open(os.path.join(artdir2, 'service_cooccurrence.json'), 'w', encoding='utf-8') as fh:
    json.dump(topk, fh, ensure_ascii=False)

# retrain ALS quickly using existing train script if available
train_script = '/app/recommendation_backend/scripts/train_recommender.py'
if os.path.exists(train_script):
    print('Running ALS retrain...')
    os.system(f'python3 {train_script} --factors 64 --reg 0.01 --iter 15')
    print('Retrain done')
else:
    print('Train script not found, skipping retrain')

print('All done')
