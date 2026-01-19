import sys
sys.path.append('/app')
import app.recommendation_adapter as ra
print('als_loaded', ra._ALS_MODEL is not None)
print('user_map_count', len(ra._USER_MAP) if ra._USER_MAP else 0)
print('item_map_count', len(ra._ITEM_MAP) if ra._ITEM_MAP else 0)
print('user 1 in map', '1' in ra._USER_MAP if ra._USER_MAP else False)
print('_USER_ITEMS', None if ra._USER_ITEMS is None else getattr(ra._USER_ITEMS, 'shape', repr(ra._USER_ITEMS)))
# also try recommending with both orientations
if ra._ALS_MODEL is not None:
    uid = ra._USER_MAP.get('1') if ra._USER_MAP else None
    print('mapped uid for 1 ->', uid)
    try:
        print('\nTrying recommend with _USER_ITEMS as-is (user x item):')
        print('model user_factors shape', ra._ALS_MODEL.user_factors.shape if hasattr(ra._ALS_MODEL, 'user_factors') else None)
        print('model item_factors shape', ra._ALS_MODEL.item_factors.shape if hasattr(ra._ALS_MODEL, 'item_factors') else None)
        recs = ra._ALS_MODEL.recommend(int(uid), ra._USER_ITEMS, N=6)
        print('recs:', recs)
    except Exception as e:
        print('error with user_items orientation:', type(e), e)
    # reconstruct item_user matrix by transposing
    try:
        # rebuild item-user matrix from interactions to ensure proper format (CSR)
        import pandas as pd
        import scipy.sparse as sps
        df = pd.read_csv('/app/backend/data/interactions.csv')
        df = df[df['customer_id'].notna() & df['service_id'].notna()].copy()
        df['customer_id'] = df['customer_id'].astype(int)
        df['service_id'] = df['service_id'].astype(int)
        rows = df['service_id'].map(lambda x: ra._ITEM_MAP.get(str(int(x))))
        cols = df['customer_id'].map(lambda x: ra._USER_MAP.get(str(int(x))))
        mask = rows.notna() & cols.notna()
        rows = rows[mask].astype(int).tolist()
        cols = cols[mask].astype(int).tolist()
        data = df.loc[mask, df.columns.intersection(['quantity'])].iloc[:,0].fillna(1).astype(float).tolist() if 'quantity' in df.columns else [1.0]*len(rows)
        mat = sps.coo_matrix((data,(rows,cols)), shape=(len(ra._ITEM_MAP), len(ra._USER_MAP)))
        item_user = mat.tocsr()
        print('\nTrying recommend with rebuilt item_user (item x user) CSR:')
        recs2 = ra._ALS_MODEL.recommend(int(uid), item_user, N=6)
        print('recs2:', recs2)
    except Exception as e:
        print('error with item_user orientation:', type(e), e)
else:
    print('ALS model not loaded, skipping recommend tests')
