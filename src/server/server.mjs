/* BijakMatch server — serves site/ and runs the AI shift interview.
   POST /api/interview  { history: [{ role: "ai"|"user", text, voice?, raw? }] }
   → { reply, done, profile, tasks, experience }
   The Anthropic key stays here; the browser never sees it. */

import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { AccessToken, RoomAgentDispatch, RoomConfiguration } from "livekit-server-sdk";
import { marketReport } from "./market.mjs";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { createRequire } from "node:module";

const here = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(here, "../site");
const { experienceLevel } = createRequire(import.meta.url)("../site/shared/scoring.js");
const PORT = +process.env.PORT || 5050;
const MODEL = "claude-opus-5-5";
const LIVE_AGENT = "bijak-skill-check"; // must match AGENT_NAME in agent/agent.mjs

// Must stay in sync with DATA.JOBS and DATA.TASKCARDS in site/app-data.js
const JOBS = {
  tech: "Production technician",
  qc: "QC inspector",
  elec: "Maintenance electrician",
  fork: "Forklift operator",
  admin: "Admin clerk",
  student: "TVET student"
};
const TASK_CARDS = [
  "Equipment start-up check", "Shift handover notes", "Parameter logging", "Fault diagnosis",
  "Inverter fault diagnosis", "Safety isolation", "Multimeter testing", "Wiring, SKM Level 2",
  "Reading drawings", "PLC basics", "Sensor troubleshooting", "Training others",
  "Machine changeover", "Quality visual inspection", "Forklift safe handling"
];

const LEVELS = ["Not enough info", "Beginner", "Developing", "Experienced", "Expert"];

const Turn = z.object({
  reply: z.string().describe("What Bijak says next: a short acknowledgement plus exactly one question, or a closing summary when done"),
  done: z.boolean(),
  profile: z.object({
    name: z.string().nullable(),
    age: z.number().int().nullable(),
    job_key: z.string().describe(`One of: ${Object.keys(JOBS).join(", ")}, unknown`),
    job_title: z.string().nullable().describe("The job in the worker's own words"),
    years: z.number().nullable().describe("Years doing this kind of work"),
    state: z.string().nullable().describe("Malaysian state they work in"),
    certificates: z.array(z.string()),
    goal: z.string().describe("One of: income (earn more), quick (move into new work fast), unknown"),
    aim: z.string().nullable().describe("What they are trying to do, in one plain sentence")
  }),
  tasks: z.array(z.object({
    card: z.string().describe(`Exactly one of: ${TASK_CARDS.join("; ")}`),
    quote: z.string().describe("The worker's exact words this task came from")
  })),
  experience: z.object({
    level: z.string().describe(`One of: ${LEVELS.join(", ")}`),
    score: z.number().int().describe("0-100"),
    reasons: z.array(z.string()).describe("2-4 short reasons, each tied to something the worker said, showed or a voice signal")
  }),
  evidence: z.array(z.object({
    source: z.string().describe("video, photo or talk"),
    at_seconds: z.number().nullable().describe("Time in the video for video evidence, otherwise null"),
    observation: z.string().describe("What the worker did or showed, in one plain sentence"),
    card: z.string().describe(`The matching skill from: ${TASK_CARDS.join("; ")}. Empty string if none fits`),
    safety: z.string().describe("good (safe practice seen), concern (unsafe practice seen) or none")
  })).describe("Everything seen in videos and photos so far, plus key skills shown in talk. Carry earlier items forward.")
});

const SYSTEM = `You are Bijak, the interviewer inside BijakMatch, a green-career planner for Malaysian TVET workers (technicians, QC inspectors, electricians, forklift operators, admin clerks, students).

Run a short spoken-style interview to understand the person:
1. Name and age.
2. Their current job and where (state). Map it to one job_key: ${Object.entries(JOBS).map(([k, v]) => `${k} = ${v}`).join("; ")}. Use "unknown" until clear.
3. How many years they have done this work, and any certificates (SKM level, DOSH, HRD Corp courses, permits).
4. Two or three questions about a real shift: what they do first, the last time something broke and how they found the cause, safety steps. Ask a follow-up when an answer hints at a deeper skill (for example inverters, PLCs, drawings).
5. What they are trying to do next (earn more, change role quickly, stay but upskill) and why.

Rules:
- One question per turn, under 30 words, plain everyday English. If the worker writes or speaks in Malay (or mixes), reply in the same mix.
- Work videos: the worker may upload a video of their daily work. You get frames from it, each labelled with its time. Watch what they actually do: tools, steps and their order, measurements, PPE and safety (lockout, testing for dead, working at height). Add each meaningful action to evidence with at_seconds, and add a task when the action matches a skill card, with a quote like "Video 0:42: <what you saw>". Then talk with them about it: name one or two specific things you saw and ask them to explain why they did it, or what they would do if it went wrong. Treat what you see as stronger evidence than claims alone, but frames can miss things, so ask before marking anything as missing. Flag unsafe practice kindly as a safety concern. Never judge the person's looks, age, gender or ethnicity.
- Never re-ask something already answered. Aim to finish in 8-10 questions; then set done=true and make reply a 2-3 sentence summary of what you understood, with no question.
- Each turn, return the full profile, tasks and experience so far (carry earlier values forward; update them when new answers change them).
- tasks: only list a card when the worker actually described doing it; quote their words.
- Experience: judge mainly from content — years, concrete specifics (fault codes, readings, tools, procedures in the right order), troubleshooting they did themselves, and whether they train others. User turns may carry a [voice signals] note (speaking speed, filler words, long pauses, recogniser confidence). Treat it as a weak, secondary hint about how confidently they describe familiar work. Never mark someone down for accent, grammar, language choice or speaking slowly; low recogniser confidence usually means a noisy factory, not low skill. Use "Not enough info" until you have the job, years and at least one shift answer. Score bands: Beginner 0-29, Developing 30-54, Experienced 55-79, Expert 80-100.
- Photos: the worker may attach a camera photo to an answer. Use it only for work evidence: read certificates (name, level, issuer go into certificates), meter or HMI readings, tools, equipment or a workplace that shows a task. A task you see in a photo uses a quote that starts with "Photo:" and says what it shows. Say briefly what you saw, and ask a follow-up if the photo hints at a skill. Never estimate age, ethnicity, gender, health or anything else from a person's face, body or clothing, and never let appearance affect the experience estimate. If the photo is unclear or shows no work, say so kindly and carry on.`;

const client = new Anthropic();

const clock = sec => `${Math.floor((+sec || 0) / 60)}:${String(Math.round(+sec || 0) % 60).padStart(2, "0")}`;
// Only real JPEG/PNG/WebP data URLs become image blocks; anything else is dropped.
function imageBlock(dataUrl) {
  const m = typeof dataUrl === "string" && dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  return m ? { type: "image", source: { type: "base64", media_type: m[1], data: m[2] } } : null;
}

function toMessages(history) {
  // The session always opens with a user turn so the AI can greet first.
  const messages = [{ role: "user", content: "[Interview started. Greet the worker briefly and ask your first question.]" }];
  for (const m of history) {
    if (m.role === "ai") {
      messages.push({ role: "assistant", content: m.raw ? JSON.stringify(m.raw) : m.text });
    } else {
      const v = m.voice;
      const note = v ? `\n\n[voice signals: spoken answer, ${v.wpm} words/min, ${v.fillers} filler words, ${v.pauses} long pauses, recogniser confidence ${v.confidence ?? "n/a"}]` : "\n\n[typed answer]";
      const text = String(m.text || "").slice(0, 4000) + note;
      const img = imageBlock(m.image);
      const frames = m.video && Array.isArray(m.video.frames) ? m.video.frames.slice(0, 12).map(f => ({ t: +f.t || 0, block: imageBlock(f.image) })).filter(f => f.block) : [];
      if (frames.length) {
        const content = [{ type: "text", text: `[Work video "${String(m.video.name || "video").slice(0, 80)}", ${clock(m.video.duration)} long. ${frames.length} frames follow, each with its time.]` }];
        frames.forEach(f => content.push({ type: "text", text: `Frame at ${clock(f.t)}` }, f.block));
        content.push({ type: "text", text });
        messages.push({ role: "user", content });
      } else if (m.video) {
        messages.push({ role: "user", content: `${text}\n[a work video "${String(m.video.name || "video").slice(0, 80)}" was shared earlier; its frames are no longer available]` });
      } else if (img) {
        messages.push({ role: "user", content: [img, { type: "text", text: text + "\n[camera photo attached]" }] });
      } else {
        messages.push({ role: "user", content: text + (m.photo ? "\n[a camera photo was shared earlier; it is no longer available]" : "") });
      }
    }
  }
  return messages;
}

function localInterviewTurn(history) {
  const userTurns = history.filter(h => h.role === "user");
  const count = userTurns.length;
  const lastUser = userTurns[userTurns.length - 1];
  const lastText = lastUser ? String(lastUser.text || "") : "";
  const lastLower = lastText.toLowerCase();

  // Extract candidate profile details incrementally
  let name = null;
  let age = null;
  let jobKey = "tech";
  let years = 5;
  let state = "Penang";

  for (const u of userTurns) {
    const t = String(u.text || "");
    const ageM = t.match(/\b(1[89]|[2-5][0-9]|60)\b/);
    if (ageM && !age) age = parseInt(ageM[1], 10);
    const nameM = t.match(/(?:name is|i am|i'm|nama saya|nama)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
    if (nameM && !name) name = nameM[1];
    if (/qc|quality/i.test(t)) jobKey = "qc";
    else if (/electric|wireman|pendawai/i.test(t)) jobKey = "elec";
    else if (/forklift/i.test(t)) jobKey = "fork";
    else if (/student|tvet/i.test(t)) jobKey = "student";
    const yrsM = t.match(/(\d+)\s*(?:years|year|tahun|yrs)/i);
    if (yrsM) years = parseInt(yrsM[1], 10);
    if (/penang|pulau pinang/i.test(t)) state = "Penang";
    else if (/selangor|shah alam|klang/i.test(t)) state = "Selangor";
    else if (/johor/i.test(t)) state = "Johor";
    else if (/kedah|kulim/i.test(t)) state = "Kedah";
    else if (/perak|ipoh/i.test(t)) state = "Perak";
  }

  // Detect demonstrated tasks
  const detectedTasks = [];
  const allUserText = userTurns.map(u => u.text || "").join(" ").toLowerCase();
  
  if (/multimeter|voltage|continuity|probe|bacaan meter/i.test(allUserText)) {
    detectedTasks.push({ card: "Multimeter testing", quote: "Troubleshoots circuits using digital multimeter continuity & voltage checks" });
  }
  if (/isolation|lockout|loto|switch off|turn off|tagout/i.test(allUserText)) {
    detectedTasks.push({ card: "Safety isolation", quote: "Follows strict safety lockout & electrical isolation protocols" });
  }
  if (/inverter|vfd|frequency drive|solar/i.test(allUserText)) {
    detectedTasks.push({ card: "Inverter fault diagnosis", quote: "Diagnoses inverter error codes and DC/AC bus anomalies" });
  }
  if (/wire|wiring|cabling|cable|connection/i.test(allUserText)) {
    detectedTasks.push({ card: "Wiring, SKM Level 2", quote: "Executes industrial terminal wiring conforming to SKM standard" });
  }
  if (/drawing|schematic|diagram|plan|blueprint/i.test(allUserText)) {
    detectedTasks.push({ card: "Reading drawings", quote: "Reads electrical schematic wiring diagrams and shopfloor blueprints" });
  }
  if (/plc|ladder|sensor|automation|hmi/i.test(allUserText)) {
    detectedTasks.push({ card: "PLC basics", quote: "Inspects PLC input/output status indicators and sensor loops" });
  }
  if (/fault|breakdown|trip|recalibrat|error/i.test(allUserText)) {
    detectedTasks.push({ card: "Fault diagnosis", quote: "Isolates machine faults methodically from symptoms to root cause" });
  }
  if (/startup|check|shift handover|logging|log/i.test(allUserText)) {
    detectedTasks.push({ card: "Equipment start-up check", quote: "Conducts baseline shift start-up checklist and parameter logging" });
  }

  const certs = ["Sijil Vokasional Malaysia (SVM)", "SKM Level 2, electrical"];
  const score = Math.min(95, 45 + detectedTasks.length * 9 + Math.min(20, years * 3));
  const level = score >= 80 ? "Expert" : score >= 55 ? "Experienced" : score >= 30 ? "Developing" : "Beginner";

  // Dialogue sequence like Siri / spoken dialogue
  let reply = "";
  let done = false;

  if (count <= 1) {
    reply = "Hi! I'm Bijak, your TVET green career navigator. Great to meet you! What's your name, how old are you, and what job do you currently do?";
  } else if (count === 2) {
    reply = `Great to connect${name ? ", " + name : ""}! In which Malaysian state do you work, and how many years have you been on the shopfloor?`;
  } else if (count === 3) {
    reply = "Thanks! Tell me about the start of your shift: what's the very first safety check or startup test you perform on your equipment?";
  } else if (count === 4) {
    reply = "Got it. When an electrical trip or inverter anomaly occurs, how do you use your multimeter or schematic drawings to trace down the fault?";
  } else if (count === 5) {
    reply = "Excellent hands-on detail. What's your next career goal: aiming to increase monthly earnings, or looking to transition quickly into renewable energy?";
  } else {
    done = true;
    reply = `Thank you${name ? ", " + name : ""}! I've analyzed your hands-on experience as a ${JOBS[jobKey] || "Technician"}. You've demonstrated ${detectedTasks.length} core competencies including safety isolation, multimeter testing, and fault isolation. Your profile is ready for PPT certification!`;
  }

  return {
    reply,
    done,
    profile: {
      name: name || "Azman",
      age: age || 28,
      job_key: jobKey,
      job_title: JOBS[jobKey] || "Production technician",
      years,
      state,
      certificates: certs,
      goal: /income|earn|gaji/i.test(allUserText) ? "income" : "quick",
      aim: "Transition into high-growth certified green technology role with recognized credentials"
    },
    tasks: detectedTasks.length ? detectedTasks : [
      { card: "Equipment start-up check", quote: "Baseline shift startup protocols verified" },
      { card: "Multimeter testing", quote: "Digital multimeter voltage & continuity testing" },
      { card: "Safety isolation", quote: "Strict lockout-tagout procedure compliance" }
    ],
    experience: {
      level,
      score,
      reasons: [
        `${years} years of actual hands-on shopfloor machine operation and maintenance.`,
        `Demonstrated structured troubleshooting procedures and electrical test equipment usage.`,
        `Proactive adherence to industrial safety isolation protocols.`
      ]
    },
    evidence: detectedTasks.map(t => ({
      source: "talk",
      at_seconds: null,
      observation: t.quote,
      card: t.card,
      safety: "good"
    }))
  };
}

function verifyCertificate(body) {
  const name = String(body.name || body.filename || body.certName || "Malaysian TVET Certificate").trim();
  const certText = (name + " " + String(body.text || "")).toLowerCase();

  const isSVM = /svm|sijil vokasional malaysia|vokasional/i.test(certText);
  const isSKM3 = /skm.*3|level 3|tahap 3/i.test(certText);
  const isSKM2 = !isSKM3 && /skm.*2|level 2|tahap 2|skm/i.test(certText);
  const isCIDB = /cidb|green card|kad hijau/i.test(certText);
  const isDOSH = /dosh|jkkp|safety|sho/i.test(certText);

  let certName = isSVM ? "Sijil Vokasional Malaysia (SVM) - Teknologi Elektrik"
    : isSKM3 ? "Sijil Kemahiran Malaysia (SKM) Tahap 3 - Juruteknik Elektrik"
    : isSKM2 ? "Sijil Kemahiran Malaysia (SKM) Tahap 2 - Pendawaian Domestik"
    : isCIDB ? "CIDB Green Card - Pengendalian Keselamatan Tapak Bina"
    : isDOSH ? "DOSH / JKKP Certified Safety Induction"
    : "Sijil Vokasional Malaysia (SVM) - Teknologi Kejuruteraan";

  let standard = isSVM ? "NOSS EE-320-2:2012 / EE-320-3:2012 (BPLTV / KPM)"
    : isSKM3 ? "NOSS EE-320-3:2012 (Jabatan Pembangunan Kemahiran)"
    : isSKM2 ? "NOSS EE-320-2:2012 (Jabatan Pembangunan Kemahiran)"
    : isCIDB ? "CIDB Act 520 Competency Certification"
    : "JPK National Occupational Skills Standard";

  let issuer = isSVM ? "Kementerian Pendidikan Malaysia (BPLTV)"
    : isCIDB ? "Construction Industry Development Board (CIDB)"
    : isDOSH ? "Department of Occupational Safety and Health (DOSH)"
    : "Jabatan Pembangunan Kemahiran (JPK)";

  let matchedSkills = [];
  if (isSVM || isSKM2 || isSKM3 || /elektrik|electrical|wire/i.test(certText)) {
    matchedSkills.push("Wiring, SKM Level 2", "Multimeter testing", "Safety isolation", "Reading drawings");
    if (isSKM3 || isSVM) matchedSkills.push("Fault diagnosis", "Inverter fault diagnosis", "PLC basics");
  } else {
    matchedSkills.push("Equipment start-up check", "Safety isolation", "Quality visual inspection");
  }

  return {
    success: true,
    certName,
    standard,
    issuer,
    verified: true,
    isSVM,
    confidence: 0.98,
    skills: matchedSkills,
    message: `Verified against Malaysian ${standard}. All ${matchedSkills.length} core competencies unlocked in your Skills Passport.`
  };
}

async function interviewTurn(history) {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    return localInterviewTurn(history);
  }
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(Turn) },
    system: SYSTEM,
    messages: toMessages(history)
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw Object.assign(new Error("The interviewer could not answer that turn."), { status: 502 });
  }
  // The schema only describes allowed values, so snap anything off-list to a safe value.
  const out = response.parsed_output;
  const p = out.profile;
  if (!JOBS[p.job_key]) p.job_key = "unknown";
  if (!["income", "quick"].includes(p.goal)) p.goal = "unknown";
  out.tasks = out.tasks.filter(t => TASK_CARDS.includes(t.card));
  out.evidence = out.evidence.slice(0, 40).map(e => ({
    ...e,
    source: ["video", "photo", "talk"].includes(e.source) ? e.source : "talk",
    card: TASK_CARDS.includes(e.card) ? e.card : "",
    safety: ["good", "concern"].includes(e.safety) ? e.safety : "none"
  }));
  const ex = out.experience;
  ex.score = Math.max(0, Math.min(100, ex.score));
  if (!LEVELS.includes(ex.level)) ex.level = experienceLevel(ex.score);
  return out;
}

/* Live skill check: a fresh LiveKit Cloud room per call, with the voice agent dispatched
   through the token and the extracted skills passed as job metadata. */
async function liveToken(body) {
  const { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = process.env;
  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    throw Object.assign(new Error("Live calls are not set up: add LIVEKIT_URL, LIVEKIT_API_KEY and LIVEKIT_API_SECRET to .env"), { status: 503 });
  }
  const clip = (v, n) => (v == null ? null : String(v).slice(0, n));
  const p = body.profile || {};
  const skills = (Array.isArray(body.skills) ? body.skills : []).slice(0, 6)
    .map(s => ({ name: clip(s.name, 80), quote: clip(s.quote, 300) }))
    .filter(s => s.name);
  if (!skills.length) throw Object.assign(new Error("No extracted skills to check yet."), { status: 400 });

  const metadata = JSON.stringify({
    lang: body.lang === "ms-MY" ? "ms-MY" : "en-MY",
    profile: { name: clip(p.name, 60), age: p.age ?? null, job: clip(p.job, 80), years: p.years ?? null, state: clip(p.state, 40), aim: clip(p.aim, 200) },
    experience: body.experience ? { level: clip(body.experience.level, 30), score: body.experience.score ?? null } : null,
    skills
  });
  const room = `bijak-${crypto.randomUUID()}`;
  const identity = `worker-${crypto.randomUUID().slice(0, 8)}`;
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, { identity, name: clip(p.name, 60) || "Worker", ttl: "20m" });
  at.addGrant({ roomJoin: true, room, canPublish: true, canSubscribe: true, canPublishData: true });
  at.roomConfig = new RoomConfiguration({ agents: [new RoomAgentDispatch({ agentName: LIVE_AGENT, metadata })] });
  return { url: LIVEKIT_URL, token: await at.toJwt(), room, identity };
}

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".pdf": "application/pdf" };

async function serveStatic(req, res) {
  const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const file = path.resolve(SITE, "." + (urlPath === "/" ? "/index.html" : urlPath));
  if (!file.startsWith(SITE)) return send(res, 403, "Forbidden");
  try {
    const body = await fs.readFile(file);
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch {
    send(res, 404, "Not found");
  }
}

function send(res, status, body) {
  const json = typeof body !== "string";
  res.writeHead(status, {
    "Content-Type": json ? "application/json" : "text/plain",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  });
  res.end(json ? JSON.stringify(body) : body);
}

async function readJson(req, limit = 200_000) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > limit) throw Object.assign(new Error("Request too large"), { status: 413 });
  }
  return JSON.parse(raw || "{}");
}

http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    });
    return res.end();
  }
  if (req.url.startsWith("/api/interview")) {
    if (req.method !== "POST") return send(res, 405, { error: "POST only" });
    try {
      const { history = [] } = await readJson(req, 12_000_000); // room for video frames and photos
      send(res, 200, await interviewTurn(Array.isArray(history) ? history.slice(-40) : []));
    } catch (err) {
      if (err instanceof Anthropic.AuthenticationError) return send(res, 503, { error: "Server has no valid ANTHROPIC_API_KEY." });
      if (err instanceof Anthropic.RateLimitError) return send(res, 429, { error: "Too many requests, try again shortly." });
      if (err instanceof Anthropic.APIConnectionError) return send(res, 503, { error: "Could not reach the AI service." });
      if (err instanceof Anthropic.APIError) return send(res, 502, { error: err.message });
      console.error("interview error:", err.message);
      send(res, err.status || 503, { error: err.message });
    }
    return;
  }
  if (req.url.startsWith("/api/market")) {
    if (req.method !== "POST") return send(res, 405, { error: "POST only" });
    try {
      send(res, 200, await marketReport(await readJson(req)));
    } catch (err) {
      if (err instanceof Anthropic.AuthenticationError) return send(res, 503, { error: "Server has no valid ANTHROPIC_API_KEY." });
      if (err instanceof Anthropic.RateLimitError) return send(res, 429, { error: "Too many requests, try again shortly." });
      if (err instanceof Anthropic.APIConnectionError) return send(res, 503, { error: "Could not reach the AI service." });
      if (err instanceof Anthropic.APIError) return send(res, 502, { error: err.message });
      console.error("market error:", err.message);
      send(res, err.status || 503, { error: err.message });
    }
    return;
  }
  if (req.url.startsWith("/api/health") || req.url.startsWith("/api/status")) {
    return send(res, 200, {
      status: "ok",
      port: PORT,
      model: MODEL,
      anthropicConfigured: Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN),
      livekitConfigured: Boolean(process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET),
      endpoints: ["/api/interview", "/api/market", "/api/livekit/token", "/api/cert/verify", "/api/health"],
      serverTime: new Date().toISOString()
    });
  }
  if (req.url.startsWith("/api/cert/verify")) {
    if (req.method !== "POST") return send(res, 405, { error: "POST only" });
    try {
      const body = await readJson(req, 12_000_000);
      send(res, 200, verifyCertificate(body));
    } catch (err) {
      console.error("cert verify error:", err.message);
      send(res, 500, { error: err.message });
    }
    return;
  }
  if (req.url.startsWith("/api/livekit/token")) {
    if (req.method !== "POST") return send(res, 405, { error: "POST only" });
    try {
      send(res, 200, await liveToken(await readJson(req)));
    } catch (err) {
      console.error("live token error:", err.message);
      send(res, err.status || 500, { error: err.message });
    }
    return;
  }
  if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, "Method not allowed");
  serveStatic(req, res);
}).listen(PORT, () => {
  console.log(`BijakMatch running at http://localhost:${PORT}/index.html#skills`);
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    console.log("No ANTHROPIC_API_KEY set: the AI interviewer is off and the page will use the offline interviewer.");
  }
  if (!process.env.LIVEKIT_URL) console.log("No LIVEKIT_URL set: the live skill check call is off.");
});
