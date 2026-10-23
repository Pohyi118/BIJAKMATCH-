// Tests for the GLM-5.3 client with a fake fetch: no network and no real key needed.
import test from "node:test";
import assert from "node:assert/strict";
import { glmConfigured, glmJson, extractJson, GLM_MODEL } from "../src/server/runpodllm.mjs";

const env = { RUNPOD_API_KEY: "rpa_test" };
const reply = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });
const chat = content => reply({ choices: [{ message: { content } }] });

test("only a real key counts as configured, and RUNPOD_LLM=off disables it", () => {
  assert.equal(glmConfigured({}), false);
  assert.equal(glmConfigured({ RUNPOD_API_KEY: "your-runpod-api-key" }), false);
  assert.equal(glmConfigured(env), true);
  assert.equal(glmConfigured({ ...env, RUNPOD_LLM: "off" }), false);
});

test("extractJson finds the object inside fenced or chatty output", () => {
  assert.deepEqual(extractJson('Sure!\n```json\n{"a": 1}\n```'), { a: 1 });
  assert.throws(() => extractJson("no json here"), /did not return JSON/);
});

test("request uses the key as a bearer token, low reasoning, a token cap and text-only messages", async () => {
  let seen;
  const fetchImpl = async (url, init) => { seen = { url, body: JSON.parse(init.body), auth: init.headers.Authorization }; return chat('{"ok": true}'); };
  const out = await glmJson({
    system: "You are Bijak.",
    messages: [{ role: "user", content: [{ type: "text", text: "hello" }, { type: "image", source: {} }] }],
    schemaJson: '{"type":"object"}'
  }, { env, fetchImpl });
  assert.deepEqual(out, { ok: true });
  assert.equal(seen.url, "https://api.runpod.ai/v2/b1dd8hy2hqo1nb/openai/v1/chat/completions");
  assert.equal(seen.auth, "Bearer rpa_test");
  assert.equal(seen.body.model, GLM_MODEL);
  assert.equal(seen.body.reasoning_effort, "low");
  assert.ok(seen.body.max_tokens <= 2000);
  assert.match(seen.body.messages[0].content, /JSON Schema/);
  assert.equal(seen.body.messages[1].content, "hello\n[image not shown to this model]");
});

test("the endpoint URL can be overridden from the environment", async () => {
  let url;
  await glmJson({ system: "s", messages: [], schemaJson: "{}" }, { env: { ...env, RUNPOD_LLM_BASE_URL: "https://example.test/v1/" }, fetchImpl: async u => { url = u; return chat("{}"); } });
  assert.equal(url, "https://example.test/v1/chat/completions");
});

test("bad key, server errors and empty answers become clear errors", async () => {
  const run = fetchImpl => glmJson({ system: "s", messages: [], schemaJson: "{}" }, { env, fetchImpl });
  await assert.rejects(run(async () => reply({}, 401)), /rejected the API key/);
  await assert.rejects(run(async () => reply({}, 500)), /HTTP 500/);
  await assert.rejects(run(async () => chat("   ")), /empty answer/);
  await assert.rejects(glmJson({ system: "s", messages: [], schemaJson: "{}" }, { env: {} }), e => e.status === 503);
});
