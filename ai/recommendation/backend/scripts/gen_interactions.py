"""Generate synthetic interactions.csv from services.csv for training.

Output file: backend/data/interactions.csv with columns:
customer_id,service_id,quantity,timestamp,amount

This is intentionally simple: random customers, poisson-like purchase counts.
"""
import csv
import random
from datetime import datetime, timedelta
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
SERVICES_CSV = DATA_DIR / "services.csv"
OUT = DATA_DIR / "interactions.csv"
OUT.parent.mkdir(parents=True, exist_ok=True)

if not SERVICES_CSV.exists():
    raise SystemExit(f"services.csv not found at {SERVICES_CSV}; run parse_services.py first")

import argparse

# load services
services = []
with SERVICES_CSV.open(encoding='utf-8') as fh:
    reader = csv.DictReader(fh)
    for r in reader:
        services.append({"service_id": int(r['service_id']), "price": int(r['price']) if r.get('price') else 0})


def generate(num_customers: int, approx_events: int):
    rows = []
    # aim for approx_events total rows
    for _ in range(approx_events):
        customer_id = random.randint(1, num_customers)
        svc = random.choice(services)
        qty = random.choices([1, 1, 1, 2, 3], weights=[70,70,70,15,5])[0]
        # spread timestamps over last 3 years
        ts = datetime.now() - timedelta(days=random.randint(0, 3 * 365))
        amount = svc['price'] * qty
        rows.append({
            'customer_id': customer_id,
            'service_id': svc['service_id'],
            'quantity': qty,
            'timestamp': ts.isoformat(),
            'amount': amount
        })
    return rows


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--customers', type=int, default=2000, help='Number of distinct customers')
    parser.add_argument('--rows', type=int, default=20000, help='Approx total interactions to generate')
    args = parser.parse_args()

    rows = generate(args.customers, args.rows)

    with OUT.open('w', newline='', encoding='utf-8') as fh:
        writer = csv.DictWriter(fh, fieldnames=['customer_id','service_id','quantity','timestamp','amount'])
        writer.writeheader()
        for r in rows:
            writer.writerow(r)

    print(f"Generated {len(rows)} interactions -> {OUT}")


if __name__ == '__main__':
    main()
