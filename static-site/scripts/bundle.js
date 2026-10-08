#!/usr/bin/env node
/**
 * PropAuto AI — release bundler.
 *
 * Assembles the complete deliverable into a single archive:
 *   - the static product shell (index.html, assets/, icon.svg)
 *   - the quality gates and tooling (scripts/)
 *   - the full provenance archive (recovery/ — Vercel deployment history,
 *     RSC payload, recovered pages, original repo files)
 *   - docs (README, CHANGELOG, AGENTS notes)
 *
 * Output: /workspace/propauto-complete-project.tar.gz
 * Usage:  node scripts/bundle.js
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "propauto-complete-project.tar.gz");

const TOP_LEVEL = [
  "index.html",
  "properties.html",
  "cars.html",
  "investors.html",
  "contact.html",
  "sign-in.html",
  "sign-up.html",
  "reset-password.html",
  "privacy.html",
  "terms.html",
  "about.html",
  "404.html",
  "icon.svg",
  "robots.txt",
  "sitemap.xml",
  "vercel.json",
  "README.md",
  "CHANGELOG.md",
  "AGENTS.md",
  ".gitignore",
  ".env.example",
  "package.json",
  "server.js"
];
const DIRS = ["assets", "scripts", "recovery", "lib", "data", "original-source"];

function collect() {
  const files = [];
  for (const name of TOP_LEVEL) {
    const p = path.join(ROOT, name);
    if (fs.existsSync(p)) files.push(p);
  }
  for (const dir of DIRS) {
    walk(path.join(ROOT, dir), files);
  }
  return files;
}

function walk(dir, out) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
}

function main() {
  const files = collect();
  if (fs.existsSync(OUT)) fs.unlinkSync(OUT);

  const list = files.map((f) => path.relative(ROOT, f)).join(" ");
  execFileSync("tar", ["-czf", OUT, ...files.map((f) => path.relative(ROOT, f))], {
    cwd: ROOT
  });

  const size = fs.statSync(OUT).size;
  console.log("bundled " + files.length + " files → " + path.basename(OUT) + " (" + size + " bytes)");
}

main();