# RepairFair: the standard quote for car repairs

A working prototype from a seven-person startup team in **SIEN6007 Entrepreneurship: Lean Startup** at the
University of Sydney (Semester 2, 2026). The workshop turns a mechanic's rough notes into a clear, itemised quote
and sends it as a text link. The driver approves each item before work starts, including any extra work found
mid-job, and the final bill matches what was approved.

![Workshop and driver screens after the driver approves the quote](docs/approved.png)

## The problem

We heard from drivers through a survey and interviews, and then interviewed independent workshops.

- Drivers can't check a repair quote at the moment they have to say yes, and almost nobody tries: 0 of 12 surveyed
  drivers and 1 of 13 interviewed drivers got a second quote.
- All 11 quotes we reviewed showed labour as one lump sum, with no hours or rate.
- 5 of 10 bills rose more than 10% after the first quote, mostly through a phone call mid-job. One front brake job
  quoted at $300 was billed at $1,120.
- Workshops have the same problem from the other side. One lost $60 when a customer denied approving brake fluid,
  and another said 10-15% of its jobs are disputed.

We started with a quote check for drivers. The research showed drivers rarely use one when the quote arrives, so we
moved to fixing the quote where it's written, with a product that workshops pay for and drivers use free. Of 10
workshops interviewed, 6 said they would trial it free and 4 said they would pay $29-79 a month. These are interview
answers, not sales.

## What the prototype does

**Workshop side**
- The mechanic types rough notes ("Front pads at 2mm, need doing now (photo taken). Pad options: economy $90, OEM $160...") and the AI drafts a
  structured quote: parts and labour itemised, labour shown as hours times rate.
- Each item gets an urgency status: **needed now**, **can wait**, **optional** or **to confirm**, taken from the
  mechanic's own words.
- Parts can be offered in four quality tiers: Used, Economy, OEM and Premium.
- The AI only organises what the mechanic wrote. It is told never to invent prices, brands, part numbers or
  warranties, and anything missing is listed for the workshop to confirm before sending.
- Extra work found mid-job goes through the same flow and needs the driver's written approval.

**Driver side**
- Opens the quote from a text link, with no app to download.
- Approves items one by one, or marks them "not now" for later.
- Sees the job's progress and the estimated ready time.
- Every approval is timestamped and kept in a searchable job history.

![Extra work found mid-job, sent for approval](docs/extra-work.png)

![Searchable job history with timestamped approvals](docs/job-history.png)

## How it's built

- **Back end:** Python and Flask (`app.py`). The OpenAI API returns the quote as JSON, which the server checks and
  cleans up before the page sees it: unknown statuses become "to confirm", only the four part tiers are allowed,
  and labour price is worked out from hours and rate.
- **Front end:** plain JavaScript, HTML and CSS (`static/`), showing the workshop's phone and the driver's phone side
  by side.
- **API key:** read from a local `.env` file on the server and never sent to the browser.
- **Demo mode:** replays saved examples from `demo_data/`, so the demo works without internet or an API key.
- Built with AI coding assistance (Claude Code).

## Run it locally

You need Python 3 installed.

```
pip install -r requirements.txt
python app.py
```

Then open http://localhost:5000. On Windows you can double-click `Start demo.bat` instead.

- **Without an API key:** tick **Demo mode** in the top right.
- **With your own OpenAI key:** copy `.env.example` to `.env`, paste your key after `OPENAI_API_KEY=`, and run
  `python check_ai.py` to check the model name works. Set a spending limit on your OpenAI account first.

**Demo flow (about 60 seconds):**
1. Workshop: **Build standard quote with AI**, check the draft, then **Send to Mia by text**.
2. Driver: pick a part option, set rotors and brake fluid to **Not now**, then **Approve selected items**.
3. Workshop: **Build extra item with AI**, then **Send to Mia for approval**.
4. Driver: **Approve**. Both phones show the final bill, which matches what was approved.

Use **Reset** to start again.

## Status

This is a student prototype that runs locally, not a launched product. There are no paying customers. The next step
is a 10-day pilot with two workshops, with continue and stop criteria set in advance. Names, phone numbers and
prices in the demo are illustrative.

## Team

Built by Harsameep (Sameep) Khurana, team leader of a seven-person SIEN6007 group at the University of Sydney. The
research, interviews and business model were team work.
