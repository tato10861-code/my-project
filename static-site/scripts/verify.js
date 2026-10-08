/**
 * PropAuto AI — quality gate.
 *
 * Fails the build when the UI and its assets drift apart:
 *   1. every data-i18n key used in HTML exists in every shipped dictionary;
 *   2. every dictionary key is used (dead keys are reported);
 *   3. every class referenced by the markup exists in the stylesheet;
 *   4. no duplicate ids in the document;
 *   5. all assets referenced exist on disk.
 *
 * Usage: node scripts/verify.js
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const CSS = path.join(ROOT, "assets/css/styles.css");

function read(file) {
  return fs.readFileSync(file, "utf8");
}

/** Every top-level HTML page shipped with the site. */
function htmlPages() {
  return fs
    .readdirSync(ROOT)
    .filter((name) => /\.html$/.test(name) && !name.startsWith("."))
    .sort();
}

function loadLocales() {
  const context = {};
  context.window = context;
  vm.createContext(context);
  vm.runInContext(read(path.join(ROOT, "assets/js/locales.js")), context);
  const bundle = context.PropAutoLocales || {};
  return {
    source: bundle.source || "en",
    supported: bundle.supported || Object.keys(bundle.dictionaries || {}),
    dictionaries: bundle.dictionaries || {}
  };
}

function cssClasses(source) {
  const found = new Set();
  const re = /\.(-?[_a-zA-Z][\w-]*)/g;
  let match;
  while ((match = re.exec(source))) found.add(match[1]);
  return found;
}

function htmlClasses(source) {
  const used = new Set();
  const re = /class="([^"]+)"/g;
  let match;
  while ((match = re.exec(source))) {
    match[1].split(/\s+/).filter(Boolean).forEach((name) => used.add(name));
  }
  return used;
}

function i18nKeys(source) {
  const text = new Set();
  const attributes = new Set();
  let match;
  const textRe = /data-i18n="([^"]+)"/g;
  while ((match = textRe.exec(source))) text.add(match[1]);
  const attrRe = /data-i18n-([a-z]+)="([^"]+)"/g;
  while ((match = attrRe.exec(source))) attributes.add(match[2]);
  return { text, attributes };
}

function ids(source) {
  const seen = new Map();
  const re = /\sid="([^"]+)"/g;
  let match;
  while ((match = re.exec(source))) {
    seen.set(match[1], (seen.get(match[1]) || 0) + 1);
  }
  return seen;
}

function localAssets(source) {
  const list = new Set();
  const re = /(?:src|href)="((?!https?:|mailto:|tel:|data:|#)[^"]+)"/g;
  let match;
  while ((match = re.exec(source))) {
    const value = match[1].split("#")[0].split("?")[0];
    if (value) list.add(value);
  }
  return list;
}

function main() {
  const pages = htmlPages();
  const html = pages.map((name) => read(path.join(ROOT, name))).join("\n");
  const css = read(CSS);
  const locales = loadLocales();
  const errors = [];
  const warnings = [];

  /* 1 — dictionary coverage across every page */
  const keys = i18nKeys(html);
  const all = Array.from(keys.text).concat(Array.from(keys.attributes));
  locales.supported.forEach((code) => {
    const dict = locales.dictionaries[code] || {};
    const missing = all.filter((key) => !(key in dict));
    if (missing.length) {
      errors.push(`[i18n] "${code}" is missing ${missing.length} key(s): ${missing.join(", ")}`);
    }
  });

  /* 2 — dead keys */
  const used = new Set(all);
  const source = locales.dictionaries[locales.source] || {};
  const dead = Object.keys(source).filter((key) => !used.has(key));
  if (dead.length) warnings.push(`[i18n] ${dead.length} dictionary key(s) not used in any page: ${dead.join(", ")}`);

  /* 3 — CSS class parity across every page */
  const known = cssClasses(css);
  const declared = htmlClasses(html);
  const unknown = Array.from(declared).filter((name) => !known.has(name));
  if (unknown.length) errors.push(`[css] ${unknown.length} class(es) used but not styled: ${unknown.join(", ")}`);

  /* 4 — duplicate ids per page */
  pages.forEach((name) => {
    Array.from(ids(read(path.join(ROOT, name))).entries()).forEach(([id, count]) => {
      if (count > 1) errors.push(`[html] duplicate id "${id}" in ${name} (${count} occurrences)`);
    });
  });

  /* 5 — referenced files exist */
  Array.from(localAssets(html)).forEach((asset) => {
    const target = path.join(ROOT, asset.split("?")[0]);
    if (!fs.existsSync(target)) errors.push(`[assets] missing file referenced by a page: ${asset}`);
  });

  const summary = {
    pages: pages.length,
    locales: locales.supported.join(", "),
    dictionaryKeys: Object.keys(source).length,
    keysWired: used.size,
    classesDeclared: declared.size,
    classesStyled: known.size,
    assets: Array.from(localAssets(html)).length
  };

  console.log("PropAuto AI — verification report");
  console.log("---------------------------------");
  Object.keys(summary).forEach((label) => console.log(`  ${label}: ${summary[label]}`));

  if (warnings.length) {
    console.log("\nWarnings:");
    warnings.forEach((line) => console.log("  ! " + line));
  }

  if (errors.length) {
    console.log("\nErrors:");
    errors.forEach((line) => console.log("  x " + line));
    process.exitCode = 1;
    return;
  }

  console.log("\nOK — markup, dictionaries and stylesheet are consistent.");
}

main();
