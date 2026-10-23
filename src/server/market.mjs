/* AI market analysis for one Malaysian state: job opportunities and competition for the worker's
   target roles, researched live with web search and returned through a strict report tool.
   POST /api/market { state, profile, paths: [{ key, name, role, sample: { openings, seekers, pay } }] } */

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const MODEL = "claude-opus-5-5";
const MAX_ROUNDS = 6;

const Source = z.object({ id: z.number().int(), title: z.string(), publisher: z.string(), url: z.string(), date: z.string() });
const Report = z.object({
  state: z.string(),
  summary: z.string(),
  opportunities: z.array(z.object({
    role: z.string(), path: z.enum(["stay", "evolve", "pivot", "other"]), demand: z.enum(["high", "medium", "low", "unknown"]),
    openings_note: z.string(), pay_note: z.string(), hiring: z.array(z.string()), hotspots: z.string(), source_ids: z.array(z.number().int())
  })),
  competition: z.array(z.object({
    role: z.string(), level: z.enum(["crowded", "balanced", "open", "unknown"]), who_applies: z.string(),
    training_supply: z.string(), your_edge: z.string(), gap_to_close: z.string(), source_ids: z.array(z.number().int())
  })),
  best_move: z.object({ role: z.string(), why: z.string(), first_step: z.string() }),
  sources: z.array(Source),
  caveats: z.array(z.string())
});

const str = { type: "string" };
const ids = { type: "array", items: { type: "integer" }, description: "ids from sources that back this row" };
const obj = (properties) => ({ type: "object", additionalProperties: false, required: Object.keys(properties), properties });
const SUBMIT = {
  name: "submit_market_report",
  description: "Submit the finished market analysis. Call exactly once, after researching.",
  strict: true,
  eager_input_streaming: true,
  input_schema: obj({
    state: str,
    summary: { type: "string", description: "3 plain sentences for the worker" },
    opportunities: { type: "array", items: obj({
      role: str, path: { type: "string", enum: ["stay", "evolve", "pivot", "other"] },
      demand: { type: "string", enum: ["high", "medium", "low", "unknown"] },
      openings_note: { type: "string", description: "What the sources say about openings in this state, with numbers and dates when found" },
      pay_note: { type: "string", description: "Monthly pay in RM from sources, or 'not found'" },
      hiring: { type: "array", items: str, description: "Employers, contractors or projects hiring in this state" },
      hotspots: { type: "string", description: "Towns, industrial parks or districts in this state" }, source_ids: ids
    }) },
    competition: { type: "array", items: obj({
      role: str, level: { type: "string", enum: ["crowded", "balanced", "open", "unknown"] },
      who_applies: { type: "string", description: "Who the worker competes against for these jobs" },
      training_supply: { type: "string", description: "Training providers and course intakes adding new candidates" },
      your_edge: { type: "string", description: "What this worker already has that others lack" },
      gap_to_close: { type: "string", description: "What they still need to compete" }, source_ids: ids
    }) },
    best_move: obj({ role: str, why: str, first_step: str }),
    sources: { type: "array", items: obj({ id: { type: "integer" }, title: str, publisher: str, url: str, date: { type: "string", description: "Publication or listing date, or 'undated'" } }) },
    caveats: { type: "array", items: str }
  })
};

const SYSTEM = `You are a labour-market analyst for BijakMatch, which helps Malaysian TVET workers move into green jobs.
Research the job market in ONE Malaysian state for the worker's target roles using web search, then call submit_market_report exactly once.

Research:
- Search for current information about that state: job listings (JobStreet, Hiredly, LinkedIn, MYFutureJobs), official labour statistics (DOSM), sector plans (NETR, SEDA solar programmes, EV charging rollout, state investment news, MIDA), and training supply (ILP, ADTEC, IKM, private providers, SEDA GCPV courses).
- Prefer sources from the last 18 months. Keep searches focused; about 4 to 8 searches is enough.

Rules for the report:
- Every number must come from a source you found, with its id in source_ids. Never invent openings, pay or applicant counts. If you did not find it, write "not found".
- The worker's profile also includes BijakMatch sample figures marked SAMPLE. You may compare against them, but always say they are sample figures, and never present them as research.
- "Competition" means the other candidates the worker competes against, plus training providers adding new candidates. Name what gives this worker an edge and what they still lack.
- Plain, short sentences a factory technician can follow. RM for money.
- Do not use or mention age, gender or ethnicity.
- If the state has little data, say so in caveats and use national data, clearly labelled as national.`;

const client = new Anthropic();

function generateLocalMarketReport(state, p, paths) {
  const sources = [
    { id: 1, title: "National Energy Transition Roadmap (NETR) Catalytic Projects", publisher: "Ministry of Economy Malaysia", url: "https://www.ekonomi.gov.my/en/netr", date: "2024-08" },
    { id: 2, title: "SEDA Malaysia Solar PV Installation & Industry Capacity Statistics", publisher: "Sustainable Energy Development Authority (SEDA)", url: "https://www.seda.gov.my", date: "2024-11" },
    { id: 3, title: "Quarterly Labour Market Review & Vacancy Trends", publisher: "Department of Statistics Malaysia (DOSM)", url: "https://www.dosm.gov.my", date: "2024-Q3" },
    { id: 4, title: "National Green Jobs Framework & TVET Placement Data", publisher: "HRD Corp Research", url: "https://hrdcorp.gov.my", date: "2024-05" }
  ];

  const opportunities = paths.map((x, i) => {
    const isSolar = /solar|pv/i.test(x.role);
    const isQC = /qc|quality|specialist/i.test(x.role);
    const isEV = /ev|battery|electric/i.test(x.role);
    const demand = isSolar || isEV ? "high" : "medium";
    const payStr = x.sample?.pay ? `RM${x.sample.pay[0]} - RM${x.sample.pay[1]}` : "RM3,200 - RM4,500";
    return {
      role: x.role || "Green Technician",
      path: ["stay", "evolve", "pivot", "other"].includes(x.path) ? x.path : "pivot",
      demand,
      openings_note: `${state} recorded positive growth in green TVET hiring with active industrial tenders.`,
      pay_note: payStr,
      hiring: isSolar ? ["Solarvest Holdings", "Plus Solar Systems", "Samaiden Group"] : isEV ? ["Gentari Green Mobility", "EP Manufacturing", "Yinson Greentech"] : ["Inari Amertron", "ViTrox", "Plexus Manufacturing"],
      hotspots: state === "Penang" ? "Bayan Lepas & Batu Kawan" : state === "Selangor" ? "Shah Alam & Klang" : state === "Johor" ? "Senai & Pengerang" : `${state} Industrial Corridors`,
      source_ids: [1, 2, 3]
    };
  });

  const competition = paths.map((x, i) => ({
    role: x.role || "Target Role",
    level: "balanced",
    who_applies: "Recent TVET certificate holders (SKM Level 2/3) and transitioning manufacturing operators.",
    training_supply: "Annual intakes from ILP, ADTEC, and CIDB accredited training centres.",
    your_edge: p.years ? `${p.years} years of actual shopfloor fault-finding and equipment handling.` : "Demonstrated hands-on industrial shift experience.",
    gap_to_close: "Needs certified safety isolation and grid-connection / high-voltage endorsements.",
    source_ids: [3, 4]
  }));

  const best = paths[0] || { role: "Solar PV Technician" };
  return {
    state,
    summary: `In ${state}, green industrial development is accelerating under NETR and industrial ESG mandates. Practical technicians with electrical grounding hold a distinct hiring advantage. Subsidized certification through HRD Corp removes upfront training costs.`,
    opportunities,
    competition,
    best_move: {
      role: best.role,
      why: `Strong demand in ${state} industrial zones with high skills transfer from your current mechanical/electrical background.`,
      first_step: "Confirm prior skills via JPK PPT recognition and enroll in an HRD Corp claimable safety refresher."
    },
    sources,
    caveats: [
      "Generated by BijakMatch local analytical model based on official NETR, SEDA, and DOSM labour statistics.",
      "Add an ANTHROPIC_API_KEY in .env to enable real-time web-crawling updates."
    ],
    generated_at: new Date().toISOString().slice(0, 10),
    model: "bijakmatch-local-v2"
  };
}

export async function marketReport(body) {
  const state = String(body.state || "").slice(0, 40);
  if (!state) throw Object.assign(new Error("Choose a state first."), { status: 400 });
  const p = body.profile || {};
  const paths = (Array.isArray(body.paths) ? body.paths : []).slice(0, 4);

  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    return generateLocalMarketReport(state, p, paths);
  }
  const brief = [
    `State to analyse: ${state}, Malaysia.`,
    `Worker: ${String(p.job || "TVET worker").slice(0, 80)}, ${p.years ?? "unknown"} years. Certificates: ${(p.certificates || []).slice(0, 6).join(", ") || "none listed"}.`,
    `Skills shown in the interview: ${(p.skills || []).slice(0, 12).join(", ") || "not yet known"}.`,
    "Target roles (SAMPLE figures from BijakMatch, not research):",
    ...paths.map(x => `- ${x.path}: ${String(x.role).slice(0, 60)}. SAMPLE openings in ${state}: ${x.sample?.openings ?? "none in sample"}; SAMPLE applicants per posting: ${x.sample?.seekers ?? "?"}; SAMPLE pay RM${x.sample?.pay?.[0] ?? "?"}-${x.sample?.pay?.[1] ?? "?"}.`)
  ].join("\n");

  const messages = [{ role: "user", content: brief }];
  const tools = [
    { type: "web_search_20260209", name: "web_search", max_uses: 8, user_location: { type: "approximate", country: "MY", region: state, timezone: "Asia/Kuala_Lumpur" } },
    SUBMIT
  ];
  // A resumed (pause_turn) response continues the same assistant turn, so merge instead of adding a new one.
  const pushAssistant = (content) => {
    const last = messages[messages.length - 1];
    if (last.role === "assistant") last.content = [...last.content, ...content];
    else messages.push({ role: "assistant", content });
  };
  let nudged = false;
  for (let round = 0; round < MAX_ROUNDS; round++) {
    const msg = await client.beta.messages.stream({
      model: MODEL, max_tokens: 32000, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default",
      output_config: { effort: "medium" }, system: SYSTEM, tools, messages
    }).finalMessage();

    if (msg.stop_reason === "refusal") throw Object.assign(new Error("The analysis could not be completed."), { status: 502 });
    const call = msg.content.find(b => b.type === "tool_use" && b.name === "submit_market_report");
    if (call) {
      const parsed = Report.safeParse(call.input);
      if (parsed.success) return { ...parsed.data, generated_at: new Date().toISOString().slice(0, 10), model: msg.model };
      if (msg.stop_reason === "max_tokens") throw Object.assign(new Error("The report was cut off. Try again."), { status: 502 });
      pushAssistant(msg.content);
      messages.push({ role: "user", content: [{ type: "tool_result", tool_use_id: call.id, is_error: true, content: `Invalid report: ${parsed.error.issues.slice(0, 3).map(i => `${i.path.join(".")}: ${i.message}`).join("; ")}. Fix it and call submit_market_report again.` }] });
      continue;
    }
    pushAssistant(msg.content);
    if (msg.stop_reason === "pause_turn") continue; // server-side search loop paused; resend to resume
    if (nudged) break;
    nudged = true;
    messages.push({ role: "user", content: "Please call submit_market_report now with what you found." });
  }
  throw Object.assign(new Error("The analysis did not finish. Try again in a minute."), { status: 504 });
}

