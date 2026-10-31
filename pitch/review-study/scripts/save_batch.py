"""Check a saved Firecrawl result against its manifest, then store it as batch_XX.json.

Prints counts only, so no reviewer names or review text reach the conversation.
Exits with an error if the result doesn't match the manifest or the sort looks wrong.

    python save_batch.py --input tool_result_file --batch 01 --batches batches
"""
import argparse
import csv
import json
import sys
from collections import Counter
from pathlib import Path


def load(path):
    """Read the result, unwrapping the text block a saved tool result may sit in."""
    raw = json.loads(Path(path).read_text(encoding="utf-8"))
    if isinstance(raw, list) and raw and isinstance(raw[0], dict) and "text" in raw[0]:
        raw = json.loads(raw[0]["text"])
    elif isinstance(raw, dict) and "text" in raw and "data" not in raw:
        raw = json.loads(raw["text"])
    return raw


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True)
    ap.add_argument("--batch", required=True, help="two digits, e.g. 01")
    ap.add_argument("--batches", default="batches")
    args = ap.parse_args()
    folder = Path(args.batches)

    order = list(csv.DictReader(open(folder / f"batch_{args.batch}.manifest.csv", encoding="utf-8")))
    result = load(args.input)
    items = result.get("data", {}).get("alexandria", [])
    if isinstance(items, dict):
        items = [items]
    if len(items) != len(order):
        sys.exit(f"STOP: {len(order)} workshops in the manifest but {len(items)} results")

    problems = []
    for row, item in zip(order, items):
        data = item.get("data") or {}
        reviews = data.get("reviews") or []
        ratings = [r.get("rating") for r in reviews]
        if data.get("feature_id") != row["data_id"]:
            problems.append(f"{row['workshop_id']}: result is for a different workshop or failed")
        if data.get("sort") != "lowest" or ratings != sorted(ratings, key=lambda x: x or 0):
            problems.append(f"{row['workshop_id']}: not sorted lowest first")
        print(row["workshop_id"], len(reviews), dict(sorted(Counter(map(str, ratings)).items())),
              "more available" if data.get("has_more") else "")
    print("credits", result.get("data", {}).get("creditsCost"))

    if problems:
        sys.exit("STOP: " + "; ".join(problems))
    (folder / f"batch_{args.batch}.json").write_text(json.dumps(result), encoding="utf-8")
    print(f"saved batch_{args.batch}.json")


if __name__ == "__main__":
    main()
