"""Turn the coded reviews into the study's results, and test each claim against its bar.

The bars were fixed on 30 Oct 2026, before any study coding. A claim that misses its
bar is dropped, not reworded. Output is counts and percentages only.

    python analyse.py --reviews reviews_clean.csv --codes codes.csv --sample sample.csv \
        --listing listing_summary.json --praise codes_praise.csv --check check_results.csv --out .

check_results.csv columns: review_id,claude,checker_1,checker_2
"""
import argparse
import csv
import json
import random
import statistics
from collections import Counter, defaultdict
from pathlib import Path

SEED = 2026
BOOTSTRAPS = 2000
RECENT_DAYS = 5 * 365
TOPICS = {"W": "Workmanship", "S": "Staff", "T": "Time", "P": "Price too high"}
BILL_TOPIC = "Bill above quote, no approval or unnecessary work"

BAR_HEADLINE = 0.20
BAR_FLAGGED_SHIFT = 0.03
BAR_RANK = 3
BAR_AMOUNT_PAIRS = 30
BAR_PRAISE = 0.10
BAR_NEIGHBOURS = 3
BAR_AGREEMENT = 0.80
BAR_KAPPA = 0.60


def read(path):
    return list(csv.DictReader(open(path, encoding="utf-8")))


def has(code, letter):
    return letter in code.split("+")


def is_hit(code):
    return has(code, "A") or has(code, "D")


def rate(rows):
    return sum(r["hit"] for r in rows) / len(rows) if rows else None


def pct(value):
    return None if value is None else round(value, 3)


def bootstrap(rows, rng):
    """95% range, resampling whole workshops within each region."""
    groups = defaultdict(lambda: defaultdict(list))
    for r in rows:
        groups[r["region"]][r["workshop_id"]].append(r)
    results = []
    for _ in range(BOOTSTRAPS):
        hits = total = 0
        for workshops in groups.values():
            ids = list(workshops)
            for wid in rng.choices(ids, k=len(ids)):
                hits += sum(r["hit"] for r in workshops[wid])
                total += len(workshops[wid])
        results.append(hits / total)
    results.sort()
    return [round(results[int(BOOTSTRAPS * 0.025)], 3), round(results[int(BOOTSTRAPS * 0.975)], 3)]


def kappa(a, b):
    n = len(a)
    seen = sum(x == y for x, y in zip(a, b)) / n
    ca, cb = Counter(a), Counter(b)
    expected = sum(ca[k] * cb[k] for k in ca) / (n * n)
    return (seen - expected) / (1 - expected) if expected < 1 else 1.0


def agreement(rows, a, b):
    hits_a = [is_hit(r[a]) for r in rows]
    hits_b = [is_hit(r[b]) for r in rows]
    return {
        "agreement": round(sum(x == y for x, y in zip(hits_a, hits_b)) / len(rows), 3),
        "kappa": round(kappa(hits_a, hits_b), 3),
        "exact_code_agreement": round(sum(r[a] == r[b] for r in rows) / len(rows), 3),
        "exact_code_kappa": round(kappa([r[a] for r in rows], [r[b] for r in rows]), 3),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--reviews", required=True)
    ap.add_argument("--codes", required=True)
    ap.add_argument("--sample", required=True)
    ap.add_argument("--listing", required=True)
    ap.add_argument("--praise")
    ap.add_argument("--check")
    ap.add_argument("--out", default=".")
    args = ap.parse_args()

    reviews = {r["review_id"]: r for r in read(args.reviews)}
    ratings = {w["workshop_id"]: float(w["rating"] or 0) for w in read(args.sample)}
    listing = json.loads(Path(args.listing).read_text(encoding="utf-8"))
    rng = random.Random(SEED)

    rows = []
    for c in read(args.codes):
        r = reviews[c["review_id"]]
        rows.append({
            **c,
            "workshop_id": r["workshop_id"],
            "region": r["region"],
            "suspicious": r["suspicious"] == "1",
            "published": int(r["published"] or 0),
            "hit": is_hit(c["code"]),
        })

    headline = rate(rows)
    latest = max(r["published"] for r in rows)
    biggest = {w for w, _ in Counter(r["workshop_id"] for r in rows).most_common(3)}
    workshops = {r["workshop_id"] for r in rows}
    without_flagged = rate([r for r in rows if not r["suspicious"]])
    results = {
        "reviews_coded": len(rows),
        "workshops": len(workshops),
        "a_or_d": round(headline, 3),
        "a_or_d_95_range": bootstrap(rows, rng),
        "a": round(sum(has(r["code"], "A") for r in rows) / len(rows), 3),
        "d": round(sum(has(r["code"], "D") for r in rows) / len(rows), 3),
        "checks": {
            "without_flagged": pct(without_flagged),
            "last_5_years": pct(rate([r for r in rows if r["published"] >= latest - RECENT_DAYS * 86_400_000])),
            "without_3_biggest_workshops": pct(rate([r for r in rows if r["workshop_id"] not in biggest])),
            "average_of_workshops": round(statistics.mean(
                rate([r for r in rows if r["workshop_id"] == w]) for w in workshops), 3),
        },
    }

    # Complaint ranking: each review counts once under every topic it raises.
    rank = Counter({BILL_TOPIC: sum(r["hit"] for r in rows)})
    rank["Pricing unclear"] = sum(has(r["code"], "B") for r in rows)
    for r in rows:
        for t in filter(None, (r.get("topics") or "").split("+")):
            rank[TOPICS[t]] += 1
    ranking = [{"topic": k, "reviews": v, "share": round(v / len(rows), 3)} for k, v in rank.most_common()]
    results["ranking"] = ranking
    position = [x["topic"] for x in ranking].index(BILL_TOPIC) + 1

    # Quoted vs billed, using only reviews that state both.
    pairs = [(float(r["quoted"]), float(r["billed"])) for r in rows if r.get("quoted") and r.get("billed")]
    rises = [(b - q) / q for q, b in pairs if q > 0 and b > q]
    results["amounts"] = {
        "reviews_with_both": len(pairs),
        "bill_above_quote": len(rises),
        "median_rise": round(statistics.median(rises), 3) if rises else None,
    }

    # By region, with a range. A difference only counts if the ranges don't overlap.
    regions = {}
    for region in sorted({r["region"] for r in rows}):
        group = [r for r in rows if r["region"] == region]
        regions[region] = {"reviews": len(group), "a_or_d": round(rate(group), 3), "range": bootstrap(group, rng)}
    results["regions"] = regions

    # Does it reach well-rated workshops? (All sampled workshops have several bad reviews.)
    by_workshop = defaultdict(list)
    for r in rows:
        by_workshop[r["workshop_id"]].append(r)
    high = [w for w in by_workshop if ratings.get(w, 0) >= 4.5]
    results["workshops_rated_4_5_plus"] = {
        "workshops": len(high),
        "with_at_least_one_a_or_d": sum(any(r["hit"] for r in by_workshop[w]) for w in high),
    }

    # Share of all reviews: star breakdowns of every listed workshop × the headline.
    pools = listing["sampling_pools"].values()
    negative_share = sum(p["negatives"] for p in pools) / sum(p["all_reviews"] for p in pools)
    results["all_reviews_estimate"] = {
        "negative_share": round(negative_share, 3),
        "a_or_d_share_of_all_reviews": round(negative_share * headline, 4),
    }

    density = listing["density"]
    results["density"] = density

    results["agreement"] = None
    check_passed = None
    if args.check:
        check = read(args.check)
        coders = [("claude", "checker_1"), ("claude", "checker_2"), ("checker_1", "checker_2")]
        results["agreement"] = {f"{a} vs {b}": agreement(check, a, b) for a, b in coders}
        check_passed = all(v["agreement"] >= BAR_AGREEMENT and v["kappa"] >= BAR_KAPPA
                           for v in results["agreement"].values())

    praise_rate = None
    if args.praise:
        praise = read(args.praise)
        praise_rate = sum(has(p["code"], "C") for p in praise) / len(praise)
        results["praise"] = {"reviews": len(praise), "share_praising_clear_quotes": round(praise_rate, 3)}

    shift_ok = abs(headline - without_flagged) < BAR_FLAGGED_SHIFT
    results["bars"] = {
        "human_check_passed": check_passed,
        "use_review_number": bool(check_passed and headline >= BAR_HEADLINE and shift_ok),
        "use_top_3_complaint": bool(check_passed and position <= BAR_RANK),
        "use_quoted_vs_billed": bool(check_passed and len(pairs) >= BAR_AMOUNT_PAIRS),
        "use_praise": bool(check_passed and praise_rate is not None and praise_rate >= BAR_PRAISE),
        "use_inner_west_density": (density["Inner West"]["median_others_within_2km"] or 0) >= BAR_NEIGHBOURS,
    }

    (Path(args.out) / "results.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
