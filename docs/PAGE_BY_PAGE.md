# BijakMatch: Page by Page, Tab by Tab

Companion to `SOLUTION.md` (visual direction) and `SOLUTION_PLAN.md` (alignment and build order).
This file assumes the recommended answers to the open decisions (animated SVG illustrations, Real data vs Projection split, story mode first). If you choose differently, only the affected tabs change.

Each tab lists:
- **Answers:** the one question the tab answers for the user
- **Layout:** a desktop wireframe (website version, 1440px)
- **Content:** what is on screen
- **Actions:** what the user can do
- **Live:** what moves and why
- **States:** empty, blocked or error cases
- **Proves:** the proposal section (§) or Domain 1 must-have (M1–M6) it covers

---

## 0. Site map

```
Landing
│
├── QUICK START (first visit, under 3 minutes to a first career ranking)
│
├── UNDERSTAND
│   ├── Page 1  Profile ............ Tabs: About you · Time and budget · Your character
│   ├── Page 2  Skills and proof ... Tabs: Add proof · Job scope game · Check what we found
│   └── Page 3  AI job impact ...... Tabs: Job history · Task analysis (Table | Picture) · When it happens · Green opportunities
│
├── DECIDE
│   └── Page 4  Choose your path ... Tabs: Compare · Time machine · Simulate
│         └── Three doors ......... (opens from a character) Scene: workplace in 2028, skills highlight first
│               List view ......... Tabs: Skills needed · Jobs in Malaysia · Competition · Career growth
│
├── ACT
│   ├── Page 5  Match and courses .. Tabs: Your match · Skill gap · Recommended courses · Compare courses
│   └── Page 6  My plan ............ Tabs: Timeline · Calendar and course progress · Change direction · Transition card
│
├── Dashboard (returning user) ..... Tabs: Overview · My landscape · Updates
└── HR team view (later phase) ..... Tabs: Team gaps · Team plan
```

### Shared on every page (app shell)

| Element | Where | Behaviour |
|---|---|---|
| Top bar | Top, 56px | Logo, stage progress (Understand ● Decide ○ Act ○), notifications, account switcher (sample people) |
| Step rail | Left, 220px | Three stages with numbered sub-steps; done steps show a leaf tick; character card at the bottom |
| Tab bar | Top of the content, 48px | Underline style; arrow keys move between tabs; the active tab is remembered per page |
| "Why this?" panel | Right, 300px | Explains the current tab in plain words, with sources and dates, plus the main button ("Next") |
| Living landscape | Bottom strip, 120px | Grows a new element each time a step is completed; turbines and clouds always move gently |
| Why drawer | Slides in from the right, 420px | Opens from any number, chip or event; shows cause, source, date, confidence, and a Real data or Projection tag |
| SAMPLE tag | Bottom of the rail | Reminds that people and numbers are sample data |
| Sources | Bottom of the "Why this?" panel, on every page | Source name, link, date checked, version and confidence for whatever the tab shows. Always visible, never behind a tab |
| Pause animations | Top bar, next to the language switch | One switch that stops every loop and scroll animation for anyone (not only people with the system reduced-motion setting). Remembered on that device |
| Modes vs tabs | Everywhere | Tabs are only for sections of a page. Different views of the same thing (Table or Picture, Story or Detail) use a two-option toggle switch, never a tab look |

### Scope: website UI only

Everything in this file is designed for the **desktop website** (1440px design width, works from 1280px). Phone notes elsewhere in this file are parked for a later phase.

### Photo plan: real photos for the real world, the character for your story

**Rule:** real places, real equipment and real work are shown as **real photographs** (or short real video clips). **No AI-generated images, anywhere.** Ahmad and the sample people stay as the animated vector character, layered over or beside photos, so the user's own story can still move and react.

**Where photos come from (in order of preference):**
1. **Your team's own photos**, taken at a TVET college, a factory line or a solar site, with permission from anyone recognisable. Best for authenticity: real Malaysian places.
2. **Free stock with a clear licence:** Unsplash, Pexels (photos and video) or Wikimedia Commons (check each file's licence and give credit where required). Search terms are listed per slot below.
3. **Partner photos** (course providers, SEDA, TVET institutions), only with written permission.

**Rules for every photo:**
- Licence and credit are recorded in a `photo-credits` list and shown in the footer ("Photos: …").
- No real person's face is presented as a sample user. Real photos show **workplaces and work**; sample users are always the drawn character. Recognisable people in stock photos appear only as "people at work", never with a name or quote attached.
- **One colour grade for all photos:** a soft green-and-warm tone, slightly lifted shadows, so stock photos from different sources look like one set and match the palette.
- Photos never sit as flat black boxes: each has a caption, overlay content, or a soft gradient into the page colour.
- Every photo has alt text describing what it shows ("Technician checking an inverter on a rooftop solar installation").
- File size: under 250 KB each (WebP, 2× for the hero only); video loops under 2 MB, muted, 6–10 seconds.

**Photo slots:**

| Where | Photo or video | Search terms if using stock | Motion |
|---|---|---|---|
| Landing hero, background | Wide shot of a solar farm or rooftop solar on a Malaysian town at morning light (Ahmad character in front) | "solar farm Malaysia", "rooftop solar panels Asia", "solar technician" | Slow zoom (8% over 20s), scroll-linked parallax; the character and turbines move on top |
| Landing, "Show us your work" | Close-up of hands at an electrical panel; a certificate on a desk; a technician filming with a phone | "electrician hands panel", "industrial maintenance technician", "TVET workshop" | Real 6s video loop behind the sample player |
| Landing, the tide chapter | Factory production line (the "today" of the job) | "electronics factory production line", "SMT line Malaysia" | Scroll scrubs from the factory photo to the water illustration |
| Landing, the road chapter | Three photos: smart factory, solar farm, EV charging station | "automation technician", "solar farm maintenance", "EV charging station Malaysia" | Each fades in as its road appears; slight parallax |
| Landing, the plan chapter | Training classroom or workshop | "vocational training electrical", "technical training classroom" | Photo cards flip in at each milestone flag |
| 3.0 Job history, "then and now" | **Then:** an older factory or paper logbook photo. **Now:** a modern control screen or tablet on a line | "factory logbook", "industrial HMI touchscreen", Wikimedia historical factory photos | A drag handle slides between then and now; auto-slides once on entry |
| 3.3 Green opportunities | One photo per role card (solar PV technician, energy efficiency, green building, smart grid, EV charger, battery storage) | Role names plus "technician" | Gentle zoom on hover; the card lifts |
| Three doors | **Each door's scene is a real workplace photo:** smart factory floor (Stay), solar farm with O&M cabin (Evolve), EV charging hub (Pivot). Objects (hiring board, queue, staircase, toolbox) become **hotspots on the photo** | As above | The camera flies through the door into the photo (scale and blur); hotspots pulse; the character walks in on top of the photo |
| 5.1 Your match | Photo of the target role at work | "solar PV technician at work" | Slow zoom |
| 5.3 Recommended courses | Photo per course (the provider's own, with permission, or a stock photo of the topic) | Course topic plus "training" | Card lifts on hover; the photo zooms slightly |
| 6.1 Timeline | Photo header of the target workplace | As 5.1 | Parallax on scroll |
| Dashboard | Wide photo header that brightens as progress grows (a dull morning at 0%, full sun at 100%) | Solar farm wide shot | Brightness and warmth follow progress; slow zoom |

**What stays drawn (vector):** Ahmad and the sample people; the toolbox tools in the skills highlight; the waterline (tide) chart; icons; the small weather and badge details. These need to animate part by part, which photos can't do.

**Motion added for photos:**

| Technique | Where | Detail |
|---|---|---|
| Slow zoom ("Ken Burns") | Hero, role photos, dashboard | 6–10% over 15–25s, never faster |
| Scroll parallax | Landing chapters, timeline header | Photo moves at 70% of scroll speed; content at 100% |
| Scroll-scrubbed transition | Tide chapter, Job history | The photo dissolves into the illustration, or then into now, as the user scrolls or drags |
| Real video loops | "Show us your work", door scenes | Muted, 6–10s, paused when off-screen |
| Fly-through | Three doors | The door scales up and blurs, then the photo scene sharpens in (600ms) |
| Hotspot pulse | Door photos | Soft ring every 3s on objects not yet opened; stops once opened |
| Hover lift | Course and role cards | 4px lift and a 3% photo zoom, 200ms |

### Desktop typography: clear and easy to read

Users read in a second language, often tired after a shift, so every word must be clear at a glance.

**Fonts (two only):**

| Role | Font | Why |
|---|---|---|
| Headings, big numbers | **Plus Jakarta Sans** (SemiBold 600, Bold 700) | Open, wide letters, very clear at large sizes, friendly without being quirky. Replaces Bricolage Grotesque, whose tight shapes read less clearly in long headings |
| Body, labels, buttons, tables | **Atkinson Hyperlegible Next** (Regular 400, Bold 700) | Designed for maximum legibility: letters that are easy to confuse (l, I, 1, 0, O) look clearly different |

Fallbacks: Segoe UI, system-ui, sans-serif. Both fonts come from Google Fonts. Numbers use tabular figures so columns line up.

**Desktop type scale (1440px design width):**

| Use | Size / line height | Weight |
|---|---|---|
| Page title (one per page) | 40 / 48 px | 700 |
| Section heading | 28 / 36 px | 700 |
| Card or panel heading | 22 / 30 px | 600 |
| Big number (match score, hours, %) | 48 / 52 px | 700 |
| Body text | **18 / 28 px** | 400 |
| Secondary text, table cells | 16 / 24 px | 400 |
| Labels, chips, captions | **14 / 20 px minimum** | 700 for labels, 400 for captions |
| Buttons | 17 / 24 px | 700 |

**Readability rules:**
- **Nothing below 14px on desktop** (12px only on phones, and only for captions).
- **Text colours have strong contrast:** body `--ink` on paper is at least 12:1, secondary text at least 7:1, and nothing below 4.5:1. No pale grey text.
- Line length 55–75 characters for paragraphs. Long text never runs the full width of a 1440px screen.
- Sentence case, no all-caps, no italics for whole sentences, no thin (300) weights.
- Links are underlined; buttons look like buttons (filled or outlined, never text-only for the main action).
- Ahmad's quotes and "In words" summaries use body size, never small print.

### Desktop layout: no empty space, no black blocks

**The grid:**
- 12 columns, 24px gutters, content up to 1360px wide inside the 1440px frame.
- The app shell always fills the width: left rail (220px), main area (fluid), right "Why this?" panel (300px).
- On screens wider than 1600px, the main area grows to 1520px and the landscape strip stretches edge to edge, so wide monitors don't show empty side bands.

**Rules against empty space:**

| Rule | How |
|---|---|
| No lone narrow column | Main content uses 2 or 3 columns on desktop (for example form plus live preview, list plus detail, chart plus explanation). A single centred column is only for the Quick start questions, and even there the character and preview fill the side |
| Every side has a job | Where a form is short, the free side shows a **live preview** of what the input does (for example the calendar thumbnail in tab 1.2, the character in tab 1.3) instead of blank paper |
| Panels fill their row | Cards in a row share the same height; a row never ends with one lonely card (pick column counts that the items fill: 2, 3 or 4) |
| Empty states are designed | When there's no data yet, the space shows an illustration of Ahmad plus one sentence and one button, never a blank box |
| Short pages are filled | If a page's content ends above the fold, the living landscape strip and the next-step card fill the rest |
| Vertical rhythm | Section spacing 48px, panel padding 24–32px, card gaps 16–24px. One spacing system, so gaps never look like missing content |

**No black blocks:**
- No large dark or black panels on the light theme. The darkest surface is `--forest` (green), used only for small elements: main buttons, the active step, and the selected tab underline.
- Video and scene frames use a deep green-grey night scene instead of flat black, and always carry a caption or illustration inside.
- Dark mode, when it comes, is a "nightfall" landscape theme with green-tinted surfaces, never pure black.

**Column map for each page (desktop):**

| Page or tab | Left part | Middle | Right part |
|---|---|---|---|
| Landing hero | Headline and buttons (5 col) | Scene spans 7 col to the edge | — |
| 1.1 About you | Form (6 col) | | Character and "why we ask" (6 col) |
| 1.2 Time and budget | Form (7 col) | | Live preview: calendar thumbnail, cost and time preview (5 col) |
| 1.3 Your character | Big character preview (6 col) | | Options (6 col) |
| 2.1 Add proof | Method cards 3 × 2 (8 col) | | "Added so far" list (4 col) |
| 2.2 Job scope game | Card deck and guide (7 col) | | Job scope map and badges (5 col) |
| 2.3 Check what we found | Player (7 col) | | Skills list (5 col); save bar full width |
| 3.0 Job history | Then and now (12 col), task streams (8 col) | | Milestones (4 col) |
| 3.1 Task analysis | Week bar and future Ahmad (12 col), table (12 col) | | |
| 3.2 When it happens | Three stage columns (4 + 4 + 4) | | |
| 3.3 Green opportunities | Role cards 4 × 2 (12 col) | | |
| 4.1 Compare | Three path cards (4 + 4 + 4) | Do nothing and comparison table below | |
| 4.2 Time machine | Data release line (12 col); ranking (6 col) | | What changed (6 col) |
| 4.3 Simulate | Lanes (3 col) | Timeline (6 col) | Inspector (3 col) |
| Three doors scene | Scene (8 col) | | Skills panel (4 col) |
| 5.1 Your match | Role and score breakdown (7 col) | | Why this role (5 col) |
| 5.2 Skill gap | Gap table (8 col) | | Fixed order explainer (4 col) |
| 5.3 Recommended courses | Course list (8 col) | | Why this course (4 col) |
| 6.1 Timeline | Milestones (8 col) | | Progress ring and next check-in (4 col) |
| 6.2 Calendar | Calendar (8 col) | | Course progress list (4 col) |
| Dashboard | Greeting, today and courses (7 col) | | Landscape preview and updates (5 col) |

(The right "Why this?" panel sits outside these 12 columns and is always present.)

The fastest route from landing to a first career ranking, under 3 minutes. Everything else becomes optional "Improve your match".

```
Landing [Get started]
  → Q1 Your job            (1 dropdown)                         ~20 s
  → Q2 Time and budget     (hours slider, budget chips, goal)   ~30 s
  → Q3 One proof           (pick one: 1-min work video, certificate photo,
                            or the 10-card job scope game)       ~90 s
  → First ranking          Page 4 Compare, with a banner:
                           "Based on 1 proof. Add more to sharpen your match."
```

- Q1, Q2 and Q3 are the same components as tabs 1.1, 1.2 and 2.1 (or 2.2), shown one per screen with a big Next button.
- After the first ranking, the step rail shows the skipped tabs as **"Improve your match"** items, each with how much it typically helps (for example "A work video usually adds 2–3 hidden skills").
- Returning users skip Quick start and land on the Dashboard.
- **Proves:** Domain 1 success criteria ("profile to ranked future roles and an actionable pathway in minutes").

### Four kinds of time (never mixed up)

The product has four different time controls. Each has its own name, colour and marker, and **no screen shows two of them at once.** Read together they tell one story: how the job changed (past), which data we use (now), where AI may take it (future), and what Ahmad does about it (his plan).

| Name on screen | What it means | Where | Look | Tag |
|---|---|---|---|---|
| **Job history** (2000 to today) | How this job's tasks and tools have already changed, and which old tasks were replaced | Page 3, Job history tab | Stone-grey slider with pin markers for dated milestones | **History** (dated records) |
| **AI forecast year** (2026, 2028, 2030) | How far AI may have spread by that year, under the chosen speed | Page 3 header | Sky-blue segmented control with a calendar-year icon | Estimate |
| **Data release** (2025-01, 2025-09, 2026-03) | Which real published dataset the numbers come from | Page 4, Time machine tab | Diamond markers on a line, each with source and date | **Real data** |
| **Month of your plan** (M0 to M24) | What happens to you month by month on a path | Page 4, Simulate tab; Page 6 | Forest-green line with the walking avatar | **Projection** |

### Naming and sample-data rules

- **Path names:** always the proposal's **Stay / Evolve / Pivot**, with one-line subtitles: Stay and adapt, Evolve to a green role, Pivot to a new field. A fourth lane, **Do nothing**, appears only in comparisons.
- **Scores:** always 0–100.
- **One sample dataset** (people, tasks, roles, courses, data releases) feeds every page, including the landing story. The same person sees the same numbers everywhere.
- **Fonts:** Plus Jakarta Sans for headings, Atkinson Hyperlegible Next for everything else (see "Desktop typography"). Nothing smaller than 14px on desktop or 12px on phones, no monospace, no all-caps labels.

---

## LANDING PAGE: a scroll story

Not a tabbed page. The landing page **tells the whole product as one moving story**. One illustrated world sits behind the page, and as the visitor scrolls, the camera moves through it while the character lives through the four steps: show your skills, see AI change your work, choose a path, grow your plan. By the end of the page the grey factory town has become a green one.

The motion explains the product, so it is never decoration. Every chapter still has a readable resting frame: text is never hidden while waiting for the scroll (see "Motion rules" below).

### Overview

| # | Chapter | Scroll length | What the visitor learns |
|---|---|---|---|
| 0 | Hero (on load) | 1 screen | Who this is for and what it does |
| 1 | Show us your work, live | 1 screen (not pinned) | Your real work becomes skills: five ways to give proof, playing for real |
| 2 | Watch the tide | pinned, about 1.2 screens | AI changes tasks, not whole people |
| 3 | Pick your road | pinned, about 1.2 screens | Three futures, compared fairly |
| 4 | Grow your plan | pinned, about 1.2 screens | A plan in your time and budget, and progress you can see |
| 5 | Try as someone else | 1 screen | Sample people to explore with |
| 6 | Final call | 1 screen | Start now |

Only **three** chapters are pinned (2–4), about 3.6 screens of scroll-driven story in total.

**Ways out of the story at any time:**
- **Get started** stays fixed in the top bar on every scroll position.
- A **"Skip the story"** link under the hero jumps to chapter 5.
- A thin progress line on the right edge has three dots (chapters 2–4); clicking one jumps to it.
- **Pause animations** in the top bar stops every loop and turns pinned chapters into normal scrolling with finished pictures.

---

### Chapter 0: Hero (plays on load, about 2.4 seconds, once)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 🌱 BijakMatch        How it works   For HR teams   BM | EN   [Sign in] │
│                                                                          │
│ A greener future starts         ☁        ☁            ✈ birds           │
│ with the work you              ⛰  turbines turn   ⛰                      │
│ already do.                  factory  🏭 smoke   [worker walks in,       │
│                                                   stops, waves]         │
│ Show us your skills. See how AI changes your job.                        │
│ Get a plan you can afford.                                               │
│ [ Get started ]   Try a sample person                                    │
│                                                     ⌄ scroll to see how  │
└──────────────────────────────────────────────────────────────────────────┘
```

**Load sequence (timeline).** The headline, the explanation line and **Get started** are on screen and readable from the very first frame. The scene builds around them, so the promise is read before the motion pulls the eye.

| Time | What happens |
|---|---|
| 0.0s | Headline, line and buttons already in place; sky fades from dawn grey to soft morning light |
| 0.2s | Far hills rise into place, then near hills, about 120ms apart |
| 0.6s | Factory and village slide up; the factory chimney starts a slow smoke loop |
| 0.9s | Two wind turbines on the far hill start turning, slowly speeding up to their idle speed |
| 1.1s | The worker character walks in from the right side of the scene (6 steps) and stops |
| 1.7s | The character looks at the visitor and waves; **Get started** gets one soft glow |
| 2.2s | Hand-off to idle loops |

Under the buttons: **"Skip the story"** (jumps to chapter 5).

**Idle loops (always running, slow):**
- clouds drift
- turbines turn
- a small flock of birds crosses every ~12s
- factory smoke curls
- the character breathes and blinks, and checks a tablet every ~8s

**Mouse parallax:** moving the mouse shifts the background layers by up to 12px (far hills least, character most), so the scene feels deep. It is turned off on touch devices.

**Scroll cue:** "Scroll to see how", with a small bouncing chevron. It disappears after the first scroll.

---

### Chapter 1: Show us your work, live (not pinned)

**Story:** the character's everyday work turns into a skills profile. This merges the old pinned "Show us your work" chapter into the live demo, so the visitor sees the real thing instead of a story about it.

```
 Your hands know more than your CV.
 [ Work video ][ Interview ][ Certificate ][ Project ][ CV ]   ← auto-advance, ⏸ pause
 ┌───────────────────────────────┬──────────────────────────────────────┐
 │ What it is, how long it takes │  Sample playing: frame / document     │
 │ "Most accurate" tag on video  │  + scan; skills light up one by one   │
 │ [ Try this way ]              │  ┌ Skills profile ─────────────────┐  │
 │                               │  │ Verified ● ● ●  Hidden ◐ ◐       │  │
 │                               │  │ Rusty ○                          │  │
 │                               │  └──────────────────────────────────┘  │
 └───────────────────────────────┴──────────────────────────────────────┘
```

- **Live:**
  - Each skill found in the sample **flies into the skills profile card** and lands in its group (Verified, Hidden, Rusty), with the count ticking up.
  - Tabs auto-advance every ~8s with a thin progress line under the active tab. A visible **pause** button stops it, and clicking any tab stops it too.
- **Proves:** M1 skills profile intake, §5.1 three-track profile.

---

### Chapter 2: Watch the tide (pinned)

**Story:** AI comes in like a tide. Some tasks go under, most stay above water.

| Scroll progress | What happens |
|---|---|
| 0–10% | **Rewind:** a quick look back. A worker from 2005 writes in a paper logbook; the page turns into a touchscreen (2011), then a tablet (today), as small year pins flick past. Caption: "Your job has changed before." |
| 10–20% | The camera lowers to the shoreline. The character's tasks stand as small islands with labels: logging, start-up checks, fault diagnosis, safety isolation, cable work |
| 20–70% | **Scrolling raises the tide.** The year label counts from 2026 to 2030. "Logging" sinks first, then "start-up checks"; "fault diagnosis" ends up in the sand; safety isolation and cable work stay on dry land |
| 70–90% | A label appears on each island: "Done by AI", "AI helps, you lead", "Stays with you" |
| 90–100% | Text: "AI changes tasks, not whole people. We show you which ones." Small print: "Estimates from public research data. Sample numbers." |

**The same story in words** (always on the page beside the scene, so it reads without the animation and works with screen readers): "By 2030 at a fast pace: manual logging, likely done by AI. Start-up checks, likely done by AI. Fault diagnosis, AI helps and you lead. Safety isolation and cable work stay with you."

The waves ripple on their own throughout, and scrolling back lowers the tide again.

---

### Chapter 3: Pick your road (pinned)

**Story:** the road in front of the character splits into three.

```
                    ┌ Stay and adapt ── ☀ ── future you with a tablet
 character ── road ─┼ Evolve to green ── ☀ ── future you on a solar roof   ★ best fit
                    └ Pivot to new field ─ ⛅ ── future you at an EV charger
```

| Scroll progress | What happens |
|---|---|
| 0–25% | The road ahead forks into three, drawn as a line that grows |
| 25–60% | Three future versions of the character walk out along each road, each in their future outfit with tools and badges; the weather above each road shows its risk |
| 60–85% | Match scores count up on signposts (62, 68, 61); a ★ settles on the best fit |
| 85–100% | A toggle in the scene flips between "Quick move" and "Higher income", and **the signposts reorder** with a line: "Your goal changes the ranking. You choose." |

**In words:** "Stay: 62. Evolve: 68, best fit for higher income. Pivot: 61. Choose quick move instead and Stay comes first." The numbers are the same sample numbers as the Compare tab.

---

### Chapter 4: Grow your plan (pinned)

**Story:** the chosen road becomes a path of milestones, and the town turns green.

| Scroll progress | What happens |
|---|---|
| 0–20% | The road becomes a path with four flags: Certify what you know, Refresh, Learn new, Get licensed |
| 20–70% | The character walks the path. At each flag: a calendar card flips up ("Sat 9am, PV safety, unit 3"), a course progress bar fills, and **something grows in the landscape**: solar panels slide onto roofs, a new turbine rises, trees sprout, an EV charger lights up |
| 70–90% | A progress ring fills to 100%; the factory smoke clears and the sky turns bright |
| 90–100% | Text: "A plan that fits 4 hours a week and RM100 a month." The final green landscape holds |

**In words:** "Four steps: certify what you already do, refresh, learn what's missing, then get licensed. Each one fits your free time, and you can see your progress grow."

---

### Chapter 5: Try as someone else

- Six illustrated sample people on a slowly drifting row (pauses on hover or focus).
- Hovering a person makes them wave and shows one line about their situation.
- Clicking opens the app as that person.

### Chapter 6: Final call

- The full green landscape at golden hour; the character waves.
- Headline "Start with what you already do." with **Get started**.
- Buttons respond to the pointer: the main button leans slightly toward the cursor (up to 4px).

---

### Motion rules for the landing page

| Rule | Detail |
|---|---|
| Story over effects | Every animation shows part of the product story. No random fades on every block |
| Readable at rest | Each chapter has a finished resting frame. Text only slides into place, never waits invisible for a scroll trigger. A visitor who stops anywhere can read it |
| Story in words too | Every animated story beat has the same outcome written as text beside the scene ("In words"), for screen readers and skimmers |
| Always a way out | Fixed Get started, "Skip the story", chapter dots, and the Pause animations switch (WCAG 2.2.2: moving content can be paused) |
| Contrast | Yellow and leaf green are only fills behind dark text, never text colours |
| Scroll is reversible | Scrolling back plays chapters backwards (the tide falls, the town greys) |
| Speed | Load sequence under 2.5s; idle loops slow (8–20s cycles) so they never distract from reading |
| Performance | Only transform and opacity are animated; SVG layers; target 60fps on a mid-range laptop; total landing weight under 400KB |
| Reduced motion | No scroll pinning and no loops. Each chapter shows its finished frame as a still illustration with the same text |
| Phone | No pinning; each chapter plays its short sequence once when it comes into view, at about half the length; mouse parallax off |
| Honesty | Numbers shown in the story are the same sample numbers as the app, with a "Sample" note in chapters 2 and 3 |

### How it's built

- **Scenes:** layered SVG (sky, far hills, near hills, town, foreground, character), with each moving part as its own group.
- **Scroll choreography:** GSAP with ScrollTrigger (a free animation library, loaded from cdnjs) for the pinned chapters and timelines. CSS scroll-driven animations handle the simple progress line.
- **Idle loops:** CSS keyframes (turbines, clouds, birds, breathing), paused when off-screen.
- **Character:** the same SVG rig as the app, with poses for walk, wave, thumbs up, look and celebrate.

---

## UNDERSTAND

### PAGE 1: Profile

**Page question:** Who are you, and what can you fit into your life?

#### Tab 1.1: About you

- **Answers:** What job do you do now?
- **Layout:**
```
Tell us about yourself
Your answers help us give advice that fits your life.
┌──────────────────────────────────────────────┐
│ Current job      [Electrical maintenance ▼]  │
│ Years in it      [3–5 years ▼]               │
│ Location (state) [Johor ▼]                   │
│ Age group        [25–34 ▼]                   │
│ Gender           [Prefer not to say ▼] (optional)
└──────────────────────────────────────────────┘
```
- **Content:** job titles come from a fixed list mapped to NOSS occupations. If the job isn't listed, the user picks "Other" and the closest match.
- **Actions:** fill in, then Next tab.
- **Why panel:** "Gender, age and background are never used to rank your paths. We ask age only to suggest age-relevant funding."
- **Proves:** M1, fairness good-to-have, proposal §9 fairness test.

#### Tab 1.2: Time and budget (required before any career is shown)

- **Answers:** How much time and money can you put into learning?
- **Why it comes first:** careers are ranked and filtered using these numbers. A path that needs 8 hours a week, or a licence the user can't afford, should not be presented as the best fit. So the user sets them here, before Decide.
- **Layout:**
```
How much can you put into learning?
We use this to pick careers and courses that fit your life. You can change it any time.

┌ Time ─────────────────────────────────────────────────────────────────┐
│ Hours a week     ◀━━━━━━●━━━━━━━━━━▶  4 hours                          │
│                  (1 to 15 hours; quick picks: 2 · 4 · 8)               │
│ When are you free? (optional now, we'll ask when you add a course)    │
│        Mon  Tue  Wed  Thu  Fri  Sat  Sun                               │
│ Morning  ○    ○    ○    ○    ○    ●    ●                               │
│ Evening  ●    ○    ●    ○    ○    ○    ○                               │
│ Shift work?  (Fixed hours) (Rotating shifts)                           │
│ How long you can keep this up  (3 months) (6 months) (12 months+)      │
└────────────────────────────────────────────────────────────────────────┘
┌ Budget ───────────────────────────────────────────────────────────────┐
│ Monthly budget   (RM0) (RM50) (RM100) (RM300) (RM500+)  or [ RM ___ ]  │
│ Most you'd spend in total  [ RM 1,500 ]   (Not sure)                   │
│ Working now?  (Yes, employer pays HRD Corp levy) (Yes, no HRD Corp)    │
│               (Not working right now)                                   │
│ Open to grants or subsidies?  (Yes, show me) (No)                       │
└────────────────────────────────────────────────────────────────────────┘
┌ What you care about most ─────────────────────────────────────────────┐
│ (Quick move to a new job) (Higher income, even if it takes longer)     │
└────────────────────────────────────────────────────────────────────────┘

Preview: With 4 hours a week and RM100 a month, a 16-hour course takes
about 4 weeks. Licences over RM300 will need a subsidy or HRD Corp.
                                              [ Save and continue ]
```
- **Content:**
  - These are "Your conditions" from proposal §6.1, saved once and reused everywhere: Decide ranking, course filters, and the calendar in My plan.
  - **Free time slots** are what the calendar uses to place course sessions (tab 6.2). They are **optional here**, so they never block someone from seeing careers. If they're skipped, the user is asked for them the first time they add a course, with a "My shifts change every week" option that plans by hours only.
  - **Total budget cap** lets the plan warn when the whole path, not just one month, costs more than the user can spend.
  - **HRD Corp and subsidy answers** decide which costs count against the user's own money.
- **Actions:** set the hours slider, tap free slots, choose budget, answer the employment question, save.
- **Live:**
  - The rail character walks faster or slower to match the hours.
  - The preview line recalculates as values change.
  - A small calendar thumbnail fills the chosen slots.
- **States:**
  - **Save and continue stays disabled** until **hours a week and a monthly budget** are set (the goal defaults to Quick move). The disabled reason is shown: "Choose a monthly budget to continue. RM0 is fine."
  - If free slots were picked but add up to fewer hours than the hours a week chosen, a note appears: "Your free slots give 3 hours, not 4. Add a slot or lower the hours."
  - With a budget of RM0 and "Not working": "We'll show free courses first, and list grants for anything that costs money."
- **Proves:** §6.1 my conditions, M4 personalised pathway (estimated time, free or low-cost resources).

#### Tab 1.3: Your character

- **Answers:** Who represents you on your journey?
- **Layout:** large character preview on the left; options on the right: skin tone, tudung on or off, hard hat colour, vest colour.
- **Live:** the preview updates instantly and nods after each change.
- **States:** a "Skip, use the default" link.
- **Why panel:** "Your character's look is only for you. It never changes any result." (Proposal §6.2 uses this as a fairness test.)
- **Main button:** "Next: show your skills".

---

### PAGE 2: Skills and proof

**Page question:** What can you actually do?

#### Tab 2.1: Add proof

- **Answers:** How do you want to show your skills?
- **Layout:**
```
┌ Record a work video ┐ ┌ Video interview ┐ ┌ Certificates ┐
│ Most accurate       │ │ 5 questions     │ │ SKM, ST, ... │
└─────────────────────┘ └─────────────────┘ └──────────────┘
┌ A past project ─────┐ ┌ CV (optional) ──┐
└─────────────────────┘ └─────────────────┘

Added so far
 ● Work video, 1:30            processed ✓
 ● SKM Level 2 certificate     matched ✓
 ● Project: DB board, Line 3   3 files ✓
```
- **Actions:** each card opens a sheet: record or upload, a short guide ("Film one task you know well, 1–2 minutes"), then upload. Certificates are matched against the SKM and ST whitelist. If there's no match, the user picks from the list (never guessed).
- **Live:** an uploaded item shows a scan line while processing, then a tick.
- **States:**
  - Nothing added yet: "Add at least one. A work video gives the best results."
  - Certificate not recognised: "We couldn't match this certificate. Pick it from the list."
- **Proves:** M1, §5.1 three-track profile, §5.4 PPT evidence passport.

#### Tab 2.2: Job scope game

- **Answers:** What does your job really cover?
- **Layout:** card deck on the left with the guide character above it; job scope map on the right (four areas, points, badges).
- **Actions:** answer Often, Sometimes or Never on 10 task cards (keys 1, 2, 3 also work).
- **Live:** cards fly off; areas fill; badges pop; the guide nods, cheers or thinks; "Hidden skill spotted" lines appear.
- **States:** the end summary offers "Record proof of this task", which jumps to tab 2.1 with the video card selected.
- **Proves:** M1 (questionnaire fallback), learner-motivation good-to-have.

#### Tab 2.3: Check what we found

- **Answers:** Are these skills right?
- **Layout:**
```
Player (sub-tabs: Work video · Interview · Project · Certificate · Game)   │ Please answer these (2)
 ┌───────────────────────────────┐                                        │  ...
 │ scene with caption            │                                        │ These look right (10)
 └───────────────────────────────┘                                        │  Keep / Remove
 ▶ ──◆────◆──◆───◆── 00:31 / 01:30                                        │ Did we miss something?
──────────────────────────────────────────────────────────────────────────
 10 kept · 3 verified · 6 hidden · 1 rusty            [ Save my skills ]
```
- **Content:** each skill shows a status (Verified, Hidden, Rusty), the evidence quote, the source and time, and "Watch this moment". Game-only skills show "Evidence: your answer only" and "Add a video as proof".
- **Actions:** keep, remove, answer the unsure questions, add a missed skill (from the NOSS list only), save.
- **Live:** the work video plays itself once on arrival; each skill flashes as the playhead reaches it; the interview avatar talks.
- **States:** Save stays locked until the unsure questions are answered.
- **Proves:** M1, §5.2 guardrails (user confirms each task, can see the sentence it came from).

---

### PAGE 3: AI job impact (the signal layer)

**Page question:** How is AI changing my job?

Shared header above all tabs:
```
Electrical maintenance technician        Medium overall risk
AI speed (Steady)(Fast)   AI forecast year 2026 2028 2030  [▶ Play]   Estimate
```
Sources and the data version sit in the right "Why this?" panel on every tab (no separate Sources tab).
On the Job history tab the header swaps the speed and forecast controls for the Job history slider, so two kinds of time never share a screen.

#### Tab 3.0: Job history (opens first)

- **Answers:** How has my job already changed, and which old tasks were replaced?
- **Why it comes first:** people trust a forecast more when they can see the change has already been happening. Ahmad sees that paper logbooks were replaced by touchscreens long before AI. AI is the next step in a story he already lived through, not a sudden threat.
- **Layout:**
```
How your job changed                         Electrical maintenance technician
Job history  2000 ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ Today   [▶ Play]
             📍2004        📍2011        📍2016   📍2018      📍2023  📍2025
┌ Then and now ─────────────────────────────────────────────────────────────┐
│  [worker, 2005]                                [Ahmad, today]              │
│  writes readings in a paper logbook  ──────▶   reads them on a tablet      │
│  "In 2005 this took 1 hour a shift."           "Now the machine logs it."  │
└────────────────────────────────────────────────────────────────────────────┘
Tasks over time (story view)
 Paper logbooks and manual readings  █████████▓▓▓▒▒░░          replaced by digital logging
 Manual visual inspection            ██████████▓▓▒▒░░          replaced by camera inspection
 Machine operation                   ███████████▓▓▓▒▒          shrinking
 Fault diagnosis                     ░░▒▒▓▓▓████████████       grew
 Working alongside robots                     ░▒▒▓▓█████       new
 Solar and EV work                                  ░▒▓██      new, growing fast
                                     2000        2010        2020    today
Milestones (dated, with sources)
 2004  PLC-controlled lines common in E&E plants
 2011  Touchscreen machine panels (HMI) replace paper logs on many lines
 2016  First large-scale solar auction in Malaysia (LSS1)
 2018  National Industry 4.0 policy (Industry4WRD)
 2023  National Energy Transition Roadmap; New Industrial Master Plan 2030
 2025  Generative AI tools start appearing at work
How many people do this kind of work (official statistics)
 Machine operators ───╲___      Technicians ___╱───        (OpenDOSM, 2010–2025)

Jobs that grew out of this one
 Machine operator → Production technician → Automation technician
                                         ↘ Solar PV O&M technician
                                         ↘ EV charger technician
                                                         [ See what's next ]
```
- **Content and honesty rules (three kinds of evidence, each labelled):**

| Part | Kind | Rule |
|---|---|---|
| Milestones (dated events) | **History: record** | Every pin has a date and a source link (government policy pages, industry reports, news archives). Unconfirmed dates are not shown |
| How many people do this work | **History: measured** | Official employment by occupation from OpenDOSM, real numbers with year and table name |
| Tasks over time (the streams) | **Story view, not measured** | No dataset measures task shares back to 2000, so the streams are drawn from the milestones and the task descriptions. Each stream band has a "How we drew this" note, and the chart carries the label "Illustration based on dated changes, not measured data" |
| Then and now | **Story view** | A drawn comparison of one task in two eras, tied to a milestone (for example "2011: touchscreen panels") |
| Jobs that grew out of this one | **Record** | Role links come from the national occupation lists (MASCO and NOSS) and MyMAHIR role descriptions, with links |

- **Actions:**
  - Drag the Job history slider, or press **Play** to run 2000 → today in about 10 seconds.
  - Tap a milestone pin for its date, what changed, and the source.
  - Tap a stream to see which old task it replaced and what replaced it.
  - **See what's next** moves to Task analysis, where the forecast continues from today.
- **Live:**
  - As the slider moves, the streams grow and shrink, milestone pins drop in at their years, and the employment lines draw themselves.
  - The **"then" worker morphs into Ahmad**: the paper logbook becomes a clipboard, then a tablet; overalls become a hi-vis vest; a robot arm appears beside him around 2018.
  - Replaced tasks fade to grey with a small label naming what replaced them ("replaced by digital logging").
  - At **Today**, the slider stops with a pulse and the "See what's next" button glows once.
- **In words** (always beside the chart): "Since 2000, paper logging and manual inspection have mostly been replaced by machines and cameras. Fault diagnosis and working with robots grew. Solar and EV work is new and growing. AI is the next change in this line of work."
- **States:** if the user's job has no history entry, the tab shows the closest job family with a note: "We don't have a history for your exact job yet. This is the closest one: production technician."
- **Proves:** M2 ("which skills and jobs will emerge or decline"), with evidence that decline is already measurable. It builds trust in the forecast, and stays honest by separating records from illustration.

#### Tab 3.1: Task analysis

- **Answers:** Which of my tasks will AI take, help with, or leave to me?
- **Layout:**
```
Your 38-hour week   [■ stays 21h][■ AI helps 13h][▨ done by AI 4h]
  Future you (weather + avatar) says: "AI could take 4 hours, mostly logging."

 Task                       Hours  AI exposure   What happens        Confidence
 Parameter logging            6    ████▊ 62%     AI helps, you lead  ●●● High
 Fault diagnosis              6    ██ 25%        Stays with you      ●●● High
 ...                                       (row opens: what AI does / what stays / how we know)
```
- **Actions:** expand rows; change speed and year; Play runs through 2026 → 2030; switch the **Table | Picture** toggle.
- **Live:** the week bar resizes; rows glide to new positions; future Ahmad's weather changes (sun, cloud, rain).
- **Picture view (toggle, same tab):** the waterline (tide) chart. Each task is an island column; the sea is AI. Key: dry land, sand, under water. The sea ripples constantly; columns sink as the year moves on; clicking a column switches back to Table with that row open.
- **Proves:** M2, M6, §5.6 data-anchored scenarios, §6.2 tide chart.

#### Tab 3.2: When it happens

- **Answers:** When should I expect each change?
- **Layout:**
```
 🌱 0–2 years           🌿 3–5 years            🌳 5–10 years
 Early adoption         Growing adoption        Wider impact
 Reporting, admin       Diagnosis tools         Routine maintenance
 → your tasks: logging  → fault diagnosis       → start-up checks
```
- **Content:** each column lists the user's own tasks that cross into "AI helps" or "done by AI" in that window, under the chosen speed.
- **Live:** the plant grows from seedling to tree on entry; switching speed shifts tasks between columns.
- **Proves:** M2 ("predict which skills will decline"), M6.

#### Tab 3.3: Green opportunities

- **Answers:** Which new jobs are opening up?
- **Layout:** a 2×4 grid of role cards (Solar PV technician, Energy efficiency specialist, Green building maintenance, Smart grid technician, EV charger technician, Battery storage technician, ...). Each card shows demand direction, window (long, medium, closing), licence needed, SDG tags, and "Your tasks that carry over: 3 of 4".
- **Actions:** open a role for detail; "Compare these in Decide".
- **Live:** demand arrows tick up or down when the year changes.
- **Proves:** M2 ("skills and jobs will emerge"), M5 SDG tags, §5.7 window.

#### Sources (right "Why this?" panel, every tab)

- **Answers:** Where do these numbers come from?
- **Layout:** a compact list in the right panel: what each source measures, link, date fetched, version, confidence, and which scenario uses it. "How we score" (formulas and weights written out) opens in the Why drawer.
- **Content:** Anthropic Economic Index (Steady), ILO generative AI index (Fast), OpenDOSM labour statistics, job-ad sample (two rounds), MyMAHIR, course catalogue snapshots.
- **States:** a source older than 90 days shows "Stale". A source that is missing shows "Source missing" in a dashed red border.
- **Proves:** M2 ("show the source and its date"), the rules (cite every source), §7.1 data pipeline.

---

## DECIDE

### PAGE 4: Choose your path

**Page question:** Stay, Evolve or Pivot?

**Entry check: time and budget must be set first.** If the user reaches Decide without completing tab 1.2, the page shows only:
```
Before we suggest a career
Tell us how much time and money you can put into learning.
Careers are ranked by what fits your week and your budget.
                                 [ Set my time and budget ]
```
The button opens tab 1.2, and returns here after saving. Once set, a summary chip sits at the top of every Decide tab: "4 h a week · RM100 a month · Sat and Sun mornings · Edit".

**How time and budget shape the ranking:**
- **Ease of move** uses the months a path takes at the user's real hours.
- Paths whose required spend is over the user's total budget, after HRD Corp and subsidies, are still shown but marked **"Over your budget"**, with the gap in ringgit and what would cover it.
- Paths needing more weekly hours than the user can give show **"Needs more time"** and how long they would take instead.
- Nothing is hidden. The user still decides.

The control bar is shared by all three tabs and split as the proposal requires:
```
┌ The world (you can't control) ─────────┬ Your conditions (you decide) ──────────┐
│ AI speed [Moderate][Accelerated]        │ Hours (2)(4)(8)  Budget (0)(100)(300+) │
│ Priority [SDG 4/8 Skills & jobs][SDG 7] │ Goal [Quick move][Higher income]     ⟳ │
└─────────────────────────────────────────┴────────────────────────────────────────┘
```

#### Tab 4.1: Compare (default)

- **Answers:** Which path fits me best right now?
- **Layout:**
```
   Stay and adapt          Evolve to green ★         Pivot to new field
   [future avatar]         [future avatar]           [future avatar]
   Automation line tech    Solar PV O&M tech         EV charger tech
   Match 62                Match 68                  Match 61
   ── breakdown ──         ── breakdown ──           ── breakdown ──
   Window: steady          Window: long              Window: medium
   Licence: none           Licence: GCPV             Licence: ST
   SDG 8.2 9.4             SDG 4.4 7.2 8.5           SDG 4.4 7.2
   Exit if… / Backup…      Exit if… / Backup…        Exit if… / Backup…

   Do nothing: Match 34, "Logging and checks go to AI by 2028"
   Quick comparison table: time, cost, licences, skills reused, outcome
```
- **Content:** each future avatar shows the data visually (proposal §6.2): tools in hand = tasks mastered, badges = certificates and licences, weather = risk, walking speed = hours, a toll bridge broken = budget too low, signpost = goal.
- **Actions:** change any control; open a breakdown part (Why drawer); pick a path ("Choose this path").
- **Live:** cards slide to their new order when a control changes; a line says why ("Evolve moved up because you chose Higher income"); avatars react (weather, bridge, badges).
- **States:** a licence that can't be afforded shows the bridge broken plus "Not possible on RM0. Subsidies you can apply for: ...".
- **Proves:** M3 (ranked roles, score, gap), M5 (SDG changes the choice), §4 #3, §5.5, §5.7, §6.2.

##### How the simulation works for the three choices

Each path (Stay, Evolve, Pivot, plus Do nothing as the baseline) runs through the same transparent steps. Nothing here is a black box, and every number can be opened in the Why drawer.

**Inputs:**
1. Ahmad's confirmed skills: verified, hidden, rusty (from Page 2).
2. His conditions: hours a week, monthly and total budget, HRD Corp status, goal (from tab 1.2).
3. The AI speed (Moderate or Accelerated) and the current data release.
4. For each path: the target role, its required skills and licence, and its course steps in the fixed order (certify, refresh, learn, licence), each with hours and cost.

**Month by month, M0 to M24:**

| Each month the engine… | Using |
|---|---|
| Spends Ahmad's hours on the next step in order | Hours a week × about 4.3 weeks |
| Adds the month's budget to his savings for learning, and pays for a step only when it's affordable (after HRD Corp or subsidy) | Monthly budget, total cap |
| Marks a skill as gained when its step finishes | The course or PPT step |
| Blocks a licence step until it's affordable, and records why | Licence cost vs savings |
| Recalculates the match score (task overlap rises as skills are gained) | The same formula as Compare |
| Moves AI exposure of his **current** tasks along the chosen speed's curve | The AI forecast data |
| Records events: certificate approved, course finished, licence blocked or obtained, rank change between lanes | The above |

- **Do nothing:** no steps are taken. His skills stay the same while the AI exposure of his current tasks keeps rising, which shows the cost of waiting.
- **Outputs at M24:** match score, skills gained out of needed, licences, money spent, hours spent, the AI exposure his tasks would face, and the window for the target role.
- Every simulated event is tagged **Projection**. The engine uses only the current data release and the user's own inputs; it never invents future data.

##### Motion: "Run the next 24 months" (in the Compare tab)

```
            Stay                     Evolve                    Pivot          Do nothing
  road ═══════════════      road ═══════════════      road ══════════════   (stands still)
   [Ahmad]  →  →  →          [Ahmad]  →  →  →          [Ahmad] → →           [Ahmad]
   M 0 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●━━━━━━━━━━━━━━━━━━━━━━━━ M 24   [▶ Run] [⏸] [1×|2×]
```

- Press **Run the next 24 months**. Four Ahmads (Stay, Evolve, Pivot, Do nothing) set off together along their roads, with a shared month counter.
- **As each one walks:**
  - he picks up tools when a skill is gained (a multimeter, a solar panel tile, an EV plug)
  - he gets a badge pinned on his vest when a certificate or licence arrives
  - the weather above his road follows the AI exposure of his tasks (clear, cloudy, rain)
  - a broken toll bridge appears when a licence can't be afforded yet, and he waits at it until savings or a subsidy cover it, then crosses
  - a small score bubble above his head counts up as the match improves
- **Do nothing** stands still while clouds gather over him, and his score slowly drops as his tasks become more exposed.
- **Rank changes:** when one path overtakes another, the two characters swap lanes with a short hop, and a line appears: "Month 11: Evolve overtakes Stay because your PPT certificate was approved."
- **At M24** the four stop on a finish line in ranked order, each with a small result card (score, skills gained, money spent, licences).
- Pause, scrub back and replay at any point. The same run feeds the Simulate tab, which shows the full detail.
- **Depth:** characters are layered vector art drawn with depth (soft shadows, a slight 3D turn as they walk and when hovered), so they read as "3D" without heavy 3D files. The proposal keeps true 3D for the final round (§6.2); the same characters can be swapped for 3D models then.
- **Reduced motion:** the run skips straight to the M24 result cards, with the events listed as text.

##### Click a character: go to the path deep dive

Clicking (or pressing Enter on) any Ahmad, during or after a run:
1. The camera **zooms into that road** (about 500ms). The other roads blur and slide away.
2. The character grows and moves into the header of the deep-dive screen (a shared-element transition), so it's clear "this is my future on this path".
3. A back button returns to Compare with the run where it was.

### THREE DOORS: step into each future (opens from a character)

**Page question:** What would this job really be like for me, and what skills do I need to get it?

After the 24-month run, the three characters stop in front of **three doors**: Stay, Evolve, Pivot. Each door shows a tiny live preview of its world (sun or rain, a short or long hiring queue). Clicking a door or its character makes the camera **fly through the door into that job's workplace in 2028**: a smart factory floor (Stay), a solar farm with an O&M cabin (Evolve), an EV charging hub (Pivot). Ahmad walks in as his future self.

View toggle (top right): **Scene | List**. List shows the same content as the four tabs below.

#### The skills highlight (the first thing shown in every door)

Skills needed for the position are **the centrepiece**, because they turn "this job looks good" into "this is what I must learn".

**Entering a door plays a three-beat sequence (about 3 seconds):**
1. The camera lands on the **workbench** in the middle of the scene.
2. The **toolbox opens**. Each tool stands for one skill the job needs:
   - Tools Ahmad already has **glow and fly into his hands** one by one, each with a small tick.
   - Tools he's missing stay on the bench, greyed, with a hanging tag ("GCPV · RM600 · 3 weeks").
3. A banner settles above the bench: **"You have 2 of 6 skills for this job. Job-ready in about 9 months at 4 hours a week."**

**Skills panel**, pinned on the right of the scene (and the first section in List view):
```
Skills for Solar PV O&M technician                      You have 2 of 6
──────────────────────────────────────────────────────────────────────
Required by law
 🔒 GCPV certificate (SEDA)        ✗ Missing   RM600 · 24 h · licence     [Plan it]
 🔒 Electrical competency (ST)     ✗ Missing   later step                  [Plan it]
Most asked for in job ads (share of ads, round 2)
 ★ PV system testing         61%   ✗ Missing   20 h · RM150 online         [Plan it]
 ★ Electrical safety         55%   ◐ Rusty     8 h refresher, free         [Plan it]
 ★ Fault diagnosis           48%   ✓ You do this · certify via PPT, no class
 ★ Inverter troubleshooting  44%   ✓ Verified
Good to have
 · Working at height         35%   ✗ Missing   1-day course
 · Reading single-line drawings    ✓ Seen in your project
──────────────────────────────────────────────────────────────────────
Time to job-ready: about 9 months at 4 h a week · Cost: about RM1,050 (RM750 after HRD Corp)
                         [ Add all missing skills to my plan ]
```

- **Order:** what the law requires first, then what employers ask for most, then nice-to-haves. Within each group, missing skills sort above ones Ahmad has, so gaps are never buried.
- **Statuses** use both a word and a shape, so they aren't colour-only: ✓ Verified, ✓ You do this (certify via PPT), ◐ Rusty, ✗ Missing, 🔒 Required by law.
- **Every skill row is linked:**
  - tapping it highlights its tool on the bench, and the reverse
  - "Plan it" opens the matching course card from Recommended courses (tab 5.3)
  - where the skill was spotted (for example "at 00:31 in your work video") shows on hover
- **Numbers:** time and cost are at Ahmad's own hours and budget, after HRD Corp if it applies. Shares of job ads carry the job-ad sample round and date.
- **"Add all missing skills to my plan"** adds the courses in the fixed order (certify, refresh, learn, licence) to the calendar, after a preview of weeks, cost and finish date.

**Skills shown on the way in, too:**
- On each **door** before clicking: "4 skills to learn" in a small tag, so the size of the gap is visible from the start.
- On each **Compare card:** the top 3 skills needed as chips, marked have or missing.

**When the user chooses the path** ("Choose this path"):
- A confirm panel shows the **skills checklist as the commitment**: "To become a Solar PV O&M technician you'll learn 4 skills: GCPV, PV system testing, electrical safety refresher, working at height. Your first step: certify fault diagnosis through PPT."
- That checklist becomes the Skill gap tab (5.2), the course list (5.3) and the calendar (6.2). The same skills, in the same order, everywhere.

#### The rest of the scene: tap an object

| Object | Shows | How it reads |
|---|---|---|
| Hiring board on the wall | Jobs in Malaysia: map pins by state, job titles, pay range | More pins = more jobs; Ahmad's state pulses |
| Queue at the hiring booth | Competition: demand vs newly trained people | Short queue = open field; long queue = crowded |
| Staircase up the tower or mezzanine | Career growth: ladder with pay and years | Ahmad climbs to where he could be |
| Sky and robots | AI risk for this job | Sunny with a few helper robots = safe |
| Wallet and toll gate at the door | Affordability of the whole path | The gate opens when the plan fits the budget |

Tapping any object opens a card with the exact numbers, source and date, tagged Real data, Sample or Projection.

**Future self speaks:** as the camera lands, future Ahmad says one or two captioned sentences built from the calculated numbers, for example: "In 2028 I look after a solar farm in Johor. I already knew fault finding. I had to learn PV testing and get my GCPV." A **Hear it** button plays a voice only when pressed.

**Prelim scope:** the Evolve door (solar farm) is built in full detail first. Stay and Pivot use simpler scenes with the same objects and the same skills panel. All three get full scenes, or 3D, in the final round.

**Reduced motion or Pause animations:** no fly-through. The scene appears finished, with the skills panel open.

### PATH DEEP DIVE: List view (Scene | List toggle)

**Page question:** What would this path really look like for me in Malaysia?

Shared header:
```
[animated future Ahmad]  Evolve: Solar PV O&M technician          Match 68 / 100
                         Window: long · Licence: GCPV · SDG 7.2 8.5
[ Skills needed ][ Jobs in Malaysia ][ Competition ][ Career growth ]   ← Skills needed opens first
                                       [ Choose this path ]  [ Back to compare ]
```
Each tab tags its numbers as **Real data** (published or sampled with a date), **Sample** (demo data, shaped like the real source), or **Projection** (calculated).

#### Tab DD.1: Jobs in Malaysia

- **Answers:** Where are these jobs, how many are there, what are they called, and what do they pay?
- **Layout:**
```
 Map of Malaysia (states shaded by openings)      Job titles you'd apply for
  Johor ████  Selangor █████  Penang ███           Solar PV O&M technician
  Kedah ██   Sabah █   Sarawak ██ ...              PV maintenance technician
  [Ahmad's state highlighted]                      Solar site technician
                                                   (national occupation codes, MASCO)
 Openings in the last job-ad sample: 42 of 100 ads (round 2, Mar 2026)
 Who's hiring (types): solar installers and EPC firms · utilities · factories
                       with rooftop solar · facility management companies
 Pay range (monthly, entry → experienced): RM2,400 – RM4,500   source, year
```
- **Content:** openings by state come from our job-ad sample and the MGTC Green Jobs Portal. Job titles come from MASCO and MyMAHIR. Pay comes from public salary surveys. All dated and linked.
- **Live:** states fill in one by one; Ahmad's state pulses; switching between the two job-ad rounds animates the change.
- **States:** if the sample is too small for a state: "Not enough data for Sabah yet."

#### Tab DD.2: Competition

- **Answers:** How many other people are going for these jobs, and how do I stand out?
- **Layout:**
```
 How crowded is it?     Open ●──────○──────○ Crowded
 Demand (job ads mentioning these tasks)   ↑ +32%
 Supply (new course places and graduates)  ↑ +12%
 → Window: long. More jobs than trained people for now.   (2 sources agree)

 Who you'd compete with
  ● New TVET graduates with a solar certificate (growing fast)
  ● Electricians moving into solar (some)
  ● Installers with GCPV already (few, in demand)

 How you stand out
  ✓ 5 years of fault diagnosis on live machines (hidden skill, certify via PPT)
  ✓ Electrical certificate (refresh needed)
  ✗ No GCPV yet: most job ads ask for it
```
- **Content:**
  - Demand comes from job-ad keyword counts across two rounds; supply comes from course intake counts in the catalogue snapshots. This is the Window Score from proposal §5.7 written in plain words.
  - "Who you'd compete with" is a qualitative summary from course and job-ad data, with no invented headcounts.
- **Live:** the crowd meter needle settles into place; demand and supply bars race each other on entry; switching AI speed moves the needle.
- **Proves:** §5.7 Window Score (red ocean vs blue ocean), M2.

#### Tab DD.3: Career growth

- **Answers:** Where can this path take me over the years?
- **Layout:**
```
 Career ladder
  ▲ Own installation business / O&M contractor          10+ yrs
  ▲ O&M supervisor / site lead          RM5,500–8,000    6–10 yrs
  ▲ Senior PV O&M technician            RM4,000–5,500    3–6 yrs
  ● PV O&M technician (you, after plan) RM2,400–4,000    start
 Growth of this role (Projection)
  2026 ───────╱────── 2030   Moderate: steady growth   Accelerated: faster
 AI exposure of this role: Low (hands-on, safety-critical)
```
- **Content:**
  - The ladder comes from MyMAHIR role progressions and job-ad seniority levels; pay ranges from salary surveys (dated).
  - Role growth uses the national energy transition targets and the job-ad trend, tagged Projection, under both AI speeds.
  - The AI exposure of the target role shows that the new job is safer than the old tasks.
- **Live:** Ahmad climbs the ladder rung by rung on entry; the growth line draws itself; switching the AI speed redraws it.
- **Proves:** M2 (emerging jobs), M6 (two scenarios, labelled estimates), M5 (SDG 8.5 decent work).

#### Tab DD.4: Skills needed

- **Answers:** What exactly do employers want, and what do I already have?
- **Layout:**
```
 Skills employers ask for most (share of job ads, round 2)
  GCPV certificate              ████████████ 78%   ✗ you don't have it yet
  PV system testing             █████████    61%   ✗ course: 20 h
  Electrical safety             ████████     55%   ◐ rusty: refresher 8 h
  Fault diagnosis               ███████      48%   ✓ you do this (certify via PPT)
  Working at height             █████        35%   ✗ 1-day course
 Licences required by law: GCPV (SEDA), electrical competency (ST)
 You have 2 of 5 · Time to job-ready at 4 h a week: about 9 months
                                        [ See courses for these skills ]
```
- **Content:** skill frequencies from the job-ad sample; Ahmad's status from his confirmed profile; licences from SEDA and ST; time to job-ready from the simulation.
- **Actions:** "See courses for these skills" opens Recommended courses (tab 5.3) filtered to these gaps.
- **Live:** bars fill from the top; each one Ahmad already has gets a tick with a small pop; the job-ready counter counts to its value.
- **Proves:** M3 skills gap, M4 link to the pathway.

#### Tab 4.2: Time machine (core demo)

- **Answers:** Does the advice change when the data changes?
- **Time control used:** **Data release** only (diamond markers, Real data tag). The AI forecast year and plan months are not shown on this tab.
- **Layout:**
```
Data versions (real releases only)
 ◆ 2025-01 ───────── ◆ 2025-09 ───────── ◆ 2026-03
   AEI v1, jobs round 1   AEI v2, ILO 2025      AEI v3, jobs round 2
 [drag the marker]

Ranking at this version          What changed since the previous version
 1 Evolve  68  (↑1)              ↑ Inverter diagnosis demand +21% → +32%
 2 Stay    62  (↓1)              ↓ Basic PV install: more courses, window closing
 3 Pivot   61                    → Evolve moved above Stay
                                 [Why this changed] (source, date, version)
```
- **Content:** only real snapshots, each tagged **Real data**, with source, date and version. Two of them come from real dataset version comparisons, as the proposal promises (§8).
- **Actions:** drag between versions; open the Why drawer on any change.
- **Live:** ranking rows swap places with a glide; changed numbers count to new values; the landscape's weather follows the selected version.
- **Proves:** **the preliminary core demo (§8 step 4)**, M2 ("output visibly changes when trend data changes"), Domain 1 success criteria.

#### Tab 4.3: Simulate

- **Answers:** How would each path play out over the next 24 months?
- **Time control used:** **Month of your plan** only (forest-green line, walking avatar, Projection tag).
- **View toggle (not a tab):** Story | Detail.
- **Default: story mode**
```
 Lane: [Stay][Evolve ●][Pivot][Do nothing]          [▶ Play my next 24 months]
 ┌──────────────────────────────────────────────────────────────────┐
 │ M0 ──●─────●──────△─────●──────────────────────────── M24        │
 │      ↑ future avatar walks along the line                         │
 └──────────────────────────────────────────────────────────────────┘
 Month 3: Your PPT certificate for fault diagnosis is approved.  (Projection)
 Month 8: GCPV licence needed, RM600. Not affordable on RM100 a month.  (Projection)
```
- **Detail mode (toggle "Show all lanes and data"):** the amended layout spec (lane panel, timeline stage with four lanes, inspector, outcome strip, what-if split).
- **Content:** every event is tagged **Projection** and calculated from the current data and the user's conditions. No future data releases are shown.
- **Actions:** play, pause, scrub; pick a lane; what-if 8h or RM0 (temporary until "Use this"); open events in the Why drawer.
- **Live:** the avatar walks, gets a badge at certificates, holds an umbrella at a blocked step; milestones appear as the playhead passes.
- **Outcome strip:** match out of 100 with breakdown, window with confidence word, licences, exit condition, backup path, "Download transition card".
- **Proves:** extends §6.1, §6.2, §6.4; M6 (scenarios as estimates).

---

## ACT

### PAGE 5: Match and courses

**Page question:** What do I need to learn, and where?

#### Tab 5.1: Your match

- **Answers:** Why is this the right role for me?
- **Layout:** role illustration, the role title with a "High demand" tag, one sentence on what carries over, match 78 with the four-part breakdown, a "Why this role?" checklist (growing sector, prospects in Malaysia, matches your skills, SDG 7 and SDG 8 with what each contributes).
- **Actions:** "Change path" returns to Decide.
- **Proves:** M3, M5.

#### Tab 5.2: Skill gap

- **Answers:** What exactly am I missing?
- **Layout:**
```
 Skill needed               You have          Next step (fixed order)
 Fault diagnosis            Hidden            1 Get certified via PPT, no class
 Electrical safety          Rusty             2 Short refresher
 Inverter diagnosis         Missing           3 Course (window: long)
 PV site safety             Missing           3 Course (window: long)
 GCPV licence               Missing           4 Licence (hard requirement)
```
- **Content:** the order follows proposal §6.3: certify what you have, refresh rusty skills, fill gaps by Window Score, licence last.
- **Live:** bars fill to the user's level on entry.
- **Proves:** M3 skills gap, §6.3.

#### Tab 5.3: Recommended courses

- **Answers:** Which real courses, online or near me, should I take for my goal, and in what order?
- **When it appears:** after the user has set their time, budget and goal (tab 1.2) and chosen a path (Page 4). Before that, the tab shows: "Choose a path first, and we'll find courses that fit it."
- **Layout:**
```
Recommended courses for: Solar PV O&M technician
Goal: Quick move · 4 h a week · RM100 a month · HRD Corp: yes      [Edit]

[Recommended for you][Free online][Near me (Johor)][HRD Corp claimable][Licences]
Sort: Best fit ▼                                  Catalogue updated 2026-03-15 ●

 Step 1 · Certify what you already do
 ┌──────────────────────────────────────────────────────────────┐
 │ PPT: Recognition of Prior Achievement (fault diagnosis)       │
 │ JPK (Department of Skills Development) · Official ↗           │
 │ Fills: Fault diagnosis (hidden skill) · No classes · 4 weeks  │
 │ Cost: to be confirmed · Fits your goal: fastest first step    │
 │ [Why this course?]                         [ Add to my plan ] │
 └──────────────────────────────────────────────────────────────┘
 Step 2 · Refresh rusty skills
   Electrical safety refresher · free online · 8 h
 Step 3 · Learn what's missing (by Window Score)
   PV site safety short course · Johor · RM300 · HRD Corp ✓
   Inverter fault diagnosis · online · RM150
 Step 4 · Get licensed
   GCPV · SEDA-approved provider · RM600 · Over your budget: see subsidies
                                                     Right panel: Why this course?
```
- **How the recommendation is made (in plain words in the Why panel):**
  1. **Start from the skill gap** (tab 5.2): every course must fill a specific missing, rusty or hidden skill. No course is shown "just because".
  2. **Apply the fixed order** from proposal §6.3: certify what you have, then refresh, then learn new skills (highest Window Score first), then the licence last.
  3. **Rank within each step by the user's goal:**
     - **Quick move:** shorter courses, certificates employers ask for in job ads, no long full-time programmes.
     - **Higher income:** judgement-level skills with a long window (for example inverter diagnosis), even if longer, plus the licence that unlocks higher-paid roles.
  4. **Filter by time and budget:** courses must fit the weekly hours (duration is shown at the user's pace). Cost is compared with the monthly and total budget after HRD Corp or subsidy. Over-budget courses stay visible but are labelled.
  5. **Prefer free and online first** when the budget is RM0 or the user isn't working.
- **Where the courses come from (real, public, never invented):**

| Source | What it gives us | How it's kept current |
|---|---|---|
| HRD Corp course directory | Claimable courses, providers, fees | Snapshot with date; refreshed each data release |
| JPK (PPT certification) | How to certify prior achievement | Official page link, checked each release |
| SEDA Malaysia | GCPV and solar training providers | Official provider list snapshot |
| Energy Commission (ST) | Electrical licences and approved training | Official page link |
| Public TVET institutions (for example ADTEC, ILP, polytechnic short courses) | Local short courses with intakes | Manual snapshot per state |
| Free online platforms (for example OpenLearning, Coursera audit, edX audit, manufacturer training channels) | Free or low-cost online modules | Curated list with links, checked each release |

  - Every course is a **real record in our catalogue** with its link, provider, fee, duration, mode, state, intake and the date it was checked. The system never writes a course on its own (Domain 1 rule: no invented courses).
  - Anything we couldn't confirm shows **"To be confirmed"**, never a guess.
  - A dead or changed link is flagged "Link needs checking" and drops below verified courses.
- **Tabs inside the list (filters):**
  - **Recommended for you:** the ordered plan above.
  - **Free online:** cost RM0, online.
  - **Near me:** in-person courses in the user's state.
  - **HRD Corp claimable:** only shown as a benefit if the user's employer pays the levy.
  - **Licences:** the legal requirements for the chosen path, with cost and subsidies.
- **"Why this course?" panel:**
  - the skill it fills, and where that gap came from (for example "you have no certificate for this, but we saw you do it at 00:31 in your video")
  - how it matches your goal
  - time at your pace
  - real cost after HRD Corp
  - SDG link (for example SDG 4.3 lifelong technical learning, SDG 7 clean energy)
  - catalogue source and the date checked
- **Live:**
  - When the goal is switched (Quick move ↔ Higher income) in the summary bar, cards **reorder with a glide** and a line explains: "Inverter diagnosis moved up because you chose Higher income."
  - Durations recount when hours change.
  - The "Catalogue updated" dot pulses gently.
- **Course card:** provider, link, which gap it fills, duration at your hours, cost, HRD Corp status, mode, prerequisites, next intake ("To be confirmed" if unknown), Accredited tag, **Add to my plan**.
- **Fit to your week:** each card also shows "Fits your free time: Sat and Sun mornings, about 5 weeks". Courses with fixed class times that clash with the user's free slots are flagged "Clashes with your free time".
- **Add to my plan:** if free times weren't set in tab 1.2, it first asks "When are you usually free?" (the same grid, plus "My shifts change every week"). It then opens a short preview of how the course will be laid into the calendar (which weeks and slots), the cost per month, and what it does to the finish date. On confirm, every session goes into the calendar (tab 6.2) and the course gets its own progress tracker.
- **States:** a course over budget shows "Over your budget" plus subsidy options, never hidden. Filters that leave nothing show "No courses match. Try removing the Online filter."
- **Proves:** M4 (free or low-cost, HRD Corp), rules (courses only from the verified list).

#### Tab 5.4: Compare courses

- **Answers:** Which of these two or three is better for me?
- **Layout:** side-by-side table of up to three selected courses: time at your hours, cost after HRD Corp, mode, location, gap filled, next intake, SDG.
- **Actions:** remove one; "Add to my plan".
- **Proves:** M4.

---

### PAGE 6: My plan

**Page question:** What do I do this week?

#### Tab 6.1: Timeline

- **Answers:** What are my steps, and when?
- **Layout:**
```
Become a solar PV O&M technician            Your progress ◔ 25%
 01 Build your foundation   2 weeks  Learn     Next check-in: in 2 weeks
 02 Practise your skills    4 weeks  Practise
 03 Create a project        4 weeks  Build
 04 Prepare for employment  2 weeks  Apply
 Projected next 4 weeks (from Simulate): W1–W2 PPT workshop, W3–W4 PV safety

 Courses in this plan        Progress
 PPT certification           ▓▓▓▓▓▓▓░░░ 70%
 PV site safety              ▓▓▓▓▓░░░░░ 50%
 Inverter diagnosis          not started
```
- **Content:** each milestone is made of courses; a milestone's progress is the average of its courses' progress from the calendar (tab 6.2).
- **Actions:** open a course to jump to its sessions in the calendar; "Apply to my plan" for proposed changes.
- **Live:** ticking fills the ring and **adds an element to the landscape**; changing hours reflows the timeline.
- **Proves:** M4, progress good-to-have, §6.4.

#### Tab 6.2: Calendar and course progress

- **Answers:** What do I do this week, and how far am I in each course?
- **Layout:**
```
[ Week ][ Month ]          ◀  12–18 May  ▶            4 of 4 hours planned

        Mon     Tue     Wed     Thu     Fri     Sat            Sun
Morning                                         ┌──────────┐   ┌──────────┐
                                                │PV safety │   │Evidence  │
                                                │Unit 3 of 6│  │Record one│
                                                │2h  ▓▓▓░░ │   │fault, 2h │
                                                └──────────┘   └──────────┘
Evening ┌──────────┐
        │PPT form  │
        │30 min    │
        └──────────┘

Course progress
 PPT certification (fault diagnosis)  ▓▓▓▓▓▓▓░░░  70%   Due 30 May      On track
 PV site safety short course          ▓▓▓░░░░░░░  3 of 6 units 50%      On track
 Inverter diagnosis (online)          ░░░░░░░░░░  Starts 2 June         Not started
 GCPV licence                         △ Waiting for budget (RM600)       Blocked
```
- **Content:**
  - **Sessions come from the courses the user added** (tab 5.3), laid into the free slots chosen in tab 1.2, never beyond the weekly hours.
  - Each block shows the course, the unit, the duration and a mini progress bar.
  - **Two kinds of blocks:**
    - **Learning:** a course unit or class.
    - **Evidence:** proof for PPT, for example "Record one fault you fixed, ask your supervisor first".
  - **Fixed classes** (in-person, set dates) are locked anchors. Flexible units are planned around them.
  - **Course progress panel:** one row per course with % done (or units done of total), due date and a status word: On track, Behind, Not started, Done, Blocked.
- **Actions:**
  - **Tick a block done.** That course's progress moves up, and when a course reaches 100% its milestone in tab 6.1 is ticked.
  - **Mark a block missed.** The remaining sessions of that course move to the next free slots, and the new finish date is shown.
  - **Drag a flexible block** to another free slot. Fixed classes can't be moved.
  - Switch between Week and Month view; tap a course row to see all its upcoming sessions.
  - Add to phone calendar (.ics) in the full site.
- **Live:**
  - Ticking a block fills its bar and the course row smoothly.
  - Finishing a course grows a new element in the landscape and makes the character cheer.
  - A missed block slides to its new slot.
- **States:**
  - **No courses added yet:** "Your calendar is empty. Add a course from Match and courses and we'll place it in your free time." with a button.
  - **Over capacity:** "These courses need 6 hours a week. You have 4. Finish date moves to 30 August, or add a free slot."
  - **Behind:** "You're 2 sessions behind on PV safety. We moved them to next Saturday and Sunday."
  - **Blocked by budget:** the licence row shows the cost, what's missing and the subsidy options. It is never scheduled as if it were paid.
  - **Time or budget changed** in tab 1.2: the calendar re-plans, and shows "Your plan was updated for 2 hours a week. Finish date: 12 October" with Undo.
- **Proves:** §6.4 (learning and evidence blocks, missed-week shift, progress tracking), M4 (ordered plan with estimated time), learner-motivation good-to-have.

##### Month view: progress at a glance

```
              May 2026                         Legend
  Mon Tue Wed Thu Fri Sat Sun                  ● done  ◐ part done
               1   2   3 ●  4 ●                ○ planned  ✕ missed (moved)
   5 ●  6   7 ●  8   9  10 ●  11 ✕→18          ◆ fixed class  ★ course finished
  12 ●  13  14 ◐ 15  16 17 ◆ 18 ●
  19 ○  20  21 ○ 22  23 24 ○  25 ○ ★ PPT done
  Hours this month: 14 of 16 planned · 3-week streak
```
- Each day shows a coloured dot per course session (each course has its own colour, matching the course row below the calendar).
- A missed session shows ✕ with a small arrow to the day it moved to.
- A ★ marks the day a course finished.
- The footer shows hours done vs planned this month and the current streak (weeks in a row with at least one session done).

##### Course tracker drawer (one course in full)

Opens when the user taps a course row, or any session block of that course.

```
PV site safety short course                         ✕
SEDA-approved provider · Johor · RM300 · HRD Corp ✓
▓▓▓▓▓░░░░░  3 of 6 units · 50% · On track
Hours: 8 of 16 done · Planned finish: 7 June (was 31 May)

Sessions
 ✓ Sat 3 May   Unit 1  2h   done
 ✓ Sat 10 May  Unit 2  2h   done
 ✕ Sat 17 May  Unit 3       missed, moved to Sun 18 May
 ✓ Sun 18 May  Unit 3  2h   done
 ○ Sat 24 May  Unit 4  2h   planned
 ○ Sat 31 May  Unit 5  2h   planned
 ◆ Sat 7 Jun   Unit 6  4h   fixed class, in person

Proof of completion
 [ Upload certificate or screenshot ]   (needed to mark the course finished)

[ Open course website ↗ ]  [ Pause this course ]  [ Remove from plan ]
```

- **How progress gets recorded: automatically when the provider allows it, by the user otherwise.** Every course row and drawer carries a label saying which kind it is.

| Kind | Label on the course | How it works | When |
|---|---|---|---|
| **Synced automatically** | "Synced with OpenLearning · updated 2 h ago" | The provider sends progress to BijakMatch: units done, quiz passed, completion. Standard routes are xAPI (learning-record statements), LTI 1.3 (for institution Moodle and LMS courses) or a provider's own API, once the user connects their account. The calendar ticks sessions by itself and re-plans if the user falls behind | Later phase: needs a small server and a partner agreement per provider |
| **Verified by link** | "Certificate verified ✓" | The user pastes the certificate's public verification link (many online platforms provide one). BijakMatch checks the link and marks the course Done | Later phase: needs a server to check the link |
| **You record this** | "You record this" | The user ticks sessions in the calendar, or sets their % on a slider for self-paced courses, and uploads a certificate or screenshot to finish | Now, in the prototype |

  - **Connect a course** (drawer button "Connect to auto-track") appears only for providers that support it. The user signs in to the provider, approves sharing course progress only, and can disconnect at any time.
  - **Auto-synced progress can still be corrected** by the user (for example a class attended in person). A manual change is marked "Edited by you".
  - **If a sync stops** (expired login, provider down): the row shows "Sync paused, last update 3 days ago. Reconnect or record it yourself." Progress is never lost.
  - **Finishing a course** in any of the three ways turns the skill on the profile from Missing to Verified, ticks the milestone in tab 6.1, shows ★ on the calendar and grows the landscape.
  - **In the prototype**, every course is "You record this". The connect button is shown on the providers planned for sync with the note "Available in the full version", so the demo never pretends a sync that isn't there.
- **Status rules** (shown as words, plus colour):
  - **On track:** done units are at or above plan for today.
  - **Behind:** one or more sessions missed and not yet made up; the drawer shows the new finish date.
  - **Paused:** the user paused it; sessions are removed from the calendar until resumed.
  - **Blocked:** waiting for budget or a prerequisite; never scheduled.
  - **Done:** proof uploaded.
- **Reminders:**
  - In the full site, "Add to phone calendar" exports every session with a reminder 1 hour before.
  - On the Dashboard, a "Today" card lists today's sessions with **Mark done**.
- **Live:**
  - The progress bar fills when a session is ticked.
  - Uploading proof triggers a small celebration from the character, and the course's element grows in the landscape.

#### Tab 6.3: Change direction

- **Answers:** What if I want to switch paths?
- **Layout:**
```
Why do you want to change? (optional)
 (Too hard) (No time) (Lost interest) (Found a job) (Market changed)

 Switch to: [Pivot: EV charger tech ▼]
 ┌ Carries over ─────────┐ ┌ Doesn't carry over ┐ ┌ New first step ─┐
 │ PPT certificate        │ │ PV safety module    │ │ EV maintenance  │
 │ Electrical safety      │ │                     │ │ short course    │
 └────────────────────────┘ └─────────────────────┘ └─────────────────┘
 Time change: +3 months        [ Switch path ]  Old plan saved as history
```
- **Proves:** §6.5 change direction without losing progress.

#### Tab 6.4: Transition card

- **Answers:** What do I take away?
- **Layout:** the Career Transition Card. It shows:
  - the chosen path and match breakdown
  - the first step (within 4 weeks), with link, cost and HRD Corp status
  - Verified, Hidden and Rusty skill lists
  - missing licences
  - risk under both scenarios
  - exit condition and backup path
  - SDG contribution
  - data version and sources
- **Actions:** download as an image or PDF (in the full site); share.
- **Live:** the card assembles itself section by section when opened.
- **Proves:** §1 deliverable, §11 expected outcome, Domain 1 success criteria.

---

## DASHBOARD (returning user)

#### Tab D.1: Overview

- **Answers:** Where am I, and what's next?
- **Layout:** greeting "Hi Ahmad, you're 25% through your plan", this week's sessions from the calendar (with "Mark done"), each active course's progress bar, next check-in, and the latest proposed update.
- **Proves:** progress good-to-have.

#### Tab D.2: My landscape

- **Answers:** How far have I come?
- **Layout:** the full-width living landscape the user has grown, with their character standing in it. Hover any element to see the milestone that created it ("This solar panel: PPT certificate, 3 March").
- **Live:** turbines, clouds and the character always move gently; a newly earned element grows in on first view.

#### Tab D.3: Updates

- **Answers:** Has anything changed since my last visit?
- **Layout:** a list of proposed changes from new data or course changes, each with "Why this changed", source and date, and **Accept** or **Keep my plan**.
- **Rule:** nothing changes until the user accepts (proposal §6.4).
- **Proves:** good-to-have "automatic re-planning when new AI-trend data changes the recommendations", while keeping humans in charge.

---

## HR TEAM VIEW (later phase)

#### Tab H.1: Team gaps

- **Layout:** a heatmap of job groups × key skills (colour plus pattern plus percentage), with key findings below.
- **Proves:** good-to-have employer and HR view.

#### Tab H.2: Team plan

- **Layout:** suggested training per group, with cost and HRD Corp status, an SDG contribution total for the team, and the note "Suggestions only. Each employee decides their own path."

---

## Requirement coverage check

| Requirement | Tabs |
|---|---|
| M1 Skills intake | 1.1, 2.1, 2.2, 2.3 |
| M2 AI-trend signals with source and date | 3.0 (job history), 3.1, 3.2, 3.3, Sources panel, 4.2 |
| M3 Matching, score and gap | 4.1, Path deep dive (DD.4), 5.1, 5.2 |
| Jobs, competition and growth in Malaysia | Path deep dive DD.1–DD.3 |
| M4 Personalised pathway | 1.2 (time and budget first), 5.3 (goal-based recommended courses from real online and local sources), 5.4, 6.1, 6.2 (calendar and course progress) |
| Time and budget set before any career is shown | 1.2 required, Page 4 entry check |
| M5 SDG mapping that changes choices | 3.3, 4.1 (priority control), 5.1, 5.3 |
| M6 Uncertainty, multiple scenarios | Page 3 header, 3.2, 4.3 |
| "Profile to ranked roles in minutes" | Quick start |
| Prelim core demo: signals change the ranking | **4.2 Time machine** |
| Fairness | 1.1, 1.3, Simulate inspector |
| Human decides | 2.3 confirm, 4.1 choose, 6.3 switch, D.3 accept |
