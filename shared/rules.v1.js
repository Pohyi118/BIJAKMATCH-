/* BijakMatch scoring rules, version 1. The only place score weights, credits and cut-offs live.
   Loaded as a plain script in the browser (sets BM_RULES) and with require() in Node.
   Change a number here and bump `version`; never hard-code these values elsewhere. */
(function (root) {
  const RULES = {
    version: "1.0.0",
    score: {
      // points available per part, by the worker's goal
      weights: {
        quick: { overlap: 40, demand: 20, interest: 15, ease: 25 },
        income: { overlap: 30, demand: 35, interest: 15, ease: 20 }
      },
      // Task overlap: share of the base job overlap vs the worker's own skill match
      overlapSplit: { base: 0.5, skill: 0.5 },
      // credit per skill by track; legal-requirement skills only count once verified
      skillCredit: { verified: 1.0, hidden: 0.75, rusty: 0.60 },
      lawCredit: { verified: 1.0 },
      defaultBaseOverlap: 0.6,
      // Market demand
      defaultDemand: 0.7,
      windowAdjust: { Long: 0.08, Closing: -0.12 },
      incomeGoal: { payFloor: 2400, paySpan: 2200, demandShare: 0.7, payShare: 0.3 },
      demandCap: 1.1,
      // Interest answer to factor
      interest: { yes: 1.0, maybe: 0.55, no: 0.05 },
      // Ease of move
      ease: { timeShare: 0.6, moneyShare: 0.4, monthsFloor: 2, monthsSpan: 18, defaultMonths: 6, horizonMonths: 24, licencePenalty: 8, minWhenBlocked: 2 },
      defaultSdgFit: 0.5,
      sdgBonusMax: 8,
      // labels for the 0-100 total, highest cut-off first
      bands: [
        { min: 75, label: "strong" },
        { min: 60, label: "good" },
        { min: 45, label: "fair" },
        { min: 0, label: "weak" }
      ]
    },
    experience: {
      levels: [[80, "Expert"], [55, "Experienced"], [30, "Developing"], [0, "Beginner"]]
    }
  };
  if (typeof module !== "undefined" && module.exports) module.exports = RULES;
  else root.BM_RULES = RULES;
})(typeof globalThis !== "undefined" ? globalThis : this);
