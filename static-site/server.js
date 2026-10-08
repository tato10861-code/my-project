#!/usr/bin/env node
/**
 * PropAuto AI — local development server (zero dependencies).
 *
 * Serves the static site (12 HTML pages + assets) and implements the
 * public API surface used by the frontend:
 *
 *   GET  /api/health           — health probe
 *   GET  /api/v1/leads         — list leads (?status=&lang=&type=)
 *   POST /api/v1/leads         — create a lead (contact form)
 *   POST /api/v1/call          — queue an AI voice call (Vapi)
 *   POST /api/v1/webhook       — receive lead events → forward to CRM
 *   POST /api/analytics        — analytics event batch
 *   POST /api/auth/signup      — create account (demo auth)
 *   POST /api/auth/signin      — sign in (demo auth)
 *   POST /api/auth/reset       — request password reset (demo)
 *   GET  /api/auth/me          — current user from Bearer token
 *
 * Data is persisted to a SQLite database (data/propauto.db, zero-dependency
 * via node:sqlite) with a JSON-file fallback (override with DATA_DIR).
 * When NHOST_GRAPHQL_URL + NHOST_ADMIN_SECRET are set, leads are also
 * mirrored to the linked Nhost Postgres database (production path).
 *
 * Usage:  node server.js            (PORT env or 5173)
 */

"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = __dirname;
const PORT = parseInt(process.env.PORT || "5173", 10);
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, "data");
const MAX_BODY_BYTES = 64 * 1024;
const MAX_ANALYTICS_EVENTS = 50;
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/* Only these extensions are ever served as static files. */
const PUBLIC_EXTENSIONS = new Set([".html", ".css", ".svg", ".xml", ".png", ".jpg", ".jpeg", ".webp", ".ico", ".woff2", ".woff", ".ttf"]);
/* Scripts are served only from the asset folder, never server code. */
const PUBLIC_SCRIPT_DIR = "assets" + path.sep;
const PUBLIC_TEXT_FILES = new Set(["robots.txt"]);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".gz": "application/gzip",
  ".map": "application/json",
};

/* ── storage (SQLite primary, JSON fallback) ──────────────────────────── */

const storage = require("./lib/storage");
const loadStore = storage.loadStore;
const saveStore = storage.saveStore;

function id(prefix) {
  return prefix + "_" + crypto.randomBytes(6).toString("hex");
}

function now() {
  return new Date().toISOString();
}

/* ── Nhost mirror (production path, best effort) ──────────────────────── */

async function syncLeadToNhost(lead) {
  const gql = process.env.NHOST_GRAPHQL_URL;
  const secret = process.env.NHOST_ADMIN_SECRET;
  if (!gql || !secret) return; // not configured — local store only
  try {
    const mutation = `
      mutation InsertLead($lead: leads_insert_input!) {
        insert_leads_one(object: $lead) { id }
      }`;
    const res = await fetch(gql, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hasura-admin-secret": secret,
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          lead: {
            name: lead.name || null,
            email: lead.email || null,
            phone: lead.phone || null,
            status: lead.status || "new",
            lang: lead.lang || "en",
            type: lead.type || null,
            source: lead.source || null,
          },
        },
      }),
    });
    if (!res.ok) console.error("[Nhost] sync failed:", res.status);
  } catch (err) {
    console.error("[Nhost] sync error:", err.message);
  }
}

/* ── auth (demo backend; production uses Nhost Auth) ──────────────────── */

function hashPassword(password, salt) {
  return crypto.scryptSync(String(password), salt, 32).toString("hex");
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, created_at: user.created_at };
}

function hashToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

/** Issues a fresh session token; only its hash is stored. */
function issueToken(user) {
  const token = crypto.randomBytes(32).toString("hex");
  user.token_hash = hashToken(token);
  user.token_expires_at = new Date(Date.now() + TOKEN_TTL_MS).toISOString();
  delete user.token; // legacy plaintext token
  return token;
}

function findUserByToken(token) {
  if (!token) return null;
  const digest = hashToken(token);
  const users = loadStore("users", []);
  const user = users.find((u) => (u.token_hash && safeEqual(u.token_hash, digest)) || (u.token && safeEqual(u.token, token)));
  if (!user) return null;
  if (user.token_expires_at && Date.parse(user.token_expires_at) < Date.now()) return null;
  return user;
}

/** Bearer check for operator-only endpoints (ADMIN_TOKEN env). */
function isAdmin(req) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return false;
  const auth = req.headers.authorization || "";
  return auth.startsWith("Bearer ") && safeEqual(auth.slice(7), expected);
}

/* ── HTTP helpers ─────────────────────────────────────────────────────── */

function sendJSON(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  });
  res.end(payload);
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > (limit || MAX_BODY_BYTES)) {
        reject(new Error("payload too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

/* ── API routes ───────────────────────────────────────────────────────── */

async function handleAPI(req, res, pathname) {
  const method = req.method;

  if (pathname === "/api/health") {
    return sendJSON(res, 200, {
      ok: true,
      service: "propauto-ai",
      version: "1.0.0",
      storage: storage.backend(),
      store: storage.file(),
      time: now(),
    });
  }

  /* leads */
  if (pathname === "/api/v1/leads") {
    if (method === "GET") {
      // Leads hold personal data: operator-only.
      if (!isAdmin(req)) return sendJSON(res, 401, { success: false, error: "unauthorized" });
      const url = new URL(req.url, "http://localhost");
      const status = url.searchParams.get("status");
      const lang = url.searchParams.get("lang");
      const type = url.searchParams.get("type");
      let rows = loadStore("leads", []);
      if (status) rows = rows.filter((r) => r.status === status);
      if (lang) rows = rows.filter((r) => r.lang === lang);
      if (type) rows = rows.filter((r) => r.type === type);
      rows = rows.slice().sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
      return sendJSON(res, 200, { success: true, count: rows.length, data: rows });
    }
    if (method === "POST") {
      let body;
      try {
        body = await readBody(req);
      } catch (_) {
        return sendJSON(res, 400, { success: false, error: "invalid_json" });
      }
      const email = String(body.email || "").trim();
      const phone = String(body.phone || "").trim();
      if (!email && !phone) {
        return sendJSON(res, 422, { success: false, error: "email_or_phone_required" });
      }
      const lead = {
        id: id("ld"),
        name: String(body.name || "").trim() || null,
        email: email || null,
        phone: phone || null,
        interest: String(body.interest || "").trim() || null,
        message: String(body.message || "").trim() || null,
        status: "new",
        lang: String(body.lang || "en").slice(0, 5),
        type: String(body.type || "contact").slice(0, 40),
        source: String(body.source || "web").slice(0, 40),
        created_at: now(),
      };
      const leads = loadStore("leads", []);
      leads.push(lead);
      saveStore("leads", leads);
      syncLeadToNhost(lead); // fire and forget
      return sendJSON(res, 201, { success: true, data: lead });
    }
    return sendJSON(res, 405, { success: false, error: "method_not_allowed" });
  }

  /* calls */
  if (pathname === "/api/v1/call" && method === "POST") {
    let body;
    try {
      body = await readBody(req);
    } catch (_) {
      return sendJSON(res, 400, { success: false, error: "invalid_json" });
    }
    const phone = String(body.phone || "").trim();
    if (!phone) {
      return sendJSON(res, 422, { success: false, error: "phone_required" });
    }
    const call = {
      id: id("cl"),
      phone: phone,
      language: String(body.language || "en").slice(0, 5),
      type: String(body.type || "real_estate").slice(0, 40),
      status: "queued",
      created_at: now(),
    };
    const calls = loadStore("calls", []);
    calls.push(call);
    saveStore("calls", calls);
    return sendJSON(res, 201, { success: true, data: call });
  }

  /* webhook */
  if (pathname === "/api/v1/webhook" && method === "POST") {
    const secret = process.env.WEBHOOK_SECRET;
    if (!secret) return sendJSON(res, 503, { success: false, error: "webhook_not_configured" });
    if (!safeEqual(req.headers["x-webhook-secret"] || "", secret)) {
      return sendJSON(res, 401, { success: false, error: "unauthorized" });
    }
    let body;
    try {
      body = await readBody(req);
    } catch (_) {
      return sendJSON(res, 400, { success: false, error: "invalid_json" });
    }
    const entry = {
      id: id("wh"),
      event: String(body.event || "lead.created"),
      lead: body.lead || null,
      source: String(body.source || "unknown").slice(0, 40),
      received_at: now(),
    };
    const logs = loadStore("webhooks", []);
    logs.push(entry);
    saveStore("webhooks", logs);
    const crm = process.env.CRM_WEBHOOK_URL;
    if (crm) {
      fetch(crm, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: entry.event, lead: entry.lead }),
      }).catch((err) => console.error("[CRM] forward error:", err.message));
    }
    return sendJSON(res, 200, { success: true, received: true, id: entry.id });
  }

  /* analytics */
  if (pathname === "/api/analytics" && method === "POST") {
    let body;
    try {
      body = await readBody(req);
    } catch (_) {
      return sendJSON(res, 400, { success: false, error: "invalid_json" });
    }
    const events = Array.isArray(body.events) ? body.events.slice(0, MAX_ANALYTICS_EVENTS) : [];
    const rows = loadStore("analytics", []);
    events.forEach((event, i) => {
      rows.push({
        id: id("ev"),
        type: String((event && event.type) || "event"),
        payload: event || {},
        received_at: now(),
        seq: i,
      });
    });
    saveStore("analytics", rows);
    return sendJSON(res, 200, { success: true, count: events.length });
  }

  /* auth */
  if (pathname === "/api/auth/signup" && method === "POST") {
    let body;
    try {
      body = await readBody(req);
    } catch (_) {
      return sendJSON(res, 400, { success: false, error: "invalid_json" });
    }
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return sendJSON(res, 422, { success: false, error: "invalid_email" });
    }
    if (password.length < 8) {
      return sendJSON(res, 422, { success: false, error: "password_too_short" });
    }
    const users = loadStore("users", []);
    if (users.some((u) => u.email === email)) {
      return sendJSON(res, 409, { success: false, error: "email_taken" });
    }
    const salt = crypto.randomBytes(16).toString("hex");
    const user = {
      id: id("us"),
      name: String(body.name || "").trim() || null,
      email: email,
      salt: salt,
      hash: hashPassword(password, salt),
      created_at: now(),
    };
    const token = issueToken(user);
    users.push(user);
    saveStore("users", users);
    return sendJSON(res, 201, { success: true, data: { token: token, user: publicUser(user) } });
  }

  if (pathname === "/api/auth/signin" && method === "POST") {
    let body;
    try {
      body = await readBody(req);
    } catch (_) {
      return sendJSON(res, 400, { success: false, error: "invalid_json" });
    }
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const users = loadStore("users", []);
    const user = users.find((u) => u.email === email);
    // Hash even for unknown emails so response time does not reveal accounts.
    const candidate = hashPassword(password, user ? user.salt : "propauto-no-such-user");
    if (!user || !safeEqual(user.hash, candidate)) {
      return sendJSON(res, 401, { success: false, error: "invalid_credentials" });
    }
    const token = issueToken(user);
    saveStore("users", users);
    return sendJSON(res, 200, { success: true, data: { token: token, user: publicUser(user) } });
  }

  if (pathname === "/api/auth/reset" && method === "POST") {
    let body;
    try {
      body = await readBody(req);
    } catch (_) {
      return sendJSON(res, 400, { success: false, error: "invalid_json" });
    }
    const email = String(body.email || "").trim().toLowerCase();
    const users = loadStore("users", []);
    const user = users.find((u) => u.email === email);
    if (user) {
      user.reset_requested_at = now();
      saveStore("users", users);
    }
    // Always succeed — never reveal whether an account exists.
    return sendJSON(res, 200, { success: true });
  }

  if (pathname === "/api/auth/me" && method === "GET") {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const user = findUserByToken(token);
    if (!user) return sendJSON(res, 401, { success: false, error: "unauthorized" });
    return sendJSON(res, 200, { success: true, data: { user: publicUser(user) } });
  }

  /* checkout */
  if (pathname === "/api/checkout" && method === "POST") {
    let body;
    try {
      body = await readBody(req);
    } catch (_) {
      return sendJSON(res, 400, { success: false, error: "invalid_json" });
    }
    const product = String(body.product || body.priceId || "propauto-premium-access").slice(0, 80);
    const email = String(body.email || "").trim().toLowerCase();
    const session = {
      id: id("ck"),
      product: product,
      email: email || null,
      status: "pending",
      created_at: now(),
    };
    const sessions = loadStore("checkouts", []);
    sessions.push(session);
    saveStore("checkouts", sessions);
    if (process.env.STRIPE_SECRET_KEY) {
      // A real Stripe session is created by the Next.js app (/api/checkout).
      // This dev server must not hand out a checkout.stripe.com link it never created.
      return sendJSON(res, 501, { success: false, error: "stripe_checkout_not_available_on_dev_server", session_id: session.id });
    }
    return sendJSON(res, 201, {
      success: true,
      data: { session_id: session.id, redirect: "/#pricing?session=" + session.id, mode: "demo" },
    });
  }

  if (pathname === "/api/checkout" && method === "GET") {
    const sessionId = new URL(req.url, "http://localhost").searchParams.get("session") || "";
    const session = loadStore("checkouts", []).find((s) => s.id === sessionId);
    if (!session) return sendJSON(res, 404, { success: false, error: "session_not_found" });
    return sendJSON(res, 200, { success: true, data: { id: session.id, product: session.product, status: session.status, created_at: session.created_at } });
  }

  return sendJSON(res, 404, { success: false, error: "not_found" });
}

/* ── static files ─────────────────────────────────────────────────────── */

/**
 * True only for files meant for the browser. Everything else in the project
 * folder -- .env, data/ (the database and user store), server.js, lib/,
 * scripts/, recovery/, package files -- is never served.
 */
function isPublicFile(rel) {
  if (rel.split(/[\\/]/).some((part) => part.startsWith("."))) return false;
  const ext = path.extname(rel).toLowerCase();
  if (PUBLIC_TEXT_FILES.has(rel)) return true;
  if (ext === ".js" || ext === ".mjs" || ext === ".map") return rel.startsWith(PUBLIC_SCRIPT_DIR) || rel.startsWith("assets/");
  if (!PUBLIC_EXTENSIONS.has(ext)) return false;
  return !/^(data|lib|scripts|recovery|original-source|node_modules)([\\/]|$)/.test(rel);
}

function serveStatic(req, res, pathname) {
  let rel;
  try {
    rel = decodeURIComponent(pathname);
  } catch (_) {
    return sendJSON(res, 400, { success: false, error: "bad_request" });
  }
  if (rel === "/") rel = "/index.html";
  if (rel.startsWith("/")) rel = rel.slice(1);
  // Clean URLs, matching vercel.json: /terms -> terms.html
  if (rel && !path.extname(rel)) rel += ".html";

  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT + path.sep) && file !== ROOT) {
    return sendJSON(res, 403, { success: false, error: "forbidden" });
  }
  if (!isPublicFile(path.relative(ROOT, file)) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    const notFound = path.join(ROOT, "404.html");
    if (fs.existsSync(notFound)) {
      const html = fs.readFileSync(notFound);
      res.writeHead(404, {
        "Content-Type": MIME[".html"],
        "Content-Length": html.length,
        "X-Content-Type-Options": "nosniff",
      });
      return res.end(html);
    }
    return sendJSON(res, 404, { success: false, error: "not_found" });
  }

  const ext = path.extname(file).toLowerCase();
  const data = fs.readFileSync(file);
  res.writeHead(200, {
    "Content-Type": MIME[ext] || "application/octet-stream",
    "Content-Length": data.length,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-cache, no-store, must-revalidate",
  });
  res.end(data);
}

/* ── server ───────────────────────────────────────────────────────────── */

const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, "http://localhost").pathname;
  try {
    if (pathname.startsWith("/api/")) {
      await handleAPI(req, res, pathname);
    } else if (req.method === "GET" || req.method === "HEAD") {
      serveStatic(req, res, pathname);
    } else {
      sendJSON(res, 405, { success: false, error: "method_not_allowed" });
    }
  } catch (err) {
    console.error("[PropAuto] request error:", err.message);
    if (!res.headersSent) sendJSON(res, 500, { success: false, error: "internal_error" });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("PropAuto server listening on port " + PORT);
});

module.exports = { server, handleAPI, loadStore, saveStore, storage };