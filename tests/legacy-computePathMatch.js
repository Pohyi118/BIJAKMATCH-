function legacyComputePathMatch(pathKey, state = S) {
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
