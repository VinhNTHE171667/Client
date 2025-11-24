"""Parse `ChiTietDichVu.txt` into a CSV of services (service_id, service_name, price).

Place this file under backend/scripts and run it to generate ../data/services.csv
"""
from pathlib import Path
import re
import csv

# Adjust this path if your project layout differs
SRC = Path(r"d:\Desktop\Đồ án test\ai\do_an_fa25\app\data\ChiTietDichVu.txt")
OUT = Path(__file__).resolve().parents[1] / "data" / "services.csv"
OUT.parent.mkdir(parents=True, exist_ok=True)

text = SRC.read_text(encoding="utf-8", errors="ignore")

# Split chunks by marker lines present in the file
chunks = re.split(r"\[\s*Kết thúc Chunk Dịch vụ \d+\s*\]|\[\s*Bắt đầu Chunk Dịch vụ \d+\s*\]", text)
services = []
for chunk in chunks:
    if "* Tên dịch vụ" in chunk:
        name_m = re.search(r"\*\s*Tên dịch vụ\s*:\s*(.+)", chunk)
        name = name_m.group(1).strip() if name_m else None
        # find price like 800.000 VNĐ or 500.000
        price_m = re.search(r"([0-9]{1,3}(?:[\.\,][0-9]{3})*)\s*VNĐ", chunk)
        price = None
        if price_m:
            raw = price_m.group(1)
            price = int(raw.replace('.', '').replace(',', ''))
        services.append({"service_name": name, "price": price})

# write CSV
with OUT.open("w", newline='', encoding="utf-8") as fh:
    writer = csv.DictWriter(fh, fieldnames=["service_id", "service_name", "price"])
    writer.writeheader()
    for idx, s in enumerate(services, start=1):
        writer.writerow({"service_id": idx, "service_name": s.get("service_name"), "price": s.get("price")})

print(f"Wrote {len(services)} services to {OUT}")
