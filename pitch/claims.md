# Pitch claims (agreed 30 Oct 2026)

Each claim the pitch might make, the evidence it needs, and the bar it must clear. The bars were set **before** any study coding. A claim that misses its bar is dropped, not reworded. Pilot results stay as marked placeholders until real numbers exist.

## How we sell it
- **Problem statement:** drivers are asked to approve repairs they can't understand or check, and workshops have no quick way to get clear written approval. So bills grow past what was agreed, and cars sit waiting for a reply.
- **One-liner:** RepairFair lets workshops send itemised quotes that drivers approve by text, so nothing reaches the bill without their OK.
- **Target customer:** owner-run independent workshops with 1–5 mechanics, especially those on paper or basic software. They pay. Drivers use it free.
- **Value proposition:** clear, fair and in writing.
- **USP:** every repair is quoted item by item and every extra is approved in writing, so nothing reaches the bill that the driver didn't agree to.
- **Tool first, network later:** workshops pay for quicker replies and proof of what was agreed. As more join, the shared quote format and driver-owned record grow into a network of garages drivers can trust. The network is the long-term vision and what stops copycats, not a reason to pay on day one.
- **Say "network", not "platform":** we don't replace workshop software.
- **Founding Workshop offer (a plan, not a result):** once the app is deployed, the first 20–30 Inner West workshops get 12 months free, then $49 a month locked in. They sign a letter of intent to pay and use it on all their quotes. The free plan (about 20 quotes a month) stays for everyone else. Nobody has signed yet.

**Competition update (31 Oct):** Meckly, an Australian workshop system, already sells SMS quote approval and a car logbook across shops. Our edge is now **nothing to switch**, not the driver side. See `qa-evidence.md` before writing slide 5.

**Review study first results (31 Oct; no human check yet):** 90 workshops, 1,079 one- and two-star reviews with text.

| Claim | Result | Bar | Status |
|---|---|---|---|
| Bad reviews about surprise bills, unapproved or unnecessary work | 20.5%, range 15–25% | At least 20% and under 3 points' change without flagged reviews (20.6%) | Passes narrowly, if the human check passes |
| Top-3 complaint | 4th, after staff 37%, workmanship 32%, price 27% | Top 3 | **Dropped** |
| Typical rise when bills jump | 58%, but only 18 reviews give both amounts | At least 30 reviews | **Dropped** |
| Clear quotes praised in good reviews | 12%, 49 of 400 | At least 10% | Passes if the check passes; indicative only |

The 20.5% leans on a few workshops: it's 16% without the three biggest and 15% averaged across workshops. Only 6% is bills or unapproved work; the rest is mostly unnecessary work. Say "about 1 in 5" at most.

The praise set was coded by reading 80 reviews in full and the relevant sentences of the other 320, found with a broad keyword search, so it may slightly undercount.

**AI coder check (31 Oct):** instead of the human check, two further AI coders coded the same 60 reviews. On whether a review is A or D, they agreed with Claude 93% and 90% of the time (kappa 0.87 and 0.80), and 97% with each other (kappa 0.93). They found slightly more A or D reviews than Claude, so 20.5% looks cautious, not inflated. **This is not a human check.** It shows the rules give consistent results across AI coders, and those coders may share the same blind spots. If the number is used without a person checking it, the label must be: "AI-coded; two more AI coders agreed on 90%+ of a 60-review sample; not checked by a person."

## Already supported

| Claim | Slide | Evidence |
|---|---|---|
| Bills often grow past the first quote | 2 | 5 of 10 bills rose more than 10% |
| Drivers can't easily check quotes | 2 | 11 of 11 quotes showed labour as a lump sum; second quotes were 0 of 12 surveyed and 1 of 13 interviewed |
| Waiting for customers costs workshops time | 2, 6 | 3 of 10 workshops struggle to reach customers |
| Some workshops lose money over extras | 2 | 2 of 10; use as a story, not a size |
| Some workshops will try it and may pay | 4 | 6 of 10 would trial it free; 4 of 10 would pay $29–79 a month; 3 said no |

**Don't use:** "every disputed bill costs workshops" (we have no reliable dispute rate), or the two "Workshop Responses" PDFs, which are labelled scenario respondents and are not real interviews.

## Need new data

| Claim | Slide | Data | Use only if |
|---|---|---|---|
| "X% of bad mechanic reviews are about surprise bills, unapproved or unnecessary work" | 2 | Review codes A and D | At least 20%, the human check passes, and it moves less than 3 points without flagged reviews |
| "It's a top-3 complaint" | 2 | Complaint topics | It ranks in the top 3 and the human check passes |
| "When bills jump, they typically rise X%" | 1 or 2 | Quoted and billed amounts in reviews | At least 30 reviews give both amounts and the human check passes |
| "Clear quotes earn 5-star reviews" | 6 | Praise in a sample of 4–5★ reviews | At least 10% of them, labelled indicative |
| "Inner West garages are close enough to build a network" | 7 | Free listing: garages within 2 km, independents vs chains | The typical garage has at least 3 others within 2 km |

**Listing result (30 Oct):** the density claim passes. The search found 96 open Inner West workshops, 93 of them independents, and the typical one has 26 others within 2 km. That's a lower limit, because 30 searches don't find every workshop. The West also has 26, so we can say "close enough", not "the densest".

The share of **all** reviews stays off the main slides. It will look small, so it's a Q&A answer: most drivers never post a review, which is why the survey and interviews matter more. Region differences stay in the backups unless their ranges clearly separate.

## Not available by demo day

There's no pilot and no signed workshops: the app isn't deployed and there isn't time (decided 31 Oct). These claims are **out of the pitch**. Don't show placeholders or imply a pilot has run. They become what the pilot would measure, which is the basis of the ask on slide 8.

| What the pilot would measure | Data |
|---|---|
| Approvals take minutes, not hours | Time from sending a quote to getting a reply |
| Every charge was approved | Approved total vs final bill |
| Customers approve more when they can choose | Items approved, and "Not now" follow-ups that return |
| Workshops will pay | Signed Founding Workshop letters |
| Workshops rely on it | Quotes sent per workshop |

**Slide 4 instead shows validation so far:** 10 workshop interviews, 6 would trial it free, 4 would pay $29–79 a month, a working prototype, and what changed after feedback. Written approval of extras became the core, and AI drafting became optional because some shops already quote in minutes. Add the review study number only if it clears its bar and isn't already on slide 2. Call it a **working prototype**, never a live product, and say that nobody has paid yet.

## Estimates and goals (always labelled)

These are never shown as results.

| Slide | What to show | Label |
|---|---|---|
| 6 | "One hour of follow-up work a month covers the $49" | Break-even, not a forecast. Based on about 40% left after parts and wages, from the closest ATO benchmark (automotive electrical), so $49 ÷ 40% ≈ $120, about an hour at metro labour rates. See `qa-evidence.md`. One real workshop's answer would be better |
| 6 | 5% of about 28,000 workshops × $49 × 12 ≈ $820k a year | Illustrative |
| 7 | 96 Inner West workshops, 607 across 21 Sydney councils, about 28,000 in Australia | The first two are minimums from our search; the third is IBISWorld |
| 7 | "About $105 to sign one workshop" | Estimate from stated interest: 14 approached and 4 said they'd pay is 3.5 approaches each. Assumes 1 hour each at $30 an hour. About two months of fees, and the free year delays getting it back |
| 8 | Pilot goals (draft below) | Goals, not predictions |

**Scale Q&A:** $820k takes about 1,400 paying workshops, more than double the 607 we found in Sydney, so it depends on going national. Signing that many by hand isn't realistic: local referrals and software connections are the plan, and neither is built or proven. The limits are setup and support time, and needing enough garages in each area.

**Draft pilot goals, to be confirmed by the team:**
- 6 Inner West workshops for 3 months, starting from those who said they'd trial it.
- Half of quotes get a reply within 1 hour.
- Every charge on the final bill was approved in writing.
- At least 3 of the 6 workshops agree to pay $49 afterwards.

## Prototype timing test (run last, before the pitch)

Run on the laptop, with no deployment needed, using the latest app version. This is a prototype test, not a pilot.

1. **Quote speed:** a team member goes from rough notes to a sent quote, including the mechanic check, 3 times. Record the median time.
2. **Approval speed:** 5 people who haven't seen the app each approve one quote. Time from opening the quote to approving it, then ask what they approved and the total. Record the median time and how many answered correctly.

**Report it as:** "In a prototype test with 5 people, the typical quote was approved in X seconds, and Y of 5 could say what they'd approved." The testers aren't real customers or mechanics, and we say so. Use it on slide 4 only if all 5 tests are completed.

**Results:** not run yet. Add them here before the deck is locked.

## Competitor prices (checked 30 Oct 2026)

All in AUD a month excluding GST, unless noted.

| Product | Entry price | Texting | Source |
|---|---|---|---|
| Workshop Software | Silver $119, or $99 billed yearly. Gold $149, or $119 billed yearly | Outbound SMS on every plan, from 11c a message. Two-way SMS is an add-on from $49 a month plus a set-up fee | [1] |
| MechanicDesk | From $85 for one user | 10c a message. Workshop Software says MechanicDesk's texting is one-way, but that's a competitor's claim | [2], [3] |
| Auxo Workshop | NZ$99 + GST (NZD) | Not checked | [4] |

- **Correct the old figure:** our progress deck said MechanicDesk starts at about $70. It's now $85.
- **Fair comparison:** $49 is less than these entry prices, but they do far more, so "we're cheaper" isn't like-for-like. A fairer line: **"$49 a month, about what Workshop Software's two-way texting add-on costs alone, with nothing to switch."**
- **Not confirmed:** whether these products offer AI quote drafting or item-by-item approval. Workshop Software says it offers no permanent free plan, only a 14-day trial. Don't claim anyone lacks a feature until it's checked.
- **Cost of the free year (illustrative):** at about 10c a text, 30 workshops × 100 quotes a month × 2 texts is about $600 a month, or $7,200 a year, before AI, hosting and support. Real volumes and rates are still needed.

## Sources
1. Workshop Software, "AI Information", https://workshopsoftware.com/ai-info/ (page updated 5 Aug 2026; pricing effective 1 Dec 2025; accessed 30 Oct 2026)
2. MechanicDesk, https://www.mechanicdesk.com.au/ (accessed 30 Oct 2026)
3. Workshop Software, "Workshop Software vs MechanicDesk: 2026 Comparison", https://workshopsoftware.com/workshop-software-vs-mechanicdesk/ (accessed 30 Oct 2026; a competitor's own page)
4. Auxo Workshop, "Pricing", https://auxoworkshop.com/pricing (accessed 30 Oct 2026)
5. Sunbit, "What Is a Good Profit Margin for an Auto Repair Shop?", https://sunbit.com/knowledge-center/auto/good-profit-margin-auto-repair-shop/ (accessed 31 Oct 2026; cites a Ratchet+Wrench survey; a vendor's blog)
6. Garage Auto, "Mechanic Hourly Rate Australia (2026)", https://garageauto.app/mechanic-hourly-rate-australia/ (accessed 31 Oct 2026; a vendor's blog)
