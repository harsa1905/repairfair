"""RepairFair demo: a small local web app for the presentation.

Run:  python app.py   then open http://localhost:5000
The OpenAI key is read from the .env file next to this script (never from the web page).
"""
import json
import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory

HERE = Path(__file__).resolve().parent
load_dotenv(HERE / ".env")

MODEL = os.getenv("OPENAI_MODEL", "gpt-6-luna")
REASONING = os.getenv("OPENAI_REASONING", "none").strip()  # "none" keeps gpt-6-luna fast (~4-5 s)
API_KEY = os.getenv("OPENAI_API_KEY", "").strip()

app = Flask(__name__, static_folder=str(HERE / "static"), static_url_path="/static")

STATUSES = {"needed_now", "can_wait", "optional", "to_confirm"}
TIERS = ["Used", "Economy", "OEM", "Premium"]

SYSTEM_PROMPT = """You turn an Australian mechanic's rough notes into a RepairFair standard quote.
Only organise what the mechanic wrote. Never invent prices, brands, part numbers, warranties or measurements.
If something isn't in the notes, use null and list it in "missing_info".

Return JSON only, in exactly this shape:
{
  "job_title": "short title, e.g. Front brakes",
  "car": "car if mentioned, else null",
  "customer": "customer first name if mentioned, else null",
  "items": [
    {
      "name": "short item name, e.g. Front pads",
      "kind": "part" | "labour" | "service",
      "status": "needed_now" | "can_wait" | "optional" | "to_confirm",
      "evidence": "measurement or photo note from the notes, else null",
      "why": "one plain-English sentence for the driver on why this item is on the quote, else null",
      "price": number or null,          // for items without part options
      "hours": number or null,          // labour only
      "rate": number or null,           // labour only, dollars per hour
      "warranty": "warranty text if given, else null",
      "brand": "brand if given, else null",
      "part_no": "part number if given, else null",
      "options": [                      // only if the notes give part options
        {"tier": "Used" | "Economy" | "OEM" | "Premium", "price": number or null, "warranty": "text or null", "brand": "brand or null", "part_no": "part number or null"}
      ]
    }
  ],
  "missing_info": ["things the workshop still needs to confirm"],
  "eta_note": "when the car will be ready, only if the notes say so (e.g. 'Ready today by 4pm', 'Parts arrive tomorrow morning'), else null"
}

Rules:
- status: use the mechanic's words. "need doing now", "unsafe", "shouldn't drive" -> needed_now. "can wait", "next service", "soon", "within X months" -> can_wait.
  "optional", "recommended", "if you like" -> optional. If unclear -> to_confirm.
- evidence: what the mechanic observed, in plain words, keeping measurements and whether a photo was taken,
  e.g. "Pads at 2 mm (photo taken)", "Crack in hose (photo taken)", "Last change unknown". Use null only if nothing was observed.
- missing_info: the most important things still to confirm, at most 4, most important first. Start with missing prices
  for items needed now, then missing brands or part numbers for the main parts (e.g. "Brand and part number for the pad options"),
  then missing warranties.
- why: explain to a driver who isn't a mechanic, in under 25 words, why this item is recommended at its status, using only
  what the mechanic observed (e.g. "Your front pads are worn to 2 mm, so braking is weaker and they can damage the rotors.").
  Don't add measurements, limits, prices or brands that aren't in the notes. For labour, say what the time covers.
- Part tiers: "Used" = second-hand or recycled part; "Economy" = budget aftermarket; "OEM" = genuine or same as factory;
  "Premium" = better than OEM. Only include tiers the mechanic mentions.
- Labour is its own item with kind "labour", hours and rate, and its warranty if given.
- Prices are in Australian dollars. Use plain numbers (160, not "$160").
- Keep names short and plain. No extra commentary outside the JSON."""

EXTRA_NOTE = ("These notes describe EXTRA work found mid-job. Return the same JSON shape, "
              "with only the new item(s) and their labour.")


def _num(v):
    try:
        return None if v is None or v == "" else round(float(v), 2)
    except (TypeError, ValueError):
        return None


def _str(v):
    return None if v in (None, "", "null") else str(v).strip()


def normalise(raw):
    """Make the AI output safe and predictable for the page."""
    items = []
    for it in raw.get("items") or []:
        if not isinstance(it, dict) or not _str(it.get("name")):
            continue
        kind = it.get("kind") if it.get("kind") in ("part", "labour", "service") else "part"
        status = it.get("status") if it.get("status") in STATUSES else "to_confirm"
        opts = []
        for o in it.get("options") or []:
            if isinstance(o, dict) and o.get("tier") in TIERS:
                opts.append({"tier": o["tier"], "price": _num(o.get("price")),
                             "warranty": _str(o.get("warranty")), "brand": _str(o.get("brand")),
                             "part_no": _str(o.get("part_no"))})
        opts.sort(key=lambda o: TIERS.index(o["tier"]))
        hours, rate, price = _num(it.get("hours")), _num(it.get("rate")), _num(it.get("price"))
        if kind == "labour" and price is None and hours is not None and rate is not None:
            price = round(hours * rate, 2)
        items.append({"name": _str(it["name"]), "kind": kind, "status": status,
                      "evidence": _str(it.get("evidence")), "why": (_str(it.get("why")) or "")[:220] or None, "price": price, "hours": hours, "rate": rate,
                      "warranty": _str(it.get("warranty")), "brand": _str(it.get("brand")),
                      "part_no": _str(it.get("part_no")), "options": opts})
    # Labour belongs to the job: if any part is needed now and the AI left labour unclear, mark labour needed now too
    if any(i["kind"] != "labour" and i["status"] == "needed_now" for i in items):
        for i in items:
            if i["kind"] == "labour" and i["status"] == "to_confirm":
                i["status"] = "needed_now"
    return {"job_title": _str(raw.get("job_title")) or "Quote", "car": _str(raw.get("car")),
            "customer": _str(raw.get("customer")), "items": items,
            "missing_info": [str(m) for m in (raw.get("missing_info") or []) if m],
            "eta_note": _str(raw.get("eta_note"))}


def demo_response(kind):
    with open(HERE / "demo_data" / f"{kind}.json", encoding="utf-8") as f:
        return normalise(json.load(f))


@app.get("/")
def index():
    return send_from_directory(HERE / "static", "index.html")


@app.get("/api/status")
def status():
    return jsonify({"ai_ready": bool(API_KEY), "model": MODEL})


@app.post("/api/quote")
def quote():
    body = request.get_json(silent=True) or {}
    notes = (body.get("notes") or "").strip()
    kind = "extra" if body.get("kind") == "extra" else "quote"
    if body.get("demo") or not API_KEY:
        return jsonify({"source": "demo", **demo_response(kind)})
    if not notes:
        return jsonify({"error": "Please type some notes first."}), 400

    from openai import OpenAI  # imported here so demo mode works even without the package configured
    try:
        client = OpenAI(api_key=API_KEY, timeout=40)
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        if kind == "extra":
            messages.append({"role": "system", "content": EXTRA_NOTE})
        messages.append({"role": "user", "content": notes})
        args = dict(model=MODEL, messages=messages, response_format={"type": "json_object"}, max_completion_tokens=2000)
        try:
            resp = client.chat.completions.create(**args, **({"reasoning_effort": REASONING} if REASONING else {}))
        except Exception as e:  # some models don't accept this reasoning setting: retry without it
            if "reasoning" not in str(e).lower():
                raise
            resp = client.chat.completions.create(**args)
        raw = json.loads(resp.choices[0].message.content or "{}")
        data = normalise(raw)
        if not data["items"]:
            return jsonify({"error": "The AI didn't return any items. Try again or switch on demo mode."}), 502
        return jsonify({"source": "ai", **data})
    except Exception as e:  # show a short, readable error on the page
        return jsonify({"error": f"AI request failed ({type(e).__name__}): {str(e)[:200]}. "
                                 "Check your key and model in .env, or switch on demo mode."}), 502


if __name__ == "__main__":
    print(f"\n  RepairFair demo running at http://localhost:5000")
    print(f"  AI: {'ready (' + MODEL + ')' if API_KEY else 'no API key found, so it will use demo mode'}\n")
    app.run(host="127.0.0.1", port=5000, debug=False)
