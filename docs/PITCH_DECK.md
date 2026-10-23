# BijakMatch Pitch Deck: Layout Plan

Based on the ReRole Green proposal (21 Oct 2026) and the working prototype. 8 slides, about 3 minutes.

**Visual style:** the editorial template already used in `docs/deck/`: white page, black + green, hard 2px black outlines, Archivo Black headlines in uppercase, Inter body, black label tags, one tilted banner per slide. Real prototype screenshots and real newspaper clippings only.

**Flow:** Who we are → What is happening → Who it hurts → What we built → Why it is different → How it works → Who it is for → Close.

---

## Slide 1: Title

**Layout**
- Top-left: logo + **BijakMatch** wordmark, with the tagline under it.
- Centre-left: large headline, two lines (black, then green).
- Right 40%: a real prototype screenshot (the Stay / Evolve / Pivot cards) in a black-outlined frame, tilted slightly.
- Bottom-left: "Prepared by" block.

**Copy**
- **BijakMatch**
- *Your trusted career advisor for TVET workers*
- Headline: **Same hands. New work.**
- Prepared by **KMJDIHATIKU**
- [Event name · date]

**Speaker notes (10 s):** "We are KMJDIHATIKU. BijakMatch helps Malaysia's TVET workers see what they can already do, and plan the move to a better job."

---

## Slide 2: Malaysia's TVET workforce is at a turning point

**Layout**
- Eyebrow tag: "WHY NOW · 02". Headline across the top.
- Left 55%: the **hero clipping**, large, black outline: `deck-images/talentcorp-620k-headline.png` (TalentCorp, reposting The Sun Daily, 14 Aug 2025). A big green **620,000** pinned to its corner.
- Right 45%: two smaller clippings stacked, each with a big number pinned to it.
- Credit line under each clipping (outlet and date).
- Bottom banner (tilted): "Change is coming. **Who guides them?**"

**Copy**
- Headline: **The jobs are changing. / The workers are not ready.**
- Hero clipping: *"AI and green economy to impact 620,000 jobs in Malaysia by 2030"*, The Sun Daily via TalentCorp, 14 Aug 2025 → **620,000** jobs
- Clipping 2, TVET enrolment (The Sun, Oct 2025) → **439,000** TVET learners
- Clipping 3, green jobs (Malay Mail, 27 Aug 2025) → **up to 300,000** green jobs by 2050

**Speaker notes (20 s):** AI and the green economy will impact 620,000 jobs in Malaysia by 2030. Over 430,000 people are in TVET, and the energy transition promises up to 300,000 green jobs. The workers in the middle have no guide.

**To prepare:** capture clippings 2 and 3 from their links (headline and masthead only, crop tight).

---

## Slide 3: Meet Encik Ahmad, and the three problems he faces

**Layout**
- Left 35%: Encik Ahmad's card. Avatar from the app at the top, then a small fact table.
- Right 65%: three numbered problem cards stacked, red number badges, one bold line plus one short line each.
- Thin strip under the problems: "**Three wrong roads**". Three crossed-out chips.
- Bottom banner: "What carries over? Is it crowded? **What do I do first?**"

**Copy**
- **Encik Ahmad** (illustrative profile)
- 28 · TVET graduate · E&E production technician, 5 years
- SKM electrical certificate + one HRD Corp short course
- 4 hours a week · limited budget · cannot quit to study
- Hears "AI will replace technicians"
- Problems:
  1. **His CV can't show what he can do.** "Technician, 5 years" hides the faults he fixes and the evidence he has.
  2. **AI news scares him. It doesn't guide him.** He needs to know which tasks are changing, not a threat.
  3. **"Go green" has no first step.** Is solar a lasting skill or a fad? Can he learn it in time? Which licence is he missing?
- Three wrong roads: ~~Another degree~~ · ~~A generic AI course~~ · ~~Do nothing~~

**Speaker notes (25 s):** Ahmad is our illustrative worker. Each problem is a missing translation: from real work to a CV, from AI headlines to task-level change, from "go green" to a concrete step.

**To decide:** the proposal says 28 years old with 5 years on the job, but the prototype's sample data uses 6 years. Pick one and use it everywhere.

---

## Slide 4: Our solution: three screens, three answers

**Layout**
- Eyebrow: "OUR SOLUTION · 04". Headline on top.
- Three tall columns joined by arrows: **Understand → Decide → Act**. Each column has a black tag with the screen name, the one question it answers in bold, a **real prototype screenshot**, and one output line.
- Bottom: the **Career Transition Card** as a thin full-width result strip.
- Banner: "Certify first. **Then fill the gap.**"

**Copy**
- Headline: **Three screens. / One clear next step.**
- **Understand:** *"What is changing in my job?"* → Verified, Hidden and Rusty skills. *Screenshot: skills panel*
- **Decide:** *"Stay, Evolve or Pivot?"* → explainable ranking for his state. *Screenshot: path cards*
- **Act:** *"What can I do this week?"* → courses in a weekly calendar. *Screenshot: calendar*
- Result strip: **Career Transition Card:** chosen path · first step within 4 weeks · cost and time · missing licences

**Speaker notes (30 s):** Ahmad uploads his certificate and answers a short interview about his shift. The system finds his hidden and rusty skills. He compares three paths and picks Evolve. His first step is PPT recognition of what he already knows, then a solar safety course, all placed into his 4 hours a week.

---

## Slide 5: Our key unique selling points (new)

**Layout**
- Eyebrow: "WHY US · 05". Headline on top.
- Four bold tiles in a 2×2 grid. Each has a big number, a 2–4 word title and **one** short line. No screenshots, so the slide stays quick to read.
- Thin bottom strip, "**What others don't do**": three small grey chips for existing tools, each with what it lacks.
- Banner: "Not another **CV tool.**"

**Copy**
- Headline: **What only / BijakMatch does.**
- **1. Evidence beyond the CV:** certificates + daily work log + interview.
- **2. Same data, same answer:** fixed rules on government open data. AI never decides.
- **3. Market-aware choices:** Stay, Evolve or Pivot, with crowding shown.
- **4. A plan that replans:** missed a week or changed your mind? One tap.
- What others don't do:
  - MyMAHIR: doesn't read a worker's own certificates
  - MGTC Green Jobs Portal: no match explanation, no crowding check
  - CV chatbots: can't read TVET skills, no sources

**Speaker notes (20 s):** Four points, one breath each. Then: existing platforms tell you which roles and courses exist. We tell one worker what to do this week, and why.

**Check before presenting:** the "what others don't do" lines come from the proposal's competitor table. Confirm each one against the current platform before you say it on stage.

---

## Slide 6: Solution architecture: AI trend analysis and the APIs behind it

**Layout**
- Eyebrow: "HOW IT WORKS · 06". Headline on top.
- Main area: a **left-to-right flow diagram** in five columns, joined by black arrows:
  1. **Inputs** (black boxes)
  2. **AI layer** (green boxes, API names)
  3. **Signal layer** (mint boxes, data sources with dates)
  4. **Rule engine** (black, thick outline: "decides")
  5. **Outputs** (white boxes)
- Under the diagram: a two-column strip, "**AI reads and explains**" (green) | "**Rules decide**" (black).
- Footer: a small API table.

**Diagram content**
- **Inputs:** certificate upload · voice or typed shift interview · daily work log
- **AI layer:**
  - Speech-to-text: **Whisper on RunPod GPU** (Bahasa Malaysia and English)
  - Shift interview: **Claude Opus 5.5 (Anthropic API)**, or **GLM-5.3 on RunPod**
  - Answer → NOSS task card: **task-card classifier, trained and served on RunPod**
  - Live skill check: **LiveKit Cloud voice agent**
  - Market report: **Claude + web search** (live, per state, every claim cites a source)
- **Signal layer (AI trend analysis):**
  - AI trend: **Anthropic Economic Index** (observed AI use per task) and **ILO GenAI Exposure Index** (upper bound) → *moderate* and *accelerated* scenarios
  - Labour market: **OpenDOSM**, **MyMAHIR**, **HRD Corp** course catalogue, **MGTC Green Jobs**
  - Stored as **dated, versioned snapshots** (2026-03 release). A new release re-ranks the paths and shows "why this changed".
- **Rule engine** (`shared/rules.v1.js`, v1.0.0):
  - Match score = task overlap + market demand + interest + ease of move (+ SDG bonus)
  - **Window Score** = demand change − supply change + pay premium, per task
  - Licence gates, budget and time limits, weekly scheduler
- **Outputs:** Stay / Evolve / Pivot cards · study calendar (.ics) · Career Transition Card

**Copy for the bottom strip**
- **AI reads and explains:** listens, asks questions, sorts answers into task cards, researches the local market.
- **Rules decide:** scores, ranking, course order and schedule. AI output is schema-checked and can only use task cards and courses from our whitelist.

**API table (small, footer-sized)**

| Service | Used for |
|---|---|
| Anthropic API (Claude Opus 5.5) | Interview turns, market report with web search, structured output |
| RunPod serverless (GPU) | Whisper speech-to-text, task-card classifier, GLM-5.3 interview |
| LiveKit Cloud | Real-time voice skill check |
| Certificate check (our own rules) | SVM / SKM whitelist match, no AI |

**Speaker notes (35 s):** Workers talk; AI listens and asks. Every answer must land on a real NOSS task card, or it is marked "unclassified". The AI trend comes from two published indexes, kept as dated snapshots, so the scores are reproducible. AI never sets a score. The rule engine does, and its weights are public.

**Be careful on stage:** do not say "we don't use generative AI". We do, for listening, asking and explaining. The honest claim is "**AI never makes the decision**".

---

## Slide 7: Who it is for

**Layout**
- Eyebrow: "WHO CAN USE · 07". Headline on top.
- Two large panels side by side, each with a coloured tag on the top edge, an icon, three short "what they get" lines and one prototype screenshot.
- Small "Next" ribbon on the company panel for features that are still on the roadmap.
- Bottom banner: "One clear picture of **where the jobs are going**."

**Copy**
- Headline: **Built for the worker. / Useful to the industry.**
- **Panel A: TVET workers** (green tag)
  - See the skills they already have, including hidden ones
  - Compare Stay, Evolve and Pivot for their state
  - Get a plan that fits 4 hours a week
  - *Screenshot: path cards*
- **Panel B: TVET companies and training providers** (black tag)
  - Market direction: which roles are growing, which are crowded (Window Score, applicants per role)
  - Which skills to train next, by state
  - **Next:** team skill-gap heatmap (employer view, on the roadmap)
  - *Screenshot: market crowding badges*

**Speaker notes (20 s):** Workers get a personal plan. Companies and training providers get a clear picture of the market direction, so they train for jobs that will exist, not crowded ones.

**Honest label:** the employer view is listed as a future extension in the proposal, so it stays marked "Next".

---

## Slide 8: Close

**Layout**
- Black slide, white and green type.
- Left: tagline and the Career Transition Card screenshot.
- Right: three next steps and contact.

**Copy**
- **We don't predict replacement. We design the reshaping.**
- First certify what he knows. Then fill the gap. Then invest where the window is longest.
- Next: [pilot with a TVET provider] · [more green slices: water, waste] · [Bahasa Malaysia and Chinese UI]
- KMJDIHATIKU · [contact] · [demo link / QR]

**Speaker notes (15 s):** End with the proposal's closing line, then the ask.

---

## Assets checklist

| Asset | Status |
|---|---|
| TalentCorp / The Sun Daily 620,000 clipping | Have (`deck-images/talentcorp-620k-headline.png`) |
| TVET enrolment and green-jobs clippings | To capture |
| Prototype screenshots: cards, skills, data, calendar, replan | Have (`deck-images/proto-*.png`) |
| Career Transition Card screenshot | To capture from the app (`#plan`, card tab) |
| Ahmad avatar | Have (`deck-images/ahmad-avatar.svg`) |
| Architecture diagram | To build as SVG inside the slide |
| Team logo for KMJDIHATIKU | Needed from you |

## Facts to keep straight

- The 620,000 figure is described as "impact by 2030" in the hero clipping and as "highly impacted, in 10 sectors" in the TalentCorp study. Say "impacted", not "lost".
- Proposal stack (React + FastAPI) differs from the prototype (plain JavaScript front end + Node server). The deck describes the prototype.
- "About 20% of at-risk jobs are green" and "22 emerging green roles" are in the proposal but unconfirmed. Leave them out unless you have the source.
- Market crowding is shown on the cards but not yet part of the score.
- Encik Ahmad is illustrative. The proposal marks all of his data as synthetic.
