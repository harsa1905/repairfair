# Pitch design research (29 Oct 2026)

Why the demo-day deck looks the way it does. This is research and decisions only; the deck isn't built yet.

## Recommendation

A light, warm **"itemised quote"** look:
- sand background, RepairFair teal and very large numbers;
- the real app shown on a phone, plus a 10–15-second product clip early;
- full teal only on slide 1 (the hook) and slide 8 (the ask).

The deck is an **HTML deck** streamed from Sameep's laptop, with a **PDF export for Canvas**. There's no .pptx.

## What successful recent pitches do

| Source | What worked | What we take |
|---|---|---|
| **Trunk Tools**: AI for construction admin, $40M Series B (2025) [1] | Made a boring problem physical (paperwork stacked as tall as a building). Headlines state outcomes ("25 hours saved per PM per week"). Logos of the tools it works with (Procore, Autodesk) show it is "a layer, not a replacement". Product shown as a video. | Slide 2 makes the problem physical: a $300 quote growing into a $1,120 bill. Slide 5's answer to "what stops copycats?": we sit on top of MechanicDesk and Xero; we don't replace them. |
| **Handly**: booking and admin for small trade businesses, pre-seed (2022) [2] | Soft blue-and-white palette: friendly for a B2B product used by tradespeople. App shown on a phone. Built on WhatsApp, which customers already use. Traction shown honestly, including churn, which built trust. Criticised for having **no ask** and for blurring live and planned features. | Friendly palette. "A text link, no app" as our familiar-tools point. Honest pilot placeholders. A concrete ask on slide 8. Label what's live today. |
| **Keeper**: pre-seed (2024) [3] | The look carried the message (serif type and classical art signalled seriousness). Measured outcomes, not vanity numbers. Dense material went to the appendix. | Our look should say **"in writing, itemised, trustworthy"**: a quote card whose line items tick to approved. Measures are approved vs final charges, not clicks. Detail goes to backup slides. |
| **YC: How to design a better pitch deck** (Kevin Hale) [4] | Legible, simple, obvious. Large bold simple type with good contrast. **Text at the top** (easier to read from the back). **No screenshots** ("almost always illegible"). Chart titles state the conclusion. | Big headlines at the top. Closely cropped phone views instead of screenshots. Every number labelled in plain words. |
| **YC demo-day format, 2026** (Flowjam) [5] | **A 10–15-second clip of the product working, very early.** One number for traction. **End on the ask and contact details; never a bare "Thank you."** "If your mouth and the slide say the same thing, cut one." Pre-recorded beats live ("live demos fail at the worst moment"). | The 30-second video becomes about 12 seconds on slide 3. Slide 8 is ask + email + QR code. Slides carry numbers; the script carries the explanation. |
| **US shop-software prices** (Shopmonkey's comparison) [6] | Tekmetric reserves two-way texting for its top plan, US$409/month (prices checked by Shopmonkey on 12 Aug 2026). | Optional support for slide 5: approval by text is a premium feature elsewhere. Only with a citation, and noting that the source is a competitor's own blog. |

**Not seen directly:** the slides of Axle Health ($10M, 2025, AI scheduling for home health) and Noto ($3.8M, 2024, software for tutoring businesses). Google Drive blocked the download, so they're left out of the table.

## Design system

| | Decision |
|---|---|
| Canvas | Fixed 1920×1080 slide scaled to fit the screen (16:9 everywhere; no reflow). |
| Colours | The app's own tokens: sand `#F3F1EC` background, teal `#0F5257` brand, ink `#13232B` text, muted `#5B6B70`, lines `#E2E7E7`. Slides 1 and 8 are full teal. |
| Priority colours | Red `#D9423A`, amber `#D98E04`, green `#2E9B62`, used **only inside the quote card**, as in the app. |
| Type | **Inter**, the app's font, so the deck and app match. Saved locally in `pitch/` so it works offline at the venue. Headlines 60pt+ at the top; hero numbers 160pt+; about 15 words per slide at most. |
| Recurring visual | The quote card. Slide 1 shows $300 → $1,120. Slide 3 shows items ticking from "needs approval" to "approved in writing". Slide 4 shows approved vs final charges (pilot data). |
| Product | One phone frame with one crop of the real app per slide, and the short clip on slide 3. Shown after app-dev's restyle lands. |
| Motion | Restrained: one fade or rise per slide; nothing flashy. Respects reduced-motion settings. |
| Close | The ask, an email address and a QR code. No "Thank you" slide. |

frontend-slides advises against Inter as "generic". We keep it on purpose: matching the app is the point. The distinct look comes from the quote-card visual and the large numbers instead.

## Build approach (prepared, not started)

Both repos were read in full from shallow clones (MIT-licensed). Nothing is installed.

- **[lewislulu/html-ppt-skill](https://github.com/lewislulu/html-ppt-skill)** (8.9k★, MIT) is the engine. `assets/runtime.js` already provides:
  - the fixed 1920×1080 scaled stage;
  - arrow-key and swipe navigation;
  - print CSS;
  - the **presenter window (S key)**: current slide, next slide, script and timer, kept in sync with the deck. The script lives in `<aside class="notes">` on each slide. Its previews load the same deck file, so they always match.

  It makes no network calls; its only remote dependency is Google Fonts, which we replace with a local Inter.
- **[zarazhangrui/frontend-slides](https://github.com/zarazhangrui/frontend-slides)** (31.5k★, MIT) supplies the design discipline:
  - the fixed-stage rules;
  - a low-density, speaker-led mode for a live pitch;
  - checking every slide in rendered screenshots for overflow and overlapping panels;
  - reduced-motion support;
  - a one-slide-per-page print layout.
- **Our own code in `pitch/`**:
  - `deck/index.html`, the eight slides and backup slides with notes;
  - `deck/theme.css`, RepairFair colours and type;
  - `deck/vendor/`, the runtime with its MIT notice;
  - local Inter font files.
- **PDF:** Chrome or Edge print-to-PDF (keeps text sharp and searchable), not frontend-slides' screenshot export. The video slide prints as a still frame with a link.
- **Script timing:** html-ppt suggests 150–300 words per slide for 2–3-minute slides. Ours are about 37 seconds, so **about 80–110 words each** (about 150 words a minute).
- **Checks after each build:**
  - every slide at 1280×720 and on a phone viewport;
  - nothing overflowing;
  - no fonts under 24px;
  - no unfilled `PILOT RESULT` box left by mistake;
  - the presenter window works when only the audience window is shared.

## Still open (needs Sameep)

1. Who presents which slides; names and roles for all seven team members.
2. ~~Pilot status.~~ Closed 31 Oct: no pilot by demo day; see `claims.md`.
3. The ask on slide 8: help deploying the app and running the first Inner West pilot, plus any specific funding or introductions.
4. OK to check competitors' current prices for the reference list?
5. The Glebe "10–15 minutes" quote isn't on the verified list. The suggestion is to leave it out.
6. Clip vs live demo. The suggestion is the clip.

## Sources

1. Trunk Tools pitch-deck teardown, StartupFundraising.com, https://startupfundraising.com/library/articles/trunk-tools-pitch-deck-teardown (accessed 29 Oct 2026)
2. Handly pitch-deck teardown, StartupFundraising.com, https://startupfundraising.com/library/articles/handly-pitch-deck-teardown (accessed 29 Oct 2026)
3. Keeper pitch-deck teardown, StartupFundraising.com, https://startupfundraising.com/library/articles/keeper-pitch-deck-teardown (accessed 29 Oct 2026)
4. K. Hale, "How to design a better pitch deck", YC Startup Library, https://www.ycombinator.com/library/4T-how-to-design-a-better-pitch-deck (accessed 29 Oct 2026)
5. "YC Demo Day Pitch 2026: Slide-by-Slide Script", Flowjam, https://www.flowjam.com/blog/yc-demo-day-presentation-format-15-slide-script-that-wins-checks (accessed 29 Oct 2026)
6. "Best Auto Repair Shop Management Software (2026)", Shopmonkey, https://www.shopmonkey.io/blog/best-auto-repair-shop-management-software-2026-top-picks-compared (accessed 29 Oct 2026; Tekmetric prices as checked by Shopmonkey on 12 Aug 2026)
