/* BijakMatch: Skills and proof view.
   Classic script; shares one global scope with the other app-*.js files (load order in index.html). */
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

  const journeyFooter = `
    <div class="sprout-journey-banner">
      <div>
        <span class="sprout-journey-badge">Step 2 of 6</span>
        <div class="sprout-journey-body">
          <h4>${S.interviewTasks.filter(t => t.kept).length} skills found so far</h4>
          <p>Next, step onto the factory floor to see how AI changes your daily tasks and which human skills stay yours.</p>
        </div>
      </div>
      <a href="#impact" class="sprout-journey-cta">
        <span>Step 3: How AI Can Affect Your World</span>
        <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h12M11 5l5 5-5 5"/></svg>
      </a>
    </div>`;

  return `${pageHead("Show what you do at work", "Answer in your own words. Every skill we find links back to what you said.")}${tabs("skills", [["interview", "Shift Interview"], ["check", "Three-Track Check"], ["passport", "Skills Passport"]])}${body}${journeyFooter}`;
};

