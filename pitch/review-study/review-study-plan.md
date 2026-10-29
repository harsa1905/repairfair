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
4. **Reviews:** download reviews for the 90 workshops, then keep each one's **newest 100** so the time window is similar across workshops.
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

## Runs
Both runs use the official Windows release (`google_maps_scraper-1.18.1-windows-amd64.exe`) with `DISABLE_TELEMETRY=1`. The tool sends anonymous usage statistics unless that is set.

1. **List the workshops:** `-input queries.txt -results places.json -json -depth 2 -c 4 -lang en -exit-on-inactivity 3m`. Expect about 600–900 places in about 10 minutes.
2. **Reviews for the sample:** `-input sample-links.txt -results reviews.json -json -extra-reviews -c 2 -lang en -exit-on-inactivity 5m`. 90 workshops, up to about 300 reviews each; we keep the newest 100.

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
