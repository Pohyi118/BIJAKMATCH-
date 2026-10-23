/* BijakMatch live skill check — LiveKit Cloud voice agent.
   Joins the room the server created after the shift interview, talks the worker
   through each extracted skill, and sends verdicts to the browser over RPC:
     bijak.skillResult  { skill, verdict, level, evidence }
     bijak.finish       { summary, overall }
   Run: npm run dev   (needs LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, ANTHROPIC_API_KEY) */

import { fileURLToPath } from "node:url";
import { ServerOptions, cli, defineAgent, inference, llm, voice } from "@livekit/agents";
import * as anthropic from "@livekit/agents-plugin-anthropic";
import { z } from "zod";

export const AGENT_NAME = "bijak-skill-check";
// The Anthropic plugin does not pass thinking blocks back between turns, so use a model
// that runs without thinking unless asked (Claude Opus 4.8). Override with BIJAK_VOICE_MODEL.
const MODEL = process.env.BIJAK_VOICE_MODEL || "claude-opus-4-8";
const VOICE = process.env.BIJAK_TTS_VOICE || "a167e0f3-df7e-4d52-a9c3-f949145efdab";
const MAX_SKILLS = 6;

const VERDICTS = ["confirmed", "partial", "not_confirmed"];
const LEVELS = ["Beginner", "Developing", "Experienced", "Expert"];

function instructions(meta, skills) {
  const p = meta.profile || {};
  const who = [
    p.name && `Name: ${p.name}`,
    p.age != null && `Age: ${p.age}`,
    p.job && `Job: ${p.job}`,
    p.years != null && `Years in the job: ${p.years}`,
    p.state && `State: ${p.state}`,
    p.aim && `What they want next: ${p.aim}`,
    meta.experience && `Experience estimate from the written interview: ${meta.experience.level} (${meta.experience.score}/100)`
  ].filter(Boolean).join("\n");
  const list = skills.map((s, i) => `${i + 1}. ${s.name}${s.quote ? ` (they said: "${s.quote}")` : ""}`).join("\n");

  return `You are Bijak, the voice of BijakMatch, a green-career planner for Malaysian TVET workers. This is a short live call to confirm the skills found in the worker's shift interview, so they can be put forward for PPT recognition (Penilaian Pencapaian Terdahulu).

About the worker:
${who || "No profile details were shared."}

Skills to check, in this order:
${list}

How to run the call:
- You are speaking out loud. Use short, warm, everyday sentences. No lists, symbols, emoji or markdown. Say numbers as words a person would say.
- Speak the language the worker uses: English, Bahasa Melayu, or a mix of both.
- For each skill, ask them to walk you through the last time they actually did it. Then ask one follow-up that only someone who really does it could answer well: the order of the steps, what they check, which reading or code they look at, or what they do when it goes wrong.
- After those answers, call record_skill_check with the exact skill name from the list, then move straight to the next skill. Do not announce verdicts or scores.
- confirmed = correct steps in a sensible order with real specifics. partial = right idea but a key step is missing, or the answer stays vague. not_confirmed = they cannot describe it, or someone else does it.
- level is 1 to 5 for how deep their practical knowledge of that skill is.
- Judge what they know, never their accent, grammar or speaking speed. If they are unsure, reassure them; this is a conversation, not an exam.
- If they describe something unsafe, such as working on live equipment, mention the safe practice kindly and record partial at most.
- Keep the whole call under about six minutes. If they want to skip a skill, record it as not_confirmed with evidence "skipped by worker".
- When every skill is recorded, call finish_interview, then say a short goodbye and tell them the results are on their screen.`;
}

export default defineAgent({
  entry: async ctx => {
    let meta = {};
    try {
      meta = JSON.parse(ctx.job.metadata || "{}");
    } catch {
      console.warn("job metadata was not JSON; running without worker context");
    }
    const skills = (meta.skills || []).slice(0, MAX_SKILLS);

    await ctx.connect();
    const worker = await ctx.waitForParticipant();

    const send = (method, data) => ctx.room.localParticipant
      .performRpc({ destinationIdentity: worker.identity, method, payload: JSON.stringify(data) })
      .catch(err => console.warn(`RPC ${method} failed:`, err.message));

    const checked = new Set();
    let finished = false;

    const recordSkillCheck = llm.tool({
      name: "record_skill_check",
      description: "Record the result for one skill after the worker has described doing it. Call once per skill.",
      parameters: z.object({
        skill: z.string().describe("Exact skill name from the list"),
        verdict: z.enum(VERDICTS),
        level: z.number().int().min(1).max(5).describe("1 = only heard of it, 5 = could teach it"),
        evidence: z.string().describe("One sentence on what they said that supports the verdict")
      }),
      execute: async args => {
        checked.add(args.skill.toLowerCase());
        await send("bijak.skillResult", args);
        const left = skills.filter(s => !checked.has(s.name.toLowerCase())).map(s => s.name);
        return left.length ? `Saved. Still to check: ${left.join(", ")}.` : "Saved. All skills are checked; call finish_interview now.";
      }
    });

    const finishInterview = llm.tool({
      name: "finish_interview",
      description: "Call once after every skill has a record_skill_check result.",
      parameters: z.object({
        summary: z.string().describe("Two plain sentences for the worker about what the call showed"),
        overall: z.enum(LEVELS).describe("Overall practical experience level from this call")
      }),
      execute: async args => {
        finished = true;
        await send("bijak.finish", args);
        return "Saved. Now say a short goodbye.";
      }
    });

    const agent = voice.Agent.create({
      instructions: instructions(meta, skills),
      tools: [recordSkillCheck, finishInterview]
    });

    const session = new voice.AgentSession({
      stt: new inference.STT({ model: "deepgram/nova-3", language: "multi" }),
      llm: new anthropic.LLM({ model: MODEL }),
      tts: new inference.TTS({ model: "cartesia/sonic-3.5", voice: VOICE, language: meta.lang === "ms-MY" ? "ms" : "en" }),
      turnHandling: { turnDetection: new inference.TurnDetector() }
    });

    // Leave the room once the goodbye has been spoken.
    session.on(voice.AgentSessionEventTypes.AgentStateChanged, ev => {
      if (finished && ev.oldState === "speaking" && (ev.newState === "listening" || ev.newState === "idle")) {
        ctx.shutdown("skill check finished");
      }
    });

    await session.start({ agent, room: ctx.room });

    session.generateReply({
      instructions: skills.length
        ? `Greet ${meta.profile?.name || "the worker"} by name, say this short call checks ${skills.length} skills from their interview, then ask about the first one: ${skills[0].name}.`
        : "Greet the worker, explain that no skills were found yet, and ask them to describe the main task they do on a normal shift."
    });
  }
});

cli.runApp(new ServerOptions({ agent: fileURLToPath(import.meta.url), agentName: AGENT_NAME }));
