"""Export denormalized interactions CSV from DB via ai_modules.utils.load_dataframes().

Output: backend/data/interactions.csv with columns:
  customer_id,service_id,quantity,timestamp,amount

Run this when you want a reproducible interactions CSV to train on.
"""
from pathlib import Path
import csv
from ai_modules import utils

OUT = Path(__file__).resolve().parents[1] / "data" / "interactions.csv"
OUT.parent.mkdir(parents=True, exist_ok=True)

def main():
    tables = utils.load_dataframes()
    inv = tables.invoice.copy()
    invd = tables.invoice_detail.copy()

    # normalize columns if utils provides helper
    try:
        invd = utils._normalise_invoice_detail(invd)
    except Exception:
        pass
    try:
        inv = utils._normalise_invoice(inv)
    except Exception:
        pass

    merged = invd.merge(inv[["id","customer_id","date"]].rename(columns={"id":"invoice_id"}), on="invoice_id", how="left") if "date" in inv.columns else invd.merge(inv[["id","customer_id"]].rename(columns={"id":"invoice_id"}), on="invoice_id", how="left")

    rows = []
    for _, r in merged.iterrows():
        rows.append({
            "customer_id": int(r.get("customer_id")) if r.get("customer_id") is not None else None,
            "service_id": int(r.get("service_id")) if r.get("service_id") is not None else None,
            "quantity": int(r.get("quantity", 1)) if r.get("quantity") is not None else 1,
            "timestamp": r.get("date") or r.get("timestamp") or "",
            "amount": float(r.get("unit_price", 0)) * float(r.get("quantity", 1)) if r.get("unit_price") is not None else float(r.get("amount", 0) or 0),
        })

    with OUT.open("w", newline='', encoding='utf-8') as fh:
        writer = csv.DictWriter(fh, fieldnames=["customer_id","service_id","quantity","timestamp","amount"])
        writer.writeheader()
        for r in rows:
            writer.writerow(r)

    print(f"Exported {len(rows)} interactions to {OUT}")

if __name__ == '__main__':
    main()
