/* BijakMatch: AI shift interview (typed/voice/camera/video/market).
   Classic script; shares one global scope with the other app-*.js files (load order in index.html). */
/* ---------- AI SHIFT INTERVIEW ----------
   Bijak asks one question at a time. With server/server.mjs running, answers go to
   /api/interview (Claude). Without it, a scripted interviewer runs in the browser.
   Spoken answers carry voice signals (pace, fillers, pauses, confidence) that feed
   the experience estimate as a light hint next to what the worker actually said. */
function freshAI() {
  return { msgs: [], mode: "ai", pending: false, done: false, speak: true, lang: "en-MY", profile: null, evidence: [], videoId: null };
}
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const FILLER_RE = /\b(um+|uh+|er+m*|em+|hmm+|ah+|eh+|apa tu|apa nama)\b/gi;
const MY_STATES = ["Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang", "Penang", "Pulau Pinang", "Perak", "Perlis", "Sabah", "Sarawak", "Selangor", "Terengganu", "Kuala Lumpur", "Putrajaya", "Labuan"];
const JOB_KW = {
  qc: ["qc", "quality", "inspector", "inspection"],
  elec: ["electrician", "wireman", "wiring", "maintenance", "juruelektrik"],
  fork: ["forklift", "warehouse", "gudang", "reach truck"],
  admin: ["admin", "clerk", "data entry", "kerani", "office"],
  student: ["student", "pelajar", "studying", "diploma", "kolej", "ikm", "adtec", "politeknik"],
  tech: ["technician", "juruteknik", "production", "operator", "machine", "line"]
};
const EXP_LEVELS = BM_RULES.experience.levels;

let rec = null;
let recState = null;
let pendingVoice = null;

function aiSay(text) {
  if (!S.ai.speak || !window.speechSynthesis || rec) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = S.ai.lang;
  const v = speechSynthesis.getVoices().find(x => x.lang.replace("_", "-").startsWith(S.ai.lang.slice(0, 2)));
  if (v) u.voice = v;
  u.rate = .95;
  speechSynthesis.speak(u);
}

function micStatus(msg) {
  const el = $("#ai-mic-status");
  if (el) el.textContent = msg;
}

function startMic() {
  if (!SR || rec) return;
  if (window.speechSynthesis) speechSynthesis.cancel();
  const box = $("#ai-answer");
  recState = { base: box && box.value.trim() ? box.value.trim() + " " : "", spoken: "", t0: performance.now(), first: 0, last: 0, pauses: 0, conf: [] };
  rec = new SR();
  rec.lang = S.ai.lang;
  rec.continuous = true;
  rec.interimResults = true;
  rec.onresult = e => {
    const now = performance.now();
    if (!recState.first) recState.first = now;
    else if (now - recState.last > 2000) recState.pauses++;
    recState.last = now;
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) {
        recState.spoken += r[0].transcript.trim() + " ";
        if (r[0].confidence) recState.conf.push(r[0].confidence);
      } else interim += r[0].transcript;
    }
    const b = $("#ai-answer");
    if (b) b.value = recState.base + recState.spoken + interim;
  };
  rec.onerror = e => {
    micStatus(e.error === "not-allowed" || e.error === "service-not-allowed"
      ? "Microphone is blocked. Allow it in the browser address bar, or type your answer."
      : e.error === "no-speech" ? "Didn't hear anything. Tap the mic and try again." : `Voice error: ${e.error}. You can type instead.`);
  };
  rec.onend = () => stopMic();
  rec.start();
  const btn = $("#ai-mic");
  if (btn) {
    btn.setAttribute("aria-pressed", "true");
    btn.textContent = "Stop recording";
  }
  micStatus("Listening… speak naturally, then tap Stop.");
}

function stopMic() {
  if (!rec) return;
  const r = rec;
  rec = null;
  r.onend = null;
  try { r.stop(); } catch (e) {}
  const words = recState.spoken.trim().split(/\s+/).filter(Boolean).length;
  if (words) {
    // phrases arrive once spoken, so time from opening the mic to the last phrase
    const mins = Math.max(.05, (recState.last - recState.t0) / 60000);
    pendingVoice = {
      words,
      wpm: Math.round(words / mins),
      fillers: (recState.spoken.match(FILLER_RE) || []).length,
      pauses: recState.pauses,
      confidence: recState.conf.length ? +(recState.conf.reduce((a, b) => a + b, 0) / recState.conf.length).toFixed(2) : null
    };
  }
  const btn = $("#ai-mic");
  if (btn) {
    btn.setAttribute("aria-pressed", "false");
    btn.textContent = "Speak answer";
  }
  micStatus(words ? `Captured ${words} spoken words. Edit if needed, then Send.` : "");
}

/* GPU voice answer: records a clip with MediaRecorder and sends it to /api/transcribe, which runs
   Whisper on a RunPod GPU. Works in any browser with a microphone and handles Bahasa Malaysia,
   which the browser's own speech input (Chrome and Edge only) does poorly. The transcript lands
   in the answer box so the worker can fix it before sending. */
let gpuRec = null;
const GPU_MAX_MS = 90000;

function gpuButton(recording) {
  const b = $("#ai-gpu-mic");
  if (!b) return;
  b.setAttribute("aria-pressed", recording ? "true" : "false");
  b.textContent = recording ? "Stop and transcribe" : "Record answer (GPU)";
}

async function gpuMicToggle() {
  if (gpuRec) return gpuRecStop(false);
  if (!navigator.mediaDevices || !window.MediaRecorder) {
    micStatus("This browser cannot record audio. Type your answer instead.");
    return;
  }
  if (rec) stopMic();
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e) {
    micStatus("Microphone is blocked. Allow it in the browser address bar, or type your answer.");
    return;
  }
  const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find(t => MediaRecorder.isTypeSupported(t)) || "";
  const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  const chunks = [];
  const job = { mr, stream, discard: false, timer: setTimeout(() => gpuRecStop(false), GPU_MAX_MS) };
  mr.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
  mr.onstop = () => gpuRecDone(job, new Blob(chunks, { type: mr.mimeType || "audio/webm" }));
  gpuRec = job;
  mr.start();
  gpuButton(true);
  micStatus("Recording… speak naturally, then tap Stop and transcribe (90 seconds at most).");
}

function gpuRecStop(discard) {
  if (!gpuRec) return;
  const job = gpuRec;
  gpuRec = null;
  job.discard = discard;
  clearTimeout(job.timer);
  gpuButton(false);
  try { job.mr.stop(); } catch (e) {}
  job.stream.getTracks().forEach(t => t.stop());
}

async function gpuRecDone(job, blob) {
  if (job.discard) return;
  if (blob.size < 1500) {
    micStatus("Did not catch any sound. Tap Record answer and try again.");
    return;
  }
  micStatus("Sending to the GPU speech service…");
  try {
    const audio = await new Promise((ok, no) => {
      const fr = new FileReader();
      fr.onload = () => ok(String(fr.result).split(",")[1]);
      fr.onerror = () => no(fr.error);
      fr.readAsDataURL(blob);
    });
    const res = await fetch(apiUrl("/api/transcribe"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audio_base64: audio, format: blob.type.includes("mp4") ? "mp4" : "webm", language: S.ai.lang.startsWith("ms") ? "ms" : "en" })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      micStatus(data.error || "The speech service is not available. Type your answer instead.");
      return;
    }
    const box = $("#ai-answer");
    if (box) box.value = (box.value.trim() ? box.value.trim() + " " : "") + data.text;
    const words = data.text.split(/\s+/).filter(Boolean).length;
    micStatus(words ? `Transcribed ${words} words on a RunPod GPU. Edit if needed, then Send.` : "No speech found in the recording. Try again.");
  } catch (e) {
    micStatus("Could not reach the speech service. Type your answer instead.");
  }
}

/* Camera: live preview plus "Take photo" to show a certificate, a meter or a tool with an answer.
   Photos stay in memory only (never in localStorage) and leave the device only when the answer is sent. */
const PHOTOS = new Map();
let camStream = null;
let camFacing = "user";
let camCount = 0;
let pendingPhoto = null;

function rerenderKeep() {
  const text = $("#ai-answer")?.value;
  rerender();
  const box = $("#ai-answer");
  if (box && text) box.value = text;
}

function bindCam() {
  const v = $("#ai-video");
  if (v && camStream && v.srcObject !== camStream) {
    v.srcObject = camStream;
    v.play().catch(() => {});
  }
}

async function camStart() {
  if (!navigator.mediaDevices?.getUserMedia) {
    toast("This browser cannot open the camera. Try Chrome or Edge.");
    return;
  }
  camStop();
  try {
    camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: camFacing, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
    camCount = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === "videoinput").length;
  } catch (e) {
    camStream = null;
    toast(e.name === "NotAllowedError" ? "Camera is blocked. Allow it in the browser address bar, then try again."
      : e.name === "NotFoundError" ? "No camera found on this device."
      : e.name === "NotReadableError" ? "The camera is busy in another app. Close it and try again."
      : `Camera error: ${e.message}`);
  }
  rerenderKeep();
}

function camStop() {
  if (camStream) camStream.getTracks().forEach(t => t.stop());
  camStream = null;
}

function camSnap() {
  const v = $("#ai-video");
  if (!v || !v.videoWidth) return;
  const scale = Math.min(1, 1024 / Math.max(v.videoWidth, v.videoHeight));
  const c = document.createElement("canvas");
  c.width = Math.round(v.videoWidth * scale);
  c.height = Math.round(v.videoHeight * scale);
  c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
  const id = "p" + Date.now();
  PHOTOS.set(id, c.toDataURL("image/jpeg", .82));
  pendingPhoto = id;
  patchPhotoSlot();
}

function patchPhotoSlot() {
  const slot = $("#ai-photo-slot");
  if (slot) slot.innerHTML = photoSlot();
}

const photoSlot = () => pendingPhoto && PHOTOS.has(pendingPhoto)
  ? `<div class="photo-pending"><img src="${PHOTOS.get(pendingPhoto)}" alt="Photo to send with your answer"><span class="small">Photo will be sent with your answer.</span><button class="btn small ghost" data-act="ai-photo-remove">Remove</button></div>`
  : "";

function camView() {
  if (!camStream) return "";
  return `<div class="cam-panel">
    <div class="row" style="justify-content:space-between">
      <span class="live-dot">Camera on</span>
      <span class="small muted">Show a certificate, a meter reading or a tool you use.</span>
    </div>
    <video id="ai-video" autoplay playsinline muted class="${camFacing === "user" ? "mirror" : ""}" aria-label="Camera preview"></video>
    <div class="row" style="gap:8px">
      <button class="btn small" data-act="ai-snap" ${S.ai.done ? "disabled" : ""}>Take photo</button>
      ${camCount > 1 ? '<button class="btn small ghost" data-act="ai-cam-flip">Switch camera</button>' : ""}
      <button class="btn small ghost" data-act="ai-cam">Turn camera off</button>
    </div>
    <p class="small muted" style="margin:0">Photos go to the interviewer only when you press Send, and are not saved on this device. Bijak never judges you by your face or looks.</p>
  </div>`;
}

/* Work video: the worker uploads a clip of a normal day. The file never leaves the device; the browser
   pulls 6-10 frames with their times, and only those go to the interviewer with the next turn. */
const VIDEOS = new Map();
let videoBusy = false;
const clock = sec => `${Math.floor(sec / 60)}:${String(Math.round(sec) % 60).padStart(2, "0")}`;

function once(el, ev, ms = 15000) {
  return new Promise((res, rej) => {
    const timer = setTimeout(() => rej(new Error("timeout")), ms);
    el.addEventListener(ev, () => { clearTimeout(timer); res(); }, { once: true });
    el.addEventListener("error", () => { clearTimeout(timer); rej(new Error("decode")); }, { once: true });
  });
}

async function videoFrames(file) {
  const url = URL.createObjectURL(file);
  const v = document.createElement("video");
  v.muted = true;
  v.playsInline = true;
  v.preload = "auto";
  v.src = url;
  await once(v, "loadedmetadata");
  let duration = v.duration;
  if (!isFinite(duration)) { // some recordings only report length after a seek to the end
    v.currentTime = 1e7;
    await once(v, "seeked");
    duration = v.currentTime;
  }
  const n = Math.max(6, Math.min(10, Math.round(duration / 10)));
  const c = document.createElement("canvas");
  const frames = [];
  for (let i = 0; i < n; i++) {
    const t = ((i + .5) * duration) / n;
    v.currentTime = t;
    await once(v, "seeked");
    const scale = Math.min(1, 768 / Math.max(v.videoWidth, v.videoHeight));
    c.width = Math.round(v.videoWidth * scale);
    c.height = Math.round(v.videoHeight * scale);
    c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
    frames.push({ t: +t.toFixed(1), image: c.toDataURL("image/jpeg", .72) });
  }
  return { url, duration, frames };
}

async function aiVideo(file) {
  if (!file || videoBusy || S.ai.pending || S.ai.done) return;
  if (!file.type.startsWith("video/")) {
    toast("Please choose a video file.");
    return;
  }
  videoBusy = true;
  micStatus(`Reading "${file.name}"… the video stays on this device.`);
  try {
    const v = await videoFrames(file);
    const id = "v" + Date.now();
    VIDEOS.set(id, { ...v, name: file.name });
    const box = $("#ai-answer");
    const text = (box && box.value.trim()) || `Here is a video of my daily work (${file.name}).`;
    stopMic();
    S.ai.msgs.push({ role: "user", text, voice: pendingVoice, video: id, videoMeta: { name: file.name.slice(0, 80), duration: Math.round(v.duration) } });
    pendingVoice = null;
    S.ai.videoId = id;
    await aiNext();
  } catch (e) {
    micStatus("");
    toast(e.message === "decode" ? "This browser cannot read that video format. Try an MP4 from your phone." : "Could not read the video. Try a shorter clip.");
  } finally {
    videoBusy = false;
  }
}

function seekWork(sec) {
  const v = $("#ai-work-video");
  if (!v) return;
  v.currentTime = sec;
  v.scrollIntoView({ block: "nearest" });
  v.play().catch(() => {});
}

function evidenceView() {
  const ev = S.ai.evidence || [];
  const vid = S.ai.videoId && VIDEOS.get(S.ai.videoId);
  if (!vid && !ev.length) return "";
  const icon = { video: "Video", photo: "Photo", talk: "Said" };
  return `<div class="panel"><h3>Evidence from your work</h3>
    ${vid ? `<video id="ai-work-video" class="work-video" src="${vid.url}" controls playsinline preload="metadata" aria-label="Your work video"></video>
      <div class="frame-strip" aria-label="Moments sent to Bijak">${vid.frames.map(f => `<button class="frame" data-act="ai-seek" data-v="${f.t}" aria-label="Jump to ${clock(f.t)}"><img src="${f.image}" alt=""><span>${clock(f.t)}</span></button>`).join("")}</div>` : ""}
    ${S.ai.msgs.some(m => m.video) && !vid ? '<p class="small muted">Your video is not kept after a reload. Its findings below are saved.</p>' : ""}
    ${ev.length ? `<ul class="evidence-list">${ev.map(e => `<li>
        <div class="row-sm" style="gap:6px;flex-wrap:wrap">
          ${e.source === "video" && e.at_seconds != null ? `<button class="source-tag" data-act="ai-seek" data-v="${e.at_seconds}">Video ${clock(e.at_seconds)}</button>` : `<span class="source-tag">${icon[e.source] || "Said"}</span>`}
          ${e.card ? `<b class="small">${esc(e.card)}</b>` : ""}
          ${e.safety === "concern" ? '<span class="pill pill-sm pill--warn">Safety concern</span>' : e.safety === "good" ? '<span class="pill pill-sm pill--check">Safe practice</span>' : ""}
        </div>
        <span class="small">${esc(e.observation)}</span>
      </li>`).join("")}</ul>` : `<p class="small muted">${S.ai.mode === "ai" ? "Bijak is looking at your video…" : "Offline mode cannot watch videos. Describe what you do in it and Bijak will pick out the skills."}</p>`}
  </div>`;
}

/* AI market analysis: job opportunities and competition in one state, researched live by the server.
   Without the server it falls back to BijakMatch sample figures, clearly marked Sample. */
const PATH_KEYS = ["stay", "evolve", "pivot"];
const DEMAND_WORD = { high: "High demand", medium: "Some demand", low: "Low demand", unknown: "Not found" };
const COMP_WORD = { crowded: "Crowded", balanced: "Balanced", open: "Open", unknown: "Not found" };

function marketSample(state) {
  return PATH_KEYS.map(k => {
    const P = D.PATHS[k];
    const hit = P.jobs.find(j => j[0] === state);
    return { key: k, role: P.sub, openings: hit ? hit[1] : null, seekers: P.seekers, pay: P.pay, growth: P.growth };
  });
}

async function marketRun() {
  const state = $("#market-state")?.value || S.market?.state || S.state;
  if (S.market?.loading) return;
  S.market = { state, loading: true, report: null, error: "" };
  rerenderKeep();
  try {
    const p = S.ai.profile || {};
    const r = await fetch(apiUrl("/api/market"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        state,
        profile: { job: p.job_title || jobName(), years: S.years, certificates: (p.certificates && p.certificates.length ? p.certificates : S.certsHeld), skills: S.interviewTasks.filter(t => t.kept).map(t => t.n) },
        paths: marketSample(state).map(x => ({ path: x.key, role: x.role, sample: { openings: x.openings, seekers: x.seekers, pay: x.pay } }))
      })
    });
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "The AI server is not running.");
    const report = await r.json();
    S.market = { state, loading: false, report, error: "" };
    S.marketCache = { ...(S.marketCache || {}), [state]: report };
  } catch (e) {
    S.market = { state, loading: false, report: null, error: e.message };
  }
  if (route === "skills") rerenderKeep();
  else save();
}

function marketView() {
  const M = S.market || {};
  const state = M.state || (S.ai.profile && S.ai.profile.state) || S.state;
  const R = M.report;
  const refs = ids => (ids || []).filter(i => R.sources.some(s => s.id === i)).map(i => `<a href="#src-${i}" class="ref">[${i}]</a>`).join("");
  let body = "";
  if (M.loading) {
    body = `<p class="muted" role="status">Searching job sites, statistics and training providers for ${esc(state)}. This takes about a minute.</p>`;
  } else if (R) {
    body = `
      <div class="row" style="justify-content:space-between"><p style="margin:0;max-width:70ch">${esc(R.summary)}</p>
        <span class="tag tag--estimate" title="Summarised by AI from the sources listed below">AI web research · ${esc(R.generated_at)}</span></div>
      <h3>Job opportunities in ${esc(R.state)}</h3>
      <div class="market-grid">${R.opportunities.map(o => `<div class="market-item">
        <div class="row" style="justify-content:space-between"><b>${esc(o.role)}</b><span class="pill pill-sm demand-${o.demand}">${DEMAND_WORD[o.demand]}</span></div>
        <span class="small"><b>Openings:</b> ${esc(o.openings_note)}</span>
        <span class="small"><b>Pay:</b> ${esc(o.pay_note)}</span>
        ${o.hiring.length ? `<span class="small"><b>Hiring:</b> ${esc(o.hiring.join(", "))}</span>` : ""}
        ${o.hotspots ? `<span class="small"><b>Where:</b> ${esc(o.hotspots)}</span>` : ""}
        <span class="small">${refs(o.source_ids)}</span>
      </div>`).join("")}</div>
      <h3>Your competition</h3>
      <div class="market-grid">${R.competition.map(c => `<div class="market-item">
        <div class="row" style="justify-content:space-between"><b>${esc(c.role)}</b><span class="pill pill-sm comp-${c.level}">${COMP_WORD[c.level]}</span></div>
        <span class="small"><b>Who applies:</b> ${esc(c.who_applies)}</span>
        <span class="small"><b>New candidates from training:</b> ${esc(c.training_supply)}</span>
        <span class="small"><b>Your edge:</b> ${esc(c.your_edge)}</span>
        <span class="small"><b>Gap to close:</b> ${esc(c.gap_to_close)}</span>
        <span class="small">${refs(c.source_ids)}</span>
      </div>`).join("")}</div>
      <div class="banner" style="background:var(--leaf-soft)"><div><b>Best move: ${esc(R.best_move.role)}</b>
        <p class="small" style="margin:4px 0">${esc(R.best_move.why)}</p><p class="small" style="margin:0"><b>First step:</b> ${esc(R.best_move.first_step)}</p></div></div>
      ${R.caveats.length ? `<p class="small muted"><b>Caveats:</b> ${esc(R.caveats.join(" "))}</p>` : ""}
      <ol class="sources">${R.sources.map(s => `<li id="src-${s.id}" value="${s.id}"><a href="${/^https?:\/\//.test(s.url) ? esc(s.url) : "#"}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a> <span class="muted">· ${esc(s.publisher)} · ${esc(s.date)}</span></li>`).join("")}</ol>`;
  } else {
    const rows = marketSample(state);
    body = `
      ${M.error ? `<p class="live-error" role="alert">AI analysis unavailable: ${esc(M.error)} Showing BijakMatch sample figures instead.</p>` : '<p class="small muted">Press the button for a live AI analysis of your state. Until then, these are BijakMatch sample figures.</p>'}
      <div class="market-grid">${rows.map(x => `<div class="market-item">
        <div class="row" style="justify-content:space-between"><b>${esc(x.role)}</b><span class="tag tag--sample">Sample</span></div>
        <span class="small"><b>Openings in ${esc(state)}:</b> ${x.openings == null ? "none in the sample" : x.openings}</span>
        <span class="small"><b>Applicants per posting:</b> ${x.seekers} (${x.seekers >= 8 ? "crowded" : x.seekers >= 5 ? "balanced" : "open"})</span>
        <span class="small"><b>Pay:</b> ${rm(x.pay[0])} to ${rm(x.pay[1])} a month</span>
        <span class="small"><b>Growth:</b> ${esc(x.growth)}</span>
      </div>`).join("")}</div>`;
  }
  return `<section class="panel market-card" id="market-panel" aria-labelledby="market-title">
    <div class="row" style="justify-content:space-between">
      <div><h2 id="market-title" style="margin:0">Market in your state</h2>
        <p class="small muted" style="margin:4px 0 0">Job opportunities and the competition for green roles where you live, researched by AI with sources.</p></div>
      <div class="row" style="gap:8px">
        <select id="market-state" class="mini-select" aria-label="State to analyse">${D.STATES.map(s => `<option ${s === state || (s === "Penang" && state === "Pulau Pinang") ? "selected" : ""}>${s}</option>`).join("")}</select>
        <button class="btn" data-act="market-run" ${M.loading ? "disabled" : ""}>${M.loading ? "Analysing…" : R ? "Run again" : "Run AI market analysis"}</button>
      </div>
    </div>
    ${body}
  </section>`;
}

async function aiSend() {
  const box = $("#ai-answer");
  const photo = pendingPhoto && PHOTOS.has(pendingPhoto) ? pendingPhoto : null;
  const text = (box ? box.value.trim() : "") || (photo ? "Here is a photo." : "");
  if (!text || S.ai.pending || S.ai.done) return;
  stopMic();
  S.ai.msgs.push({ role: "user", text, voice: pendingVoice, photo });
  pendingVoice = null;
  pendingPhoto = null;
  await aiNext();
}

// Photos travel with the history only while they are in memory; the 3 latest are enough for context.
function aiHistory() {
  const recent = new Set(S.ai.msgs.filter(m => m.photo && PHOTOS.has(m.photo)).slice(-3).map(m => m.photo));
  const lastVideo = S.ai.msgs.filter(m => m.video && VIDEOS.has(m.video)).map(m => m.video).pop();
  return S.ai.msgs.map(({ role, text, voice, raw, photo, video, videoMeta }) => ({ role, text, voice, raw, photo: !!photo, image: recent.has(photo) ? PHOTOS.get(photo) : undefined,
    video: video ? { ...videoMeta, frames: video === lastVideo ? VIDEOS.get(video).frames : [] } : undefined }));
}

async function aiNext() {
  S.ai.pending = true;
  rerender();
  let out = null;
  if (S.ai.mode === "ai") {
    try {
      const r = await fetch(apiUrl("/api/interview"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: aiHistory() })
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`);
      out = await r.json();
    } catch (e) {
      S.ai.mode = "offline";
      toast("AI interviewer is not reachable, so the offline interviewer will continue.");
    }
  }
  if (!out) out = offlineTurn();
  S.ai.pending = false;
  S.ai.msgs.push({ role: "ai", text: out.reply, raw: S.ai.mode === "ai" ? out : null, qid: out.qid });
  applyInterview(out);
  if (route === "skills") rerender();
  else save();
  aiSay(out.reply);
}

/* Offline interviewer: same output shape as the server, built from keyword rules. */
function offlineQuestions(p) {
  const job = D.JOBS[p.job_key] || D.JOBS[S.job] || D.JOBS.tech;
  return [
    { id: "intro", q: "Hi, I'm Bijak. I'll ask a few short questions about you and your work. First, what's your name and how old are you?" },
    { id: "job", q: "What job do you do now, and in which state?" },
    { id: "years", q: "How many years have you done this kind of work? Do you hold any certificates, like SKM or a DOSH permit?" },
    { id: "shift0", q: job.interview[0].q },
    { id: "shift2", q: job.interview[2].q },
    { id: "shift3", q: job.interview[3].q },
    { id: "goal", q: "Last one: what are you hoping to do next? Earn more, or move into new work quickly? Tell me why." }
  ];
}

function offlineTurn() {
  const p = { name: null, age: null, job_key: "unknown", job_title: null, years: null, state: null, certificates: [], goal: "unknown", aim: null };
  const tasks = [];
  const voices = [];
  let shiftAnswers = 0;
  let detail = 0;
  S.ai.msgs.forEach((m, i) => {
    if (m.role !== "user") return;
    const qid = (S.ai.msgs[i - 1] || {}).qid || "";
    const t = m.text;
    const lo = t.toLowerCase();
    const num = (lo.match(/\b(\d{1,2}(?:\.\d)?)\b/) || [])[1];
    if (m.voice) voices.push(m.voice);
    if (qid.startsWith("shift")) {
      shiftAnswers++;
      detail += t.split(/\s+/).length;
    }
    if (!p.name) {
      const nm = t.match(/(?:my name is|name's|i'm|i am|nama saya|saya)\s+([A-Z][a-z]+)/i);
      if (nm && !/^\d/.test(nm[1])) p.name = nm[1][0].toUpperCase() + nm[1].slice(1);
    }
    if (p.age == null) {
      const ag = lo.match(/(\d{2})\s*(?:years? old|tahun|yo\b|y\/o)/) || lo.match(/\b(?:age|umur)\D{0,8}(\d{2})/);
      const a = ag ? +ag[1] : qid === "intro" && num ? +num : null;
      if (a >= 15 && a <= 75) p.age = a;
    }
    if (p.job_key === "unknown") {
      const hit = Object.keys(JOB_KW).find(k => JOB_KW[k].some(w => lo.includes(w)));
      if (hit) {
        p.job_key = hit;
        p.job_title = qid === "job" ? t.split(/[,.]| in | at /i)[0].replace(/^(i'm|i am|saya)\s+(an?\s+)?/i, "").slice(0, 60) : D.JOBS[hit].n;
      }
    }
    if (p.years == null) {
      const yr = lo.match(/(\d{1,2}(?:\.\d)?)\s*(?:years?|yrs?|tahun)(?!\s*old)/);
      const y = yr ? +yr[1] : qid === "years" && num ? +num : null;
      if (y != null && y <= 50 && !(qid === "intro" && y === p.age)) p.years = y;
    }
    if (!p.state) p.state = MY_STATES.find(s => lo.includes(s.toLowerCase())) || null;
    (t.match(/skm\s*(?:level|tahap)?\s*\d|dosh[\w ]{0,20}|hrd ?corp[\w ]{0,20}|cidb|forklift permit|st (?:wireman|chargeman)[\w ]{0,10}/gi) || [])
      .forEach(c => { if (!p.certificates.includes(c.trim())) p.certificates.push(c.trim()); });
    if (/earn|income|money|salary|gaji|pay|duit/.test(lo)) p.goal = "income";
    else if (/quick|fast|soon|cepat|asap|new job|change job|tukar/.test(lo)) p.goal = "quick";
    if (qid === "goal") p.aim = t.slice(0, 160);
    D.TASKCARDS.forEach(tc => {
      if (tc.kw.some(w => lo.includes(w)) && !tasks.find(x => x.card === tc.n)) tasks.push({ card: tc.n, quote: t });
    });
  });

  const experience = offlineExperience(p, tasks, voices, shiftAnswers, detail);
  const lastMsg = S.ai.msgs[S.ai.msgs.length - 1];
  if (lastMsg && lastMsg.video) {
    return { qid: "video-describe", done: false, profile: p, tasks, experience,
      evidence: [...(S.ai.evidence || []), { source: "video", at_seconds: null, observation: `Shared ${lastMsg.videoMeta.name} (${clock(lastMsg.videoMeta.duration)}).`, card: "", safety: "none" }],
      reply: "Thanks, your video is saved as evidence. I can't watch videos in offline mode, so tell me step by step what you are doing in it." };
  }
  const asked = new Set(S.ai.msgs.filter(m => m.role === "ai").map(m => m.qid));
  const known = { intro: p.age != null, job: p.job_key !== "unknown", years: p.years != null, goal: p.goal !== "unknown" };
  const next = offlineQuestions(p).find(q => !asked.has(q.id) && !known[q.id]);
  if (next) {
    const last = S.ai.msgs[S.ai.msgs.length - 1];
    const ack = last && last.photo ? "Thanks for the photo, it is saved with your answers. " : S.ai.msgs.length ? "Thanks. " : "";
    return { qid: next.id, reply: ack + next.q, done: false, profile: p, tasks, experience };
  }
  const job = D.JOBS[p.job_key] ? D.JOBS[p.job_key].n.toLowerCase() : "worker";
  return {
    qid: "done", done: true, profile: p, tasks, experience,
    reply: `Thank you${p.name ? ", " + p.name : ""}. You're a ${job}${p.years != null ? ` with about ${p.years} years of experience` : ""}, and I found ${tasks.length} tasks you already do. I've added them to your skills so we can check which ones are certified.`
  };
}

function offlineExperience(p, tasks, voices, shiftAnswers, detail) {
  if (p.job_key === "unknown" || p.years == null || !shiftAnswers) {
    return { level: "Not enough info", score: 0, reasons: ["Needs your job, years of experience and at least one shift answer."] };
  }
  const reasons = [];
  let score = Math.min(p.years, 15) / 15 * 45;
  reasons.push(`${p.years} years doing this work`);
  score += Math.min(30, tasks.length * 6);
  if (tasks.length) reasons.push(`Described ${tasks.length} recognised task${tasks.length > 1 ? "s" : ""} in your own words, e.g. ${tasks[0].card.toLowerCase()}`);
  const avg = detail / shiftAnswers;
  if (avg >= 25) { score += 10; reasons.push("Shift answers gave step-by-step detail"); }
  else if (avg >= 12) score += 5;
  if (tasks.find(x => x.card === "Training others")) { score += 5; reasons.push("Others come to you for help"); }
  if (voices.length) {
    const wpm = Math.round(voices.reduce((a, v) => a + v.wpm, 0) / voices.length);
    const fillRate = voices.reduce((a, v) => a + v.fillers, 0) / Math.max(1, voices.reduce((a, v) => a + v.words, 0)) * 100;
    if (wpm >= 90 && fillRate < 4) { score += 10; reasons.push(`Spoke about your work steadily (${wpm} words/min, few fillers)`); }
    else score += 5;
  }
  score = Math.round(clamp(score, 0, 100));
  return { level: EXP_LEVELS.find(([min]) => score >= min)[1], score, reasons };
}

function applyInterview(out) {
  const p = out.profile || {};
  S.ai.profile = p;
  if (p.name) S.name = p.name;
  if (p.age != null) S.age = p.age;
  if (p.job_key && D.JOBS[p.job_key]) S.job = p.job_key;
  if (p.years != null) S.years = p.years;
  if (p.state) S.state = p.state;
  if (p.goal === "income" || p.goal === "quick") S.goal = p.goal;
  if (p.aim) S.aim = p.aim;
  S.experience = out.experience || null;
  if (out.evidence) S.ai.evidence = out.evidence;
  (out.tasks || []).forEach(t => {
    if (S.interviewTasks.find(x => x.n === t.card)) return;
    S.doing[t.card] = true;
    S.interviewTasks.push({ n: t.card, quote: t.quote, kept: true, phase: S.ai.mode === "ai" ? "AI interview" : "Interview" });
  });
  if (out.done && !S.ai.done) {
    S.ai.done = true;
    S.done.skills = true;
    if (!S.proofs.includes("interview")) S.proofs.push("interview");
    S.passportStamps.push({ title: "Shift Interview Verified", date: "Oct 2026", source: S.ai.mode === "ai" ? "AI voice interview" : "Guided interview" });
    toast("Interview complete. Your profile and tasks are updated.");
  }
}

function voiceChip(v) {
  if (!v) return '<span class="voice-chip">Typed</span>';
  return `<span class="voice-chip">Spoken · ${v.wpm} words/min · ${v.fillers} filler${v.fillers === 1 ? "" : "s"} · ${v.pauses} long pause${v.pauses === 1 ? "" : "s"}</span>`;
}

function interviewView() {
  const ai = S.ai;
  const p = ai.profile || {};
  const ex = S.experience;
  const spoken = ai.msgs.filter(m => m.role === "user" && m.voice).map(m => m.voice);
  const dash = '<span class="muted">Not yet</span>';
  const facts = [
    ["Name", p.name ? esc(p.name) : dash],
    ["Age", p.age != null ? p.age : dash],
    ["Job", p.job_key && D.JOBS[p.job_key] ? `${esc(D.JOBS[p.job_key].n)}${p.job_title && p.job_title.toLowerCase() !== D.JOBS[p.job_key].n.toLowerCase() ? ` <span class="muted small">(“${esc(p.job_title)}”)</span>` : ""}` : dash],
    ["Years", p.years != null ? `${p.years} years` : dash],
    ["State", p.state ? esc(p.state) : dash],
    ["Certificates", p.certificates && p.certificates.length ? esc(p.certificates.join(", ")) : dash],
    ["Trying to", p.aim ? esc(p.aim) : p.goal === "income" ? "Earn more" : p.goal === "quick" ? "Move into new work quickly" : dash]
  ];

  const chat = !ai.msgs.length ? `
      <div class="chat-phase active">
        <b style="font:800 22px/1.3 var(--head)">Talk to Bijak, your AI interviewer</b>
        <p>Bijak asks about 8 short questions: who you are, your job, what happens on a normal shift, and what you want next. Speak or type, in English or Bahasa Melayu.</p>
        <p class="small muted">Your spoken answers help estimate your experience level. Accent, grammar and language never count against you.</p>
        <div class="row"><button class="btn" data-act="ai-start">Start interview</button>
          <button class="btn ghost" data-act="use-sample-interview">Use sample shift answers</button></div>
      </div>` : `
      <div class="chat-log" aria-live="polite">
        ${ai.msgs.map(m => m.role === "ai"
          ? `<div class="chat-bubble"><span class="source-tag" style="justify-self:start">Bijak</span><span>${esc(m.text)}</span></div>`
          : `<div class="chat-bubble user">${m.photo ? (PHOTOS.has(m.photo) ? `<img class="chat-photo" src="${PHOTOS.get(m.photo)}" alt="Photo you shared">` : '<span class="voice-chip">Photo shared (not kept after reload)</span>') : ""}<span>${esc(m.text)}</span>${voiceChip(m.voice)}</div>`).join("")}
        ${ai.pending ? '<div class="chat-bubble"><span class="muted">Bijak is thinking…</span></div>' : ""}
      </div>
      ${ai.done ? `<div class="banner" style="background:var(--leaf-soft)">
          <div><b>Interview complete</b><p class="small muted">Your age, job, years and tasks are saved. Next, see which skills are certified.</p></div>
          <button class="btn small" data-tab="skills:check">Next: Three-Track Check</button>
        </div>` : `${camView()}<div class="composer">
          <label for="ai-answer" class="small muted">Your answer</label>
          <div id="ai-photo-slot">${photoSlot()}</div>
          <textarea id="ai-answer" rows="3" placeholder="Tap Speak answer, or type here. Press Enter to send." ${ai.pending ? "disabled" : ""}></textarea>
          <div class="row" style="justify-content:space-between">
            <div class="row" style="gap:8px">
              <button class="btn small ghost" id="ai-mic" data-act="ai-mic" aria-pressed="false" ${SR ? "" : "disabled"}>Speak answer</button>
              <button class="btn small ghost" id="ai-gpu-mic" data-act="ai-gpu-mic" aria-pressed="false" ${ai.pending ? "disabled" : ""}>Record answer (GPU)</button>
              <button class="btn small ghost" data-act="ai-video-pick" ${ai.pending ? "disabled" : ""}>Upload work video</button>
              <input type="file" id="ai-video-file" accept="video/*" hidden>
            </div>
            <button class="btn small" data-act="ai-send" ${ai.pending ? "disabled" : ""}>Send</button>
          </div>
          <span id="ai-mic-status" class="small muted" role="status">${SR ? "" : "Voice answers need Chrome or Edge. You can still type."}</span>
        </div>`}`;

  return `<div class="cols c8-4">
    <div class="interview-chat">
      <div class="banner" style="background:var(--leaf-soft);margin-bottom:0;flex-wrap:wrap;gap:12px">
        <div><b>AI Shift Interview</b>
          <p class="small muted">${ai.mode === "ai" ? "Questions come from Bijak, an AI interviewer. Every task links back to your own words." : "Offline interviewer (AI server not running). Questions follow a fixed guide."}</p></div>
        <div class="row" style="gap:8px">
          <select data-bind="ai-lang" aria-label="Interview language" class="mini-select">
            <option value="en-MY" ${ai.lang === "en-MY" ? "selected" : ""}>English</option>
            <option value="ms-MY" ${ai.lang === "ms-MY" ? "selected" : ""}>Bahasa Melayu</option>
          </select>
          ${ai.msgs.length && !ai.done ? `<button class="btn small ghost" data-act="ai-cam" aria-pressed="${!!camStream}">${camStream ? "Camera off" : "Camera"}</button>` : ""}
          <button class="btn small ghost" data-act="market-jump">Market analysis</button>
          <button class="btn small ghost" data-act="ai-speak" aria-pressed="${ai.speak}">${ai.speak ? "Voice on" : "Voice off"}</button>
          ${ai.msgs.length ? '<button class="btn small ghost" data-act="ai-restart">Restart</button>' : ""}
        </div>
      </div>
      ${chat}
      ${S.interviewTasks.some(t => t.kept) && !ai.pending && (ai.done || !ai.msgs.length) ? `<div class="live-card" id="live-panel">${liveInner()}</div>` : ""}
    </div>

    <div style="display:grid;gap:16px;align-content:start">
      ${evidenceView()}
      <div class="panel"><h3>What Bijak understood</h3>
        <dl class="facts">${facts.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>
      </div>

      <div class="panel"><h3>Experience estimate</h3>
        ${ex && ex.level !== "Not enough info" ? `
          <div class="row" style="justify-content:space-between;margin-top:6px"><b style="font:800 24px/1.2 var(--head)">${esc(ex.level)}</b><b>${ex.score}/100</b></div>
          <div class="breakdown-bar" style="margin:10px 0"><i style="width:${ex.score}%"></i></div>
          <ul class="reasons">${ex.reasons.map(r => `<li>${esc(r)}</li>`).join("")}</ul>` : '<p class="small muted">Appears once Bijak knows your job, your years and one real shift story.</p>'}
        ${S.live.overall ? `<div class="row" style="justify-content:space-between;margin-top:10px"><span>Live call result</span><b>${esc(S.live.overall)}</b></div>` : ""}
        <p class="small muted" style="margin-top:10px">Based mostly on what you describe. Voice pace is only a light hint. Accent, grammar and language never lower it.</p>
      </div>

      ${spoken.length ? `<div class="panel"><h3>Voice signals</h3>
        <dl class="facts">
          <dt>Spoken answers</dt><dd>${spoken.length}</dd>
          <dt>Pace</dt><dd>${Math.round(spoken.reduce((a, v) => a + v.wpm, 0) / spoken.length)} words/min</dd>
          <dt>Filler words</dt><dd>${spoken.reduce((a, v) => a + v.fillers, 0)} in ${spoken.reduce((a, v) => a + v.words, 0)} words</dd>
          <dt>Long pauses</dt><dd>${spoken.reduce((a, v) => a + v.pauses, 0)}</dd>
          ${spoken.some(v => v.confidence != null) ? `<dt>Recognition</dt><dd>${Math.round(spoken.filter(v => v.confidence != null).reduce((a, v, _, arr) => a + v.confidence / arr.length, 0) * 100)}% clear</dd>` : ""}
        </dl></div>` : ""}

      <div class="panel"><h3>Detected Workplace Tasks</h3>
        <p class="small muted">Every task shows the exact sentence it came from. You confirm what to keep.</p>
        <div style="display:grid;gap:10px;margin-top:10px">
          ${S.interviewTasks.length ? S.interviewTasks.map((t, idx) => `<div style="background:var(--mist);border-radius:10px;padding:10px;display:grid;gap:4px">
            <div class="row" style="justify-content:space-between">
              <b>${esc(t.n)}</b>
              <button class="btn small ghost" data-act="toggle-task" data-v="${idx}" aria-pressed="${t.kept}">${t.kept ? "Kept" : "Removed"}</button>
            </div>
            <span class="small muted" style="font-style:italic">"${esc(t.quote)}"</span>
            <span class="source-tag">${esc(t.phase)}</span>
            ${liveResult(t.n) ? `<span class="pill pill-sm ${(LIVE_VERDICT[liveResult(t.n).verdict] || [])[1] || ""}" style="justify-self:start">${(LIVE_VERDICT[liveResult(t.n).verdict] || [liveResult(t.n).verdict])[0]}${liveResult(t.n).level ? ` · level ${liveResult(t.n).level}/5` : ""}</span>` : ""}
          </div>`).join("") : '<span class="muted small">Tasks appear here as you describe your shift.</span>'}
        </div>
      </div>
    </div>
  </div>
  ${marketView()}`;
}

