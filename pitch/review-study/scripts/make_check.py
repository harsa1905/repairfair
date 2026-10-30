"""Draw the 60-review human check sheet from Claude's coding.

Takes 30 reviews Claude coded A, B, C or D and 30 it coded 0, then shuffles them.
Both teammates get the same sheet, with Claude's codes left out.

    python make_check.py --codes codes.csv --reviews reviews_clean.csv --out .
"""
import argparse
import csv
import random
from pathlib import Path

SEED = 2026
PER_GROUP = 30


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--codes", required=True)
    ap.add_argument("--reviews", required=True)
    ap.add_argument("--out", default=".")
    args = ap.parse_args()

    reviews = {r["review_id"]: r for r in csv.DictReader(open(args.reviews, encoding="utf-8"))}
    codes = list(csv.DictReader(open(args.codes, encoding="utf-8")))
    coded = sorted(c["review_id"] for c in codes if c["code"] != "0")
    uncoded = sorted(c["review_id"] for c in codes if c["code"] == "0")

    rng = random.Random(SEED)
    picked = rng.sample(coded, min(PER_GROUP, len(coded))) + rng.sample(uncoded, min(PER_GROUP, len(uncoded)))
    rng.shuffle(picked)

    with open(Path(args.out) / "check_sheet.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["review_id", "stars", "review", "code", "topics"])
        for rid in picked:
            w.writerow([rid, reviews[rid]["rating"], reviews[rid]["text"], "", ""])
    print(f"{len(picked)} reviews on the check sheet")


if __name__ == "__main__":
    main()
