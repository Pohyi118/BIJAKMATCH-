/* BijakMatch: Skill derivation, weekly engine, match, window, ROI.
   Classic script; shares one global scope with the other app-*.js files (load order in index.html). */
/* ==========================================================================
   2. THREE-TRACK SKILL DERIVATION (§5.1)
   ========================================================================== */
function isSkillCertified(skillName) {
  if (S.certsUploaded[skillName] || (S.pptDone && isPPTSkill(skillName))) return true;
  for (const certKey of S.certsHeld) {
    const certDef = D.CERTS[certKey];
    if (certDef && certDef.skills.includes(skillName)) return true;
  }
  return false;
}

function isPPTSkill(skillName) {
  return ["Wiring, SKM Level 2", "Safety isolation", "Multimeter testing", "Reading drawings"].includes(skillName);
}

function isSkillDoing(skillName) {
  if (S.doing[skillName]) return true;
  const inKept = S.interviewTasks.find(t => t.n === skillName && t.kept);
  return !!inKept;
}

function getSkillTrack(skillName) {
  const cert = isSkillCertified(skillName);
  const doing = isSkillDoing(skillName);

  if (cert && doing) return "verified";
  if (cert && !doing) {
    const last = S.lastWork[skillName];
    if (last === ">1y") return "rusty";
    if (last === "recent") return "verified";
    return "rusty";
  }
  if (!cert && doing) return "hidden";
  return "missing";
}

function deriveSkillsSummary() {
  const verified = new Set();
  const hidden = new Set();
  const rusty = new Set();

  S.certsHeld.forEach(cKey => {
    const cDef = D.CERTS[cKey];
    if (cDef) {
      cDef.skills.forEach(sk => {
        const tr = getSkillTrack(sk);
        if (tr === "verified") verified.add(sk);
        else if (tr === "rusty") rusty.add(sk);
      });
    }
  });

  Object.keys(S.doing).forEach(sk => {
    if (S.doing[sk]) {
      const tr = getSkillTrack(sk);
      if (tr === "verified") verified.add(sk);
      else if (tr === "hidden") hidden.add(sk);
      else if (tr === "rusty") rusty.add(sk);
    }
  });

  S.interviewTasks.filter(t => t.kept).forEach(t => {
    const tr = getSkillTrack(t.n);
    if (tr === "verified") verified.add(t.n);
    else if (tr === "hidden") hidden.add(t.n);
    else if (tr === "rusty") rusty.add(t.n);
  });

  return {
    verified: [...verified],
    hidden: [...hidden],
    rusty: [...rusty]
  };
}

/* ==========================================================================
   3. UNIFIED WEEKLY SIMULATION ENGINE (§7)
   ========================================================================== */
function runEngine(pathKey, overrideOpts = {}) {
  const P = D.PATHS[pathKey];
  if (!P) return null;

  const hoursPerWeek = overrideOpts.hours !== undefined ? overrideOpts.hours : S.hours;
  const monthlyBudget = overrideOpts.budget !== undefined ? overrideOpts.budget : S.budget;
  const hrdLevy = overrideOpts.hrdLevy !== undefined ? overrideOpts.hrdLevy : S.hrdLevy;
  const missedWks = overrideOpts.missedWeeks !== undefined ? overrideOpts.missedWeeks : (S.missedWeeks || 0);

  const skSummary = deriveSkillsSummary();
  const hiddenNeeded = P.skills.filter(([n]) => skSummary.hidden.includes(n));
  const rustyNeeded = P.skills.filter(([n]) => skSummary.rusty.includes(n));
  const missingNeeded = P.skills.filter(([n]) => {
    const tr = getSkillTrack(n);
    return tr === "missing";
  });

  const steps = [];

  // Step 1: PPT for hidden skills
  if (hiddenNeeded.length > 0 && !S.pptDone) {
    const pptCourse = D.COURSES.find(c => c.id === "ppt");
    steps.push({
      stepCategory: 1,
      catName: "Step 1: Recognise Experience (PPT)",
      id: "ppt",
      name: pptCourse.n,
      short: pptCourse.short,
      hours: pptCourse.hours,
      fee: hrdLevy ? 0 : pptCourse.fee,
      originalFee: pptCourse.fee,
      intakeWeek: 1,
      prereqs: [],
      skills: hiddenNeeded.map(([n]) => n),
      why: "Certifies hidden day-to-day skills so you don't waste time retaking whole courses."
    });
  }

  // Step 2: Refresh rusty skills
  rustyNeeded.forEach(([sk]) => {
    const crs = D.COURSES.find(c => c.skills.includes(sk));
    if (crs) {
      const halfHours = Math.max(4, Math.ceil(crs.hours / 2));
      const halfFee = hrdLevy ? 0 : Math.ceil(crs.fee / 2);
      steps.push({
        stepCategory: 2,
        catName: "Step 2: Refresh Rusty Skills",
        id: crs.id + "-refresh",
        baseId: crs.id,
        name: crs.n + " (Refresher)",
        short: crs.short + " refresh",
        hours: halfHours,
        fee: halfFee,
        originalFee: crs.fee,
        intakeWeek: 1,
        prereqs: [],
        skills: [sk],
        why: "Half-duration practical refresher because you held this certificate in the past."
      });
    }
  });

  // Step 3: Gap courses ordered by Window Score
  const gapCourses = [];
  missingNeeded.forEach(([sk, grp]) => {
    if (grp === "law") return; // Handled in Step 4
    const crs = D.COURSES.find(c => c.skills.includes(sk));
    if (crs && !gapCourses.find(x => x.id === crs.id)) {
      const winInput = getTaskWindowScore(sk, S.dataRelease);
      gapCourses.push({
        crs,
        sk,
        scoreVal: winInput.score
      });
    }
  });

  gapCourses.sort((a, b) => b.scoreVal - a.scoreVal);

  gapCourses.forEach(g => {
    const crs = g.crs;
    steps.push({
      stepCategory: 3,
      catName: "Step 3: High-Window Skill Gaps",
      id: crs.id,
      name: crs.n,
      short: crs.short,
      hours: crs.hours,
      fee: (hrdLevy && crs.hrd.includes("Claimable")) ? 0 : crs.fee,
      originalFee: crs.fee,
      intakeWeek: crs.intakeWeek || 2,
      prereqs: [],
      skills: crs.skills,
      why: crs.why || "High market opening window in Malaysia."
    });
  });

  // Step 4: Licences Required by Law
  const licenceSkills = P.skills.filter(([, grp]) => grp === "law");
  licenceSkills.forEach(([sk]) => {
    const crs = D.COURSES.find(c => c.skills.includes(sk));
    if (crs && !steps.find(x => x.id === crs.id)) {
      steps.push({
        stepCategory: 4,
        catName: "Step 4: Statutory Licence (Required by Law)",
        id: crs.id,
        name: crs.n,
        short: crs.short,
        hours: crs.hours,
        fee: crs.fee,
        originalFee: crs.fee,
        intakeWeek: crs.intakeWeek || 6,
        prereqs: crs.prereq ? [crs.prereq] : [],
        skills: crs.skills,
        isLicence: true,
        why: "Legal license required under Malaysian regulations to practice on high-voltage and solar systems."
      });
    }
  });

  // Run weekly execution
  let savings = 0;
  const weeklyDeposit = monthlyBudget / 4.3;
  let currentWeek = missedWks;
  const stepSchedule = [];
  let licenceBlocked = false;
  let licenceBlockReason = "";
  const totalCost = steps.reduce((sum, st) => sum + st.fee, 0);

  // Check 24-month affordability for licences
  const maxSavings24 = monthlyBudget * 24;
  let cumCost = 0;
  for (const st of steps) {
    cumCost += st.fee;
    if (st.isLicence && cumCost > maxSavings24) {
      licenceBlocked = true;
      licenceBlockReason = `${st.short} requires cumulative ${rm(cumCost)}, exceeding your 24-month budget limit of ${rm(maxSavings24)} on ${rm(monthlyBudget)}/month.`;
      break;
    }
  }

  const pending = steps.map(s => ({
    ...s,
    hrsLeft: s.hours,
    done: false,
    startWk: null,
    endWk: null
  }));

  const needsEvidenceBlocks = hiddenNeeded.length > 0 && !S.pptDone;
  let evidenceHoursLogged = 0;
  const weeklyLog = [];

  for (let w = 1; w <= 104; w++) {
    savings += weeklyDeposit;
    let weekAvailH = hoursPerWeek;
    let evidenceDoneThisWeek = false;

    if (needsEvidenceBlocks && evidenceHoursLogged < 10) {
      evidenceHoursLogged += 1;
      weekAvailH = Math.max(0, weekAvailH - 1);
      evidenceDoneThisWeek = true;
    }

    const nextStep = pending.find(st => !st.done && st.intakeWeek <= (w + missedWks) && st.fee <= savings);

    if (nextStep) {
      if (nextStep.startWk === null) {
        nextStep.startWk = w + missedWks;
        savings -= nextStep.fee;
      }
      const hrsThisWeek = Math.min(weekAvailH, nextStep.hrsLeft);
      nextStep.hrsLeft -= hrsThisWeek;
      if (nextStep.hrsLeft <= 0) {
        nextStep.done = true;
        nextStep.endWk = w + missedWks;
      }
      weeklyLog.push({
        week: w + missedWks,
        stepId: nextStep.id,
        stepName: nextStep.short,
        hours: hrsThisWeek,
        isEvidence: false,
        evidenceHour: evidenceDoneThisWeek ? 1 : 0
      });
    } else {
      weeklyLog.push({
        week: w + missedWks,
        stepId: null,
        stepName: "Saving budget / Waiting intake",
        hours: 0,
        isEvidence: false,
        evidenceHour: evidenceDoneThisWeek ? 1 : 0
      });
    }

    if (pending.every(st => st.done)) {
      currentWeek = w + missedWks;
      break;
    }
    currentWeek = w + missedWks;
  }

  const finishedAll = pending.every(st => st.done);
  const totalWeeks = finishedAll ? currentWeek : Math.max(currentWeek, Math.ceil(totalCost / Math.max(1, weeklyDeposit)));
  const totalMonths = Math.max(1, Math.ceil(totalWeeks / 4.3));

  return {
    pathKey,
    steps: pending,
    totalWeeks,
    totalMonths,
    totalCost,
    netCost: totalCost,
    licenceBlockedByBudget: licenceBlocked,
    licenceBlockReason,
    weeklyLog,
    stepCount: steps.length
  };
}

/* ==========================================================================
   4. WINDOW SCORES & TIME MACHINE CALCULATIONS (§5, §6)
   ========================================================================== */
function getTaskWindowScore(taskName, releaseId) {
  const relId = releaseId || S.dataRelease || "2026-03";
  const snap = D.SNAPSHOTS.find(s => s.id === relId) || D.SNAPSHOTS[2];
  const metrics = (snap.taskMetrics && snap.taskMetrics[taskName]) || { d: .4, s: .3, p: .2, label: "Narrowing" };
  const rawScore = D.windowOf([metrics.d, metrics.s, metrics.p]);
  const label = metrics.label || D.windowLabel(rawScore);

  let conf = "Medium";
  if (["Inverter fault diagnosis", "EV charger installation"].includes(taskName)) conf = "High";
  if (taskName === "Parameter logging") conf = "High";

  return {
    raw: rawScore,
    score: rawScore,
    label,
    conf,
    release: snap.n,
    releaseTag: snap.releaseTag
  };
}

/* ==========================================================================
   5. MATCH SCORE WITH 4-PART BREAKDOWN (§5, §6)
   ========================================================================== */
const PATH_IDS = ["stay", "evolve", "pivot"];

function computePathMatch(pathKey, state = S) {
  const P = D.PATHS[pathKey];
  if (!P) return { total: 0, parts: {} };

  // Gather the worker's facts; the arithmetic and every weight live in shared/scoring.js and shared/rules.v1.js.
  const eng = runEngine(pathKey, { hours: state.hours, budget: state.budget, hrdLevy: state.hrdLevy });
  const snap = D.SNAPSHOTS.find(s => s.id === state.dataRelease) || D.SNAPSHOTS[2];
  const win = getTaskWindowScore(P.windowTask, state.dataRelease);
  const scenKey = state.scenario || "moderate";
  const sdgPri = state.sdgPriority || "sdg4_8";

  const res = BMScoring.scorePath({
    goal: state.goal,
    baseOverlap: D.TASKOVER[state.job || "tech"]?.[pathKey] || BM_RULES.score.defaultBaseOverlap,
    skills: P.skills.map(([name, group]) => ({ group, track: getSkillTrack(name) })),
    baseDemand: P.demand[scenKey] || BM_RULES.score.defaultDemand,
    snapshotMult: snap.mult[pathKey] || 1.0,
    windowLabel: win.label,
    payHigh: P.pay[1],
    interest: (state.interests && state.interests[pathKey]) || "maybe",
    months: eng ? eng.totalMonths : BM_RULES.score.ease.defaultMonths,
    netCost: eng ? eng.netCost : P.cost,
    budget: state.budget,
    licenceBlocked: Boolean(eng && eng.licenceBlockedByBudget),
    sdgFit: D.SDGFIT[sdgPri]?.[pathKey] || BM_RULES.score.defaultSdgFit
  });
  return { ...res, window: win, engine: eng };
}

function score(p) {
  return computePathMatch(p).total;
}

const ranked = (state = S) => [...PATH_IDS].sort((a, b) => computePathMatch(b, state).total - computePathMatch(a, state).total);
const pathSub = p => (p === "stay" && S.job) ? D.STAY_ROLE[S.job] : D.PATHS[p].sub;
const target = () => S.path || S.sel || ranked()[0];

/* ==========================================================================
   5b. SALARY LIFT, MALAYSIAN ROI & VERIFIABLE CREDENTIALS (OPTIONS 1 & 2)
   ========================================================================== */
function computeROI(pKey, currentWage = S.wage || 2800, hrdLevy = S.hrdLevy) {
  const P = D.PATHS[pKey] || D.PATHS.evolve;
  const targetWage = P.pay[1] || 4500;
  const monthlyLift = Math.max(0, targetWage - currentWage);
  const annualLift = monthlyLift * 12;
  const eng = runEngine(pKey, { budget: S.budget, hours: S.hours, hrdLevy });
  const netCost = eng ? eng.netCost : P.cost;
  const grossCost = eng ? eng.totalCost : P.cost;
  const subsidySaved = Math.max(0, grossCost - netCost);
  let paybackWeeks = 0;
  let paybackLabel = "Immediate (<1 week)";
  if (netCost > 0 && monthlyLift > 0) {
    const wks = (netCost / monthlyLift) * 4.3;
    paybackWeeks = wks;
    paybackLabel = wks <= 1 ? "Under 1 week" : `${wks.toFixed(1)} wks (${(wks / 4.3).toFixed(1)} mo)`;
  } else if (netCost === 0) {
    paybackLabel = "Immediate (0 out-of-pocket)";
  } else {
    paybackLabel = "N/A";
  }
  const fiveYearNet = (annualLift * 5) - netCost;
  const liftPercent = Math.round((monthlyLift / Math.max(1, currentWage)) * 100);
  return {
    pKey,
    pathName: P.name,
    pathSub: pathSub(pKey),
    currentWage,
    targetWage,
    monthlyLift,
    liftPercent,
    annualLift,
    netCost,
    grossCost,
    subsidySaved,
    paybackLabel,
    paybackWeeks,
    fiveYearNet
  };
}

function getVerificationHash(state = S) {
  const pId = state.person || "ahmad";
  const yr = "2026";
  const key = (state.path || state.sel || "evolve").toUpperCase().slice(0, 3);
  return `BM-MY-${yr}-NOSS-0842-${key}-${pId.toUpperCase().slice(0, 3)}`;
}

let currentRoiPath = "evolve";

function renderROIDrawerContent(pk) {
  currentRoiPath = pk || currentRoiPath || S.sel || S.path || "evolve";
  const P = D.PATHS[currentRoiPath];
  const curWage = S.wage || 2800;
  const roi = computeROI(currentRoiPath, curWage, S.hrdLevy);
  const eng = runEngine(currentRoiPath);
  const mo = eng ? eng.totalMonths : 6;

  return `<button class="drawer-close" data-act="close-roi" aria-label="Close">&times;</button>
    <div class="row" style="gap:12px;align-items:center;border-bottom:1.5px solid var(--line);padding-bottom:14px">
     
      <div>
        <h2 id="roi-title" style="font-size:24px;margin:0">Salary Lift & ROI Calculator</h2>
        <span class="muted small">Real DOSM wage surveys (2025/2026) vs Net Course Costs</span>
      </div>
    </div>

    <div>
      <span class="lbl small" style="font-weight:700;display:block;margin-bottom:8px">Select Target Pathway:</span>
      <div class="switch" role="group" aria-label="Select Pathway" style="width:100%">
        ${PATH_IDS.map(k => `<button data-act="roi-switch-path" data-p="${k}" aria-pressed="${k === currentRoiPath}" style="flex:1">${D.PATHS[k].name}</button>`).join("")}
      </div>
      <div class="small muted" style="margin-top:6px">Target: <b>${P.name}: ${pathSub(currentRoiPath)}</b> (Median pay: ${rm(P.pay[0])} - ${rm(P.pay[1])}/mo)</div>
    </div>

    <div class="roi-card">
      <div class="field">
        <div class="row" style="justify-content:space-between">
          <label for="roi-wage-range" style="font-weight:700">Your Current Monthly Wage:</label>
          <b style="font:800 20px/1 var(--head);color:var(--forest)">${rm(curWage)}</b>
        </div>
        <input type="range" id="roi-wage-range" min="1500" max="5500" step="50" value="${curWage}" data-bind="roi-wage">
        <div class="row small muted" style="justify-content:space-between">
          <span>RM1,500</span><span>Tech Median: RM2,800</span><span>RM5,500</span>
        </div>
      </div>

      <label class="row" style="background:var(--paper);padding:10px 14px;border-radius:10px;cursor:pointer;border:1px solid var(--line)">
        <input type="checkbox" data-bind="roi-hrd" ${S.hrdLevy ? "checked" : ""}>
        <div class="small">
          <b>Employer HRD Corp Levy Support</b>
          <div class="muted">Reduces eligible green course costs to RM0 via statutory employer levy.</div>
        </div>
      </label>
    </div>

    <div class="roi-grid">
      <div class="roi-stat">
        <span class="muted small">Monthly Wage Lift</span>
        <b>+${rm(roi.monthlyLift)}</b>
        <span class="small" style="color:var(--forest);font-weight:700">+${roi.liftPercent}% increase</span>
      </div>
      <div class="roi-stat">
        <span class="muted small">1-Year Income Gain</span>
        <b>+${rm(roi.annualLift)}</b>
        <span class="small muted">Pre-tax cumulative</span>
      </div>
      <div class="roi-stat">
        <span class="muted small">Net Training Cost</span>
        <b style="color:${roi.netCost === 0 ? "var(--forest)" : "var(--ink)"}">${rm(roi.netCost)}</b>
        <span class="small muted">${roi.subsidySaved > 0 ? `Subsidies saved ${rm(roi.subsidySaved)}` : "Direct investment"}</span>
      </div>
      <div class="roi-stat">
        <span class="muted small">Payback Period</span>
        <b style="font-size:18px;line-height:28px">${roi.paybackLabel}</b>
        <span class="small muted">Transition in ~${mo} mo</span>
      </div>
    </div>

    <div class="roi-paycheck-compare">
      <b class="small">Monthly Paycheck Comparison:</b>
      <div class="roi-bar-row">
        <span class="small">Current:</span>
        <div class="roi-bar-track"><i style="width:${Math.min(100, (curWage / 5000) * 100)}%;background:var(--stone)"></i></div>
        <b class="small">${rm(curWage)}</b>
      </div>
      <div class="roi-bar-row">
        <span class="small">Target:</span>
        <div class="roi-bar-track"><i style="width:${Math.min(100, (roi.targetWage / 5000) * 100)}%;background:var(--leaf)"></i></div>
        <b class="small" style="color:var(--forest)">${rm(roi.targetWage)}</b>
      </div>
      <div class="small muted" style="text-align:right">
        5-Year Cumulative Upside: <b style="color:var(--forest)">+${rm(roi.fiveYearNet)}</b>
      </div>
    </div>

    <div style="margin-top:auto;display:grid;gap:10px">
      <button class="btn" style="width:100%" data-act="apply-roi-path" data-p="${currentRoiPath}">
        Select ${P.name} & View Action Plan
      </button>
      <button class="btn ghost small" style="width:100%" data-act="close-roi">Close Calculator</button>
    </div>`;
}

function openROIDrawer(pKey) {
  const pk = pKey || S.sel || S.path || "evolve";
  currentRoiPath = pk;
  const d = $("#roi-drawer");
  const c = $("#roi-content");
  if (!d || !c) return;
  c.innerHTML = renderROIDrawerContent(pk);
  d.classList.add("open");
  d.setAttribute("aria-hidden", "false");
}

function closeROIDrawer() {
  const d = $("#roi-drawer");
  if (d) {
    d.classList.remove("open");
    d.setAttribute("aria-hidden", "true");
  }
}
const inPlan = id => S.plan.includes(id);
const logged = id => S.log[id] || 0;

function planProgress() {
  if (!S.plan.length) return 0;
  const cs = S.plan.map(id => D.COURSES.find(c => c.id === id)).filter(Boolean);
  const totH = cs.reduce((a, c) => a + c.hours, 0);
  if (!totH) return 0;
  const doneH = cs.reduce((a, c) => a + (S.certsUploaded[c.id] ? c.hours : Math.min(c.hours, logged(c.id))), 0);
  return clamp(doneH / totH);
}

function courseDone(c) {
  if (S.certsUploaded[c.id]) return 1;
  return clamp((S.log[c.id] || 0) / c.hours);
}

// "Do nothing" baseline score: 100 * (1 - AI exposure) * 0.55
function doNothingScore(m = 0) {
  const j = D.JOBS[S.job || "tech"];
  if (!j) return 40;
  const avgExp = j.tasks.reduce((acc, t) => acc + t.e[S.year || 2], 0) / j.tasks.length;
  const timeDecay = 1 + (m / 24) * 0.35;
  const effectiveExp = clamp(avgExp * (S.pace === "fast" ? 1.0 : 0.7) * timeDecay);
  return Math.round(100 * (1 - effectiveExp) * 0.55);
}

