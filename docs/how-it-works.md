# How the RepairFair prototype works

*Written 30 Oct 2026, updated 31 Oct. Describes the `app-dev` branch.*

RepairFair is a small web app. A Python server passes the mechanic's notes to the OpenAI API, and the browser does everything else, including both simulated phones.

## How it fits together

```text
 YOUR BROWSER (http://localhost:5000)
 +--------------------------------------------------------+
 |  Workshop phone      <-- simulated text -->  Driver phone |
 |  (static/app.js keeps all the state in one object)     |
 +--------------------------------------------------------+
        |  1. mechanic's notes             ^  4. clean quote as JSON
        v                                  |
 +--------------------------------------------------------+
 |  FLASK SERVER (app.py, on your computer)               |
 |  Holds the API key. Checks and cleans the AI's reply.  |
 +--------------------------------------------------------+
        |  2. notes + rules                ^  3. raw JSON
        v                                  |
 +--------------------------------------------------------+
 |  OPENAI API (model gpt-6-luna)                         |
 +--------------------------------------------------------+
```

**The path of one quote:**

1. The mechanic taps **Build standard quote with AI**. The browser sends the notes to `/api/quote`.
2. `app.py` sends the notes to OpenAI with a long set of rules (the *system prompt*).
3. OpenAI returns the quote as JSON.
4. `normalise()` in `app.py` cleans that JSON and sends it to the browser.
5. `prepare()` in `app.js` turns any gaps into the Mechanic check list.
6. The mechanic fills the gaps, edits, ticks **I've checked this quote** and sends.
7. The browser shows the "text" on Mia's phone. No real message is sent.
8. Mia picks what she wants and approves. The app records the job and books follow-ups for what she declined.

## The setup

| Part | Tool | Job |
|---|---|---|
| Server | Python with Flask | Serves the page and answers two data requests |
| AI | OpenAI API, `gpt-6-luna` | Turns rough notes into a structured quote |
| Page | HTML, CSS, plain JavaScript | The whole interface, with no framework or build step |
| Secrets | `.env` file with `python-dotenv` | Keeps the API key out of the code and off the page |
| Animation | Motion 11.18.2 | Staggered screen entrances and the total settling |
| Fonts | Barlow, Barlow Semi Condensed | Saved locally so the demo works offline |
| Icons and logo | Hand-written SVG icons, PNG logo | Warning-light icons, plus the RepairFair logo with its R-and-car symbol |
| Version control | Git and GitHub | Work happens on `app-dev`; `main` is updated by pull request |

**Run it:** `python app.py`, then open http://localhost:5000.

## Files

| File | What it is for | Size |
|---|---|---|
| `app.py` | The Flask server, AI rules and clean-up code | About 220 lines |
| `static/index.html` | The page frame: both phones, the tab bar and the icon set | 101 lines |
| `static/app.js` | All app logic: state, screens, price book, follow-ups | About 1,100 lines |
| `static/style.css` | All visual design: colours, type, layout | About 500 lines |
| `static/logo-wordmark.png`, `logo-mark.png` | The logo, and the small symbol used for icons | Small |
| `static/vendor/` | The fonts and Motion, stored locally | Small |
| `demo_data/quote.json`, `extra.json`, `checks.json`, `translations.json`, `voice_note.json` | Saved examples for Demo mode | Small |
| `example-notes.txt` | Sample mechanic's notes to paste in | Small |
| `check_ai.py` | Tests that your API key and model work | Small |
| `.env` | Your private OpenAI key. Git ignores it, so it is never committed | Private |
| `requirements.txt` | The Python packages to install | 3 lines |

## Key concepts

**Client and server.** The *client* is the browser. The *server* is `app.py`. The key stays on the server because anything sent to a browser can be read by its user.

**API.** A way for one program to ask another for something. Our page calls our server's API, and our server calls OpenAI's.

| Address | Method | Returns |
|---|---|---|
| `/` | GET | The page |
| `/api/status` | GET | Whether a key exists, and the model name |
| `/api/quote` | POST | A quote built from the notes, or a saved example |
| `/api/checks` | POST | Suggested things to inspect, for the mechanic only |
| `/api/transcribe` | POST | Turns a voice note into text, or returns a saved example in Demo mode |
| `/api/translate` | POST | Translated words for the driver's screen, or saved ones in Demo mode |

**JSON.** A simple text format for structured data. Asking the AI for JSON means the app gets named fields, like `price` and `status`, not a paragraph it would have to interpret.

**System prompt.** The instructions sent with every AI request. Ours says to organise only what the mechanic wrote, never invent prices or brands, use `null` for anything missing, and list gaps in `missing_info`.

**Normalising.** AI output can't be fully trusted, so `normalise()` checks it. Unknown statuses become `to_confirm`, prices become real numbers, labour is worked out from hours × rate if needed, and each "why" is cut to 220 characters.

**State and render.** All data lives in one object called `state`. When something changes, the code updates `state` and calls `render()`, which redraws the screens. It's simple and easy to follow. The few animated moments, such as a switch and its light, update in place instead.

**Event delegation.** One click listener covers the whole page and reads a `data-act` label on whatever was tapped. New buttons work without extra wiring.

**Design tokens.** Colours are named variables at the top of `style.css`, such as `--brand`. That's why the whole palette could change in one small edit.

**Human in the loop.** The AI drafts and a person decides. `canSend()` keeps **Send** locked until every gap is handled and the mechanic has ticked the box. The rule is enforced in code, not just suggested.

**Fair price check.** `fairCheck()` compares each price (for labour, the hourly rate) with a typical range in `FAIR_RANGES`. Part ranges are invented samples for the demo, and the labour range of $120 to $180 an hour comes from published Australian workshop rates. Real ranges would come from quotes across many workshops, which is the long-term moat.

**Results screen.** `wsResultsTab()` adds today's demo job to `SAMPLE_MONTH`, a set of invented figures for one workshop's month. It shows how the product would prove its value, not real results.

**Price book.** `bookFill()` fills only empty fields from the workshop's saved prices. It never overwrites what the mechanic typed, so prices come from the workshop rather than the AI.

**Language view.** `setLang()` asks the server to translate only the words on Mia's screen: item names, reasons and urgency labels. The server drops any translation whose numbers differ from the English, so that line stays in English. Records, prices and approvals stay in English.

**Voice notes.** The browser records with `MediaRecorder`, and `/api/transcribe` sends the audio to OpenAI and returns text for the notes box. The server keeps the audio in memory for that request only, and the browser drops it, so only the text remains.

**Car diagram.** `carDiagram()` draws a car from above in Mia's panel, as inline SVG with no text on it, so it reads the same in every language. `wheelsOf()` gives an item's wheels only when its name clearly says where, such as "Front brake pads" or "Rear brake hose". Labour, brake fluid and anything unclear get no highlight, and the car is left out if no item has a known place. A wheel lights in the urgency colour of the most urgent item switched on there, and a wheel with its items switched off keeps a ring. The car also appears on Mia's approved and extra-item screens and on the workshop's Job panel, where an extra item's wheels show a ring until she approves it.

**Car details.** These are hand-built with no extra library. `odoHTML()` turns each digit of Mia's total into a drum, and `rollTotal()` rolls the reels to the new number. `tach()` is a strip of ticks filled to the share of the quote she's approving. `keyOn()` lights everything for a moment when the quote opens, like turning the key. `rubber()` makes a stamp, and the `#ink` SVG filter in `index.html` roughens its edges and leaves small gaps in the ink. History is a punched logbook, and the invoice gets a Paid stamp and a torn-off bottom edge. Anyone who has asked their device for reduced motion gets the final state with no animation.

**Job header.** `jobHead()` shows a plate, the car and the job number at the top of the job on both phones. The plate DEMO-1044 is a sample, labelled as one, and its plain look isn't based on any state's design.

**Add-ons.** `drSections()` splits Mia's quote: "optional" items go in their own section, and everything else stays under what the car needs. Only the layout changes, so switches and totals work as before.

**Invoice.** `invoice()` builds the lines from Mia's approvals, so there's nothing to retype, and approved items with no agreed price are left off. The screen has no input for a line, so a new charge has to go through the extra-item approval. `wsInvoice()` shows the draft and the send. Sending freezes a copy in `state.inv` and links it to the job in History, and no new extra can start after that. `invoiceSheet()` draws the same invoice on both phones, in English only. Prices include GST, so GST is one eleventh of the total. The ABN is a sample, and the invoice hasn't been checked against tax invoice rules.

**Xero demo.** The invoice's **Send to Xero** button opens `wsXero()`, which shows a draft preview and a simulated send, with no connection to Xero. `xeroCsv()` builds a real file with Xero's 27 sales invoice columns, where prices include GST, so choose tax inclusive when importing. The file hasn't been tested in Xero yet.

## Reliability

- **Demo mode:** returns the saved examples, with no AI call.
- **No API key:** the server uses the saved examples automatically.
- **AI slow or down:** the browser gives up after 15 seconds and shows a saved example, with a notice saying so.
- **No internet:** fonts and Motion load from `static/vendor/`, so Demo mode looks the same.

## What is simulated

- **Both phones run on one page.** There is no real second device.
- **No real text messages.** Reminders and booking links stay on the simulated phones. Nothing leaves your computer except what's sent to OpenAI: the notes, the customer-reported issue, voice notes and the words to translate.
- **No Xero connection.** The send is a demo. Only the CSV download is real.
- **No payments.** **Mark as paid** only records that the customer paid. The invoice text is simulated like the others, and the ABN is a sample.
- **No accounts or database.** Everything sits in browser memory, and **Reset** or a page refresh clears it.
- **Sample data only.** The history, price book, follow-ups, number plate, typical part prices and Results figures are invented examples.
- **Local only.** It runs on your computer and isn't hosted online.

Taking it to real users would need a database, sign-in, a text-message service such as Twilio, online hosting, and privacy handling for customer details.

## Glossary

| Term | Meaning |
|---|---|
| Framework | A pre-built toolkit like React. We don't use one |
| Build step | A process that compiles code before it runs. We don't have one |
| Endpoint | One address on a server, like `/api/quote` |
| Repository (repo) | The project and its full history in Git |
| Branch | A separate line of work in Git |
| Pull request | A proposal to merge one branch into another |
| Vendor folder | Third-party files stored in your own project |
