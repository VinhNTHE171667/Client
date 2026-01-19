import os, json, random
import pandas as pd
from datetime import timedelta

# Read existing interactions (prefer recommendation_backend path)
paths = ['/app/recommendation_backend/data/interactions.csv', '/app/backend/data/interactions.csv']
src = None
for p in paths:
    if os.path.exists(p):
        src = p
        break
if src is None:
    raise SystemExit('interactions.csv not found')

bak = src + '.bak'
if not os.path.exists(bak):
    os.rename(src, bak)
    print('backed up', src, '->', bak)
else:
    print('backup already exists at', bak)

# load interactions from backup
df = pd.read_csv(bak, parse_dates=['timestamp'])
df = df.sort_values(['customer_id','timestamp'])

# load services available
svc_path = '/app/backend/data/services.csv'
if not os.path.exists(svc_path):
    svc_path = '/app/recommendation_backend/data/services.csv'
svc_df = pd.read_csv(svc_path) if os.path.exists(svc_path) else None
if svc_df is not None:
    # normalize common column names
    if 'service_id' in svc_df.columns and 'id' not in svc_df.columns:
        svc_df = svc_df.rename(columns={'service_id': 'id', 'service_name': 'name'})
    all_services = sorted(svc_df['id'].astype(int).tolist())
else:
    all_services = list(range(1,21))

# build sessions (1 hour gap)
gap = pd.Timedelta(hours=1)
rows = []
for cid, g in df.groupby('customer_id'):
    g = g.sort_values('timestamp').copy()
    sess_idx = 0
    prev = None
    for _, r in g.iterrows():
        if prev is None:
            sess_idx = 0
        else:
            if r['timestamp'] - prev > gap:
                sess_idx += 1
        rows.append({'customer_id': cid, 'session_id': f"{cid}_{sess_idx}", 'timestamp': r['timestamp'], 'service_id': int(r['service_id'])})
        prev = r['timestamp']
trx = pd.DataFrame(rows)

# aggregate per session
sessions = trx.groupby('session_id').agg({'customer_id':'first', 'timestamp':'min', 'service_id': lambda x: list(dict.fromkeys(x))}).reset_index()
sessions.columns = ['session_id','customer_id','timestamp','services']

# load existing cooccurrence mapping if exists to bias augmentation
co_path = '/app/backend/data/recommender/service_cooccurrence.json'
if not os.path.exists(co_path):
    co_path = '/app/recommendation_backend/data/recommender/service_cooccurrence.json'
co_map = {}
if os.path.exists(co_path):
    with open(co_path,'r',encoding='utf-8') as fh:
        try:
            co_map = json.load(fh)
        except Exception:
            co_map = {}

# augmentation: ensure each session has at least MIN_ITEMS distinct services
MIN_ITEMS = 5
random.seed(42)
augmented = []
for _, row in sessions.iterrows():
    svc_list = [int(s) for s in row['services']]
    needed = max(0, MIN_ITEMS - len(svc_list))
    if needed > 0:
        # try fill using cooccurrence of existing items
        candidates = []
        for s in svc_list:
            s_key = str(s)
            if s_key in co_map:
                candidates += [int(x['serviceId']) for x in co_map[s_key]]
        # remove already present
        candidates = [c for c in candidates if c not in svc_list]
        # if not enough, add random from all_services
        while len(svc_list) < MIN_ITEMS:
            if candidates:
                pick = candidates.pop(0)
            else:
                pick = random.choice([x for x in all_services if x not in svc_list])
            svc_list.append(int(pick))
    augmented.append({'session_id': row['session_id'], 'customer_id': int(row['customer_id']), 'timestamp': row['timestamp'], 'services': svc_list})

aug_df = pd.DataFrame(augmented)
print('sessions before:', len(sessions), 'after augment:', len(aug_df))

# expand back to interactions rows: distribute timestamps across services
new_rows = []
for _, r in aug_df.iterrows():
    base_ts = pd.to_datetime(r['timestamp'])
    for i, sid in enumerate(r['services']):
        # increment seconds slightly to keep order
        ts = base_ts + timedelta(seconds=i)
        new_rows.append({'customer_id': r['customer_id'], 'service_id': int(sid), 'quantity': 1, 'timestamp': ts.isoformat(), 'amount': None})

new_df = pd.DataFrame(new_rows)
# fill amount from services.csv if available
if svc_df is not None:
    price_map = {int(r['id']): r['price'] for _, r in svc_df.iterrows()}
    new_df['amount'] = new_df['service_id'].map(price_map)
else:
    new_df['amount'] = 0

# write new interactions to both paths
for p in paths:
    outdir = os.path.dirname(p)
    os.makedirs(outdir, exist_ok=True)
    new_df.to_csv(p, index=False)
    print('wrote new interactions to', p)

print('augmentation complete')
import os, json, random
import pandas as pd
from collections import defaultdict

# Paths
INTER_PATH = '/app/recommendation_backend/data/interactions.csv'
SERVICES_PATH = '/app/recommendation_backend/data/services.csv'
COOCC_PATH = '/app/backend/data/recommender/service_cooccurrence.json'
BACKUP_PATH = '/app/recommendation_backend/data/interactions_backup.csv'

# Parameters
MIN_PER_SESSION = 5
RANDOM_SEED = 42

random.seed(RANDOM_SEED)

# Load data
if not os.path.exists(INTER_PATH):
    raise SystemExit('interactions.csv not found at ' + INTER_PATH)

df = pd.read_csv(INTER_PATH, parse_dates=['timestamp'])
services_df = pd.read_csv(SERVICES_PATH) if os.path.exists(SERVICES_PATH) else None
if services_df is not None:
    # normalize column name for id
    if 'service_id' in services_df.columns and 'id' not in services_df.columns:
        services_df = services_df.rename(columns={'service_id': 'id', 'service_name': 'name'})

# load cooccurrence mapping if exists
co_map = {}
if os.path.exists(COOCC_PATH):
    with open(COOCC_PATH, 'r', encoding='utf-8') as fh:
        co_map = json.load(fh)

# recreate sessions (1 hour gap)
df = df.sort_values(['customer_id','timestamp'])

sessions = []
from pandas import Timedelta

gap = Timedelta(hours=1)
for cid, g in df.groupby('customer_id'):
    g = g.sort_values('timestamp').copy()
    sess_idx = 0
    prev = None
    sess_rows = []
    for _, r in g.iterrows():
        if prev is None:
            sess_idx = 0
        else:
            if r['timestamp'] - prev > gap:
                # flush previous session
                if sess_rows:
                    sessions.append({'customer_id': cid, 'session_id': f"{cid}_{sess_idx}", 'service_ids': sess_rows, 'first_ts': first_ts})
                sess_rows = []
                sess_idx += 1
        if not sess_rows:
            first_ts = r['timestamp']
        sess_rows.append(int(r['service_id']))
        prev = r['timestamp']
    if sess_rows:
        sessions.append({'customer_id': cid, 'session_id': f"{cid}_{sess_idx}", 'service_ids': sess_rows, 'first_ts': first_ts})

print('found', len(sessions), 'sessions')

# list of all service ids
all_services = services_df['id'].astype(int).tolist() if services_df is not None else sorted(set(df['service_id'].astype(int).tolist()))

# backup original interactions
if not os.path.exists(BACKUP_PATH):
    df.to_csv(BACKUP_PATH, index=False)
    print('backup created at', BACKUP_PATH)

new_rows = []
added_count = 0
for s in sessions:
    cur = list(dict.fromkeys(s['service_ids']))
    if len(cur) >= MIN_PER_SESSION:
        continue
    needed = MIN_PER_SESSION - len(cur)
    # candidate pool from cooccurrence of existing services
    candidates = []
    for sid in cur:
        key = str(sid)
        if key in co_map:
            for e in co_map[key]:
                candidates.append(int(e.get('serviceId')))
    # shuffle and dedupe preserving order
    cand_unique = [c for c in dict.fromkeys(candidates) if c not in cur]
    picks = []
    for c in cand_unique:
        if len(picks) >= needed:
            break
        picks.append(c)
    # if still need, sample random services not already in cur
    remaining_pool = [c for c in all_services if c not in cur and c not in picks]
    random.shuffle(remaining_pool)
    while len(picks) < needed and remaining_pool:
        picks.append(remaining_pool.pop())
    # create new interaction rows
    ts = s['first_ts']
    # spread added items by +1 second
    for i, new_sid in enumerate(picks):
        new_row = {
            'customer_id': s['customer_id'],
            'service_id': int(new_sid),
            'quantity': 1,
            'timestamp': (ts + pd.Timedelta(seconds= i + 1)).isoformat(),
            'amount': int(services_df[services_df['id']==int(new_sid)]['price'].iloc[0]) if services_df is not None and not services_df[services_df['id']==int(new_sid)].empty else 0
        }
        new_rows.append(new_row)
        added_count += 1

print('will add', added_count, 'new interactions')

if added_count > 0:
    df_new = pd.concat([df, pd.DataFrame(new_rows)], ignore_index=True)
    df_new.to_csv(INTER_PATH, index=False)
    print('wrote augmented interactions.csv with', len(df_new), 'rows')
else:
    print('no augmentation needed')

# also regenerate sessions file using existing script logic (simple write)
from collections import defaultdict
from pathlib import Path

trx_rows = []
for s in sessions:
    # recompute cur after addition
    # find rows in augmented df for this customer and session time window
    cid = s['customer_id']
    start = s['first_ts']
    end = start + gap
    df_c = df_new if added_count>0 else df
    sel = df_c[(df_c['customer_id']==cid) & (pd.to_datetime(df_c['timestamp'])>=start) & (pd.to_datetime(df_c['timestamp'])<end)]
    services_list = sel['service_id'].astype(int).tolist()
    services_list = list(dict.fromkeys(services_list))
    trx_rows.append({'session_id': s['session_id'], 'services': services_list})

out_path = '/app/backend/data/transactions_by_session_augmented.csv'
pd.DataFrame(trx_rows).to_csv(out_path, index=False)
print('wrote', out_path)
