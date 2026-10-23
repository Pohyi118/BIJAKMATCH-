/* BijakMatch: Guided demo walkthrough (#demo).
   Classic script; shares one global scope with the other app-*.js files (load order in index.html).
   Every number on this page comes from the same engine the rest of the app uses; nothing is hard-coded. */

const DEMO_CHAPTERS = [
  ["evidence", "1", "Beyond the CV"],
  ["data", "2", "Rules on open data"],
  ["cards", "3", "Stay, Evolve, Pivot"],
  ["calendar", "4", "A plan that adapts"]
];

// Display-only reading of "applicants per open role" for the saturation badge. Scoring does not use it.
const demoCrowd = seekers => seekers >= 8 ? ["Crowded", "warn"] : seekers >= 5 ? ["Moderate", "mid"] : ["Open", "ok"];

function demoEvidence() {
  const sk = deriveSkillsSummary();
  const all = sk.verified.length + sk.hidden.length + sk.rusty.length;
  const onPaper = sk.verified.length + sk.rusty.length;
  const kept = S.interviewTasks.filter(t => t.kept);
  const quote = kept.find(t => t.quote);
  return `
  <div class="demo-grid">
    <section class="panel demo-src">
      <span class="demo-num">A</span><h3>Certificates</h3>
      <p class="small muted">SVM, SKM and short-course certificates, checked against the Malaysian whitelist.</p>
      <ul class="demo-list">${S.certsHeld.map(c => `<li>${esc(c)}</li>`).join("") || "<li>None added yet</li>"}</ul>
    </section>
    <section class="panel demo-src">
      <span class="demo-num">B</span><h3>Daily work activities</h3>
      <p class="small muted">What ${esc(S.name)} does on a normal shift, even without a paper to show for it.</p>
      <ul class="demo-list">${kept.slice(0, 4).map(t => `<li>${esc(t.n)}</li>`).join("") || "<li>None logged yet</li>"}</ul>
    </section>
    <section class="panel demo-src">
      <span class="demo-num">C</span><h3>Interview answers</h3>
      <p class="small muted">Bijak asks about the shift. Each skill found links back to the worker's own words.</p>
      ${quote ? `<blockquote class="demo-quote">&ldquo;${esc(quote.quote)}&rdquo;<cite>Found: ${esc(quote.n)}</cite></blockquote>` : '<p class="small muted">No answers yet.</p>'}
    </section>
  </div>

  <section class="panel demo-result">
    <div class="row" style="justify-content:space-between">
      <h3 style="margin:0">What the system finds</h3>
      <span class="tag tag--sample">Sample worker: ${esc(S.name)}</span>
    </div>
    <p class="demo-contrast"><b>${onPaper} of ${all}</b> skills show up on paper. The other <b>${all - onPaper}</b> only appear because of the work activities and interview.</p>
    <div class="chips">${[...sk.verified.map(s => chip(s, "verified")), ...sk.hidden.map(s => chip(s, "hidden")), ...sk.rusty.map(s => chip(s, "rusty"))].join("")}</div>
    <ul class="demo-key">
      <li><b>Verified:</b> certified and still done at work.</li>
      <li><b>Hidden:</b> done at work, no certificate. Target for PPT recognition.</li>
      <li><b>Rusty:</b> certified, but not used for over a year. Gets a half-length refresher.</li>
    </ul>
    <div class="row"><a class="btn small" href="#skills" data-tab="skills:interview">Try the interview</a><a class="btn small ghost" href="#skills" data-tab="skills:passport">See the Skills Passport</a></div>
  </section>`;
}

function demoData() {
  const t = target();
  const m = computePathMatch(t);
  const again = computePathMatch(t);
  const rules = typeof BM_RULES !== "undefined" && BM_RULES.version ? BM_RULES.version : "1";
  const rows = [["Task overlap", "overlap"], ["Market demand", "demand"], ["Your interest", "interest"], ["Ease of move", "ease"]];
  return `
  <div class="demo-grid demo-grid--2">
    <section class="panel">
      <h3>Where the numbers come from</h3>
      <p class="small muted">Government open data, loaded as a dated release so every score can be traced to its source.</p>
      <ul class="demo-sources">
        <li><span class="tag tag--real">Govt data</span><b>MyMAHIR and DOSM quarterly tables</b><span class="small muted">Job demand and wages</span></li>
        <li><span class="tag tag--real">Govt policy</span><b>National Energy Transition Roadmap</b><span class="small muted">Green-sector priorities</span></li>
        <li><span class="tag tag--real">Statutory</span><b>Suruhanjaya Tenaga licensing</b><span class="small muted">Licences required by law</span></li>
        <li><span class="tag tag--real">Standard</span><b>NOSS / JPK framework</b><span class="small muted">Skills and PPT recognition</span></li>
      </ul>
      <p class="small">Current release: <b>${esc(S.dataRelease)}</b> · Rule set: <b>v${esc(rules)}</b></p>
    </section>

    <section class="panel">
      <h3>Same input, same answer</h3>
      <p class="small muted">Match score for <b>${D.PATHS[t].name}: ${esc(pathSub(t))}</b>, built from four fixed parts. Age, gender and background are not inputs.</p>
      <div class="breakdown-box">${rows.map(([n, k]) => `<div class="breakdown-row"><span>${n}</span><div class="breakdown-bar"><i style="width:${(m.parts[k] / m.maxParts[k]) * 100}%"></i></div><b>${Math.round(m.parts[k])}<span>/${m.maxParts[k]}</span></b></div>`).join("")}</div>
      <p class="demo-same"><b>${m.total}</b> on the first run, <b>${again.total}</b> on the second. ${m.total === again.total ? "No variation." : "Mismatch."}</p>
    </section>
  </div>

  <section class="panel demo-split">
    <div>
      <span class="tag tag--projection">Decides</span>
      <h3>Fixed rules</h3>
      <p class="small">Path scores and ranking, course order, the weekly schedule and the finish date. Written down in one rules file, with no generative model involved.</p>
    </div>
    <div>
      <span class="tag tag--estimate">Assists</span>
      <h3>AI, for conversation only</h3>
      <p class="small">A language model holds the interview and writes plain-language explanations. It never changes a score, a ranking or a schedule.</p>
    </div>
  </section>
  <div class="row"><a class="btn small ghost" href="#paths">Open the full score breakdown</a></div>`;
}

function demoCards() {
  const pick = target();
  const order = ranked();
  return `
  <p class="demo-lead">${esc(S.name)} picks one card. Each shows the match score, the cost to get there, and how crowded that job market already is.</p>
  <div class="demo-cards">${PATH_IDS.map(p => {
    const P = D.PATHS[p];
    const m = computePathMatch(p);
    const eng = m.engine;
    const [crowdLabel, crowdCls] = demoCrowd(P.seekers);
    const win = m.window;
    const home = P.jobs.find(([s]) => s === S.state);
    return `<article class="demo-card ${p === pick ? "on" : ""}">
      <header><span class="demo-card-kind">${P.name}</span><b>${esc(pathSub(p))}</b></header>
      <div class="demo-score"><strong>${m.total}</strong><span>match${p === order[0] ? " · best fit" : ""}</span></div>
      <dl>
        <dt>Time to finish</dt><dd>${eng ? eng.totalMonths : "?"} months</dd>
        <dt>Cost to you</dt><dd>${rm(eng ? eng.netCost : P.cost)}</dd>
        <dt>Pay range</dt><dd>${rm(P.pay[0])} to ${rm(P.pay[1])}</dd>
        <dt>Openings in ${esc(S.state)}</dt><dd>${home ? home[1] : "No data"}</dd>
        <dt>Job window</dt><dd>${esc(win.label)}</dd>
      </dl>
      <div class="demo-crowd demo-crowd--${crowdCls}"><b>Market: ${crowdLabel}</b><span>${P.seekers} applicants per open role</span></div>
      <button class="btn small ${p === pick ? "" : "ghost"}" data-act="demo-pick" data-v="${p}" aria-pressed="${p === pick}">${p === pick ? "Chosen" : "Choose " + P.name}</button>
    </article>`;
  }).join("")}</div>
  <p class="small muted">Applicants per role come from the same market table the Transition Card uses. A crowded field lowers the odds of landing the job, so it is shown next to the score instead of hidden inside it.</p>
  <div class="row"><a class="btn small ghost" href="#paths">Compare in detail</a><a class="btn small ghost" href="#plan" data-tab="plan:card">Run the Transition Card</a></div>`;
}

function demoCalendar() {
  const p = target();
  const eng = runEngine(p);
  const wk = S.missedWeeks || 0;
  const steps = eng ? eng.steps : [];
  const last = Math.max(1, eng ? eng.totalWeeks : 1);
  const others = PATH_IDS.filter(x => x !== p);
  return `
  <p class="demo-lead">The courses for <b>${D.PATHS[p].name}: ${esc(pathSub(p))}</b> are placed into weeks that fit ${S.hours} hours a week and ${rm(S.budget)} a month.</p>
  <section class="panel">
    <div class="row" style="justify-content:space-between">
      <h3 style="margin:0">Study calendar</h3>
      <span class="tag tag--projection">Finish in ${eng ? eng.totalMonths : "?"} months</span>
    </div>
    <div class="demo-week">${weekGrid(S.slots)}</div>
    <ol class="demo-gantt">${steps.map(st => {
      const name = st.short.replace(/( refresh)+$/i, st.id.endsWith("-refresh") ? " refresh" : "");
      if (!st.startWk) {
        return `<li><span class="demo-gname"><b>${esc(name)}</b><small>${st.hours} h · ${rm(st.fee)}</small></span>
          <span class="demo-gtrack" role="img" aria-label="${esc(name)}: not scheduled within 24 months"></span>
          <span class="demo-gwk">Saving up</span></li>`;
      }
      const a = st.startWk, b = st.endWk || last;
      return `<li><span class="demo-gname"><b>${esc(name)}</b><small>${st.hours} h · ${rm(st.fee)}</small></span>
        <span class="demo-gtrack" role="img" aria-label="${esc(name)}: week ${a} to week ${b}"><i style="left:${((a - 1) / last) * 100}%;width:${Math.max(2, ((b - a + 1) / last) * 100)}%"></i></span>
        <span class="demo-gwk">Wk ${a}${b !== a ? "–" + b : ""}</span></li>`;
    }).join("") || '<li class="small muted">No courses needed for this path.</li>'}</ol>
  </section>

  <section class="panel demo-replan">
    <h3>Life happens. Replan it.</h3>
    <div class="demo-replan-row">
      <div>
        <b>Missed a week</b>
        <p class="small muted">Weeks missed so far: <b>${wk}</b>. Every course after the gap slides along and the finish date updates.</p>
        <div class="row"><button class="btn small" data-act="missed-week">I missed this week</button><button class="btn small ghost" data-act="demo-reset" ${wk ? "" : "disabled"}>Undo</button></div>
      </div>
      <div>
        <b>Changed your mind</b>
        <p class="small muted">Switch card and the schedule is rebuilt for the new path:</p>
        <div class="row">${others.map(o => `<button class="btn small ghost" data-act="demo-pick" data-v="${o}">${D.PATHS[o].name}: ${runEngine(o).totalMonths} mo</button>`).join("")}</div>
      </div>
    </div>
  </section>
  <div class="row"><a class="btn small ghost" href="#plan" data-tab="plan:calendar">Open the full calendar</a><button class="btn small ghost" data-act="export-ics">Add to my phone calendar (.ics)</button></div>`;
}

V.demo = () => {
  const cur = tabOf("demo", "evidence");
  const idx = Math.max(0, DEMO_CHAPTERS.findIndex(c => c[0] === cur));
  const body = { evidence: demoEvidence, data: demoData, cards: demoCards, calendar: demoCalendar }[DEMO_CHAPTERS[idx][0]]();
  const prev = DEMO_CHAPTERS[idx - 1], next = DEMO_CHAPTERS[idx + 1];
  return `<div class="demo">
    ${pageHead("Product demo", "Four things BijakMatch does that a CV-only tool cannot. Everything below is live and uses the sample worker.")}
    <nav class="demo-steps" aria-label="Demo chapters">${DEMO_CHAPTERS.map(([id, n, label], i) => `<a href="#demo" data-tab="demo:${id}" class="${i === idx ? "on" : i < idx ? "done" : ""}" ${i === idx ? 'aria-current="step"' : ""}><i>${n}</i>${label}</a>`).join("")}</nav>
    <div class="demo-body">${body}</div>
    <div class="demo-nav">
      ${prev ? `<a class="btn ghost" href="#demo" data-tab="demo:${prev[0]}">Back: ${prev[2]}</a>` : "<span></span>"}
      ${next ? `<a class="btn" href="#demo" data-tab="demo:${next[0]}">Next: ${next[2]}</a>` : '<a class="btn" href="#plan">Open my growth plan</a>'}
    </div>
  </div>`;
};
