"""Turn the Firecrawl review downloads into a de-identified review table and coding batches.

Each fetch batch is a pair of files in the batches folder:
    batch_01.manifest.csv   workshop_id,data_id   (one row per request, in request order)
    batch_01.json           the saved Firecrawl result for that batch

Reviewer names, photos, profile links, images and review URLs are dropped here and
never written anywhere. Reviews get study IDs (R0001...). Outputs go to the private
work folder; only review_summary.json (counts) is meant to be shared.

    python prep_reviews.py --sample sample.csv --batches batches --out .
"""
import argparse
import csv
import json
import random
import re
from collections import Counter
from pathlib import Path

SEED = 2026
NEWEST = 60
BATCH_SIZE = 80
UNFLAGGED_CHECK = 50

KEYWORDS = re.compile(
    r"\b(quot\w*|estimat\w*|bill\w*|invoice\w*|charg\w*|price\w*|pricing|cost\w*|extra|"
    r"without (asking|permission|approval|consent)|didn'?t ask|never asked|"
    r"overcharg\w*|rip(ped)?[ -]?off|explain\w*|transparen\w*|upfront|up front|honest\w*|"
    r"\$\s?\d)",
    re.IGNORECASE,
)


def find_review_lists(result):
    """Return the per-request review lists from a saved Firecrawl result, in request order."""
    data = result.get("data", result)
    items = data.get("alexandria", [])
    if isinstance(items, dict):
        items = [items]
    lists = []
    for item in items:
        payload = item.get("data") or {}
        lists.append(payload.get("reviews") or item.get("records") or [])
    return lists


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sample", required=True)
    ap.add_argument("--batches", required=True)
    ap.add_argument("--out", default=".")
    args = ap.parse_args()
    out = Path(args.out)

    sample = {r["workshop_id"]: r for r in csv.DictReader(open(args.sample, encoding="utf-8"))}

    reviews, missing = [], []
    for manifest in sorted(Path(args.batches).glob("batch_*.manifest.csv")):
        order = list(csv.DictReader(open(manifest, encoding="utf-8")))
        result = json.loads(Path(str(manifest).replace(".manifest.csv", ".json")).read_text(encoding="utf-8"))
        lists = find_review_lists(result)
        for row, revs in zip(order, lists):
            if not revs:
                missing.append(row["workshop_id"])
            revs = sorted(revs, key=lambda r: r.get("published_at_ms") or 0, reverse=True)[:NEWEST]
            for r in revs:
                reviews.append({
                    "workshop_id": row["workshop_id"],
                    "region": sample[row["workshop_id"]]["region"],
                    "rating": r.get("rating"),
                    "published": r.get("published_at_ms"),
                    "language": r.get("language", ""),
                    "owner_replied": int(bool(r.get("owner_response"))),
                    "text": " ".join((r.get("text") or "").split()),
                })

    for i, r in enumerate(reviews, 1):
        r["review_id"] = f"R{i:04d}"
        r["flagged"] = int(bool(KEYWORDS.search(r["text"])))

    fields = ["review_id", "workshop_id", "region", "rating", "published", "language",
              "owner_replied", "flagged", "text"]
    with open(out / "reviews_clean.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(reviews)

    # Coding batches for Claude: flagged reviews, plus a random unflagged set to
    # estimate what the keyword filter misses.
    flagged = [r for r in reviews if r["flagged"]]
    unflagged = [r for r in reviews if not r["flagged"] and r["text"]]
    check = random.Random(SEED).sample(unflagged, min(UNFLAGGED_CHECK, len(unflagged)))
    coding = out / "coding"
    coding.mkdir(exist_ok=True)
    queue = flagged + check
    for n in range(0, len(queue), BATCH_SIZE):
        lines = [f"{r['review_id']} | {r['rating']}★ | {r['text']}" for r in queue[n:n + BATCH_SIZE]]
        (coding / f"batch_{n // BATCH_SIZE + 1:02d}.txt").write_text("\n".join(lines), encoding="utf-8")
    (coding / "unflagged_check_ids.txt").write_text("\n".join(r["review_id"] for r in check), encoding="utf-8")

    summary = {
        "reviews": len(reviews),
        "with_text": sum(1 for r in reviews if r["text"]),
        "flagged": len(flagged),
        "unflagged_check": len(check),
        "coding_batches": -(-len(queue) // BATCH_SIZE),
        "workshops_without_reviews": missing,
        "reviews_per_region": dict(Counter(r["region"] for r in reviews)),
        "flagged_per_region": dict(Counter(r["region"] for r in flagged)),
        "ratings": dict(sorted(Counter(r["rating"] for r in reviews).items(), key=lambda kv: str(kv[0]))),
    }
    (out / "review_summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
