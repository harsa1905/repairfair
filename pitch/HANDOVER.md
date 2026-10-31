# RepairFair pitch: handover (31 Oct 2026)

Everything another agent needs to continue the final pitch work. Read this first, then [claims.md](claims.md), [README.md](README.md), [review-study/review-study-plan.md](review-study/review-study-plan.md) and [review-study/codebook.md](review-study/codebook.md).

## 1. The project
- **RepairFair:** University of Sydney SIEN6007, Group 8, 7 team members. Sameep is the only editor of the pitch work.
- **Deliverables:** a 5-minute pitch on **Wed 4 Nov 2026**: an HTML deck streamed from Sameep's laptop, a PDF export for Canvas, a speaker script with timings, and a narrated demo video of about 30 seconds.
- **Status:** planning and data preparation are done. The deck, script and video are **not started**. The review study is paused at the download step.

## 2. Rules that must not be broken
1. **The deck isn't to be built until Sameep explicitly says "go".** In planning, "can you make X?" is a yes/no question, not an instruction. Sameep has stopped work for this reason before.
2. **Never commit to `main`.** Work on the `pitch-dev` line: `git push origin HEAD:pitch-dev`. Pitch files live in `pitch/`.
3. **Never invent results.** Estimates must be labelled and can't look like results.
4. **Draft only:** never send emails or messages for Sameep.
5. **Workshop names are internal only.** Suburbs are fine on slides; names are not.
6. **Before overwriting any Office file,** check it isn't open (look for a `~$` lock file).
7. **Credentials:** never enter passwords or API keys. Sameep connects accounts.
8. **No bot-detection bypass.** Don't use stealth browsers, fingerprint spoofing, residential proxies or similar to get past Google's block. Scrapling's `StealthyFetcher` falls under this.
9. **Review privacy:** reviewer names, photos, profile links and review URLs are removed at import. Raw data stays outside the repo. Only aggregated counts are committed. Any slide quote is paraphrased and anonymised.

**Use plain language with Sameep:** short answers, a clear recommendation, and no jargon without a quick explanation.

## 3. Figures

**Allowed**
- 12 survey responses and 13 round-2 interviews.
- Second quotes: 0 of 12 surveyed and 1 of 13 interviewed.
- 5 of 10 bills rose more than 10%.
- 11 of 11 round-2 quotes showed labour as a lump sum.
- Brake job: quoted $300, billed $1,120, against a typical $450–600 (AutoGuru, Sydney).
- 10 workshops interviewed, plus 4 contacted. 6 of 10 would trial it free, 4 of 10 would pay $29–79 a month, and 3 said no. These counts were rechecked against `RepairFair-workshop-responses.xlsx`.
- 3 of 10 workshops struggle to reach customers. 2 of 10 lost money over extras (use as stories, not as a size).
- About 28,000 mechanical workshops (IBISWorld). 5% × $49 × 12 ≈ $820k a year, always labelled illustrative.

**Banned**
- "65 drivers", "2 of 52", "9 of 35".
- Anything from the 40 round-1 interviews, and the EV interview quotes.
- The two "RepairFair Workshop Responses" PDFs. They're labelled scenario respondents, not real interviews, and aren't in the 10.
- "Every disputed bill costs workshops": there's no reliable dispute rate.
- The Glebe "10–15 minutes" quote, which isn't on the verified list.
- Any pilot result. There is no pilot.

**Progress 4 feedback** mentions six interviews, four trials and two willing to pay. Those match the 6 Inner West workshops, a subset of the 10, so it isn't a conflict. The feedback also asks to show how the prototype changed after feedback, and to test whether the price is too low given training and support costs.

## 4. How we sell it
- **Problem statement:** drivers are asked to approve repairs they can't understand or check, and workshops have no quick way to get clear written approval. So bills grow past what was agreed, and cars sit waiting for a reply.
- **Root cause:** repairs get agreed without a clear, shared record of what was approved. Don't say mechanics are dishonest: workshops are the customers.
- **One-liner:** RepairFair lets workshops send itemised quotes that drivers approve by text, so nothing reaches the bill without their OK.
- **Target customer:** owner-run independent workshops with 1–5 mechanics, especially on paper or basic software. Workshops pay; drivers use it free.
- **Value proposition:** clear, fair and in writing.
- **USP:** every item is quoted and every extra is approved in writing, so nothing reaches the bill that the driver didn't agree to.
- **Tool first, network later:** workshops pay for quicker replies and proof of what was agreed. The shared format and driver-owned record grow into a network, which is the long-term vision and what stops copycats. Say "network", not "platform".
- **No pilot:** the app isn't deployed and there's no time. Say "working prototype", and say that nobody has paid yet. The ask is help deploying it and running the first Inner West pilot.
- **Founding Workshop offer (a plan):** the first 20–30 Inner West workshops get 12 months free, then $49 locked in, with a letter of intent and use on all quotes. The free plan stays for everyone else.

## 5. Slide plan (4:50, with 0:10 spare)

| # | Slide | Time | Content |
|---|---|---|---|
| 1 | Hook and one-liner | 0:25 | "$300 quote, $1,120 bill", typical price, then the one-liner. Full brand colour |
| 2 | Problem and target customer | 0:50 | Driver story first, then the same gap costing workshops. 5 of 10, 11 of 11, optional review number, target customer |
| 3 | Solution and demo | 1:00 | Speaker 0:15, video 0:30, speaker 0:15. Opens on "clear, fair and in writing" |
| 4 | Traction | 0:45 | 6 of 10, 4 of 10, working prototype, what changed after feedback, optional timing test. No pilot |
| 5 | Competition | 0:35 | "We work alongside your software." Concede that others have approval features |
| 6 | Business model | 0:25 | A subscription, $49 a month, Founding Workshops free for a year, break-even |
| 7 | Go-to-market, scale, cost | 0:30 | Dot map; 96, then 607, then about 28,000; estimated $105 to sign a workshop |
| 8 | Team and ask | 0:20 | Pilot ask and goals, email, QR code. No "Thank you" slide. Full brand colour |

Backups: references, EV, research detail, review study method.

The course's suggested format was treated as a reference only. Sameep doesn't want to follow it strictly.

**What changed after feedback (slide 4):** written, timestamped approval of extras became the core, with photos, urgency colours, a used-parts option and a ready time. AI drafting became optional because some shops already quote in minutes, and a free tier was added because some wouldn't pay.

**Likely questions** are in the "Scale Q&A" note in `claims.md`. Also: the share of all reviews will look small, so answer that most drivers never post a review. For break-even, a judge may raise 6–7% net margin; a follow-up job uses spare time and adds income while fixed costs are already paid, which holds if the workshop has spare capacity.

## 6. Demo video (not made)
- The old `RepairFair-demo-video.mp4` is 1:40, silent and predates the redesign, so it can't be reused.
- Record from the latest app. Nobody talks over it. Embed it locally, add captions, share computer audio and test it. The PDF gets a still frame and a link.
- Sameep needs to choose the voice. A teammate is recommended.

| Time | On screen | Voiceover |
|---|---|---|
| 0:00–0:07 | Notes become a quote; mechanic check | "A mechanic types rough notes. AI turns them into a clear, itemised quote, and the mechanic checks it." |
| 0:07–0:13 | Quote sent; driver's phone lights up | "The driver gets a text link, with no app to install." |
| 0:13–0:21 | Driver approves items | "They see what's urgent, what can wait, and approve item by item." |
| 0:21–0:27 | Extra item approved | "Find something extra mid-job? It needs written approval too." |
| 0:27–0:30 | Final bill | "The final bill matches what was approved." |

## 7. Deck build notes (only after "go")
- **Approach:** see `design-research.md`. The engine is `assets/runtime.js` from [lewislulu/html-ppt-skill](https://github.com/lewislulu/html-ppt-skill): fixed 1920×1080 stage, S-key presenter window, `<aside class="notes">` script. Design discipline comes from [zarazhangrui/frontend-slides](https://github.com/zarazhangrui/frontend-slides). Both are MIT. Local clones may be in this session's scratchpad, but re-clone if missing (`git -c core.longpaths=true clone --depth 1`).
- **Design is out of date in `design-research.md`:** it says Inter and sand. The app now uses **Barlow and Barlow Semi Condensed** (fonts in `static/vendor/fonts/` on `app-dev`) with brand `#0F5F78`, dark `#0B4759`, ink `#13232B`, muted `#4D5D62`, line `#DCE8EB`, paper `#F3F8F9`, and red `#D9423A`, amber `#D98E04`, green `#2E9B62`. Sameep hasn't approved changing the design notes yet. Their saved preference is one bold signature element plus familiar controls.
- **Storyboard shown to Sameep:** big type at the top, 2–3 large numbers per slide, a video frame with a timing strip on slide 3, stacked "RepairFair on top of existing software" layers on slide 5, a dot map on slide 7. Numbers not yet available appear as dashed boxes in the draft and must be removed or filled before lock.
- **Checks:** each slide at 1280×720, no overflow, no font under 24px, no pilot results or placeholders, presenter window works when only the audience window is shared. PDF via Chrome or Edge print.
- **Script:** about 150 words a minute, set by the timings above. Speaker order isn't decided.

## 8. The app
- Latest code: `origin/app-dev`, commit `d87a1b7`, in worktree `C:\uni\sem 3\enterprenuership\repairfair-app\.claude\worktrees\app-dev-work-b0d32b`, which holds the `.env`. There's a separate app-dev session. Don't edit the app from pitch work.
- Run it with `python app.py` from that folder, or `Start demo.bat`, at http://localhost:5000. It runs in Live AI mode, using OpenAI credit. **Demo mode** uses saved examples, and **Reset** starts over.
- The demo flow is in the README on `app-dev`. A new Results screen exists on the workshop phone.

## 9. Review study: current state

**Decision needed from Sameep before anything else:**
1. Use the current Firecrawl account with a smaller sample (recommended). Remaining credits are unknown, so Sameep must check the dashboard.
2. Use a new account for all 90, if connected today and its terms allow a second free account. It may need the Firecrawl Maps provider terms accepted.
3. Skip the study. The pitch still works on existing claims, with no review number.

Also needed: **the two teammates' names** for the human check.

**Scrapling was tested and rejected (31 Oct).** Its normal HTTP mode returned status 200 and 0 reviews for a workshop with 48 reviews, because reviews need a real browser. Version 0.5's only browser mode is the stealth one, which rule 8 excludes. It's installed in `tool\scrapling-venv`, outside the repo, and Sameep may want it deleted. Playwright browsers it installed are in the user's `ms-playwright` folder.

**Private folder (never commit):** `C:\uni\sem 3\enterprenuership\review-study\`
- `tool\google_maps_scraper.exe`: gosom scraper v1.18.1. Run with `DISABLE_TELEMETRY=1`.
- `raw\places.json`: the full listing (757 lines). It contains some reviewer names in its default reviews.
- `work\sydney-lgas-2025.geojson`: 21 council boundaries (ABS).
- **`work\run\`: the real run.** `sample.csv` has the 90 workshops, IDs IW, EA, NO, SO, WE and SW 01–15, plus `places_clean.csv` and `listing_summary.json`.
- `work\sample.csv`, `work\places_clean.csv`: the old one-suburb test. **Don't use these.**
- `work\trial\`: the 2-workshop newest-60 trial, for reference and format only. Its numbers are not study results.

**Results so far (safe to use):** 607 open workshops found across 21 councils, 534 after cleaning, and 271 eligible with 5+ bad reviews. Every region reached 15 at the 5+ level. About 6.8% of reviews are 1–2★. Inner West: 96 found, 93 independent, typically 26 others within 2 km. The West ties at 26, so don't call the Inner West the densest. Counts are minimums.

## 10. Review study: steps to finish

Scripts are in `pitch/review-study/scripts/`. Use `PYTHONIOENCODING=utf-8` on Windows.

### Step 1: download reviews
No manifests exist yet: creating them was stopped. Take workshops **evenly across regions**, in the order IW01, EA01, NO01, SO01, WE01, SW01, IW02, and so on. Within a region the numbering is already random, so taking the first N keeps the sample random. Stop at a full round of regions if credits run out.

For each batch of 10, use `firecrawl_scrape` with an `alexandria` array of 10 calls:

```json
{"provider": "firecrawl-maps", "capability": "businesses/reviews",
 "options": {"feature_id": "<data_id from sample.csv>", "sort": "lowest", "count": 60}}
```

Each call costs 10 credits. Save to `work\run\batches\`:
- `batch_01.manifest.csv`: columns `workshop_id,data_id`, in request order.
- `batch_01.json`: the Firecrawl result with this shape: `{"success":..., "data":{"alexandria":[{"data":{"reviews":[...]}}]}}`.

Large results are auto-saved to a tool-results file, so parse them there. If that file wraps the JSON in a text block, unwrap it before saving, and delete the tool-results copy afterwards because it holds reviewer names.

**Important, not yet tested:** `sort=lowest` has never been run. The trial used newest-first. Run one small batch first and confirm the ratings really start at 1★ and the credit cost is 10 each. Don't print review text with names into the conversation. `has_more` and `next_cursor` exist if a workshop needs a second page, but the plan doesn't use them. Check that no request failed and no workshop is missing.

### Step 2: prepare
```bash
python prep_reviews.py --sample ../../../review-study/work/run/sample.csv --batches <batches> --out <run folder>
```
Use real paths to `work\run`. It writes `reviews_clean.csv`, `coding/batch_XX.txt`, `coding/praise_XX.txt` and `review_summary.json`. It drops names and owner reply text, and adds suspicious flags. Check `workshops_without_reviews` and `workshops_with_more_negatives_than_fetched`. If the sample was cut down, `sample.csv` still works.

### Step 3: code
Follow `codebook.md` exactly. Write two private CSVs in `work\run\`:
- `codes.csv`: every review in `batch_XX.txt`. Columns `review_id,code,topics,quoted,billed,evidence,notes`.
- `codes_praise.csv`: every review in `praise_XX.txt`, code `C` or `0` only, same columns.

Topics join with `+`, for example `W+S`. Evidence is up to 12 words quoted from the review. Note: the 87 trial codes predate code D and the topics, so don't reuse them.

### Step 4: human check
```bash
python make_check.py --codes codes.csv --reviews reviews_clean.csv --out .
```
This writes `check_sheet.csv` with 60 reviews and no AI codes. Two teammates code it separately, in about 20 minutes each. Sameep sends it to them; don't send anything yourself. Combine into `check_results.csv` with columns `review_id,claude,checker_1,checker_2`, where `claude` is the code from `codes.csv`. Sameep settles disagreements. The pass mark is at least 80% agreement and kappa of at least 0.6, on whether a review is A or D, for all three pairs. If it fails, tighten the codebook, recode and recheck.

Teammates also tick topics, but `analyse.py` doesn't measure topic agreement yet. Add that or report it separately before relying on the top-3 claim.

### Step 5: analyse
```bash
python analyse.py --reviews reviews_clean.csv --codes codes.csv --sample sample.csv --listing listing_summary.json --praise codes_praise.csv --check check_results.csv --out .
```
It writes `results.json` with a `bars` section. **A claim that misses its bar is dropped, not reworded.** The script has only been tested on made-up codes, so sense-check the first real output. Don't print or commit reviews or workshop names. Commit only an aggregated results file.

### Step 6: prototype timing test
Run it last. The steps are in `claims.md`. Results go there before the deck is locked.

**Timeline:** reviews and coding Sat 31 Oct; human check Sun 1 Nov; results Mon 2 Nov; deck locked Tue 3 Nov; pitch Wed 4 Nov.

## 11. Open questions for Sameep
1. How to get the reviews (section 9), and the two checkers' names.
2. Who presents which slides, and all 7 names and roles.
3. Who voices the video.
4. Approve the app's look for the deck (Barlow and new colours) instead of Inter and sand.
5. The pilot goals on slide 8 (draft in `claims.md`).
6. A real margin from one workshop: on a $100 job, how much do they keep after parts and wages? The 50% figure is a mostly US benchmark.
7. Specific ask details: funding amount or introductions, plus the contact email and QR link.
8. Whether to run the prototype timing test.
9. Whether to delete Scrapling from `tool\`.
10. When to say "go" on the deck.

## 12. Known gaps
- Competitors: prices are current to 30 Oct (`claims.md`). Whether they offer AI quoting or item-by-item approval is not confirmed, so don't claim they lack these.
- Xero and workshop software connections are planned, not built.
- The free-year cost ($7,200 a year) and the $105 cost to sign a workshop are illustrative.
- `design-research.md` still describes Inter and sand (section 7).
- Google's terms prohibit scraping. The plan's limitation note covers this as a small, one-off, non-commercial study, and the team has the ethics go-ahead (confirmed by Sameep on 30 Oct).
