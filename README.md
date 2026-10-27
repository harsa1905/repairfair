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
1. Workshop: **Build standard quote with AI**, check the draft, then **Send to Mia by text**.
2. Driver: pick a part option, set rotors and brake fluid to **Not now**, then **Approve selected items**.
3. Workshop: **Build extra item with AI**, then **Send to Mia for approval**.
4. Driver: **Approve**. Both phones show the final bill, which matches what was approved.

Use **Reset** to start again. If the internet or AI fails, tick **Demo mode** (it uses saved examples).
