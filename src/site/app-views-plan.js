/* BijakMatch: AI impact, paths (with gate), courses, plan views.
   Classic script; shares one global scope with the other app-*.js files (load order in index.html). */
/* ---------- VIEW: AI JOB IMPACT (SPROUT JOB WORLD) ---------- */
V.impact = () => {
  let tab = tabOf("impact", "simulator");
  if (!["simulator", "tasks", "history"].includes(tab)) tab = S.tab.impact = "simulator";
  const tabsHtml = tabs("impact", [["simulator", "How AI Affects Your World"], ["tasks", "Task AI analysis"], ["history", "Historical automation"]]);
  if (tab === "simulator") return renderSproutSimulator(tabsHtml);

  let body;
  if (tab === "history") {
    body = `<div class="thennow" id="tn" style="--x:50%"><img src="photos/old-production-line.webp" alt="Old factory line">
      <img class="now" src="photos/cutting-machine.webp" alt="Automated machine">
      <span class="pill" style="left:16px">Past: Manual logging</span><span class="pill" style="right:16px">Now: Automated telemetry</span>
      <div class="handle"></div><input type="range" min="0" max="100" value="50" aria-label="Compare" data-act="tn"></div>
      <div class="tl" style="margin-top:20px">${D.HISTORY.map(h => `<div><b>${h.y}</b><span>${h.n}</span><em>${h.t}</em></div>`).join("")}</div>`;
  } else {
    const yi = S.year ?? 2, years = [2026, 2028, 2030], k = S.pace === "fast" ? 1 : .7;
    const j = D.JOBS[S.job || "tech"];
    const rows = (j ? j.tasks : D.JOBS.tech.tasks).map(t => ({ n: t.n, e: t.e[yi] * k })).sort((a, b) => b.e - a.e);
    const cnt = f => rows.filter(r => D.fate(r.e) === f).length;

    body = `<div class="row" style="justify-content:space-between;margin-bottom:16px">
      <div class="row"><div class="switch" role="group" aria-label="Forecast year">${years.map((y, i) => `<button data-act="sprout-year" data-v="${i}" aria-pressed="${i === yi}">${y}</button>`).join("")}</div>
      <div class="switch" role="group" aria-label="Pace"><button data-act="sprout-pace" data-v="steady" aria-pressed="${S.pace !== "fast"}">Steady pace (70%)</button><button data-act="sprout-pace" data-v="fast" aria-pressed="${S.pace === "fast"}">Fast pace (100%)</button></div></div>
      <span class="tag tag--estimate">ILO / AEI Model</span></div>
      <div class="sumrow"><div><b style="color:var(--clay)">${cnt("ai")}</b>Done by AI</div><div><b>${cnt("help")}</b>AI helps, you lead</div><div><b style="color:var(--forest)">${cnt("you")}</b>Stays with you</div></div>
      <div class="tasks">${rows.map(r => `<div class="task"><b>${r.n}</b><div class="ex"><i style="width:${r.e * 100}%"></i></div><span class="fate ${D.fate(r.e)}">${D.FATE[D.fate(r.e)]}</span></div>`).join("")}</div>`;
  }

  return `${pageHead("How AI Can Affect Your World", `${jobName()}: which tasks AI takes over, which it helps with, and which stay with you.`)}${tabsHtml}${body}`;
};

V.world = V.impact;
V.jobworld = V.impact;

/* ---------- VIEW: CHOOSE YOUR PATH (DECIDE) ---------- */
/* Paths need both a skills profile and the worker's time and budget, so a ranking is never built on defaults. */
function pathsMissing() {
  const missing = [];
  if (!S.interviewTasks.some(t => t.kept) && !S.certsHeld.length) {
    missing.push({ href: "#skills", tab: "skills:interview", title: "Show your skills", why: "Paths are scored on the tasks you really do. Take the shift interview or load the sample interview.", cta: "Go to the shift interview" });
  }
  if (!S.done.time) {
    missing.push({ href: "#profile", tab: "profile:time", title: "Set your time and budget", why: "Careers are ranked by what fits your week and your wallet. RM0 is a fine answer.", cta: "Set time and budget" });
  }
  return missing;
}

V.paths = () => {
  const missing = pathsMissing();
  if (missing.length) {
    return `${pageHead("Before we suggest a career", "We need two things first, so the ranking is about you and not a default.")}
      <div class="panel" style="display:grid;gap:16px;max-width:760px">
        ${missing.map(m => `<div class="row" style="justify-content:space-between;gap:18px;flex-wrap:wrap">
          <div><b style="font-size:18px">${m.title}</b><p class="muted small" style="margin:4px 0 0">${m.why}</p></div>
          <a class="btn" href="${m.href}" data-tab="${m.tab}">${m.cta}</a></div>`).join("")}
      </div>`;
  }
  const tab = tabOf("dd", "compare");
  const order = ranked();
  const sel = S.sel || S.path || order[0];
  const P = D.PATHS[sel];

  // Control bar covering "The World" vs "Your Conditions"
  const controlBar = `<div class="control-bar">
    <div class="control-group">
      <span class="title">The World (External)</span>
      <div class="switch" role="group" aria-label="Scenario">
        <button data-act="set-scen" data-v="moderate" aria-pressed="${S.scenario !== "accelerated"}">Moderate (AEI)</button>
        <button data-act="set-scen" data-v="accelerated" aria-pressed="${S.scenario === "accelerated"}">Accelerated (ILO)</button>
      </div>
      <div class="switch" role="group" aria-label="SDG Priority">
        <button data-act="set-sdg" data-v="sdg4_8" aria-pressed="${S.sdgPriority !== "sdg7"}">SDG 4 & 8 (Skills/Jobs)</button>
        <button data-act="set-sdg" data-v="sdg7" aria-pressed="${S.sdgPriority === "sdg7"}">SDG 7 (Clean Energy)</button>
      </div>
    </div>
    <div class="control-group">
      <span class="title">Your Conditions</span>
      <div class="switch" role="group" aria-label="Goal">
        <button data-act="goal" data-v="income" aria-pressed="${S.goal === "income"}">Higher income</button>
        <button data-act="goal" data-v="quick" aria-pressed="${S.goal === "quick"}">Quick move</button>
      </div>
      <button class="btn small" data-act="open-roi" data-p="${sel}">Salary Lift & ROI</button>
    </div>
  </div>`;

  let content = "";

  if (tab === "compare") {
    const card = pKey => {
      const match = computePathMatch(pKey);
      const isTop = pKey === order[0];
      const isChosen = S.path === pKey;
      const eng = match.engine;
      const win = match.window;
      const intVal = (S.interests && S.interests[pKey]) || "maybe";
      const roi = computeROI(pKey);

      return `<div class="pcard ${isTop ? "best" : ""}" id="pc-${pKey}">
        <div class="pic">
          <img src="${D.PATHS[pKey].photo}" alt="${D.PATHS[pKey].alt}">
          <span class="best-tag">Rank 1 Best Fit</span>
          ${eng && eng.licenceBlockedByBudget ? `<div class="broken-bridge" style="position:absolute;bottom:10px;left:10px;z-index:2">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 19h16v2H4zm14-8v6h-2v-6c0-.55-.45-1-1-1s-1 .45-1 1v6h-2v-6c0-1.66 1.34-3 3-3s3 1.34 3 3zm-8 6h-2V7c0-1.66 1.34-3 3-3s3 1.34 3 3v2.18c-.61-.11-1.28-.18-2-.18-1.5 0-2.88.5-4 1.35z"/></svg>
            Budget Blocked Without Subsidy</div>` : ""}
          ${me({ suit: D.PATHS[pKey].suit, cls: "happy", tool: D.PATHS[pKey].tool })}
        </div>

        <div class="body">
          <div class="head">
            <div><h3 style="margin:0">${D.PATHS[pKey].name}</h3><span class="muted small">${pathSub(pKey)}</span></div>
            <div class="score"><b data-n="${match.total}">${match.total}</b><span>Match</span></div>
          </div>

          <div class="breakdown-box">
            <div class="breakdown-row"><span>Task overlap</span><div class="breakdown-bar"><i style="width:${(match.parts.overlap / match.maxParts.overlap) * 100}%"></i></div><b>${Math.round(match.parts.overlap)}<span>/${match.maxParts.overlap}</span></b></div>
            <div class="breakdown-row"><span>Market demand</span><div class="breakdown-bar"><i style="width:${(match.parts.demand / match.maxParts.demand) * 100}%"></i></div><b>${Math.round(match.parts.demand)}<span>/${match.maxParts.demand}</span></b></div>
            <div class="breakdown-row"><span>Your interest</span><div class="breakdown-bar"><i style="width:${(match.parts.interest / match.maxParts.interest) * 100}%"></i></div><b>${Math.round(match.parts.interest)}<span>/${match.maxParts.interest}</span></b></div>
            <div class="breakdown-row"><span>Ease of move</span><div class="breakdown-bar"><i style="width:${(match.parts.ease / match.maxParts.ease) * 100}%"></i></div><b>${Math.round(match.parts.ease)}<span>/${match.maxParts.ease}</span></b></div>
            <div class="breakdown-row"><span>SDG Priority</span><div class="breakdown-bar"><i style="width:${(match.parts.sdgBonus / 8) * 100}%"></i></div><b>+${Math.round(match.parts.sdgBonus)}<span>/8</span></b></div>
          </div>

          <div class="row small" style="justify-content:space-between">
            <div>Window: <b>${win.label}</b> • Conf: <b>${win.conf}</b></div>
            <div class="row" style="gap:4px">${WX[D.PATHS[pKey].wx]}<span>${D.PATHS[pKey].risk} Risk</span></div>
          </div>

          <div class="row small" style="justify-content:space-between;background:var(--leaf-soft);padding:6px 10px;border-radius:8px;cursor:pointer" data-act="open-roi" data-p="${pKey}">
            <span>Wage Lift: <b style="color:var(--forest)">+${rm(roi.monthlyLift)}/mo</b> (+${roi.liftPercent}%)</span>
            <span class="muted">Payback: <b>${roi.paybackLabel}</b> ↗</span>
          </div>

          <div class="row" style="justify-content:space-between;align-items:center;background:var(--mist);padding:6px 10px;border-radius:8px">
            <span class="small">Your interest:</span>
            <div class="interest-group" role="group">
              <button class="interest-btn" data-act="set-interest" data-p="${pKey}" data-v="no" aria-pressed="${intVal === "no"}">No</button>
              <button class="interest-btn" data-act="set-interest" data-p="${pKey}" data-v="maybe" aria-pressed="${intVal === "maybe"}">Maybe</button>
              <button class="interest-btn" data-act="set-interest" data-p="${pKey}" data-v="yes" aria-pressed="${intVal === "yes"}">Yes</button>
            </div>
          </div>

          <div class="small muted">
            <b>Exit condition:</b> ${D.PATHS[pKey].exit}<br>
            <b>Backup path:</b> ${D.PATHS[D.PATHS[pKey].backup].name}
          </div>

          <div class="row" style="gap:8px;margin-top:6px">
            <button class="btn small ${isChosen ? "ghost" : ""}" data-act="choose" data-v="${pKey}">${isChosen ? "Your Chosen Path ✓" : "Choose " + D.PATHS[pKey].name}</button>
            <button class="btn small ghost" data-act="sel" data-v="${pKey}">Step Inside</button>
          </div>
        </div>
      </div>`;
    };

    const doNot = doNothingScore(0);

    content = `
      ${S.lastChangeNotice ? `<div class="banner" style="background:var(--leaf-soft);margin-bottom:18px;display:flex;justify-content:space-between;align-items:center">
        <div><b>Why the order changed:</b> <span>${esc(S.lastChangeNotice)}</span></div>
        <button class="btn small ghost" data-act="open-why-table">View Breakdown Table</button>
      </div>` : ""}

      <div class="paths3" id="paths3">${order.map(card).join("")}</div>

      <div class="panel" style="margin-top:20px;display:grid;gap:12px;background:var(--paper)">
        <div class="row" style="justify-content:space-between">
          <div><b style="font-size:20px">Do Nothing Baseline (§2, §4 #6)</b>
            <p class="small muted">If you take no action, AI exposure erodes today's manual tasks month-by-month.</p></div>
          <div style="text-align:right"><b style="font:800 32px/1 var(--head);color:var(--clay)">${doNot}</b><span class="small muted" style="display:block">Baseline Score (M0)</span></div>
        </div>
        <div class="meter warn"><i style="width:${doNot}%"></i></div>
      </div>

      <section class="door" style="margin-top:28px">
        <h2 style="font-size:28px;margin-bottom:12px">Deep Dive: ${P.name} Scene in Malaysia</h2>
        <div class="door-top">
          <div class="scene" id="scene"><img src="${P.photo}" alt="${P.alt}">
            <button class="hot" style="left:24%;top:22%" data-act="hot" data-v="jobs">Job board</button>
            <button class="hot" style="left:68%;top:28%" data-act="hot" data-v="comp">Queue</button>
            <button class="hot" style="left:56%;top:64%" data-act="hot" data-v="growth">Pay ladder</button>
            <button class="hot" style="left:30%;top:58%" data-act="hot" data-v="subsidies">Subsidies</button>
            <div class="walk">${me({ suit: P.suit, cls: "happy", arm: true, tool: P.tool })}</div>
            <div class="hot-pop" id="hot-pop" hidden></div>
          </div>

          <div class="panel toolbox">
            <h3>Skills & Gate Prerequisites</h3>
            <div style="display:grid;gap:8px">
              ${P.skills.map(([n, grp]) => {
                const tr = getSkillTrack(n);
                return `<div class="sk ${tr === "verified" ? "got" : "miss"}">
                  <i></i><span>${esc(n)}</span>
                  <span class="pill-sm" style="background:${tr === "verified" ? "var(--leaf-soft)" : tr === "hidden" ? "var(--sun-soft)" : "var(--clay-soft)"}">${tr}</span>
                </div>`;
              }).join("")}
            </div>
            ${P.gates.length ? `<div style="background:var(--sun-soft);border-radius:10px;padding:12px;margin-top:8px">
              <b>Mandatory Licence Gates:</b>
              <div class="small muted">${P.gates.join(", ")}</div>
            </div>` : ""}
            <button class="btn" data-act="planall" data-v="${sel}">Add All Missing Skills to My Plan</button>
          </div>
        </div>
      </section>`;
  } else if (tab === "time-machine") {
    const curRel = S.dataRelease || "2026-03";
    const snap = D.SNAPSHOTS.find(s => s.id === curRel) || D.SNAPSHOTS[2];

    content = `<div class="panel" style="display:grid;gap:20px">
      <div class="row" style="justify-content:space-between">
        <div><h2 style="font-size:28px">Time Machine across Malaysian Data Releases (§8 step 4)</h2>
          <p class="muted">Drag across quarterly labor and AI benchmark snapshots to see how demand signals shifted.</p></div>
        <span class="tag tag--sample">Sample values</span>
      </div>

      <div class="choice" role="radiogroup" aria-label="Data release" style="margin:10px 0">
        ${D.SNAPSHOTS.map(sn => `<label><input type="radio" name="release" value="${sn.id}" ${sn.id === curRel ? "checked" : ""} data-act="set-release">
          <span><b>${sn.n}</b> (${sn.releaseTag})</span></label>`).join("")}
      </div>

      <div class="panel" style="background:var(--mist);border-radius:14px;padding:18px">
        <h3 style="margin-top:0">Generated Diff Panel (${snap.n})</h3>
        <ul style="margin:8px 0;padding-left:20px">
          ${snap.note.map(nt => `<li>${esc(nt)}</li>`).join("")}
        </ul>
        <table class="diff-table">
          <thead><tr><th>Path</th><th>Demand Multiplier</th><th>Primary Task Window</th><th>Calculated Match</th></tr></thead>
          <tbody>
            ${PATH_IDS.map(pk => {
              const m = computePathMatch(pk);
              const multVal = snap.mult[pk];
              const w = m.window;
              return `<tr>
                <td><b>${D.PATHS[pk].name}</b></td>
                <td>x${multVal}</td>
                <td>${w.label} (${w.conf} confidence)</td>
                <td><b style="color:var(--forest)">${m.total}</b></td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>
    </div>`;
  } else {
    // Simulate tab
    const mode = S.tab.simMode || "story";
    const curM = S.tab.simM || 0;
    const eng = runEngine(sel);
    const ms = eng ? eng.steps : [];

    content = `<div class="panel" style="display:grid;gap:20px">
      <div class="row" style="justify-content:space-between">
        <div><h2 style="font-size:28px">Simulate 24-Month Trajectory (§7)</h2>
          <p class="muted">Powered by our single weekly simulation engine with your hours (${S.hours}h) and budget (${rm(S.budget)}).</p></div>
        <div class="switch" role="group" aria-label="Mode">
          <button data-act="set-sim-mode" data-v="story" aria-pressed="${mode === "story"}">Story Lane</button>
          <button data-act="set-sim-mode" data-v="detail" aria-pressed="${mode === "detail"}">All 4 Lanes</button>
        </div>
      </div>

      <div class="sim">
        <div class="row" style="justify-content:space-between">
          <b style="font-size:22px" id="sim-month">Month ${curM} of 24</b>
          <span class="tag tag--projection">Projection</span>
        </div>

        <div class="sim-track">
          <div class="lane"><i id="sim-lane" style="transform:scaleX(${curM / 24})"></i></div>
          ${ms.map((st, i) => `<span class="ms" style="left:${clamp(st.intakeWeek / 104 * 90 + 5, 5, 92)}%">M${Math.ceil(st.intakeWeek / 4.3)}</span>`).join("")}
          <!-- the slide is as wide as the rail, so translateX(n%) of itself moves the walker along the rail: transform only, no measuring -->
          <div class="walk-rail"><div class="walk-slide" id="sim-slide" style="transform:translateX(${curM / 24 * 100}%)">
            <div class="walker">${me({ suit: D.PATHS[sel].suit, cls: "happy" })}</div></div></div>
        </div>

        <input type="range" min="0" max="24" value="${curM}" aria-label="Month of your plan" aria-valuetext="Month ${curM} of 24" data-act="sim-m">

        <div id="sim-results">${simResultsHTML(sel, mode, curM, eng)}</div>

        <div class="row" style="gap:12px;margin-top:10px">
          <button class="btn small" data-act="simplay">Play 24 Months</button>
          <button class="btn small ghost" data-act="what-if-toggle">What-If: 8h / RM0</button>
        </div>
      </div>
    </div>`;
  }

  const journeyFooter = `
    <div class="sprout-journey-banner">
      <div>
        <span class="sprout-journey-badge">Step 4 of 6 Complete</span>
        <div class="sprout-journey-body">
          <h4>Direction Selected: ${esc(D.PATHS[sel].name)} (${esc(pathSub(sel))})</h4>
          <p>Your target direction is locked in with a verified match score. Ready to review accredited Malaysian courses, funding subsidies, and syllabus?</p>
        </div>
      </div>
      <a href="#courses" class="sprout-journey-cta">
        <span>Step 5: Explore Courses & Certifications</span>
        <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h12M11 5l5 5-5 5"/></svg>
      </a>
    </div>`;

  return `${pageHead("Choose your path", `Three futures for ${esc(S.name)}, each scored on the same four parts.`)}
    ${controlBar}
    ${tabs("dd", [["compare", "Compare Paths"], ["time-machine", "Time Machine (Releases)"], ["sim", "Simulate 24 Months"]])}
    ${content}${journeyFooter}`;
};

// The part of the Simulate tab that depends on the month; patched in place while scrubbing
function simResultsHTML(sel, mode, curM, eng) {
  const total = eng ? eng.totalMonths : 6;
  if (mode === "story") return `<div class="sim-out">
    <div><b>${total} months</b>total time needed</div>
    <div><b>${rm(eng ? eng.netCost : 0)}</b>net out of pocket</div>
    <div><b>${curM >= total ? "Ready" : "In progress"}</b>status at M${curM}</div>
    <div><b>${curM >= total ? rm(D.PATHS[sel].pay[0]) : "Today's wage"}</b>expected wage</div>
  </div>`;
  return `<div style="display:grid;gap:10px;margin-top:10px">
    ${PATH_IDS.map(pk => {
      const e = runEngine(pk), t = e ? e.totalMonths : 6;
      return `<div class="row" style="justify-content:space-between;background:var(--mist);padding:10px 14px;border-radius:10px">
        <b>${D.PATHS[pk].name}</b>
        <span>${curM >= t ? "Ready to apply" : `Month ${curM} of ${t}`}</span>
        <b>${rm(D.PATHS[pk].pay[0])}/mo</b>
      </div>`;
    }).join("")}
    <div class="row" style="justify-content:space-between;background:var(--clay-soft);padding:10px 14px;border-radius:10px">
      <b>Do nothing</b>
      <span>Score at M${curM}: ${doNothingScore(curM)}/100</span>
      <span style="color:var(--danger-ink)">Automation risk rising</span>
    </div>
  </div>`;
}

// Move the walker and refresh the month-dependent text without rebuilding the page,
// so the slider keeps focus and the drag isn't interrupted.
function patchSim() {
  const M = S.tab.simM || 0, slide = $("#sim-slide");
  if (!slide) return false;
  const sel = S.sel || S.path || ranked()[0];
  slide.style.transform = `translateX(${M / 24 * 100}%)`;
  $("#sim-lane").style.transform = `scaleX(${M / 24})`;
  $("#sim-month").textContent = `Month ${M} of 24`;
  const r = $('[data-act="sim-m"]');
  if (r) { r.value = M; r.setAttribute("aria-valuetext", `Month ${M} of 24`); }
  $("#sim-results").innerHTML = simResultsHTML(sel, S.tab.simMode || "story", M, runEngine(sel));
  save();
  return true;
}

/* ---------- VIEW: COURSES (ACT) ---------- */
V.courses = () => {
  const pKey = target();
  const P = D.PATHS[pKey];
  const eng = runEngine(pKey);
  const steps = eng ? eng.steps : [];
  const filter = S.tab.coursesFilter || "all";

  return `<div class="ph">
    <div><h1>Courses for your plan</h1>
      <p>Take them in this order: prove what you already know, refresh rusty skills, fill the gaps, then get your licences.</p></div>
    <div class="switch" role="group" aria-label="Course filter">
      <button data-act="filter-courses" data-v="all" aria-pressed="${filter === "all"}">All</button>
      <button data-act="filter-courses" data-v="free" aria-pressed="${filter === "free"}">Free / Claimable</button>
      <button data-act="filter-courses" data-v="licences" aria-pressed="${filter === "licences"}">Licences Only</button>
    </div>
  </div>

  <div class="cols c8-4">
    <div style="display:grid;gap:18px">
      ${[1, 2, 3, 4].map(stepCat => {
        const catSteps = steps.filter(s => s.stepCategory === stepCat);
        if (!catSteps.length) return "";
        const catTitles = {
          1: "Step 1: Recognise Prior Achievement (PPT)",
          2: "Step 2: Refresh Rusty Skills (Half Duration)",
          3: "Step 3: Fill Gaps by Window Score",
          4: "Step 4: Statutory Licences (Required by Law)"
        };
        return `<div><h3 style="margin-bottom:12px">${catTitles[stepCat]}</h3>
          <div class="courses">${catSteps.map(s => {
            const crs = D.COURSES.find(c => c.id === s.id || c.id === s.baseId) || D.COURSES[0];
            return `<article class="course">
              <img src="${crs.photo}" alt="" loading="lazy">
              <div class="body">
                <h3>${esc(s.name)}</h3>
                <span class="muted small">${esc(crs.by)}</span>
                <div class="meta">
                  <span>${s.hours} hours</span>
                  <span>Intake Week ${s.intakeWeek}</span>
                  <span class="how ${crs.track}">${D.TRACK[crs.track]}</span>
                </div>
                <div class="small muted" style="margin-top:6px"><b>Why:</b> ${esc(s.why)}</div>
              </div>
              <div class="side">
                <div>
                  <div class="fee">${s.fee === 0 ? "RM0 (Claimable)" : rm(s.fee)}</div>
                  ${s.fee === 0 ? '<span class="tag tag--real">HRD Corp / Free</span>' : '<span class="tag tag--sample">Standard Fee</span>'}
                </div>
                ${inPlan(crs.id) ? `<button class="btn small ghost" data-act="unplan" data-v="${crs.id}">In Plan ✓</button>` : `<button class="btn small" data-act="plan" data-v="${crs.id}">Add to Plan</button>`}
              </div>
            </article>`;
          }).join("")}</div>
        </div>`;
      }).join("")}
    </div>

    <div style="display:grid;gap:16px;align-content:start">
      <div class="panel"><h3>Plan Summary</h3>
        <div class="row" style="justify-content:space-between"><span>Selected Courses</span><b>${S.plan.length}</b></div>
        <div class="row" style="justify-content:space-between"><span>Net Cost</span><b>${rm(eng ? eng.netCost : 0)}</b></div>
        <div class="row" style="justify-content:space-between"><span>Estimated Finish</span><b>${eng ? eng.totalMonths : 6} months</b></div>
        <a class="btn" href="#plan" style="margin-top:14px;width:100%">Open My Plan</a>
      </div>

      ${eng && eng.licenceBlockedByBudget ? `<div class="panel" style="background:var(--clay-soft);border:1.5px solid var(--clay)">
        <b style="color:var(--clay)">Budget Blocked Without Subsidy</b>
        <p class="small muted" style="margin:6px 0 10px">${eng.licenceBlockReason}</p>
        <b>Honest Subsidy Options:</b>
        <ul class="small" style="padding-left:18px;margin:8px 0">
          ${D.SUBSIDIES.map(sub => `<li><b>${sub.title}:</b> ${sub.amount} (${sub.check})</li>`).join("")}
        </ul>
      </div>` : ""}
    </div>
  </div>
  <div class="sprout-journey-banner">
    <div>
      <span class="sprout-journey-badge">Step 5 of 6 Complete</span>
      <div class="sprout-journey-body">
        <h4>${S.plan.length} Courses Selected & Budget Verified</h4>
        <p>Your certified training modules are scheduled. Ready to see your week-by-week learning timeline and verifiable Skills Passport?</p>
      </div>
    </div>
    <a href="#plan" class="sprout-journey-cta">
      <span>Step 6: View Growth Plan</span>
      <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h12M11 5l5 5-5 5"/></svg>
    </a>
  </div>`;
};

/* ---------- VIEW: MY PLAN (ACT) ---------- */
V.plan = () => {
  const tab = tabOf("plan", "timeline");
  const pKey = target();
  const P = D.PATHS[pKey];
  const eng = runEngine(pKey);
  const p = planProgress();

  let body = "";

  if (tab === "timeline") {
    body = `<div class="cols c8-4">
      <div class="ms-list">
        ${eng ? eng.steps.map((st, i) => `<div class="ms-item ${st.done ? "done" : ""}">
          <span class="dot">${i + 1}</span>
          <div style="display:grid;gap:4px">
            <b>${esc(st.name)}</b>
            <span class="small muted">Week ${st.startWk || i * 4 + 1} to ${st.endWk || (i + 1) * 4} • ${st.hours} hours • ${st.fee === 0 ? "RM0" : rm(st.fee)}</span>
            <div class="meter"><i style="width:${st.done ? 100 : 0}%"></i></div>
          </div>
          <span class="how ${st.isLicence ? "cert" : "auto"}">${st.isLicence ? "Licence Gate" : "Skill Course"}</span>
        </div>`).join("") : '<div class="muted">No plan steps generated yet.</div>'}

        <div class="ms-item" style="border:2px solid var(--sun)">
          <span class="dot" style="background:var(--sun)">★</span>
          <div><b>Apply for ${pathSub(pKey)} Roles</b><div class="small muted">Estimated Month ${eng ? eng.totalMonths : 6}</div></div>
          <span class="tag tag--projection">Target</span>
        </div>
      </div>

      <div style="display:grid;gap:16px;align-content:start">
        <div class="panel ringbox" style="flex-direction:column;text-align:center">
          ${ring(p, 140)}
          <div><h3 style="margin:0">Plan Progress</h3><p class="muted small">${S.hours} h/week • Finish in ~${eng ? eng.totalMonths : 6} mo</p></div>
        </div>
        <div class="panel">
          <b>Rescheduling Control:</b>
          <p class="small muted">Did shift overtime or personal errands interrupt your learning this week?</p>
          <button class="btn small ghost" data-act="missed-week" style="margin-top:8px;width:100%">I Missed This Week</button>
        </div>
      </div>
    </div>`;
  } else if (tab === "calendar") {
    const W = S.week || 0;
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const sched = eng && eng.weeklyLog ? eng.weeklyLog[W] : null;

    body = `<div>
      <div class="panel">
        <div class="row" style="justify-content:space-between;margin-bottom:12px">
          <h3 style="margin:0">Week ${W + 1} Calendar & Free Time Blocks</h3>
          <div class="row">
            <button class="btn small ghost" data-act="week" data-v="-1" ${W === 0 ? "disabled" : ""}>Previous</button>
            <button class="btn small ghost" data-act="week" data-v="1">Next</button>
            <button class="btn small" data-act="export-ics">Export to .ics</button>
          </div>
        </div>

        <div class="cal">
          <span></span>${days.map(d => `<span class="hd">${d}</span>`).join("")}
          ${["Morning", "Evening"].map(t => `<span class="tm">${t === "Morning" ? "9am" : "8pm"}</span>${days.map(d => {
            const k = d + "-" + t;
            const isFree = S.slots.includes(k);
            return `<div class="cell ${isFree ? "free" : ""}">
              ${isFree && sched && sched.stepName ? `<div class="blk">${esc(sched.stepName)}<span>2 h</span></div>` : ""}
              ${isFree && sched && sched.evidenceHour ? `<div class="blk evidence">Evidence Stamp<span>1 h</span></div>` : ""}
            </div>`;
          }).join("")}`).join("")}
        </div>
        <p class="small muted" style="margin-top:10px">Yellow blocks: 1-hour evidence blocks reserved for skills passport verification.</p>
      </div>

      <div class="track-list" style="margin-top:18px">
        ${D.COURSES.slice(0, 4).map(c => `<div class="trk">
          <div class="top-row"><b>${esc(c.n)}</b><span class="how ${c.track}">${D.TRACK[c.track]}</span></div>
          <div class="meter"><i style="width:${courseDone(c) * 100}%"></i></div>
          <span class="small muted">${logged(c.id)} of ${c.hours} hours logged</span>
          <div class="row" style="margin-top:6px">
            <button class="btn small" data-act="log" data-v="${c.id}">Log 1 Hour</button>
            <label class="btn small ghost filebtn">Upload Cert<input type="file" accept="image/*,.pdf" data-act="cert" data-v="${c.id}"></label>
          </div>
        </div>`).join("")}
      </div>
    </div>`;
  } else if (tab === "change") {
    // Change direction view (§6.5)
    body = `<div class="panel" style="max-width:800px;margin:0 auto;display:grid;gap:18px">
      <h2>Change Career Direction without Losing Progress (§6.5)</h2>
      <p class="muted">Switch to another path anytime. Your verified skills, certificates, and completed courses carry over.</p>

      <div class="field"><label>Select New Destination Path</label>
        <div class="choice">${PATH_IDS.map(pk => `<label><input type="radio" name="newpath" value="${pk}" ${pk === pKey ? "checked" : ""} data-act="preview-new-path">
          <span>${D.PATHS[pk].name}: ${pathSub(pk)}</span></label>`).join("")}</div>
      </div>

      <div class="panel" style="background:var(--mist);padding:18px;border-radius:12px;display:grid;gap:12px">
        <b>Transition Impact Summary:</b>
        <div class="row" style="justify-content:space-between"><span>Carries Over</span><b style="color:var(--forest)">All verified skills & completed safety courses</b></div>
        <div class="row" style="justify-content:space-between"><span>Unused Prior Modules</span><span>Saved in your personal archive</span></div>
        <div class="row" style="justify-content:space-between"><span>Estimated Time Difference</span><b>±1 to 2 months</b></div>
      </div>

      <button class="btn" data-act="confirm-change-direction">Confirm & Switch Path</button>
    </div>`;
  } else {
    // Verifiable Digital Skills Passport & 24-Month Career Transition Card (§10, §11)
    const cardMode = S.tab.cardMode || "sim";
    const match = computePathMatch(pKey);
    const sks = deriveSkillsSummary();
    const roi = computeROI(pKey);
    const hash = getVerificationHash(S);
    const verifyUrl = `https://bijakmatch.gov.my/verify?id=${hash}&user=${encodeURIComponent(S.name)}`;
    const qrSvg = BM.qrSVG(verifyUrl, 120);

    const switcher = `<div class="row" style="justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
      <div class="switch" role="group" aria-label="Transition Card View Mode">
        <button data-act="set-card-mode" data-v="sim" aria-pressed="${cardMode === "sim"}">24-Month Interactive Simulation</button>
        <button data-act="set-card-mode" data-v="passport" aria-pressed="${cardMode === "passport"}">Verifiable Digital Skills Passport</button>
      </div>
      <div class="row" style="gap:10px">
        <a href="transition-card.html" target="_blank" class="btn ghost small" title="Open Transition Card simulation in clean standalone window">↗ Fullscreen Simulation</a>
        <button class="btn ghost small" data-act="print-card">Print / Save PDF</button>
      </div>
    </div>`;

    const simHtml = `<article class="tc-sim" id="tc-sim" aria-labelledby="tc-title">
      <header class="tc-sim-head">
        <div>
          <div class="eyebrow">Career Transition Card · ${esc(S.name)}</div>
          <h2 id="tc-title">${D.PATHS[pKey].name}: ${pathSub(pKey)}</h2>
          <p>${S.hours} hours a week · ${rm(S.budget)} a month · Goal: ${S.goal === "income" ? "Higher income" : "Quick move"}</p>
        </div>
        <div class="row" style="gap:8px;flex-wrap:wrap">
          <span class="tag tag--projection">Projection</span>
          <span class="tag tag--real">NOSS EE-320-3</span>
          <span class="tag tag--sample">Sample Profile</span>
        </div>
      </header>

      <div class="tc-scene">
        <!-- left: why this match & competition -->
        <div class="tc-col">
          <section class="tc-float" aria-labelledby="tc-h-match">
            <div class="tc-panel-top"><h3 id="tc-h-match">Why this match</h3><span class="small muted">Open a part</span></div>
            <ul class="tc-bars" id="tc-bars" aria-label="How the match score is made"></ul>
          </section>
          <section class="tc-float" aria-labelledby="tc-h-comp" id="tc-comp"></section>
        </div>

        <!-- centre: the avatar -->
        <div class="tc-hero" aria-labelledby="tc-h-month">
          <div class="m" id="tc-h-month">Month<b id="tc-month-big">1</b></div>
          <div class="tc-figure">
            <svg viewBox="0 0 200 260" role="img" aria-labelledby="tc-av-desc">
              <desc id="tc-av-desc">Ahmad at this month of the plan, wearing the badges and gear he has earned.</desc>
              <ellipse cx="100" cy="250" rx="70" ry="9" fill="#1F2A24" opacity=".1"/>
              <g id="tc-av">
                <!-- body -->
                <path d="M32 250 C 36 190, 64 168, 100 168 C 136 168, 164 190, 168 250 Z" fill="#1E5A3A"/>
                <path d="M84 168 L100 196 L116 168" fill="#DCEBD2"/>
                <rect x="48" y="214" width="104" height="8" rx="4" fill="#F2C230"/>
                <!-- harness: PV site safety (M11) -->
                <g class="tc-gear" data-at="11"><path d="M62 180 L138 240 M138 180 L62 240" stroke="#1F2A24" stroke-width="6" stroke-linecap="round" opacity=".85"/><circle cx="100" cy="210" r="7" fill="#9AA39C"/></g>
                <!-- badges: PPT (M4), ST (M15), GCPV (M24) -->
                <g class="tc-gear" data-at="4"><circle cx="128" cy="192" r="11" fill="#F2C230" stroke="#FBFCF8" stroke-width="3"/><path d="M123 192l3.5 3.5 6-6.5" stroke="#1E5A3A" stroke-width="3" fill="none" stroke-linecap="round"/></g>
                <g class="tc-gear" data-at="15"><circle cx="72" cy="192" r="11" fill="#4F74C8" stroke="#FBFCF8" stroke-width="3"/><path d="M73 185l-5 8h5l-2 6 6-9h-5z" fill="#FBFCF8"/></g>
                <g class="tc-gear" data-at="24"><circle cx="100" cy="232" r="11" fill="#7BAE5E" stroke="#FBFCF8" stroke-width="3"/><rect x="94" y="227" width="12" height="9" rx="1.5" fill="#3E6CB8"/></g>
                <!-- head -->
                <rect x="88" y="138" width="24" height="32" fill="#C98E6B"/>
                <ellipse cx="100" cy="112" rx="38" ry="42" fill="#C98E6B"/>
                <path d="M62 102 C 64 78, 136 78, 138 102 C 126 90, 74 90, 62 102 Z" fill="#1E2328"/>
                <path d="M58 92 C 58 48, 142 48, 142 92 Z" fill="#F2C230"/>
                <rect x="52" y="88" width="96" height="11" rx="5.5" fill="#D9A21C"/>
                <path d="M96 52 h8 v36 h-8z" fill="#D9A21C"/>
                <path d="M78 109 q8 -5 16 0 M106 109 q8 -5 16 0" stroke="#3A2A20" stroke-width="3" fill="none" stroke-linecap="round"/>
                <ellipse cx="86" cy="118" rx="4.5" ry="5" fill="#1E2328"/><ellipse cx="114" cy="118" rx="4.5" ry="5" fill="#1E2328"/>
                <path d="M88 135 Q100 145 112 135" stroke="#5A2E1E" stroke-width="3.5" fill="none" stroke-linecap="round"/>
                <!-- tools in hand: multimeter (M6), solar tile (M24) -->
                <g class="tc-gear" data-at="6"><rect x="150" y="196" width="26" height="38" rx="5" fill="#F2C230" stroke="#1F2A24" stroke-width="2.5"/><rect x="155" y="201" width="16" height="11" rx="2" fill="#DCEBD2"/><circle cx="163" cy="224" r="5" fill="#1F2A24"/></g>
                <g class="tc-gear" data-at="24"><path d="M14 196 l34 -6 v28 l-34 6z" fill="#3E6CB8" stroke="#1F2A24" stroke-width="2"/><path d="M14 206 l34 -6 M14 215 l34 -6 M25 194 v28 M36 192 v28" stroke="#DCE6F6" stroke-width="1.5"/></g>
              </g>
            </svg>
          </div>
          <div class="tc-status" id="tc-status" aria-live="polite"></div>
          <div class="tc-score"><b id="tc-score-val">${match.total}</b><span>match out of 100</span></div>
          <div class="tc-legend" id="tc-legend" aria-label="Earned so far">
            <span data-at="4">PPT badge</span><span data-at="6">Multimeter</span><span data-at="11">Harness</span><span data-at="15">ST badge</span><span data-at="24">GCPV</span>
          </div>
        </div>

        <!-- right: milestone detail & safety -->
        <div class="tc-col">
          <section class="tc-float tc-ms" id="tc-ms" aria-live="polite" aria-labelledby="tc-ms-title"></section>
          <section class="tc-float" aria-labelledby="tc-h-safety">
            <h3 id="tc-h-safety">If things change (§6.5)</h3>
            <div style="display:grid;gap:10px">
              <div style="background:var(--mist);border-radius:12px;padding:12px 14px;font-size:16px;line-height:23px">
                <b style="display:block;font:700 14px/20px var(--body);color:var(--ink-2)">Exit safeguard</b>
                ${D.PATHS[pKey].exit || "You can't pay for the GCPV exam within 12 months, even with employer support."}
              </div>
              <div style="background:var(--mist);border-radius:12px;padding:12px 14px;font-size:16px;line-height:23px">
                <b style="display:block;font:700 14px/20px var(--body);color:var(--ink-2)">Backup path</b>
                ${D.PATHS[D.PATHS[pKey].backup || "stay"].name}: ${pathSub(D.PATHS[pKey].backup || "stay")}. Keeps 3 of your skills.
              </div>
            </div>
          </section>
        </div>
      </div>

      <!-- timeline strip -->
      <section class="tc-tl" aria-labelledby="tc-tl-title">
        <div class="tc-tl-top">
          <h3 id="tc-tl-title">Your next 24 months</h3>
          <div class="tc-keys" id="tc-keys" role="group" aria-label="Key milestones"></div>
        </div>
        <div class="tc-stage">
          <div class="tc-road" aria-hidden="true"><i id="tc-road-fill"></i></div>
          <div class="tc-marks" id="tc-marks"></div>
          <div class="tc-head-ring" id="tc-head" aria-hidden="true"></div>
          <div class="tc-ticks" id="tc-ticks" aria-hidden="true"></div>
        </div>
        <div class="tc-controls">
          <button class="btn" id="tc-play" type="button" aria-pressed="false" style="min-width:110px">
            <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true" style="margin-right:6px"><path id="tc-play-icon" d="M3 1.5v11l9-5.5z" fill="currentColor"/></svg>
            <span id="tc-play-label">Play</span>
          </button>
          <label class="sr" for="tc-scrub">Month of your plan</label>
          <input id="tc-scrub" type="range" min="1" max="24" step="1" value="1" aria-valuetext="Month 1" style="flex:1;accent-color:var(--forest)">
        </div>
      </section>
    </article>`;

    const passportHtml = `<div class="passport-card trans-card" id="trans-card">
      <div class="passport-header">
        <div>
          <div class="row" style="gap:8px;align-items:center;margin-bottom:6px">
            <span class="passport-verified-pill">Verified Credential</span>
            <span class="tag tag--real">National Green Registry</span>
          </div>
          <h1 style="font-size:32px;color:var(--forest);margin:0;letter-spacing:-.02em">Digital Skills Passport</h1>
          <div class="muted small">Jabatan Pembangunan Kemahiran (JPK) & MyMAHIR Aligned • NOSS EE-320-3 Standard</div>
        </div>

        <div class="passport-id-badge">
          <span class="muted" style="font-size:11px;text-transform:uppercase">Credential Hash</span>
          <b style="font-family:monospace;font-size:14px;color:var(--forest)">${hash}</b>
          <span class="muted" style="font-size:11px">Tamper-evident registry stamp</span>
        </div>
      </div>

      <div class="passport-qr-wrap">
        <div class="qr-frame">
          ${qrSvg}
        </div>
        <div class="qr-meta">
          <b style="font-size:18px">Official Verification QR Code</b>
          <p class="small muted">Scan to verify authentic NOSS competency mappings, employer shift logs, and certified prerequisite qualifications on the official registry.</p>
          <div class="row" style="gap:8px;margin-top:6px">
            <button class="btn small" data-act="copy-verify-link">Copy Verification Link</button>
            <button class="btn small ghost" data-act="print-card">Print / Save PDF Passport</button>
          </div>
        </div>
      </div>

      <div class="cols c6-6" style="gap:20px">
        <div class="panel" style="background:var(--mist);padding:16px;border-radius:12px">
          <b style="font-size:13px;text-transform:uppercase;color:var(--ink-2)">Worker Profile & Current Baseline</b>
          <div style="font-size:24px;font-weight:800;font-family:var(--head);margin:4px 0">${esc(S.name)}</div>
          <div class="muted">${jobName()} • ${esc(S.state)} • ${S.years} yrs experience</div>
          <div class="small" style="margin-top:8px"><b>Current Wage:</b> ${rm(roi.currentWage)}/month (DOSM median benchmark)</div>
          <div class="small"><b>Whitelist Credentials:</b> ${S.certsHeld.join(", ") || "None listed"}</div>
        </div>

        <div class="panel" style="background:var(--mist);padding:16px;border-radius:12px">
          <b style="font-size:13px;text-transform:uppercase;color:var(--ink-2)">Target Green Pathway & Qualification</b>
          <div style="font-size:24px;font-weight:800;font-family:var(--head);margin:4px 0">${D.PATHS[pKey].name}: ${pathSub(pKey)}</div>
          <div class="muted">Algorithm Match Score: <b style="color:var(--forest)">${match.total}/100</b> • Est. Completion: <b>~${eng ? eng.totalMonths : 6} mo</b></div>
          <div class="small" style="margin-top:8px"><b>Target Starting Pay:</b> ${rm(roi.targetWage)}/month (MGTC & MyMAHIR verified)</div>
          <div class="small"><b>Market Window:</b> ${match.window.label} (${match.window.conf} confidence)</div>
        </div>
      </div>

      <div class="roi-paycheck-compare" style="border:1.5px solid var(--leaf);background:linear-gradient(135deg,var(--leaf-soft),var(--mist))">
        <div class="row" style="justify-content:space-between;align-items:center">
          <div>
            <b style="font-size:18px">Projected Financial ROI & Career Lift:</b>
            <div class="small muted">Based on DOSM salary distributions & official HRD Corp subsidy schedules.</div>
          </div>
          <button class="btn small" data-act="open-roi" data-p="${pKey}">View Full ROI Drawer</button>
        </div>
        <div class="row" style="gap:24px;margin-top:8px">
          <div><span class="muted small">Monthly Lift:</span> <b style="font:800 20px/1 var(--head);color:var(--forest)">+${rm(roi.monthlyLift)}/mo</b></div>
          <div><span class="muted small">Annual Uplift:</span> <b style="font:800 20px/1 var(--head)">+${rm(roi.annualLift)}/yr</b></div>
          <div><span class="muted small">Out-of-Pocket Fee:</span> <b style="font:800 20px/1 var(--head);color:${roi.netCost === 0 ? "var(--forest)" : "var(--ink)"}">${rm(roi.netCost)}</b></div>
          <div><span class="muted small">Payback Period:</span> <b style="font:800 20px/1 var(--head)">${roi.paybackLabel}</b></div>
        </div>
      </div>

      <div style="background:var(--paper);padding:14px;border-radius:12px;border:1px solid var(--line)">
        <b>Match Score Breakdown (0 - 100):</b>
        <div class="row" style="gap:18px;margin-top:6px;flex-wrap:wrap">
          <span>Task Overlap: <b>${match.parts.overlap}/${match.maxParts.overlap}</b></span>
          <span>Market Demand: <b>${match.parts.demand}/${match.maxParts.demand}</b></span>
          <span>Your Interest: <b>${match.parts.interest}/${match.maxParts.interest}</b></span>
          <span>Ease of Move: <b>${match.parts.ease}/${match.maxParts.ease}</b></span>
          <span>SDG Bonus: <b>+${match.parts.sdgBonus}/8</b></span>
        </div>
      </div>

      <div class="cols c6-6" style="gap:20px">
        <div>
          <b>Verified Competencies Carry-over (${sks.verified.length}):</b>
          <div class="small muted">${sks.verified.join(", ") || "None"}</div>
          <b style="display:block;margin-top:10px">Hidden Competencies via Shift Interview (${sks.hidden.length}):</b>
          <div class="small muted">${sks.hidden.join(", ") || "None"} (Eligible for JPK PPT Certificate)</div>
        </div>
        <div>
          <b>Exit Safeguard:</b>
          <div class="small muted">${D.PATHS[pKey].exit}</div>
          <b style="display:block;margin-top:10px">Backup Pathway:</b>
          <div class="small muted">${D.PATHS[D.PATHS[pKey].backup].name}: ${pathSub(D.PATHS[pKey].backup)}</div>
        </div>
      </div>

      <div style="border-top:1px solid var(--line);padding-top:12px" class="muted small">
        <b>Fairness & Ethical AI Guarantee (§9):</b> Candidate scoring excludes age, gender, race, religion, and physical appearance. Anchored strictly to O*NET task overlap, DOSM labour statistics, and certified credentials.
      </div>
    </div>`;

    body = switcher + (cardMode === "sim" ? simHtml : passportHtml);
  }

  const journeyBanner = `
    <div class="sprout-journey-banner" style="margin-bottom:24px;background:linear-gradient(135deg, var(--leaf-soft) 0%, var(--paper) 100%)">
      <div>
        <span class="sprout-journey-badge" style="background:var(--forest);color:#fff">Step 6 of 6: Active Growth Plan</span>
        <div class="sprout-journey-body">
          <h4>Your Certified Transition Roadmap is Active</h4>
          <p>Target: <b>${esc(D.PATHS[pKey].name)}: ${esc(pathSub(pKey))}</b> • Estimated: <b>${eng ? eng.totalMonths : 6} months</b> at <b>${S.hours} hrs/week</b>. You can export your calendar or revisit the workplace simulator at any time.</p>
        </div>
      </div>
      <div class="row" style="gap:10px;flex-wrap:wrap">
        <button class="sprout-journey-cta secondary" data-act="export-ics">Export Calendar (.ics)</button>
        <a href="#impact" class="sprout-journey-cta">
          <span>Workplace Simulator</span>
          <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h12M11 5l5 5-5 5"/></svg>
        </a>
      </div>
    </div>`;

  return `${pageHead("Your plan", "Your weekly schedule, progress so far, and the card you can show employers.")}
    ${journeyBanner}
    ${tabs("plan", [["timeline", "Timeline"], ["calendar", "Calendar & Progress"], ["change", "Change Direction"], ["card", "Transition Card"]])}
    ${body}`;
};

