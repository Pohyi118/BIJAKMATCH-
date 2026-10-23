/* BijakMatch: Why panel, shell, navigation, landscape.
   Classic script; shares one global scope with the other app-*.js files (load order in index.html). */
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
  { id: "profile", label: "My Profile", icon: "profile" },
  { id: "skills", label: "Show Your Skills", icon: "skills" },
  { id: "impact", label: "How AI Affects Your World", icon: "world", badge: "Live" },
  { id: "paths", label: "My Pathway", icon: "pathway" },
  { id: "courses", label: "Courses", icon: "courses" },
  { id: "plan", label: "My Growth Plan", icon: "plan" }
];

const NAV_ICONS = {
  home: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5L10 3l7 5.5V17a1 1 0 0 1-1 1h-4v-5H8v5H4a1 1 0 0 1-1-1V8.5z"/></svg>',
  skills: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10.5l4 4 8-9"/><rect x="2.5" y="2.5" width="15" height="15" rx="3"/></svg>',
  pathway: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="4" cy="16" r="2"/><circle cx="16" cy="4" r="2"/><circle cx="16" cy="16" r="2"/><path d="M6 16h6a4 4 0 0 0 4-4V6"/><path d="M6 16v-6a4 4 0 0 1 4-4h4"/></svg>',
  world: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 17V7l5 3V7l5 3V3l6 4v10H2z"/><path d="M7 17v-4h4v4"/></svg>',
  compass: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="7.5"/><polygon points="13.5 6.5 11.5 11.5 6.5 13.5 8.5 8.5 13.5 6.5"/></svg>',
  courses: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6l8-3 8 3-8 3-8-3z"/><path d="M4 8.5v5c0 2 3 3.5 6 3.5s6-1.5 6-3.5v-5"/><path d="M18 9v4"/></svg>',
  plan: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/><path d="M8 7h4M8 11h4M8 15h2"/></svg>',
  profile: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 17v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 15.5V17"/><circle cx="10" cy="6.5" r="3.5"/></svg>',
  done: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3.5 3.5 6.5-7"/></svg>'
};
const STEP_IDS = ["profile", "skills", "impact", "paths", "courses", "plan"];

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
    { id: "skills", label: "Skills", num: 2 },
    { id: "impact", label: "How AI Affects Your World", num: 3 },
    { id: "paths", label: "Choose Path", num: 4 },
    { id: "courses", label: "Career & Courses", num: 5 },
    { id: "plan", label: "Growth Plan", num: 6 }
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

