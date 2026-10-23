/* Optional second brain for the shift interview: GLM-5.3 on a RunPod public endpoint.
   The endpoint speaks the OpenAI chat-completions format, so this is one fetch call (no extra package).
   Used only when no Anthropic key is set; the key and the endpoint URL come from the environment,
   never from the code. Text only: photos and video frames are not sent to this model. */

export const GLM_MODEL = "glm-5.3";
const DEFAULT_BASE = "https://api.runpod.ai/v2/b1dd8hy2hqo1nb/openai/v1";
const MAX_TOKENS = 2000; // keeps each turn cheap; reasoning stays on "low"

export function glmConfigured(env = process.env) {
  const key = env.RUNPOD_API_KEY;
  return Boolean(key && !key.startsWith("your-") && env.RUNPOD_LLM !== "off");
}

// Anthropic-style content (text and image blocks) down to plain text for a text-only model.
function flatten(content) {
  if (typeof content === "string") return content;
  return content.map(b => (b.type === "text" ? b.text : "[image not shown to this model]")).join("\n");
}

export function extractJson(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("The model did not return JSON.");
  return JSON.parse(text.slice(start, end + 1));
}

/* Returns the parsed JSON object the model produced. `schemaJson` is a JSON Schema string that is
   shown to the model, so the caller still has to validate the result. */
export async function glmJson({ system, messages, schemaJson }, { env = process.env, fetchImpl = fetch } = {}) {
  if (!glmConfigured(env)) throw Object.assign(new Error("RunPod GLM is not set up: add RUNPOD_API_KEY."), { status: 503 });
  const base = (env.RUNPOD_LLM_BASE_URL || DEFAULT_BASE).replace(/\/$/, "");
  const res = await fetchImpl(`${base}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RUNPOD_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: GLM_MODEL,
      max_tokens: MAX_TOKENS,
      reasoning_effort: "low",
      messages: [
        { role: "system", content: `${system}\n\nReply with ONE JSON object and nothing else. It must match this JSON Schema:\n${schemaJson}` },
        ...messages.map(m => ({ role: m.role, content: flatten(m.content) }))
      ]
    }),
    signal: AbortSignal.timeout(90_000)
  });
  if (res.status === 401 || res.status === 403) throw Object.assign(new Error("RunPod rejected the API key."), { status: 502 });
  if (!res.ok) throw Object.assign(new Error(`RunPod GLM returned HTTP ${res.status}.`), { status: 502 });
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) throw Object.assign(new Error("RunPod GLM returned an empty answer."), { status: 502 });
  return extractJson(text);
}
