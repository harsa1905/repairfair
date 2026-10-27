// RepairFair prototype: workshop phone (left) and driver phone (right) on one page.
// The "text link" between phones is simulated in the browser; only the AI call goes to the server.

const DEFAULT_NOTES = `2017 Mazda 3, customer Mia.
Front pads at 2mm, need doing now (photo taken). Pad options: economy $90 12 months, OEM $160 12 months/20,000 km, premium ceramic $210 24 months.
Front rotors 22.4mm, min 22mm, can wait till next service, $240 a pair.
Brake fluid last change unknown, optional flush $90.
Labour 1.5 hrs at $90/hr, 12 month workmanship warranty.`;

const DEFAULT_EXTRA = `Found a cracked rear brake hose (photo taken), needs doing now, shouldn't drive like this.
Hose options: economy $45 12 months, OEM $70 12 months.
Labour 0.5 hr at $90/hr.`;

const STATUS = { needed_now: "Needed now", can_wait: "Can wait", optional: "Optional", to_confirm: "To confirm" };
const AI_TIMEOUT_MS = 15000;
const PHONE_MASK = "04•• ••• 812";

const SEED_HISTORY = [
  { id: "J-1039", customer: "Tom", car: "2015 Hyundai i30", job: "90,000 km logbook service", date: "Wed 14 Oct",
    approvedAt: "10:12 am · Wed 14 Oct",
    items: [{ name: "Logbook service", price: 385, approved: true }, { name: "Wiper blades", price: 40, approved: true },
            { name: "Fuel injector cleaning", price: 89, approved: false }], extra: null },
  { id: "J-1036", customer: "Priya", car: "2021 Tesla Model 3", job: "Front tyres", date: "Fri 9 Oct",
    approvedAt: "2:47 pm · Fri 9 Oct",
    items: [{ name: "Front tyres (pair) · OEM-spec", price: 640, approved: true }, { name: "Fitting and balancing", price: 110, approved: true },
            { name: "Wheel alignment", price: 120, approved: false }], extra: null },
  { id: "J-1031", customer: "Dave", car: "2016 Toyota Hilux", job: "Rear brakes", date: "Fri 2 Oct",
    approvedAt: "9:05 am · Fri 2 Oct",
    items: [{ name: "Rear brake shoes · OEM", price: 180, approved: true }, { name: "Labour", price: 190, approved: true }],
    extra: { decision: "approved", at: "11:38 am · Fri 2 Oct", items: [{ name: "Wheel cylinder", price: 85, approved: true }] } },
];

const fresh = () => ({
  tab: "quote", ws: "compose", dr: "home", drBanner: null, stage: null, stageAt: {}, readyBy: null,
  notes: DEFAULT_NOTES, extraNotes: DEFAULT_EXTRA,
  quote: null, extra: null, source: null, extraSource: null, notice: null, extraNotice: null,
  err: null, extraResult: null,
  sentAt: null, deliveredAt: null, viewedAt: null, approvedAt: null,
  xSentAt: null, xDeliveredAt: null, xViewedAt: null, extraAt: null,
  history: SEED_HISTORY.map((j) => ({ ...j })), search: "", open: null,
});
let state = fresh();
let lastDr = null, lastWs = null, timers = [];

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (n) => (n == null ? "price to confirm" : "$" + (Number.isInteger(n) ? n.toLocaleString() : n.toFixed(2)));
const timeOf = (d) => d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" }).replace(/\s/g, " ").toLowerCase();
const dayOf = (d) => d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" }).replace(",", "");
const stampOf = (d) => `${timeOf(d)} · ${dayOf(d)}`;
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
  });
  return data;
}
const priceOf = (it) => (it.options.length ? it.options[it.opt].price : it.price);
const warrantyOf = (it) => (it.options.length ? it.options[it.opt].warranty : it.warranty);
const sumApproved = (items) => items.filter((i) => i.approved).reduce((s, i) => s + (priceOf(i) || 0), 0);
const sumAll = (items) => items.reduce((s, i) => s + (priceOf(i) || 0), 0);
const customer = () => (state.quote && state.quote.customer) || "Mia";
const carName = () => (state.quote && state.quote.car) || "your car";
const itemLabel = (i) => i.name + (i.options.length ? ` · ${i.options[i.opt].tier}` : "");
const smsText = () => `Hi ${customer()}, your quote for the ${carName()} is ready. Please review and approve: repairfair.au/q/8F2K`;

// ---------- AI call with auto-fallback ----------
async function callApi(notes, kind, demo) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), AI_TIMEOUT_MS);
  try {
    const r = await fetch("/api/quote", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes, kind, demo }), signal: ctrl.signal });
    const data = await r.json();
    if (!r.ok || data.error) throw new Error(data.error || "Something went wrong.");
    return data;
  } finally { clearTimeout(timer); }
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
    state.quote = prepare(data); state.source = data.source; state.notice = notice; state.ws = "draft";
  }
  render();
}

// ---------- shared bits ----------
const srcTag = (src) => (src === "ai" ? `<span class="src">✦ Built by AI from your notes · check and edit</span>`
                                      : `<span class="src demo">Saved example</span>`);
const missingBox = (list) => (list && list.length ? `<div class="missing"><b>To confirm before sending</b>${list.map(esc).join(" · ")}</div>` : "");
function decisions(items) {
  return items.map((i) => `<div class="dec ${i.approved ? "" : "no"}"><span class="n"><span class="${i.approved ? "y" : "x"}">${i.approved ? "✓" : "–"}</span>${esc(i.name)}</span><span class="s">${money(i.price ?? null)}</span></div>`).join("");
}
const decItems = (items) => items.map((i) => ({ name: itemLabel(i), price: priceOf(i), approved: i.approved }));

function tracker(title, steps) {
  // steps: [label, Date|null]; the first step without a time is "now"
  const firstOpen = steps.findIndex((s) => !s[1]);
  return `<div class="tracker"><div class="tt"><span>${title}</span><span style="color:var(--faint);font-weight:600">to ${esc(customer())} · ${PHONE_MASK}</span></div>
    <div class="steps">${steps.map(([lbl, t], k) => `<div class="step ${t ? "done" : k === firstOpen ? "now" : ""}"><div class="dot">${t ? "✓" : ""}</div>${lbl}<span class="tm">${t ? timeOf(t) : "&nbsp;"}</span></div>`).join("")}</div></div>`;
}

let toastTimer = null;
function toast(text) {
  const t = $("wsToast");
  t.innerHTML = `<span class="ic">✓</span>${esc(text)}`;
  t.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 3200);
}

// ---------- workshop ----------
function wsCard(it, i, group) {
  const sel = `<select class="chip ${it.status}" data-act="status" data-group="${group}" data-i="${i}">
    ${Object.keys(STATUS).map((k) => `<option value="${k}" ${k === it.status ? "selected" : ""}>${STATUS[k]}</option>`).join("")}</select>`;
  let b = "";
  if (it.options.length) b += `<div class="ev">Options: ${it.options.map((o) => `${o.tier} ${money(o.price)}`).join(" · ")}</div>`;
  else if (it.kind === "labour" && it.hours != null) b += `<div class="ev">${it.hours} hrs × ${money(it.rate)} = <b>&nbsp;${money(it.price)}</b></div>`;
  else b += `<div class="ev">Price <b>&nbsp;${money(it.price)}</b></div>`;
  if (it.evidence) b += `<div class="ev">${/photo/i.test(it.evidence) ? '<span class="photo">📷</span>' : ""}${esc(it.evidence)}</div>`;
  if (it.warranty) b += `<div class="war">Warranty: ${esc(it.warranty)}</div>`;
  return `<div class="card u-${it.status}"><div class="ch"><span class="it">${esc(it.name)}</span>${sel}</div>${b}</div>`;
}

function wsQuoteTab() {
  const q = state.quote, x = state.extra;
  const err = state.err ? `<div class="err">${esc(state.err)}<button class="btn soft" data-act="use-demo">Use saved examples</button></div>` : "";
  switch (state.ws) {
    case "compose":
      return `<div class="lbl">Mechanic's notes</div><textarea id="notes" rows="11">${esc(state.notes)}</textarea>
        <button class="btn ai" data-act="build">✦ Build standard quote with AI</button>
        <div class="small">Type it the way you'd write it on a job card. The AI does the rest.</div>${err}`;
    case "loading":
      return `<div class="lbl">Mechanic's notes</div><textarea rows="11" disabled>${esc(state.notes)}</textarea>
        <div class="loading"><span class="spin"></span>AI is building the standard quote…</div><div class="skel"></div><div class="skel"></div>`;
    case "draft":
      return `${srcTag(state.source)}${state.notice ? `<div class="notice">${esc(state.notice)}</div>` : ""}
        <div class="lbl">${esc(q.job_title)}${q.car ? " · " + esc(q.car) : ""}</div>${missingBox(q.missing_info)}
        ${q.items.map((it, i) => wsCard(it, i, "quote")).join("")}
        <div class="etaline">🕒 Ready ${esc(etaText(etaFrom(new Date(), labourHrs(q.items, true))))} if approved now (from labour hours)</div>
        <div class="preview"><div class="to"><span>Text message to ${esc(customer())}</span><span>${PHONE_MASK}</span></div><div class="bubble me">${esc(smsText())}</div></div>
        <button class="btn primary" data-act="send">Send text to ${esc(customer())} →</button>
        <button class="btn soft" data-act="edit">Edit notes</button>`;
    case "sent":
      return `${tracker("Quote", [["Sent", state.sentAt], ["Delivered", state.deliveredAt], ["Viewed", state.viewedAt], ["Approved", null]])}
        <div class="wait"><b>Waiting for ${esc(customer())}</b>${state.viewedAt ? `${esc(customer())} is looking at the quote now…` : "You'll get a notification when they respond."}</div>
        <div class="lbl">Quote sent</div>${q.items.map((i) => `<div class="dec"><span class="n"><span class="chip ${i.status}"><i></i>${STATUS[i.status]}</span>${esc(i.name)}</span></div>`).join("")}`;
    default: {
      let h = `${tracker("Quote", [["Sent", state.sentAt], ["Delivered", state.deliveredAt], ["Viewed", state.viewedAt], ["Approved", state.approvedAt]])}
        <div class="ok"><b>${esc(customer())} approved ${money(sumApproved(q.items))}</b>Start the work on the approved items only.</div>
        <div class="stamp"><span class="ic">✓</span>Approved by text link · ${esc(stampOf(state.approvedAt))}</div>
        ${wsJob()}
        <div class="lbl">Customer's decisions</div><div class="card u-to_confirm" style="padding-top:6px;padding-bottom:6px">${decisions(decItems(q.items))}</div>`;
      if (state.ws === "approved") {
        h += `<div class="lbl" style="margin-top:14px">Found extra work mid-job?</div><textarea id="extraNotes" rows="5">${esc(state.extraNotes)}</textarea>
          <button class="btn ai" data-act="build-extra">✦ Build extra item with AI</button>${err}`;
      } else if (state.ws === "extra_loading") {
        h += `<div class="loading"><span class="spin"></span>AI is building the extra item…</div><div class="skel"></div>`;
      } else if (state.ws === "extra_draft") {
        h += `<div class="lbl" style="margin-top:14px">Extra item</div>${srcTag(state.extraSource)}${state.extraNotice ? `<div class="notice">${esc(state.extraNotice)}</div>` : ""}
          ${missingBox(x.missing_info)}${x.items.map((it, i) => wsCard(it, i, "extra")).join("")}
          <button class="btn primary" data-act="send-extra">Ask ${esc(customer())} to approve →</button>
          <div class="small">Nothing extra starts until ${esc(customer())} says yes in writing.</div>`;
      } else if (state.ws === "extra_sent") {
        h += `<div style="margin-top:12px">${tracker("Extra item", [["Sent", state.xSentAt], ["Delivered", state.xDeliveredAt], ["Viewed", state.xViewedAt], ["Decision", null]])}</div>
          <div class="wait"><b>Don't start the extra work yet</b>Waiting for ${esc(customer())} to decide.</div>`;
      } else if (state.ws === "extra_done") {
        const r = state.extraResult;
        const head = r === "approved" ? `${esc(customer())} approved the extra work` : r === "call" ? `${esc(customer())} asked you to call` : `${esc(customer())} declined the extra work`;
        h += `<div style="margin-top:12px">${tracker("Extra item", [["Sent", state.xSentAt], ["Delivered", state.xDeliveredAt], ["Viewed", state.xViewedAt], ["Decision", state.extraAt]])}</div>
          <div class="${r === "approved" ? "ok" : "wait"}"><b>${head}</b>${r === "call" ? "Talk it through before doing any extra work." : r === "declined" ? "Don't do it. It's noted on the job as advised." : "Go ahead with the extra work."}</div>
          <div class="totalrow" style="margin:6px 2px 10px"><span>Final bill (matches approvals)</span><b>${money(sumApproved(q.items) + (r === "approved" ? sumApproved(x.items) : 0))}</b></div>
          <button class="btn soft" data-act="go-history">View in job history →</button>`;
      }
      return h;
    }
  }
}

function wsJob() {
  if (state.stage == null) return "";
  const st = state.stage;
  const next = { 1: ["start", "Start repair"], 2: ["qc", "Quality check done"], 3: ["ready", "Mark ready for pickup"] }[st];
  return `<div class="jobcard"><div class="jc-top"><span class="lbl" style="margin:0">Job status</span><span class="chip ${st === 4 ? "optional" : "neutral"}"><i></i>${STAGES[st]}</span></div>
    <div class="jc-eta"><span>${st === 4 ? "Ready since" : "Ready by"} <b>${esc(etaText(state.readyBy))}</b></span>${st === 4 ? "" : `<span class="adj"><button data-act="eta-">−15 min</button><button data-act="eta+">+15 min</button></span>`}</div>
    ${next ? `<button class="btn dark" data-act="${next[0]}">${next[1]} →</button>` : `<div class="small" style="text-align:left">✓ ${esc(customer())} has been told the car is ready to collect.</div>`}
    <div class="small" style="text-align:left;margin-top:6px">${esc(customer())} sees each update and the ready time live.</div></div>`;
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
      d = `<div class="jd"><div class="lbl" style="margin-top:4px">Approved items</div>${decisions(j.items)}`;
      if (j.extra) d += `<div class="lbl">Extra work · ${j.extra.decision} · ${esc(j.extra.at)}</div>${decisions(j.extra.items)}`;
      d += `</div>`;
    }
    return `<div class="job ${j.isNew ? "new" : ""}" data-act="job" data-id="${j.id}">
      <div class="jt"><span>${esc(j.job)}${j.isNew ? '<span class="tagnew">NEW</span>' : ""}</span><span>${money(jobTotal(j))}</span></div>
      <div class="jm">${esc(j.customer)} · ${esc(j.car)} · ${esc(j.date)} · ${j.id}</div>
      <div class="jp">✓ Approved by text link · ${esc(j.approvedAt)}${j.extra ? " · extra " + esc(j.extra.decision) : ""}</div>${d}</div>`;
  }).join("");
  return h + `<div class="small">Every approval is timestamped and searchable. No more digging through old books.</div>`;
}

// ---------- driver ----------
function drCard(it, i, group, toggle = true) {
  let h = `<div class="card u-${it.status} ${toggle && !it.approved ? "off" : ""}"><div class="ch"><span class="it">${esc(it.name)}</span>
    ${it.options.length ? `<span class="chip ${it.status}"><i></i>${STATUS[it.status]}</span>` : `<span class="price">${money(it.price)}</span>`}</div>`;
  if (!it.options.length) h += `<div class="ev"><span class="chip ${it.status}"><i></i>${STATUS[it.status]}</span></div>`;
  if (it.evidence) h += `<div class="ev">${/photo/i.test(it.evidence) ? '<span class="photo">📷</span>' : ""}${esc(it.evidence)}</div>`;
  if (it.kind === "labour" && it.hours != null) h += `<div class="ev">${it.hours} hrs × ${money(it.rate)}</div>`;
  if (it.options.length) {
    h += `<div class="opts">${it.options.map((o, k) => `<button class="opt ${k === it.opt ? "sel" : ""}" data-act="opt" data-group="${group}" data-i="${i}" data-k="${k}"><span class="t">${o.tier}${k === it.opt ? " ✓" : ""}</span><b>${money(o.price)}</b><span class="w">${esc((o.warranty || "warranty TBC").replace(/\s*\/\s*/g, " / "))}</span></button>`).join("")}</div>`;
    h += `<div class="war">${esc(it.options[it.opt].brand || "[Brand]")} · part no. to confirm · warranty shown</div>`;
  } else if (warrantyOf(it)) h += `<div class="war">Warranty: ${esc(warrantyOf(it))}</div>`;
  if (toggle) h += `<div class="seg"><button class="yes ${it.approved ? "on" : ""}" data-act="yes" data-group="${group}" data-i="${i}">Approve</button><button class="no ${it.approved ? "" : "on"}" data-act="no" data-group="${group}" data-i="${i}">Not now</button></div>`;
  return h + `</div>`;
}

function lockScreen(withNotif) {
  const now = new Date();
  const notif = withNotif ? `<div class="notif" data-act="open-thread"><div class="app">💬</div><div style="flex:1">
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
    <div class="bubble">Hi ${esc(customer())}, it's City Auto. Your quote for the ${esc(carName())} is ready. Please review and approve 👇</div>
    <div class="linkcard" data-act="open-quote"><div class="lc-top"><img src="/static/logo.svg" alt=""><div><div class="lc-k">RepairFair quote</div><div class="lc-t">${esc(q.job_title)}</div></div></div>
      <div class="lc-b"><div class="row">${need ? `<span class="chip needed_now"><i></i>${need} needed now</span>` : ""}${wait ? `<span class="chip can_wait"><i></i>${wait} other item${wait > 1 ? "s" : ""}</span>` : ""}</div>
      <span class="cta">View &amp; approve</span><div class="dom">repairfair.au</div></div></div>
    ${state.dr === "thread" && !state.viewedAt ? "" : ""}</div>`;
}

function drStatus() {
  if (state.stage == null) return "";
  const st = state.stage;
  return `<div class="statuscard"><div class="sc-top"><span>Your ${esc(carName())}</span><span class="eta ${st === 4 ? "ready" : ""}">${st === 4 ? "Ready now" : "Ready " + esc(etaText(state.readyBy))}</span></div>
    <div class="vsteps">${STAGES.map((lbl, k) => `<div class="vs ${k < st || st === 4 ? "done" : k === st ? "now" : ""}"><span class="vd">${k <= st ? "✓" : ""}</span><span class="vl">${lbl}</span><span class="vt">${state.stageAt[k] ? esc(timeOf(state.stageAt[k])) : ""}</span></div>`).join("")}</div></div>`;
}

function renderDriver() {
  const q = state.quote, x = state.extra;
  switch (state.dr) {
    case "home": return lockScreen(false);
    case "notified": return lockScreen(true);
    case "thread": return thread();
    case "quote":
      return `<div class="qhero"><div class="k">RepairFair standard quote</div><div class="t">${esc(q.job_title)}</div><div class="m">City Auto · ${esc(carName())}</div></div>
        <div class="etaline" style="text-align:center">🕒 ${q.eta_note ? esc(q.eta_note) : `If you approve now: ready ${esc(etaText(etaFrom(new Date(), labourHrs(q.items, true))))}`}</div>
        <div class="legend" style="margin:0 0 9px;justify-content:center"><span class="chip needed_now"><i></i>Needed now</span><span class="chip can_wait"><i></i>Can wait</span><span class="chip optional"><i></i>Optional</span></div>
        ${q.items.map((it, i) => drCard(it, i, "quote")).join("")}<div class="small">Nothing starts until you approve. Your approval is saved with the quote.</div>`;
    case "approved":
      return `<div class="success"><div class="tick">✓</div><div class="h">You approved ${money(sumApproved(q.items))}</div><div class="s">City Auto has your approval in writing.</div></div>
        ${drStatus()}
        <div class="stamp"><span class="ic">✓</span>Saved to your service record · ${esc(stampOf(state.approvedAt))}</div>
        <div class="lbl">Your decisions</div><div class="card u-to_confirm" style="padding-top:6px;padding-bottom:6px">${decisions(decItems(q.items))}</div>
        <div class="small">Items marked “not now” are saved, so you can come back to them later.</div>`;
    case "extra":
      return `<div class="qhero" style="background:linear-gradient(135deg,#2B3A40,#46585E)"><div class="k">New item · ${esc(q.job_title)}</div><div class="t">${esc(x.items[0].name)}</div><div class="m">Found mid-job · needs your OK</div></div>
        <div class="bigphoto"><span>📷 Photo from City Auto</span><span>tap to enlarge</span></div>
        ${x.items.map((it, i) => drCard(it, i, "extra", false)).join("")}<div class="small">The workshop won't start this until you decide.</div>`;
    case "extra_done": {
      const r = state.extraResult;
      const m = r === "approved" ? "Extra work approved" : r === "call" ? "City Auto will call you" : "Extra work declined";
      const s = r === "approved" ? "Saved with your quote." : r === "call" ? "Nothing extra starts until you agree." : "City Auto won't do it.";
      return `<div class="success"><div class="tick" style="${r === "approved" ? "" : "background:var(--brand);box-shadow:0 0 0 8px var(--brand-100)"}">${r === "call" ? "☎" : "✓"}</div><div class="h">${m}</div><div class="s">${s}</div></div>
        ${drStatus()}
        <div class="stamp"><span class="ic">✓</span>Decision saved · ${esc(stampOf(state.extraAt))}</div>
        <div class="card u-to_confirm"><div class="totalrow"><span>Your final bill</span><b>${money(sumApproved(q.items) + (r === "approved" ? sumApproved(x.items) : 0))}</b></div>
        <div class="small" style="text-align:left">Only what you approved. No surprises.</div></div>`;
    }
    case "ready": {
      const total = sumApproved(q.items) + (x && state.extraResult === "approved" ? sumApproved(x.items) : 0);
      return `<div class="success"><div class="tick">🚗</div><div class="h">Your car is ready</div><div class="s">City Auto · open until 5:30 pm today</div></div>
        ${drStatus()}
        <div class="card u-to_confirm"><div class="totalrow"><span>Final bill</span><b>${money(total)}</b></div>
        <div class="small" style="text-align:left">Exactly what you approved. Pay at pickup.</div></div>
        <div class="stamp"><span class="ic">✓</span>Itemised invoice saved to your service record</div>`;
    }
  }
  return "";
}

function renderDriverChrome() {
  const lock = state.dr === "home" || state.dr === "notified";
  document.querySelector(".dr-phone").classList.toggle("lock", lock);
  $("drTop").innerHTML = lock ? "" : state.dr === "thread"
    ? `<div class="thread-head"><span class="back">‹</span><div class="av">CA</div><div class="nm">City Auto ›</div></div>`
    : `<div class="urlbar">🔒 repairfair.au/q/8F2K</div>`;
  $("drBanner").innerHTML = state.drBanner === "ready" ? `<div class="notif" data-act="open-ready"><div class="app">💬</div><div style="flex:1">
      <div class="top"><span>Messages · City Auto</span><span>now</span></div><div class="ti">Your car is ready 🚗</div>
      <div class="tx">Your ${esc(carName())} is ready to collect. Tap to view your final bill.</div></div></div>`
    : state.drBanner === "extra" ? `<div class="notif" data-act="open-extra"><div class="app">💬</div><div style="flex:1">
      <div class="top"><span>Messages · City Auto</span><span>now</span></div><div class="ti">We found something</div>
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
  document.querySelectorAll("#wsTabs .tab").forEach((t) => t.classList.toggle("on", t.dataset.tab === state.tab));
  const keepSearchFocus = document.activeElement && document.activeElement.id === "search";
  const wsKey = state.tab + ":" + state.ws;
  $("ws").innerHTML = `<div class="${wsKey !== lastWs ? "enter" : ""}">${state.tab === "history" ? wsHistoryTab() : wsQuoteTab()}</div>`;
  if (wsKey !== lastWs) $("ws").scrollTop = 0;
  lastWs = wsKey;
  if (keepSearchFocus) { const s = $("search"); s.focus(); s.setSelectionRange(s.value.length, s.value.length); }
  const drChanged = state.dr !== lastDr;
  $("dr").innerHTML = `<div class="${drChanged ? "enter" : ""}">${renderDriver()}</div>`;
  if (drChanged) $("dr").scrollTop = 0;
  lastDr = state.dr;
  renderDriverChrome();
  $("wsTitle").textContent = state.quote ? `City Auto · ${state.quote.job_title}` : "City Auto";
}

function fly(id) { const el = $(id); el.classList.remove("go"); void el.offsetWidth; el.classList.add("go"); }
const grp = (name) => (name === "extra" ? state.extra.items : state.quote.items);

function recordJob() {
  const q = state.quote;
  const job = { id: "J-1044", isNew: true, customer: customer(), car: q.car || "—", job: q.job_title,
    date: dayOf(state.approvedAt), approvedAt: stampOf(state.approvedAt), items: decItems(q.items), extra: null };
  state.history = [job, ...state.history.filter((j) => j.id !== "J-1044")];
}

document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-act], [data-tab]");
  if (!b || b.tagName === "SELECT" || b.tagName === "INPUT") return;
  if (b.dataset.tab) { state.tab = b.dataset.tab; render(); return; }
  const act = b.dataset.act, i = Number(b.dataset.i);
  if (act === "build") { state.notes = $("notes").value; build("quote"); return; }
  if (act === "build-extra") { state.extraNotes = $("extraNotes").value; build("extra"); return; }
  if (act === "use-demo") { $("demoMode").checked = true; saveDemo(); state.err = null; badge(); render(); return; }
  if (act === "edit") state.ws = "compose";
  if (act === "send") {
    state.ws = "sent"; state.sentAt = new Date(); fly("packetOut");
    later(950, () => { state.deliveredAt = new Date(); state.dr = "notified"; render(); });
  }
  if (act === "open-thread") state.dr = "thread";
  if (act === "open-quote") { state.dr = "quote"; if (!state.viewedAt) state.viewedAt = new Date(); }
  if (act === "opt") grp(b.dataset.group)[i].opt = Number(b.dataset.k);
  if (act === "yes") grp(b.dataset.group)[i].approved = true;
  if (act === "no") grp(b.dataset.group)[i].approved = false;
  if (act === "approve") {
    state.approvedAt = new Date(); state.ws = "approved"; state.dr = "approved"; recordJob(); fly("packetBack");
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
  if (act === "go-history") { state.tab = "history"; state.open = "J-1044"; }
  if (act === "job") state.open = state.open === b.dataset.id ? null : b.dataset.id;
  render();
});

document.addEventListener("change", (e) => {
  const s = e.target;
  if (s.dataset && s.dataset.act === "status") {
    const it = grp(s.dataset.group)[Number(s.dataset.i)];
    it.status = s.value; it.approved = s.value === "needed_now"; render();
  }
});
document.addEventListener("input", (e) => {
  if (e.target.id === "search") { state.search = e.target.value; render(); }
  if (e.target.id === "notes") state.notes = e.target.value;
  if (e.target.id === "extraNotes") state.extraNotes = e.target.value;
});

// ---------- chrome ----------
function saveDemo() { try { localStorage.setItem("rf-demo", demoOn() ? "1" : "0"); } catch (_) {} }
function badge() {
  const b = $("aiBadge");
  if (demoOn()) { b.className = "pill demo"; b.textContent = "Demo mode · saved examples"; return; }
  b.className = window.__aiReady ? "pill live" : "pill demo";
  b.textContent = window.__aiReady ? `Live AI · ${window.__aiModel}` : "No API key · saved examples";
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
  $("demoMode").checked = true; badge();
  const order = ["draft", "notified", "thread", "quote", "approved", "extra_draft", "banner", "extra", "done", "ready", "history"];
  const stop = order.indexOf(scene);
  const steps = [
    async () => { click('[data-act="build"]'); await waitFor(() => state.ws === "draft"); },
    async () => { click('[data-act="send"]'); await sleep(1200); },
    async () => { click('[data-act="open-thread"]'); await sleep(400); },
    async () => { click('[data-act="open-quote"]'); await sleep(400); },
    async () => { click('[data-act="approve"]'); await sleep(900); },
    async () => { click('[data-act="build-extra"]'); await waitFor(() => state.ws === "extra_draft"); },
    async () => { click('[data-act="send-extra"]'); await sleep(1200); },
    async () => { click('[data-act="open-extra"]'); await sleep(400); },
    async () => { click('[data-act="x-approve"]'); await sleep(900); },
    async () => { click('[data-act="start"]'); await sleep(200); click('[data-act="qc"]'); await sleep(200); click('[data-act="ready"]'); await sleep(1200); click('[data-act="open-ready"]'); await sleep(500); },
    async () => { click('[data-act="go-history"]'); await sleep(400); },
  ];
  for (let k = 0; k <= stop; k++) await steps[k]();
  document.body.dataset.sceneReady = "1";
}
const __scene = new URLSearchParams(location.search).get("scene");
if (__scene) setTimeout(() => runScene(__scene), 600);
