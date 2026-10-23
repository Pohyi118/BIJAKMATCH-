/* BijakMatch: Simulation play, ICS export, initialisation.
   Classic script; shares one global scope with the other app-*.js files (load order in index.html). */
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

