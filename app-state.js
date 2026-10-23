/* BijakMatch: State shape (fresh) and interview defaults.
   Classic script; shares one global scope with the other app-*.js files (load order in index.html). */
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
      time: filled,
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
