# BijakMatch — Pitch Copy

**One line:** A career-path simulator for TVET workers that reads what they can actually do, not just what their CV says, and turns the chosen path into a calendar they can follow.

## The problem

A CV alone does not show what a TVET worker has done. Skills are learned on the job, through SVM certificates and short courses. CV-only tools undersell these workers and send them toward the wrong roles.

## What makes BijakMatch different

### 1. Evidence beyond the CV
Workers can add SVM and short-course certificates, log their daily work activities, and answer interview prompts about what they do. Their profile reflects real experience, not just a document.

### 2. Deterministic recommendations on government data
Job trends come from government open data, so the numbers stay consistent. Scoring uses fixed rules, so the same profile always gets the same result. The recommendation never depends on a generative model, which removes the risk of inconsistent or invented advice. AI is used only to hold the interview conversation and to write plain-language explanations. It never changes a score, a ranking or a schedule.

### 3. Stay / Evolve / Pivot simulation
The user picks one of three cards based on their experience:
- **Stay:** keep the current position.
- **Evolve:** upskill in the current field.
- **Pivot:** reskill into a different career.

Each path is scored against state-level job opportunities. A market-saturation check warns when a field is overcrowded, so users do not rush into the same crowded roles. This reduces bias and noise in the decision.

### 4. A course plan that adapts
Once a path is chosen, BijakMatch picks the relevant courses and schedules them into a calendar. If the user changes their mind, the plan is rebuilt for the new path. Streak-style progress tracking, in the spirit of Duolingo, keeps them going.

## Why it matters
- **Fairer to TVET workers:** experience and certificates count.
- **Trustworthy:** rule-based scoring on official data.
- **Realistic:** saturation-aware, state-level opportunity.
- **Actionable:** the result is a schedule, not just a report.
