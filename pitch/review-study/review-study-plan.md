# Google reviews study: plan (approved 30 Oct 2026)

New research for the demo-day pitch (Wed 4 Nov). Until this study is done, none of its numbers go on a slide.

## Question
1. How often do recent Google reviews of Sydney mechanics say **the bill didn't match the quote**, or that work was done without approval?
2. Does the **Inner West** stand out, and is it a sensible first market?

## What it can give the pitch
- **Slide 2 (problem):** at most one number, e.g. "X% of N recent reviews…", with the method in the backup slides.
- **Slide 7 (go-to-market):** a dot map of where workshops are, plus the complaint rate for each region.

## Regions (defined by council area so the boundaries are objective)

| Region | Councils (LGAs) | Search suburbs |
|---|---|---|
| Inner West | Inner West, Canada Bay, Burwood, Strathfield | Marrickville, Leichhardt, Ashfield, Burwood, Concord |
| East | Waverley, Woollahra, Randwick | Bondi Junction, Double Bay, Randwick, Kensington, Maroubra |
| North | North Sydney, Willoughby, Lane Cove, Ryde, Ku-ring-gai | Crows Nest, Chatswood, Lane Cove, Ryde, Gordon |
| South | Bayside, Georges River, Sutherland | Mascot, Rockdale, Kogarah, Hurstville, Caringbah |
| West | Parramatta, Cumberland, Blacktown | Parramatta, Granville, Auburn, Blacktown, Seven Hills |
| South-West | Canterbury-Bankstown, Liverpool, Fairfield | Bankstown, Lakemba, Liverpool, Fairfield, Cabramatta |

- The search suburbs are only for finding workshops.
- Each workshop's region comes from its **map position**, checked against the ABS council boundaries.
- Workshops outside these 21 councils are dropped.
- **No suburb-level complaint rates:** too few workshops per suburb. Suburb-level data is used only for the dot map of where workshops are.

## Method
1. **Find workshops:** run [gosom/google-maps-scraper](https://github.com/gosom/google-maps-scraper) (MIT, v1.18.1) on `queries.txt` (`mechanic in <suburb> NSW`, 30 searches).
2. **Clean the list:**
   - remove duplicates (by place ID);
   - keep the mechanic and auto-repair categories;
   - drop dealerships, tyre-only, panel/smash, glass, detailing and parts shops;
   - keep chains but flag them.
3. **Sample:** 15 workshops per region, chosen at random with a fixed seed (2026), 90 in total. If a region has fewer than 15, take all of them and say so.
4. **Reviews:** download the **newest 60** reviews for each of the 90 workshops, so the time window is similar across workshops (see Runs).
5. **Privacy at import:**
   - delete reviewer names, profile links and photos immediately;
   - give each review an ID (`R0001`…);
   - keep workshop names out of everything shared.

   Raw files stay outside the repo in `C:\uni\sem 3\enterprenuership\review-study\` and are never committed.
6. **Keyword filter:** flag reviews containing price or quote words (quote, quoted, estimate, bill, invoice, charged, price, cost, extra, "without asking", "didn't ask", overcharg*, rip off, explained, transparent, upfront, honest).
7. **Coding: AI first, then a human check** (chosen by Sameep, 30 Oct):
   1. **Codebook first.** `codebook.md` fixes the codes, decision rules and examples before any review is read:
      - **A:** final bill higher than the quote, or work done without approval;
      - **B:** pricing unclear or unexplained, no A;
      - **C:** praises a clear quote or explanation;
      - **0:** none of these.
   2. **Claude codes every flagged review** in batches of about 80. Each line records ID, code(s) and a short evidence phrase quoted from the review, so a checker can see why at a glance.
   3. **Claude also codes 50 random unflagged reviews** to estimate what the keywords miss.
   4. **Human check:**
      - two teammates each code the same **60 reviews** on their own, without seeing Claude's codes (30 that Claude coded A, B or C; 30 it coded 0);
      - this takes about 15 minutes each;
      - we report agreement and Cohen's kappa (Claude vs each teammate, and teammate vs teammate);
      - Sameep settles disagreements.
   5. **Pass mark:** at least 80% agreement and kappa ≥ 0.6. Below that, the codebook is tightened, the reviews are recoded and the check is repeated.
   6. **Disclosed on the method slide:** "AI-assisted coding (Claude), checked by two team members on 60 reviews: X% agreement."
8. **Results for each region:**
   - % of all sampled reviews coded A;
   - % of 1–2★ reviews coded A;
   - % coded C;
   - all with n (workshops, reviews), the collection date and limitations.

## Limitations (these go in the backup slide)
- Reviewers choose to write, so the sample is skewed towards strong experiences. Google also removes some reviews.
- Keywords miss some complaints, which the unflagged sample estimates.
- "Newest 100" covers different time spans for busy and quiet workshops.
- Google's terms of service prohibit scraping. This is a small, one-off, non-commercial student study that reports totals only. The compliant official API returns only 5 reviews per place, which is too few for this question.
- Ethics: aggregated public reviews with no reviewer names. **The team has the go-ahead (confirmed by Sameep, 30 Oct).**
- The coding is AI-assisted. The human check measures how reliable it is, and the result is disclosed.

## Runs (updated 30 Oct after testing)
Testing showed that the scraper's extended-reviews option is now blocked by Google (HTTP 403). Without it, the scraper gives only 5 "most relevant" reviews per workshop. So:

1. **List the workshops, free:** gosom/google-maps-scraper v1.18.1, official Windows release, run with `DISABLE_TELEMETRY=1`:
   `-input queries.txt -results ../raw/places.json -json -depth 2 -c 4 -lang en -exit-on-inactivity 3m`
   - Tested on one suburb: 20 workshops in about 20 seconds.
   - Then `scripts/clean_sample.py` keeps repair workshops, places each in its council (ABS 2025 boundaries), maps councils to regions, and draws **15 per region** (seed 2026).
   - The script also drops workshops that are closed or have fewer than 10 reviews.
2. **Reviews, Firecrawl Maps:** the **newest 60** reviews per sampled workshop (`sort=newest`, `count=60`):
   - one request per workshop at 10 credits, so **90 workshops = 900 credits** on a fresh free account (1,000 a month);
   - requests sent in batches of 10;
   - each batch's results are saved with a manifest of workshop IDs;
   - then `scripts/prep_reviews.py` strips reviewer details, assigns review IDs, flags keywords and writes the coding batches.

**Change from the original plan:** the **newest 60** reviews, not the newest 100. One request returns at most 60, and 60 per workshop keeps us within the free credits.

### Run-day checklist
- [ ] Firecrawl connector in this session switched to the new account (done by Sameep).
- [ ] Firecrawl Maps provider terms accepted in that account's dashboard, if it asks.
- [ ] Listing run, then `clean_sample.py`. Check `listing_summary.json`: at least 15 workshops per region?
- [ ] Reviews in 9 batches of 10 workshops; check none is missing.
- [ ] `prep_reviews.py`, then Claude's coding, then the 60-review check sheet for the two teammates.

## Timeline
| When | What | Who |
|---|---|---|
| Fri 30 Oct | Both runs, clean, sample, strip names, keyword flags | Claude |
| Fri 30 – Sat 31 Oct | AI coding; build the 60-review check sheet | Claude |
| Sat 31 Oct – Sun 1 Nov | Blind check, about 15 min each | 2 teammates (names TBC) |
| Mon 2 Nov | Agreement, settle disagreements, results; decide whether a number goes on slide 2 | Sameep + Claude |
| Tue 3 Nov | Deck locked | |

## Files
- `queries.txt`: the 30 searches.
- `review-study-plan.md`: this plan.
- Later: cleaning and analysis scripts, the coding sheet template, and **aggregated** results only.
