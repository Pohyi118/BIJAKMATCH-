// End-to-end checks of the real Node server: it is started as a child process and every route is called.
// No Anthropic key and no LiveKit settings are given, so this also proves the offline fallbacks work.
// RunPod is aimed at a local fake endpoint, so no key, network or credit is used.
// Run: node --test tests/backend.test.mjs
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 5600 + Math.floor(Math.random() * 300);
const FAKE_PORT = PORT + 1000;
const base = `http://127.0.0.1:${PORT}`;

let server, fake;
const fakeCalls = [];

// A stand-in for RunPod's GLM endpoint: returns one valid, deliberately messy interview turn.
const messyTurn = {
  reply: "Terima kasih Ahmad. Macam mana awak pastikan panel dead?", done: false,
  profile: { name: "Ahmad", age: null, job_key: "not-a-job", job_title: "technician", years: 6, state: "Penang", certificates: [], goal: "whatever", aim: null },
  tasks: [{ card: "Safety isolation", quote: "lock dan tag" }, { card: "Invented card", quote: "x" }],
  experience: { level: "Super", score: 250, reasons: ["gave specifics"] },
  evidence: [{ source: "hologram", at_seconds: null, observation: "o", card: "Invented card", safety: "weird" }]
};

before(async () => {
  fake = http.createServer((req, res) => {
    let b = ""; req.on("data", c => (b += c));
    req.on("end", () => {
      fakeCalls.push({ url: req.url, auth: req.headers.authorization, body: JSON.parse(b || "{}") });
      res.setHeader("content-type", "application/json");
      if (req.url.endsWith("/chat/completions")) return res.end(JSON.stringify({ choices: [{ message: { content: "```json\n" + JSON.stringify(messyTurn) + "\n```" } }] }));
      if (req.url.endsWith("/runsync")) return res.end(JSON.stringify({ id: "job1", status: "COMPLETED", output: { text: "saya periksa mesin", language: "ms", duration: 2, segments: [] } }));
      res.statusCode = 404; res.end("{}");
    });
  }).listen(FAKE_PORT);

  const env = { ...process.env, PORT: String(PORT), RUNPOD_API_KEY: "rpa_fake_key", RUNPOD_ENDPOINT_ID: "fakeep", RUNPOD_API_BASE: `http://127.0.0.1:${FAKE_PORT}/v2`, RUNPOD_LLM_BASE_URL: `http://127.0.0.1:${FAKE_PORT}/v1` };
  for (const k of ["ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "LIVEKIT_URL", "LIVEKIT_API_KEY", "LIVEKIT_API_SECRET", "NODE_TEST_CONTEXT"]) delete env[k];
  server = spawn(process.execPath, [path.join(root, "src/server/server.mjs")], { env, stdio: "ignore" });
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(`${base}/api/health`)).ok) return; } catch {}
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error("server did not start");
});

after(() => { server?.kill(); fake?.close(); });

const post = (route, body, raw) => fetch(base + route, { method: "POST", headers: { "Content-Type": "application/json" }, body: raw ?? JSON.stringify(body) });

test("health reports what is configured and lists every route", async () => {
  const d = await (await fetch(`${base}/api/health`)).json();
  assert.equal(d.status, "ok");
  assert.equal(d.anthropicConfigured, false);
  assert.equal(d.glmConfigured, true);
  assert.equal(d.runpodConfigured, true);
  assert.equal(d.livekitConfigured, false);
  for (const r of ["/api/interview", "/api/market", "/api/cert/verify", "/api/transcribe", "/api/livekit/token"]) assert.ok(d.endpoints.includes(r), r);
});

test("static site is served, with the shared scoring files, and path traversal is refused", async () => {
  for (const f of ["/index.html", "/shared/rules.v1.js", "/shared/scoring.js", "/app-core.js"]) {
    const r = await fetch(base + f);
    assert.equal(r.status, 200, f);
  }
  const bad = await fetch(base + "/..%2f..%2fpackage.json");
  assert.notEqual(bad.status, 200);
  const dot = await fetch(base + "/%2e%2e/%2e%2e/.env");
  assert.notEqual(dot.status, 200);
});

test("interview with no Anthropic key uses GLM on RunPod and snaps every off-list value", async () => {
  fakeCalls.length = 0;
  const r = await post("/api/interview", { history: [{ role: "ai", text: "Hi!" }, { role: "user", text: "Saya Ahmad, juruteknik di Penang." }] });
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.equal(fakeCalls[0].auth, "Bearer rpa_fake_key");
  assert.equal(fakeCalls[0].body.model, "glm-5.3");
  assert.equal(fakeCalls[0].body.reasoning_effort, "low");
  assert.equal(d.profile.job_key, "unknown");
  assert.equal(d.profile.goal, "unknown");
  assert.deepEqual(d.tasks.map(t => t.card), ["Safety isolation"]);
  assert.equal(d.experience.score, 100);
  assert.ok(["Expert", "Experienced", "Developing", "Beginner", "Not enough info"].includes(d.experience.level));
  assert.equal(d.evidence[0].source, "talk");
  assert.equal(d.evidence[0].card, "");
  assert.equal(d.evidence[0].safety, "none");
});

test("interview falls back to the offline interviewer when the model is unreachable or answers badly", async () => {
  const bad = http.createServer((req, res) => { req.resume(); req.on("end", () => { res.setHeader("content-type", "application/json"); res.end(JSON.stringify({ choices: [{ message: { content: "no json at all" } }] })); }); }).listen(FAKE_PORT + 1);
  const env = { ...process.env, PORT: String(PORT + 2), RUNPOD_API_KEY: "rpa_fake_key", RUNPOD_LLM_BASE_URL: `http://127.0.0.1:${FAKE_PORT + 1}/v1` };
  for (const k of ["ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "NODE_TEST_CONTEXT"]) delete env[k];
  const s2 = spawn(process.execPath, [path.join(root, "src/server/server.mjs")], { env, stdio: "ignore" });
  try {
    for (let i = 0; i < 50; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT + 2}/api/health`)).ok) break; } catch {} await new Promise(r => setTimeout(r, 100)); }
    const r = await fetch(`http://127.0.0.1:${PORT + 2}/api/interview`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ history: [] }) });
    assert.equal(r.status, 200);
    const d = await r.json();
    assert.ok(typeof d.reply === "string" && d.reply.length > 10);
    assert.ok(d.profile && Array.isArray(d.tasks) && d.experience);
  } finally { s2.kill(); bad.close(); }
});

test("market report works offline and labels itself as local, not research", async () => {
  const r = await post("/api/market", { state: "Penang", profile: { job: "Production technician" }, paths: [{ path: "evolve", role: "Solar PV technician" }] });
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.match(JSON.stringify(d), /bijakmatch-local|sample|local/i);
  const none = await post("/api/market", { state: "" });
  assert.equal(none.status, 400);
});

test("certificate check recognises SKM levels and falls back safely", async () => {
  const lvl3 = await (await post("/api/cert/verify", { name: "SKM Level 3 electrical" })).json();
  assert.match(lvl3.certName, /Tahap 3/);
  const lvl2 = await (await post("/api/cert/verify", { name: "Sijil SKM Tahap 2" })).json();
  assert.match(lvl2.certName, /Tahap 2/);
  const dosh = await (await post("/api/cert/verify", { name: "DOSH induction" })).json();
  assert.match(dosh.certName, /DOSH/);
  const other = await post("/api/cert/verify", {});
  assert.equal(other.status, 200);
});

test("transcribe goes to RunPod with the key and returns the transcript; bad input is rejected", async () => {
  fakeCalls.length = 0;
  const r = await post("/api/transcribe", { audio_base64: "AAAAAAAA", format: "webm", language: "ms" });
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.equal(d.text, "saya periksa mesin");
  assert.equal(d.source, "runpod");
  assert.equal(fakeCalls[0].auth, "Bearer rpa_fake_key");
  assert.equal((await post("/api/transcribe", {})).status, 400);
  assert.equal((await post("/api/transcribe", { audio_base64: "A".repeat(11_100_000) })).status, 413);
});

test("live call token is refused with a clear message when LiveKit is not set up", async () => {
  const r = await post("/api/livekit/token", { skills: [{ name: "x" }] });
  assert.equal(r.status, 503);
  assert.match((await r.json()).error, /LIVEKIT_URL/);
});

test("wrong methods, unknown routes, bad JSON and oversized bodies fail cleanly and the server keeps running", async () => {
  assert.equal((await fetch(base + "/api/interview")).status, 405);
  assert.equal((await fetch(base + "/api/transcribe")).status, 405);
  assert.equal((await fetch(base + "/api/market")).status, 405);
  assert.equal((await fetch(base + "/api/nope")).status, 404);
  const badJson = await post("/api/interview", null, "{not json");
  assert.ok(badJson.status >= 400 && badJson.status < 600);
  const huge = await post("/api/market", null, JSON.stringify({ state: "Penang", pad: "x".repeat(400_000) }));
  assert.equal(huge.status, 413);
  assert.equal((await fetch(`${base}/api/health`)).status, 200, "server still alive");
});

test("preflight requests are answered for the browser", async () => {
  const r = await fetch(base + "/api/interview", { method: "OPTIONS" });
  assert.equal(r.status, 204);
  assert.equal(r.headers.get("access-control-allow-origin"), "*");
});
