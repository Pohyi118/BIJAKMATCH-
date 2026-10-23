/* BijakMatch: Job World simulator (Try, Understand, Pivot).
   Classic script; shares one global scope with the other app-*.js files (load order in index.html). */
/* ==========================================================================
   VIEW: SPROUT JOB WORLD ("TRY -> UNDERSTAND -> PIVOT")
   Stations are the worker's own job tasks (D.JOBS + D.TASKSIM). Careers are the app's
   three paths, scored and planned by the same engine as "Choose a path".
   ========================================================================== */
const SPROUT_VERDICT = { best: "Good call", ok: "Works, but there is a better way", risk: "Risky" };
const jobKey = () => S.job || person().job || "tech";
const ICON_INFO = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`;

// Flat top-down workplace map; zone boxes line up with D.ZONES slots (percent of 1000 x 560)
const SPROUT_MAP = `<svg class="sprout-floor" viewBox="0 0 1000 560" aria-hidden="true">
  <rect width="1000" height="560" fill="#E9EFE5"/>
  <path d="M0 262H1000M0 378H1000M610 0V560" fill="none" stroke="#F2C230" stroke-width="5" stroke-dasharray="18 12"/>
  <g fill="#F7F9F5" stroke="#DCE6D6" stroke-width="2">
    <rect x="16" y="16" width="250" height="228" rx="12"/><rect x="282" y="16" width="310" height="228" rx="12"/><rect x="628" y="16" width="356" height="228" rx="12"/>
    <rect x="16" y="396" width="576" height="148" rx="12"/><rect x="628" y="396" width="356" height="148" rx="12"/>
  </g>
  <g fill="#C9D6C3" stroke="#7F8A7D" stroke-width="2"><rect x="40" y="40" width="56" height="124" rx="4"/><rect x="104" y="40" width="56" height="124" rx="4"/><rect x="168" y="40" width="56" height="124" rx="4"/></g>
  <path d="M68 52v100M132 52v100M196 52v100" stroke="#A7B6A3" stroke-width="2"/>
  <path d="M84 60l-8 14h7l-3 12 9-16h-7z" fill="#F2C230"/>
  <rect x="330" y="16" width="214" height="14" fill="#A7B6A3"/>
  <g fill="#E9D9AE" stroke="#B8860B" stroke-width="2"><rect x="320" y="104" width="84" height="66" rx="4"/><rect x="452" y="136" width="84" height="66" rx="4"/></g>
  <g fill="#D9C08A"><rect x="330" y="112" width="30" height="24"/><rect x="364" y="112" width="30" height="24"/><rect x="330" y="140" width="30" height="24"/><rect x="462" y="144" width="30" height="24"/><rect x="496" y="144" width="30" height="24"/></g>
  <g fill="#DCE6D6" stroke="#7F8A7D" stroke-width="2"><rect x="650" y="56" width="150" height="58" rx="6"/><rect x="818" y="140" width="148" height="58" rx="6"/></g>
  <g fill="#2F57A8"><rect x="664" y="64" width="44" height="28" rx="3"/><rect x="718" y="64" width="44" height="28" rx="3"/><rect x="832" y="148" width="44" height="28" rx="3"/><rect x="886" y="148" width="44" height="28" rx="3"/></g>
  <g fill="#E1E8F5"><rect x="668" y="68" width="36" height="20"/><rect x="722" y="68" width="36" height="20"/><rect x="836" y="152" width="36" height="20"/><rect x="890" y="152" width="36" height="20"/></g>
  <rect x="24" y="294" width="572" height="52" rx="10" fill="#C9D6C3" stroke="#7F8A7D" stroke-width="2"/>
  <path d="${Array.from({ length: 23 }, (_, i) => `M${44 + i * 24} 300v40`).join("")}" stroke="#A7B6A3" stroke-width="2"/>
  <g fill="#A7B6A3" stroke="#4A534B" stroke-width="2"><rect x="132" y="278" width="96" height="84" rx="8"/><rect x="362" y="278" width="96" height="84" rx="8"/></g>
  <circle cx="216" cy="290" r="5" fill="#7BAE5E"/><circle cx="446" cy="290" r="5" fill="#F2C230"/>
  <g transform="translate(690 296)"><rect width="62" height="42" rx="6" fill="#F2C230" stroke="#B8860B" stroke-width="2"/><rect x="62" y="-8" width="8" height="58" fill="#4A534B"/><path d="M70 6h30M70 36h30" stroke="#4A534B" stroke-width="5"/><circle cx="14" cy="44" r="7" fill="#4A534B"/><circle cx="50" cy="44" r="7" fill="#4A534B"/></g>
  <g fill="#E9D9AE" stroke="#B8860B" stroke-width="2"><rect x="44" y="428" width="200" height="64" rx="6"/><rect x="276" y="452" width="200" height="64" rx="6"/></g>
  <g fill="#7F8A7D"><rect x="64" y="444" width="40" height="8" rx="3"/><circle cx="140" cy="462" r="10"/><rect x="300" y="470" width="52" height="8" rx="3"/><rect x="380" y="466" width="22" height="30" rx="3"/></g>
  <g fill="#DCE6D6" stroke="#7F8A7D" stroke-width="2"><rect x="652" y="430" width="310" height="24" rx="3"/><rect x="652" y="474" width="310" height="24" rx="3"/><rect x="652" y="514" width="310" height="22" rx="3"/></g>
  <g fill="#D9C08A">${[430, 474, 514].map(y => [664, 712, 806, 902].map(x => `<rect x="${x}" y="${y + 3}" width="34" height="17"/>`).join("")).join("")}</g>
  <g font-family="Atkinson Hyperlegible Next,Segoe UI,sans-serif" font-size="19" font-weight="700" fill="#4A534B">
    <text x="30" y="232">Electrical panels</text><text x="296" y="232">Loading bay</text><text x="642" y="232">Control and office</text>
    <text x="474" y="284">Production line</text><text x="30" y="532">Workbenches</text><text x="642" y="420">Storage</text>
  </g>
</svg>`;

function sproutState() {
  if (!S.sprout) S.sprout = {};
  if (!S.tried) S.tried = {};
  return S.sprout;
}

// The current job's tasks placed on the map, with forecast exposure and the choice the worker made when they tried it
function sproutStations() {
  const isMfg = jobKey() === "tech" || jobKey() === "qc";
  if (isMfg) {
    const yi = S.year ?? 2, k = S.pace === "fast" ? 1 : .7;
    return [
      {
        i: 0,
        n: "Quality Inspection",
        key: `${jobKey()}:Quality Inspection`,
        cls: "station-qc",
        zone: "Production line",
        x: 38,
        y: 41,
        e: 0.65 * k,
        fate: "help",
        tried: S.tried[`${jobKey()}:Quality Inspection`],
        sim: D.TASKSIM["Visual inspection"] || {
          now: ["Inspect product for defects manually", "Log findings in system", "Send to supervisor for review"],
          ai: [["ai", "Automated Optical Scan (1,200 parts/hr)"], ["you", "Verify flagged items & calibrate threshold"], ["you", "Root-cause diagnostics and team sign-off"]],
          aiDoes: "Computer vision can identify potential defects and flag them for review, increasing accuracy and speed.",
          youDo: "Verify flagged items, handle exceptions, make final decisions and ensure product quality.",
          setup: "AOI Optical Scanner flags 14 of 200 circuit boards. 3 are marked 'low confidence' due to solder flux glare.",
          ask: "What do you do?",
          opts: [
            ["Recalibrate threshold to 86% and verify continuity with probe.", "best", "Human intervention filters false glare and prevents RM14,000 scrap."],
            ["Accept AI scrap call and discard all 14 boards.", "risk", "Over-reliance on AI scraps healthy boards."],
            ["Halt line for 45 minutes until engineer arrives.", "ok", "Safe, but causes expensive factory downtime."]
          ],
          keep: ["AOI Vision Threshold Tuning", "Electrical Fault Isolation", "Root-Cause Diagnostics"],
          learn: ["AI tools", "Quality analysis", "Problem solving"],
          carries: ["Data dashboards", "Quality visual inspection", "Fault diagnosis"]
        }
      },
      {
        i: 1,
        n: "Machine Operation",
        key: `${jobKey()}:Machine Operation`,
        cls: "station-machine",
        zone: "Automation cell",
        x: 35,
        y: 27,
        e: 0.25 * k,
        fate: "you",
        tried: S.tried[`${jobKey()}:Machine Operation`],
        sim: D.TASKSIM["Machine changeover"] || D.TASKSIM["Equipment start-up check"]
      },
      {
        i: 2,
        n: "Equipment Maintenance",
        key: `${jobKey()}:Equipment Maintenance`,
        cls: "station-maint",
        zone: "Workbench & testing",
        x: 50,
        y: 31,
        e: 0.35 * k,
        fate: "you",
        tried: S.tried[`${jobKey()}:Equipment Maintenance`],
        sim: D.TASKSIM["Fault diagnosis"] || D.TASKSIM["Meter reading"]
      },
      {
        i: 3,
        n: "Production Records",
        key: `${jobKey()}:Production Records`,
        cls: "station-records",
        zone: "Control & office",
        x: 52,
        y: 48,
        e: 0.82 * k,
        fate: "ai",
        tried: S.tried[`${jobKey()}:Production Records`],
        sim: D.TASKSIM["Parameter logging"] || D.TASKSIM["Maintenance logs"]
      }
    ];
  }

  const j = D.JOBS[jobKey()] || D.JOBS.tech;
  const yi = S.year ?? 2, k = S.pace === "fast" ? 1 : .7, used = {};
  return j.tasks.map((t, i) => {
    const sim = D.TASKSIM[t.n] || D.TASKSIM["Visual inspection"];
    const zone = D.ZONES[sim.zone] || D.ZONES.line;
    used[sim.zone] = (used[sim.zone] || 0) + 1;
    const [x, y] = zone.slots[used[sim.zone] - 1] || [38, 41];
    const e = t.e[yi] * k;
    const clses = ["station-qc", "station-machine", "station-maint", "station-records"];
    return { i, n: t.n, key: `${jobKey()}:${t.n}`, cls: clses[i % clses.length], sim, zone: zone.n, x, y, e, fate: D.fate(e), tried: S.tried[`${jobKey()}:${t.n}`] };
  });
}
const isTried = s => s.tried !== undefined;
const sproutCurrent = st => st[Number.isInteger(S.sprout.station) ? Math.min(S.sprout.station, st.length - 1) : 0];

// Each path skill and where the worker's evidence for it comes from (empty: they still need it)
function sproutTransfer(pk, st) {
  const shown = new Map();
  st.filter(isTried).forEach(s => s.sim.carries.forEach(c => { if (!shown.has(c)) shown.set(c, s.n); }));
  return D.PATHS[pk].skills.map(([n, grp]) => {
    const tr = getSkillTrack(n);
    const from = tr === "verified" ? "Certified"
      : tr === "rusty" ? "Certified, needs a refresh"
      : tr === "hidden" ? "From your shift interview"
      : shown.has(n) ? `Shown in the simulator: ${shown.get(n)}` : "";
    return { n, grp, from };
  });
}

function renderSproutSimulator(tabsHtml) {
  const sprout = sproutState();
  const st = sproutStations();
  const cur = sproutCurrent(st);
  const sim = cur.sim;
  const order = ranked();
  const flowTab = sprout.flowTab || "current";
  const subtab = sprout.subtab || "details";
  const expLevel = sprout.exp || "intermediate";
  const zoom = Math.min(175, Math.max(100, sprout.zoom || 100));
  const isSaved = sprout.savedStation === cur.key;
  const triedN = st.filter(isTried).length;
  const kept = [...new Set(st.filter(isTried).flatMap(s => s.sim.keep))];
  const chips = list => list.map(k => `<span class="sprout-skill-chip">${esc(k)}</span>`).join("");
  const who = w => `<span class="sprout-who ${w}">${w === "ai" ? "AI" : "You"}</span>`;

  const headerHtml = `
    <div class="sprout-header">
      <a href="#home" class="sprout-back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        <span>Back to overview</span>
      </a>
      <button class="sprout-save-btn ${isSaved ? "saved" : ""}" data-act="sprout-save-insight" aria-pressed="${isSaved}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="${isSaved ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        <span>${isSaved ? "Insight saved" : "Save insight"}</span>
      </button>
    </div>
    <div class="sprout-title-row">
      <div class="sprout-title-block">
        <h1>How AI Can Affect Your World</h1>
        <p>Step onto the shopfloor, simulate how AI alters your daily tasks in real time, and discover which human skills carry into certified green technology roles.</p>
      </div>
      <div class="sprout-user-card">
        <div class="sprout-user-avatar">${me()}</div>
        <div class="sprout-user-meta">
          <b>${jobName() === "tech" ? "Manufacturing Technician" : jobName()}</b>
          <span>${S.years || 5} years experience</span>
          <span>E&E Manufacturing</span>
        </div>
      </div>
    </div>`;

  const stage = [
    [triedN > 0, "Try a task", `${triedN} of ${st.length} tried`],
    [kept.length > 0, "Understand what stays", kept.length ? `${kept.length} human skills found` : "Try a task to find out"],
    [Boolean(S.path), "Pivot", S.path ? `Chosen: ${pathSub(S.path)}` : "Compare 3 career options"]
  ];
  const nowAt = stage.findIndex(x => !x[0]);
  const stagesHtml = `<ol class="sprout-stages" aria-label="How AI Affects Your World steps">${stage.map(([done, t, sub], i) => `<li class="${done ? "done" : ""} ${i === nowAt ? "now" : ""}"><i>${done ? NAV_ICON.done : i + 1}</i><div><b>${t}</b><span>${sub}</span></div></li>`).join("")}</ol>`;

  // 3D Isometric Factory Floor Viewport with exact Hotspot Badges
  const viewportHtml = `
    <div class="sprout-viewport ${sprout.rotated ? "is-rotated" : ""}" id="sprout-viewport">
      <div class="sprout-canvas-wrapper">
        <div class="sprout-canvas" style="--zoom:${zoom / 100};position:relative;width:100%;aspect-ratio:1536/900;overflow:hidden">
          <img src="photos/sprout/sprout_factory_floor.jpg" alt="Interactive 3D Manufacturing Factory Floor" class="sprout-floor-img">
          ${st.map(s => `
            <button class="sprout-hotspot-badge ${s.cls || "station-qc"} ${s === cur ? "active" : ""}" style="left:${s.x}%;top:${s.y}%" data-act="sprout-station" data-v="${s.i}" aria-label="${esc(s.n)}">
              <span class="badge-num">${s.i + 1}</span>
              <span class="badge-label">${esc(s.n)}</span>
            </button>
          `).join("")}
        </div>
      </div>
      <div class="sprout-viewport-ctrls">
        <button class="sprout-ctrl-btn" data-act="sprout-rotate" aria-pressed="${Boolean(sprout.rotated)}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
          <span>${sprout.rotated ? "Flat View" : "3D Rotate View"}</span>
        </button>
        <div class="sprout-ctrl-right">
          <div class="sprout-zoom-group" role="group" aria-label="Zoom">
            <button class="sprout-zoom-btn" data-act="sprout-zoom-out" aria-label="Zoom out" ${zoom <= 100 ? "disabled" : ""}>&minus;</button>
            <span class="sprout-zoom-label">${zoom}%</span>
            <button class="sprout-zoom-btn" data-act="sprout-zoom-in" aria-label="Zoom in" ${zoom >= 175 ? "disabled" : ""}>+</button>
          </div>
          <button class="sprout-ctrl-btn" data-act="sprout-fullscreen" aria-label="Full screen">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
          </button>
        </div>
      </div>
    </div>`;

  let flowContentHtml;
  if (flowTab === "current") {
    flowContentHtml = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">
        <div class="sprout-v-step-card">
          <img src="photos/sprout/workflow_inspect_sample.jpg" class="sprout-v-step-img" alt="Inspect sample">
          <div class="sprout-v-step-body">
            <b>1 Inspect sample</b>
            <p>Check product for defects manually</p>
          </div>
        </div>
        <div class="sprout-v-step-card">
          <img src="photos/sprout/workflow_record_result.jpg" class="sprout-v-step-img" alt="Record result">
          <div class="sprout-v-step-body">
            <b>2 Record result</b>
            <p>Log findings in system</p>
          </div>
        </div>
        <div class="sprout-v-step-card">
          <img src="photos/sprout/workflow_escalate.jpg" class="sprout-v-step-img" alt="Escalate if needed">
          <div class="sprout-v-step-body">
            <b>3 Escalate if needed</b>
            <p>Send to supervisor for review</p>
          </div>
        </div>
      </div>`;
  } else if (flowTab === "ai") {
    flowContentHtml = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">
        <div class="sprout-v-step-card">
          <img src="photos/sprout/workflow_ai_scan.jpg" class="sprout-v-step-img" alt="AI optical scan">
          <div class="sprout-v-step-body">
            <b>1 Automated Optical Scan</b>
            <p>Vision camera inspects 1,200 parts/hr</p>
          </div>
        </div>
        <div class="sprout-v-step-card">
          <img src="photos/sprout/workflow_ai_verify.jpg" class="sprout-v-step-img" alt="Verify and threshold">
          <div class="sprout-v-step-body">
            <b>2 Human Verify & Threshold</b>
            <p>Technician handles low-confidence flags</p>
          </div>
        </div>
        <div class="sprout-v-step-card">
          <img src="photos/sprout/workflow_ai_root_cause.jpg" class="sprout-v-step-img" alt="Root cause">
          <div class="sprout-v-step-body">
            <b>3 Root-Cause Analysis</b>
            <p>Isolate electrical faults and prevent scrap</p>
          </div>
        </div>
      </div>`;
  } else {
    flowContentHtml = `<div class="sprout-comp-grid">
      <div class="sprout-comp-col"><h4>Today (Manual)</h4><ol>${sim.now.map(t => `<li>${esc(t)}</li>`).join("")}</ol></div>
      <div class="sprout-comp-col"><h4>With AI Vision Systems</h4><ol>${sim.ai.map(([w, t]) => `<li>${esc(t)} ${who(w)}</li>`).join("")}</ol></div>
      <div class="sprout-comp-summary">${ICON_INFO}<div><strong>AI takes:</strong> ${esc(sim.aiDoes)}<br><strong>You keep:</strong> ${esc(sim.youDo)}</div></div>
    </div>`;
  }

  const bottomPanelHtml = `
    <section class="sprout-workflow-panel" aria-labelledby="sprout-flow-t">
      <h2 class="sr" id="sprout-flow-t">How ${esc(cur.n.toLowerCase())} gets done</h2>
      <div class="sprout-panel-tabs" role="tablist">
        ${[["current", "Current Workflow"], ["ai", "AI-Assisted Workflow"], ["comparison", "Comparison"]].map(([id, n]) => `<button class="sprout-tab-btn ${flowTab === id ? "active" : ""}" role="tab" aria-selected="${flowTab === id}" data-act="sprout-flow-tab" data-v="${id}">${n}</button>`).join("")}
      </div>
      <div class="sprout-steps-container">
        <div>${flowContentHtml}</div>
        <div class="sprout-scenario-box">
          <div class="sprout-scenario-head">
            <div class="sprout-scenario-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div>
            <div>
              <h4>Simulation Scenario</h4>
              <p><b>AI-assisted inspection:</b> Activate the vision system to see how the workflow changes.</p>
            </div>
          </div>
          <div>
            <span style="font-size:13px;font-weight:700;color:var(--ink-2)">Your Experience Level:</span>
            <div class="sprout-exp-group">
              <button class="sprout-exp-btn ${expLevel === "beginner" ? "active" : ""}" data-act="sprout-exp" data-v="beginner">Beginner</button>
              <button class="sprout-exp-btn ${expLevel === "intermediate" ? "active" : ""}" data-act="sprout-exp" data-v="intermediate">Intermediate</button>
              <button class="sprout-exp-btn ${expLevel === "advanced" ? "active" : ""}" data-act="sprout-exp" data-v="advanced">Advanced</button>
            </div>
          </div>
          <div class="sprout-scenario-note" style="margin-top:10px">${ICON_INFO}<span>This is a simulated scenario. Actual work may vary based on your workplace and tools.</span></div>
        </div>
      </div>
    </section>`;

  let rightSubtabHtml;
  if (subtab === "details") {
    rightSubtabHtml = `
      <div class="sprout-info-rows">
        <div class="sprout-info-row"><div class="sprout-row-icon ai">AI</div><div class="sprout-row-body"><strong>How AI helps</strong><p>${esc(sim.aiDoes)}</p></div></div>
        <div class="sprout-info-row"><div class="sprout-row-icon you">You</div><div class="sprout-row-body"><strong>Human contribution</strong><p>${esc(sim.youDo)}</p></div></div>
        <div class="sprout-meter">
          <div class="sprout-meter-row"><span>Exposure level</span><b style="color:var(--sun)">Partial</b></div>
          <div class="sprout-bar help"><i style="width:65%"></i></div>
          <div class="sprout-meter-row" style="margin-top:10px"><span>Confidence</span><b style="color:var(--forest)">Medium</b></div>
          <div class="sprout-bar you"><i style="width:75%"></i></div>
        </div>
        <div><strong class="sprout-sub">Key skills to develop</strong><div class="sprout-skills-chips">${chips(["AI tools", "Quality analysis", "Problem solving"])}</div></div>
      </div>`;
  } else if (subtab === "sim") {
    rightSubtabHtml = `
      <div class="sprout-panel-box">
        <h4>${isTried(cur) ? "Simulation Completed" : "Interactive AOI Scanner Station"}</h4>
        <p>${esc(sim.setup)}</p>
        ${isTried(cur) ? `<div style="background:var(--leaf-soft);border-radius:10px;padding:10px;font-weight:700;color:var(--forest)">✓ Credential Stamped in Skills Passport</div>` : ""}
        <button class="btn small" data-act="sprout-open-sim">${isTried(cur) ? "Re-run simulation" : "Start simulation"}</button>
      </div>`;
  } else {
    const card = D.TASKCARDS.find(c => c.n === cur.n || sim.carries.includes(c.n));
    rightSubtabHtml = `
      <div class="sprout-panel-box">
        <h4>Standards & Validation Evidence</h4>
        <div><b>Occupational standard:</b> ${card ? `${esc(card.n)}, NOSS ${esc(card.noss)}` : "NOSS EE-320-3: Quality Optical Systems"}</div>
        <div><b>Malaysian industry:</b> E&E Manufacturing (Penang & Kulim High-Tech Corridor)</div>
        <div><b>Skills Passport stamp:</b> ${S.passportStamps.some(p => p.source.includes("Job world")) ? "Awarded ✓" : "Pending simulation completion"}</div>
      </div>`;
  }

  // Exact 3 Career Opportunities Cards with matching images
  const careerCardsData = [
    { id: "stay", name: "Quality Control Specialist", sub: "Similar role", match: 78, img: "photos/sprout/pivot_qc_specialist.jpg" },
    { id: "evolve", name: "Solar Panel Technician", sub: "Pivot option", match: 62, img: "photos/sprout/pivot_solar_tech.jpg" },
    { id: "pivot", name: "EV Battery Technician", sub: "Pivot option", match: 58, img: "photos/sprout/pivot_ev_battery.jpg" }
  ];

  const careersHtml = careerCardsData.map(c => `
    <button class="sprout-pivot-card ${S.path === c.id ? "on" : ""}" data-act="sprout-open-pivot" data-v="${c.id}">
      <span class="sprout-pivot-avatar"><img src="${c.img}" alt="${c.name}"></span>
      <span class="sprout-pivot-info"><b>${c.name}</b><span>${c.sub}</span></span>
      <span class="sprout-match-badge" style="display:inline-flex;align-items:center;gap:4px">
        Match ${c.match}%
        <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 12l8-8M6 4h6v6"/></svg>
      </span>
    </button>
  `).join("");

  const inspectorCardHtml = `
    <section class="sprout-inspector-card" aria-labelledby="sprout-insp-t">
      <div class="sprout-inspector-header">
        <div class="sprout-task-title-group">
          <span class="sprout-task-num">${cur.i + 1}</span>
          <h2 id="sprout-insp-t">${esc(cur.n)}</h2>
          <span class="sprout-ai-badge" style="background:var(--leaf-soft);color:var(--forest)">AI-assisted</span>
        </div>
      </div>
      <p class="sprout-inspector-sub">Inspect products, detect defects and ensure quality standards.</p>
      <div class="sprout-subtabs" role="tablist">
        ${[["details", "Task Details"], ["sim", "Simulation"], ["evidence", "Evidence"]].map(([id, n]) => `<button class="sprout-subtab-btn ${subtab === id ? "active" : ""}" role="tab" aria-selected="${subtab === id}" data-act="sprout-subtab" data-v="${id}">${n}</button>`).join("")}
      </div>
      ${rightSubtabHtml}
      <div class="sprout-try-card">
        <div class="sprout-try-header">
          <div class="sprout-play-circle" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 16 16"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg></div>
          <div>
            <b>Try the simulation</b>
            <p>See how AI changes this task in real time, and what new skills you build.</p>
          </div>
        </div>
        <div class="sprout-try-btns">
          <button class="btn small" data-act="sprout-open-sim" style="background:var(--forest);color:#fff">▶ Start Simulation &rarr;</button>
          <button class="btn ghost small" data-act="sprout-flow-tab" data-v="comparison">☷ Compare Workflows</button>
        </div>
      </div>
    </section>
    <section class="sprout-pivots-section" aria-labelledby="sprout-piv-t">
      <div class="sprout-pivots-head">
        <h2 class="sprout-pivots-title" id="sprout-piv-t">Career Opportunities</h2>
        <a href="#paths" class="sprout-pivots-all">View all &rarr;</a>
      </div>
      <p class="sprout-fine" style="margin-top:-6px;margin-bottom:12px">This task connects to green economy roles.</p>
      <div class="sprout-pivot-cards">${careersHtml}</div>
    </section>`;

  const modalHtml = sprout.activeModal === "sim" ? renderSproutSimModal(cur) : sprout.activeModal === "pivot" ? renderSproutPivotModal(st) : "";

  // Step 2 Guided Footer strictly following the requested sequence
  const journeyBannerHtml = `
    <div class="sprout-journey-banner">
      <div>
        <span class="sprout-journey-badge">Step 3 of 6: How AI Affects Your World</span>
        <div class="sprout-journey-body">
          <h4>Run the AOI Vision Scanner simulation, discover valuable human skills (fault isolation, vision threshold tuning), and proceed via:</h4>
          <p>Complete the interactive inspection to earn your verifiable Skills Passport stamp, then compare your realistic green career pivots.</p>
        </div>
      </div>
      <div class="row" style="gap:12px;flex-wrap:wrap">
        <button class="sprout-journey-cta secondary" data-act="sprout-open-sim">Run AOI Simulator</button>
        <a href="#paths" class="sprout-journey-cta">
          <span>Step 4: Choose Your Path</span>
          <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h12M11 5l5 5-5 5"/></svg>
        </a>
      </div>
    </div>`;

  return `
    <div class="sprout-container">
      ${headerHtml}
      ${stagesHtml}
      ${tabsHtml}
      <div class="sprout-main-grid">
        <div class="sprout-left-col">${viewportHtml}${bottomPanelHtml}</div>
        <div class="sprout-right-col">${inspectorCardHtml}</div>
      </div>
      ${journeyBannerHtml}
      ${modalHtml}
    </div>`;
}

function renderSproutSimModal(cur) {
  const sim = cur.sim;
  const simStep = S.sprout.simStep || "interactive";
  const threshold = S.sprout.aoiThreshold !== undefined ? S.sprout.aoiThreshold : 94;
  const probe = S.sprout.aoiProbe || "tp1";
  const isCalibrated = threshold >= 84 && threshold <= 88;

  let bodyHtml;

  if (simStep === "intro") {
    bodyHtml = `
      <div class="sprout-sim-stage">
        <div class="sprout-sim-hud"><span>${esc(cur.zone)}</span><span>AOI Optical Line 04</span></div>
        <p>With AI Automated Optical Inspection deployed on the shopfloor, here is how the workflow is split:</p>
        <ol class="sprout-sim-flow">
          <li><span class="sprout-who ai">AI</span> High-speed camera inspects 1,200 boards/hour against CAD defect models.</li>
          <li><span class="sprout-who you">You</span> Low-angle solder flux glare creates false reject alerts (68% confidence). You isolate faults and tune the vision threshold.</li>
          <li><span class="sprout-who you">You</span> Confirm electrical continuity with a digital multimeter before clearing the production line.</li>
        </ol>
        <button class="btn small" data-act="sprout-sim-step" data-v="interactive">Launch Scanner Station &rarr;</button>
      </div>`;
  } else if (simStep === "interactive") {
    bodyHtml = `
      <div class="aoi-console">
        <div class="aoi-screen">
          <div class="aoi-laser"></div>
          <svg class="aoi-pcb-svg" viewBox="0 0 800 340">
            <rect width="800" height="340" fill="#0C1410"/>
            <g stroke="#1A2D22" stroke-width="1.5">
              ${Array.from({ length: 16 }, (_, i) => `<line x1="${i * 50}" y1="0" x2="${i * 50}" y2="340"/>`).join("")}
              ${Array.from({ length: 8 }, (_, i) => `<line x1="0" y1="${i * 45}" x2="800" y2="${i * 45}"/>`).join("")}
            </g>
            <path d="M40 80h160v120h80v-40h120v100h200v-80h120" stroke="#2C7A4F" stroke-width="3" fill="none" opacity=".8"/>
            <path d="M120 280h140v-60h160v40h100" stroke="#2C7A4F" stroke-width="2.5" fill="none" opacity=".7"/>
            <rect x="260" y="80" width="130" height="110" rx="8" fill="#15241B" stroke="#3A5E48" stroke-width="2"/>
            <text x="325" y="140" fill="#7BAE5E" font-size="16" font-family="monospace" font-weight="bold" text-anchor="middle">IC-04 (SOC)</text>
            <circle cx="280" cy="100" r="4" fill="#F2C230"/>
            <circle cx="280" cy="165" r="4" fill="#7BAE5E"/>
            <rect x="520" y="110" width="100" height="80" rx="6" fill="#15241B" stroke="#3A5E48" stroke-width="2"/>
            <text x="570" y="155" fill="#7BAE5E" font-size="14" font-family="monospace" text-anchor="middle">VRM-02</text>
            <circle cx="430" cy="135" r="7" fill="${probe === "tp1" ? "#7BAE5E" : "#3A5E48"}"/>
            <text x="430" y="120" fill="#CCD8CE" font-size="11" font-family="monospace" text-anchor="middle">TP-1</text>
            <circle cx="470" cy="135" r="7" fill="${probe === "tp2" ? "#7BAE5E" : "#3A5E48"}"/>
            <text x="470" y="120" fill="#CCD8CE" font-size="11" font-family="monospace" text-anchor="middle">TP-2</text>
          </svg>
          <div class="aoi-target-box ${isCalibrated ? "calibrated" : ""}" style="left:31%;top:20%;width:24%;height:44%">
            <span class="aoi-target-tag">${isCalibrated ? "PASS: GLARE FILTERED (98%)" : "DEFECT ALERT: SOLDER CRACK? (68%)"}</span>
          </div>
          <div class="aoi-hud-overlay">
            <div class="aoi-hud-row">
              <span class="aoi-hud-pill">CAM-04 · 120 FPS HIGH SPEED</span>
              <span class="aoi-hud-pill ${isCalibrated ? "" : "warn"}">AI CONFIDENCE: ${isCalibrated ? "98% (STABLE)" : threshold + "% (UNCERTAIN)"}</span>
            </div>
            <div class="aoi-hud-row">
              <span class="aoi-hud-pill">FEED: 1,200 UNITS / HR</span>
              <span class="aoi-hud-pill ${isCalibrated ? "" : "danger"}">${isCalibrated ? "LINE RUNNING · 100% YIELD" : "FALSE REJECT RISK"}</span>
            </div>
          </div>
        </div>

        <div class="aoi-telemetry-row">
          <div class="aoi-tele-card">
            <span>THROUGHPUT</span>
            <b>1,200 pcs/hr</b>
          </div>
          <div class="aoi-tele-card ${isCalibrated ? "" : "alert"}">
            <span>AI SENSITIVITY</span>
            <b>${threshold}% ${isCalibrated ? "(Optimal)" : "(Over-tuned)"}</b>
          </div>
          <div class="aoi-tele-card">
            <span>SELECTED PROBE</span>
            <b>${probe === "tp1" ? "TP-1: 0.02 Ω" : "TP-2: 3.31 V"}</b>
          </div>
          <div class="aoi-tele-card ${isCalibrated ? "" : "alert"}">
            <span>SCRAP AVOIDANCE</span>
            <b>${isCalibrated ? "RM14,000 Saved" : "At Risk"}</b>
          </div>
        </div>

        <div class="aoi-controls-card">
          <div>
            <div class="aoi-slider-header">
              <b>Vision Sensitivity Threshold (Optimal Band: 84% – 88%)</b>
              <span>${threshold}%</span>
            </div>
            <div class="aoi-slider-track-wrap" style="margin-top:10px">
              <input type="range" min="70" max="100" value="${threshold}" data-act="sprout-aoi-threshold" style="width:100%;accent-color:#7BAE5E">
            </div>
            <div style="font-size:12px;color:#8E9F92;margin-top:4px;display:flex;justify-content:space-between">
              <span>70% (Under-filtered)</span>
              <span style="color:#7BAE5E;font-weight:700">84% - 88% (Target Glare Filter Zone)</span>
              <span>100% (High false-alarm)</span>
            </div>
          </div>

          <div>
            <span style="font-size:13px;font-weight:700;display:block;margin-bottom:8px">Multimeter Hardware Test Points:</span>
            <div class="aoi-probe-toggles">
              <button class="aoi-probe-btn ${probe === "tp1" ? "active" : ""}" data-act="sprout-aoi-probe" data-v="tp1">Probe TP-1 (GND Continuity: 0.02 Ω - Pass)</button>
              <button class="aoi-probe-btn ${probe === "tp2" ? "active" : ""}" data-act="sprout-aoi-probe" data-v="tp2">Probe TP-2 (VCC Pin Bias: 3.31 V - Normal)</button>
            </div>
            <p style="font-size:13px;color:#8E9F92;margin:8px 0 0">Multimeter proves the circuit is physically intact. Solder flux reflection fooled the optical camera.</p>
          </div>

          <div class="aoi-action-btns">
            <button class="aoi-btn primary" data-act="sprout-aoi-solve" data-v="recalibrate">
              <b>Recalibrate & Clear Line</b>
              <span>Tune threshold to 86%, clear false alert, protect yield</span>
            </button>
            <button class="aoi-btn danger" data-act="sprout-aoi-solve" data-v="scrap">
              <b>Accept AI Scrap Call</b>
              <span>Discard 14 circuit boards (RM6,300 loss)</span>
            </button>
            <button class="aoi-btn" data-act="sprout-aoi-solve" data-v="halt">
              <b>Halt Production Line</b>
              <span>Wait 45 minutes for shift engineer</span>
            </button>
          </div>
        </div>
      </div>`;
  } else {
    const outcome = S.sprout.simResult || "recalibrate";
    const isGood = outcome === "recalibrate";

    bodyHtml = `
      <div class="sprout-feedback ${isGood ? "v-best" : "v-risk"}" role="status">
        <h3>${isGood ? "Good Call: 100% Factory Yield Protected" : "Sub-Optimal: Unnecessary Scrap / Downtime"}</h3>
        <p>${isGood ? "You recognized that the AI optical inspection system was fooled by low-angle solder flux glare. By cross-checking electrical continuity with digital multimeter probe TP-1 and tuning the vision filter threshold to 86%, you prevented 14 perfectly good circuit boards from being scrapped without a single minute of line downtime." : "Blindly accepting the AI camera's scrap call caused RM6,300 in false component waste. Real-world machine vision requires human domain expertise to tune thresholds."}</p>
        
        <div style="background:var(--paper);border:1.5px solid var(--forest);border-radius:14px;padding:16px;margin:10px 0">
          <div style="display:flex;align-items:center;gap:10px">
            <span class="pill pill--check" style="background:var(--forest);color:#fff">Skills Passport Credential Earned</span>
            <b>AOI Vision Scanner: Fault Isolation & Threshold Calibration</b>
          </div>
          <p style="font-size:14px;color:var(--ink-2);margin:6px 0 0">Verified in Skills Passport ledger (JPK NOSS EE-320-3 aligned). Ready for employer export.</p>
        </div>

        <div>
          <strong>Valuable Human Skills Discovered:</strong>
          <div class="sprout-skills-chips">
            <span class="sprout-skill-chip">${NAV_ICON.done} AOI Vision Threshold Tuning</span>
            <span class="sprout-skill-chip">${NAV_ICON.done} Electrical Fault Isolation</span>
            <span class="sprout-skill-chip">${NAV_ICON.done} Root-Cause Diagnostics</span>
          </div>
        </div>

        <div style="margin-top:12px">
          <strong>Direct Transfer to Realistic Malaysian Career Pivots:</strong>
          <div class="aoi-pivots-preview">
            <div class="aoi-pivot-box">
              <span class="match">88% MATCH</span>
              <b>QC Specialist</b>
              <span>Optical threshold tuning & ISO 9001 quality audit</span>
            </div>
            <div class="aoi-pivot-box">
              <span class="match">84% MATCH</span>
              <b>Solar PV Technician</b>
              <span>Inverter diagnostic probe isolation uses exact same continuity logic</span>
            </div>
            <div class="aoi-pivot-box">
              <span class="match">82% MATCH</span>
              <b>EV Battery Technician</b>
              <span>Battery Management System (BMS) cell anomaly triage</span>
            </div>
          </div>
        </div>

        <div class="sprout-feedback-act" style="margin-top:16px">
          <a href="#paths" class="btn" style="background:var(--forest);color:#fff;text-decoration:none">Step 4: Choose Your Path &rarr;</a>
          <button class="btn ghost small" data-act="sprout-sim-step" data-v="interactive">Re-run Scanner</button>
          <button class="btn ghost small" data-act="sprout-close-modal">Back to Workplace</button>
        </div>
      </div>`;
  }

  return `
    <div class="sprout-modal-backdrop" data-act="sprout-backdrop">
      <div class="sprout-modal-panel wide" role="dialog" aria-modal="true" aria-labelledby="sprout-sim-title">
        <div class="sprout-modal-top">
          <div>
            <span class="tag tag--sample">Simulated Shift Workstation · AOI Vision Scanner</span>
            <h2 id="sprout-sim-title">${esc(cur.n)}: Industrial AI Simulation</h2>
          </div>
          <button class="sprout-modal-close" data-act="sprout-close-modal" aria-label="Close">&times;</button>
        </div>
        ${bodyHtml}
      </div>
    </div>`;
}

function renderSproutPivotModal(st) {
  const pk = D.PATHS[S.sprout.activePivotId] ? S.sprout.activePivotId : ranked()[0];
  const P = D.PATHS[pk], eng = runEngine(pk), tf = sproutTransfer(pk, st);
  const have = tf.filter(x => x.from), need = tf.filter(x => !x.from);
  const steps = eng ? eng.steps : [];
  const hours = steps.reduce((n, s) => n + s.hours, 0);

  return `
    <div class="sprout-modal-backdrop" data-act="sprout-backdrop">
      <div class="sprout-modal-panel wide" role="dialog" aria-modal="true" aria-labelledby="sprout-pivot-title">
        <div class="sprout-modal-top">
          <div><span class="tag tag--real">${P.name}: ${pk === "stay" ? "Similar role" : "Pivot option"}</span><h2 id="sprout-pivot-title">${esc(pathSub(pk))}</h2></div>
          <button class="sprout-modal-close" data-act="sprout-close-modal" aria-label="Close">&times;</button>
        </div>
        <div class="sprout-pivot-banner">
          <img src="${P.photo}" alt="${esc(P.alt)}">
          <div class="sprout-pivot-banner-in">
            <div><span>Job growth: ${esc(P.growth)}</span><h3>${esc(pathSub(pk))}</h3></div>
            <div class="sprout-banner-match"><b>${Math.round(computePathMatch(pk).total)}%</b><span>Match</span></div>
          </div>
        </div>
        <div class="sprout-pivot-facts">
          <div><span>Monthly pay</span><b>${rm(P.pay[0])} to ${rm(P.pay[1])}</b></div>
          <div><span>Time to get there</span><b>${eng ? Math.ceil(eng.totalMonths) : "?"} months</b><em>${hours} training hours at ${S.hours} hours a week</em></div>
          <div><span>You pay</span><b>${rm(eng ? eng.netCost : P.cost)}</b><em>${S.hrdLevy ? "After HRD Corp claims" : "Before any subsidy"}</em></div>
        </div>
        <div class="sprout-skills-compare">
          <div class="sprout-skill-box transferable">
            <h4>Skills you bring (${have.length} of ${tf.length})</h4>
            ${have.length ? `<ul class="sprout-skill-list">${have.map(x => `<li><b>${esc(x.n)}</b><span>${esc(x.from)}</span></li>`).join("")}</ul>` : `<p class="sprout-fine">None yet. Try more tasks or finish your skills check.</p>`}
          </div>
          <div class="sprout-skill-box missing">
            <h4>Skills you would need (${need.length})</h4>
            ${need.length ? `<ul class="sprout-skill-list">${need.map(x => `<li><b>${esc(x.n)}</b><span class="${x.grp === "law" ? "law" : ""}">${D.GROUP[x.grp]}</span></li>`).join("")}</ul>` : `<p class="sprout-fine">Nothing missing.</p>`}
          </div>
        </div>
        <div class="sprout-reskilling-roadmap">
          <h4>Reskilling steps</h4>
          ${steps.length ? steps.map((s, i) => `<div class="sprout-roadmap-step"><span class="sprout-step-circle">${i + 1}</span><div><b>${esc(s.name)}</b><span>${esc(s.why || "")}</span></div><div class="sprout-roadmap-cost"><b>${s.fee ? rm(s.fee) : "Free"}</b><span>${s.hours} hours</span></div></div>`).join("") : `<p class="sprout-fine">No courses needed.</p>`}
          ${eng && eng.licenceBlockedByBudget ? `<p class="broken-bridge">${esc(eng.licenceBlockReason || "A licence costs more than your budget allows.")}</p>` : ""}
        </div>
        <div class="sprout-modal-act">
          ${S.path === pk ? `<a class="btn" href="#plan">Open my plan</a>` : `<button class="btn" data-act="sprout-apply-pivot" data-v="${pk}">Choose this path</button>`}
          <button class="btn ghost" data-act="sprout-close-modal">Back to workplace</button>
        </div>
      </div>
    </div>`;
}

