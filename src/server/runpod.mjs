/* RunPod client: sends an audio clip to the GPU speech-to-text endpoint (runpod/handler.py).
   The RunPod key stays on the server, like the Anthropic key. Without RUNPOD_API_KEY and
   RUNPOD_ENDPOINT_ID the route reports "not configured" and the app uses the browser's own speech input. */

const DEFAULT_BASE = "https://api.runpod.ai/v2"; // RUNPOD_API_BASE overrides it, which lets tests point at a local fake
const MAX_AUDIO_BASE64 = 11_000_000; // about 8 MB of audio
const POLL_MS = 1500;
const DEADLINE_MS = 120_000;

export function runpodConfigured(env = process.env) {
  const key = env.RUNPOD_API_KEY, id = env.RUNPOD_ENDPOINT_ID;
  return Boolean(key && id && !key.startsWith("your-") && !id.startsWith("your-"));
}

const fail = (message, status) => Object.assign(new Error(message), { status });

export async function transcribe({ audioBase64, format = "webm", language = null }, { env = process.env, fetchImpl = fetch, sleep = ms => new Promise(r => setTimeout(r, ms)) } = {}) {
  if (!runpodConfigured(env)) {
    throw fail("RunPod is not set up: add RUNPOD_API_KEY and RUNPOD_ENDPOINT_ID to .env or Replit Secrets.", 503);
  }
  if (typeof audioBase64 !== "string" || !audioBase64) throw fail("No audio to transcribe.", 400);
  if (audioBase64.length > MAX_AUDIO_BASE64) throw fail("Audio clip is too large. Keep it under about 8 MB.", 413);
  if (!/^[a-z0-9]{2,5}$/.test(format)) format = "webm";
  if (!["en", "ms", null].includes(language)) language = null;

  const headers = { Authorization: `Bearer ${env.RUNPOD_API_KEY}`, "Content-Type": "application/json" };
  const root = `${(env.RUNPOD_API_BASE || DEFAULT_BASE).replace(/\/$/, "")}/${env.RUNPOD_ENDPOINT_ID}`;
  const started = Date.now();

  let job = await call(fetchImpl, `${root}/runsync`, { method: "POST", headers, body: JSON.stringify({ input: { audio_base64: audioBase64, format, language } }) });
  // runsync answers in about 90 s at most; a cold GPU may still be queued, so keep polling /status.
  while (job.status === "IN_QUEUE" || job.status === "IN_PROGRESS") {
    if (Date.now() - started > DEADLINE_MS) throw fail("The speech service took too long. Try a shorter clip.", 504);
    await sleep(POLL_MS);
    job = await call(fetchImpl, `${root}/status/${job.id}`, { headers });
  }
  if (job.status !== "COMPLETED") throw fail(`The speech service stopped with status ${job.status || "unknown"}.`, 502);
  if (job.output?.error) throw fail(String(job.output.error).slice(0, 200), 502);
  const { text = "", language: detected = null, duration = null, segments = [] } = job.output || {};
  return { text, language: detected, duration, segments, source: "runpod" };
}

async function call(fetchImpl, url, init) {
  let res;
  try {
    res = await fetchImpl(url, { ...init, signal: AbortSignal.timeout(100_000) });
  } catch (err) {
    throw fail(`Could not reach RunPod: ${err.message}`, 502);
  }
  if (res.status === 401 || res.status === 403) throw fail("RunPod rejected the API key.", 502);
  if (!res.ok) throw fail(`RunPod returned HTTP ${res.status}.`, 502);
  return res.json();
}
