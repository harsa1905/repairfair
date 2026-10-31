# Google reviews study: plan (approved 30 Oct 2026, revised after the trial)

New research for the demo-day pitch (Wed 4 Nov). Until this study is done, none of its numbers go on a slide.

## Question
1. **When Sydney drivers leave a bad review of a mechanic, what are they complaining about?** In particular: how often is it that the bill beat the quote, that work was done without approval, or that work wasn't needed?
2. Roughly what share of **all** reviews is that?
3. Does the **Inner West** stand out, and is it a sensible first market?

## Why "lowest-rated" (changed after the trial, 30 Oct)
A 2-workshop trial with the newest 60 reviews returned 102 of 108 reviews at 5★, and **no** "bill above quote" complaints. Newest reviews mostly sample happy customers, so a prevalence number would be near zero and say little.

So we take each workshop's **60 lowest-rated** reviews. That captures essentially all of its 1–2★ reviews: most workshops have fewer than 60. Then:
- **Headline:** among N one- and two-star reviews, X% say the bill beat the quote or work was done without asking.
- **Prevalence estimate:** each workshop's free star breakdown (from the listing run) tells us what share of all its reviews are 1–2★. Combining the two gives an estimated share of **all** reviews.
- The trial also showed clear quotes are praised often (17 of 87 text reviews). That is reported as an observation from the trial only, not as a study result.

## What it can give the pitch
The claims and the bar each must clear are in [../claims.md](../claims.md). In short:
- **Slide 2 (problem):** at most one number, with the method in the backup slides.
- **Slide 6 (business model):** how often good reviews praise clear quotes, labelled indicative.
- **Slide 7 (go-to-market):** a dot map of where workshops are, and how close together they sit. Complaint rates by region stay in the backups unless their ranges clearly separate.

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
- Each workshop's region comes from its **map position**, checked against the ABS council boundaries (2025).
- Workshops outside these 21 councils are dropped.
- **No suburb-level rates:** too few workshops per suburb. Suburb-level data is used only for the dot map.

## Method
1. **Find workshops (free):** [gosom/google-maps-scraper](https://github.com/gosom/google-maps-scraper) v1.18.1 on `queries.txt` (`mechanic in <suburb> NSW`, 30 searches).
2. **Clean the list** (`scripts/clean_sample.py`):
   - remove duplicates;
   - keep mechanic and auto-repair categories;
   - drop dealerships, tyre-only, panel/smash, glass, detailing and parts shops;
   - drop workshops that are closed or have fewer than 10 reviews;
   - keep chains but flag them.
3. **Sample:** 15 workshops per region, chosen at random with a fixed seed (2026), 90 in total, **from workshops with at least 5 one- or two-star reviews**. If a region has fewer than 15 of those, use 3 or more for that region; if it's still short, take all of them and say so.

   Why: in the Marrickville test the median workshop had only 2 such reviews, and 3 of 19 workshops held 62% of them, so a purely random pick would spend credits on workshops with almost nothing to code. Workshops with 5 or more covered 90% of negative reviews. The cost is that results describe workshops with several bad reviews, which we state.
4. **Reviews (Firecrawl Maps):** the **60 lowest-rated** reviews per workshop (`sort=lowest`, `count=60`). That is 10 credits per workshop, **900 credits** in total, on a fresh free account (1,000 a month).
5. **Privacy at import** (`scripts/prep_reviews.py`):
   - delete reviewer names, profile links, photos and review URLs immediately;
   - give each review an ID (`R0001`…);
   - workshops get study IDs (`IW01`…).

   Raw files stay outside the repo in `C:\uni\sem 3\enterprenuership\review-study\` and are never committed.

   **Review text itself can contain names**, e.g. staff names or a reviewer signing off. That's fine for internal coding, but **any quote used on a slide must be paraphrased and anonymised**, with no workshop or person named.
6. **What gets coded:** **every 1–2★ review with text**, with its main code, topics and any quoted and billed amounts. No keyword filter is needed, so there are no keyword misses. Keyword flags are kept only as a column for reference.

   A random **400 of the 4–5★ reviews** that come with the downloads are coded for praise of clear quotes only. They aren't a random sample of all good reviews, so this result is indicative.
7. **Suspicious reviews** (see "Fake reviews" below) are flagged, not deleted. Results are reported **with and without** them.
8. **Coding: AI first, then a human check** (chosen by Sameep):
   1. **Codebook first.** `codebook.md` fixes the codes, decision rules and examples before coding:
      - **A:** bill above quote, or work done without approval;
      - **B:** pricing unclear or unexplained;
      - **C:** clear quote or explanation praised;
      - **D:** work said to be unnecessary or made up;
      - **0:** none of these.
   2. **Claude codes** every review in the coding set, in batches of about 80. Each line records ID, code(s), a short evidence phrase and notes.
   3. **Human check:**
      - two teammates each code the same **60 reviews** on their own, without seeing Claude's codes (30 that Claude coded A, B, C or D; 30 it coded 0), and tick any topics;
      - this takes about 20 minutes each;
      - we report agreement and Cohen's kappa (Claude vs each teammate, and teammate vs teammate), on whether a review is A or D, plus exact-code agreement;
      - Sameep settles disagreements.
   4. **Pass mark:** at least 80% agreement and kappa ≥ 0.6. Below that, the codebook is tightened, the reviews are recoded and the check is repeated.
   5. **Disclosed on the method slide:** "AI-assisted coding (Claude), checked by two team members on 60 reviews: X% agreement."
9. **Results** (`scripts/analyse.py`, written before the run and tested only on made-up codes):
   - % of 1–2★ reviews coded A, D, and A or D, overall and by region, with a 95% range that resamples whole workshops because a few workshops hold most reviews;
   - every review counts equally for the headline; the average across workshops, the last 5 years, and removing the 3 biggest workshops are reported as checks;
   - how that ranks against the other complaint topics;
   - the typical rise where a review states both amounts;
   - the share of 4–5★ reviews praising clear quotes;
   - the estimated share of **all** reviews (using the star breakdowns of every listed workshop);
   - all with n (workshops, reviews), the collection date and limitations;
   - the headline shown with and without suspicious reviews.

## Fake reviews
We can't prove a review is fake. So we **flag likely ones and report results both with and without them**. If the headline barely moves, the result doesn't depend on fakes. The flags, computed in `prep_reviews.py`:

| Flag | Rule | Why |
|---|---|---|
| `dup_text` | The same text (ignoring case and punctuation, at least 6 words) appears more than once in the dataset | Copy-pasted reviews across workshops or accounts |
| `burst` | A workshop gets 4 or more reviews in the sample on the same day | Review bombing, or a burst of solicited or fake reviews |
| `owner_disputes` | The owner's reply says the reviewer wasn't a customer ("no record", "never been", "not a customer", "fake review", "can't find you", "competitor") | The best available signal for fake negative reviews; owners often say so |
| `no_text` | Star rating only | Can't be coded anyway; excluded from coded rates, counted separately |

Google already removes many fake reviews before we ever see them. **What we can't detect:** fake reviews written well enough to pass all of these flags. Checking each reviewer's history would cost extra credits and is out of scope.

## Limitations (these go in the backup slide)
- Reviewers choose to write, so the sample is skewed towards strong experiences. Google also removes some reviews.
- "Lowest-rated 60" covers essentially all negative reviews for most workshops, but not for the few with more than 60 negative reviews. Those are flagged in the results.
- Sampling only workshops with several bad reviews means results don't describe workshops with almost none.
- The listing finds only what 30 searches return, so workshop counts and distances are lower limits, not a full census.
- Prevalence across all reviews is an **estimate**, combining star breakdowns with the coded negative reviews.
- Google's terms of service prohibit scraping. This is a small, one-off, non-commercial student study that reports totals only. The compliant official API returns only 5 reviews per place, which is too few for this question.
- Ethics: aggregated public reviews with no reviewer names. **The team has the go-ahead (confirmed by Sameep, 30 Oct).**
- The coding is AI-assisted. The human check measures how reliable it is, and the result is disclosed.

## Runs
1. **Listing (free):** run the scraper with `DISABLE_TELEMETRY=1` (the tool sends anonymous usage statistics unless that is set):
   `-input queries.txt -results ../raw/places.json -json -depth 2 -c 4 -lang en -exit-on-inactivity 3m`
   Tested on one suburb: 20 workshops in about 20 seconds.
2. **Reviews (Firecrawl):** 9 batches of 10 workshops, each saved with a manifest of workshop IDs.
   Tested on 2 workshops (newest-60 version): exactly 20 credits, 108 reviews, and the pipeline worked end to end.

The scraper's own extended-reviews option is blocked by Google (HTTP 403) and returns only 5 "most relevant" reviews, which is why reviews come from Firecrawl.

### Run-day checklist
- [ ] Firecrawl connector in this session switched to the new account (done by Sameep).
- [ ] Firecrawl Maps provider terms accepted in that account's dashboard, if it asks.
- [ ] Listing run, then `clean_sample.py`. Check `listing_summary.json`: at least 15 workshops per region?
- [ ] Reviews in 9 batches of 10; check none is missing.
- [ ] `prep_reviews.py`, then Claude's coding, then the 60-review check sheet for the two teammates.

## Timeline
| When | What | Who |
|---|---|---|
| Fri 30 – Sat 31 Oct | Listing, sample, reviews, prep, AI coding, check sheet | Claude (after Sameep connects the new account) |
| Sat 31 Oct – Sun 1 Nov | Blind check, about 20 min each | 2 teammates (names TBC) |
| Mon 2 Nov | Agreement, settle disagreements, results; decide whether a number goes on slide 2 | Sameep + Claude |
| Tue 3 Nov | Deck locked | |

## Files
- `queries.txt`: the 30 searches.
- `codebook.md`: codes and decision rules.
- `scripts/clean_sample.py`, `scripts/make_batches.py`, `scripts/save_batch.py`, `scripts/prep_reviews.py`, `scripts/make_check.py`, `scripts/analyse.py`.
- Later: **aggregated** results only.
