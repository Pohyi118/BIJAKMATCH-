# BijakMatch: page by page (as shipped)

This file describes the app that is in `site/` today. The original design vision (scroll-story landing, three doors, character customiser, HR view, and so on) is kept in [archive/PAGE_BY_PAGE_vision.md](archive/PAGE_BY_PAGE_vision.md). Treat that file as a wishlist, not as a description of the product.

## Flow

```
Landing (index.html) → Quick start or Home
  1 Profile        About you & Certificates · Time & Budget
  2 Skills         Shift Interview · Three-Track Check · Skills Passport
  3 AI impact      How AI Affects Your World (Job World simulator) · Task AI analysis · Historical automation
  4 Paths          Compare Paths · Time Machine (Releases) · Simulate 24 Months
  5 Courses        Recommended courses in the fixed order (PPT, refresh, gaps, licences)
  6 Plan           Timeline · Calendar & Progress · Change Direction · Transition Card
Home is the dashboard and can be opened at any point.
```

The left rail and the top stepper show the same six steps, in this order. The sample person is Ahmad (production technician, Penang); his avatar is a real photo with the drawn avatar as fallback.

## Gate on Paths

Paths are only ranked once both of these are true; otherwise the page shows what is missing, with a button for each:

| Needed | Counts as done when |
|---|---|
| Skills | at least one kept interview skill, or at least one certificate held |
| Time and budget | the worker has set hours or budget (`S.done.time`); the sample profile counts as set |

## Pages

| Route | Question it answers | Main content |
|---|---|---|
| `#home` | Where am I? | Progress, next step button, paths ranked for the worker, landscape that grows with each finished step |
| `#profile` | Who am I and what can I afford? | Job, state, years, HRD Corp levy, certificates (checked against the SKM / ST / HRD Corp whitelist, with optional server verification); weekly hours, monthly budget, goal, free time blocks |
| `#skills` | What can I actually do? | AI shift interview (typed or spoken, photos, work-video frames, voice signals), live voice skill check, Verified / Hidden / Rusty check, Skills Passport |
| `#impact` | How will AI change my work? | Job World simulator on the worker's own tasks, task AI exposure by year and speed, history of automation in the job |
| `#paths` | Stay, Evolve or Pivot? | 4-part match score (Task overlap, Market demand, Interest, Ease of move) plus SDG bonus, Do-nothing baseline, data releases, 24-month simulation, market analysis for the chosen state |
| `#courses` | What do I study, in what order? | Courses with cost after HRD Corp, hours, subsidy options, licence budget blocker |
| `#plan` | What do I do this month? | Timeline, calendar with rescheduling, change of direction, printable Transition Card with a verifiable QR |

Every number opens a "Why this?" drawer with its source, date and a Real data / Sample / Projection tag.

## Shared shell

Left rail (six steps and the sample person), top bar (user, pause animations), stepper, "Why this?" panel, living landscape strip. Animations can be paused with one switch, and reduced-motion is respected.

## Source layout

Scripts are classic scripts that share one global scope, loaded in this order (see the end of `src/site/index.html`):

`bijak.js` (avatar, sample person) → `app-data.js` → `app-core.js` (helpers, backend health) → `app-state.js` (state shape) → `app-engine.js` (skills, weekly simulation, window, match, ROI) → `app-ui.js` (widgets) → `app-interview.js` → `app-live.js` → `app-store.js` (load / migrate saved state) → `app-views-*.js`, `app-sprout.js` (views) → `app-transition.js` → `app-shell.js` → `app-router.js` → `app-init.js`.

Order matters: a file may only run code at load time that uses things defined in files above it. Functions that read state (`S`) are safe because they run later.
