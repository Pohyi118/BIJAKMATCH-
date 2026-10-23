/* BijakMatch: Career Transition Card 24-month simulation.
   Classic script; shares one global scope with the other app-*.js files (load order in index.html). */
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

