# BijakMatch: Redesign Solution Plan (website version)

Status: **plan for review. Nothing gets built until you approve it.**
Reference: the GreenPath mockup board you shared (soft green, illustrated worker in a hard hat, left step rail, six-step flow).

> **Revision 3 (22 Oct 2026): website UI only, real photos, more motion.**
> - **Scope:** desktop website UI only (designed at 1440px, works from 1280px up). Phone layouts are out of scope for now; anything in these files about phones is parked.
> - **Real photos, not AI images:** real places and real work (solar farms, factory lines, electrical panels, EV chargers, classrooms, Malaysian towns) are shown with **real photographs**. No AI-generated images anywhere. Ahmad and the other sample people stay as the **animated vector character**, because they are the user's own story and must move (walk, blink, react). Photo plan and every photo slot: `PAGE_BY_PAGE.md`, "Photo plan".
> - **More motion:** photos move too (slow zoom, scroll-linked parallax, short real video loops, hotspots that pulse on photos), on top of the character and scene motion already planned. The "Pause animations" switch and reduced-motion support still stop all of it.

> **Decisions confirmed (22 Oct 2026):**
> - **Name: BijakMatch** (replaces ReRole Green across the product; the proposal PDF still needs the same rename)
> - **Illustrations: animated vector art** (layered SVG, option A)
> - **Lead sample person: Ahmad**, 28, production technician with an unused electrical certificate. The other sample people stay as alternative accounts.
> - **Language: English first.** BM labels come in the polish phase.
> - **Course progress: automatic when the provider allows it** (xAPI, LTI or provider API, or a verified certificate link, in a later phase with a server). Otherwise the user records it. Every course is labelled "Synced automatically", "Certificate verified" or "You record this".
> - Real data vs Projection split, Story mode first in Simulate, and the core demo built before the simulator: adopted as recommended.

> **Revision 2 (after the design review).** These changes override anything below that conflicts. Full detail is in `PAGE_BY_PAGE.md`.
> 1. **Quick start:** job, then time and budget, then one proof, then a first career ranking in under 3 minutes. Other tabs become optional "Improve your match".
> 2. **Shorter landing story:** headline and Get started visible from the first frame; Get started fixed in the top bar; "Skip the story" link; only 3 pinned chapters (the tide, the road, the plan); "Show us your work" becomes a live demo instead of a pinned chapter; every animated beat is also written in words.
> 3. **Four kinds of time kept apart:** *Job history* (Page 3 first tab, 2000 to today: how the job already changed and which tasks were replaced, from dated records and official statistics, with the task streams clearly labelled as illustration), *AI forecast year* (Page 3, estimate), *Data release* (Time machine, real data), *Month of your plan* (Simulate and My plan, projection). Each has its own name, colour and marker; never two on one screen.
> 4. **One naming and data system:** paths are always **Stay / Evolve / Pivot** (plus Do nothing in comparisons); scores 0–100; one shared sample dataset; fonts Plus Jakarta Sans (headings) plus Atkinson Hyperlegible Next (body) only, nothing under 14px on desktop (12px on phones). Views of the same thing (Table or Picture, Story or Detail) use toggles, not tabs.
> 5. **Contrast and motion safety:** sun yellow and leaf green are fills only, never text; a **Pause animations** switch in the top bar for everyone; reduced-motion users get finished still frames.
> 6. **Page 3 has 3 tabs:** Task analysis (Table | Picture), When it happens, Green opportunities. Sources live in the right panel on every tab.
> 7. **Time and budget before careers:** hours a week and budget are required before Decide. Free time slots are optional until the first course is added.
> 8. **Course progress tracking:** the calendar has week and month views, a course tracker drawer, progress recorded by ticking sessions or updating percentage, and proof uploaded to finish a course.

---

## 1. What we are fixing

The current pages work, but you said they feel **ugly and static**. Looking at them next to your reference, the specific problems are:

| Problem now | What the reference does better | What we'll do |
|---|---|---|
| Grey-blue palette feels like a tool, not a future | Soft greens, warm light, nature | A sage-and-forest palette with sunlight yellow |
| No illustration. Flat drawn shapes only | A friendly illustrated worker and landscape on every screen | One consistent illustrated character plus a landscape that lives on every screen |
| Each page is a separate island with its own layout | One app frame: left step rail, top progress, right "why" panel | One shared app shell for all steps |
| Heavy black headlines, dense text | Calm headings, lots of air, short helper lines | Lighter type, shorter copy, more white space |
| Motion was added on top (pops, pings) | Feels alive through the scenery, not effects | Motion comes from the world: turbines turn, the landscape grows as you progress |

---

## 2. Alignment with the Domain 1 problem statement

Every must-have from the brief has a home, and judges can find each one on its own screen.

| Domain 1 must-have | Where it lives | How it shows on screen |
|---|---|---|
| 1. Skills profile intake | Step 1 Profile, Step 2 Skills and proof | Form, CV and certificate upload, work video, video interview, project upload, job scope game, then the "check what we found" list |
| 2. AI-trend signal layer (source and date shown) | Step 3 AI job impact | Task table with exposure and reasons, "When might it happen" timeline, data version tag and sources panel |
| 3. Future-role matching (score and gap) | Step 4 Choose path, Step 5 Career match | Ranked roles, match score broken into parts, skill gap bars |
| 4. Personalised reskilling pathway | Step 5 Courses, Step 6 Growth plan | Course list with time, cost and HRD Corp status; milestone timeline sized to the user's hours |
| 5. SDG mapping that changes choices | Step 4, Step 5 | Each role and course is tagged with SDGs. "What matters to you" can prioritise SDG 7 or SDG 8, and the ranking reorders live |
| 6. Handling uncertainty | Step 3 | Steady and Fast scenarios, labelled as estimates, with confidence per task |
| Good-to-have: progress, badges | Dashboard, Step 6 | Progress ring, milestones, a landscape that grows |
| Good-to-have: fairness | Step 1 | Avatar look is chosen by the user and never changes results. A note says so |
| Good-to-have: HR view | Later phase | Team skills heatmap (not in the first build) |
| Rules: sources, no invented data, human decides | Everywhere | "Why?" panel on every recommendation, SAMPLE tags, the user always picks |

---

## 3. Design direction

### 3.1 Concept: "The living landscape"

The one memorable thing is a **landscape panorama that grows as the user moves through the steps.** It is illustrated in the reference's soft style: hills, a village, wind turbines, solar panels, trees.

- At step 1 it is mostly bare hills and a factory.
- Each completed step adds something: solar panels on roofs, a turbine, young trees, an EV charger.
- On the dashboard it shows how far the user has come. Progress you can see, rather than only a percentage.
- It is alive at rest: turbines turn slowly, clouds drift, sunlight glints off a panel every few seconds.

Everything else stays calm, so the landscape and the character carry the personality.

### 3.2 The character

One illustrated TVET worker in a yellow hard hat and hi-vis vest, matching the reference style. The character:

- appears on the landing hero, in the step rail card, and as a guide in empty states and confirmations
- is built in layered SVG so it can breathe, blink, nod, point and cheer
- is chosen by the user at step 1 (with or without tudung, skin tone, hard hat colour), with a clear note that the look never affects any recommendation

### 3.3 Colour tokens

| Token | Hex | Use |
|---|---|---|
| Token | Hex | Use | Text use? |
|---|---|---|---|
| `--mist` | `#EEF3EC` | Page background, the sage mist from the reference | Background only |
| `--paper` | `#FBFCF8` | Panels and cards | Background only |
| `--forest` | `#1E5A3A` | Primary buttons, headings accent, active step | Yes, passes on mist and paper |
| `--leaf` | `#7BAE5E` | Progress fills, "good" states, illustration greens | **No.** Fill only, with ink or forest text |
| `--sun` | `#F2C230` | Hard hat, highlights, "recommended" | **No.** Fill only, with ink text |
| `--ink` | `#1F2A24` | Body text (green-tinted, not pure black) | Yes |
| `--clay` | `#E07A5F` | Higher automation risk (soft, not alarming red) | Large text only, always with a word |
| `--sky` | `#4F74C8` | Evolve path, links, info, AI forecast year control | Yes on paper, check on mist |

Risk is never shown in colour alone. It always has a word ("High", "Medium", "Low") as well.
A dark theme comes later, as a nightfall version of the landscape.

### 3.4 Type

- **Headings: Plus Jakarta Sans** (Google Fonts). Open, wide and very clear at large sizes, friendly without being quirky. Weights 600–700. (Changed from Bricolage Grotesque for clarity; see PAGE_BY_PAGE.md "Desktop typography".)
- **Body: Atkinson Hyperlegible.** Built for legibility, which matters for readers using a second language and a phone.
- Scale: 14 / 16 / 18 / 22 / 28 / 40 / 56 px. Line length under 70 characters.
- Sentence case everywhere. No all-caps labels.

### 3.5 Shape and depth

- Panels: 20px radius, a 1px hairline in sage, no heavy shadows. One soft shadow is kept only for floating elements (dropdowns, the "Why?" drawer).
- Buttons: forest green, fully rounded, with a white icon.
- Chips and tags: small rounded pills ("High demand", "HRD Corp claimable", "Accredited").

### 3.6 Checked against "generic AI design"

- Not the cream-and-terracotta look: the background is a cool sage, and the accent is sunlight yellow from the hard hat.
- To avoid the "identical rounded cards everywhere" kit, hierarchy uses size and space, and not every block becomes a card. The landscape and character break the grid.
- No eyebrow labels, no "→" on every button, no monospace data labels.

---

## 4. App shell (shared by every step)

Website version, designed at 1440px wide and comfortable from 1280px up. A phone layout follows after approval.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 🌱 BijakMatch     ●━━━━━━━━━○──────────────── 3 of 6          🔔  (A)  │  top bar: progress + profile
├─────────────┬────────────────────────────────────────────┬───────────────┤
│ 1 Profile ✓ │                                            │  Why this?    │
│ 2 Skills  ✓ │   Step title                               │  ───────────  │
│ 3 AI impact │   One helper line                          │  context,     │
│ 4 Path      │                                            │  sources,     │
│ 5 Match     │   Main content                             │  tips from    │
│ 6 Plan      │                                            │  the guide    │
│             │                                            │               │
│ ┌─────────┐ │                                            │               │
│ │character│ │                                            │               │
│ │ + quote │ │                                            │  [ Next ]     │
│ └─────────┘ │                                            │               │
├─────────────┴────────────────────────────────────────────┴───────────────┤
│  ~~~ living landscape strip (grows with progress, turbines turning) ~~~  │
└──────────────────────────────────────────────────────────────────────────┘
```

- **Left rail (220px):** six steps with numbered circles (a real sequence, so numbers are justified). Done steps show a leaf tick. At the bottom sits the character card with a short line ("Better skills. A greener tomorrow.").
- **Main column:** left-aligned content, at most 760px of reading width.
- **Right panel (300px):** the "Why this?" explanation, sources and dates, and the primary Next button. On narrower screens it folds into a drawer.
- **Landscape strip:** about 120px tall along the bottom of the shell. It is the same scene on every step and changes as steps are completed.

---

## 5. Screens in detail

### 5.0 Landing page

```
┌───────────────────────────────────────────────────────────────────────┐
│ 🌱 BijakMatch        How it works   For HR teams   BM | EN  [Sign in]│
├───────────────────────────────┬───────────────────────────────────────┤
│ A greener future starts       │                                       │
│ with the work you already do. │    [ big illustration: worker in      │
│                               │      hard hat with tablet, hills,     │
│ Show us your skills. See how  │      turbines turning, solar field ]  │
│ AI changes your job. Get a    │                                       │
│ plan you can afford.          │                                       │
│                               │                                       │
│ [ Get started ]  Try a sample │                                       │
├───────────────────────────────┴───────────────────────────────────────┤
│ (icon) Know your skills  (icon) See what's changing                   │
│ (icon) Find the right path  (icon) Build your plan                    │
├───────────────────────────────────────────────────────────────────────┤
│ "Show us your work" band: 5 ways to show skills (video, interview,    │
│  certificate, CV, past project) with a live sample playing            │
├───────────────────────────────────────────────────────────────────────┤
│ Try as a sample person: 6 portraits in the same illustrated style     │
└───────────────────────────────────────────────────────────────────────┘
```

**Motion:** on load, the landscape draws in layer by layer (sky, then hills, turbines, panels, then the worker), about 1.2s, played once. After that the turbines keep turning and the clouds drift.

### 5.1 Step 1: Tell us about yourself

```
Main:  Tell us about yourself
       Your answers help us give advice that fits your life.
       ┌ Personal ─────────────────────────────────────────┐
       │ Age [25–34 ▼]  Location [Johor ▼]                  │
       │ Current job [Electrical maintenance technician ▼]  │
       │ Years in this job [3–5 ▼]                          │
       │ Hours a week for learning  (2) (4) (8)             │
       │ Monthly budget  (RM0) (RM100) (RM300+)             │
       └────────────────────────────────────────────────────┘
       ┌ Choose your character ────────────────────────────┐
       │  ( ) ( ) ( ) ( )  skin    [tudung on/off] [hat ▼]  │
       │  "Your character's look never changes your results"│
       └────────────────────────────────────────────────────┘
Right: Why we ask: hours and budget shape your plan. Gender
       is optional and is never used for matching.
```

- The character in the rail updates live as the user picks a look.
- Gender is optional and never used in matching. The page says this plainly (fairness).

### 5.2 Step 2: Your skills and proof

Two parts on one screen, using tabs: **Add proof**, then **Check what we found**.

```
Add proof
┌──────────────────────┬──────────────────────┬──────────────────────┐
│ ▶ Record a work video │ 🎙 Video interview    │ 📄 Certificates       │
│   Most accurate       │   5 questions         │   SKM, ST, courses    │
├──────────────────────┼──────────────────────┼──────────────────────┤
│ 📁 A past project     │ 📝 CV (optional)      │ 🎴 Job scope game     │
│   photos, drawings    │                       │   10 cards, 2 minutes │
└──────────────────────┴──────────────────────┴──────────────────────┘
Certificates added:  ● Electrical installation (Level 2), 2021
                     ● Occupational safety and health, 2020   [+ Add]

Check what we found
  [ video player with moments marked ]   Skills list: Keep / Remove
                                          Verified · Hidden · Rusty
```

- Everything that worked before stays: the live sample extraction, the 10-card game with badges, evidence per skill, and "Add a video as proof".
- It gets restyled: the video frame becomes an illustrated scene in the new style, and the game cards use the character as the guide.

### 5.3 Step 3: AI job impact (the trend signal layer)

```
AI job impact
We checked the tasks in your job against research on what AI can do.
┌ Electrical maintenance technician ──────── Medium overall risk ─┐
│ Speed  (Steady)(Fast)        Year  2026 2028 2030   [▶ Play]    │
└──────────────────────────────────────────────────────────────────┘
[ Task analysis ] [ When might it happen ] [ Green opportunities ]

Task analysis
 Task                           AI exposure  Why
 Documentation and reporting    High ███▊    AI writes reports from logs
 Equipment fault diagnosis      Medium ██    AI suggests causes, you test
 On-site repair and safety      Low ▌        Hands-on, legal duty

When might it happen  (illustrated timeline: seedling → sapling → tree)
 0–2 years: early adoption (reporting, admin)
 3–5 years: growing adoption (diagnosis tools)
 5–10 years: wider impact (routine maintenance)

Emerging green opportunities
 Solar PV technician (high demand) · Energy efficiency specialist
 Green building maintenance · Smart grid technician

Right panel: Evidence and sources, data version, confidence
```

- This keeps the waterline chart from the current page 3 as an optional "See it as a picture" view, restyled as an illustrated shoreline.
- The illustrated side scene (worker beside a floating "Automation risk" and "New opportunities" card, as in your reference) reacts to the scenario: more clouds at Fast 2030, clear sky at Steady 2026.

### 5.4 Step 4: Choose your path

```
Choose your path
Compare the options and pick what fits your goals.
┌ Stay ────────────┐ ┌ Evolve ────────────┐ ┌ Pivot ─────────────┐
│ Stay and adapt   │ │ Evolve to a green  │ │ Pivot to a new     │
│ (illustration)   │ │ role (illus.)      │ │ field (illus.)     │
│ Keep your role,  │ │ Use your skills in │ │ Learn new skills   │
│ use AI tools     │ │ a nearby green job │ │ for a new field    │
│ Match 62         │ │ Match 68           │ │ Match 61           │
└──────────────────┘ └────────────────────┘ └────────────────────┘
Quick comparison: training needed, time, skills reused, outcome, SDGs

Right panel: What matters most to you right now?
  ( ) Stable income  ( ) Faster move  ( ) Long-term growth
  ( ) Lower cost     ( ) Stay near home  ( ) Clean energy (SDG 7)
```

- Picking priorities **reorders the three paths live**. Cards slide to their new places and a line explains why: "Upskill moved up because you chose long-term growth."
- The SDG priority (SDG 7 vs SDG 8) is one of the options. This is what makes the SDG link change choices instead of decorating them.

### 5.5 Step 5: Your career and course match

```
Recommended match                       High demand
┌──────────┐ Solar PV technician
│  illus.  │ Your troubleshooting, maintenance and safety skills
└──────────┘ carry over well.         Match 78 (breakdown on hover)

Your skill gap                        Why this role?
 Electrical fundamentals  ████████ ✓   ✓ Growing clean energy sector
 Solar PV installation    ███░░░░░ 25% ✓ Good job prospects in Malaysia
 PV system testing        ██░░░░░░ 15% ✓ Matches your existing skills
                                       ✓ SDG 7 and SDG 8

Recommended courses  [All] [TVET] [HRD Corp claimable] [Online]
 ┌photo┐ Solar PV installation and system testing  Accredited
 │     │ 12 months · RM 4,000 · Full time · Johor   [Select]
```

- Course cards show the provider, duration, cost, mode, HRD Corp status and next intake ("To be confirmed" if unknown), plus "Why this course".
- Compare up to three courses side by side.
- Course data is real-shaped and marked "sample, to be verified".

### 5.6 Step 6: Your personal growth plan

```
Become a solar PV technician
┌ illustration ┐  3 milestones   1 practical project   Target: 9 months
Your learning timeline                         Your progress  ◔ 25%
 01 Build your foundation      2 weeks  Learn   Next check-in
 02 Practise your skills       4 weeks  Practise  In 2 weeks
 03 Create a project           4 weeks  Build    [View full plan]
 04 Prepare for employment     2 weeks  Apply
[ Download my transition card ]  [ I want to change direction ]
```

- Milestones are sized from the user's hours a week. Changing hours re-flows the timeline with an animation.
- Completing a milestone ticks it, fills the progress ring, and **adds a new element to the landscape**.

### 5.7 Dashboard (returning user)

```
Hi, Ahmad. You're 25% through your plan.  ━━━━○──── 1 of 6 milestones
┌ living landscape, large ─────────────────────────────────────────┐
│ the scene you've grown so far, with the character standing in it │
└───────────────────────────────────────────────────────────────────┘
This week: 2 tasks · Next check-in · New data since your last visit
Bottom nav: My plan · Resources · Chat · Settings
```

---

## 6. Motion plan

The rule: **motion comes from the world, or answers what the user did.**

| Kind | Where | What moves |
|---|---|---|
| Ambient, always on (slow, subtle) | Landscape strip and illustrations | Turbines turn, clouds drift, panel glint every ~6s, character breathes and blinks |
| One entrance per screen | Each step | The landscape and character settle in; content appears in place in under 0.6s |
| Progress | Completing a step or milestone | A new element grows into the landscape (tree sprouts, panel slides on, turbine rises) |
| Data change | Scenario, year, priorities, hours | Bars and numbers animate to new values; ranked cards slide to new positions; a "what changed" line appears |
| Feedback | Buttons, chips, game | Gentle press and confirm; the character nods or cheers |
| Reduced motion | System setting | Everything stops and the scene shows its finished state |
| Pause for everyone | "Pause animations" switch in the top bar | Same as reduced motion, for anyone who wants it, remembered on that device |

---

## 7. Illustration plan (needs your decision)

Your reference uses soft, painterly illustrations. There are three ways to get them:

| Option | What it means | Pros | Cons |
|---|---|---|---|
| **A. Hand-built SVG (recommended)** | We draw the character and landscape as layered vector art in a soft, flat style | Everything can move (turbines, growth, blinking); light to load; one consistent style | Flatter than painted art, though still warm |
| B. Generated images | Use an image generator for the hero and scene art | Closest to your reference's painterly look | Can't animate parts, style may vary between images, heavier pages |
| C. Mix | SVG for anything that moves, generated art for 2–3 static hero images | Painterly where it matters, live where it matters | Two styles to keep consistent |

---

## 8. Technical approach

- **Website:** one single-page site with screens switched by `#step` links. Plain HTML, CSS and JavaScript, with no build step.
- **Files:**
  ```
  site/
    index.html          app shell and all screens
    styles.css          tokens, shell, components
    app-*.js            state, engine, views, routing (split by concern)
    engine.js           scoring, exposure, path ranking, plan sizing (pure functions)
    scene.js            living landscape and character (SVG and animation)
    data/*.js           sample personas, tasks, roles, courses, sources
  ```
- **State** is kept in the page, so a full journey works end to end in a demo. Each persona is a sample account.
- It is published as one shareable link for review and committed to the public GitHub repo for judges.
- Accessibility: keyboard focus on everything, colour plus words for risk, reduced motion respected, contrast checked.

---

## 9. Build phases (you review after each one)

| Phase | Delivers | You review |
|---|---|---|
| 0 | This plan | Approve or change the direction |
| 1 | Design system, app shell, the living landscape, the character, and the landing page | Look and feel |
| 2 | Step 1 Profile and Step 2 Skills and proof | Intake flow |
| 3 | Step 3 AI impact and Step 4 Choose path | Signal layer and matching (the preliminary-round core) |
| 4 | Step 5 Career and course match, Step 6 Growth plan, dashboard | Pathway and progress |
| 5 | Polish: phone layout, BM labels, dark "nightfall" theme, demo script | Final demo |

---

## 10. What stays from the current work

- The data and logic: the 12 tasks, exposure by scenario and year, path scoring with goal weights, the plan sized by hours and budget.
- The intake ideas: video, interview, certificate, project, game, and "check what we found".
- Honesty rules: SAMPLE tags, sources and dates, "estimates, not predictions", the user decides.

What goes: the grey-blue palette, the black Archivo headlines, separate page layouts, and decorative pings and pops.

---

## 11. Decisions needed from you

1. **Illustrations:** option A, B or C (section 7)? I recommend A.
2. **Name:** keep **BijakMatch**, or switch to **GreenPath** as in your reference?
3. **Main sample person:** keep **Ahmad**, or use a woman technician as in the reference (for example "Mei")? Both can exist as sample accounts; this decides who leads the demo.
4. **Language:** English first with BM labels later, or both from the start?
5. **Scope of phase 1:** start with the landing page and app shell as planned, or a different screen first?
