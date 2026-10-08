#!/usr/bin/env node
/**
 * PropAuto AI — API smoke test.
 *
 * Spawns server.js on an isolated port + data dir and exercises every
 * public endpoint end-to-end (health, leads, calls, webhooks, analytics,
 * auth). Exits non-zero on any failure.
 *
 * Usage: node scripts/api-test.js
 */
"use strict";

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const PORT = 5199;
const BASE = "http://127.0.0.1:" + PORT;
const DATA_DIR = "/tmp/propauto-api-test";

function request(method, url, body, token) {
  return fetch(BASE + url, {
    method: method,
    headers: Object.assign(
      {},
      body ? { "Content-Type": "application/json" } : {},
      token ? { Authorization: "Bearer " + token } : {}
    ),
    body: body ? JSON.stringify(body) : undefined
  }).then(async (res) => {
    const json = await res.json().catch(() => ({}));
    return { status: res.status, json: json };
  });
}

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

async function waitForServer() {
  for (let i = 0; i < 50; i += 1) {
    try {
      const res = await fetch(BASE + "/api/health");
      if (res.ok) return;
    } catch (_) {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("server did not start in time");
}

async function main() {
  fs.rmSync(DATA_DIR, { recursive: true, force: true });
  const child = spawn(process.execPath, ["server.js"], {
    cwd: path.join(__dirname, ".."),
    env: Object.assign({}, process.env, { PORT: String(PORT), DATA_DIR: DATA_DIR }),
    stdio: ["ignore", "pipe", "pipe"]
  });
  child.stdout.on("data", () => {});
  child.stderr.on("data", () => {});

  try {
    await waitForServer();

    const health = await request("GET", "/api/health");
    assert(health.status === 200 && health.json.ok === true, "health check failed");
    assert(health.json.storage === "sqlite", "expected sqlite storage backend");

    const leadPost = await request("POST", "/api/v1/leads", {
      name: "Test Lead",
      email: "test@prop.auto",
      interest: "buying",
      message: "hello from api-test",
      lang: "en"
    });
    assert(leadPost.status === 201 && leadPost.json.success, "lead creation failed");
    const leadId = leadPost.json.data.id;

    const leadList = await request("GET", "/api/v1/leads?status=new");
    assert(leadList.status === 200 && leadList.json.count >= 1, "lead listing failed");

    const call = await request("POST", "/api/v1/call", {
      phone: "+967733393884",
      language: "ar",
      type: "real_estate"
    });
    assert(call.status === 201 && call.json.data.status === "queued", "call queue failed");

    const webhook = await request("POST", "/api/v1/webhook", {
      event: "lead.created",
      lead: { id: leadId }
    });
    assert(webhook.status === 200 && webhook.json.received === true, "webhook failed");

    const analytics = await request("POST", "/api/analytics", {
      events: [{ type: "page_view" }, { type: "contact_submit" }]
    });
    assert(analytics.status === 200 && analytics.json.count === 2, "analytics failed");

    const signup = await request("POST", "/api/auth/signup", {
      name: "Tester",
      email: "tester@prop.auto",
      password: "secret123"
    });
    assert(signup.status === 201 && signup.json.data.token, "signup failed");
    const token = signup.json.data.token;

    const me = await request("GET", "/api/auth/me", null, token);
    assert(me.status === 200 && me.json.data.user.email === "tester@prop.auto", "auth/me failed");

    const signin = await request("POST", "/api/auth/signin", {
      email: "tester@prop.auto",
      password: "secret123"
    });
    assert(signin.status === 200 && signin.json.data.token, "signin failed");

    const badSignin = await request("POST", "/api/auth/signin", {
      email: "tester@prop.auto",
      password: "wrongpass"
    });
    assert(badSignin.status === 401, "signin must reject a bad password");

    const reset = await request("POST", "/api/auth/reset", { email: "tester@prop.auto" });
    assert(reset.status === 200 && reset.json.success, "reset failed");

    const checkout = await request("POST", "/api/checkout", {
      product: "propauto-investor",
      email: "tester@prop.auto"
    });
    assert(checkout.status === 201 && checkout.json.data.session_id, "checkout failed");
    const sessionId = checkout.json.data.session_id;
    assert(typeof checkout.json.data.redirect === "string", "checkout redirect missing");

    const sessionGet = await request("GET", "/api/checkout?session=" + sessionId);
    assert(sessionGet.status === 200 && sessionGet.json.data.id === sessionId, "checkout lookup failed");

    console.log("API OK — health, leads, calls, webhooks, analytics, auth and checkout all pass.");
  } finally {
    child.kill("SIGTERM");
    fs.rmSync(DATA_DIR, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error("API TEST FAILED: " + err.message);
  process.exit(1);
});