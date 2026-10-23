// Tests for the RunPod client with a fake fetch: no network and no real key needed.
import test from "node:test";
import assert from "node:assert/strict";
import { runpodConfigured, transcribe } from "../src/server/runpod.mjs";

const env = { RUNPOD_API_KEY: "rpa_test", RUNPOD_ENDPOINT_ID: "ep123" };
const reply = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });
const noSleep = () => Promise.resolve();

test("placeholder or missing keys count as not configured", () => {
  assert.equal(runpodConfigured({}), false);
  assert.equal(runpodConfigured({ RUNPOD_API_KEY: "your-runpod-api-key", RUNPOD_ENDPOINT_ID: "your-endpoint-id" }), false);
  assert.equal(runpodConfigured(env), true);
});

test("not configured gives a 503 that names the missing settings", async () => {
  await assert.rejects(transcribe({ audioBase64: "AAAA" }, { env: {} }), e => e.status === 503 && /RUNPOD_API_KEY/.test(e.message));
});

test("runsync result is returned with the key sent as a bearer token", async () => {
  let seen;
  const fetchImpl = async (url, init) => {
    seen = { url, init };
    return reply({ id: "j1", status: "COMPLETED", output: { text: "Saya periksa panel", language: "ms", duration: 3.2, segments: [] } });
  };
  const out = await transcribe({ audioBase64: "AAAA", format: "webm", language: "ms" }, { env, fetchImpl });
  assert.equal(out.text, "Saya periksa panel");
  assert.equal(out.source, "runpod");
  assert.equal(seen.url, "https://api.runpod.ai/v2/ep123/runsync");
  assert.equal(seen.init.headers.Authorization, "Bearer rpa_test");
  assert.deepEqual(JSON.parse(seen.init.body).input, { audio_base64: "AAAA", format: "webm", language: "ms" });
});

test("a queued job is polled on /status until it completes", async () => {
  const calls = [];
  const answers = [
    reply({ id: "j2", status: "IN_QUEUE" }),
    reply({ id: "j2", status: "IN_PROGRESS" }),
    reply({ id: "j2", status: "COMPLETED", output: { text: "done" } })
  ];
  const fetchImpl = async url => { calls.push(url); return answers.shift(); };
  const out = await transcribe({ audioBase64: "AAAA" }, { env, fetchImpl, sleep: noSleep });
  assert.equal(out.text, "done");
  assert.deepEqual(calls.slice(1), ["https://api.runpod.ai/v2/ep123/status/j2", "https://api.runpod.ai/v2/ep123/status/j2"]);
});

test("errors from the handler, bad keys and network failures become clear 4xx/5xx errors", async () => {
  await assert.rejects(transcribe({ audioBase64: "AAAA" }, { env, fetchImpl: async () => reply({ status: "COMPLETED", output: { error: "audio is larger than 12 MB" } }) }), e => e.status === 502 && /larger/.test(e.message));
  await assert.rejects(transcribe({ audioBase64: "AAAA" }, { env, fetchImpl: async () => reply({}, 401) }), e => /rejected the API key/.test(e.message));
  await assert.rejects(transcribe({ audioBase64: "AAAA" }, { env, fetchImpl: async () => { throw new Error("ECONNRESET"); } }), e => e.status === 502 && /ECONNRESET/.test(e.message));
  await assert.rejects(transcribe({ audioBase64: "" }, { env }), e => e.status === 400);
  await assert.rejects(transcribe({ audioBase64: "A".repeat(11_000_001) }, { env }), e => e.status === 413);
});
