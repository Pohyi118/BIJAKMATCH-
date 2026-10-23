/* BijakMatch: Landing story, quick start, home, profile views.
   Classic script; shares one global scope with the other app-*.js files (load order in index.html). */
/* ==========================================================================
   7. VIEWS IMPLEMENTATION
   ========================================================================== */
const V = {};

/* ==========================================================================
   STORY VIEW: STATIC LANDING
   ========================================================================== */
const SPRIG = `<svg class="sprig" viewBox="0 0 56 72" aria-hidden="true"><path d="M28 70 C28 50 27 34 30 12" stroke="#4E8A3A" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M29 40 C14 38 8 28 9 18 C22 20 29 28 29 40Z" fill="#7BAE5E"/><path d="M29 30 C40 30 48 22 48 10 C36 10 29 18 29 30Z" fill="#4E8A3A"/><path d="M28 56 C18 56 12 50 11 42 C20 42 27 47 28 56Z" fill="#A9CB94"/></svg>`;

V.story = () => {
  const job = D.JOBS[S.job || person().job] || D.JOBS.tech;
  const steps = [
    ["skills", "Show your skills", "Talk to Bijak, our AI interviewer, about your shift"],
    ["impact", "Try your job with AI", "See which skills stay yours, then compare pivots"],
    ["paths", "Choose a path", "Stay, evolve or pivot, side by side"],
    ["plan", "Get your plan", "Courses that fit your hours and budget"]
  ];
  const best = ranked()[0];
  return `
  <section class="intro" aria-labelledby="intro-title">
    <div class="intro-copy">
      ${SPRIG}
      <span class="tag tag--real">National Energy Transition Roadmap</span>
      <h1 id="intro-title">Same hands, new work.</h1>
      <p class="lead">Show what you already do at work. See how AI changes it. Get a certified green-job plan that fits your weekly hours and budget, without taking on debt.</p>
      <div class="row">
        <a class="btn shine" href="#skills" data-tab="skills:interview">Start the shift interview</a>
        <a class="btn ghost" href="#paths">See green paths</a>
      </div>
    </div>
    <div class="intro-pic">
      <img src="photos/rooftop-crew.webp" alt="Technicians installing solar panels on a factory rooftop" width="1600" height="1067">
      ${BM.avatarSVG({ ...person().a, cls: "happy" })}
      <span class="pill"><span class="pill__dot"></span>Solar PV technician: RM 4,500 a month</span>
    </div>
    <nav class="intro-steps" aria-label="How it works">
      ${steps.map(([href, b, s], i) => `<a href="#${href}"><span class="ic">${i + 1}</span><b>${b}</b><span>${s}</span></a>`).join("")}
    </nav>
  </section>

  <div class="intro-cols">
    <section class="panel">
      <h3>What ${esc(S.name)} already does</h3>
      <p class="muted small">${esc(job.n)}, ${esc(S.state)}. These tasks carry into green jobs.</p>
      <ul class="carry-list">${job.tasks.slice(0, 4).map(t => `<li>${esc(t.n)}</li>`).join("")}</ul>
    </section>
    <section class="panel">
      <div class="row" style="justify-content:space-between"><h3>Paths for ${esc(S.name)}</h3><span class="tag tag--sample">Sample data</span></div>
      <div class="path-rows">${ranked().map(p => `<a class="path-row ${p === best ? "best" : ""}" href="#paths">
        <img src="${D.PATHS[p].photo}" alt="${D.PATHS[p].alt}">
        <div><b>${D.PATHS[p].name}</b><span>${esc(pathSub(p))}${p === best ? ". Best fit so far" : ""}</span></div>
        <strong>${computePathMatch(p).total}<small>match</small></strong></a>`).join("")}</div>
    </section>
  </div>

`;
};

/* ---------- VIEW: START (QUICK START) ---------- */
V.start = () => {
  const step = S.qs || 1;
  const steps = ["Your job", "Time and budget", "Workplace Proof"];
  const ind = `<div class="qs-steps" aria-label="Step ${step} of 3">${steps.map((n, i) => `${i ? "<b></b>" : ""}<span class="${i + 1 === step ? "on" : i + 1 < step ? "done" : ""}"><i>${i + 1}</i>${n}</span>`).join("")}</div>`;
  let left = "", right = "";

  if (step === 1) {
    left = `<h1>What is your job now?</h1>
      <p class="muted" style="margin-bottom:18px">We use your current role to derive which tasks you already perform and which ones AI will assist.</p>
      <div class="jobs">${Object.entries(D.JOBS).map(([k, j]) => `<button class="job" data-act="job" data-v="${k}" aria-pressed="${S.job === k}">${icon(k)}<b>${j.n}</b></button>`).join("")}</div>
      <div class="field" style="margin-top:20px;max-width:340px"><label for="f-state">Where do you work in Malaysia?</label>
        <select id="f-state" data-bind="state">${D.STATES.map(s => `<option ${s === S.state ? "selected" : ""}>${s}</option>`).join("")}</select></div>`;
    right = `<div class="who-big">${me({ cls: "happy", arm: true })}<div><b style="font:800 22px/1.2 var(--head)">${esc(S.name)}</b><div class="muted small">${jobName()}, ${esc(S.state)}</div></div></div>
      <h3>Tasks in your role</h3>
      <div class="chips" id="pv-tasks">${S.job ? D.JOBS[S.job].tasks.map(t => `<span class="chip">${t.n}</span>`).join("") : '<span class="muted small">Pick a job to see its tasks.</span>'}</div>`;
  } else if (step === 2) {
    left = `<h1>How much time and money can you give?</h1>
      <div class="panel" style="display:grid;gap:24px">
        <div class="field"><label for="f-hours">Weekly learning hours</label>
          <div class="row"><span class="big-n" id="o-hours">${S.hours}</span><span class="muted">hours every week</span></div>
          <input id="f-hours" type="range" min="1" max="15" value="${S.hours}" data-bind="hours"></div>
        <div class="field"><span class="lbl" id="l-budget">Monthly course budget</span>
          <div class="choice" role="radiogroup" aria-labelledby="l-budget">${[0, 50, 100, 200, 300].map(b => `<label><input type="radio" name="budget" value="${b}" ${S.budget === b ? "checked" : ""} data-bind="budget"><span>${b === 300 ? "RM300+" : rm(b)}</span></label>`).join("")}</div></div>
        <div class="field"><span class="lbl">What is your primary career goal?</span>
          <div class="switch" role="group" aria-label="Your goal"><button data-act="goal" data-v="income" aria-pressed="${S.goal === "income"}">Higher income</button><button data-act="goal" data-v="quick" aria-pressed="${S.goal === "quick"}">Quick move</button></div></div>
      </div>`;
    right = `<h3>Your weekly commitment</h3>${weekGrid(S.slots)}
      <div class="small muted">Green slots show free time reserved for study and evidence logging.</div>
      <h3>Pace estimate</h3>
      <div style="display:grid;gap:12px">${PATH_IDS.map(p => {
        const eng = runEngine(p);
        const mo = eng ? eng.totalMonths : 6;
        return `<div><div class="row" style="justify-content:space-between"><b>${D.PATHS[p].name}: ${pathSub(p)}</b><span>${mo} months</span></div>
          <div class="meter ${eng && eng.licenceBlockedByBudget ? "warn" : ""}"><i style="width:${clamp(S.budget / Math.max(1, eng ? eng.totalCost / mo : 100)) * 100}%"></i></div>
          <div class="small muted">${eng && eng.licenceBlockedByBudget ? '<span style="color:var(--clay)">Budget blocks licence without subsidy</span>' : `Estimated completion in ${mo} months`}</div></div>`;
      }).join("")}</div>
      <span class="tag tag--projection">Engine Projection</span>`;
  } else {
    left = `<h1>Show what you actually do at work</h1>
      <p class="muted" style="margin-bottom:18px">We compare what you do against certificates to find <b>Verified</b>, <b>Hidden</b>, and <b>Rusty</b> skills.</p>
      <div class="panel" style="display:grid;gap:16px">
        <div class="row" style="justify-content:space-between">
          <div><b style="font-size:18px">Option A: AI Shift Interview (Recommended)</b><p class="muted small">Bijak asks about you, your job and your shift. Speak or type. About 5 minutes.</p></div>
          <button class="btn" data-act="qs-start-interview">Start Shift Interview</button>
        </div>
        <hr style="border:0;border-top:1px solid var(--line);margin:4px 0">
        <div class="row" style="justify-content:space-between">
          <div><b style="font-size:18px">Option B: Use Sample Profile</b><p class="muted small">Load sample shift interview and SKM certificate for ${esc(S.name)}.</p></div>
          <button class="btn ghost" data-act="qs-fill-sample">Load Sample</button>
        </div>
      </div>`;
    const sks = deriveSkillsSummary();
    right = `<div class="who-big">${me({ cls: "happy" })}<div><b style="font:800 22px/1.2 var(--head)">Skills derived</b><div class="muted small">${sks.verified.length + sks.hidden.length + sks.rusty.length} active skills</div></div></div>
      <div class="chips">${[...sks.verified.map(s => chip(s, "verified")), ...sks.hidden.map(s => chip(s, "hidden")), ...sks.rusty.map(s => chip(s, "rusty"))].join("") || '<span class="muted small">No proofs processed yet.</span>'}</div>
      <span class="tag tag--sample">Sample Profile</span>`;
  }

  const can = step === 1 ? !!S.job : true;
  return `<div class="qs"><section>${ind}${left}
    <div class="qs-nav">${step > 1 ? '<button class="btn ghost" data-act="qs-back">Back</button>' : '<a class="btn ghost" href="index.html">Back to home page</a>'}
      <button class="btn" data-act="qs-next" ${can ? "" : "disabled"}>${step === 3 ? "See my paths" : "Next"}</button></div>
  </section><aside class="preview" aria-live="polite">${right}</aside></div>`;
};

/* ---------- VIEW: HOME (DASHBOARD) ---------- */
V.home = () => {
  const p = planProgress();
  const t = target();
  const match = computePathMatch(t);
  const eng = runEngine(t);

  return `<div class="hello" style="--g:${1 - p};--b:${.85 + p * .2}"><img src="photos/floating-solar-upm.webp" alt="Floating solar panels at Universiti Putra Malaysia">
    <div class="in"><h1 style="font-size:40px;line-height:46px">Welcome back, ${esc(S.name)}.</h1>
    <p class="muted">Your plan is tailored to the Malaysian green economy. Data release: ${S.dataRelease}.</p></div></div>

  ${S.updateProposed ? `<div class="banner" style="background:var(--sun-soft);border:2px solid var(--sun);display:flex;align-items:center;gap:16px;margin-bottom:20px;padding:16px;border-radius:var(--r-lg)">
    <div style="flex:1"><b>Data Update Notice (${S.updateProposed.releaseTag})</b>
      <p class="small muted">${S.updateProposed.reason}</p></div>
    <button class="btn small" data-act="accept-update">Accept New Plan</button>
    <button class="btn small ghost" data-act="dismiss-update">Keep My Plan</button>
  </div>` : ""}

  <div style="background:linear-gradient(135deg, #183b28 0%, #2c6e49 100%);color:#fff;border-radius:20px;padding:26px 30px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap;box-shadow:0 6px 24px rgba(24,59,40,0.18)">
    <div style="max-width:62ch">
      <span style="display:inline-block;padding:4px 12px;border-radius:99px;background:rgba(255,255,255,0.18);font:800 11.5px/1 var(--head);letter-spacing:0.04em;text-transform:uppercase;margin-bottom:8px">Workplace Career Simulator</span>
      <h2 style="font:800 clamp(24px,2.2vw,32px)/1.2 var(--head);color:#fff;margin:0 0 6px">Try → Understand → Pivot</h2>
      <p style="font-size:15px;line-height:22px;color:rgba(255,255,255,0.85);margin:0">Explore your shopfloor on an interactive factory canvas, simulate how AI alters your workflow in real time, and discover which human skills carry into certified green technology roles.</p>
    </div>
    <a href="#skills" class="sprout-journey-cta" style="background:var(--sun);color:var(--ink);border-color:var(--sun);font-size:16px;padding:14px 24px;box-shadow:0 4px 16px rgba(0,0,0,0.2)">
      <span>Step 2: Show Your Skills →</span>
    </a>
  </div>

  <div class="bento">
      <section class="tile tile--hero span-8 rows-2" aria-labelledby="t-track">
        <div class="tile-head"><span class="label" id="t-track">Your path</span><span class="tag tag--sample">Sample</span></div>
        <div class="row" style="justify-content:space-between;align-items:end">
          <div><b style="font:800 26px/1.2 var(--head)">${D.PATHS[t].name}: ${pathSub(t)}</b>
            <div class="muted small">${S.path ? "Chosen by you." : "Best fit so far, from your skills and job demand."}</div></div>
          <div style="text-align:right"><b class="metric">${match.total}</b><span class="label" style="display:block">match out of 100</span></div>
        </div>
        <div class="breakdown-box">
          <div class="breakdown-row"><span>Task Overlap</span><div class="breakdown-bar"><i style="width:${(match.parts.overlap / match.maxParts.overlap) * 100}%"></i></div><b>${Math.round(match.parts.overlap)}<span>/${match.maxParts.overlap}</span></b></div>
          <div class="breakdown-row"><span>Market Demand</span><div class="breakdown-bar"><i style="width:${(match.parts.demand / match.maxParts.demand) * 100}%"></i></div><b>${Math.round(match.parts.demand)}<span>/${match.maxParts.demand}</span></b></div>
          <div class="breakdown-row"><span>Your Interest</span><div class="breakdown-bar"><i style="width:${(match.parts.interest / match.maxParts.interest) * 100}%"></i></div><b>${Math.round(match.parts.interest)}<span>/${match.maxParts.interest}</span></b></div>
          <div class="breakdown-row"><span>Ease of Move</span><div class="breakdown-bar"><i style="width:${(match.parts.ease / match.maxParts.ease) * 100}%"></i></div><b>${Math.round(match.parts.ease)}<span>/${match.maxParts.ease}</span></b></div>
          <div class="breakdown-row"><span>SDG Bonus</span><div class="breakdown-bar"><i style="width:${(match.parts.sdgBonus / 8) * 100}%"></i></div><b>+${Math.round(match.parts.sdgBonus)}<span>/8</span></b></div>
        </div>
        <div class="row" style="gap:10px;margin-top:auto;flex-wrap:wrap">
          <a class="btn small" href="#paths">Compare paths</a>
          <a class="btn small" href="#plan" data-tab="plan:card" style="background:var(--forest)">Transition Card Sim</a>
          <a class="btn small ghost" href="#plan">Open my plan</a>
        </div>
      </section>

      <section class="tile span-4 rows-2" aria-labelledby="t-prog" style="justify-items:center;text-align:center">
        <div class="tile-head" style="width:100%"><span class="label" id="t-prog">Plan progress</span><span class="tag tag--projection">Projection</span></div>
        ${ring(p, 140)}
        <p class="muted small">${S.hours} hours a week · ${rm(S.budget)} a month</p>
        <b>Finish in about ${eng ? eng.totalMonths : 6} months</b>
      </section>

      <section class="tile span-4" aria-labelledby="t-next">
        <div class="tile-head"><span class="label" id="t-next">Next session</span></div>
        <div class="row" style="gap:14px;align-items:center;flex-wrap:nowrap">
          <span class="tile-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>
          <div><b>${S.slots[0] ? S.slots[0].replace("-", " ") : "Saturday morning"}</b>
            <div class="muted small">${eng && eng.steps[0] ? eng.steps[0].name : "Evidence logging and skill review"}</div></div>
        </div>
        <div class="row" style="gap:10px;margin-top:auto">
          <button class="btn small ghost" data-act="missed-week">I missed this week</button>
          <a class="btn small ghost" href="#plan" data-tab="plan:calendar">Calendar</a>
        </div>
      </section>

      <section class="tile span-8" aria-labelledby="t-upd">
        <div class="tile-head"><span class="label" id="t-upd">Market updates in Malaysia</span></div>
        <div class="updates">
          <div><span class="tag tag--real">Real data</span><b>Solar PV Net Energy Metering (NEM) 3.0:</b> New quotas opened for commercial & industrial rooftop installations.</div>
          <div><span class="tag tag--estimate">Estimate</span><b>EV Fast Charging Along PLUS:</b> Target 10,000 charge points by 2026 creates demand for certified installers.</div>
        </div>
        <button class="link-btn" data-act="trigger-demo-update">See how an update is proposed (demo)</button>
      </section>
  </div>`;
};

/* ---------- VIEW: PROFILE ---------- */
async function verifyCertWithBackend(name, text = "") {
  try {
    toast("Verifying certificate with backend /api/cert/verify...");
    const res = await fetch(apiUrl("/api/cert/verify"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, text })
    });
    const data = await res.json();
    if (data.success) {
      if (!S.certsHeld.includes(data.certName)) S.certsHeld.push(data.certName);
      S.certsUploaded[data.certName] = true;
      (data.skills || []).forEach(sk => {
        if (!S.interviewTasks.some(t => t.n === sk)) {
          S.interviewTasks.push({ n: sk, grp: "tech", kept: true, cert: data.certName });
        }
      });
      S.lastCertVerified = data;
      toast(`Verified: ${data.certName}`);
      rerender();
    }
  } catch (err) {
    console.error("Cert verification error:", err);
    if (!S.certsHeld.includes(name)) S.certsHeld.push(name);
    S.certsUploaded[name] = true;
    toast(`Added ${name} to recognised credentials.`);
    rerender();
  }
}

V.profile = () => {
  const tab = tabOf("profile", "about");
  let body = "";

  if (tab === "about") {
    const lastV = S.lastCertVerified;
    const certColumnHtml = `
      <div class="panel" style="background:var(--paper);border:2px solid var(--forest);border-radius:16px;padding:20px;text-align:left;width:100%;box-shadow:0 6px 20px rgba(0,0,0,0.05)">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px;flex-wrap:wrap">
          <div>
            <span class="tag tag--real" style="margin-bottom:4px">Malaysian TVET Credentials</span>
            <h3 style="font:800 18px/1.2 var(--head);margin:4px 0 0;color:var(--forest)">Upload Certificate & SVM (First)</h3>
          </div>
          <span class="pill pill--check" style="background:var(--leaf-soft);color:var(--forest);font-weight:700">JPK & BPLTV Standard</span>
        </div>
        <p class="small muted" style="margin-bottom:14px;line-height:1.4">Upload your Sijil Vokasional Malaysia (SVM), SKM Level 2/3, or DOSH certificate. Our backend automatically verifies competency units against National Occupational Skills Standards (NOSS).</p>
        
        <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap">
          <label class="btn small" style="background:var(--forest);color:#fff;cursor:pointer;display:inline-flex;align-items:center;gap:6px">
            <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 14v2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2M10 3v10M6 7l4-4 4 4"/></svg>
            <span>Upload Certificate / SVM</span>
            <input type="file" id="profile-cert-file" accept="image/*,.pdf" style="display:none" data-act="upload-cert-file">
          </label>
          <button class="btn small ghost" data-act="demo-cert" data-v="svm" style="border-color:var(--forest);color:var(--forest)">⚡ Load SVM Electrical</button>
          <button class="btn small ghost" data-act="demo-cert" data-v="skm3">⚡ Load SKM Level 3</button>
        </div>

        ${lastV ? `
          <div style="background:var(--mist);border:1.5px solid var(--forest);border-radius:12px;padding:12px 14px;margin-bottom:14px">
            <div style="display:flex;align-items:center;gap:8px;font-weight:800;color:var(--forest);font-size:14px">
              <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 8.5l3.5 3.5 6.5-7"/></svg>
              <span>${esc(lastV.certName)}</span>
            </div>
            <div class="small muted" style="margin:4px 0 8px">${esc(lastV.standard)} · Issuer: ${esc(lastV.issuer)}</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px">
              ${(lastV.skills || []).map(sk => `<span class="pill pill--check" style="background:#fff;border:1px solid var(--forest);font-size:12px">${esc(sk)}</span>`).join("")}
            </div>
          </div>
        ` : `
          <div style="background:rgba(44,122,79,0.06);border:1.5px dashed var(--forest);border-radius:12px;padding:12px 14px;margin-bottom:14px;text-align:center">
            <span class="small muted">Drag & drop your SVM / SKM certificate image or PDF here, or select a template above.</span>
          </div>
        `}

        <div style="border-top:1px solid var(--line);padding-top:12px">
          <b style="font-size:13px;color:var(--ink-2)">Recognised Certificates Selected:</b>
          <div style="display:grid;gap:6px;margin-top:8px">
            ${Object.keys(D.CERTS).map(cKey => `
              <label class="row" style="gap:8px;font-size:13.5px;cursor:pointer">
                <input type="checkbox" value="${cKey}" ${S.certsHeld.includes(cKey) ? "checked" : ""} data-bind="cert-held">
                <span>${cKey}</span>
                ${S.certsUploaded[cKey] ? '<span class="pill pill--check" style="margin-left:auto;font-size:11px;padding:2px 8px">Verified</span>' : ''}
              </label>`).join("")}
          </div>
        </div>
      </div>`;

    body = `<div class="cols c6-6"><div class="panel" style="display:grid;gap:18px;align-content:start">
      <div class="field"><label for="f-name">Name</label><input id="f-name" type="text" value="${esc(S.name)}" data-bind="name"></div>
      <div class="field"><label for="f-job">Current Occupation</label><select id="f-job" data-bind="job">${Object.entries(D.JOBS).map(([k, j]) => `<option value="${k}" ${S.job === k ? "selected" : ""}>${j.n}</option>`).join("")}</select></div>
      <div class="field"><label for="f-state2">Malaysian State</label><select id="f-state2" data-bind="state">${D.STATES.map(s => `<option ${s === S.state ? "selected" : ""}>${s}</option>`).join("")}</select></div>
      <div class="field"><label for="f-years">Years of Experience</label><input id="f-years" type="number" min="0" max="45" value="${S.years}" data-bind="years"></div>
      <div class="field"><span class="lbl">Employer HRD Corp Levy Status</span>
        <label class="row" style="gap:8px;cursor:pointer"><input type="checkbox" ${S.hrdLevy ? "checked" : ""} data-bind="hrdLevy"><span>My employer pays HRD Corp levy (claimable courses cost RM0)</span></label></div>
      <div class="panel" style="background:var(--mist);padding:14px;border-radius:12px;text-align:left">
        <b style="font-size:13px">Backend Service Linkage:</b>
        <div class="small muted" style="margin-top:4px">Connected to <code>${apiUrl("/api/interview")}</code> & <code>${apiUrl("/api/market")}</code>. High-speed local validation active.</div>
      </div>
    </div>
    <div class="panel" style="display:grid;justify-items:center;gap:14px;text-align:center">
      <div style="width:160px">${me({ cls: "happy", arm: true })}</div>
      <b style="font:800 22px/1.2 var(--head)">${esc(S.name)}</b>
      <span class="muted">${jobName()}, ${esc(S.state)}, ${S.years} years</span>
      ${certColumnHtml}
    </div></div>`;
  } else {
    body = `<div class="cols c7-5"><div class="panel" style="display:grid;gap:22px;align-content:start">
      <div class="field"><label for="f-hours2">Weekly learning hours</label>
        <div class="row"><span class="big-n" id="o-hours">${S.hours}</span><span class="muted">hours every week</span></div>
        <input id="f-hours2" type="range" min="1" max="15" value="${S.hours}" data-bind="hours"></div>
      <div class="field"><span class="lbl" id="l-b2">Monthly budget for courses</span>
        <div class="choice" role="radiogroup" aria-labelledby="l-b2">${[0, 50, 100, 200, 300].map(b => `<label><input type="radio" name="budget" value="${b}" ${S.budget === b ? "checked" : ""} data-bind="budget"><span>${b === 300 ? "RM300+" : rm(b)}</span></label>`).join("")}</div></div>
      <div class="field"><span class="lbl">Primary goal</span>
        <div class="switch" role="group" aria-label="Your goal"><button data-act="goal" data-v="income" aria-pressed="${S.goal === "income"}">Higher income</button><button data-act="goal" data-v="quick" aria-pressed="${S.goal === "quick"}">Quick move</button></div></div>
      <div class="field"><span class="lbl" id="l-slots">Free time blocks (2 hours each)</span>
        <div class="choice" role="group" aria-labelledby="l-slots">${D.SLOTS.map(([d, t]) => `<label><input type="checkbox" value="${d}-${t}" ${S.slots.includes(d + "-" + t) ? "checked" : ""} data-bind="slot"><span>${d} ${t.toLowerCase()}</span></label>`).join("")}</div></div>
    </div>
    <div class="panel" style="display:grid;gap:16px;align-content:start">
      <h3 style="margin:0">Weekly Schedule</h3>${weekGrid(S.slots)}
      <p class="small muted">${S.slots.length * 2 < S.hours ? `Select at least ${Math.ceil(S.hours / 2)} slots to accommodate ${S.hours} hours.` : `${S.slots.length} time blocks assigned.`}</p>
      <h3 style="margin:0">Timeline Across Paths</h3>
      ${PATH_IDS.map(p => {
        const eng = runEngine(p);
        return `<div class="row" style="justify-content:space-between"><span>${D.PATHS[p].name}</span><b>${eng ? eng.totalMonths : 6} months (${eng && eng.netCost === 0 ? "RM0 HRD claimable" : rm(eng ? eng.netCost : 0)})</b></div>`;
      }).join("")}
      <span class="tag tag--projection">Simulation Engine</span>
    </div></div>`;
  }

  const journeyFooter = `
    <div class="sprout-journey-banner">
      <div>
        <span class="sprout-journey-badge">Step 1 of 6 Complete</span>
        <div class="sprout-journey-body">
          <h4>Baseline Profile & Credentials Configured</h4>
          <p>Next, tell Bijak about a real shift so your skills come from what you actually do.</p>
        </div>
      </div>
      <a href="#skills" class="sprout-journey-cta">
        <span>Step 2: Show Your Skills</span>
        <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h12M11 5l5 5-5 5"/></svg>
      </a>
    </div>`;

  return `${pageHead("Tell us about yourself", "Your job, certificates, hours and budget shape every plan we suggest.")}${tabs("profile", [["about", "About you & Certificates"], ["time", "Time & Budget"]])}${body}${journeyFooter}`;
};

