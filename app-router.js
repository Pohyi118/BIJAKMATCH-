/* BijakMatch: Router and event listeners.
   Classic script; shares one global scope with the other app-*.js files (load order in index.html). */
/* ==========================================================================
   10. ROUTER & EVENT LISTENERS
   ========================================================================== */
let route = null;

const PAGE_TITLES = { demo: "Product demo", story: "Same hands, new work", home: "Your overview", start: "Get started", profile: "Tell us about yourself", skills: "Show what you do at work", impact: "How AI Can Affect Your World", paths: "Choose your path", courses: "Courses for your plan", plan: "Your plan" };

function go() {
  stopMic();
  gpuRecStop(true);
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
  } else if (a === "ai-gpu-mic") {
    gpuMicToggle();
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
  } else if (a === "demo-pick") {
    S.path = v;
    S.sel = v;
    rerender();
    toast(`${D.PATHS[v].name} chosen. Schedule rebuilt.`);
  } else if (a === "demo-reset") {
    S.missedWeeks = 0;
    rerender();
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
    S.done.time = true;
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
    S.done.time = true;
    S.slots = S.slots.length * 2 >= S.hours ? S.slots : defaultSlots(S.hours);
    rerender();
  } else if (b === "budget") {
    S.budget = +t.value;
    S.done.time = true;
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

