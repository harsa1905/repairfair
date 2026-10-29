"""Clean the workshop listing, assign each workshop to a region, and draw the sample.

Reads the scraper's JSONL output, keeps mechanic/repair workshops, places each one
in a council (LGA) by point-in-polygon against the ABS boundaries, maps councils to
the six study regions, then draws 15 workshops per region with a fixed seed.

Outputs go to the private work folder (outside the repo). Only the aggregate
counts file is meant to be shared.

    python clean_sample.py --places ../raw/places.json --lgas sydney-lgas-2025.geojson --out .
"""
import argparse
import csv
import json
import random
from collections import Counter
from pathlib import Path

SEED = 2026
PER_REGION = 15
MIN_REVIEWS = 10

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


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--places", nargs="+", required=True, help="scraper JSONL file(s)")
    ap.add_argument("--lgas", required=True)
    ap.add_argument("--out", default=".")
    args = ap.parse_args()
    out = Path(args.out)

    lgas = load_lgas(args.lgas)
    seen, kept, dropped = set(), [], Counter()
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
            if (p.get("review_count") or 0) < MIN_REVIEWS:
                dropped[f"fewer than {MIN_REVIEWS} reviews"] += 1
                continue
            lat, lon = p.get("latitude"), p.get("longitude") or p.get("longtitude")
            lga = find_lga(lon, lat, lgas) if lat and lon else None
            if lga is None:
                dropped["outside the 21 councils"] += 1
                continue
            title = p.get("title") or ""
            kept.append({
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
            })

    fields = list(kept[0].keys()) if kept else []
    with open(out / "places_clean.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(kept)

    rng = random.Random(SEED)
    sample = []
    for region in REGIONS:
        pool = sorted((p for p in kept if p["region"] == region), key=lambda p: p["place_id"])
        picked = rng.sample(pool, min(PER_REGION, len(pool)))
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
        "chains_in_sample": sum(s["chain"] for s in sample),
        "seed": SEED,
    }
    (out / "listing_summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
