# ReRole Green / BijakMatch: Technical Implementation Specification

> **Target Audience:** Software engineers, coding agents, and technical judges.  
> **Purpose:** Translates the conceptual proposal (`ReRole Green 提案.pdf`) into an unambiguous, formal technical specification covering data schemas, mathematical formulations, algorithmic state machines, and system implementation details.

---

## 1. Executive Summary & Problem Formulation

### 1.1 The Domain Problem
Malaysia has over 600,000 Technical and Vocational Education and Training (TVET) workers and factory line technicians vulnerable to rapid manufacturing automation. While generic career portals recommend broad AI courses or tell technicians to "learn solar," workers face three structural bottlenecks:
1. **Unrecognized Experience:** Conventional CVs fail to capture granular shop-floor competencies, safety protocols, and troubleshooting skills.
2. **Timing Uncertainty:** Workers cannot distinguish whether a green skill has a multi-year growth runway (blue ocean) or is rapidly saturating (red ocean).
3. **Regulatory & Financial Gates:** Green roles (e.g., Solar PV and EV charging) require statutory licences (Suruhanjaya Tenaga, SEDA GCPV) that have hard prerequisites and costs exceeding monthly disposable income.

### 1.2 System Objective
**ReRole Green (BijakMatch)** is an open, client-side, explainable career investment navigator designed for in-service TVET workers. It:
- Deconstructs workplace routines via a structured **Shift-Based Interview** mapped to official **National Occupational Skills Standards (NOSS)**.
- Derives a **Three-Track Skill Profile** (**Verified**, **Hidden**, **Rusty**) by cross-referencing certs with actual work.
- Evaluates transition viability using a transparent **4-Part Match Score** and a timing **Window Score**.
- Generates a **Weekly Execution Plan** using a single, deterministic simulation engine that schedules learning blocks and evidence blocks, flags financial bottlenecks, and outputs an official **Career Transition Card**.

---

## 2. System Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL DATA SIGNALS                          │
│  - Anthropic Economic Index (AEI)    - ILO GenAI Task Exposure Index   │
│  - OpenDOSM Labor Statistics API     - MyMAHIR Green Taxonomies        │
│  - JPK NOSS Competence Standards     - HRD Corp Course Catalogue       │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ Normalized Releases
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     VERSIONED DATASET (app-data.js)                    │
│  - JOBS Dictionary & AI Exposure    - TASKCARDS Taxonomy (15 units)    │
│  - CERTS Whitelist Registry         - PATHS Definitions (Stay/Evolve)  │
│  - COURSES Catalogue (4 Tiers)      - SNAPSHOTS (2025-01, 2025-09...)  │
│  - SUBSIDIES & SDG Fit Mappings     - SAMPLE Profiles (Ahmad, Siti...) │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     CORE LOGIC ENGINES (app.js)                        │
│                                                                        │
│  ┌───────────────────────┐  ┌───────────────────────────────────────┐  │
│  │ 3-Track Derivation    │  │ 4-Part Match Scoring & Window Score   │  │
│  │ Certs × Doing Matrix  │  │ Overlap, Demand, Interest, Ease + SDG │  │
│  └───────────┬───────────┘  └───────────────────┬───────────────────┘  │
│              │                                  │                      │
│              └─────────────────┬────────────────┘                      │
│                                ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Unified Weekly Simulation Engine (runEngine)                     │  │
│  │ 4-Tier Order: PPT → Refresher → Window Gaps → Licences           │  │
│  │ Prerequisite DAG Check • Weekly Budget Accumulator • Subsidies   │  │
│  └─────────────────────────────┬────────────────────────────────────┘  │
└────────────────────────────────┼───────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        REACTIVE PRESENTATION                           │
│  - Understand: Shift Interview • 3-Track Skill Breakdown • Passport    │
│  - Decide: 3-Path Comparison • Time Machine Diff • 24-Mo Simulation   │
│  - Act: Recommended Courses • Calendar (.ics) • Transition Card       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Schemas & Contracts

### 3.1 Job & Task Dictionary (`JOBS`, `TASKCARDS`)
Each occupation is broken down into constituent tasks with time-series AI exposure ratings:

```typescript
interface JobDefinition {
  n: string;                      // Display occupation title
  tasks: Array<{
    n: string;                    // Task name
    e: [number, number, number];  // AI exposure coefficients for [2026, 2028, 2030]
  }>;
  interview: Array<InterviewPhase>;
}

interface TaskCard {
  n: string;                      // Task name
  kw: string[];                   // Keyword matching strings (lowercased)
  noss: string;                   // Official NOSS Code (e.g. "EE-021-2:2012")
}
```

#### Task Cards Whitelist (Standard 15 Cards):
1. `Equipment start-up check` [`EE-021-2:2012`] — Keywords: *start, machine, check, morning, inspect, power, prep*
2. `Shift handover notes` [`Z-009-2:2015`] — Keywords: *handover, notes, night shift, logbook, reading notes*
3. `Parameter logging` [`EE-021-2:2012`] — Keywords: *parameter, log, logging, temperature, pressure, meter, hourly*
4. `Fault diagnosis` [`EE-021-3:2012`] — Keywords: *fault, alarm, stopped, troubleshoot, cause, broken, diagnose*
5. `Inverter fault diagnosis` [`EE-320-3:2012`] — Keywords: *inverter, drive, fault code, vfd, inverter manual*
6. `Safety isolation` [`EE-021-2:2012`] — Keywords: *isolate, switch off, lock, tag, loto, lockout, dead, breaker*
7. `Multimeter testing` [`EE-021-2:2012`] — Keywords: *multimeter, voltage, current, testing, continuity, probe*
8. `Wiring, SKM Level 2` [`EE-021-2:2012`] — Keywords: *wiring, cable, wire, conduit, panel wiring, circuits*
9. `Reading drawings` [`EE-021-2:2012`] — Keywords: *drawings, schematic, blueprint, diagram, circuit diagram*
10. `PLC basics` [`EE-021-3:2012`] — Keywords: *plc, ladder logic, controller, programmable, automation*
11. `Sensor troubleshooting` [`EE-021-3:2012`] — Keywords: *sensor, proximity, photoelectric, transducer*
12. `Training others` [`Z-009-3:2015`] — Keywords: *train, teach, new staff, operator, show them, guide, mentor*
13. `Machine changeover` [`EE-021-2:2012`] — Keywords: *changeover, tooling, setup, jig, fixture*
14. `Quality visual inspection` [`QC-010-2:2014`] — Keywords: *visual inspection, defect, sampling, qc, micrometer*
15. `Forklift safe handling` [`LOG-011-2:2013`] — Keywords: *forklift, pallet, stacking, loading, unloading*

### 3.2 Certificate Whitelist (`CERTS`)
```typescript
interface CertDefinition {
  n: string;                      // Full credential title
  skills: string[];               // Competency units certified by this credential
  hoursCredit: number;            // Prior learning credit hours awarded
}
```
- **`SKM Level 2, electrical`**: Certifies `Wiring, SKM Level 2`, `Multimeter testing`, `Reading drawings`, `Safety isolation`.
- **`SKM Level 3, electrical`**: Certifies above plus `PLC basics`, `Sensor troubleshooting`, `Fault diagnosis`.
- **`HRD Corp short course: Electrical Safety`**: Certifies `Safety isolation`, `OSH safety induction`.
- **`Forklift operator permit`**: Certifies `Forklift safe handling`, `Equipment start-up check`.

### 3.3 Target Pathways (`PATHS`)
```typescript
interface PathDefinition {
  name: "Stay" | "Evolve" | "Pivot";
  sub: string;
  hours: number;                  // Nominal baseline total training hours
  cost: number;                   // Nominal baseline total training cost (RM)
  pay: [number, number];          // [Entry monthly salary, 3-5 yr monthly salary]
  demand: {
    moderate: number;             // Base demand index under Moderate scenario (0.0 - 1.0)
    accelerated: number;          // Base demand index under Accelerated scenario (0.0 - 1.0)
  };
  skills: Array<[string, "law" | "most" | "nice"]>;
  gates: string[];                // Statutory licences required by law
  windowTask: string;             // Anchor task used for Window Score calculation
  exit: string;                   // Quantitative tripwire for abandonment
  backup: "stay" | "evolve" | "pivot";
  jobs: Array<[string, number]>;  // [State, 3-month job openings]
  seekers: number;                // Applicants per job opening
  growth: string;
  risk: "Low" | "Some" | "Higher";
}
```

### 3.4 Course Catalogue (`COURSES`)
Every course is categorized into a strict 4-step sequence:
```typescript
interface CourseDefinition {
  id: string;
  stepCategory: 1 | 2 | 3 | 4;   // 1: PPT, 2: Refresher, 3: Window Gaps, 4: Statutory Licence
  short: string;
  n: string;
  by: string;                     // Accredited provider type (NIOSH, SEDA, JPK, etc.)
  hours: number;
  fee: number;                    // Tuition fee in MYR (RM)
  intakeWeek: number;             // Minimum week offset when cohort opens
  mode: string;                   // Weekend class / Online self-paced / Practical drill
  track: "auto" | "cert" | "self";
  skills: string[];
  hrd: "Claimable (example)" | "Free" | "Free to audit" | "To be confirmed";
  prereq?: string;                // DAG prerequisite dependency
  refreshable: boolean;           // True if eligible for 50% hours/fee rusty refresher
  why: string;
}
```

---

## 4. Algorithmic Formulations

### 4.1 Three-Track Skill Profile Derivation (§5.1)
The system categorizes all potential skills into three functional states without arbitrary estimation:

$$\text{Track}(s) = \begin{cases}
\textbf{Verified}, & \text{if } \text{isCertified}(s) \wedge \text{isDoing}(s) \\
\textbf{Verified}, & \text{if } \text{isCertified}(s) \wedge \neg\text{isDoing}(s) \wedge (\text{lastWork}[s] = \text{"recent"}) \\
\textbf{Rusty}, & \text{if } \text{isCertified}(s) \wedge \neg\text{isDoing}(s) \wedge (\text{lastWork}[s] = \text{">1y"}) \\
\textbf{Hidden}, & \text{if } \neg\text{isCertified}(s) \wedge \text{isDoing}(s) \\
\textbf{Missing}, & \text{otherwise}
\end{cases}$$

- **Execution in Path:**
  - `Verified` $\rightarrow$ Carries over immediately; zero hours added.
  - `Hidden` $\rightarrow$ Routed to **Step 1: PPT (Recognition of Prior Achievement)**, converting unwritten experience into official SKM certificates at lowest cost.
  - `Rusty` $\rightarrow$ Routed to **Step 2: Practical Refresher**, requiring only $50\%$ nominal course hours and $50\%$ fee.
  - `Missing` $\rightarrow$ Routed to **Step 3 (Skill Gaps)** or **Step 4 (Statutory Licences)**.

---

### 4.2 Four-Part Match Score Formulation (§5, §6)
All career pathways are scored on a scale of $0 \text{ to } 100$:

$$\text{MatchScore} = \text{clamp}\Big(\sum_{i=1}^4 P_i + \text{Bonus}_{\text{SDG}}, \; 0, \; 100\Big)$$

The component weights $W_i$ depend dynamically on the user's selected primary goal:
$$\sum_{i=1}^4 W_i = 100$$

| Component | Metric Definition | Quick Move Weight ($W$) | Higher Income Weight ($W$) |
|---|---|---|---|
| **$P_1$: Task Overlap** | $0.5 \cdot \text{BaseOverlap} + 0.5 \cdot \text{SkillMatchPct}$ | $40$ | $30$ |
| **$P_2$: Market Demand** | $\text{Demand}_{\text{Scenario}} \cdot \text{Mult}_{\text{Release}} \pm \text{Adj}_{\text{Window}} + \text{Prem}_{\text{Pay}}$ | $20$ | $35$ |
| **$P_3$: Your Interest** | User selection on path card: $\text{Yes} (1.0), \text{Maybe} (0.55), \text{No} (0.05)$ | $15$ | $15$ |
| **$P_4$: Ease of Move** | $0.6 \cdot \text{TimeFit} + 0.4 \cdot \text{MoneyFit}$ from Weekly Engine | $25$ | $20$ |
| **$\text{Bonus}_{\text{SDG}}$** | Bonus points from chosen SDG priority alignment | $+0 \text{ to } +8$ | $+0 \text{ to } +8$ |

#### Sub-component Calculations:
1. **$P_1$ Skill Match Percentage:**
   $$\text{SkillMatchPct} = \frac{\sum_{s \in \text{PathSkills}} \omega(s)}{|\text{PathSkills}|} \times 100$$
   where:
   $$\omega(s) = \begin{cases}
   1.0, & \text{if } s \text{ is Verified} \\
   0.75, & \text{if } s \text{ is Hidden} \\
   0.60, & \text{if } s \text{ is Rusty} \\
   0.0, & \text{if } s \text{ is Missing}
   \end{cases}$$
   *(Note: Statutory licence skills count only if held/verified: $1.0$ if verified, $0.0$ otherwise).*

2. **$P_2$ Pay Premium Factor (Higher Income Goal only):**
   $$\text{Prem}_{\text{Pay}} = \text{clamp}\Big(\frac{\text{MaxSalary} - 2400}{2200}, \; 0, \; 1\Big) \times 0.3 \cdot W_{\text{Demand}}$$

3. **$P_4$ Feasibility Equations:**
   $$\text{TimeFit} = \text{clamp}\Big(1 - \frac{\text{Months} - 2}{18}, \; 0, \; 1\Big)$$
   $$\text{MoneyFit} = \begin{cases}
   1.0, & \text{if } \text{NetCost} = 0 \\
   \text{clamp}\Big(\frac{\text{Budget} \times 24}{\text{NetCost}}, \; 0, \; 1\Big), & \text{otherwise}
   \end{cases}$$

---

### 4.3 Task Window Score Formulation (§5.7)
Evaluates whether a specific green task represents a widening market opportunity or an oversaturated entry bottleneck:

$$\text{WindowScore} = w_d \cdot \Delta\text{Demand} - w_s \cdot \Delta\text{Supply} + w_p \cdot \Delta\text{Premium}$$

- **Weights:** $w_d = 0.5, \; w_s = 0.3, \; w_p = 0.2$
- **Input Proxies:**
  - $\Delta\text{Demand}$: Keyword appearance rate shift across quarterly job postings.
  - $\Delta\text{Supply}$: Course cohort openings growth rate across accredited training registries.
  - $\Delta\text{Premium}$: Wage band movement in verified employment surveys.
- **Classification Boundaries:**
  $$\text{Label} = \begin{cases}
  \textbf{Long}, & \text{if } \text{WindowScore} \ge +0.20 \\
  \textbf{Narrowing}, & \text{if } 0.00 \le \text{WindowScore} < +0.20 \\
  \textbf{Closing}, & \text{if } \text{WindowScore} < 0.00
  \end{cases}$$
- **Confidence Rating Rules:**
  - $\ge 2$ independent data sources agree in trajectory $\rightarrow$ `High` or `Medium`.
  - Single source or conflicting directional signals $\rightarrow$ Automatically downgraded to `Low` (displayed in words, never color alone).

---

### 4.4 Do Nothing Baseline Formulation (§2, §4 #6)
Models the compounding automation vulnerability of remaining in the current role without upskilling:

$$\text{BaselineScore}(m) = \text{round}\Big(100 \cdot \big(1 - \overline{E} \cdot K_{\text{Pace}} \cdot (1 + \frac{m}{24} \cdot 0.35)\big) \cdot 0.55\Big)$$

where:
- $\overline{E}$ is the unweighted average AI exposure across the worker's current job tasks.
- $K_{\text{Pace}}$ is the scenario diffusion factor ($1.0$ for Accelerated, $0.7$ for Moderate).
- $m \in [0, 24]$ is the projection month.

---

## 5. Unified Weekly Simulation Engine (`runEngine`)

### 5.1 Simulation Loop
The simulation engine executes a discrete weekly timeline ($w = 1, 2, \dots, 104$) to guarantee consistency across Compare, Simulate, Timeline, and Calendar:

```python
# Formal pseudocode for runEngine(pathKey, constraints)
def runEngine(pathKey, hoursPerWeek, monthlyBudget, hrdLevy, missedWeeks):
    savings = 0.0
    weeklyDeposit = monthlyBudget / 4.3
    steps = assembleOrderedSteps(pathKey, hrdLevy)
    
    # 24-Month Licence Affordability Verification
    maxSavings24 = monthlyBudget * 24
    cumCost = 0
    licenceBlocked = False
    blockReason = ""
    for step in steps:
        cumCost += step.fee
        if step.isLicence and cumCost > maxSavings24:
            licenceBlocked = True
            blockReason = f"{step.short} requires cumulative RM{cumCost}, exceeding 24-mo budget RM{maxSavings24}"
            break
            
    weeklyLog = []
    currentWeek = missedWeeks
    needsEvidence = hasHiddenSkills(pathKey) and not state.pptDone
    evidenceHoursLogged = 0

    for w from 1 to 104:
        savings += weeklyDeposit
        availH = hoursPerWeek
        evidenceDone = False

        # Allocate 1-Hour Evidence Block if portfolio incomplete
        if needsEvidence and evidenceHoursLogged < 10:
            evidenceHoursLogged += 1
            availH -= 1
            evidenceDone = True

        # Find first eligible pending step: prerequisites met and affordable
        step = findNextExecutableStep(steps, currentWeek, savings)
        
        if step:
            if step.startWeek is None:
                step.startWeek = currentWeek
                savings -= step.fee
            
            spentHours = min(availH, step.remainingHours)
            step.remainingHours -= spentHours
            if step.remainingHours <= 0:
                step.done = True
                step.endWeek = currentWeek
            
            weeklyLog.append({ "week": currentWeek, "step": step.id, "hours": spentHours, "evidence": evidenceDone })
        else:
            weeklyLog.append({ "week": currentWeek, "step": None, "hours": 0, "evidence": evidenceDone })

        if allStepsDone(steps):
            break
        currentWeek += 1

    totalMonths = ceil(currentWeek / 4.3)
    return SimulationResult(steps, currentWeek, totalMonths, cumCost, licenceBlocked, blockReason, weeklyLog)
```

### 5.2 Deterministic Course Ordering (§6.3)
Courses are assembled into an unalterable 4-tier dependency sequence:
1. **Tier 1: Recognition of Prior Achievement (PPT):** Activated if worker possesses uncertified hidden skills. Costs RM0 if employer pays HRD Corp levy.
2. **Tier 2: Refresher Modules:** Activated for rusty skills. Course hours and fees are halved ($50\%$).
3. **Tier 3: Skill Gaps sorted by Window Score:** Remaining missing competencies ordered by descending `WindowScore`.
4. **Tier 4: Statutory Licences (Required by Law):** Regulatory certifications (`ST Electrical Competency`, `GCPV Systems Certificate`) positioned last, ensuring prerequisite technical competence is achieved prior to licensing exams.

### 5.3 Honest Budget Blockers & Subsidies (§5.5, §6.1)
If cumulative pathway costs exceed $24 \times \text{Budget}$:
- The pathway flags `licenceBlockedByBudget = true`.
- The path card displays a **Broken Bridge** indicator tag.
- The UI exposes the **Government Subsidy Registry**:
  1. *HRD Corp Employer Grant:* 100% allowable training grant from company levy pool.
  2. *PERKESO Employment Insurance System (EIS):* Up to RM4,000 training allowance for workers at automation risk.
  3. *PTPK Skills Development Fund Loan:* Low-interest financing for accredited TVET/ST qualifications.

---

## 6. User Interface Architecture & State Machine

### 6.1 State Schema (`S`)
The application is governed by a versioned, single-source reactive store:

```typescript
interface ApplicationState {
  v: 2;                           // State version lock
  person: string;                 // Active persona ID ("ahmad", "siti", "raj", etc.)
  name: string;
  job: string;                    // Current occupation key ("tech", "qc", "elec", etc.)
  state: string;                  // Malaysian state ("Penang", "Selangor", "Johor", etc.)
  years: number;
  hours: number;                  // Weekly learning commitment [1 - 15]
  budget: number;                 // Monthly training budget in MYR [0, 50, 100, 200, 300]
  goal: "income" | "quick";       // Primary optimization objective
  scenario: "moderate" | "accelerated"; // AI diffusion pace
  sdgPriority: "sdg4_8" | "sdg7"; // Active UN SDG optimization criterion
  dataRelease: "2025-01" | "2025-09" | "2026-03"; // Active Time Machine snapshot
  slots: string[];                // Selected free time blocks (e.g., ["Sat-Morning"])
  hrdLevy: boolean;               // True if employer contributes to HRD Corp
  certsHeld: string[];            // Array of whitelisted credentials held
  lastWork: Record<string, "recent" | ">1y">; // Recency audit for rusty check
  doing: Record<string, boolean>; // Skills actively performed
  interviewAnswers: string[];     // User shift verbatim answers (phases 1-5)
  interviewTasks: Array<{ n: string; quote: string; kept: boolean; phase: string }>;
  unclassifiedTasks: string[];    // Text unmapped to NOSS taxonomy
  interests: Record<string, "yes" | "maybe" | "no">;
  path: "stay" | "evolve" | "pivot" | null; // Committed pathway
  sel: "stay" | "evolve" | "pivot";        // Inspected pathway
  plan: string[];                 // Array of enrolled course IDs
  log: Record<string, number>;    // Completed hours by course ID
  certsUploaded: Record<string, boolean>;
  pptDone: boolean;               // True if PPT assessment completed
  missedWeeks: number;            // Rescheduling counter offset
  updateProposed: { releaseTag: string; reason: string } | null;
  planHistory: Array<{ path: string; date: string; plan: string[] }>;
}
```

### 6.2 Screen Routing & Navigation

| Route Hash | Screen Title | Primary User Question Answered | Functional Features |
|---|---|---|---|
| `#start` | Quick Start | Who am I and what can I give? | 3-step rapid onboarding: job picker, hours/budget slider, proof selector. |
| `#home` | Dashboard | What is my current trajectory? | Progress ring, active pathway, next weekly study session, market updates. |
| `#profile` | Profile & Constraints | What boundaries define my plan? | Personal credentials, employer HRD Corp status, weekly hours and budget controls. |
| `#skills` | Skills & Evidence | What do I actually know how to do? | **Shift Interview** (5 phases), **Three-Track Check** (Verified/Hidden/Rusty), **Skills Passport**. |
| `#impact` | AI & Workplace Shift | How will automation alter my shift? | Task-level exposure ratings, historical automation comparison, green role briefings. |
| `#paths` | Choose Your Path (Decide) | Where should I invest my effort? | **Control Bar** (The World vs Your Conditions), 3-Path Comparison, **Time Machine**, **24-Month Simulator**. |
| `#courses` | Recommended Courses (Act) | Which courses close my gaps? | 4-tier structured course grid, fee badges, HRD Corp claimable status, prerequisite flags. |
| `#plan` | My Action Plan (Act) | What do I execute this week? | **Milestone Timeline**, **Interactive Calendar** (.ics export), **Change Direction**, **Career Transition Card**. |

---

## 7. Deliverables & Guarantees

### 7.1 Career Transition Card (§10, §11)
A standardized, print-ready (`@media print`) and exportable credential card containing:
1. **Worker Profile:** Name, occupation, state, tenure, whitelisted certificates.
2. **Target Green Pathway:** Chosen role, match score, estimated months to completion.
3. **Pillar Breakdown:** Exact scores across Overlap, Demand, Interest, Ease, and SDG Bonus.
4. **Skills Audit:** Explicit lists of Verified and Hidden skills.
5. **Statutory Licence Gates:** Prerequisite licenses required by law.
6. **Risk Management:** Quantitative exit condition and designated fallback backup pathway.
7. **Fairness Declaration:** Explicit statement of algorithmic compliance.

### 7.2 Change Direction Without Progress Loss (§6.5)
When a worker toggles destination (e.g., from *Evolve* to *Pivot*):
- All completed modules, verified skills, and passport evidence carry over automatically.
- Previous pathway configurations are archived into `planHistory` rather than deleted.
- The weekly engine recomputes start and finish offsets from the current week milestone.

### 7.3 Algorithmic Fairness & Non-Discrimination Guarantee (§9)
To prevent proxy discrimination:
$$\frac{\partial \, \text{MatchScore}}{\partial \, \text{Age}} = 0, \quad \frac{\partial \, \text{MatchScore}}{\partial \, \text{Gender}} = 0, \quad \frac{\partial \, \text{MatchScore}}{\partial \, \text{Ethnicity}} = 0, \quad \frac{\partial \, \text{MatchScore}}{\partial \, \text{AvatarLook}} = 0$$

All matching calculations rely strictly on verified task competence, public labor demand statistics, statutory regulations, and user-selected time/budget constraints.

---

## 8. Verification & Test Suite

The system includes automated regression verification scripts validating core algorithmic requirements:

| Test Case | Inputs | Expected Output | Status |
|---|---|---|---|
| **Ahmad Skill Derivation** | Cert: `SKM Level 2 Electrical`, LastWork: `Safety Isolation: recent, Wiring: >1y`, Interview: `Fault diagnosis, Inverter` | Verified: `Safety isolation, Multimeter testing`; Rusty: `Wiring, Reading drawings`; Hidden: `Inverter fault diagnosis, Fault diagnosis` | ✅ Verified |
| **Ahmad Goal Reordering** | Persona: Ahmad, Goal: `income` | **Evolve** ranks #1 (`Match: 64`) due to higher pay ceiling and inverter demand | ✅ Verified |
| **Ahmad Goal Reordering** | Persona: Ahmad, Goal: `quick` | **Stay** ranks #1 (`Match: 66`) due to lower training hours and fewer licence hurdles | ✅ Verified |
| **Scenario Shift** | Scenario toggled to `accelerated` | Factory line tasks AI exposure escalates; Stay pathway demand drops, accelerating green transitions | ✅ Verified |
| **Budget Block Detection** | Ahmad on `4h/week`, `RM100/month` budget | Evolve total fees (RM3,300) exceed 24-mo savings limit (RM2,400); flags `licenceBlockedByBudget = true`, displays Broken Bridge and subsidy roster | ✅ Verified |
| **Time Machine Diff** | Release changed from `2025-01` to `2026-03` | Diff comparator computes demand shifts, narrows basic solar installation window, and updates rankings | ✅ Verified |
| **ICS Export** | Active Plan | Exports compliant `RFC 5545` VCALENDAR file (`bijakmatch-[path]-plan.ics`) | ✅ Verified |
