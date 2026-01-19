"""Generate interactions.csv from real database invoices for better training data.

This script:
1. Connects to the real MySQL database
2. Fetches invoice + invoice_detail data
3. Generates interactions.csv with real customer purchase patterns
4. Optionally adds synthetic data to increase diversity
"""
import csv
import os
import sys
from pathlib import Path
from datetime import datetime, timedelta
import random

# Add parent directory to path to import ai_modules
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from ai_modules import utils

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
OUT = DATA_DIR / "interactions.csv"
OUT.parent.mkdir(parents=True, exist_ok=True)


def generate_from_database(add_synthetic: bool = True, synthetic_multiplier: float = 2.0):
    """Generate interactions from real database + optional synthetic data.
    
    Args:
        add_synthetic: Whether to add synthetic interactions for diversity
        synthetic_multiplier: How many synthetic rows per real row (e.g., 2.0 = 2x more data)
    """
    print("Loading data from database...")
    tables = utils.load_dataframes()
    
    inv = tables.invoice.copy()
    invd = tables.invoice_detail.copy()
    
    # Normalize column names
    inv = inv.rename(columns={c: c.lower() for c in inv.columns})
    if "customer_id" not in inv.columns:
        inv = utils._normalise_invoice(inv)
    
    invd = invd.rename(columns={c: c.lower() for c in invd.columns})
    if "service_id" not in invd.columns:
        invd = utils._normalise_invoice_detail(invd)
    
    # Merge to get customer_id with each service
    merged = invd.merge(
        inv[["id", "customer_id", "date"]].rename(columns={"id": "invoice_id"}),
        on="invoice_id",
        how="left"
    )
    
    # Convert to interactions format
    real_rows = []
    for _, row in merged.iterrows():
        if row.get("customer_id") and row.get("service_id"):
            # Parse date if available
            ts = row.get("date")
            if ts and isinstance(ts, str):
                try:
                    ts = datetime.fromisoformat(ts.replace('Z', '+00:00'))
                except:
                    ts = datetime.now()
            elif not ts:
                ts = datetime.now()
            
            real_rows.append({
                'customer_id': str(row['customer_id']),
                'service_id': str(row['service_id']),
                'quantity': int(row.get('quantity', 1)),
                'timestamp': ts.isoformat(),
                'amount': float(row.get('unit_price', 0)) * int(row.get('quantity', 1))
            })
    
    print(f"Extracted {len(real_rows)} real interactions from database")
    
    all_rows = real_rows.copy()
    
    # Add synthetic data for diversity if requested
    if add_synthetic and len(real_rows) > 0:
        # Get all unique services and customers
        all_services = merged['service_id'].dropna().unique().tolist()
        all_customers = merged['customer_id'].dropna().unique().tolist()
        
        print(f"Found {len(all_services)} unique services, {len(all_customers)} unique customers")
        
        # Generate synthetic interactions based on co-occurrence patterns
        synthetic_count = int(len(real_rows) * synthetic_multiplier)
        print(f"Generating {synthetic_count} synthetic interactions for diversity...")
        
        # Build co-occurrence matrix to generate realistic combinations
        from collections import defaultdict
        service_pairs = defaultdict(int)
        
        # Count how often services appear together in same invoice
        for invoice_id in merged['invoice_id'].unique():
            services = merged[merged['invoice_id'] == invoice_id]['service_id'].dropna().unique().tolist()
            if len(services) > 1:
                for i, s1 in enumerate(services):
                    for s2 in services[i+1:]:
                        pair = tuple(sorted([str(s1), str(s2)]))
                        service_pairs[pair] += 1
        
        # Generate synthetic data based on patterns
        for _ in range(synthetic_count):
            # 70% chance: Use a real customer, 30% new synthetic customer
            if random.random() < 0.7 and all_customers:
                customer_id = random.choice(all_customers)
            else:
                customer_id = f"synthetic_{random.randint(10000, 99999)}"
            
            # 60% chance: Pick service from co-occurrence pairs for realism
            # 40% chance: Random service for diversity
            if random.random() < 0.6 and service_pairs:
                pair = random.choice(list(service_pairs.keys()))
                service_id = random.choice(pair)
            else:
                service_id = random.choice(all_services) if all_services else "1"
            
            # Random timestamp in last 2 years
            days_ago = random.randint(0, 730)
            ts = datetime.now() - timedelta(days=days_ago)
            
            # Quantity: mostly 1, sometimes 2-3
            qty = random.choices([1, 2, 3], weights=[80, 15, 5])[0]
            
            # Random price based on typical spa service prices
            price = random.choice([10000, 15000, 20000, 25000, 30000, 50000])
            
            all_rows.append({
                'customer_id': str(customer_id),
                'service_id': str(service_id),
                'quantity': qty,
                'timestamp': ts.isoformat(),
                'amount': price * qty
            })
    
    # Write to CSV
    with OUT.open('w', newline='', encoding='utf-8') as fh:
        writer = csv.DictWriter(fh, fieldnames=['customer_id', 'service_id', 'quantity', 'timestamp', 'amount'])
        writer.writeheader()
        for r in all_rows:
            writer.writerow(r)
    
    print(f"\n✅ Generated {len(all_rows)} total interactions ({len(real_rows)} real + {len(all_rows) - len(real_rows)} synthetic)")
    print(f"📁 Saved to: {OUT}")
    return len(all_rows)


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Generate interactions from database')
    parser.add_argument('--no-synthetic', action='store_true', help='Skip synthetic data generation')
    parser.add_argument('--multiplier', type=float, default=2.0, help='Synthetic data multiplier (default: 2.0)')
    args = parser.parse_args()
    
    try:
        count = generate_from_database(
            add_synthetic=not args.no_synthetic,
            synthetic_multiplier=args.multiplier
        )
        print(f"\n🎯 Success! Generated {count} interactions for training")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
