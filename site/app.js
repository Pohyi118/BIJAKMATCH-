/* BijakMatch app.js — Rebuilt logic engine v2 following proposal (ReRole Green 提案.pdf).
   Integrates three-track skills, shift interview, 4-part match scoring, window scores,
   time machine, single weekly simulation engine, licence gates, honest subsidies,
   calendar with evidence blocks, rescheduling, change direction, and transition card. */

const { animate, stagger } = Motion;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const D = DATA;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const rm = n => "RM" + Math.round(n).toLocaleString("en-MY");
const esc = s => String(s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* Backend API Configuration & Universal Base URL Resolver */
const API_BASE = (() => {
  if (typeof window !== "undefined" && window.BIJAK_API_BASE) return window.BIJAK_API_BASE;
  if (typeof location !== "undefined" && location.protocol.startsWith("http")) {
    if (location.port && location.port !== "5050" && (location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
      return `http://${location.hostname}:5050`;
    }
    return "";
  }
  return "http://localhost:5050";
})();

const apiUrl = ep => `${API_BASE}/${ep.replace(/^\//, "")}`;

let backendStatus = { ok: false, checked: false, endpoints: [] };
async function checkBackendHealth() {
  try {
    const res = await fetch(apiUrl("/api/health"), { method: "GET" });
    if (res.ok) {
      const data = await res.json();
      backendStatus = { ok: true, checked: true, ...data };
      console.log("[BijakMatch Backend Linked]", backendStatus);
    } else {
      backendStatus = { ok: false, checked: true };
    }
  } catch (e) {
    backendStatus = { ok: false, checked: true, error: e.message };
  }
}
checkBackendHealth();

/* ==========================================================================
   1. SHARED STATE (VERSION 2)
   ========================================================================== */
const SLOT_ORDER = ["Sat-Morning", "Tue-Evening", "Thu-Evening", "Sun-Morning", "Mon-Evening", "Wed-Evening", "Fri-Evening", "Sat-Evening", "Sun-Evening"];
const defaultSlots = h => SLOT_ORDER.slice(0, Math.max(1, Math.ceil(h / 2)));

function fresh(pid, filled = false) {
  const p = BM.PEOPLE.find(x => x.id === pid) || BM.PEOPLE[0];
  const s = {
    v: 2,
    person: p.id,
    name: p.n,
    job: p.job,
    state: p.r.split(", ")[1] || "Penang",
    years: p.id === "student" ? 1 : 6,
    hours: p.hours,
    budget: p.budget,
    wage: p.wage || 2800,
    goal: p.goal || "income",
    scenario: "moderate",
    sdgPriority: "sdg4_8",
    dataRelease: "2026-03",
    slots: defaultSlots(p.hours),
    hrdLevy: p.hrdLevy !== undefined ? p.hrdLevy : true,
    certsHeld: [...(p.certs || [])],
    lastWork: { ...(p.lastWork || {}) },
    doing: {},
    interviewPhase: 0,
    interviewAnswers: ["", "", "", "", ""],
    interviewFollowAnswer: "",
    interviewTasks: [],
    age: null,
    aim: "",
    experience: null,
    ai: freshAI(),
    live: freshLive(),
    unclassifiedTasks: [],
    interests: { stay: "maybe", evolve: "maybe", pivot: "maybe" },
    path: null,
    sel: "evolve",
    plan: [],
    log: {},
    certsUploaded: {},
    pptDone: false,
    proofs: [],
    passportStamps: [],
    missedWeeks: 0,
    planRelease: "2026-03",
    updateProposed: null,
    planHistory: [],
    tab: {
      profile: "about",
      skills: "interview",
      impact: "simulator",
      dd: "compare",
      plan: "timeline",
      coursesFilter: "all",
      simMode: "story",
      cardMode: "sim",
      simM: 0
    },
    sprout: {
      station: "qc",
      flowTab: "current",
      exp: "intermediate",
      rotated: false,
      zoom: 75,
      activeModal: null,
      simStep: "idle",
      simChoice: null,
      subtab: "details",
      savedStation: null
    },
    done: {
      start: filled,
      profile: filled,
      skills: filled,
      impact: filled,
      paths: filled,
      courses: false,
      plan: false
    },
    qs: 1,
    week: 0,
    year: 2,
    pace: "fast",
    lastChangeNotice: null
  };

  if (filled) {
    s.proofs.push("interview");
    populateInterviewDefaults(s, p.job);
    s.passportStamps.push({ title: "Shift Interview Verified", date: "Oct 2026", source: "5-phase workplace shift" });
    if (s.certsHeld.length) {
      s.passportStamps.push({ title: s.certsHeld[0], date: "Certified", source: "Malaysian Whitelist" });
    }
  }

  return s;
}

function populateInterviewDefaults(state, jobId) {
  const job = D.JOBS[jobId || "tech"];
  if (!job || !job.interview) return;
  state.interviewTasks = [];
  job.interview.forEach((step, idx) => {
    state.interviewAnswers[idx] = step.a;
    step.cards.forEach(cardName => {
      state.doing[cardName] = true;
      if (!state.interviewTasks.find(t => t.n === cardName)) {
        state.interviewTasks.push({ n: cardName, quote: step.a, kept: true, phase: step.phase });
      }
    });
    if (step.follow) {
      state.interviewFollowAnswer = step.follow.a;
      step.follow.cards.forEach(cardName => {
        state.doing[cardName] = true;
        if (!state.interviewTasks.find(t => t.n === cardName)) {
          state.interviewTasks.push({ n: cardName, quote: step.follow.a, kept: true, phase: step.phase + " (follow-up)" });
        }
      });
    }
  });
}

let S;
try {
  S = JSON.parse(localStorage.getItem("bm-state-v2"));
} catch (e) {}
if (!S || S.v !== 2) {
  S = fresh("ahmad", true);
}
if (!S.tab) S.tab = {};
if (!S.tab.cardMode) S.tab.cardMode = "sim";
if (!S.tab.impact || S.tab.impact === "tasks") S.tab.impact = "simulator";
if (!S.sprout) {
  S.sprout = {
    station: "qc",
    flowTab: "current",
    exp: "intermediate",
    rotated: false,
    zoom: 75,
    activeModal: null,
    simStep: "idle",
    simChoice: null,
    subtab: "details",
    savedStation: null
  };
}
if (!S.ai) S.ai = freshAI();
S.ai.pending = false;
if (!S.live) S.live = freshLive();
if (S.market && S.market.loading) S.market = { ...S.market, loading: false, error: "The page was reloaded during the analysis. Run it again." };
if (S.live.status === "live" || S.live.status === "connecting") S.live.status = Object.keys(S.live.results).length ? "done" : "idle";
if (!S.wage) S.wage = (person() && person().wage) || 2800;

const save = () => {
  try {
    localStorage.setItem("bm-state-v2", JSON.stringify(S));
  } catch (e) {}
};

const person = () => BM.PEOPLE.find(p => p.id === S.person) || BM.PEOPLE[0];
const me = (extra = {}) => BM.avatarSVG({ ...person().a, ...extra });
const jobName = () => (S.job && D.JOBS[S.job]) ? D.JOBS[S.job].n : "Your job";

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

  const isQuick = state.goal === "quick";
  const isIncome = state.goal === "income";

  const W_PARTS = isQuick
    ? { overlap: 40, demand: 20, interest: 15, ease: 25 }
    : { overlap: 30, demand: 35, interest: 15, ease: 20 };

  // Part 1: Task Overlap (50% base job overlap, 50% worker skill match)
  const baseOverlap = (D.TASKOVER[state.job || "tech"]?.[pathKey] || 0.6) * 100;
  let skillWeightSum = 0;
  P.skills.forEach(([skName, grp]) => {
    const tr = getSkillTrack(skName);
    if (grp === "law") {
      if (tr === "verified") skillWeightSum += 1.0;
    } else {
      if (tr === "verified") skillWeightSum += 1.0;
      else if (tr === "hidden") skillWeightSum += 0.75;
      else if (tr === "rusty") skillWeightSum += 0.60;
    }
  });
  const skillMatchPct = (skillWeightSum / Math.max(1, P.skills.length)) * 100;
  const rawOverlap = 0.5 * baseOverlap + 0.5 * skillMatchPct;
  const p1 = (rawOverlap / 100) * W_PARTS.overlap;

  // Part 2: Market Demand (AI Scenario + Snapshot + Window Score + Income Premium)
  const scenKey = state.scenario || "moderate";
  const baseDemand = P.demand[scenKey] || 0.7;
  const snap = D.SNAPSHOTS.find(s => s.id === state.dataRelease) || D.SNAPSHOTS[2];
  const mult = snap.mult[pathKey] || 1.0;
  const win = getTaskWindowScore(P.windowTask, state.dataRelease);

  let demandRatio = baseDemand * mult;
  if (win.label === "Long") demandRatio += 0.08;
  else if (win.label === "Closing") demandRatio -= 0.12;

  if (isIncome) {
    const payRatio = (P.pay[1] - 2400) / 2200; // Evolve pay 4500 yields higher
    demandRatio = demandRatio * 0.7 + payRatio * 0.3;
  }
  const p2 = clamp(demandRatio, 0, 1.1) * W_PARTS.demand;

  // Part 3: Your Interest (Yes=100%, Maybe=50%, No=0%)
  const ans = (state.interests && state.interests[pathKey]) || "maybe";
  const intFactor = ans === "yes" ? 1.0 : ans === "maybe" ? 0.55 : 0.05;
  const p3 = intFactor * W_PARTS.interest;

  // Part 4: Ease of Move (60% Time fit, 40% Money fit from Weekly Engine)
  const eng = runEngine(pathKey, {
    hours: state.hours,
    budget: state.budget,
    hrdLevy: state.hrdLevy
  });
  const mo = eng ? eng.totalMonths : 6;
  const timeFit = clamp(1 - (mo - 2) / 18, 0, 1);
  const cost = eng ? eng.netCost : P.cost;
  const savings24 = state.budget * 24;
  const moneyFit = cost <= 0 ? 1 : clamp(savings24 / cost, 0, 1);
  const easeFactor = 0.6 * timeFit + 0.4 * moneyFit;
  let p4 = easeFactor * W_PARTS.ease;

  if (eng && eng.licenceBlockedByBudget) {
    p4 = Math.max(2, p4 - 8);
  }

  // SDG Priority Bonus (up to +8 points)
  const sdgPri = state.sdgPriority || "sdg4_8";
  const sdgBonus = (D.SDGFIT[sdgPri]?.[pathKey] || 0.5) * 8;

  const total = clamp(Math.round(p1 + p2 + p3 + p4 + sdgBonus), 0, 100);

  return {
    total,
    parts: {
      overlap: Math.round(p1 * 10) / 10,
      demand: Math.round(p2 * 10) / 10,
      interest: Math.round(p3 * 10) / 10,
      ease: Math.round(p4 * 10) / 10,
      sdgBonus: Math.round(sdgBonus * 10) / 10
    },
    maxParts: W_PARTS,
    window: win,
    engine: eng
  };
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

/* ==========================================================================
   6. VISUAL PIECES, ICONS, AND WIDGETS
   ========================================================================== */
const WX = {
  sun: '<svg class="wx" viewBox="0 0 34 34" role="img" aria-label="Low risk"><circle cx="17" cy="17" r="7" fill="#F2C230"/><g stroke="#F2C230" stroke-width="3" stroke-linecap="round"><path d="M17 3v4M17 27v4M3 17h4M27 17h4M7 7l3 3M24 24l3 3M7 27l3-3M24 10l3-3"/></g></svg>',
  part: '<svg class="wx" viewBox="0 0 34 34" role="img" aria-label="Some risk"><circle cx="13" cy="13" r="7" fill="#F2C230"/><path d="M10 27h16a6 6 0 0 0 0-12 8 8 0 0 0-15 3 4.5 4.5 0 0 0-1 9z" fill="#B9C6D6"/></svg>',
  cloud: '<svg class="wx" viewBox="0 0 34 34" role="img" aria-label="Higher risk"><path d="M8 25h18a7 7 0 0 0 0-14 9 9 0 0 0-17 3 5.5 5.5 0 0 0-1 11z" fill="#8FA0B5"/><path d="M12 28l-2 4M18 28l-2 4M24 28l-2 4" stroke="#5E8FD6" stroke-width="2.4" stroke-linecap="round"/></svg>'
};

const ICON = {
  tech: '<circle cx="20" cy="20" r="7" fill="none" stroke="#1E5A3A" stroke-width="4"/><path d="M20 4v6M20 30v6M4 20h6M30 20h6M8.7 8.7l4.2 4.2M27.1 27.1l4.2 4.2M8.7 31.3l4.2-4.2M27.1 12.9l4.2-4.2" stroke="#1E5A3A" stroke-width="4" stroke-linecap="round"/>',
  qc: '<circle cx="17" cy="17" r="10" fill="#DCEBD2" stroke="#1E5A3A" stroke-width="4"/><path d="M25 25l10 10" stroke="#1E5A3A" stroke-width="5" stroke-linecap="round"/><path d="M12 17l4 4 6-7" stroke="#1E5A3A" stroke-width="3" fill="none" stroke-linecap="round"/>',
  elec: '<path d="M23 3L8 23h11l-3 14 16-21H21z" fill="#F2C230" stroke="#1E5A3A" stroke-width="3" stroke-linejoin="round"/>',
  fork: '<rect x="4" y="10" width="18" height="16" rx="3" fill="#1E5A3A"/><path d="M26 6v24h10" stroke="#1E5A3A" stroke-width="4" fill="none"/><circle cx="10" cy="32" r="4" fill="#7BAE5E"/><circle cx="21" cy="32" r="4" fill="#7BAE5E"/>',
  admin: '<path d="M8 3h17l8 8v26H8z" fill="#DCEBD2" stroke="#1E5A3A" stroke-width="3" stroke-linejoin="round"/><path d="M13 18h14M13 24h14M13 30h9" stroke="#1E5A3A" stroke-width="3" stroke-linecap="round"/>',
  student: '<path d="M20 6L2 15l18 9 18-9z" fill="#1E5A3A"/><path d="M9 19v9c6 5 16 5 22 0v-9" stroke="#1E5A3A" stroke-width="3.5" fill="#DCEBD2"/><path d="M35 15v11" stroke="#F2C230" stroke-width="3"/>'
};

const icon = k => `<svg class="ic" viewBox="0 0 40 40" aria-hidden="true">${ICON[k] || ICON.tech}</svg>`;
const chip = (n, track) => `<span class="chip ${track === "verified" ? "" : track === "hidden" ? "hidden" : "refresh"}">${esc(n)} <em style="font-size:14px;font-style:normal;margin-left:4px">(${track})</em></span>`;
const ring = (p, size = 120) => `<svg viewBox="0 0 120 120" width="${size}" height="${size}" role="img" aria-label="${Math.round(p * 100)}% done"><circle cx="60" cy="60" r="50" fill="none" style="stroke:var(--surface-muted)" stroke-width="14"/><circle cx="60" cy="60" r="50" fill="none" style="stroke:var(--primary)" stroke-width="14" stroke-linecap="round" stroke-dasharray="314.2" stroke-dashoffset="${314.2 * (1 - p)}" transform="rotate(-90 60 60)"/><text x="60" y="68" text-anchor="middle" font-family="Overpass,sans-serif" font-weight="800" font-size="26" style="fill:var(--text)">${Math.round(p * 100)}%</text></svg>`;

function weekGrid(slots) {
  return `<div class="week" aria-label="Your free times">${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => `<div><span>${d}</span>
    <i class="${slots.includes(d + "-Morning") ? "on" : ""}" title="${d} morning"></i><i class="${slots.includes(d + "-Evening") ? "half" : ""}" title="${d} evening"></i></div>`).join("")}</div>`;
}

function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.setAttribute("role", "status");
  t.textContent = msg;
  document.body.appendChild(t);
  if (!BM.still()) animate(t, { transform: ["translate(-50%,20px)", "translate(-50%,0)"] }, { duration: .3 });
  setTimeout(() => t.remove(), 2800);
}

const tabs = (key, list) => {
  const cur = S.tab[key] || list[0][0];
  return `<div class="tabs" role="tablist">${list.map(([id, n]) => `<button role="tab" aria-selected="${id === cur}" data-tab="${key}:${id}">${n}</button>`).join("")}</div>`;
};
const pageHead = (title, lead) => `<div class="ph"><div><h1>${title}</h1><p>${lead}</p></div></div>`;
const tabOf = (key, def) => S.tab[key] || def;

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

  <section class="panel" style="margin-top:20px;display:grid;gap:14px">
    <h3>Try it as someone else</h3>
    <div class="people">${BM.PEOPLE.map(p => `<a class="person-card" href="#${p.id}">${BM.avatarSVG(p.a)}<b>${p.n}</b><span>${p.r}</span></a>`).join("")}</div>
  </section>`;
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
    <a href="#impact" class="sprout-journey-cta" style="background:var(--sun);color:var(--ink);border-color:var(--sun);font-size:16px;padding:14px 24px;box-shadow:0 4px 16px rgba(0,0,0,0.2)">
      <span>Step 2: How AI Can Affect Your World →</span>
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
        <span class="sprout-journey-badge">Step 1 of 5 Complete</span>
        <div class="sprout-journey-body">
          <h4>Baseline Profile & Credentials Configured</h4>
          <p>Now step onto the factory floor to simulate how AI alters your daily shopfloor tasks and discover which human skills remain irreplaceable.</p>
        </div>
      </div>
      <a href="#impact" class="sprout-journey-cta">
        <span>Step 2: How AI Can Affect Your World</span>
        <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h12M11 5l5 5-5 5"/></svg>
      </a>
    </div>`;

  return `${pageHead("Tell us about yourself", "Your job, certificates, hours and budget shape every plan we suggest.")}${tabs("profile", [["about", "About you & Certificates"], ["time", "Time & Budget"]])}${body}${journeyFooter}`;
};

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
const EXP_LEVELS = [[80, "Expert"], [55, "Experienced"], [30, "Developing"], [0, "Beginner"]];

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

/* ---------- VIEW: SKILLS & PROOF ---------- */
V.skills = () => {
  const tab = tabOf("skills", "interview");
  let body = "";

  if (tab === "interview") {
    body = interviewView();
  } else if (tab === "check") {
    const sks = deriveSkillsSummary();
    body = `<div class="cols c8-4">
      <div style="display:grid;gap:18px">
        <div class="panel">
          <div class="row" style="justify-content:space-between">
            <div><h3 style="margin:0">Verified Skills (${sks.verified.length})</h3><p class="small muted">Certified by recognized credentials AND currently performed on the job.</p></div>
            <span class="pill pill--check">Carry over directly</span>
          </div>
          <div class="chips" style="margin-top:12px">${sks.verified.map(s => chip(s, "verified")).join("") || '<span class="muted small">None yet</span>'}</div>
        </div>

        <div class="panel">
          <div class="row" style="justify-content:space-between">
            <div><h3 style="margin:0">Hidden Skills (${sks.hidden.length})</h3><p class="small muted">Performed in your daily work, but uncertified on paper.</p></div>
            <span class="tag tag--sample">Target for PPT Certification</span>
          </div>
          <div class="chips" style="margin-top:12px">${sks.hidden.map(s => chip(s, "hidden")).join("") || '<span class="muted small">None yet</span>'}</div>
        </div>

        <div class="panel">
          <div class="row" style="justify-content:space-between">
            <div><h3 style="margin:0">Rusty Skills (${sks.rusty.length})</h3><p class="small muted">Covered by an official certificate, but not performed for over a year.</p></div>
            <span class="tag tag--estimate">Refresh (50% hours)</span>
          </div>
          <div class="chips" style="margin-top:12px">${sks.rusty.map(s => chip(s, "rusty")).join("") || '<span class="muted small">None yet</span>'}</div>
        </div>

        <div class="panel">
          <h3>Add a Skill from Task Dictionary</h3>
          <p class="small muted">Pick from standard Malaysian occupational taxonomy (NOSS whitelist).</p>
          <div class="row" style="margin-top:10px">
            <select id="dict-pick" style="flex:1;padding:8px 12px;border-radius:10px;border:1.5px solid var(--line);font:inherit">
              ${D.TASKCARDS.map(tc => `<option value="${tc.n}">${tc.n} [${tc.noss}]</option>`).join("")}
            </select>
            <button class="btn small" data-act="add-dict-skill">Add to My Profile</button>
          </div>
        </div>
      </div>

      <div class="panel" style="display:grid;gap:14px;align-content:start">
        <h3>Rusty Verification Check</h3>
        <p class="small muted">If your certificate covers a skill the interview didn't mention, confirm when you last performed it:</p>
        <div style="background:var(--mist);border-radius:10px;padding:12px;display:grid;gap:8px">
          <b>Wiring, SKM Level 2</b>
          <span class="small muted">When did you last wire an industrial electrical distribution board?</span>
          <div class="row">
            <button class="btn small ${S.lastWork["Wiring, SKM Level 2"] === "recent" ? "" : "ghost"}" data-act="set-last-work" data-k="Wiring, SKM Level 2" data-v="recent">Recent (≤1 yr)</button>
            <button class="btn small ${S.lastWork["Wiring, SKM Level 2"] === ">1y" ? "" : "ghost"}" data-act="set-last-work" data-k="Wiring, SKM Level 2" data-v=">1y">>1 year ago</button>
          </div>
        </div>
      </div>
    </div>`;
  } else {
    // Passport view
    const sks = deriveSkillsSummary();
    body = `<div class="cols c8-4">
      <div class="panel" style="display:grid;gap:18px">
        <div class="row" style="justify-content:space-between">
          <div><h3 style="margin:0">Skills Passport & Evidence Ledger (§5.4)</h3>
            <p class="muted small">Official Malaysian TVET passport recording stamps, uploads, and prior achievements.</p></div>
          <button class="btn small" data-act="complete-ppt" ${S.pptDone ? "disabled" : ""}>${S.pptDone ? "PPT Certified ✓" : "Complete PPT Assessment"}</button>
        </div>
        <div class="row" style="gap:14px">
          <div class="stamp verified" style="flex:1"><b style="font-size:24px">${sks.verified.length}</b><span>Verified Skills</span></div>
          <div class="stamp" style="flex:1"><b style="font-size:24px">${sks.hidden.length}</b><span>Hidden (In Portfolio)</span></div>
          <div class="stamp" style="flex:1"><b style="font-size:24px">${sks.rusty.length}</b><span>Rusty (Refreshable)</span></div>
        </div>
        <h3>Passport Evidence Ledger</h3>
        <div style="display:grid;gap:10px">
          ${S.passportStamps.map(st => `<div style="background:var(--mist);border-radius:10px;padding:12px;display:flex;justify-content:space-between;align-items:center">
            <div><b>${esc(st.title)}</b><div class="small muted">${esc(st.source)} • ${esc(st.date)}</div></div>
            <span class="pill pill--check">Recorded</span>
          </div>`).join("")}
          ${S.pptDone ? `<div style="background:var(--leaf-soft);border-radius:10px;padding:12px;display:flex;justify-content:space-between;align-items:center">
            <div><b>Recognition of Prior Achievement (PPT) SKM</b><div class="small muted">JPK Accredited Assessment • Stamp #MY-PPT-8841</div></div>
            <span class="pill pill--check">Official Stamp</span>
          </div>` : ""}
        </div>
      </div>
      <div class="panel" style="display:grid;gap:12px;align-content:start">
        <h3>How PPT Works</h3>
        <p class="small muted">Penilaian Pencapaian Terdahulu (PPT) turns workplace experience into an official government SKM Level 2/3 credential without retaking full courses.</p>
        <span class="tag tag--real">JPK Standards</span>
      </div>
    </div>`;
  }

  return `${pageHead("Show what you do at work", "Answer in your own words. Every skill we find links back to what you said.")}${tabs("skills", [["interview", "Shift Interview"], ["check", "Three-Track Check"], ["passport", "Skills Passport"]])}${body}`;
};

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
        <span class="sprout-journey-badge">Step 2 of 5: How AI Affects Your World</span>
        <div class="sprout-journey-body">
          <h4>Run the AOI Vision Scanner simulation, discover valuable human skills (fault isolation, vision threshold tuning), and proceed via:</h4>
          <p>Complete the interactive inspection to earn your verifiable Skills Passport stamp, then compare your realistic green career pivots.</p>
        </div>
      </div>
      <div class="row" style="gap:12px;flex-wrap:wrap">
        <button class="sprout-journey-cta secondary" data-act="sprout-open-sim">Run AOI Simulator</button>
        <a href="#paths" class="sprout-journey-cta">
          <span>Step 3: Choose Your Path</span>
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
          <a href="#paths" class="btn" style="background:var(--forest);color:#fff;text-decoration:none">Step 3: Choose Your Path &rarr;</a>
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
V.paths = () => {
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
        <span class="sprout-journey-badge">Step 3 of 5 Complete</span>
        <div class="sprout-journey-body">
          <h4>Direction Selected: ${esc(D.PATHS[sel].name)} (${esc(pathSub(sel))})</h4>
          <p>Your target direction is locked in with a verified match score. Ready to review accredited Malaysian courses, funding subsidies, and syllabus?</p>
        </div>
      </div>
      <a href="#courses" class="sprout-journey-cta">
        <span>Step 4: Explore Courses & Certifications</span>
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
      <span class="sprout-journey-badge">Step 4 of 5 Complete</span>
      <div class="sprout-journey-body">
        <h4>${S.plan.length} Courses Selected & Budget Verified</h4>
        <p>Your certified training modules are scheduled. Ready to see your week-by-week learning timeline and verifiable Skills Passport?</p>
      </div>
    </div>
    <a href="#plan" class="sprout-journey-cta">
      <span>Step 5: View Growth Plan</span>
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
        <span class="sprout-journey-badge" style="background:var(--forest);color:#fff">Step 5 of 5: Active Growth Plan</span>
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

/* ==========================================================================
   7b. CAREER TRANSITION CARD 24-MONTH SIMULATION CONTROLLER (§10, §11)
   ========================================================================== */
let tcSimTimer = null;
let tcSimIdle = null;
let tcResizeHandler = null;
let tcMonth = 1;
let tcSelected = null;
let tcOpenPart = null;
let tcCompPlace = null;

const TC_MONTHS = 24;

const TC_SKILLS = [
  { n: "Safety isolation", need: "Most asked", now: "verified", fix: null, how: "Certified and you do it every week. Carries over as it is.", src: "SKM Level 2 + interview" },
  { n: "Fault diagnosis", need: "Most asked", now: "hidden", fix: 4, how: "You do it but have no certificate. Get it certified through PPT, no class.", src: "Interview: “found a loose connector”" },
  { n: "Inverter fault diagnosis", need: "Most asked", now: "hidden", fix: 4, how: "You read inverter fault codes already. Certify it through PPT.", src: "Interview follow-up" },
  { n: "Electrical testing", need: "Good to have", now: "rusty", fix: 6, how: "On your certificate, not used for 5 years. A short refresher, not a full course.", src: "SKM Level 2" },
  { n: "Reading drawings", need: "Good to have", now: "rusty", fix: 6, how: "On your certificate, not used recently. Covered in the same refresher.", src: "SKM Level 2" },
  { n: "PV site safety", need: "Most asked", now: "missing", fix: 11, how: "New skill. One-day course, claimable through HRD Corp.", src: "Gap" },
  { n: "Electrical competency (ST)", need: "Required by law", now: "missing", fix: 15, how: "Licence, a hard requirement. Planned after the cheaper steps.", src: "Gap" },
  { n: "GCPV certificate", need: "Required by law", now: "missing", fix: 24, how: "Licence. Blocked by budget until about month 20.", src: "Gap" }
];

const TC_STATUS = { verified: "Verified", hidden: "Hidden", rusty: "Rusty", missing: "Missing" };

const TC_MILESTONES = {
  2:  { type: "Evidence", short: "PPT evidence", t: "PPT portfolio started",
        body: "Each week, 1 hour goes to recording a fault-finding job at work as PPT evidence. Ask your supervisor first.",
        course: null, closes: ["Fault diagnosis", "Inverter fault diagnosis"] },
  4:  { type: "Certificate", short: "PPT certificate", t: "PPT certificate approved",
        body: "Your hidden skills are now on a national certificate. This is the cheapest first step.",
        course: { n: "Recognition of prior achievement (PPT) for SKM", by: "JPK-accredited centre (example)", hours: "20 h", cost: "RM150" },
        closes: ["Fault diagnosis", "Inverter fault diagnosis"] },
  6:  { type: "Course", short: "Refresher", t: "Electrical refresher finished",
        body: "Rusty skills are current again. Refresh only, so it takes half the usual hours.",
        course: { n: "Electrical wiring, testing and drawings refresher", by: "TVET college (example)", hours: "12 h", cost: "RM0 with HRD Corp (RM250)" },
        closes: ["Electrical testing", "Reading drawings"] },
  8:  { type: "Blocked", short: "GCPV blocked", t: "GCPV licence can't start yet", block: true,
        body: "The GCPV course costs about RM1,800. On RM100 a month you can't cover it until about month 20. Subsidies to check: HRD Corp through your employer, PTPK skills training loan.",
        course: { n: "Grid-connected PV design and installation (GCPV)", by: "SEDA-registered provider (example)", hours: "60 h", cost: "RM1,800" },
        closes: ["GCPV certificate"] },
  11: { type: "Course", short: "PV site safety", t: "PV site safety course done",
        body: "You can now work safely on rooftops and at height.",
        course: { n: "PV site safety and working at height", by: "NIOSH-accredited trainer (example)", hours: "8 h", cost: "RM0 with HRD Corp (RM350)" },
        closes: ["PV site safety"] },
  15: { type: "Licence", short: "ST licence", t: "Electrical competency (ST) passed",
        body: "The first legal requirement is done. GCPV needs this first (to verify).",
        course: { n: "Electrical competency certificate preparation", by: "Suruhanjaya Tenaga-registered institute (example)", hours: "80 h", cost: "RM1,500" },
        closes: ["Electrical competency (ST)"] },
  20: { type: "Course", short: "GCPV starts", t: "GCPV course starts",
        body: "Savings plus an employer HRD Corp claim (to confirm) now cover the fee.",
        course: { n: "Grid-connected PV design and installation (GCPV)", by: "SEDA-registered provider (example)", hours: "60 h", cost: "RM1,800" },
        closes: [] },
  24: { type: "Licence", short: "Ready to apply", t: "GCPV certificate: ready to apply",
        body: "Every required skill and licence is in place. Apply for solar PV technician jobs.",
        course: null, closes: ["GCPV certificate"] }
};
const TC_KEY = Object.keys(TC_MILESTONES).map(Number);

const TC_COMP = {
  seekers: 4, home: "Penang",
  jobs: [["Selangor", 120], ["Johor", 85], ["Penang", 60], ["Kedah", 45], ["Sabah", 30]],
  place: m => m >= 24 ? { i: 0, t: "Near the front", why: "ST and GCPV together put you ahead of most applicants." }
    : m >= 15 ? { i: 1, t: "In the middle", why: "ST puts you ahead of applicants with no licence. GCPV is what moves you to the front." }
    : { i: 3, t: "Behind most", why: "Without ST or GCPV, most employers will pick a licensed applicant first." },
  crowd: [["Basic panel installation", "Crowding fast", "Course supply grew quickly, so the window is narrowing."],
          ["Inverter fault diagnosis", "Less crowded", "Demand rising, few courses. Window long (2 sources agree)."]]
};

function stopTcSim() {
  if (tcSimTimer) { clearInterval(tcSimTimer); tcSimTimer = null; }
  if (tcSimIdle && typeof tcSimIdle.kill === "function") { tcSimIdle.kill(); tcSimIdle = null; }
  if (tcResizeHandler) { window.removeEventListener("resize", tcResizeHandler); tcResizeHandler = null; }
  tcCompPlace = null;
}

function initTransitionCardSim() {
  const container = $("#tc-sim");
  if (!container) {
    stopTcSim();
    return;
  }

  stopTcSim();

  const hasGsap = typeof gsap !== "undefined";
  const still = () => BM.still() || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  const ease = "power2.out";

  const pKey = target();
  const match = computePathMatch(pKey);
  const PARTS = [
    { id: "overlap", n: "Task overlap", pts: Math.round(match.parts.overlap), max: match.maxParts.overlap },
    { id: "demand", n: "Market demand", pts: Math.round(match.parts.demand), max: match.maxParts.demand },
    { id: "interest", n: "Your interest", pts: Math.round(match.parts.interest), max: match.maxParts.interest },
    { id: "ease", n: "Ease of move", pts: Math.round(match.parts.ease), max: match.maxParts.ease }
  ];

  tcMonth = S.tab.simM || 1;
  tcSelected = null;
  tcOpenPart = null;
  tcCompPlace = null;

  const statusAt = (s, m) => s.fix && m >= s.fix ? "verified" : s.now;

  // 1. Populate score breakdown bars
  const barsEl = $("#tc-bars");
  if (barsEl) {
    barsEl.innerHTML = PARTS.map(p => `<li class="tc-bar" data-id="${p.id}">
      <button class="tc-bar-btn" type="button" aria-expanded="false" aria-controls="tc-d-${p.id}">
        <span class="lbl">${p.n}</span>
        <span class="pts">${p.pts}<small>/${p.max}</small><span class="sr"> points</span></span>
        <svg class="tc-chev" viewBox="0 0 20 20" aria-hidden="true"><path d="M5 8l5 5 5-5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>
        <span class="tc-track" aria-hidden="true"><i class="tc-fill"></i></span>
      </button>
      <div class="tc-detail" id="tc-d-${p.id}" hidden></div></li>`).join("");

    const fills = [...barsEl.querySelectorAll(".tc-fill")];
    fills.forEach((fill, i) => {
      const share = PARTS[i].pts / PARTS[i].max;
      fill.style.transform = `scaleX(${share})`;
    });

    barsEl.addEventListener("click", e => {
      const go = e.target.closest("[data-goto]");
      if (go) {
        stopPlay();
        tcSelected = +go.dataset.goto;
        setMonth(tcSelected);
        return;
      }
      const b = e.target.closest(".tc-bar-btn");
      if (b) togglePart(b.closest(".tc-bar").dataset.id);
    });
  }

  function detailHTML(id) {
    if (id === "overlap") {
      const cnt = k => TC_SKILLS.filter(s => statusAt(s, tcMonth) === k).length;
      const GROUPS = [
        ["hidden", "Certify through PPT", "You already do these. Get them on a certificate, no class needed."],
        ["rusty", "Refresh", "On your certificate but not used for years. A short refresher, half the usual hours."],
        ["missing", "Learn or get licensed", "New for you. Courses first, licences required by law last."],
        ["verified", "Ready", "Carries over as it is."]
      ];
      return `<p class="small">Skills this job needs, at <b>month ${tcMonth}</b>. Move the timeline to see gaps close.</p>
        <div class="tc-sk-sum"><span>${cnt("verified")} ready</span><span>${cnt("hidden")} hidden</span><span>${cnt("rusty")} rusty</span><span>${cnt("missing")} missing</span></div>
        ${GROUPS.map(([g, title, advice]) => {
          const list = TC_SKILLS.filter(s => statusAt(s, tcMonth) === g);
          if (!list.length) return "";
          return `<div class="tc-sk-group"><header><span class="tc-st ${g}">${TC_STATUS[g]}</span><b>${title}</b><p>${advice}</p></header>
            <ul class="tc-sk">${list.map(s => {
              const closed = s.fix && tcMonth >= s.fix;
              return `<li data-skill="${esc(s.n)}"><span><b>${esc(s.n)}</b><span class="need">${s.need} · ${esc(s.src)}</span></span>
                ${closed ? `<span class="tc-done-at">Done at M${s.fix}</span>` : s.fix ? `<button class="tc-link" type="button" data-goto="${s.fix}" aria-label="See month ${s.fix} for ${esc(s.n)}">M${s.fix}</button>` : ""}</li>`;
            }).join("")}</ul></div>`;
        }).join("")}`;
    }
    if (id === "demand") return `<p class="small">Solar PV technician demand is rising in Malaysian market postings.</p>
      <p class="small muted">Window Score: Inverter diagnosis is <b>long</b>; basic panel installation is <b>narrowing</b> because short course supply grew rapidly. Higher income priority boosts licensing weights.</p>`;
    if (id === "interest") return `<p class="small">Your Interest is rated <b>${esc(S.goal === "income" ? "High Fit" : "Active")}</b>.</p><p class="small muted">Algorithmic scoring is strictly objective and excludes candidate age, race, and appearance.</p>`;
    return `<p class="small">Approximately 24 months to attain all statutory licences at ${S.hours} hours a week.</p>
      <p class="small muted">Time fit aligns with current shift patterns. Out-of-pocket fees are minimized using HRD Corp employer levies.</p>`;
  }

  function togglePart(id, force) {
    if (!barsEl) return;
    const li = barsEl.querySelector(`[data-id="${id}"]`);
    if (!li) return;
    const btn = li.querySelector(".tc-bar-btn"), d = li.querySelector(".tc-detail");
    const open = force ?? btn.getAttribute("aria-expanded") !== "true";
    if (tcOpenPart && tcOpenPart !== id && open) togglePart(tcOpenPart, false);
    btn.setAttribute("aria-expanded", String(open));
    d.hidden = !open;
    tcOpenPart = open ? id : (tcOpenPart === id ? null : tcOpenPart);
    if (open) {
      d.innerHTML = detailHTML(id);
      if (hasGsap && !still()) gsap.from(d.children, { opacity: 0, y: -4, duration: .25, ease, stagger: .04 });
    }
  }

  const refreshOpen = () => {
    if (tcOpenPart) {
      const d = $(`#tc-d-${tcOpenPart}`);
      if (d) d.innerHTML = detailHTML(tcOpenPart);
    }
  };

  // 2. Milestone rendering
  function renderMilestone() {
    const box = $("#tc-ms");
    if (!box) return;
    const m = tcSelected ?? [...TC_KEY].reverse().find(k => k <= tcMonth);
    if (!m) {
      box.className = "tc-float tc-ms";
      box.innerHTML = `<div class="tc-panel-top"><span class="kind">Start</span><span class="small muted">Month 1</span></div>
        <h4 id="tc-ms-title">Month 1: Action Plan Starts</h4>
        <p>First step: build your PPT portfolio from the work you already do on your shift. Pick a milestone below to see its course details.</p>`;
      return;
    }
    const k = TC_MILESTONES[m], reached = tcMonth >= m;
    box.className = "tc-float tc-ms" + (k.block && tcMonth < 20 ? " block" : "");
    box.innerHTML = `<div class="tc-panel-top"><span class="kind">${k.type}${reached ? "" : " · upcoming"}</span><span class="small muted">Month ${m}</span></div>
      <h4 id="tc-ms-title">${esc(k.t)}</h4>
      <p>${esc(k.body)}</p>
      ${k.course ? `<dl><div><dt>Course</dt><dd>${esc(k.course.n)}</dd></div><div><dt>Provider</dt><dd>${esc(k.course.by)}</dd></div>
        <div><dt>Time</dt><dd>${k.course.hours}</dd></div><div><dt>Cost</dt><dd>${esc(k.course.cost)}</dd></div></dl>` : ""}
      ${k.closes.length ? `<div class="tc-closes"><span class="small muted">Closes skill gap:</span>${k.closes.map(n => `<button type="button" data-skill="${esc(n)}">${esc(n)}</button>`).join("")}</div>` : ""}`;
    if (hasGsap && !still()) gsap.from(box.children, { opacity: 0, y: 4, duration: .25, ease, stagger: .03, overwrite: "auto" });
  }

  const msBox = $("#tc-ms");
  if (msBox) {
    msBox.addEventListener("click", e => {
      const b = e.target.closest("[data-skill]");
      if (!b) return;
      togglePart("overlap", true);
      const row = [...container.querySelectorAll(".tc-sk li")].find(li => li.dataset.skill === b.dataset.skill);
      if (!row) return;
      row.scrollIntoView({ block: "nearest", behavior: still() ? "auto" : "smooth" });
      row.classList.add("flash");
      setTimeout(() => row.classList.remove("flash"), 1600);
    });
  }

  // 3. Competition queue rendering
  const personSvg = you => `<svg viewBox="0 0 30 38" ${you ? 'class="you"' : ""} aria-hidden="true"><circle cx="15" cy="10" r="7" fill="${you ? "#C98E6B" : "#D7CBBE"}"/>
    <path d="M2 38 C 3 26, 9 21, 15 21 C 21 21, 27 26, 28 38 Z" fill="${you ? "#1E5A3A" : "#B9C6D6"}"/>${you ? '<path d="M7 9 C 7 1, 23 1, 23 9 Z" fill="#F2C230"/>' : ""}</svg>`;

  const mxComp = Math.max(...TC_COMP.jobs.map(j => j[1])), totalComp = TC_COMP.jobs.reduce((a, j) => a + j[1], 0);

  function renderComp(instant) {
    const compEl = $("#tc-comp");
    if (!compEl) return;
    const p = TC_COMP.place(tcMonth);
    if (tcCompPlace === p.i) return;
    const first = tcCompPlace === null;
    tcCompPlace = p.i;
    compEl.innerHTML = `<div class="tc-panel-top"><h3 id="tc-h-comp">Competition & Hiring Queue</h3><span class="tag tag--real">Real Market Data</span></div>
      <div class="tc-queue"><span class="big">${TC_COMP.seekers}</span><span>applicants per open solar technician role</span>
        <div class="tc-people" role="img" aria-label="Your place: ${p.t}, ${p.i + 1} of ${TC_COMP.seekers}">${Array.from({ length: TC_COMP.seekers }, (_, i) => personSvg(i === p.i)).join("")}</div></div>
      <div class="tc-edge"><b>Your place at month ${tcMonth}: ${p.t}</b><span class="small muted">${p.why}</span></div>
      <div class="tc-sub">Where the jobs are (${totalComp} Malaysian vacancies)</div>
      <ul class="tc-states">${TC_COMP.jobs.map(([s, n]) => `<li class="${s === TC_COMP.home ? "home" : ""}"><span>${s}${s === TC_COMP.home ? " (you)" : ""}</span>
        <em style="width:${n / mxComp * 100}%"></em><b>${n}</b></li>`).join("")}</ul>
      <div class="tc-sub">Market window status by task</div>
      <div class="tc-rows">${TC_COMP.crowd.map(([t, l, why]) => `<div><span>${t}<br><small class="muted">${why}</small></span><b>${l}</b></div>`).join("")}</div>`;

    const bars = compEl.querySelectorAll(".tc-states em");
    if (instant || first || still() || !hasGsap) {
      bars.forEach(b => b.style.transform = "scaleX(1)");
    } else {
      gsap.fromTo(bars, { scaleX: 0 }, { scaleX: 1, duration: .6, ease, stagger: .04, });
      if (!first) gsap.from("#tc-comp .tc-people .you, #tc-comp .tc-edge", { opacity: 0, y: 6, duration: .3, ease });
    }
  }

  // 4. Timeline markers, chips, and scrubber setup
  const marks = $("#tc-marks"), ticks = $("#tc-ticks"), keys = $("#tc-keys");
  const scrub = $("#tc-scrub"), play = $("#tc-play");
  const pct = m => (m - 1) / (TC_MONTHS - 1) * 100;

  if (marks && ticks && keys) {
    marks.innerHTML = "";
    ticks.innerHTML = "";
    for (let m = 1; m <= TC_MONTHS; m++) {
      const k = TC_MILESTONES[m];
      marks.insertAdjacentHTML("beforeend", k
        ? `<button class="tc-mk key ${k.block ? "block" : ""}" type="button" tabindex="-1" aria-hidden="true" style="left:${pct(m)}%" data-m="${m}" title="Month ${m}: ${esc(k.t)}"></button>`
        : `<span class="tc-mk" aria-hidden="true" style="left:${pct(m)}%" data-m="${m}"></span>`);
      if (m === 1 || m % 6 === 0) ticks.insertAdjacentHTML("beforeend", `<span style="left:${pct(m)}%">M${m}</span>`);
    }
    keys.innerHTML = TC_KEY.map(m => `<button type="button" data-m="${m}" aria-pressed="false" class="${TC_MILESTONES[m].block ? "block" : ""}"><i>M${m}</i>${esc(TC_MILESTONES[m].short)}</button>`).join("");

    marks.addEventListener("click", e => {
      const b = e.target.closest(".tc-mk.key");
      if (b) { stopPlay(); tcSelected = +b.dataset.m; setMonth(tcSelected); }
    });
    keys.addEventListener("click", e => {
      const b = e.target.closest("button");
      if (b) { stopPlay(); tcSelected = +b.dataset.m; setMonth(tcSelected); }
    });
  }

  const mkEls = marks ? [...marks.children] : [];
  const keyEls = keys ? [...keys.children] : [];

  // 5. Avatar gear dressing
  const av = $("#tc-av");
  const gear = [...container.querySelectorAll(".tc-gear")];
  const legend = [...container.querySelectorAll("#tc-legend span")];
  const gearOn = new Map();

  function dressAvatar(m, instant) {
    gear.forEach(g => {
      const on = m >= +g.dataset.at;
      if (gearOn.get(g) === on) return;
      gearOn.set(g, on);
      if (hasGsap && !instant && !still()) {
        gsap.to(g, { opacity: on ? 1 : 0, scale: on ? 1 : .6, transformOrigin: "50% 50%", duration: .35, ease });
      } else {
        g.style.opacity = on ? "1" : "0";
        g.style.transform = on ? "scale(1)" : "scale(0.6)";
      }
    });
    legend.forEach(l => l.classList.toggle("on", m >= +l.dataset.at));
    const latest = [...TC_KEY].reverse().find(k => k <= m);
    const blocked = m >= 8 && m < 20;
    const st = $("#tc-status");
    if (st) {
      st.className = "tc-status" + (blocked ? " block" : "");
      st.textContent = blocked ? "Waiting for the GCPV fee. Other steps go on."
        : latest ? TC_MILESTONES[latest].t : "Building the PPT portfolio";
    }
  }

  // Idle avatar breathing
  if (av && hasGsap && !still()) {
    gsap.set(av, { y: 0 });
    tcSimIdle = gsap.to(av, { y: -4, duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: -1 });
  }

  // 6. Playhead measurement & setMonth logic
  const head = $("#tc-head"), roadFill = $("#tc-road-fill");
  let trackW = 0;
  const measure = () => {
    if (marks) trackW = marks.getBoundingClientRect().width;
    if (!trackW) trackW = 600;
  };
  const xFor = m => (m - 1) / (TC_MONTHS - 1) * trackW;

  function setMonth(m, animate = true) {
    tcMonth = m;
    S.tab.simM = m;
    const instant = !animate || still();

    if (head) {
      if (hasGsap && !instant) {
        gsap.to(head, { x: xFor(m), duration: .4, ease, overwrite: "auto" });
      } else {
        head.style.transform = `translateX(${xFor(m)}px)`;
      }
    }
    if (roadFill) {
      if (hasGsap && !instant) {
        gsap.to(roadFill, { scaleX: (m - 1) / (TC_MONTHS - 1), duration: .4, ease, overwrite: "auto" });
      } else {
        roadFill.style.transform = `scaleX(${(m - 1) / (TC_MONTHS - 1)})`;
      }
    }

    const mBig = $("#tc-month-big");
    if (mBig) {
      mBig.textContent = m;
      if (hasGsap && !instant) gsap.fromTo(mBig, { opacity: .4, y: 4 }, { opacity: 1, y: 0, duration: .25, ease, overwrite: "auto" });
    }

    dressAvatar(m, instant);
    mkEls.forEach(el => {
      el.classList.toggle("on", +el.dataset.m <= m);
      el.classList.toggle("sel", +el.dataset.m === tcSelected);
    });
    keyEls.forEach(el => {
      const k = +el.dataset.m;
      el.classList.toggle("done", k <= m && !TC_MILESTONES[k].block);
      el.setAttribute("aria-pressed", String(k === tcSelected));
    });

    if (scrub) {
      scrub.value = m;
      const latest = [...TC_KEY].reverse().find(k => k <= m);
      scrub.setAttribute("aria-valuetext", latest ? `Month ${m}. Latest: ${TC_MILESTONES[latest].t}` : `Month ${m}`);
    }

    renderMilestone();
    renderComp(instant);
    refreshOpen();
  }

  // 7. Scrubber and Play/Pause controls
  function stopPlay() {
    if (tcSimTimer) { clearInterval(tcSimTimer); tcSimTimer = null; }
    if (play) {
      play.setAttribute("aria-pressed", "false");
      const lbl = $("#tc-play-label");
      if (lbl) lbl.textContent = "Play";
      const icn = $("#tc-play-icon");
      if (icn) icn.setAttribute("d", "M3 1.5v11l9-5.5z");
    }
  }

  function startPlay() {
    stopPlay();
    tcSelected = null;
    if (still()) { setMonth(TC_MONTHS, false); return; }
    if (tcMonth >= TC_MONTHS) setMonth(1, false);
    if (play) {
      play.setAttribute("aria-pressed", "true");
      const lbl = $("#tc-play-label");
      if (lbl) lbl.textContent = "Pause";
      const icn = $("#tc-play-icon");
      if (icn) icn.setAttribute("d", "M3 1.5h3v11H3zM8 1.5h3v11H8z");
    }
    tcSimTimer = setInterval(() => {
      if (tcMonth < TC_MONTHS) {
        setMonth(tcMonth + 1);
      } else {
        stopPlay();
      }
    }, 550);
  }

  if (scrub) {
    scrub.addEventListener("input", () => {
      stopPlay();
      tcSelected = null;
      setMonth(+scrub.value);
    });
  }

  if (play) {
    play.addEventListener("click", () => {
      if (tcSimTimer) stopPlay();
      else startPlay();
    });
  }

  tcResizeHandler = () => {
    measure();
    if (head) {
      if (hasGsap) gsap.set(head, { x: xFor(tcMonth) });
      else head.style.transform = `translateX(${xFor(tcMonth)}px)`;
    }
  };
  window.addEventListener("resize", tcResizeHandler);

  measure();
  setMonth(tcMonth, false);

}

/* ==========================================================================
   8. WHY PANEL & DATA SOURCES
   ========================================================================== */
const WHY = {
  story: () => ["Malaysian Green Economy Visual Narrative", "Explaining how industrial workers transition into clean energy roles using verified prior skills without tuition debt.", [["Framework", "National Energy Transition Roadmap (NETR)", "real", "Govt Policy"], ["Automation", "ILO & Anthropic Economic Index", "real", "Observed Data"]], ["Start Shift Interview", "skills"]],
  home: () => ["Your Green Pathway at a Glance", "Real-time overview of your learning pace, market releases, and transition status.", [["Release Status", S.dataRelease, "real", "Active Release"], ["Engine", "Unified weekly budget & time simulation", "projection", "Projection"]], ["Open my plan", "plan"]],
  profile: () => ["Why We Ask", "Your current role maps to Malaysian NOSS competencies. Your hours and monthly budget define what is achievable without debt.", [["Certificates", "Malaysian Whitelist (SKM, Suruhanjaya Tenaga, HRD Corp)", "real", "Official Whitelist"]], ["Next: Skills", "skills"]],
  skills: () => ["Three-Track Skill Logic (§5.1)", "Certificates alone miss actual experience; self-declarations lack proof. We cross-reference certified credentials with workplace interviews to isolate Verified, Hidden, and Rusty skills.", [["Methodology", "Recognition of Prior Achievement (PPT)", "real", "JPK Framework"]], ["Next: Paths", "paths"]],
  impact: () => ["Try → Understand → Pivot Career Simulator", "Users explore their workplace, simulate how AI changes inspection and maintenance workflows, discover resilient human skills, and compare realistic career pivots with clear reskilling steps.", [["Workplace AI", "Anthropic Economic Index & Malaysian NOSS Standards", "real", "Observed Data"], ["Green Pivots", "NETR Clean Energy & E&E Sector Workforce Roadmap", "real", "Govt Policy"]], ["Next: Choose path", "paths"]],
  paths: () => ["Fair Match Scoring (§5, §9)", "Four weighted pillars: Task Overlap, Market Demand, Your Interest, and Ease of Move, plus SDG priority bonus. Age, gender, and background are strictly excluded.", [["Taxonomy", "MyMAHIR & DOSM quarterly tables", "real", "Govt Data"], ["Algorithm", "Fairness-guaranteed weighted formula", "sample", "Audited"]], ["Next: Courses", "courses"]],
  courses: () => ["Course Recommendation Logic (§6.3)", "Fixed four-tier sequence: PPT certification for hidden skills, half-duration refreshers for rusty skills, high-window gap courses, and statutory licences last.", [["Licences", "Electricity Supply Act (Suruhanjaya Tenaga)", "real", "Statutory"]], ["Next: Plan", "plan"]],
  plan: () => ["Unified Simulation & Rescheduling", "Calendar, timeline, and simulation run on the same weekly engine. When life gets busy, rescheduling adjusts your finish date cleanly.", [["Rescheduling", "Adaptive weekly shift engine", "projection", "Engine"]], ["Go Home", "home"]]
};

function renderWhy(r) {
  const w = WHY[r];
  const c = $("#why-content");
  if (!w || !c) return;
  const [h, p, src, next] = w();
  c.innerHTML = `
    <button class="drawer-close" data-act="close-why" aria-label="Close">&times;</button>
    <div class="row" style="gap:10px;align-items:center;border-bottom:1.5px solid var(--line);padding-bottom:14px">
     
      <div>
        <h2 id="why-title" style="font-size:22px;margin:0">Data Sources & Methodology</h2>
        <span class="muted small">${h}</span>
      </div>
    </div>
    <p style="font-size:16px;line-height:24px;color:var(--ink-2);margin-top:8px">${p}</p>
    <div class="src" style="display:grid;gap:12px;margin-top:12px">
      <h4 style="margin:0;font:800 15px/20px var(--head)">Verified Data Provenance</h4>
      ${src.map(([n, t, k, l]) => `<div style="background:var(--mist);border-radius:12px;padding:12px;display:grid;gap:6px">
        <span class="tag tag--${k}">${l}</span>
        <b class="small">${n}</b>
        <span class="muted small">${t}</span>
      </div>`).join("")}
    </div>
    <div style="margin-top:auto;display:grid;gap:10px">
      <a class="btn" href="#${next[1]}" data-act="close-why" style="text-align:center">${next[0]}</a>
      <button class="btn ghost small" data-act="close-why">Close Panel</button>
    </div>`;
}

function openWhyDrawer() {
  const d = $("#why-drawer");
  if (d) {
    d.classList.add("open");
    d.setAttribute("aria-hidden", "false");
  }
}

function closeWhyDrawer() {
  const d = $("#why-drawer");
  if (d) {
    d.classList.remove("open");
    d.setAttribute("aria-hidden", "true");
  }
}

/* ==========================================================================
   9. SHELL, NAVIGATION, & LANDSCAPE
   ========================================================================== */
const NAV_ITEMS = [
  { id: "home", label: "Home", icon: "home" },
  { id: "paths", label: "My Pathway", icon: "pathway" },
  { id: "impact", label: "How AI Affects Your World", icon: "world", badge: "Live" },
  { id: "explore", label: "Explore Careers", icon: "compass", route: "paths" },
  { id: "courses", label: "Courses", icon: "courses" },
  { id: "plan", label: "My Growth Plan", icon: "plan" },
  { id: "profile", label: "My Profile", icon: "profile" }
];

const NAV_ICONS = {
  home: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5L10 3l7 5.5V17a1 1 0 0 1-1 1h-4v-5H8v5H4a1 1 0 0 1-1-1V8.5z"/></svg>',
  pathway: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="4" cy="16" r="2"/><circle cx="16" cy="4" r="2"/><circle cx="16" cy="16" r="2"/><path d="M6 16h6a4 4 0 0 0 4-4V6"/><path d="M6 16v-6a4 4 0 0 1 4-4h4"/></svg>',
  world: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 17V7l5 3V7l5 3V3l6 4v10H2z"/><path d="M7 17v-4h4v4"/></svg>',
  compass: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="7.5"/><polygon points="13.5 6.5 11.5 11.5 6.5 13.5 8.5 8.5 13.5 6.5"/></svg>',
  courses: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6l8-3 8 3-8 3-8-3z"/><path d="M4 8.5v5c0 2 3 3.5 6 3.5s6-1.5 6-3.5v-5"/><path d="M18 9v4"/></svg>',
  plan: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/><path d="M8 7h4M8 11h4M8 15h2"/></svg>',
  profile: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 17v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 15.5V17"/><circle cx="10" cy="6.5" r="3.5"/></svg>',
  done: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3.5 3.5 6.5-7"/></svg>'
};
const STEP_IDS = ["profile", "impact", "paths", "courses", "plan"];

function renderShell(r) {
  const onCard = r === "plan" && S.tab.plan === "card";
  $("#rail-nav").innerHTML = `
    <div class="rail-group">
      ${NAV_ITEMS.map(item => {
        const targetRoute = item.route || item.id;
        const isCur = (item.id === "explore" ? (r === "paths" && S.tab.paths === "explore") : (r === targetRoute || (item.id === "impact" && (r === "world" || r === "jobworld"))));
        const iconSvg = NAV_ICONS[item.icon] || NAV_ICONS.home;
        return `<a href="#${targetRoute}" ${isCur ? 'aria-current="page"' : ''} class="sprout-rail-item">
          <span class="sprout-nav-icon">${iconSvg}</span>
          <span class="sprout-nav-label">${item.label}</span>
          ${item.badge ? `<span class="sprout-nav-badge">${item.badge}</span>` : ''}
        </a>`;
      }).join("")}
    </div>
  `;

  const SPROUT_STEPS = [
    { id: "profile", label: "Profile", num: 1 },
    { id: "impact", label: "How AI Affects Your World", num: 2 },
    { id: "paths", label: "Choose Path", num: 3 },
    { id: "courses", label: "Career & Courses", num: 4 },
    { id: "plan", label: "Growth Plan", num: 5 }
  ];
  const curStepIdx = SPROUT_STEPS.findIndex(st => st.id === r || (st.id === "impact" && (r === "world" || r === "jobworld")));
  const progEl = $("#progress");
  if (progEl) {
    progEl.innerHTML = `
      <nav class="sprout-top-stepper" aria-label="Career Journey Steps">
        ${SPROUT_STEPS.map((st, i) => {
          const isCur = i === curStepIdx;
          const isDone = Boolean(S.done[st.id]) || (curStepIdx > -1 && i < curStepIdx);
          const checkIcon = `<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3.5 3.5 6.5-7"/></svg>`;
          return `
            ${i > 0 ? '<span class="sprout-step-line" aria-hidden="true"></span>' : ''}
            <a href="#${st.id}" class="sprout-step-item ${isCur ? 'active' : ''} ${isDone ? 'completed' : ''}" ${isCur ? 'aria-current="step"' : ''}>
              <span class="sprout-step-badge">${isDone && !isCur ? checkIcon : st.num}</span>
              <span class="sprout-step-text">${st.label}</span>
            </a>
          `;
        }).join("")}
      </nav>
    `;
  }

  const topName = $("#top-user-name");
  if (topName) topName.textContent = S.name || person().n;
  const topSub = $("#top-user-sub");
  if (topSub) topSub.textContent = `${jobName()}`;

  $("#rail-me").innerHTML = `${me()}<div><b>${esc(S.name)}</b><span>${jobName()}, ${esc(S.state)}</span></div>`;
  $("#who").innerHTML = BM.PEOPLE.map(p => `<option value="${p.id}" ${p.id === S.person ? "selected" : ""}>${p.n} (${p.r})</option>`).join("");
  $("#who-av").innerHTML = me();
  $("#shell").classList.toggle("focus", r === "start");
  renderWhy(r);
  renderLand();
}

function buildLand() {
  $("#land").innerHTML = `<svg viewBox="0 0 248 118" preserveAspectRatio="xMidYMax slice">
    <circle id="l-sun" cx="214" cy="30" r="12" fill="#F2C230" opacity=".35"/>
    <path d="M0 78 C 50 62, 100 66, 140 74 S 210 62, 248 70 V118 H0Z" fill="#D5E5CC"/>
    <path d="M0 96 C 60 84, 130 92, 170 92 S 230 86, 248 90 V118 H0Z" fill="#A9CB94"/>
    <g id="l-factory"><rect x="16" y="62" width="44" height="26" fill="#A7B0A8"/><rect x="48" y="44" width="8" height="20" fill="#8F9890"/>
      <g id="l-smoke"><circle cx="52" cy="38" r="5" fill="#C6CBC7"/><circle cx="58" cy="32" r="6" fill="#D3D7D3"/></g></g>
    <g class="grow off" data-k="profile"><circle cx="78" cy="86" r="9" fill="#2C7A4F"/><rect x="77" y="90" width="3" height="8" fill="#6B4E31"/></g>
    <g class="grow off" data-k="skills"><path d="M20 62 l10 -6 h26 l-10 6z" fill="#3E6CB8"/></g>
    <g class="grow off" data-k="impact"><rect x="112" y="40" width="3" height="46" fill="#E6EBE5"/><path d="M113.5 40 L112 22 L115 22Z M113.5 40 L129 48 L127 51Z M113.5 40 L98 51 L96 48Z" fill="#FBFCF8"/></g>
    <g class="grow off" data-k="paths"><rect x="146" y="72" width="11" height="18" rx="2" fill="#1E5A3A"/><rect x="148" y="75" width="7" height="5" rx="1" fill="#7BAE5E"/></g>
    <g class="grow off" data-k="courses"><path d="M166 94 l12 -9 h34 l-12 9z" fill="#3E6CB8"/></g>
    <g class="grow off" data-k="plan"><circle cx="226" cy="84" r="10" fill="#2C7A4F"/><circle cx="238" cy="88" r="7" fill="#7BAE5E"/><rect x="225" y="90" width="3" height="8" fill="#6B4E31"/></g>
  </svg>
  <div style="padding:8px 12px;font:700 13px/18px var(--body);color:var(--forest);text-align:center;background:rgba(255,255,255,0.75);border-radius:12px;margin-top:8px;border:1px solid var(--line)">Green skills today, more opportunities tomorrow.</div>`;
}

function renderLand() {
  const n = ["profile", "skills", "impact", "paths", "courses", "plan"].filter(k => S.done[k]).length;
  $$("#land .grow").forEach(g => g.classList.toggle("off", !S.done[g.dataset.k]));
  $("#l-sun").setAttribute("opacity", .35 + n * .11);
  $("#l-smoke").style.display = n >= 5 ? "none" : "";
  $("#l-factory").setAttribute("opacity", 1 - n * .08);
}

/* ==========================================================================
   10. ROUTER & EVENT LISTENERS
   ========================================================================== */
let route = null;

const PAGE_TITLES = { story: "Same hands, new work", home: "Your overview", start: "Get started", profile: "Tell us about yourself", skills: "Show what you do at work", impact: "How AI Can Affect Your World", paths: "Choose your path", courses: "Courses for your plan", plan: "Your plan" };

function go() {
  stopMic();
  if (location.hash.replace("#", "") !== "skills") camStop();
  if (lkRoom && location.hash.replace("#", "") !== "skills") liveEnd();
  let r = location.hash.replace("#", "");
  if (r === "card" || r === "transition" || r === "sim") {
    S.tab.plan = "card";
    S.tab.cardMode = "sim";
    r = "plan";
  }
  if (r === "world" || r === "jobworld" || r === "job-world") {
    r = "impact";
  }
  if (r === "explore") {
    S.tab.paths = "compare";
    r = "paths";
  }
  const p = BM.PEOPLE.find(x => x.id === r);
  if (p) {
    S = fresh(p.id, true);
    save();
    history.replaceState(null, "", "#paths");
    r = "paths";
  }
  if (!r) r = "impact";
  if (!V[r]) r = "impact";
  const changed = r !== route;
  route = r;

  save();
  $("#view").innerHTML = V[r]();
  renderShell(r);
  document.title = `${PAGE_TITLES[r] || "Green career planner"} | BijakMatch`;
  if (changed) {
    scrollTo(0, 0);
    $("#view").focus({ preventScroll: true });
  }
  afterRender(r);
}

function rerender() {
  const y = scrollY;
  $("#view").innerHTML = V[route]();
  renderShell(route);
  scrollTo(0, y);
  afterRender(route);
  save();
}

function afterRender(r) {
  if (r === "skills") bindCam();
  if (r === "plan") {
    const tab = tabOf("plan", "timeline");
    if (tab === "card" && (S.tab.cardMode || "sim") === "sim") {
      initTransitionCardSim();
    } else {
      stopTcSim();
    }
  } else {
    stopTcSim();
  }
}

// Event handlers
const view = $("#view");
view.addEventListener("click", e => {
  const t = e.target.closest("[data-act],[data-tab]");
  if (!t) return;

  if (t.dataset.tab) {
    const [k, v] = t.dataset.tab.split(":");
    S.tab[k] = v;
    if (t.tagName === "A") e.preventDefault();
    rerender();
    return;
  }

  const a = t.dataset.act;
  const v = t.dataset.v;

  if (a === "demo-cert") {
    if (v === "svm") {
      verifyCertWithBackend("Sijil Vokasional Malaysia (SVM) - Teknologi Elektrik", "SVM BPLTV NOSS EE-320-2 EE-320-3");
    } else if (v === "skm3") {
      verifyCertWithBackend("Sijil Kemahiran Malaysia (SKM) Tahap 3", "SKM Tahap 3 JPK Juruteknik Elektrik");
    }
    return;
  }

  if (a && a.startsWith("sprout-")) sproutState();
  if (a === "sprout-station") {
    S.sprout.station = +v;
    S.sprout.subtab = "details";
    rerender();
  } else if (a === "sprout-flow-tab") {
    S.sprout.flowTab = v;
    rerender();
  } else if (a === "sprout-subtab") {
    S.sprout.subtab = v;
    rerender();
  } else if (a === "sprout-rotate") {
    S.sprout.rotated = !S.sprout.rotated;
    rerender();
  } else if (a === "sprout-zoom-in" || a === "sprout-zoom-out") {
    const z = S.sprout.zoom || 100;
    S.sprout.zoom = Math.min(175, Math.max(100, z + (a === "sprout-zoom-in" ? 25 : -25)));
    rerender();
  } else if (a === "sprout-fullscreen") {
    const vp = $("#sprout-viewport");
    if (vp) {
      if (!document.fullscreenElement) vp.requestFullscreen?.().catch(() => {});
      else document.exitFullscreen?.().catch(() => {});
    }
  } else if (a === "sprout-year") {
    S.year = +v;
    rerender();
  } else if (a === "sprout-pace") {
    S.pace = v;
    rerender();
  } else if (a === "sprout-open-sim") {
    S.sprout.activeModal = "sim";
    S.sprout.simStep = "interactive";
    rerender();
    $(".sprout-modal-panel .btn")?.focus();
  } else if (a === "sprout-aoi-probe") {
    S.sprout.aoiProbe = v;
    rerender();
  } else if (a === "sprout-aoi-solve") {
    const cur = sproutCurrent(sproutStations());
    S.sprout.simResult = v;
    S.tried[cur.key] = v === "recalibrate" ? 0 : 1;
    S.done.impact = true;
    S.sprout.simStep = "feedback";
    const stampTitle = "AOI Vision Scanner: Fault Isolation & Threshold Calibration";
    if (v === "recalibrate" && !S.passportStamps.some(p => p.title === stampTitle)) {
      S.passportStamps.push({ title: stampTitle, date: "Verified Oct 2026", source: "Job World Simulator" });
      toast("Credential Stamped into your Skills Passport!");
    } else {
      toast("Simulation decision logged.");
    }
    rerender();
  } else if (a === "sprout-exp") {
    S.sprout.exp = v;
    rerender();
  } else if (a === "sprout-sim-choice") {
    const cur = sproutCurrent(sproutStations());
    S.tried[cur.key] = +v;
    S.done.impact = true;
    S.sprout.simStep = "feedback";
    const title = `${cur.n}: working with AI`;
    if (cur.sim && cur.sim.opts && cur.sim.opts[+v] && cur.sim.opts[+v][1] === "best" && !S.passportStamps.some(p => p.title === title)) {
      S.passportStamps.push({ title, date: "Oct 2026", source: "Job world simulator" });
      toast("Added to your Skills Passport.");
    }
    rerender();
    $(".sprout-feedback .btn")?.focus();
  } else if (a === "sprout-sim-step") {
    S.sprout.simStep = v;
    rerender();
    $(".sprout-modal-panel .btn, .sprout-sim-btn")?.focus();
  } else if (a === "sprout-sim-to-pivot" || a === "sprout-open-pivot") {
    S.sprout.activeModal = "pivot";
    S.sprout.activePivotId = v || ranked()[0];
    rerender();
    $(".sprout-modal-close")?.focus();
  } else if (a === "sprout-close-modal" || (a === "sprout-backdrop" && e.target === t)) {
    S.sprout.activeModal = null;
    rerender();
  } else if (a === "sprout-apply-pivot") {
    S.path = v;
    S.sel = v;
    S.done.paths = true;
    S.sprout.activeModal = null;
    const eng = runEngine(v);
    if (eng && eng.steps) {
      eng.steps.forEach(st => {
        const crs = D.COURSES.find(c => c.id === st.id || c.id === st.baseId);
        if (crs && !inPlan(crs.id)) S.plan.push(crs.id);
      });
      S.done.courses = true;
    }
    save();
    toast(`${pathSub(v)} chosen. Its courses are in your plan.`);
    location.hash = "plan";
  } else if (a === "sprout-save-insight") {
    const cur = sproutCurrent(sproutStations());
    const title = `${cur.n}: how AI changes it`;
    S.sprout.savedStation = cur.key;
    if (!S.passportStamps.some(p => p.title === title)) S.passportStamps.push({ title, date: "Oct 2026", source: "Job world" });
    rerender();
    toast("Insight saved to your Skills Passport.");
  } else if (a === "job") {
    S.job = v;
    rerender();
  } else if (a === "set-card-mode") {
    S.tab.cardMode = v;
    rerender();
  } else if (a === "qs-next") {
    if (S.qs < 3) {
      S.qs++;
      rerender();
    } else {
      S.done.start = true;
      S.qs = 1;
      save();
      location.hash = "paths";
    }
  } else if (a === "qs-back") {
    S.qs--;
    rerender();
  } else if (a === "qs-start-interview") {
    S.done.start = true;
    S.tab.skills = "interview";
    save();
    location.hash = "skills";
  } else if (a === "qs-fill-sample") {
    populateInterviewDefaults(S, S.job);
    S.done.start = true;
    rerender();
    toast("Sample shift interview and certificates loaded.");
  } else if (a === "goal") {
    const beforeRank = ranked()[0];
    S.goal = v;
    const afterRank = ranked()[0];
    if (beforeRank !== afterRank) {
      S.lastChangeNotice = `Goal changed to "${v === "income" ? "Higher Income" : "Quick Move"}", moving ${D.PATHS[afterRank].name} to #1.`;
    }
    rerender();
  } else if (a === "set-scen") {
    const beforeRank = ranked()[0];
    S.scenario = v;
    const afterRank = ranked()[0];
    if (beforeRank !== afterRank) {
      S.lastChangeNotice = `AI Scenario set to "${v}", shifting demand signals and re-ranking paths.`;
    }
    rerender();
  } else if (a === "set-sdg") {
    const beforeRank = ranked()[0];
    S.sdgPriority = v;
    const afterRank = ranked()[0];
    if (beforeRank !== afterRank) {
      S.lastChangeNotice = `SDG Priority set to "${v === "sdg7" ? "SDG 7 Clean Energy" : "SDG 4 & 8 Decent Work"}", re-ordering pathways.`;
    }
    rerender();
  } else if (a === "set-interest") {
    const pKey = t.dataset.p;
    if (!S.interests) S.interests = {};
    S.interests[pKey] = v;
    rerender();
  } else if (a === "sel") {
    S.sel = v;
    rerender();
  } else if (a === "choose") {
    S.path = v;
    S.sel = v;
    S.done.paths = true;
    rerender();
    toast(`${D.PATHS[v].name} chosen as your primary transition goal.`);
  } else if (a === "hot") {
    t.classList.add("seen");
    const P = D.PATHS[S.sel || S.path || ranked()[0]];
    const pop = $("#hot-pop");
    const txt = {
      jobs: [`${P.jobs.reduce((x, j) => x + j[1], 0)} Malaysian Openings`, `Highest in ${P.jobs[0][0]}. Data release ${S.dataRelease}.`],
      comp: [`${P.seekers} applicants per posting`, "Holding a certified statutory licence moves you to front of queue."],
      growth: [`${rm(P.pay[0])} to ${rm(P.pay[1])} monthly salary`, `Growth outlook: ${P.growth}.`],
      subsidies: ["Government Subsidies Available", "HRD Corp employer levy, PERKESO EIS, and PTPK skills development loans available."]
    }[v] || ["Information", "Sample detail."];
    pop.hidden = false;
    pop.innerHTML = `<b style="font:800 20px/1.2 var(--head)">${txt[0]}</b><span class="muted">${txt[1]}</span>`;
  } else if (a === "plan") {
    if (!inPlan(v)) S.plan.push(v);
    S.done.courses = true;
    rerender();
    toast("Course added to your plan.");
  } else if (a === "unplan") {
    S.plan = S.plan.filter(x => x !== v);
    rerender();
  } else if (a === "planall") {
    const eng = runEngine(v);
    if (eng) {
      eng.steps.forEach(st => {
        const crs = D.COURSES.find(c => c.id === st.id || c.id === st.baseId);
        if (crs && !inPlan(crs.id)) S.plan.push(crs.id);
      });
    }
    S.done.courses = true;
    rerender();
    toast("All missing pathway courses added to your action plan.");
  } else if (a === "use-sample-interview") {
    populateInterviewDefaults(S, S.job);
    S.interviewPhase = 4;
    rerender();
    toast("5-phase shift answers loaded for " + jobName());
  } else if (a === "ai-start") {
    S.interviewTasks.forEach(t => delete S.doing[t.n]);
    S.interviewTasks = [];
    S.ai = { ...freshAI(), speak: S.ai.speak, lang: S.ai.lang };
    S.live = freshLive();
    aiNext();
  } else if (a === "live-start") {
    liveStart();
  } else if (a === "live-end") {
    liveEnd();
  } else if (a === "live-mute") {
    liveMute();
  } else if (a === "ai-cam") {
    if (camStream) {
      camStop();
      rerenderKeep();
    } else camStart();
  } else if (a === "ai-cam-flip") {
    camFacing = camFacing === "user" ? "environment" : "user";
    camStart();
  } else if (a === "ai-video-pick") {
    $("#ai-video-file")?.click();
  } else if (a === "ai-seek") {
    seekWork(+v);
  } else if (a === "market-jump") {
    $("#market-panel")?.scrollIntoView({ behavior: BM.still() ? "auto" : "smooth" });
    $("#market-state")?.focus({ preventScroll: true });
  } else if (a === "market-run") {
    marketRun();
  } else if (a === "ai-snap") {
    camSnap();
  } else if (a === "ai-photo-remove") {
    pendingPhoto = null;
    patchPhotoSlot();
  } else if (a === "ai-send") {
    aiSend();
  } else if (a === "ai-mic") {
    if (rec) stopMic();
    else startMic();
  } else if (a === "ai-speak") {
    S.ai.speak = !S.ai.speak;
    if (!S.ai.speak && window.speechSynthesis) speechSynthesis.cancel();
    rerender();
  } else if (a === "ai-restart") {
    stopMic();
    camStop();
    pendingPhoto = null;
    VIDEOS.forEach(x => URL.revokeObjectURL(x.url));
    VIDEOS.clear();
    if (window.speechSynthesis) speechSynthesis.cancel();
    S.ai = { ...freshAI(), speak: S.ai.speak, lang: S.ai.lang };
    S.experience = null;
    rerender();
  } else if (a === "toggle-task") {
    const idx = +v;
    if (S.interviewTasks[idx]) {
      S.interviewTasks[idx].kept = !S.interviewTasks[idx].kept;
      S.doing[S.interviewTasks[idx].n] = S.interviewTasks[idx].kept;
      rerender();
    }
  } else if (a === "add-dict-skill") {
    const val = $("#dict-pick")?.value;
    if (val) {
      S.doing[val] = true;
      rerender();
      toast(`${val} added to your active skills.`);
    }
  } else if (a === "set-last-work") {
    const k = t.dataset.k;
    const val = t.dataset.v;
    if (!S.lastWork) S.lastWork = {};
    S.lastWork[k] = val;
    rerender();
    toast(`Status updated: ${k} is now marked ${val === "recent" ? "Verified" : "Rusty"}.`);
  } else if (a === "complete-ppt") {
    S.pptDone = true;
    S.passportStamps.push({ title: "Recognition of Prior Achievement (PPT)", date: "Certified", source: "JPK Assessment Centre" });
    rerender();
    toast("PPT completed! Hidden skills stamped as verified credentials.");
  } else if (a === "set-release") {
    S.dataRelease = v;
    rerender();
  } else if (a === "missed-week") {
    S.missedWeeks = (S.missedWeeks || 0) + 1;
    const eng = runEngine(target());
    rerender();
    toast(`1 week added. Completion adjusted to Month ${eng ? eng.totalMonths : 6}.`);
  } else if (a === "trigger-demo-update") {
    S.updateProposed = {
      releaseTag: "Release v2.0 (Mar 2026)",
      reason: "Surge in solar commercial tenders increased inverter fault diagnosis demand by +18%."
    };
    rerender();
  } else if (a === "accept-update") {
    S.planRelease = S.dataRelease;
    S.updateProposed = null;
    rerender();
    toast("New market data update accepted into your action plan.");
  } else if (a === "dismiss-update") {
    S.updateProposed = null;
    rerender();
    toast("Update dismissed. Your current timeline is preserved.");
  } else if (a === "export-ics") {
    exportICSFile();
  } else if (a === "print-card") {
    window.print();
  } else if (a === "confirm-change-direction") {
    const newP = $('input[name="newpath"]:checked')?.value || "evolve";
    S.planHistory.push({ path: S.path, date: new Date().toLocaleDateString(), plan: [...S.plan] });
    S.path = newP;
    S.sel = newP;
    S.tab.plan = "timeline";
    rerender();
    toast(`Direction updated to ${D.PATHS[newP].name}. Prior courses preserved.`);
  } else if (a === "log") {
    S.log[v] = (S.log[v] || 0) + 1;
    S.done.plan = true;
    rerender();
  } else if (a === "week") {
    S.week = Math.max(0, (S.week || 0) + +v);
    rerender();
  } else if (a === "simplay") {
    playSim();
  } else if (a === "what-if-toggle") {
    S.hours = 8;
    S.budget = 0;
    rerender();
    toast("Simulating with What-If conditions: 8 hours/wk, RM0 budget.");
  } else if (a === "filter-courses") {
    S.tab.coursesFilter = v;
    rerender();
  } else if (a === "set-sim-mode") {
    S.tab.simMode = v;
    rerender();
  } else if (a === "open-roi") {
    openROIDrawer(v || t.dataset.p || target());
  } else if (a === "close-roi") {
    closeROIDrawer();
  } else if (a === "roi-switch-path") {
    const c = $("#roi-content");
    if (c) c.innerHTML = renderROIDrawerContent(t.dataset.p);
  } else if (a === "apply-roi-path") {
    const newP = t.dataset.p || "evolve";
    S.path = newP;
    S.sel = newP;
    S.done.paths = true;
    closeROIDrawer();
    location.hash = "plan";
    rerender();
    toast(`Selected ${D.PATHS[newP].name}! Action Plan updated.`);
  } else if (a === "copy-verify-link") {
    const hash = getVerificationHash(S);
    const vUrl = `https://bijakmatch.gov.my/verify?id=${hash}&user=${encodeURIComponent(S.name)}`;
    try { navigator.clipboard?.writeText(vUrl); } catch (err) {}
    toast("Official verification URL copied to clipboard!");
  }
});

// Global listener for ROI drawer elements
document.addEventListener("click", e => {
  const t = e.target.closest("[data-act]");
  if (!t) return;
  const a = t.dataset.act;
  if (a === "open-roi") {
    openROIDrawer(t.dataset.p || target());
  } else if (a === "close-roi") {
    closeROIDrawer();
  } else if (a === "roi-switch-path") {
    const c = $("#roi-content");
    if (c) c.innerHTML = renderROIDrawerContent(t.dataset.p);
  } else if (a === "apply-roi-path") {
    const newP = t.dataset.p || "evolve";
    S.path = newP;
    S.sel = newP;
    S.done.paths = true;
    closeROIDrawer();
    location.hash = "plan";
    rerender();
    toast(`Selected ${D.PATHS[newP].name}! Action Plan updated.`);
  } else if (a === "open-why") {
    openWhyDrawer();
  } else if (a === "close-why") {
    closeWhyDrawer();
  } else if (a === "open-card") {
    S.tab.plan = "card";
    S.tab.cardMode = "sim";
    location.hash = "plan";
    rerender();
  }
});

document.addEventListener("input", e => {
  const t = e.target;
  if (t.dataset.bind === "roi-wage") {
    S.wage = +t.value;
    const c = $("#roi-content");
    if (c) c.innerHTML = renderROIDrawerContent(currentRoiPath);
  }
});

document.addEventListener("change", e => {
  const t = e.target;
  if (t.dataset.act === "upload-cert-file" || t.id === "profile-cert-file") {
    if (t.files && t.files[0]) {
      const file = t.files[0];
      verifyCertWithBackend(file.name, "Uploaded Malaysian TVET Certificate: " + file.name);
    }
  }
  if (t.dataset.bind === "roi-hrd") {
    S.hrdLevy = t.checked;
    const c = $("#roi-content");
    if (c) c.innerHTML = renderROIDrawerContent(currentRoiPath);
    rerender();
  }
});

$("#roi-drawer")?.addEventListener("click", e => {
  if (e.target.id === "roi-drawer") closeROIDrawer();
});
$("#why-drawer")?.addEventListener("click", e => {
  if (e.target.id === "why-drawer") closeWhyDrawer();
});
window.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    closeROIDrawer();
    closeWhyDrawer();
  }
});

view.addEventListener("input", e => {
  const t = e.target;
  if (t.dataset.act === "sprout-aoi-threshold") {
    S.sprout.aoiThreshold = +t.value;
    const isCal = S.sprout.aoiThreshold >= 84 && S.sprout.aoiThreshold <= 88;
    const box = $(".aoi-target-box");
    if (box) {
      box.classList.toggle("calibrated", isCal);
      const tag = box.querySelector(".aoi-target-tag");
      if (tag) tag.textContent = isCal ? "PASS: GLARE FILTERED (98%)" : `DEFECT ALERT: SOLDER CRACK? (${S.sprout.aoiThreshold}%)`;
    }
    const valSpan = $(".aoi-slider-header span");
    if (valSpan) valSpan.textContent = S.sprout.aoiThreshold + "%";
    const hudConf = $(".aoi-hud-pill.warn, .aoi-hud-pill");
    const hudDanger = $(".aoi-hud-pill.danger");
    if (hudDanger) {
      hudDanger.textContent = isCal ? "LINE RUNNING · 100% YIELD" : "FALSE REJECT RISK";
      hudDanger.style.color = isCal ? "#7BAE5E" : "#E26848";
      hudDanger.style.borderColor = isCal ? "#7BAE5E" : "#E26848";
    }
    const teleCards = $$(".aoi-tele-card");
    if (teleCards[1]) {
      const b = teleCards[1].querySelector("b");
      if (b) b.textContent = `${S.sprout.aoiThreshold}% ${isCal ? "(Optimal)" : "(Over-tuned)"}`;
      teleCards[1].classList.toggle("alert", !isCal);
    }
    if (teleCards[3]) {
      const b = teleCards[3].querySelector("b");
      if (b) b.textContent = isCal ? "RM14,000 Saved" : "At Risk";
      teleCards[3].classList.toggle("alert", !isCal);
    }
  } else if (t.dataset.act === "tn") {
    $("#tn")?.style.setProperty("--x", t.value + "%");
  } else if (t.dataset.act === "sim-m") {
    clearInterval(simTimer);
    S.tab.simM = +t.value;
    patchSim();
  } else if (t.dataset.bind === "hours") {
    S.hours = +t.value;
    const o = $("#o-hours");
    if (o) o.textContent = S.hours;
  }
});

view.addEventListener("change", e => {
  const t = e.target;
  const b = t.dataset.bind;
  if (t.id === "market-state") {
    S.market = { state: t.value, loading: false, report: (S.marketCache || {})[t.value] || null, error: "" };
    rerenderKeep();
    return;
  }
  if (t.id === "ai-video-file") {
    aiVideo(t.files[0]);
    t.value = "";
    return;
  }
  if (b === "ai-lang") {
    stopMic();
    S.ai.lang = t.value;
    save();
    return;
  }
  if (b === "hours") {
    S.slots = S.slots.length * 2 >= S.hours ? S.slots : defaultSlots(S.hours);
    rerender();
  } else if (b === "budget") {
    S.budget = +t.value;
    rerender();
  } else if (b === "state") {
    S.state = t.value;
    rerender();
  } else if (b === "job") {
    S.job = t.value;
    populateInterviewDefaults(S, S.job);
    rerender();
  } else if (b === "years") {
    S.years = +t.value;
    rerender();
  } else if (b === "name") {
    S.name = t.value.trim() || person().n;
    rerender();
  } else if (b === "hrdLevy") {
    S.hrdLevy = t.checked;
    rerender();
    toast(`Employer HRD Corp levy ${t.checked ? "enabled" : "disabled"}.`);
  } else if (b === "cert-held") {
    if (t.checked) {
      if (!S.certsHeld.includes(t.value)) S.certsHeld.push(t.value);
    } else {
      S.certsHeld = S.certsHeld.filter(x => x !== t.value);
    }
    rerender();
  } else if (b === "slot") {
    S.slots = t.checked ? [...S.slots, t.value] : S.slots.filter(x => x !== t.value);
    rerender();
  } else if (t.dataset.act === "cert") {
    if (t.files.length) {
      S.certsUploaded[t.dataset.v] = true;
      S.passportStamps.push({ title: "Course Certificate Uploaded", date: "Verified", source: t.dataset.v });
      S.done.plan = true;
      rerender();
      toast("Certificate uploaded and verified into your Skills Passport.");
    }
  }
});

/* ==========================================================================
   11. HELPER SCRIPTS: SIMULATION PLAY & ICS EXPORT
   ========================================================================== */
let simTimer = null;
function playSim() {
  clearInterval(simTimer);
  // reduced motion: jump straight to the result
  if (BM.still()) { S.tab.simM = 24; patchSim(); return; }
  S.tab.simM = 0;
  patchSim();
  simTimer = setInterval(() => {
    // stop if the user left the Simulate tab or reached the end
    if (S.tab.simM >= 24 || !patchSim()) { clearInterval(simTimer); return; }
    S.tab.simM++;
    patchSim();
  }, 400);
}

function exportICSFile() {
  const pKey = target();
  const eng = runEngine(pKey);
  let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//BijakMatch//MY//EN\n";
  if (eng && eng.steps) {
    eng.steps.forEach((st, i) => {
      ics += `BEGIN:VEVENT\nSUMMARY:BijakMatch: ${st.name}\nDESCRIPTION:${st.why}\nDTSTART:20261101T090000Z\nDTEND:20261101T110000Z\nSTATUS:CONFIRMED\nEND:VEVENT\n`;
    });
  }
  ics += "END:VCALENDAR";
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `bijakmatch-${pKey}-plan.ics`;
  a.click();
  toast("Calendar (.ics) exported.");
}

/* ==========================================================================
   12. APP INITIALIZATION
   ========================================================================== */
$("#who").addEventListener("change", e => {
  S = fresh(e.target.value, true);
  save();
  toast(`Now exploring as ${person().n}.`);
  location.hash === "#paths" ? go() : location.hash = "paths";
});

const pauseBtn = $("#pause");
function applyPause() {
  document.documentElement.classList.toggle("still", BM.still());
  pauseBtn.setAttribute("aria-pressed", String(BM.isPaused()));
  pauseBtn.querySelector("span").textContent = BM.isPaused() ? "Play" : "Pause";
}
pauseBtn.addEventListener("click", () => {
  BM.setPaused(!BM.isPaused());
  applyPause();
});

$(".logo").innerHTML = `<svg viewBox="0 0 32 32" aria-hidden="true" style="width:34px;height:34px;flex-shrink:0"><circle cx="16" cy="16" r="16" fill="#1E5A3A"/><path d="M9 21c0-7 5-11 14-12-1 9-5 14-12 14" fill="#7BAE5E"/><path d="M10 23c3-4 6-7 10-10" stroke="#F2C230" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>
<div style="display:flex;flex-direction:column;line-height:1.15">
  <span style="font-weight:800;font-size:22px;letter-spacing:-0.02em;color:var(--forest)">Sprout</span>
  <span style="font-size:10px;font-weight:700;color:var(--ink-2);letter-spacing:0.03em;text-transform:none">Grow Your Green Future</span>
</div>`;

buildLand();
applyPause();
addEventListener("hashchange", go);
addEventListener("keydown", e => {
  if (e.key === "Escape" && S.sprout && S.sprout.activeModal) {
    S.sprout.activeModal = null;
    rerender();
  }
});
go();

view.addEventListener("keydown", e => {
  if (e.target.id === "ai-answer" && e.key === "Enter" && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    aiSend();
  }
});
