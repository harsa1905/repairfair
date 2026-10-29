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
7. **Hand-coding:** two teammates code every flagged review on their own, using a shared spreadsheet:
   - **A:** final bill higher than the quote, or work done without approval;
   - **B:** pricing unclear or unexplained, no A;
   - **C:** praises a clear quote or explanation;
   - **0:** none of these.

   One review can be A and C (e.g. "charged more, but explained why"). Disagreements are settled by a third teammate. We report agreement between the coders. A random 50 unflagged reviews are also coded, to estimate what the keywords miss.
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
- Ethics: aggregated public reviews with no reviewer names. **Check with the tutor** that no ethics approval is needed.

## Timeline
| When | What | Who |
|---|---|---|
| Fri 30 Oct | Plan, search list, run the scraper, clean, sample | Claude + Sameep |
| Sat 31 Oct – Sun 1 Nov | Coding by two teammates | names TBC |
| Mon 2 Nov | Settle disagreements, compute results, decide whether a number goes on slide 2 | Sameep |
| Tue 3 Nov | Deck locked | |

## Files
- `queries.txt`: the 30 searches.
- `review-study-plan.md`: this plan.
- Later: cleaning and analysis scripts, the coding sheet template, and **aggregated** results only.
