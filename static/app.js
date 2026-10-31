// RepairFair prototype: workshop phone (left) and driver phone (right) on one page.
// The "text link" between phones is simulated in the browser; only the AI call goes to the server.

const DEFAULT_NOTES = `2017 Mazda 3, customer Mia.
Front pads at 2mm, need doing now (photo taken). Pad options: economy $90 12 months, OEM $160 12 months/20,000 km, premium ceramic $210 24 months.
Front rotors 22.4mm, min 22mm, can wait till next service, $240 a pair.
Brake fluid last change unknown, optional flush.
Labour 1.5 hrs at $120/hr, 12 month workmanship warranty.`;

const DEFAULT_REPORTED = "Grinding noise when braking";

const DEFAULT_EXTRA = `Found a cracked rear brake hose (photo taken), needs doing now, shouldn't drive like this.
Hose options: economy $45 12 months, OEM $70 12 months.
Labour 0.5 hr at $120/hr.`;

const STATUS = { needed_now: "Needed now", can_wait: "Can wait", optional: "Optional", to_confirm: "To confirm" };
const AI_TIMEOUT_MS = 15000;
const WORKSHOP = "City Auto";
const PHONE_MASK = "04•• ••• 812";

const SEED_HISTORY = [
  { id: "J-1039", customer: "Tom", car: "2015 Hyundai i30", job: "90,000 km logbook service", date: "Wed 14 Oct",
    approvedAt: "10:12 am, Wed 14 Oct",
    items: [{ name: "Logbook service", price: 385, approved: true }, { name: "Wiper blades", price: 40, approved: true },
            { name: "Fuel injector cleaning", price: 89, approved: false }], extra: null },
  { id: "J-1036", customer: "Priya", car: "2021 Tesla Model 3", job: "Front tyres", date: "Fri 9 Oct",
    approvedAt: "2:47 pm, Fri 9 Oct",
    items: [{ name: "Front tyres (pair, OEM-spec)", price: 640, approved: true }, { name: "Fitting and balancing", price: 110, approved: true },
            { name: "Wheel alignment", price: 120, approved: false }], extra: null },
  { id: "J-1031", customer: "Dave", car: "2016 Toyota Hilux", job: "Rear brakes", date: "Fri 2 Oct",
    approvedAt: "9:05 am, Fri 2 Oct",
    items: [{ name: "Rear brake shoes (OEM)", price: 180, approved: true }, { name: "Labour", price: 190, approved: true }],
    extra: { decision: "approved", at: "11:38 am, Fri 2 Oct", items: [{ name: "Wheel cylinder", price: 85, approved: true }] } },
];

// The workshop's own prices and parts. RepairFair fills gaps from here; the AI never guesses a price.
// "key" is matched against item names; "tier" against part options (null = single-price item).
const SEED_BOOK = [
  { item: "Front brake pads", key: "pad", tier: "Economy", price: 90, warranty: "12 months", brand: "Value line", part_no: "FP-1120E" },
  { item: "Front brake pads", key: "pad", tier: "OEM", price: 160, warranty: "12 months / 20,000 km", brand: "Genuine", part_no: "FP-1120G" },
  { item: "Front brake pads", key: "pad", tier: "Premium", price: 210, warranty: "24 months", brand: "Ceramic Pro", part_no: "FP-1120C" },
  { item: "Front rotors (pair)", key: "rotor", tier: null, price: 240, warranty: "12 months", brand: "Genuine", part_no: "FR-2240" },
  { item: "Brake fluid flush", key: "fluid", tier: null, price: 90, warranty: "3 months", brand: "DOT 4 fluid", part_no: null },
  { item: "Rear brake hose", key: "hose", tier: "Economy", price: 45, warranty: "12 months", brand: "Value line", part_no: "BH-310E" },
  { item: "Rear brake hose", key: "hose", tier: "OEM", price: 70, warranty: "12 months", brand: "Genuine", part_no: "BH-310G" },
  { item: "Labour rate", key: "labour", tier: null, price: 120, unit: "/hr", warranty: "12 months workmanship", brand: null, part_no: null },
];

// "Typical price" ranges for the fair price check. Parts are illustrative samples; real ranges would come from quotes across
// workshops. Labour follows published Australian workshop rates (see pitch/qa-evidence.md on the pitch-dev branch).
const FAIR_RANGES = [
  { key: "pad", tier: "Economy", low: 70, high: 120 },
  { key: "pad", tier: "OEM", low: 130, high: 190 },
  { key: "pad", tier: "Premium", low: 180, high: 260 },
  { key: "rotor", low: 200, high: 320 },
  { key: "fluid", low: 70, high: 120 },
  { key: "hose", tier: "Economy", low: 35, high: 70 },
  { key: "hose", tier: "OEM", low: 60, high: 100 },
  { key: "labour", low: 120, high: 180 },
];

// Sample month for the owner's Results screen. Illustrative only; the live demo job is added on top.
const SAMPLE_MONTH = { quotes: 46, approved: 38, minutes: 14, extraAsked: 11, extraApproved: 9, extraValue: 1460, reminders: 12, booked: 5, bookedValue: 1105 };
const PRO_PRICE = 49;

const fresh = () => ({
  tab: "quote", ws: "compose", dr: "home", drBanner: null, stage: null, stageAt: {}, readyBy: null,
  notes: DEFAULT_NOTES, extraNotes: DEFAULT_EXTRA, reported: DEFAULT_REPORTED, suggest: null, suggesting: false,
  quote: null, extra: null, source: null, extraSource: null, notice: null, extraNotice: null,
  err: null, extraResult: null,
  sentAt: null, deliveredAt: null, viewedAt: null, approvedAt: null, xero: null,
  xSentAt: null, xDeliveredAt: null, xViewedAt: null, extraAt: null,
  history: SEED_HISTORY.map((j) => ({ ...j })), search: "", open: null, extraOpen: false,
  book: SEED_BOOK.map((e) => ({ ...e })),
  // Items a driver said "not now" to become follow-ups; the seeded ones come from past jobs in the history
  followups: [
    { id: "F-1036", customer: "Priya", car: "2021 Tesla Model 3", item: "Wheel alignment", price: 120, advised: "front tyres · Fri 9 Oct", due: new Date(Date.now() - 2 * 86400000), status: "due" },
    { id: "F-1039", customer: "Tom", car: "2015 Hyundai i30", item: "Fuel injector cleaning", price: 89, advised: "logbook service · Wed 14 Oct", due: new Date(Date.now() + 3 * 86400000), status: "due" },
  ],
});
// Default reminder delay (months) by urgency, for items the driver didn't approve
const FU_MONTHS = { needed_now: 0.5, to_confirm: 1, can_wait: 3, optional: 6 };
const FU_CHOICES = [[0.5, "2 weeks"], [1, "1 month"], [3, "3 months"], [6, "6 months"]];
let state = fresh();
let lastDr = null, lastWs = null, timers = [];

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (n) => (n == null ? "price to confirm" : "$" + (Number.isInteger(n) ? n.toLocaleString() : n.toFixed(2)));
const timeOf = (d) => d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" }).replace(/\s/g, " ").toLowerCase();
const dayOf = (d) => d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" }).replace(",", "");
const stampOf = (d) => `${timeOf(d)}, ${dayOf(d)}`;
// Icons come from the sprite in index.html; items get a warning-light style mark matched from their name
const ic = (name, size = 20, cls = "") => `<svg class="i ${cls}" width="${size}" height="${size}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
function itemIcon(it) {
  if (it.kind === "labour") return "time";
  const n = it.name.toLowerCase();
  return /fluid|oil|coolant|flush/.test(n) ? "fluid" : /rotor|disc/.test(n) ? "rotor" : /hose|pipe/.test(n) ? "hose"
    : /tyre|tire|wheel|alignment/.test(n) ? "tyre" : /pad|shoe|brake/.test(n) ? "brake" : "part";
}
const lightOf = (it) => (it.kind === "labour" ? "labour" : it.status);
const stLabel = (it) => `<span class="st ${it.status}">${STATUS[it.status]}</span>`;
const addMonths = (d, m) => { const x = new Date(d); if (m < 1) x.setDate(x.getDate() + Math.round(m * 30)); else x.setMonth(x.getMonth() + m); return x; };
const whenOf = (d) => (d - Date.now() < 45 * 86400000 ? dayOf(d) : d.toLocaleDateString("en-AU", { month: "short", year: "numeric" }));
const demoOn = () => $("demoMode").checked;
const later = (ms, fn) => timers.push(setTimeout(fn, ms));
const STAGES = ["Checked in", "Quote approved", "In repair", "Quality check", "Ready for pickup"];
const labourHrs = (items, onlyApproved) => items.filter((i) => i.kind === "labour" && (!onlyApproved || i.approved)).reduce((s, i) => s + (i.hours || 0), 0);
const round15 = (t) => { t = new Date(t); t.setSeconds(0, 0); t.setMinutes(Math.ceil(t.getMinutes() / 15) * 15); return t; };
// Workshop hours for ready-time estimates: 8:00 am to 5:30 pm, closed Sundays.
const atOpen = (x) => { const y = new Date(x); y.setHours(8, 0, 0, 0); return y; };
const atClose = (x) => { const y = new Date(x); y.setHours(17, 30, 0, 0); return y; };
const nextOpenDay = (x) => { let y = atOpen(new Date(new Date(x).getTime() + 86400000)); if (y.getDay() === 0) y = atOpen(new Date(y.getTime() + 86400000)); return y; };
function addWorkMinutes(d, mins) {
  let t = new Date(d);
  if (t.getDay() === 0) t = nextOpenDay(t);
  if (t < atOpen(t)) t = atOpen(t);
  if (t >= atClose(t)) t = nextOpenDay(t);
  while (mins > 0) {
    const left = (atClose(t) - t) / 60000;
    if (mins <= left) { t = new Date(t.getTime() + mins * 60000); mins = 0; }
    else { mins -= left; t = nextOpenDay(t); }
  }
  return t;
}
const etaFrom = (d, hrs) => round15(addWorkMinutes(d, Math.max(hrs, 0.5) * 60 + 30));
function etaText(d) {
  const today = new Date(), tom = new Date(today.getTime() + 86400000);
  const day = d.toDateString() === today.toDateString() ? "today" : d.toDateString() === tom.toDateString() ? "tomorrow" : dayOf(d);
  return `${day} ${timeOf(d)}`;
}

// ---------- item helpers ----------
function prepare(data) {
  data.items.forEach((it) => {
    const oem = it.options.findIndex((o) => o.tier === "OEM");
    it.opt = it.options.length ? (oem >= 0 ? oem : 0) : null;
    it.approved = it.status === "needed_now";
    it.priceGap = needsPrice(it); it.priceTbc = false; it.edited = false;
  });
  // Mechanic check: every gap the AI flagged must be resolved or marked "to confirm" before sending.
  // Missing prices get their own rows, so drop the AI's matching "price for X" lines.
  const common = ["front", "rear", "brake", "brakes", "pair", "left", "right", "with", "for", "the", "and"];
  const gapWords = data.items.filter((i) => i.priceGap).flatMap((i) => i.name.toLowerCase().match(/[a-z]{3,}/g) || []).filter((w) => !common.includes(w));
  data.checks = data.missing_info.filter((t) => !(/price|cost/i.test(t) && gapWords.some((w) => t.toLowerCase().includes(w))))
    .map((text) => ({ text, how: null, by: null }));
  data.checked = false; data.checkedAt = null;
  return data;
}
const needsPrice = (it) => (it.options.length ? it.options.some((o) => o.price == null) : it.price == null);
// Proof check: a "needed now" item must show a photo or a measurement. Only the mechanic can supply it; the app never fills it in.
const hasProof = (it) => /photo|\d/i.test(it.evidence || "");
const needsProof = (it) => it.status === "needed_now" && it.kind !== "labour";
const proofGap = (it) => needsProof(it) && (it.proofAdded || !hasProof(it));
function proofHint(it) {
  const n = it.name.toLowerCase();
  return /rotor|disc/.test(n) ? "the rotor thickness" : /pad|shoe/.test(n) ? "the pad thickness" : /tyre|tire/.test(n) ? "the tread depth" : "a photo or measurement";
}
function checkRows(q) {
  const rows = [];
  q.items.forEach((it, i) => { if (it.priceGap) rows.push({ kind: "price", i, text: `Price for ${it.name}`, how: !needsPrice(it) ? "resolved" : it.priceTbc ? "tbc" : null }); });
  q.items.forEach((it, i) => { if (proofGap(it)) rows.push({ kind: "proof", i, text: `Add ${proofHint(it)} for ${it.name} before sending`, tbcText: `Photo or measurement for ${it.name}`, how: hasProof(it) ? "resolved" : it.proofTbc ? "tbc" : null }); });
  q.checks.forEach((c, i) => rows.push({ kind: "info", i, text: c.text, how: c.how, by: c.by }));
  return rows;
}

// ---------- price book ----------
function bookFor(it, tier) {
  const name = it.name.toLowerCase();
  const hits = state.book.filter((e) => (it.kind === "labour" ? e.key === "labour" : e.key !== "labour" && name.includes(e.key)));
  return tier ? hits.find((e) => e.tier === tier) : hits.find((e) => !e.tier) || hits.find((e) => e.tier === "OEM") || hits[0];
}
// Fill only empty fields from the price book (never overwrite the mechanic's or the notes' numbers).
// Returns how many details were (or, with dry, would be) filled.
function bookFill(q, dry) {
  let n = 0;
  const put = (target, field, value) => { if (target[field] == null && value != null) { n++; if (!dry) target[field] = value; } };
  q.items.forEach((it) => {
    const before = n;
    if (it.options.length) it.options.forEach((o) => { const e = bookFor(it, o.tier); if (e) ["price", "warranty", "brand", "part_no"].forEach((f) => put(o, f, e[f])); });
    else if (it.kind === "labour") {
      const e = bookFor(it);
      if (e) { put(it, "rate", e.price); put(it, "warranty", e.warranty); if (!dry && it.price == null && it.hours != null && it.rate != null) it.price = Math.round(it.hours * it.rate * 100) / 100; }
    } else { const e = bookFor(it); if (e) ["price", "warranty", "brand", "part_no"].forEach((f) => put(it, f, e[f])); }
    if (!dry && n > before) it.fromBook = true;
  });
  if (!dry) q.checks.forEach((c) => {  // a flagged gap is resolved when the item it mentions is now complete
    if (c.how) return;
    const it = q.items.find((i) => i.fromBook && c.text.toLowerCase().includes(bookFor(i).key));
    const complete = it && (it.options.length ? it.options : [it]).every((o) => o.price != null && o.warranty != null && (it.kind === "labour" || o.brand != null));
    if (complete) { c.how = "resolved"; c.by = "book"; }
  });
  return n;
}
const openChecks = (q) => checkRows(q).filter((r) => !r.how).length;
const canSend = (q) => !openChecks(q) && q.checked;
const tbcList = (q) => checkRows(q).filter((r) => r.how === "tbc").map((r) => r.tbcText || r.text);
const priceOf = (it) => (it.options.length ? it.options[it.opt].price : it.price);
const warrantyOf = (it) => (it.options.length ? it.options[it.opt].warranty : it.warranty);
const sumApproved = (items) => items.filter((i) => i.approved).reduce((s, i) => s + (priceOf(i) || 0), 0);
const sumAll = (items) => items.reduce((s, i) => s + (priceOf(i) || 0), 0);
// Fair price check: compares an item's price (labour: its hourly rate) with the typical range for that part
function fairFor(it) {
  const name = it.name.toLowerCase(), tier = it.options.length ? it.options[it.opt].tier : null;
  return FAIR_RANGES.find((r) => (it.kind === "labour" ? r.key === "labour" : r.key !== "labour" && name.includes(r.key)) && (r.tier || null) === tier);
}
function fairCheck(it) {
  const r = fairFor(it), p = it.kind === "labour" ? it.rate : priceOf(it);
  return r && p != null ? { ...r, over: p > r.high } : null;
}
function fairLine(it, forDriver) {
  const c = fairCheck(it);
  if (!c) return "";
  const range = `$${c.low}\u2013$${c.high}${it.kind === "labour" ? " an hour" : ""}`;
  return c.over
    ? `<div class="fair over">Above the typical ${range}.${forDriver ? ` Ask ${WORKSHOP} why.` : ""}</div>`
    : `<div class="fair">${ic("check", 15)}Within the typical ${range}</div>`;
}
function fairSummary(items) {
  const checks = items.map(fairCheck).filter(Boolean), ok = checks.filter((c) => !c.over).length;
  return checks.length ? `${ok} of ${checks.length} prices within the typical range` : "";
}
const customer = () => (state.quote && state.quote.customer) || "Mia";
const carName = () => (state.quote && state.quote.car) || "your car";
const itemLabel = (i) => i.name + (i.options.length ? ` (${i.options[i.opt].tier})` : "");
const smsText = () => `Hi ${customer()}, your quote for the ${carName()} is ready. Please review and approve: repairfair.au/q/8F2K`;

// ---------- AI call with auto-fallback ----------
async function post(url, body) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), AI_TIMEOUT_MS);
  try {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body), signal: ctrl.signal });
    const data = await r.json();
    if (!r.ok || data.error) throw new Error(data.error || "Something went wrong.");
    return data;
  } finally { clearTimeout(timer); }
}
const callApi = (notes, kind, demo) => post("/api/quote", { notes, kind, demo });

// Suggested checks are for the mechanic only: they stay in state.suggest and are never sent to the quote or the driver
async function suggestChecks() {
  state.suggesting = true; state.suggest = null; render();
  let data, notice = null;
  try {
    data = await post("/api/checks", { issue: state.reported, demo: demoOn() });
  } catch (e) {
    notice = e.name === "AbortError" ? "The AI was slow, so a saved example is shown." : "The AI wasn't reachable, so a saved example is shown.";
    data = await post("/api/checks", { issue: state.reported, demo: true }).catch(() => null);
  }
  state.suggesting = false;
  state.suggest = data ? { source: data.source, notice, items: data.checks.map((c) => ({ ...c, done: false })) } : null;
  if (!data) toast("Couldn't get suggestions. Carry on with your notes.");
  render();
}

async function build(kind) {
  const notes = kind === "extra" ? state.extraNotes : state.notes;
  state.err = null;
  state.ws = kind === "extra" ? "extra_loading" : "loading";
  render();
  let data, notice = null;
  try {
    data = await callApi(notes, kind, demoOn());
  } catch (e) {
    if (demoOn()) { state.err = e.message; state.ws = kind === "extra" ? "approved" : "compose"; render(); return; }
    notice = e.name === "AbortError" ? "The AI was slow, so a saved example is shown." : "The AI wasn't reachable, so a saved example is shown.";
    try { data = await callApi(notes, kind, true); }
    catch (e2) { state.err = e2.message; state.ws = kind === "extra" ? "approved" : "compose"; render(); return; }
  }
  if (kind === "extra") {
    state.extra = prepare(data); state.extra.items.forEach((i) => (i.approved = false));
    state.extraSource = data.source; state.extraNotice = notice; state.ws = "extra_draft";
  } else {
    state.quote = prepare(data); state.quote.reported = state.reported.trim() || null;
    state.source = data.source; state.notice = notice; state.ws = "draft";
  }
  render();
}

// ---------- shared bits ----------
const srcTag = (src) => `<span class="src">${src === "ai" ? "Built by AI from your notes" : "Saved example"}</span>`;
// The mechanic check is the workshop's instrument panel: one amber light per gap the AI flagged
function checkPanel(q, group) {
  const rows = checkRows(q), open = rows.filter((r) => !r.how).length, fill = bookFill(q, true);
  const top = `<div class="cl-top"><b>Mechanic check</b>${srcTag(group === "extra" ? state.extraSource : state.source)}</div>`;
  const fillBtn = fill ? `<button class="ck-fill" data-act="book-fill" data-group="${group}">Fill ${fill} detail${fill > 1 ? "s" : ""} from your price book</button>` : "";
  if (!rows.length) return `<div class="cluster check">${top}<div class="readout md green">Nothing flagged</div>
    <div class="ck-sub">The AI found no gaps. Still check each item and price below.</div>${fillBtn}</div>`;
  return `<div class="cluster check">${top}
    <div class="readout md ${open ? "amber" : "green"}">${open ? `${open} gap${open > 1 ? "s" : ""}` : "All clear"}</div>
    <div class="ck-sub">${open ? `Fix each gap, or mark it to confirm with ${esc(customer())}.` : `Every gap is sorted. Check the items, then sign it off.`}</div>${fillBtn}
    ${rows.map((r) => {
      const d = `data-group="${group}" data-i="${r.i}" data-kind="${r.kind}"`;
      const acts = r.how === "resolved" ? `<span class="ck-done">${r.by === "book" ? "From price book" : r.kind !== "info" ? "Added" : "Resolved"}</span>${r.kind === "info" ? `<button class="ck-link" data-act="ck-undo" ${d}>Undo</button>` : ""}`
        : r.how === "tbc" ? `<span class="ck-tbc">To confirm</span><button class="ck-link" data-act="ck-undo" ${d}>Undo</button>`
        : `${r.kind !== "info" ? `<span class="ck-hint">Add below or</span>` : `<button class="ck-btn" data-act="ck-ok" ${d}>Resolved</button>`}<button class="ck-btn" data-act="ck-tbc" ${d}>Confirm later</button>`;
      return `<div class="ck-row ${r.how || "open"}"><span class="ck-ic"></span><span class="ck-t">${esc(r.text)}</span><span class="ck-a">${acts}</span></div>`;
    }).join("")}</div>`;
}
function refreshCheck(group) {
  const el = $("checks-" + group);
  if (el) el.innerHTML = checkPanel(doc(group), group);
  renderWsDock();
}
function decisions(items) {
  return items.map((i) => `<div class="dec ${i.approved ? "" : "no"}"><span class="n">${ic(i.approved ? "check" : "dash", 16, i.approved ? "y" : "x")}${esc(i.name)}</span><span class="s">${money(i.price ?? null)}</span></div>`).join("");
}
const decItems = (items) => items.map((i) => ({ name: itemLabel(i), price: priceOf(i), approved: i.approved }));

function tracker(title, steps, o = {}) {
  // steps: [label, Date|null]; the first step without a time is "now". o: optional readout, line and footer.
  const firstOpen = steps.findIndex((s) => !s[1]);
  return `<div class="tracker"><div class="tt"><span>${title}</span><span>to ${esc(customer())}, ${PHONE_MASK}</span></div>
    ${o.read ? `<div class="readout md ${o.cls || ""}">${o.read}</div>` : ""}${o.sub ? `<div class="cl-sub tr-sub">${o.sub}</div>` : ""}
    <div class="steps">${steps.map(([lbl, t], k) => `<div class="step ${t ? "done" : k === firstOpen ? "now" : ""}"><div class="dot">${t ? ic("check", 12) : ""}</div>${lbl}<span class="tm">${t ? timeOf(t) : "&nbsp;"}</span></div>`).join("")}</div>
    ${o.foot ? `<div class="cl-foot">${ic("check", 18)}${o.foot}</div>` : ""}</div>`;
}

let toastTimer = null;
function toast(text) {
  const t = $("wsToast");
  t.innerHTML = `${ic("check", 20)}${esc(text)}`;
  t.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 3200);
}

// ---------- workshop ----------
// Editable draft card: the mechanic can fix status, prices, labour and which part tier is pre-selected
const numIn = (v, act, d, pre = "$") => `<label class="num-wrap ${v == null ? "empty" : ""}">${pre}<input class="num" type="number" min="0" step="any" inputmode="decimal" data-act="${act}" ${d} value="${v ?? ""}" placeholder="?"></label>`;
function wsCard(it, i, group) {
  const d = `data-group="${group}" data-i="${i}"`;
  const sel = `<select class="status-sel ${it.status}" data-act="status" ${d} aria-label="Urgency">
    ${Object.keys(STATUS).map((k) => `<option value="${k}" ${k === it.status ? "selected" : ""}>${STATUS[k]}</option>`).join("")}</select>`;
  let b = "";
  if (proofGap(it)) b += `<label class="ev-ed"><span>Photo or measurement</span><input data-act="evidence" ${d} value="${esc(it.evidence || "")}" placeholder="What you measured, or photo taken"></label>`;
  else if (it.evidence) b += `<div class="ev">${/photo/i.test(it.evidence) ? ic("camera", 16) : ""}${esc(it.evidence)}</div>`;
  if (it.options.length) {
    b += `<div class="tiers">${it.options.map((o, k) => `<div class="tier ${k === it.opt ? "pre" : ""}" data-act="pre" ${d} data-k="${k}">
      <button class="pick" data-act="pre" ${d} data-k="${k}" title="Pre-select this option for ${esc(customer())}" aria-label="Pre-select ${esc(o.tier)}"></button>
      <span class="tn">${o.tier}<span class="tw">${esc([o.warranty || "warranty TBC", [o.brand, o.part_no].filter(Boolean).join(" ")].filter(Boolean).join(", "))}</span></span>${numIn(o.price, "price", `${d} data-k="${k}"`)}</div>`).join("")}</div>
      <div class="hint">The highlighted option is pre-selected for ${esc(customer())}. Tap another to change.</div>`;
  } else if (it.kind === "labour") {
    b += `<div class="edrow">${numIn(it.hours, "hours", d, "")}<span>hrs ×</span>${numIn(it.rate, "rate", d)}<span>/hr =</span><b class="lp">${money(it.price)}</b></div>`;
  } else b += `<div class="edrow"><span>Price</span>${numIn(it.price, "price", d)}</div>`;
  b += `<div class="fair-slot">${fairLine(it, false)}</div>`;
  if (!it.options.length && (it.brand || it.part_no)) b += `<div class="pn">${esc([it.brand, it.part_no && "part no. " + it.part_no].filter(Boolean).join(", "))}</div>`;
  if (warrantyOf(it) && !it.options.length) b += `<div class="war">Warranty: ${esc(warrantyOf(it))}</div>`;
  b += `<label class="why-ed"><span>${esc(customer())} reads (“${whyLabel(it)}”)</span><textarea rows="3" data-act="why" ${d} placeholder="Explain it in plain words for ${esc(customer())}">${esc(it.why || "")}</textarea></label>`;
  return `<div class="card ${it.edited ? "edited" : ""}"><div class="ch"><span class="it">${ic(itemIcon(it), 22, "ic " + lightOf(it))}${esc(it.name)}<span class="tag ed">Edited</span>${it.fromBook ? '<span class="tag bk">Price book</span>' : ""}</span>${sel}</div>${b}</div>`;
}

function wsReported() {
  const s = state.suggest;
  const list = state.suggesting ? `<div class="loading"><span class="spin"></span>Finding things to check…</div>`
    : s ? `<div class="sg-head"><b>Suggestions to check, not a diagnosis</b><button class="ck-link" data-act="suggest">Suggest again</button></div>
        ${s.notice ? `<div class="notice">${esc(s.notice)}</div>` : ""}
        ${s.items.map((c, i) => `<label class="sg-row"><input type="checkbox" data-act="sg-tick" data-i="${i}" ${c.done ? "checked" : ""}><span>${esc(c.check)}${c.why ? `<small>${esc(c.why)}</small>` : ""}</span></label>`).join("")}
        <div class="sg-foot">${s.source === "ai" ? "From AI" : "Saved example"}. Only you see these. Nothing goes on the quote unless you write it in your notes.</div>`
    : `<button class="ck-fill sg-btn" data-act="suggest">Suggest what to check</button>`;
  return `<div class="reported"><label class="rp-l" for="reported">Customer reported</label>
    <input id="reported" value="${esc(state.reported)}" placeholder="In the customer's words">${list}</div>`;
}
const reportedLine = (q, label) => (q.reported ? `<div class="said"><span>${label}</span>“${esc(q.reported)}”</div>` : "");

function wsQuoteTab() {
  const q = state.quote;
  const err = state.err ? `<div class="err">${esc(state.err)}<button class="btn soft" data-act="use-demo">Use saved examples</button></div>` : "";
  switch (state.ws) {
    case "compose":
      // The notes fill the screen like a job card; the build button sits in the dock below
      return `${wsReported()}<label class="notes-card"><span class="nc-top"><b>Mechanic's notes</b><span>Job 1044, checked in 8:05 am</span></span>
          <textarea id="notes">${esc(state.notes)}</textarea>
          <span class="photos"><span class="ph">${ic("camera", 18)}</span><span class="ph">${ic("camera", 18)}</span><span class="ph-t">2 photos attached</span></span></label>${err}`;
    case "loading":
      return `<div class="lbl">Mechanic's notes</div><textarea rows="11" disabled>${esc(state.notes)}</textarea>
        <div class="loading"><span class="spin"></span>AI is building the standard quote…</div><div class="skel"></div><div class="skel"></div>`;
    case "draft":
      return `${state.notice ? `<div class="notice">${esc(state.notice)}</div>` : ""}<div id="checks-quote">${checkPanel(q, "quote")}</div>
        <div class="lead">${esc(q.job_title)}${q.car ? `, ${esc(q.car)}` : ""}</div>
        ${reportedLine(q, "Customer reported")}
        ${q.items.map((it, i) => wsCard(it, i, "quote")).join("")}
        <div class="etaline">${ic("time", 18)}Ready ${esc(etaText(etaFrom(new Date(), labourHrs(q.items, true))))} if approved now (from labour hours)</div>
        <div class="preview"><div class="to"><span>Text message to ${esc(customer())}</span><span>${PHONE_MASK}</span></div><div class="bubble me">${esc(smsText())}</div></div>
        <button class="btn soft" data-act="edit">Edit notes and rebuild</button>`;
    case "sent":
      return `${tracker("Quote", [["Sent", state.sentAt], ["Delivered", state.deliveredAt], ["Viewed", state.viewedAt], ["Approved", null]],
          { read: state.viewedAt ? "Viewing now" : "Waiting", cls: "amber",
            sub: state.viewedAt ? `${esc(customer())} is looking at the quote now.` : `You'll get a notification when ${esc(customer())} responds.`,
            foot: `Checked by you before sending, ${esc(stampOf(q.checkedAt))}` })}
        <div class="lbl">Quote sent</div><div class="sheet">${q.items.map((i) => `<div class="row">${ic(itemIcon(i), 22, "ic " + lightOf(i))}<div><div class="it">${esc(i.name)}</div>${stLabel(i)}</div><span class="price">${money(priceOf(i))}</span></div>`).join("")}</div>`;
    default:
      return `<div class="cluster"><div class="cl-top"><b>Quote approved</b><span>${esc(timeOf(state.approvedAt))}</span></div>
          <div class="readout md green">${money(sumApproved(q.items))}</div>
          <div class="cl-sub">${esc(customer())} approved this quote. The work is now in the Job tab.</div></div>
        <button class="btn primary" data-tab="job">Open the job</button>`;
  }
}

// The job in progress: everything that happens after the driver approves
function wsJobTab() {
  if (state.xero) return wsXero();
  const q = state.quote, x = state.extra;
  const err = state.err ? `<div class="err">${esc(state.err)}<button class="btn soft" data-act="use-demo">Use saved examples</button></div>` : "";
  if (state.stage == null) return `<div class="blank">${ic("part", 36)}<b>No job in progress</b>A job starts here as soon as a customer approves a quote.</div>`;
  // One panel for the approval (the same lights Mia sees), then the job, then her decisions with their reminders
  let h = `<div class="cluster"><div class="cl-top"><b>${esc(customer())} approved</b><span>${esc(timeOf(state.approvedAt))}</span></div>
      <div class="readout green">${money(sumApproved(q.items))}</div>
      <div class="cl-sub">Start the work on the approved items only.</div>
      ${lamps(q.items, "ws")}
      <div class="cl-foot">${ic("check", 18)}Approved by text link, ${esc(stampOf(state.approvedAt))}</div></div>
    ${wsJob()}${wsDecisions()}`;
  if (state.ws === "approved") {
    h += state.extraOpen
      ? `<div class="lbl">Found extra work mid-job?</div><textarea id="extraNotes" rows="5">${esc(state.extraNotes)}</textarea>
        <button class="btn ai" data-act="build-extra">Build extra item with AI</button>${err}`
      : `<button class="btn soft" data-act="extra-open">${ic("part", 18)}Found something extra mid-job?</button>`;
  } else if (state.ws === "extra_loading") {
    h += `<div class="loading"><span class="spin"></span>AI is building the extra item…</div><div class="skel"></div>`;
  } else if (state.ws === "extra_draft") {
    h += `<div class="lead">Extra item</div>${state.extraNotice ? `<div class="notice">${esc(state.extraNotice)}</div>` : ""}
      <div id="checks-extra">${checkPanel(x, "extra")}</div>${x.items.map((it, i) => wsCard(it, i, "extra")).join("")}`;
  } else if (state.ws === "extra_sent") {
    h += `<div class="lead">Extra item</div>${tracker("Extra item", [["Sent", state.xSentAt], ["Delivered", state.xDeliveredAt], ["Viewed", state.xViewedAt], ["Decision", null]],
      { read: "Waiting", cls: "amber", sub: `Don't start the extra work until ${esc(customer())} decides.` })}`;
  } else if (state.ws === "extra_done") {
    const r = state.extraResult;
    h += `<div class="lead">Extra item</div>${tracker("Extra item", [["Sent", state.xSentAt], ["Delivered", state.xDeliveredAt], ["Viewed", state.xViewedAt], ["Decision", state.extraAt]],
      { read: r === "approved" ? "Approved" : r === "call" ? `Call ${esc(customer())}` : "Declined", cls: r === "approved" ? "green" : "amber",
        sub: r === "call" ? "Talk it through before doing any extra work." : r === "declined" ? "Don't do it. It's noted on the job as advised." : "Go ahead with the extra work." })}
      <div class="totalrow" style="margin:6px 2px 10px"><span>Final bill (matches approvals)</span><b>${money(sumApproved(q.items) + (r === "approved" ? sumApproved(x.items) : 0))}</b></div>
      <button class="btn primary" data-act="xero-open">Send to Xero</button>
      <button class="btn soft" data-act="go-history">View in History</button>`;
  }
  if (state.ws === "approved" && state.stage === 4) {
    h += `<div class="totalrow" style="margin:12px 2px 4px"><span>Final bill (matches approvals)</span><b>${money(sumApproved(q.items))}</b></div>
      <button class="btn primary" data-act="xero-open">Send to Xero</button>`;
  }
  return h;
}

// Xero demo: a preview and a simulated send, plus a real CSV laid out for Xero's sales invoice import. There is no connection to Xero.
// Demo prices include GST, as Australian consumer prices must, so GST is one eleventh of the total.
function invoice() {
  const q = state.quote, x = state.extra;
  const items = [...q.items, ...(state.extraResult === "approved" ? x.items : [])].filter((i) => i.approved);
  const lines = items.map((i) => {
    const hourly = i.kind === "labour" && i.hours && i.rate && Math.abs(i.hours * i.rate - i.price) < 0.005;
    return { desc: itemLabel(i), qty: hourly ? i.hours : 1, unit: hourly ? i.rate : priceOf(i) || 0, amount: priceOf(i) || 0, hours: hourly };
  });
  const total = lines.reduce((s, l) => s + l.amount, 0), gst = Math.round((total / 11) * 100) / 100;
  return { number: "INV-1044", contact: customer(), date: new Date(), lines, total, gst, ex: total - gst };
}
const cents = (n) => "$" + n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const auDate = (d) => [d.getDate(), d.getMonth() + 1].map((n) => String(n).padStart(2, "0")).join("/") + "/" + d.getFullYear();
const XERO_COLUMNS = ["*ContactName", "EmailAddress", "POAddressLine1", "POAddressLine2", "POAddressLine3", "POAddressLine4", "POCity", "PORegion", "POPostalCode", "POCountry",
  "*InvoiceNumber", "Reference", "*InvoiceDate", "*DueDate", "InventoryItemCode", "*Description", "*Quantity", "*UnitAmount", "Discount", "*AccountCode", "*TaxType",
  "TrackingName1", "TrackingOption1", "TrackingName2", "TrackingOption2", "Currency", "BrandingTheme"];
function xeroCsv() {
  const inv = invoice(), date = auDate(inv.date);
  const cell = (v) => {
    let s = String(v ?? "");
    if (/^[=+\-@]/.test(s)) s = "'" + s;  // stops a spreadsheet reading it as a formula
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = inv.lines.map((l) => {
    const row = { "*ContactName": inv.contact, "*InvoiceNumber": inv.number, Reference: state.quote.job_title, "*InvoiceDate": date, "*DueDate": date,
      "*Description": l.desc, "*Quantity": l.qty, "*UnitAmount": l.unit.toFixed(2), "*AccountCode": "200", "*TaxType": "GST on Income" };
    return XERO_COLUMNS.map((c) => cell(row[c])).join(",");
  });
  return [XERO_COLUMNS.join(","), ...rows].join("\r\n") + "\r\n";
}
function downloadXeroCsv() {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([xeroCsv()], { type: "text/csv" }));
  a.download = `repairfair-${invoice().number}-xero-import.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function wsXero() {
  const inv = invoice(), sent = state.xero === "sent";
  const row = (label, value, sub) => `<div class="res"><span>${esc(label)}${sub ? `<small>${esc(sub)}</small>` : ""}</span><b>${value}</b></div>`;
  return `<div class="demo-flag"><b>Demo only.</b> There's no live connection, and nothing is sent to Xero.</div>
    ${sent ? `<div class="cluster"><div class="cl-top"><b>Sent to Xero (demo)</b><span>${inv.number}</span></div>
        <div class="readout md green">${cents(inv.total)}</div>
        <div class="cl-sub">In a real setup this would arrive as a draft invoice for ${esc(inv.contact)}.</div></div>`
      : `<div class="lead">Draft invoice preview</div>`}
    <div class="sheet">
      ${row(inv.contact, inv.number, `${state.quote.car || ""}, ${dayOf(inv.date)}`)}
      ${inv.lines.map((l) => row(l.desc, cents(l.amount), l.hours ? `${l.qty} hrs at ${cents(l.unit)}` : "")).join("")}
      ${row("Subtotal excluding GST", cents(inv.ex))}
      ${row("GST (10%)", cents(inv.gst))}
      ${row("Total including GST", cents(inv.total))}
    </div>
    ${sent ? "" : `<button class="btn primary" data-act="xero-send">Send to Xero (demo)</button>`}
    <button class="btn soft" data-act="xero-csv">Download import file (CSV)</button>
    <div class="small">Laid out for Xero's sales invoice import. Choose tax inclusive when importing. Not yet tested in Xero.</div>
    <button class="btn soft" data-act="xero-close">Back to the job</button>`;
}

// Fixed bar under a draft: "I've checked this quote" unlocks Send once every flagged gap is handled
function renderWsDock() {
  const d = $("wsDock");
  if (state.tab === "quote" && state.ws === "compose") {
    d.className = "dock show";
    d.innerHTML = `<button class="btn ai" data-act="build" style="margin-top:0">Build standard quote with AI</button>
      <div class="small">Type it the way you'd write it on a job card. The AI does the rest.</div>`;
    return;
  }
  const g = state.tab === "quote" && state.ws === "draft" ? "quote" : state.tab === "job" && state.ws === "extra_draft" ? "extra" : null;
  if (!g) { d.className = "dock"; d.innerHTML = ""; return; }
  const q = doc(g), left = openChecks(q);
  const hint = left ? `Resolve ${left} flagged gap${left > 1 ? "s" : ""} above first`
    : !q.checked ? "Tick once you've checked every item and price"
    : g === "quote" ? `${esc(customer())} gets a text link to approve each item` : `Nothing extra starts until ${esc(customer())} says yes in writing`;
  d.className = "dock show";
  d.innerHTML = `<label class="confirm ${left ? "dis" : ""} ${q.checked && !left ? "on" : ""}"><input type="checkbox" data-act="checked" data-group="${g}" ${q.checked ? "checked" : ""} ${left ? "disabled" : ""}><span>I've checked this ${g === "quote" ? "quote" : "extra item"}</span></label>
    <button class="btn primary" data-act="${g === "quote" ? "send" : "send-extra"}" ${canSend(q) ? "" : "disabled"}>${g === "quote" ? `Send to ${esc(customer())} by text` : `Send to ${esc(customer())} for approval`}</button>
    <div class="small">${hint}</div>`;
}

function wsJob() {
  if (state.stage == null) return "";
  const st = state.stage;
  const next = { 1: ["start", "Start repair"], 2: ["qc", "Quality check done"], 3: ["ready", "Mark ready for pickup"] }[st];
  return `<div class="jobcard"><div class="jc-top"><span>Job status</span><span class="jc-stage ${st === 4 ? "ready" : ""}"><i></i>${STAGES[st]}</span></div>
    <div class="jc-eta"><span>${st === 4 ? "Ready since" : "Ready by"} <b>${esc(etaText(state.readyBy))}</b></span>${st === 4 ? "" : `<span class="adj"><button data-act="eta-">−15 min</button><button data-act="eta+">+15 min</button></span>`}</div>
    ${next ? `<button class="btn dark" data-act="${next[0]}">${next[1]}</button>` : `<div class="stamp" style="margin:10px 0 0">${ic("check", 18)}${esc(customer())} has been told the car is ready to collect.</div>`}
    </div>`;
}

// The driver's decisions. "Not now" items become follow-ups, booked right on their row and due later in Job history.
function wsDecisions() {
  const q = state.quote, fs = ourFollowups();
  const rows = q.items.map((it, k) => {
    const f = fs.find((x) => x.id === `F-1044-${k}`);
    const remind = !f ? "" : f.status === "off" ? `<span class="fu-off">${esc(f.customer)} opted out of a reminder</span>`
      : f.status === "booked" ? `<span class="fu-booked">Booked ${esc(slotText(f.bookedAt))}</span>`
      : f.status === "sent" ? `<span class="fu-off">Reminder sent</span>`
      : `<select class="fu-sel" data-act="fu-due" data-id="${f.id}" aria-label="Reminder for ${esc(f.item)}">${FU_CHOICES.map(([m, l]) => `<option value="${m}" ${m === f.months ? "selected" : ""}>Remind in ${l}</option>`).join("")}</select>`;
    return `<div class="dec ${it.approved ? "" : "no"}"><span class="n">${ic(it.approved ? "check" : "dash", 16, it.approved ? "y" : "x")}${esc(itemLabel(it))}</span><span class="s">${money(priceOf(it))}</span>${remind ? `<div class="dec-fu">${remind}</div>` : ""}</div>`;
  }).join("");
  return `<div class="lbl">${esc(customer())}'s decisions${fs.length ? ` <span class="soft">and reminders</span><span class="pro">Pro</span>` : ""}</div><div class="sheet">${rows}</div>
    ${fs.length ? `<div class="small" style="text-align:left;margin:-4px 2px 10px">RepairFair texts ${esc(customer())} when each one is due.</div>` : ""}`;
}
function wsFollowupsDue() {
  const fs = [...state.followups].sort((a, b) => a.due - b.due);
  const due = fs.filter((f) => f.status === "due").reduce((s, f) => s + (f.price || 0), 0);
  const booked = fs.filter((f) => f.status === "booked").reduce((s, f) => s + (f.price || 0), 0);
  return `<div class="fu-head"><b>Follow-ups</b><span class="pro">Pro</span><span class="fu-sum">${due ? `${money(due)} of advised work due` : "All caught up"}${booked ? `, ${money(booked)} booked` : ""}</span></div>
    <div class="sheet fu">${fs.map((f) => {
      const late = f.due < Date.now();
      const right = f.status === "due" || f.status === "scheduled" ? `<button class="ck-btn" data-act="fu-send" data-id="${f.id}">Send reminder</button>`
        : f.status === "sent" ? `<span class="ck-done">Reminder sent</span>`
        : f.status === "booked" ? `<span class="ck-done">Booked</span>`
        : `<span class="fu-off">Opted out</span>`;
      return `<div class="fu-row ${f.ours ? "new" : ""}"><div class="fu-t"><b>${esc(f.item)}, ${money(f.price)}</b>
        <span>${esc(f.customer)}, ${esc(f.car)}. Advised ${esc(f.advised.split(" · ")[1] || "")}</span>
        ${f.status === "due" ? `<span class="fu-due ${late ? "late" : ""}">${late ? "Due since" : "Due"} ${esc(dayOf(f.due))}</span>` : ""}
        ${f.status === "scheduled" ? `<span>Due around ${esc(whenOf(f.due))}</span>` : ""}
        ${f.status === "booked" ? `<span class="fu-booked">Booked ${esc(slotText(f.bookedAt))}, ${money(f.price)}</span>` : ""}</div>${right}</div>
        ${f.status === "sent" ? `<div class="bubble me fu-bub">${esc(reminderText(f))}</div>` : ""}`;
    }).join("")}</div>`;
}

// What the workshop gained: the sample month plus anything that happened in this demo
function wsResultsTab() {
  const s = { ...SAMPLE_MONTH };
  if (state.sentAt) s.quotes++;
  if (state.approvedAt) s.approved++;
  if (state.xSentAt) s.extraAsked++;
  if (state.extraResult === "approved") { s.extraApproved++; s.extraValue += sumApproved(state.extra.items); }
  s.reminders += state.followups.filter((f) => f.reminded).length;
  state.followups.filter((f) => f.status === "booked").forEach((f) => { s.booked++; s.bookedValue += f.price || 0; });
  const won = s.extraValue + s.bookedValue;
  const row = (label, value, sub) => `<div class="res"><span>${label}${sub ? `<small>${sub}</small>` : ""}</span><b>${value}</b></div>`;
  return `<div class="cluster"><div class="cl-top"><b>Extra revenue won</b><span>Sample month</span></div>
      <div class="readout green">${money(won)}</div>
      <div class="cl-sub">From approved extra work and follow-ups. About ${Math.floor(won / PRO_PRICE)} times the ${money(PRO_PRICE)} Pro plan.</div></div>
    <div class="lbl">This month <span class="pro">Pro</span></div>
    <div class="sheet">
      ${row("Quotes sent", s.quotes)}
      ${row("Quotes approved", `${Math.round((s.approved / s.quotes) * 100)}%`, `${s.approved} of ${s.quotes}`)}
      ${row("Typical time to approval", `${s.minutes} min`)}
      ${row("Extra work approved", money(s.extraValue), `${s.extraApproved} of ${s.extraAsked} requests`)}
      ${row("Follow-ups booked", money(s.bookedValue), `${s.booked} from ${s.reminders} reminders`)}
    </div>
    <div class="small">Sample figures for this demo. Today's job adds to them as you go.</div>`;
}

function jobTotal(j) { return j.items.filter((i) => i.approved).reduce((s, i) => s + (i.price || 0), 0) + (j.extra && j.extra.decision === "approved" ? j.extra.items.reduce((s, i) => s + (i.price || 0), 0) : 0); }

function wsHistoryTab() {
  const q = state.search.trim().toLowerCase();
  const jobs = state.history.filter((j) => !q || [j.id, j.customer, j.car, j.job, ...j.items.map((i) => i.name)].join(" ").toLowerCase().includes(q));
  let h = `<input class="search" id="search" placeholder="Search customer, car, job or item" value="${esc(state.search)}">`;
  if (!jobs.length) return h + `<div class="small">No jobs match “${esc(state.search)}”.</div>`;
  h += jobs.map((j) => {
    const open = state.open === j.id;
    let d = "";
    if (open) {
      d = `<div class="jd"><div class="lbl">Approved items</div>${decisions(j.items)}`;
      if (j.extra) d += `<div class="lbl">Extra work, ${j.extra.decision} <span class="soft">${esc(j.extra.at)}</span></div>${decisions(j.extra.items)}`;
      d += `</div>`;
    }
    return `<div class="job ${j.isNew ? "new" : ""}" data-act="job" data-id="${j.id}">
      <div class="jt"><span>${esc(j.job)}${j.isNew ? '<span class="tagnew">New</span>' : ""}</span><span>${money(jobTotal(j))}</span></div>
      <div class="jm">${esc(j.customer)}, ${esc(j.car)}. ${esc(j.date)}, ${j.id}</div>
      <div class="jp">${ic("check", 16)}Approved by text link, ${esc(j.approvedAt)}${j.extra ? `. Extra ${esc(j.extra.decision)}` : ""}</div>${d}</div>`;
  }).join("");
  return h + `<div class="small">Every approval is timestamped and searchable. No more digging through old books.</div>`;
}

function wsBookTab() {
  let last = null;
  const rows = state.book.map((e, i) => {
    const head = e.item !== last ? `<div class="bk-item">${esc(e.item)}</div>` : "";
    last = e.item;
    return `${head}<div class="bk-row"><span class="bk-t">${e.tier ? `<b>${e.tier}</b>` : ""}${esc([e.brand, e.part_no].filter(Boolean).join(" ") || (e.key === "labour" ? "Workshop hourly rate" : ""))}<span class="tw">${esc(e.warranty || "no warranty set")}</span></span>
      <span class="bk-p">${numIn(e.price, "book", `data-i="${i}"`)}${e.unit ? `<small>${e.unit}</small>` : ""}</span></div>`;
  }).join("");
  return `<div class="bk-head"><div><b>Your price book</b><span class="pro">Pro</span></div><span>${state.book.length} prices</span></div>
    <div class="small" style="text-align:left;margin:0 2px 9px">Your own prices, brands and part numbers. RepairFair fills quote gaps from here. The AI never guesses a price.</div>
    <div class="sheet bk">${rows}</div>
    <div class="small">Change a price here and the next quote uses it.</div>`;
}

// ---------- driver ----------
const whyLabel = (it) => (it.kind === "labour" ? "What does this cover?"
  : { needed_now: "Why is this needed now?", can_wait: "Why can this wait?", optional: "Why is this suggested?" }[it.status] || "Why is this on the quote?");
// One row per item. With a toggle, the switch turns the item (and its light in the panel) on or off.
function drRow(it, i, group, toggle = true) {
  const d = `data-group="${group}" data-i="${i}"`;
  let m = "";
  if (it.evidence) m += `<div class="ev">${/photo/i.test(it.evidence) ? ic("camera", 16) : ""}${esc(it.evidence)}</div>`;
  if (it.kind === "labour" && it.hours != null) m += `<div class="ev">${it.hours} hrs at ${money(it.rate)} an hour</div>`;
  if (it.options.length) {
    m += `<div class="opts">${it.options.map((o, k) => `<button class="opt ${k === it.opt ? "sel" : ""}" data-act="opt" ${d} data-k="${k}"><span class="t">${o.tier}</span><b>${money(o.price)}</b><span class="w">${esc((o.warranty || "warranty TBC").replace(/\s*\/\s*/g, " or "))}</span></button>`).join("")}</div>`;
    const o = it.options[it.opt];
    m += fairLine(it, true) + `<div class="pn">${esc(o.brand || "Brand to confirm")}, ${o.part_no ? "part no. " + esc(o.part_no) : "part no. to confirm"}</div>`;
  } else {
    m += fairLine(it, true);
    if (it.brand || it.part_no) m += `<div class="pn">${esc([it.brand, it.part_no && "part no. " + it.part_no].filter(Boolean).join(", "))}</div>`;
    if (warrantyOf(it)) m += `<div class="war">Warranty: ${esc(warrantyOf(it))}</div>`;
  }
  if (it.why) m += `<button class="why-btn ${it.whyOpen ? "open" : ""}" data-act="why-toggle" ${d} aria-expanded="${!!it.whyOpen}">${whyLabel(it)}</button>${it.whyOpen ? `<div class="why">${esc(it.why)}<span>From your mechanic's inspection notes</span></div>` : ""}`;
  const sw = toggle ? `<button class="sw" role="switch" aria-checked="${!!it.approved}" aria-label="${esc(it.name)}" data-act="sw" ${d}></button>` : "<span></span>";
  return `<div class="row ${toggle && !it.approved ? "off" : ""}" id="row-${group}-${i}">${ic(itemIcon(it), 22, "ic " + lightOf(it))}
    <div><div class="ch"><span class="it">${esc(it.name)}</span><span class="price">${money(priceOf(it))}</span></div>${it.kind === "labour" ? "" : stLabel(it)}</div>${sw}
    <div class="more">${m}</div></div>`;
}
// The driver's instrument panel: the total being approved, and one light per item that's on
const lamps = (items, group) => `<div class="lights">${items.map((it, i) => `<span class="lamp ${lightOf(it)} ${it.approved ? "on" : ""}" id="lamp-${group}-${i}" title="${esc(it.name)}">${ic(itemIcon(it), 26)}</span>`).join("")}</div>`;
function drQuotePanel(q) {
  return `<div class="cluster"><div class="cl-top"><b>City Auto</b><span>${esc(carName())}</span></div>
    <div class="readout" id="drRead">${money(sumApproved(q.items))}</div>
    <div class="cl-sub" id="drSub">to approve today, out of ${money(sumAll(q.items))} quoted</div>
    ${lamps(q.items, "quote")}
    <div class="cl-foot">${ic("check", 18)}Checked by a City Auto mechanic before it was sent</div>
    ${fairSummary(q.items) ? `<div class="cl-foot">${ic("check", 18)}${fairSummary(q.items)}</div>` : ""}</div>`;
}
// Flip an item without re-rendering, so the switch slides and its light fades rather than snapping
function toggleItem(group, i) {
  const it = grp(group)[i];
  it.approved = !it.approved;
  const row = $(`row-${group}-${i}`);
  row.classList.toggle("off", !it.approved);
  row.querySelector(".sw").setAttribute("aria-checked", it.approved);
  $(`lamp-${group}-${i}`).classList.toggle("on", it.approved);
  const read = $("drRead");
  read.textContent = money(sumApproved(state.quote.items));
  pulse(read);
  renderDriverChrome();
}

function drFollowups() {
  const fs = ourFollowups();
  if (!fs.length) return "";
  return `<div class="lbl">Not now, but not forgotten</div><div class="sheet fu">${fs.map((f) => `<div class="fu-row ${f.status}">
      <div class="fu-t"><b>${esc(f.item)}</b><span>${f.status === "booked" ? `Booked ${esc(slotText(f.bookedAt))}` : f.status === "sent" ? "Reminder sent" : f.status === "off" ? "No reminder" : `We'll text you around ${esc(whenOf(f.due))}`}</span></div>
      ${f.status === "booked" || f.status === "sent" ? "" : `<button class="ck-link" data-act="fu-toggle" data-id="${f.id}">${f.status === "off" ? "Remind me" : "Don't remind me"}</button>`}</div>`).join("")}
    <div class="small" style="text-align:left">Nothing is booked. City Auto just checks in when it's due.</div></div>`;
}

function tbcBox(q) {
  const list = tbcList(q);
  return list.length ? `<div class="missing"><b>City Auto will confirm before starting</b>${list.map(esc).join("<br>")}</div>` : "";
}

function lockScreen(withNotif) {
  const now = new Date();
  const notif = withNotif ? `<div class="notif" data-act="open-thread"><div class="app">${ic("msg", 22)}</div><div style="flex:1">
      <div class="top"><span>Messages</span><span>now</span></div><div class="ti">City Auto</div>
      <div class="tx">Hi ${esc(customer())}, your quote for the ${esc(carName())} is ready. Please review and approve…</div></div></div>
      <div class="tapme">Tap to open</div>` : "";
  return `<div class="lockscreen"><div class="d">${now.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" }).replace(",", "")}</div>
    <div class="t">${timeOf(now).replace(/\s?(am|pm)/, "")}</div>${notif}${withNotif ? "" : '<div class="hint">Waiting for a message from the workshop…</div>'}</div>`;
}

function thread() {
  const q = state.quote;
  const need = q.items.filter((i) => i.status === "needed_now").length;
  const wait = q.items.length - need;
  return `<div class="thread"><div class="tstamp">Today ${timeOf(state.sentAt)}</div>
    <div class="bubble">Hi ${esc(customer())}, it's City Auto. Your quote for the ${esc(carName())} is ready. Please review and approve below.</div>
    <div class="linkcard" data-act="open-quote"><div class="lc-top"><img src="/static/logo.svg" alt=""><div><div class="lc-k">RepairFair quote</div><div class="lc-t">${esc(q.job_title)}</div></div></div>
      <div class="lc-b"><div class="row2">${need ? `<span class="key needed_now"><i></i>${need} needed now</span>` : ""}${wait ? `<span class="key can_wait"><i></i>${wait} other item${wait > 1 ? "s" : ""}</span>` : ""}</div>
      <span class="cta">View and approve</span><div class="dom">repairfair.au</div></div></div>
    ${state.dr === "thread" && !state.viewedAt ? "" : ""}</div>`;
}

function drStatus() {
  if (state.stage == null) return "";
  const st = state.stage;
  return `<div class="statuscard"><div class="sc-top"><span>Your ${esc(carName())}</span><span class="eta ${st === 4 ? "ready" : ""}">${st === 4 ? "Ready now" : "Ready " + esc(etaText(state.readyBy))}</span></div>
    <div class="vsteps">${STAGES.map((lbl, k) => `<div class="vs ${k < st || st === 4 ? "done" : k === st ? "now" : ""}"><span class="vd">${k <= st ? ic("check", 12) : ""}</span><span class="vl">${lbl}</span><span class="vt">${state.stageAt[k] ? esc(timeOf(state.stageAt[k])) : ""}</span></div>`).join("")}</div></div>`;
}

function renderDriver() {
  const q = state.quote, x = state.extra;
  switch (state.dr) {
    case "home": return lockScreen(false);
    case "notified": return lockScreen(true);
    case "thread": return thread();
    case "quote":
      return `${drQuotePanel(q)}
        <div class="etaline">${ic("time", 18)}${q.eta_note ? esc(q.eta_note) : `If you approve now: ready ${esc(etaText(etaFrom(new Date(), labourHrs(q.items, true))))}`}</div>
        ${tbcBox(q)}
        ${reportedLine(q, "You told us")}
        <div class="lead">${esc(customer())}, choose what we do today</div>
        <div class="sheet">${q.items.map((it, i) => drRow(it, i, "quote")).join("")}</div>
        <div class="small">Nothing starts until you approve. Your approval is saved with the quote.</div>
        <div class="small">Typical part prices are sample data for this demo. The labour range comes from published workshop rates.</div>`;
    case "approved":
      return `<div class="cluster"><div class="cl-top"><b>You approved</b><span>${esc(carName())}</span></div>
          <div class="readout green">${money(sumApproved(q.items))}</div>
          <div class="cl-sub">City Auto has your approval in writing.</div>
          ${lamps(q.items, "done")}
          <div class="cl-foot">${ic("check", 18)}Saved to your service record, ${esc(stampOf(state.approvedAt))}</div></div>
        ${drStatus()}
        <div class="lbl">Your decisions</div><div class="sheet">${decisions(decItems(q.items))}</div>
        ${drFollowups()}`;
    case "extra":
      return `<div class="cluster"><div class="cl-top"><b>Found mid-job</b><span>${esc(q.job_title)}</span></div>
          <div class="readout">${money(sumAll(x.items))}</div>
          <div class="cl-sub"><b>${esc(x.items[0].name)}</b> needs your OK before City Auto continues.</div>
          ${lamps(x.items.map((it) => ({ ...it, approved: true })), "extra")}</div>
        <div class="bigphoto"><span>${ic("camera", 18)}Photo from City Auto</span><span>tap to enlarge</span></div>
        ${tbcBox(x)}<div class="sheet">${x.items.map((it, i) => drRow(it, i, "extra", false)).join("")}</div>
        <div class="small">The workshop won't start this until you decide.</div>`;
    case "extra_done": {
      const r = state.extraResult;
      const m = r === "approved" ? "Extra work approved" : r === "call" ? "City Auto will call you" : "Extra work declined";
      const s = r === "approved" ? "Saved with your quote." : r === "call" ? "Nothing extra starts until you agree." : "City Auto won't do it.";
      return `<div class="cluster"><div class="cl-top"><b>${m}</b>${r === "call" ? ic("phone", 18) : ""}</div>
          <div class="readout ${r === "approved" ? "green" : ""}">${money(sumApproved(q.items) + (r === "approved" ? sumApproved(x.items) : 0))}</div>
          <div class="cl-sub">Your final bill. ${s}</div>
          <div class="cl-foot">${ic("check", 18)}Decision saved, ${esc(stampOf(state.extraAt))}</div></div>
        ${drStatus()}
        <div class="small">Only what you approved. No surprises.</div>`;
    }
    case "book": {
      const f = activeFu();
      return `<div class="cluster"><div class="cl-top"><b>City Auto</b><span>${esc(f.car)}</span></div>
          <div class="readout md">${money(f.price)}</div>
          <div class="cl-sub"><b>${esc(f.item)}</b>, advised on your ${esc(f.advised.split(" · ")[0])} job.</div></div>
        <div class="lead">Pick a time that suits you</div>
        <div class="sheet">${f.slots.map((t, k) => `<button class="slot" data-act="book-slot" data-k="${k}"><span>${esc(dayOf(t))}</span><b>${esc(timeOf(t))}</b></button>`).join("")}</div>
        <button class="btn soft" data-act="book-done">Not right now</button>
        <div class="small">Reply STOP to the text to opt out of reminders.</div>`;
    }
    case "booked": {
      const f = activeFu();
      return `<div class="cluster"><div class="cl-top"><b>You're booked in</b><span>${esc(f.car)}</span></div>
          <div class="readout md green">${esc(dayOf(f.bookedAt))}</div>
          <div class="cl-sub">${esc(timeOf(f.bookedAt))} at City Auto for ${esc(f.item)}.</div></div>
        <button class="btn soft" data-act="book-done">Done</button>`;
    }
    case "ready": {
      const total = sumApproved(q.items) + (x && state.extraResult === "approved" ? sumApproved(x.items) : 0);
      return `<div class="cluster"><div class="cl-top"><b>Your car is ready</b><span>Open until 5:30 pm</span></div>
          <div class="readout green">${money(total)}</div>
          <div class="cl-sub">Final bill. Exactly what you approved, paid at pickup.</div>
          <div class="cl-foot">${ic("check", 18)}Itemised invoice saved to your service record</div></div>
        ${drStatus()}`;
    }
  }
  return "";
}

function renderDriverChrome() {
  const lock = state.dr === "home" || state.dr === "notified";
  document.querySelector(".dr-phone").classList.toggle("lock", lock);
  $("drTop").innerHTML = lock ? "" : state.dr === "thread"
    ? `<div class="thread-head"><span class="back">‹</span><div class="av">CA</div><div class="nm">City Auto ›</div></div>`
    : `<div class="urlbar">${ic("lock", 14)}repairfair.au/q/8F2K</div>`;
  $("drBanner").innerHTML = state.drBanner === "ready" ? `<div class="notif" data-act="open-ready"><div class="app">${ic("msg", 22)}</div><div style="flex:1">
      <div class="top"><span>Messages, City Auto</span><span>now</span></div><div class="ti">Your car is ready</div>
      <div class="tx">Your ${esc(carName())} is ready to collect. Tap to view your final bill.</div></div></div>`
    : state.drBanner === "reminder" ? `<div class="notif" data-act="open-book"><div class="app">${ic("msg", 22)}</div><div style="flex:1">
      <div class="top"><span>Messages, City Auto</span><span>now</span></div><div class="ti">Time for your ${esc(activeFu().item)}</div>
      <div class="tx">Hi ${esc(activeFu().customer)}, want to book it in? Tap to pick a time.</div></div></div>`
    : state.drBanner === "extra" ? `<div class="notif" data-act="open-extra"><div class="app">${ic("msg", 22)}</div><div style="flex:1">
      <div class="top"><span>Messages, City Auto</span><span>now</span></div><div class="ti">We found something</div>
      <div class="tx">${esc(state.extra.items[0].name)}: needs your OK before we continue. Tap to view.</div></div></div>` : "";
  const d = $("drDock");
  if (state.dr === "quote") {
    d.className = "dock show";
    d.innerHTML = `<div class="totalrow"><span>You're approving</span><b>${money(sumApproved(state.quote.items))}</b></div>
      <button class="btn primary" data-act="approve">Approve selected items</button>`;
  } else if (state.dr === "extra") {
    d.className = "dock show";
    d.innerHTML = `<div class="totalrow"><span>New item total</span><b>${money(sumAll(state.extra.items))}</b></div>
      <div class="btns"><button class="btn primary" data-act="x-approve">Approve</button><button class="btn soft" data-act="x-decline">Decline</button><button class="btn soft" data-act="x-call">Call me</button></div>`;
  } else { d.className = "dock"; d.innerHTML = ""; }
}

// ---------- render ----------
function render() {
  document.querySelectorAll("#wsTabs .tab, #resultsBtn").forEach((t) => t.classList.toggle("on", t.dataset.tab === state.tab));
  const keepSearchFocus = document.activeElement && document.activeElement.id === "search";
  const wsKey = state.tab + ":" + state.ws;
  $("ws").innerHTML = `<div class="${state.tab === "quote" && state.ws === "compose" ? "fill" : ""}">${({ job: wsJobTab, followups: wsFollowupsDue, history: wsHistoryTab, book: wsBookTab, results: wsResultsTab }[state.tab] || wsQuoteTab)()}</div>`;
  if (wsKey !== lastWs) { $("ws").scrollTop = 0; enter($("ws").firstElementChild); }
  lastWs = wsKey;
  if (keepSearchFocus) { const s = $("search"); s.focus(); s.setSelectionRange(s.value.length, s.value.length); }
  const drChanged = state.dr !== lastDr;
  $("dr").innerHTML = `<div>${renderDriver()}</div>`;
  if (drChanged) { $("dr").scrollTop = 0; enter($("dr").firstElementChild); }
  lastDr = state.dr;
  renderDriverChrome();
  renderWsDock();
  $("wsTitle").textContent = state.quote ? `City Auto, ${state.quote.job_title.toLowerCase()}` : "City Auto";
}

function fly(id) { const el = $(id); el.classList.remove("go"); void el.offsetWidth; el.classList.add("go"); }
// Motion (static/vendor/motion.js), using transform and opacity so the browser runs it off the main thread: a short staggered rise when a screen changes, and a small settle when a total updates.
// Skipped if the library didn't load or the viewer asked for reduced motion.
const M = window.Motion, still = matchMedia("(prefers-reduced-motion: reduce)").matches;
const EASE_OUT = [0.23, 1, 0.32, 1];
function enter(el) {
  if (!M || still || !el) return;
  M.animate([...el.children], { opacity: [0, 1], transform: ["translateY(8px)", "none"] }, { duration: 0.28, delay: M.stagger(0.035), ease: EASE_OUT });
}
function pulse(el) { if (M && !still && el) M.animate(el, { opacity: [0.4, 1], transform: ["translateY(-4px)", "none"] }, { duration: 0.2, ease: EASE_OUT }); }
const doc = (name) => (name === "extra" ? state.extra : state.quote);
const grp = (name) => doc(name).items;

function bookFollowups() {
  const q = state.quote;
  state.followups = state.followups.filter((f) => !f.ours);
  q.items.forEach((it, k) => {
    if (it.approved || it.kind === "labour") return;
    const months = FU_MONTHS[it.status] ?? 3;
    state.followups.push({ id: `F-1044-${k}`, ours: true, customer: customer(), car: q.car || "", item: itemLabel(it), price: priceOf(it),
      advised: `${q.job_title.toLowerCase()} · ${dayOf(state.approvedAt)}`, months, due: addMonths(state.approvedAt, months), status: "scheduled", why: it.why });
  });
}
const ourFollowups = () => state.followups.filter((f) => f.ours);
const reminderText = (f) => `Hi ${f.customer}, it's City Auto. When we did your ${f.advised.split(" · ")[0]} we advised: ${f.item}${f.price != null ? ` (${money(f.price)})` : ""}. Want to book it in? Pick a time: repairfair.au/b/7K3D. Reply STOP to opt out.`;
const activeFu = () => state.followups.find((f) => f.id === state.fuActive);
const slotText = (t) => `${dayOf(t)}, ${timeOf(t)}`;
// Three times to offer from a reminder link, on the next open days. This isn't a calendar: the workshop just sees what was picked.
function offerSlots() {
  let day = new Date();
  return [[9, 0], [13, 30], [10, 0]].map(([h, m]) => { day = nextOpenDay(day); const t = new Date(day); t.setHours(h, m, 0, 0); return t; });
}

function recordJob() {
  const q = state.quote;
  const job = { id: "J-1044", isNew: true, customer: customer(), car: q.car || "—", job: q.job_title,
    date: dayOf(state.approvedAt), approvedAt: stampOf(state.approvedAt), items: decItems(q.items), extra: null };
  state.history = [job, ...state.history.filter((j) => j.id !== "J-1044")];
}

document.addEventListener("click", (e) => {
  if (e.target.closest(".num-wrap")) return;  // a price box keeps focus; don't let its row re-render
  const b = e.target.closest("[data-act], [data-tab]");
  if (!b || b.tagName === "SELECT" || b.tagName === "INPUT" || b.tagName === "TEXTAREA") return;
  if (b.dataset.tab) { state.tab = b.dataset.tab; render(); return; }
  const act = b.dataset.act, i = Number(b.dataset.i);
  if (act === "suggest") {
    state.reported = $("reported").value;
    if (state.reported.trim()) suggestChecks(); else toast("Type what the customer reported first");
    return;
  }
  if (act === "build") { state.notes = $("notes").value; build("quote"); return; }
  if (act === "build-extra") { state.extraNotes = $("extraNotes").value; build("extra"); return; }
  if (act === "use-demo") { $("demoMode").checked = true; saveDemo(); state.err = null; badge(); render(); return; }
  if (act === "edit") state.ws = "compose";
  if (act === "extra-open") { state.extraOpen = true; render(); $("extraNotes").focus(); return; }
  if (act === "ck-ok" || act === "ck-tbc" || act === "ck-undo") {
    const g = b.dataset.group, how = act === "ck-ok" ? "resolved" : act === "ck-tbc" ? "tbc" : null;
    if (b.dataset.kind === "price") grp(g)[i].priceTbc = how === "tbc";
    else if (b.dataset.kind === "proof") grp(g)[i].proofTbc = how === "tbc";
    else doc(g).checks[i].how = how;
    refreshCheck(g); return;
  }
  if (act === "book-fill") {
    const n = bookFill(doc(b.dataset.group), false);
    render(); toast(`Filled ${n} detail${n > 1 ? "s" : ""} from your price book`); return;
  }
  if (act === "pre") { const it = grp(b.dataset.group)[i]; it.opt = Number(b.dataset.k); it.edited = true; }
  if ((act === "send" || act === "send-extra") && !canSend(doc(act === "send" ? "quote" : "extra"))) return;
  if (act === "send") {
    state.quote.checkedAt = new Date();
    state.ws = "sent"; state.sentAt = new Date(); fly("packetOut");
    later(950, () => { state.deliveredAt = new Date(); state.dr = "notified"; render(); });
  }
  if (act === "open-thread") state.dr = "thread";
  if (act === "open-quote") { state.dr = "quote"; if (!state.viewedAt) state.viewedAt = new Date(); }
  if (act === "opt") grp(b.dataset.group)[i].opt = Number(b.dataset.k);
  const fu = b.dataset.id && state.followups.find((f) => f.id === b.dataset.id);
  if (act === "fu-toggle") fu.status = fu.status === "off" ? "scheduled" : "off";
  if (act === "fu-send") {
    if (fu.ours && state.drBanner) { toast(`${fu.customer} has a message waiting. Send this once it's opened.`); return; }
    fu.status = "sent"; fu.reminded = true; later(400, () => toast(`Reminder sent to ${fu.customer}`));
    if (fu.ours) {  // the driver on the right-hand phone gets the link; seeded customers have no phone in the demo
      fu.slots = offerSlots(); state.fuActive = fu.id; fly("packetOut");
      later(950, () => { state.drBanner = "reminder"; render(); });
    }
  }
  if (act === "open-book") { state.drBanner = null; if (state.dr !== "book" && state.dr !== "booked") state.drPrev = state.dr; state.dr = "book"; }
  if (act === "book-slot") {
    const f = activeFu();
    f.status = "booked"; f.bookedAt = f.slots[Number(b.dataset.k)]; state.dr = "booked"; fly("packetBack");
    later(700, () => toast(`${f.customer} booked ${slotText(f.bookedAt)}`));
  }
  if (act === "book-done") state.dr = state.drPrev || "home";
  if (act === "why-toggle") { const it = grp(b.dataset.group)[i]; it.whyOpen = !it.whyOpen; }
  if (act === "sw") { toggleItem(b.dataset.group, i); return; }
  if (act === "approve") {
    state.approvedAt = new Date(); state.ws = "approved"; state.dr = "approved"; state.tab = "job"; recordJob(); bookFollowups(); fly("packetBack");
    state.stage = 1; state.stageAt = { 0: state.sentAt, 1: state.approvedAt }; state.readyBy = etaFrom(state.approvedAt, labourHrs(state.quote.items, true));
    later(700, () => toast(`${customer()} approved ${money(sumApproved(state.quote.items))}`));
  }
  if (act === "send-extra") {
    state.ws = "extra_sent"; state.xSentAt = new Date(); fly("packetOut");
    later(950, () => { state.xDeliveredAt = new Date(); state.drBanner = "extra"; render(); });
  }
  if (act === "open-extra") { state.drBanner = null; state.dr = "extra"; state.xViewedAt = new Date(); }
  if (act === "x-approve" || act === "x-decline" || act === "x-call") {
    state.extraResult = act === "x-approve" ? "approved" : act === "x-call" ? "call" : "declined";
    state.extra.items.forEach((it) => (it.approved = state.extraResult === "approved"));
    state.extraAt = new Date(); state.ws = "extra_done"; state.dr = "extra_done";
    if (state.extraResult === "approved" && state.readyBy) state.readyBy = round15(addWorkMinutes(state.readyBy, labourHrs(state.extra.items, false) * 60));
    const job = state.history.find((j) => j.id === "J-1044");
    if (job) job.extra = { decision: state.extraResult === "call" ? "call requested" : state.extraResult, at: stampOf(state.extraAt), items: decItems(state.extra.items) };
    fly("packetBack");
    const msg = state.extraResult === "approved" ? `${customer()} approved the extra work` : state.extraResult === "call" ? `${customer()} asked you to call` : `${customer()} declined the extra work`;
    later(700, () => toast(msg));
  }
  const stageTo = (k, msg) => { state.stage = k; state.stageAt[k] = new Date(); later(500, () => toast(msg)); };
  if (act === "start") stageTo(2, `${customer()} notified: repair started`);
  if (act === "qc") stageTo(3, `${customer()} notified: quality check done`);
  if (act === "ready") {
    stageTo(4, `${customer()} notified: car ready to collect`); state.readyBy = new Date(); fly("packetOut");
    later(950, () => { state.drBanner = "ready"; render(); });
  }
  if (act === "open-ready") { state.drBanner = null; state.dr = "ready"; }
  if (act === "eta-" || act === "eta+") {
    state.readyBy = new Date(state.readyBy.getTime() + (act === "eta+" ? 15 : -15) * 60000);
    toast(`${customer()} notified: ready ${etaText(state.readyBy)}`);
  }
  if (act === "xero-open") { state.xero = "preview"; $("ws").scrollTop = 0; }
  if (act === "xero-send") { state.xero = "sent"; $("ws").scrollTop = 0; }
  if (act === "xero-close") state.xero = null;
  if (act === "xero-csv") { downloadXeroCsv(); toast("Import file downloaded"); return; }
  if (act === "go-history") { state.tab = "history"; state.open = "J-1044"; }
  if (act === "job") state.open = state.open === b.dataset.id ? null : b.dataset.id;
  render();
});

document.addEventListener("change", (e) => {
  const s = e.target;
  if (s.dataset && s.dataset.act === "status") {
    const it = grp(s.dataset.group)[Number(s.dataset.i)];
    it.status = s.value; it.approved = s.value === "needed_now"; it.edited = true; render();
  }
  if (s.dataset && s.dataset.act === "sg-tick") { state.suggest.items[Number(s.dataset.i)].done = s.checked; return; }
  if (s.dataset && s.dataset.act === "fu-due") {
    const f = state.followups.find((x) => x.id === s.dataset.id);
    f.months = Number(s.value); f.due = addMonths(state.approvedAt, f.months); render();
  }
  if (s.dataset && s.dataset.act === "checked") { doc(s.dataset.group).checked = s.checked; renderWsDock(); }
});
document.addEventListener("input", (e) => {
  const t = e.target;
  if (t.dataset.act === "why") {
    const it = grp(t.dataset.group)[Number(t.dataset.i)];
    it.why = t.value.trim() || null; it.edited = true; t.closest(".card").classList.add("edited"); return;
  }
  if (t.dataset.act === "evidence") {
    const it = grp(t.dataset.group)[Number(t.dataset.i)];
    it.evidence = t.value.trim() || null; it.proofAdded = true; it.edited = true;
    t.closest(".card").classList.add("edited"); refreshCheck(t.dataset.group); return;
  }
  if (t.dataset.act === "book") { state.book[Number(t.dataset.i)].price = t.value === "" ? null : Math.max(0, Number(t.value)); t.parentElement.classList.toggle("empty", t.value === ""); return; }
  if (t.classList.contains("num")) {
    // Update in place (no re-render) so typing and tabbing between price boxes keeps focus
    const it = grp(t.dataset.group)[Number(t.dataset.i)], v = t.value === "" ? null : Math.max(0, Number(t.value));
    if (t.dataset.act === "price") { if (t.dataset.k != null) it.options[Number(t.dataset.k)].price = v; else it.price = v; }
    else {
      it[t.dataset.act] = v;
      it.price = it.hours != null && it.rate != null ? Math.round(it.hours * it.rate * 100) / 100 : null;
      t.closest(".card").querySelector(".lp").textContent = money(it.price);
    }
    it.edited = true; t.closest(".card").classList.add("edited"); t.parentElement.classList.toggle("empty", v == null);
    t.closest(".card").querySelector(".fair-slot").innerHTML = fairLine(it, false);
    refreshCheck(t.dataset.group); return;
  }
  if (e.target.id === "search") { state.search = e.target.value; render(); }
  if (e.target.id === "notes") state.notes = e.target.value;
  if (e.target.id === "reported") state.reported = e.target.value;
  if (e.target.id === "extraNotes") state.extraNotes = e.target.value;
});

// ---------- chrome ----------
function saveDemo() { try { localStorage.setItem("rf-demo", demoOn() ? "1" : "0"); } catch (_) {} }
function badge() {
  const b = $("aiBadge");
  if (demoOn()) { b.className = "pill demo"; b.textContent = "Demo mode: saved examples"; return; }
  b.className = window.__aiReady ? "pill live" : "pill demo";
  b.textContent = window.__aiReady ? `Live AI, ${window.__aiModel}` : "No API key: saved examples";
}
function fit() {
  const vp = $("viewport"), st = $("stage");
  const s = Math.min(vp.clientWidth / 1010, vp.clientHeight / 860, 1.3);
  st.style.transform = `translateX(-50%) scale(${s})`;
}
function tick() {
  const t = timeOf(new Date()).replace(/\s?(am|pm)/i, "");
  document.querySelectorAll(".clock").forEach((c) => (c.textContent = t));
  if (state.dr === "home" || state.dr === "notified") render();
}
$("demoMode").addEventListener("change", () => { saveDemo(); badge(); });
$("resetBtn").addEventListener("click", () => { timers.forEach(clearTimeout); timers = []; state = fresh(); lastDr = lastWs = null; $("wsToast").classList.remove("show"); render(); });
window.addEventListener("resize", fit);

(async function init() {
  try { $("demoMode").checked = localStorage.getItem("rf-demo") === "1"; } catch (_) {}
  try { const s = await (await fetch("/api/status")).json(); window.__aiReady = s.ai_ready; window.__aiModel = s.model; }
  catch (_) { window.__aiReady = false; }
  badge(); fit(); tick(); setInterval(tick, 30000); render();
})();

// ---------- scenes (for screenshots: /?scene=quote etc.) ----------
async function runScene(scene) {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const waitFor = async (fn) => { for (let k = 0; k < 100 && !fn(); k++) await sleep(100); };
  const click = (sel) => document.querySelector(sel).click();
  const checkAll = async () => {  // mechanic check: fill from the price book, resolve what's left, then tick "I've checked"
    if (document.querySelector('[data-act="book-fill"]')) { click('[data-act="book-fill"]'); await sleep(300); }
    for (let row; (row = document.querySelector(".ck-row.open .ck-btn"));) { row.click(); await sleep(150); }
    click('[data-act="checked"]'); await sleep(200);
  };
  $("demoMode").checked = true; badge();
  const order = ["draft", "checked", "notified", "thread", "quote", "approved", "extra_draft", "banner", "extra", "done", "ready", "history", "booked", "xero"];
  const stop = order.indexOf(scene);
  const steps = [
    async () => { await waitFor(() => document.querySelector('[data-act="build"]')); click('[data-act="build"]'); await waitFor(() => state.ws === "draft"); },
    checkAll,
    async () => { click('[data-act="send"]'); await sleep(1200); },
    async () => { click('[data-act="open-thread"]'); await sleep(400); },
    async () => { click('[data-act="open-quote"]'); await sleep(400); click('[data-act="why-toggle"]'); await sleep(200); },
    async () => { click('[data-act="approve"]'); await sleep(900); },
    async () => { click('[data-act="extra-open"]'); await sleep(100); click('[data-act="build-extra"]'); await waitFor(() => state.ws === "extra_draft"); },
    async () => { await checkAll(); click('[data-act="send-extra"]'); await sleep(1200); },
    async () => { click('[data-act="open-extra"]'); await sleep(400); },
    async () => { click('[data-act="x-approve"]'); await sleep(900); },
    async () => { click('[data-act="start"]'); await sleep(200); click('[data-act="qc"]'); await sleep(200); click('[data-act="ready"]'); await sleep(1200); click('[data-act="open-ready"]'); await sleep(500); },
    async () => { click('[data-act="go-history"]'); await sleep(400); },
    async () => { click('#wsTabs [data-tab="followups"]'); await sleep(200); click('[data-act="fu-send"][data-id^="F-1044"]'); await sleep(1200); click('[data-act="open-book"]'); await sleep(400); click('[data-act="book-slot"]'); await sleep(900); },
    async () => { click('#wsTabs [data-tab="job"]'); await sleep(200); click('[data-act="xero-open"]'); await sleep(300); click('[data-act="xero-send"]'); await sleep(300); },
  ];
  for (let k = 0; k <= stop; k++) await steps[k]();
  document.body.dataset.sceneReady = "1";
}
const __scene = new URLSearchParams(location.search).get("scene");
if (__scene) setTimeout(() => runScene(__scene), 600);
