"""Turn the Firecrawl review downloads into a de-identified review table and coding batches.

Each fetch batch is a pair of files in the batches folder:
    batch_01.manifest.csv   workshop_id,data_id   (one row per request, in request order)
    batch_01.json           the saved Firecrawl result for that batch (sort=lowest, count=60)

Reviewer names, photos, profile links, images, review URLs and the owner's reply text
are dropped here and never written anywhere; the owner's reply only sets a flag.
Reviews get study IDs (R0001...). Suspicious reviews are flagged, not removed.
Outputs go to the private work folder; only review_summary.json (counts) is meant
to be shared.

    python prep_reviews.py --sample sample.csv --batches batches --out .
"""
import argparse
import csv
import json
import re
from collections import Counter
from pathlib import Path

BATCH_SIZE = 80
CODE_MAX_STARS = 2
DUP_MIN_WORDS = 6
BURST_SAME_DAY = 4

KEYWORDS = re.compile(
    r"\b(quot\w*|estimat\w*|bill\w*|invoice\w*|charg\w*|price\w*|pricing|cost\w*|extra|"
    r"without (asking|permission|approval|consent)|didn'?t ask|never asked|"
    r"overcharg\w*|rip(ped)?[ -]?off|explain\w*|transparen\w*|upfront|up front|honest\w*|"
    r"call(ed|s)? (me )?(before|first)|before (doing|starting|any)|told me what|"
    r"kept me (informed|in the loop|updated)|unnecessar\w*|didn'?t need|made up|\$\s?\d)",
    re.IGNORECASE,
)
OWNER_DISPUTES = re.compile(
    r"no record|not a customer|never been (a customer|here|to our)|never (visited|came|serviced)|"
    r"fake review|can'?t find (you|your|any)|cannot find (you|your|any)|competitor|"
    r"not one of our|never dealt with",
    re.IGNORECASE,
)


def clean(text):
    text = re.sub(r"<br\s*/?>", " ", text or "", flags=re.IGNORECASE)
    return " ".join(text.split())


def norm(text):
    return re.sub(r"[^a-z0-9 ]", "", text.lower())


def find_review_lists(result):
    """Return the per-request review lists from a saved Firecrawl result, in request order."""
    data = result.get("data", result)
    items = data.get("alexandria", [])
    if isinstance(items, dict):
        items = [items]
    return [((item.get("data") or {}).get("reviews") or []) for item in items]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sample", required=True)
    ap.add_argument("--batches", required=True)
    ap.add_argument("--out", default=".")
    args = ap.parse_args()
    out = Path(args.out)

    sample = {r["workshop_id"]: r for r in csv.DictReader(open(args.sample, encoding="utf-8"))}

    reviews, missing, capped = [], [], []
    for manifest in sorted(Path(args.batches).glob("batch_*.manifest.csv")):
        order = list(csv.DictReader(open(manifest, encoding="utf-8")))
        result = json.loads(Path(str(manifest).replace(".manifest.csv", ".json")).read_text(encoding="utf-8"))
        lists = find_review_lists(result)
        for row, revs in zip(order, lists):
            wid = row["workshop_id"]
            if not revs:
                missing.append(wid)
            # Flag workshops whose negative reviews may not all fit in one 60-review page.
            negatives = sum(int(sample[wid].get(f"stars_{s}") or 0) for s in range(1, CODE_MAX_STARS + 1))
            if negatives > len(revs):
                capped.append(wid)
            for r in revs:
                owner = (r.get("owner_response") or {}).get("text") or ""
                published = r.get("published_at_ms") or 0
                reviews.append({
                    "workshop_id": wid,
                    "region": sample[wid]["region"],
                    "rating": r.get("rating"),
                    "published": published,
                    "day": published // 86_400_000,
                    "language": r.get("language", ""),
                    "owner_replied": int(bool(owner)),
                    "owner_disputes": int(bool(OWNER_DISPUTES.search(owner))),
                    "text": clean(r.get("text")),
                })

    # Suspicious-review flags (reported as sensitivity checks, never deleted).
    texts = Counter(norm(r["text"]) for r in reviews if len(r["text"].split()) >= DUP_MIN_WORDS)
    days = Counter((r["workshop_id"], r["day"]) for r in reviews if r["day"])
    for i, r in enumerate(reviews, 1):
        r["review_id"] = f"R{i:04d}"
        r["keyword"] = int(bool(KEYWORDS.search(r["text"])))
        r["no_text"] = int(not r["text"])
        r["dup_text"] = int(len(r["text"].split()) >= DUP_MIN_WORDS and texts[norm(r["text"])] > 1)
        r["burst"] = int(bool(r["day"]) and days[(r["workshop_id"], r["day"])] >= BURST_SAME_DAY)
        r["suspicious"] = int(r["dup_text"] or r["burst"] or r["owner_disputes"])

    fields = ["review_id", "workshop_id", "region", "rating", "published", "language", "owner_replied",
              "owner_disputes", "dup_text", "burst", "suspicious", "no_text", "keyword", "text"]
    with open(out / "reviews_clean.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(reviews)

    # Coding set: every 1-2 star review with text.
    to_code = [r for r in reviews if r["text"] and int(r["rating"] or 0) <= CODE_MAX_STARS]
    coding = out / "coding"
    coding.mkdir(exist_ok=True)
    for n in range(0, len(to_code), BATCH_SIZE):
        lines = [f"{r['review_id']} | {r['rating']}★ | {r['text']}" for r in to_code[n:n + BATCH_SIZE]]
        (coding / f"batch_{n // BATCH_SIZE + 1:02d}.txt").write_text("\n".join(lines), encoding="utf-8")

    summary = {
        "reviews": len(reviews),
        "negative_with_text_to_code": len(to_code),
        "coding_batches": -(-len(to_code) // BATCH_SIZE),
        "workshops_without_reviews": missing,
        "workshops_with_more_negatives_than_fetched": capped,
        "ratings": dict(sorted(Counter(str(r["rating"]) for r in reviews).items())),
        "no_text": sum(r["no_text"] for r in reviews),
        "suspicious": {
            "dup_text": sum(r["dup_text"] for r in reviews),
            "burst": sum(r["burst"] for r in reviews),
            "owner_disputes": sum(r["owner_disputes"] for r in reviews),
            "any": sum(r["suspicious"] for r in reviews),
            "any_in_coding_set": sum(r["suspicious"] for r in to_code),
        },
        "to_code_per_region": dict(Counter(r["region"] for r in to_code)),
    }
    (out / "review_summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
