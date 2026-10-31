"""Prepare the Firecrawl review requests from the sample.

Workshops are taken one region at a time (IW01, EA01, NO01, SO01, WE01, SW01, IW02...),
so stopping early still gives a balanced sample. Batch 01 is a single workshop, used to
test the sort order before spending more credits. Later batches hold 10 workshops.

Writes batch_XX.manifest.csv and batch_XX.calls.json (the `alexandria` array to send).

    python make_batches.py --sample sample.csv --per-region 15 --out batches
"""
import argparse
import csv
import json
from collections import defaultdict
from pathlib import Path

REGION_ORDER = ["IW", "EA", "NO", "SO", "WE", "SW"]
BATCH_SIZE = 10
CREDITS_PER_WORKSHOP = 10


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sample", required=True)
    ap.add_argument("--per-region", type=int, default=15)
    ap.add_argument("--out", default="batches")
    args = ap.parse_args()
    out = Path(args.out)
    out.mkdir(exist_ok=True)

    regions = defaultdict(list)
    for r in csv.DictReader(open(args.sample, encoding="utf-8")):
        regions[r["workshop_id"][:2]].append(r)
    order = [regions[code][i] for i in range(args.per_region) for code in REGION_ORDER if i < len(regions[code])]

    chunks = [order[:1]] + [order[n:n + BATCH_SIZE] for n in range(1, len(order), BATCH_SIZE)]
    for number, chunk in enumerate(chunks, 1):
        with open(out / f"batch_{number:02d}.manifest.csv", "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["workshop_id", "data_id"])
            w.writerows([r["workshop_id"], r["data_id"]] for r in chunk)
        calls = [{
            "provider": "firecrawl-maps",
            "capability": "businesses/reviews",
            "options": {"feature_id": r["data_id"], "sort": "lowest", "count": 60},
        } for r in chunk]
        (out / f"batch_{number:02d}.calls.json").write_text(json.dumps(calls, indent=1), encoding="utf-8")

    print(f"{len(order)} workshops in {len(chunks)} batches, {len(order) * CREDITS_PER_WORKSHOP} credits")


if __name__ == "__main__":
    main()
