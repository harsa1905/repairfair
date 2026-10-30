"""Clean the workshop listing, assign each workshop to a region, and draw the sample.

Reads the scraper's JSONL output, keeps mechanic/repair workshops, places each one
in a council (LGA) by point-in-polygon against the ABS boundaries, maps councils to
the six study regions, then draws 15 workshops per region with a fixed seed from
those with at least 5 one- or two-star reviews (3 if a region runs short), because
most workshops have too few negative reviews to be worth a request. It also measures
how closely workshops sit together, using every open workshop found.

Outputs go to the private work folder (outside the repo). Only the aggregate
counts file is meant to be shared.

    python clean_sample.py --places ../raw/places.json --lgas sydney-lgas-2025.geojson --out .
"""
import argparse
import csv
import json
import math
import random
import statistics
from collections import Counter
from pathlib import Path

SEED = 2026
PER_REGION = 15
MIN_REVIEWS = 10
MIN_NEGATIVES = 5
FALLBACK_NEGATIVES = 3
NEIGHBOUR_KM = 2

REGIONS = {
    "Inner West": ["Inner West", "Canada Bay", "Burwood", "Strathfield"],
    "East": ["Waverley", "Woollahra", "Randwick"],
    "North": ["North Sydney", "Willoughby", "Lane Cove", "Ryde", "Ku-ring-gai"],
    "South": ["Bayside (NSW)", "Georges River", "Sutherland"],
    "West": ["Parramatta", "Cumberland", "Blacktown"],
    "South-West": ["Canterbury-Bankstown", "Liverpool", "Fairfield"],
}
REGION_CODES = {"Inner West": "IW", "East": "EA", "North": "NO", "South": "SO", "West": "WE", "South-West": "SW"}
LGA_TO_REGION = {lga: region for region, lgas in REGIONS.items() for lga in lgas}

# Primary categories that count as a general repair workshop.
KEEP_CATEGORIES = {
    "mechanic", "car repair shop", "car repair and maintenance service", "auto repair shop",
    "auto tune up service", "brake shop", "auto electrical service", "transmission shop",
    "auto air conditioning service", "engine rebuilding service", "vehicle inspection service",
    "car service station", "diesel engine repair service", "european car repair",
}
# Name fragments of national chains: kept in the sample but flagged.
CHAINS = ("mycar", "midas", "ultra tune", "bridgestone", "beaurepaires", "goodyear", "jax tyres",
          "bob jane", "tyrepower", "pedders", "kmart tyre", "repco", "autopro", "marcel")


def read_places(path):
    rows = []
    for line in Path(path).read_text(encoding="utf-8").splitlines():
        if line.strip():
            rows.append(json.loads(line))
    return rows


def point_in_ring(x, y, ring):
    inside = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            inside = not inside
        j = i
    return inside


def point_in_polygon(x, y, polygon):
    # First ring is the outline; any further rings are holes.
    if not point_in_ring(x, y, polygon[0]):
        return False
    return not any(point_in_ring(x, y, hole) for hole in polygon[1:])


def load_lgas(path):
    lgas = []
    for f in json.loads(Path(path).read_text(encoding="utf-8"))["features"]:
        geom = f["geometry"]
        polys = [geom["coordinates"]] if geom["type"] == "Polygon" else geom["coordinates"]
        lgas.append((f["properties"]["LGA_NAME_2025"], polys))
    return lgas


def find_lga(lon, lat, lgas):
    for name, polys in lgas:
        if any(point_in_polygon(lon, lat, p) for p in polys):
            return name
    return None


def distance_km(a, b):
    lat1, lon1, lat2, lon2 = map(math.radians, (a["lat"], a["lon"], b["lat"], b["lon"]))
    h = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2
    return 6371 * 2 * math.asin(math.sqrt(h))


def negatives(p):
    return p["stars_1"] + p["stars_2"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--places", nargs="+", required=True, help="scraper JSONL file(s)")
    ap.add_argument("--lgas", required=True)
    ap.add_argument("--out", default=".")
    args = ap.parse_args()
    out = Path(args.out)

    lgas = load_lgas(args.lgas)
    seen, found, kept, dropped = set(), [], [], Counter()
    for path in args.places:
        for p in read_places(path):
            pid = p.get("place_id") or p.get("data_id")
            if not pid or pid in seen:
                dropped["duplicate"] += 1
                continue
            seen.add(pid)
            category = (p.get("category") or "").strip().lower()
            if category not in KEEP_CATEGORIES:
                dropped[f"category: {category or 'none'}"] += 1
                continue
            if "closed" in (p.get("status") or "").lower():
                dropped["closed"] += 1
                continue
            lat, lon = p.get("latitude"), p.get("longitude") or p.get("longtitude")
            lga = find_lga(lon, lat, lgas) if lat and lon else None
            if lga is None:
                dropped["outside the 21 councils"] += 1
                continue
            title = p.get("title") or ""
            stars = p.get("reviews_per_rating") or {}
            place = {
                "place_id": pid,
                "data_id": p.get("data_id", ""),
                "title": title,
                "category": p.get("category", ""),
                "chain": int(any(c in title.lower() for c in CHAINS)),
                "suburb": (p.get("complete_address") or {}).get("city", ""),
                "lga": lga,
                "region": LGA_TO_REGION[lga],
                "lat": lat,
                "lon": lon,
                "review_count": p.get("review_count", 0),
                "rating": p.get("review_rating", ""),
                # Star breakdown of all the workshop's reviews, used to estimate prevalence.
                **{f"stars_{s}": stars.get(str(s), 0) for s in range(1, 6)},
            }
            found.append(place)
            if (p.get("review_count") or 0) < MIN_REVIEWS:
                dropped[f"fewer than {MIN_REVIEWS} reviews"] += 1
                continue
            kept.append(place)

    # Density uses every open workshop found, not only those with enough reviews.
    density = {}
    for region in REGIONS:
        group = [p for p in found if p["region"] == region]
        counts = [sum(1 for q in found if q is not p and distance_km(p, q) <= NEIGHBOUR_KM) for p in group]
        density[region] = {
            "workshops_found": len(group),
            "independents": sum(1 for p in group if not p["chain"]),
            "median_others_within_2km": statistics.median(counts) if counts else None,
        }

    fields = list(kept[0].keys()) if kept else []
    with open(out / "places_clean.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(kept)

    rng = random.Random(SEED)
    sample, pools = [], {}
    for region in REGIONS:
        region_kept = [p for p in kept if p["region"] == region]
        minimum = MIN_NEGATIVES
        pool = [p for p in region_kept if negatives(p) >= minimum]
        if len(pool) < PER_REGION:
            minimum = FALLBACK_NEGATIVES
            pool = [p for p in region_kept if negatives(p) >= minimum]
        pool.sort(key=lambda p: p["place_id"])
        picked = rng.sample(pool, min(PER_REGION, len(pool)))
        all_negatives = sum(negatives(p) for p in region_kept)
        pools[region] = {
            "minimum_negatives": minimum,
            "pool": len(pool),
            "pool_share_of_negatives": round(sum(negatives(p) for p in pool) / all_negatives, 3) if all_negatives else None,
            "negatives": all_negatives,
            "all_reviews": sum(p["review_count"] for p in region_kept),
        }
        for i, p in enumerate(picked, 1):
            sample.append({"workshop_id": f"{REGION_CODES[region]}{i:02d}", **p})

    with open(out / "sample.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["workshop_id"] + fields)
        w.writeheader()
        w.writerows(sample)

    # Shareable summary: counts only, no names.
    summary = {
        "listed_after_cleaning": len(kept),
        "dropped": dict(dropped.most_common()),
        "workshops_per_region": dict(Counter(p["region"] for p in kept)),
        "workshops_per_lga": dict(Counter(p["lga"] for p in kept)),
        "sampled_per_region": dict(Counter(s["region"] for s in sample)),
        "sampling_pools": pools,
        "density": density,
        "chains_in_sample": sum(s["chain"] for s in sample),
        "seed": SEED,
    }
    (out / "listing_summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
