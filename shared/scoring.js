/* BijakMatch match score as a pure function: numbers in, numbers out, no DOM and no state.
   Shared by the browser (offline) and the server so both give the same answer.
   Every weight comes from rules.v1.js. */
(function (root) {
  const RULES = (typeof module !== "undefined" && module.exports) ? require("./rules.v1.js") : root.BM_RULES;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const r1 = v => Math.round(v * 10) / 10;

  /* i = {
       goal, baseOverlap (0-1), skills: [{ group, track }], baseDemand, snapshotMult, windowLabel,
       payHigh, interest ("yes"|"maybe"|"no"), months, netCost, budget, licenceBlocked, sdgFit (0-1)
     } */
  function scorePath(i, rules = RULES) {
    const R = rules.score;
    const W = i.goal === "quick" ? R.weights.quick : R.weights.income;

    // Part 1: task overlap
    let credit = 0;
    for (const s of i.skills) {
      if (s.group === "law") credit += R.lawCredit[s.track] || 0;
      else credit += R.skillCredit[s.track] || 0;
    }
    const skillPct = (credit / Math.max(1, i.skills.length)) * 100;
    const rawOverlap = R.overlapSplit.base * i.baseOverlap * 100 + R.overlapSplit.skill * skillPct;
    const p1 = (rawOverlap / 100) * W.overlap;

    // Part 2: market demand
    let demand = i.baseDemand * i.snapshotMult + (R.windowAdjust[i.windowLabel] || 0);
    if (i.goal === "income") {
      const g = R.incomeGoal;
      demand = demand * g.demandShare + ((i.payHigh - g.payFloor) / g.paySpan) * g.payShare;
    }
    const p2 = clamp(demand, 0, R.demandCap) * W.demand;

    // Part 3: the worker's own interest
    const p3 = (R.interest[i.interest] ?? R.interest.maybe) * W.interest;

    // Part 4: ease of move (time fit and money fit)
    const E = R.ease;
    const timeFit = clamp(1 - (i.months - E.monthsFloor) / E.monthsSpan, 0, 1);
    const moneyFit = i.netCost <= 0 ? 1 : clamp((i.budget * E.horizonMonths) / i.netCost, 0, 1);
    let p4 = (E.timeShare * timeFit + E.moneyShare * moneyFit) * W.ease;
    if (i.licenceBlocked) p4 = Math.max(E.minWhenBlocked, p4 - E.licencePenalty);

    const sdgBonus = i.sdgFit * R.sdgBonusMax;
    const total = clamp(Math.round(p1 + p2 + p3 + p4 + sdgBonus), 0, 100);

    return {
      total,
      band: bandFor(total, rules),
      parts: { overlap: r1(p1), demand: r1(p2), interest: r1(p3), ease: r1(p4), sdgBonus: r1(sdgBonus) },
      maxParts: W,
      rules_version: rules.version
    };
  }

  function bandFor(total, rules = RULES) {
    return rules.score.bands.find(b => total >= b.min).label;
  }

  function experienceLevel(score, rules = RULES) {
    return rules.experience.levels.find(([min]) => score >= min)[1];
  }

  const api = { scorePath, bandFor, experienceLevel };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.BMScoring = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
