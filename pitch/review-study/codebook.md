# Codebook: Google reviews study

This is fixed before coding starts. Claude and both human checkers use the same rules. Code what the review **says**, not what you suspect happened.

Revised 30 Oct after the 2-workshop trial: code **D** added, and rule 9 added.

## Codes

| Code | Meaning | Use when the review says… |
|---|---|---|
| **A** | **Bill above quote, or work without approval** | The final price was higher than a quote, estimate or price given earlier. **Or** work or parts were added or done without the customer agreeing first. |
| **B** | **Pricing unclear** (and not A) | The price wasn't explained, the invoice was hard to understand, there was no breakdown, or the customer couldn't tell what they paid for. There's no clear statement that the bill exceeded a quote. |
| **C** | **Clear quote or explanation praised** | Praise for a clear, upfront or itemised quote; being called before extra work; the price matching (or coming in under) the quote; or a good explanation of what was needed and why. |
| **D** | **Unnecessary or made-up work** | The customer says recommended or charged work wasn't needed, problems were invented or exaggerated, or they were upsold repairs a second opinion found unnecessary. |
| **0** | **None of these** | Everything else. That includes "great service", "fair price", "too expensive" with no quote mentioned, waiting times, rudeness, poor workmanship and a car not fixed. |

- **Allowed combinations:** `A+D`, `A+C`, `D+C`, `B+D`.
- **A and B never go together:** A takes priority.

## Decision rules
1. **"Expensive" alone is 0.** Overcharging needs a comparison (to a quote, an estimate or what was agreed) to be A. "Way overpriced compared to other shops" is 0.
2. **"Called me before doing extra work" is C**, not A, even if the bill went up. The extra work was approved.
3. **"Quoted X, charged Y"** with Y > X is **A**, whatever the reason given, unless the review says the customer approved the increase beforehand (then C).
4. **"Did work I didn't ask for" or "replaced parts without asking"** is **A**.
5. **"Never got a quote" or "no breakdown on the invoice"** is **B**.
6. **The owner's reply doesn't count.** Code only the customer's text.
7. **Not in English, or too short to judge** (e.g. "Terrible"): code **0**.
8. **Unsure between two codes:** pick the more conservative one (0 over B or D, B over A), and mark `unsure` in the notes.
9. **"Charged me and didn't fix it" is 0** (poor workmanship), unless the review also says the work was unnecessary (D) or wasn't agreed (A).

## Examples (made up, for calibration)

| Review | Code |
|---|---|
| "Quoted $350 for brakes, ended up paying $620 and they never rang me." | A |
| "Went in for a service, came out with new tyres I never agreed to." | A |
| "Invoice just said 'labour $480', no idea what that covered." | B |
| "They rang before doing anything extra and the price matched the quote exactly." | C |
| "Bill was $200 over the quote but they called first and showed me the worn part." | C |
| "Said I needed new rotors; another mechanic measured them and they were fine." | D |
| "Made up issues to charge more, then billed me above the quote." | A+D |
| "Charged $300 and the noise is still there." | 0 |
| "Super expensive, wouldn't go back." | 0 |

## Record format
`review_id, code, evidence, notes`
- `code`: `A`, `B`, `C`, `D`, `0`, or an allowed combination such as `A+D`.
- `evidence`: up to 12 words quoted from the review that justify the code. Leave it blank for 0.
- `notes`: optional; `unsure` when rule 8 applied.
