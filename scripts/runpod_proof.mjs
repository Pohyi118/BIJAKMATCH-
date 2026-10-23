// Calls RunPod for real and saves the result as proof of use.
//   node --env-file=.env scripts/runpod_proof.mjs
// Checks: (1) GLM-5.3 public endpoint answers, (2) your Serverless endpoint is reachable, (3) the Whisper
// handler answers a ping. It writes docs/runpod-proof/proof-<UTC time>.md and .json, but only if at least one
// check passed, so the folder never holds a made-up run. The API key is never written to disk.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const key = process.env.RUNPOD_API_KEY;
const endpointId = process.env.RUNPOD_ENDPOINT_ID;
const llmBase = (process.env.RUNPOD_LLM_BASE_URL || "https://api.runpod.ai/v2/b1dd8hy2hqo1nb/openai/v1").replace(/\/$/, "");

if (!key || key.startsWith("your-")) {
  console.error("Set RUNPOD_API_KEY in .env first (RunPod console > Settings > API Keys).");
  process.exit(2);
}
const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
const checks = [];

async function run(name, fn) {
  const t0 = Date.now();
  try {
    const detail = await fn();
    checks.push({ name, ok: true, ms: Date.now() - t0, ...detail });
  } catch (err) {
    checks.push({ name, ok: false, ms: Date.now() - t0, error: err.message });
  }
}

async function call(url, init = {}) {
  const res = await fetch(url, { ...init, headers, signal: AbortSignal.timeout(120_000) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${body.detail || body.error || body.title || "request failed"}`);
  return body;
}

await run("GLM-5.3 chat completion (RunPod public endpoint)", async () => {
  const d = await call(`${llmBase}/chat/completions`, {
    method: "POST",
    body: JSON.stringify({
      model: "glm-5.3", max_tokens: 200, reasoning_effort: "low",
      messages: [{ role: "user", content: "In one sentence, what does a QC inspector in a Malaysian factory do?" }]
    })
  });
  return { model: d.model, request_id: d.id, usage: d.usage, answer_preview: String(d.choices?.[0]?.message?.content || "").slice(0, 160) };
});

if (endpointId && !endpointId.startsWith("your-")) {
  await run("Serverless endpoint health", async () => {
    const d = await call(`https://api.runpod.ai/v2/${endpointId}/health`);
    return { endpoint_id: endpointId, workers: d.workers, jobs: d.jobs };
  });
  await run("Whisper handler ping (runsync)", async () => {
    const d = await call(`https://api.runpod.ai/v2/${endpointId}/runsync`, { method: "POST", body: JSON.stringify({ input: { ping: true } }) });
    if (d.status !== "COMPLETED") throw new Error(`job status ${d.status}`);
    return { endpoint_id: endpointId, job_id: d.id, status: d.status, output: d.output, delay_ms: d.delayTime, execution_ms: d.executionTime };
  });
} else {
  checks.push({ name: "Serverless endpoint checks", ok: false, skipped: true, error: "RUNPOD_ENDPOINT_ID is not set" });
}

for (const c of checks) console.log(`${c.ok ? "PASS" : "FAIL"}  ${c.name}  ${c.error || ""}`);

if (!checks.some(c => c.ok)) {
  console.error("\nNothing passed, so no proof file was written.");
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19) + "Z";
const dir = path.join(root, "docs/runpod-proof");
fs.mkdirSync(dir, { recursive: true });
const record = { generated_at_utc: new Date().toISOString(), script: "scripts/runpod_proof.mjs", checks };
fs.writeFileSync(path.join(dir, `proof-${stamp}.json`), JSON.stringify(record, null, 2));
const md = [
  `# RunPod proof of use, ${record.generated_at_utc}`,
  "",
  "Produced by `scripts/runpod_proof.mjs` with a live RunPod API key (not stored). Failed checks are listed too.",
  "",
  "| Check | Result | Time | Detail |",
  "| --- | --- | --- | --- |",
  ...checks.map(c => `| ${c.name} | ${c.ok ? "PASS" : "FAIL"} | ${c.ms ?? "-"} ms | ${c.ok ? "request/job id `" + (c.request_id || c.job_id || c.endpoint_id || "-") + "`" + (c.usage ? `, tokens ${JSON.stringify(c.usage)}` : "") : c.error} |`),
  ""
].join("\n");
fs.writeFileSync(path.join(dir, `proof-${stamp}.md`), md);
console.log(`\nSaved docs/runpod-proof/proof-${stamp}.md and .json. Commit them, and add console screenshots next to them.`);
