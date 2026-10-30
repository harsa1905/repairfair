# RepairFair demo

A small local web app for the presentation. The workshop phone is on the left and the driver phone is on the right.

## Setup (once)
0. Install the packages: `pip install -r requirements.txt`
1. Copy `.env.example`, rename the copy to `.env`, and paste your OpenAI API key after `OPENAI_API_KEY=`.
2. Test it: `python check_ai.py`. If it says the model isn't found, put one of the listed models in `OPENAI_MODEL`.
3. Set a spending limit in your OpenAI account.

## Run
```
python app.py
```
Open http://localhost:5000 in Chrome or Edge. Stop it with Ctrl+C.

## Demo flow (about 60 seconds)
1. Workshop: **Build standard quote with AI**. In the **Mechanic check**, tap **Fill from your price book** (it fills the flush price, brands and part numbers), mark anything left **Resolved** or **Confirm later** (prices, status and the pre-selected part tier can be edited on each item), tick **I've checked this quote**, then **Send to Mia by text**.
2. Driver: check the fair price line on each item, tap **Why is this needed now?** on the pads, pick a part option, and leave rotors and brake fluid switched off (their lights stay dark in the panel at the top). Then **Approve selected items**.
3. Workshop: the app moves to the **Job** tab once Mia approves. Tap **Found something extra mid-job?**, then **Build extra item with AI**, resolve its check the same way, tick **I've checked this extra item**, then **Send to Mia for approval**.
4. Driver: **Approve**. Both phones show the final bill, which matches what was approved.
5. Optional: Mia's **Not now** items are booked as follow-ups, with the reminder time on each declined row in the workshop's decisions list (she can tap **Don't remind me**). In the **Follow-ups** tab, tap **Send reminder** on one that's due. Past jobs are in **History**, and the workshop's own prices are in **Prices**.

6. Optional: tap **Results** at the top of the workshop phone to see what the workshop gained. The figures are samples, and today's job adds to them.

Use **Reset** to start again. If the internet or AI fails, tick **Demo mode** (it uses saved examples).

## Design
Each screen leads with a blue-teal "instrument panel" (the number that matters and the warning lights); below it are plain lists with normal phone controls. Colour only means urgency or state. Fonts (Barlow, SIL Open Font License) and the Motion animation library (MIT) are saved in `static/vendor/`, so the demo looks the same without internet.
