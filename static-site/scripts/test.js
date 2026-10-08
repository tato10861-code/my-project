#!/usr/bin/env node
/**
 * PropAuto AI — automated test suite (Node, no dependencies).
 *
 * Covers the three pure modules (locales, i18n, data) plus the exported
 * helpers of the app layer, so regressions are caught before any deploy.
 * Run: node scripts/test.js   (exit 0 = all green)
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const FILES = [
  "assets/js/locales.js",
  "assets/js/i18n.js",
  "assets/js/data.js",
  "assets/js/analytics.js",
  "assets/js/app.js"
];

/* ── minimal DOM shim (browser APIs used by app.js boot) ────────────────── */
class FakeElement {
  constructor(tag) {
    this.tagName = tag;
    this.children = [];
    this.style = { setProperty: () => {} };
    this.dataset = {};
    this.attrs = {};
    this.classList = { add: () => {}, remove: () => {}, toggle: () => {} };
    this.textContent = "";
    this.hidden = false;
    this.attributes = [];
  }
  appendChild(c) { this.children.push(c); return c; }
  setAttribute(k, v) { this.attrs[k] = v; }
  getAttribute(k) { return this.attrs[k] || null; }
  addEventListener() {}
  querySelector() { return null; }
  querySelectorAll() { return []; }
  closest() { return new FakeElement("div"); }
}

class FakeCustomEvent {
  constructor(type, opts) { this.type = type; this.detail = opts && opts.detail; }
}

function buildContext() {
  const doc = {
    documentElement: { setAttribute: () => {} },
    querySelector: () => new FakeElement("div"),
    querySelectorAll: () => [],
    dispatchEvent: () => {},
    addEventListener: () => {},
    createElement: (t) => new FakeElement(t)
  };
  const ctx = {};
  ctx.window = ctx;
  ctx.document = doc;
  ctx.navigator = {};
  const store = {};
  ctx.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); }
  };
  ctx.location = { search: "", href: "file:///index.html" };
  ctx.console = console;
  ctx.CustomEvent = FakeCustomEvent;
  ctx.requestAnimationFrame = (f) => { if (typeof f === "function") f(); };
  ctx.setTimeout = () => 1;
  ctx.clearTimeout = () => {};
  ctx.matchMedia = () => ({ matches: false });
  ctx.addEventListener = () => {};
  vm.createContext(ctx);
  return ctx;
}

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log("  ✓ " + name);
  } catch (err) {
    failed += 1;
    console.log("  ✗ " + name + " — " + err.message);
  }
}

function assert(cond, message) {
  if (!cond) throw new Error(message || "assertion failed");
}

/* ── load modules ───────────────────────────────────────────────────────── */
const ctx = buildContext();
for (const file of FILES) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), ctx);
}

const Locales = ctx.PropAutoLocales;
const I18n = ctx.PropAutoI18n;
const Data = ctx.PropAutoData;
const App = ctx.PropAutoApp;

console.log("PropAuto AI — test suite");

/* ── locales ────────────────────────────────────────────────────────────── */
console.log("\nlocales");
test("six dictionaries exposed", () => {
  assert(Locales && Locales.dictionaries, "PropAutoLocales missing");
  assert(Object.keys(Locales.dictionaries).length === 6, "expected 6 locales");
  assert(Locales.supported.length === 6, "supported must list 6 locales");
  ["en", "ar", "fr", "es", "de", "tr"].forEach((code) => {
    assert(Locales.dictionaries[code], code + " dictionary missing");
  });
});
test("english is the source", () => {
  assert(Locales.source === "en", "source must be en");
});
test("every locale has >= 100 keys", () => {
  Object.keys(Locales.dictionaries).forEach((code) => {
    assert(Object.keys(Locales.dictionaries[code]).length >= 100, code + " too small");
  });
});

/* ── i18n ───────────────────────────────────────────────────────────────── */
console.log("\ni18n");
test("parity is clean across all locales", () => {
  const report = I18n.parity();
  Object.keys(report).forEach((code) => {
    assert(report[code].missing.length === 0, code + " missing keys");
    assert(report[code].extra.length === 0, code + " extra keys");
  });
});
test("flat key lookup resolves", () => {
  assert(I18n.t("hero.title") === "Own what comes next.", "hero.title mismatch");
});
test("interpolation replaces placeholders", () => {
  assert(I18n.t("market.count", { count: 14 }) === "14 verified assets shown.", "count mismatch");
  assert(I18n.t("calc.years", { count: 10 }) === "10 years", "years mismatch");
});
test("locale switch to arabic flips dir", () => {
  I18n.set("ar");
  assert(I18n.current() === "ar", "current not ar");
  assert(I18n.meta().dir === "rtl", "ar must be rtl");
  assert(I18n.t("nav.start") === "ابدأ مجاناً", "ar nav.start mismatch");
  I18n.set("en");
});
test("has() reflects key existence", () => {
  assert(I18n.has("hero.title") === true, "hero.title should exist");
  assert(I18n.has("no.such.key") === false, "no.such.key must not exist");
});
test("money formatter compacts", () => {
  assert(I18n.formatMoneyShort(2500000) === "$2.5M", "2.5M mismatch");
  assert(I18n.formatMoneyShort(4800000) === "$4.8M", "4.8M mismatch");
});

/* ── data ───────────────────────────────────────────────────────────────── */
console.log("\ndata");
test("catalogue has 14 verified assets", () => {
  assert(Data.ASSETS.length === 14, "expected 14 assets, got " + Data.ASSETS.length);
});
test("categories match the catalogue", () => {
  assert(Data.CATEGORIES[0].id === "real-estate", "first category must be real-estate");
  assert(Data.CATEGORIES[1].id === "automotive", "second category must be automotive");
});
test("filter by category", () => {
  assert(Data.filter({ category: "automotive" }).length === 6, "expected 6 cars");
  assert(Data.filter({ category: "real-estate" }).length === 8, "expected 8 properties");
});
test("filter by query", () => {
  assert(Data.filter({ query: "villa" }).length >= 1, "villa query empty");
});
test("sort by price ascending", () => {
  const sorted = Data.sort(Data.ASSETS, "price-asc");
  assert(sorted[0].price <= sorted[1].price, "first two out of order");
});
test("summary aggregates totals", () => {
  const s = Data.summary();
  assert(s.count === 14, "summary count mismatch");
  assert(s.totalValue > 0, "total value must be positive");
});
test("audience snapshot is wired", () => {
  assert(Data.AUDIENCE.visitors === 12840, "visitors mismatch (expect 12840 from production RSC)");
  assert(Data.AUDIENCE.leads === 2140, "leads mismatch (expect 2140 from production RSC)");
  assert(Data.AUDIENCE.visitorsDelta === 0.186, "visitors delta mismatch");
  assert(Data.AUDIENCE.leadsDelta === 0.248, "leads delta mismatch");
  assert(Data.AUDIENCE.sources.length === 4, "expected 4 lead sources");
  const total = Data.AUDIENCE.sources.reduce((sum, s) => sum + s.share, 0);
  assert(Math.abs(total - 1) < 0.01, "source shares must sum to 1");
});
test("global operations analytics present", () => {
  assert(Data.OPERATIONS, "OPERATIONS missing");
  assert(Data.OPERATIONS.calls === 500, "calls must be 500");
  assert(Data.OPERATIONS.deals === 18, "deals must be 18");
  assert(Math.abs(Data.OPERATIONS.conversion - 0.23) < 1e-9, "conversion must be 0.23");
  assert(Data.OPERATIONS.revenue === "$2k–5k", "revenue string mismatch");
});
test("pulse strip exposes localised indices", () => {
  assert(Data.PULSE.length === 3, "expected 3 pulse indices");
  assert(Data.PULSE[0].labelKey === "pulse.villa", "first pulse label key");
});

/* ── app layer ──────────────────────────────────────────────────────────── */
console.log("\napp");
test("PropAutoApp exported", () => {
  assert(App && typeof App.calculate === "function", "PropAutoApp missing");
});
test("calculator projects a position", () => {
  const r = App.calculate({ budget: 2500000, horizon: 10, yield: 6 });
  assert(r.income === 150000, "income mismatch: " + r.income);
  assert(r.projected > 2500000, "projected must exceed budget");
  assert(r.total > 0, "total must be positive");
});
test("calculator guards bad input", () => {
  assert(App.calculate({ budget: 0, horizon: 10, yield: 6 }).error === "budget", "budget guard");
  assert(App.calculate({ budget: 1e6, horizon: 70, yield: 6 }).error === "horizon", "horizon guard");
});
test("intent detection covers all surfaces", () => {
  assert(App.intent("find a villa in dubai") === "listings", "listings intent");
  assert(App.intent("what is the price?") === "pricing", "pricing intent");
  assert(App.intent("investor brief please") === "investors", "investors intent");
  assert(App.intent("random noise") === "fallback", "fallback intent");
});
test("pick helper reads first defined key", () => {
  assert(App.pick({ x: 1, y: 2 }, ["y"], 0) === 2, "pick failed");
  assert(App.pick(null, ["a"], "fb") === "fb", "pick fallback failed");
});

/* ── analytics layer ─────────────────────────────────────────────────────── */
console.log("\nanalytics");
test("PropAutoAnalytics exported and tracks", () => {
  assert(ctx.PropAutoAnalytics && typeof ctx.PropAutoAnalytics.track === "function", "analytics sink missing");
  ctx.PropAutoAnalytics.track("test_event", { probe: true });
  const queue = ctx.PropAutoAnalytics.queue();
  assert(queue.length >= 1, "event queue must persist");
  assert(queue[queue.length - 1].event === "test_event", "last event mismatch");
});

/* ── pages ───────────────────────────────────────────────────────────────── */
console.log("\npages");
test("every top-level page uses only known dictionary keys", () => {
  const fs2 = require("fs");
  const pages = fs2
    .readdirSync(ROOT)
    .filter((name) => /\.html$/.test(name) && !name.startsWith("."));
  assert(pages.length >= 10, "expected the full page set, got " + pages.length);
  const en = Locales.dictionaries.en || {};
  pages.forEach((name) => {
    const source = fs2.readFileSync(path.join(ROOT, name), "utf8");
    const textRe = /data-i18n="([^"]+)"/g;
    const attrRe = /data-i18n-[a-z]+="([^"]+)"/g;
    let match;
    const used = new Set();
    while ((match = textRe.exec(source))) used.add(match[1]);
    while ((match = attrRe.exec(source))) used.add(match[1]);
    const missing = Array.from(used).filter((key) => !(key in en));
    assert(missing.length === 0, name + " uses unknown keys: " + missing.join(", "));
  });
});

/* ── report ─────────────────────────────────────────────────────────────── */
console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);