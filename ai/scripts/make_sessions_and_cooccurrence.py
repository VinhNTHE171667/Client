import os, json
import pandas as pd
from collections import defaultdict
from datetime import timedelta

p='/app/recommendation_backend/data/interactions.csv'
if not os.path.exists(p):
    p='/app/backend/data/interactions.csv'

print('reading', p)
df=pd.read_csv(p, parse_dates=['timestamp'])
df=df.sort_values(['customer_id','timestamp'])
# session gap 1 hour
gap = pd.Timedelta(hours=1)
rows=[]
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
        rows.append({'customer_id': cid, 'session_id': f"{cid}_{sess_idx}", 'service_id': int(r['service_id'])})
        prev = r['timestamp']
trx = pd.DataFrame(rows)
# aggregate services per session
sessions = trx.groupby('session_id')['service_id'].apply(lambda x: list(dict.fromkeys(x))).reset_index()
sessions['services_str'] = sessions['service_id'].apply(lambda lst: ','.join(map(str,lst)))
out_dir = '/app/backend/data'
os.makedirs(out_dir, exist_ok=True)
sessions.to_csv(os.path.join(out_dir,'transactions_by_session.csv'), index=False)
print('wrote transactions_by_session.csv rows=', len(sessions))
# compute co-occurrence counts
co = defaultdict(lambda: defaultdict(int))
for lst in sessions['service_id']:
    for i in lst:
        for j in lst:
            if i==j: continue
            co[i][j] += 1
# build top-K mapping
topk = {}
K=6
for i, d in co.items():
    items = sorted(d.items(), key=lambda x: x[1], reverse=True)[:K]
    topk[int(i)] = [{'serviceId': int(j),'score': int(cnt)} for j,cnt in items for j,cnt in [(j,cnt)]]
# save
artdir = '/app/backend/data/recommender'
os.makedirs(artdir, exist_ok=True)
with open(os.path.join(artdir,'service_cooccurrence.json'),'w',encoding='utf-8') as fh:
    json.dump(topk, fh, ensure_ascii=False)
print('wrote service_cooccurrence.json entries=', len(topk))
