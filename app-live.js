/* BijakMatch: Live skill check over LiveKit.
   Classic script; shares one global scope with the other app-*.js files (load order in index.html). */
/* ---------- LIVE SKILL CHECK (LiveKit Cloud) ----------
   After skills are extracted, the worker can join a real-time voice call. The server
   (POST /api/livekit/token) creates a room and dispatches agent/agent.mjs, which asks
   about each skill and reports back over RPC: bijak.skillResult and bijak.finish. */
const LK_SRC = "https://cdn.jsdelivr.net/npm/livekit-client@2.22.3/dist/livekit-client.umd.js";
const LK_SRI = "sha256-f6F+N69emW2KJfFaY33MBiAhW8AbOU5dIJ9yav59wE0=";
const LIVE_VERDICT = {
  confirmed: ["Confirmed in live call", "pill--check"],
  partial: ["Partly shown in live call", "pill--warn"],
  not_confirmed: ["Not confirmed in live call", "pill--muted"]
};
const AGENT_STATE = { initializing: "Joining…", idle: "Ready", listening: "Listening to you", thinking: "Thinking", speaking: "Speaking" };

function freshLive() {
  return { status: "idle", agentState: "", muted: false, results: {}, captions: [], summary: null, overall: null, error: "" };
}

let lkRoom = null;
let lkLoading = null;

function loadLiveKit() {
  if (window.LivekitClient) return Promise.resolve();
  lkLoading = lkLoading || new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = LK_SRC;
    s.integrity = LK_SRI;
    s.crossOrigin = "anonymous";
    s.onload = res;
    s.onerror = () => {
      lkLoading = null;
      rej(new Error("Could not load the LiveKit client. Check your internet connection."));
    };
    document.head.appendChild(s);
  });
  return lkLoading;
}

const LIVE_MAX = 6; // matches MAX_SKILLS in agent/agent.mjs
// Hidden skills (done at work, no certificate) go first: they are what PPT needs evidence for.
function liveSkills() {
  const hidden = new Set(deriveSkillsSummary().hidden);
  return S.interviewTasks.filter(t => t.kept)
    .sort((a, b) => hidden.has(b.n) - hidden.has(a.n))
    .slice(0, LIVE_MAX)
    .map(t => ({ name: t.n, quote: t.quote }));
}
const liveResult = name => S.live.results[name.toLowerCase()];

function patchLive() {
  const el = $("#live-panel");
  if (el) el.innerHTML = liveInner();
  const cap = $("#live-captions");
  if (cap) cap.scrollTop = cap.scrollHeight;
}

async function liveStart() {
  if (lkRoom) return;
  stopMic();
  if (window.speechSynthesis) speechSynthesis.cancel();
  S.live = { ...freshLive(), status: "connecting" };
  rerender();
  try {
    const skills = liveSkills();
    const p = S.ai.profile || {};
    const r = await fetch(apiUrl("/api/livekit/token"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lang: S.ai.lang,
        skills,
        experience: S.experience,
        profile: { name: S.name, age: S.age, job: p.job_title || jobName(), years: S.years, state: S.state, aim: S.aim }
      })
    });
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "The live call server is not running. Start it with: cd server, then npm start.");
    const { url, token } = await r.json();
    await loadLiveKit();

    const { Room, RoomEvent, Track } = LivekitClient;
    const room = new Room({ adaptiveStream: true, dynacast: true });
    lkRoom = room;

    room.registerRpcMethod("bijak.skillResult", async data => {
      const x = JSON.parse(data.payload);
      S.live.results[String(x.skill).toLowerCase()] = { skill: x.skill, verdict: x.verdict, level: x.level, evidence: x.evidence };
      rerender();
      return "ok";
    });
    room.registerRpcMethod("bijak.finish", async data => {
      const x = JSON.parse(data.payload);
      S.live.summary = x.summary;
      S.live.overall = x.overall;
      liveRecord();
      rerender();
      return "ok";
    });
    room.registerTextStreamHandler("lk.transcription", async (reader, info) => {
      const seg = reader.info.attributes?.["lk.segment_id"] || reader.info.id;
      const who = info.identity === room.localParticipant.identity ? "you" : "bijak";
      let text = "";
      for await (const chunk of reader) {
        text += chunk;
        const row = S.live.captions.find(c => c.seg === seg);
        if (row) row.text = text;
        else S.live.captions.push({ seg, who, text });
        S.live.captions = S.live.captions.slice(-40);
        patchLive();
      }
    });
    room.on(RoomEvent.TrackSubscribed, track => {
      if (track.kind === Track.Kind.Audio) {
        const el = track.attach();
        el.dataset.lk = "1";
        document.body.appendChild(el);
      }
    });
    room.on(RoomEvent.TrackUnsubscribed, track => track.detach().forEach(el => el.remove()));
    room.on(RoomEvent.ParticipantAttributesChanged, (changed, participant) => {
      if (changed["lk.agent.state"] && participant !== room.localParticipant) {
        S.live.agentState = changed["lk.agent.state"];
        patchLive();
      }
    });
    room.on(RoomEvent.ParticipantDisconnected, participant => {
      if (participant.isAgent) liveEnd();
    });
    room.on(RoomEvent.Disconnected, () => liveEnd());

    await room.connect(url, token);
    await room.startAudio();
    await room.localParticipant.setMicrophoneEnabled(true);
    S.live.status = "live";
    S.live.agentState = "initializing";
    rerender();
  } catch (e) {
    await liveEnd();
    S.live.status = "error";
    S.live.error = e.name === "NotAllowedError" ? "Microphone is blocked. Allow it in the browser address bar and try again." : e.message;
    rerender();
  }
}

async function liveEnd() {
  const room = lkRoom;
  lkRoom = null;
  if (room) {
    room.removeAllListeners();
    await room.disconnect().catch(() => {});
  }
  $$("audio[data-lk]").forEach(el => el.remove());
  if (S.live.status === "live" || S.live.status === "connecting") {
    S.live.status = Object.keys(S.live.results).length ? "done" : "idle";
    if (S.live.status === "done") liveRecord();
    if (route === "skills") rerender();
    else save();
  }
}

// Stamp the passport once per finished call.
function liveRecord() {
  if (S.live.recorded) return;
  S.live.recorded = true;
  const n = Object.values(S.live.results).filter(r => r.verdict === "confirmed").length;
  S.passportStamps.push({ title: "Live Skill Check", date: "Oct 2026", source: `LiveKit voice call: ${n} skill${n === 1 ? "" : "s"} confirmed` });
  if (!S.proofs.includes("live")) S.proofs.push("live");
  toast("Live skill check saved to your Skills Passport.");
}

async function liveMute() {
  if (!lkRoom) return;
  S.live.muted = !S.live.muted;
  await lkRoom.localParticipant.setMicrophoneEnabled(!S.live.muted);
  patchLive();
}

function liveInner() {
  const L = S.live;
  const skills = liveSkills();
  const results = Object.values(L.results);
  const head = `<div class="row" style="justify-content:space-between">
      <div><b style="font:800 20px/1.3 var(--head)">Live skill check</b>
        <p class="small muted">A short voice call where Bijak asks you to walk through ${skills.length} of your skills, live. Powered by LiveKit Cloud.</p></div>
      ${L.status === "live" ? `<span class="live-dot">${esc(AGENT_STATE[L.agentState] || "Connected")}</span>` : ""}
    </div>`;

  if (L.status === "connecting") return head + '<p class="muted">Connecting to the call…</p>';

  if (L.status === "live") {
    return `${head}
      <div id="live-captions" class="live-captions" aria-live="polite">
        ${L.captions.length ? L.captions.map(c => `<p class="cap ${c.who}"><b>${c.who === "you" ? "You" : "Bijak"}:</b> ${esc(c.text)}</p>`).join("") : '<p class="muted small">Bijak will start speaking in a moment.</p>'}
      </div>
      <div class="row" style="justify-content:space-between">
        <span class="small muted">${results.length} of ${skills.length} skills checked</span>
        <div class="row" style="gap:8px">
          <button class="btn small ghost" data-act="live-mute" aria-pressed="${L.muted}">${L.muted ? "Unmute" : "Mute"}</button>
          <button class="btn small" data-act="live-end">End call</button>
        </div>
      </div>`;
  }

  const summary = L.status === "done" ? `
      ${L.overall ? `<div class="row" style="justify-content:space-between"><span>Overall from the call</span><b>${esc(L.overall)}</b></div>` : ""}
      ${L.summary ? `<p>${esc(L.summary)}</p>` : ""}
      <ul class="reasons">${results.map(r => `<li><b>${esc(r.skill)}</b>: ${esc((LIVE_VERDICT[r.verdict] || [r.verdict])[0].replace(" in live call", ""))}${r.level ? `, level ${r.level}/5` : ""}. <span class="muted">${esc(r.evidence)}</span></li>`).join("")}</ul>` : "";

  return `${head}
    ${L.status === "error" ? `<p class="live-error" role="alert">${esc(L.error)}</p>` : ""}
    ${summary}
    <div class="row">
      <button class="btn" data-act="live-start" ${skills.length ? "" : "disabled"}>${L.status === "done" ? "Start another live call" : "Start live call"}</button>
      <span class="small muted">Uses your microphone. About 5 minutes.</span>
    </div>`;
}

