# BijakMatch (ReRole Green)

> **AI-Powered Green Career Pathway & Reskilling Navigator for Malaysian TVET Workers**  
> Built for the National TVET & Automation Resilience Challenge (Domain 1).

---

## 🚀 Quick Start (Running Locally)

The active application is located entirely inside the [`site/`](file:///c:/Users/User/Documents/REROLE/site) directory.

### Launch Local Server
Run any static HTTP server from the `site/` folder:

```bash
# Using Python
cd site
python -m http.server 5050

# Using Node / npx
npx serve site -p 5050
```

### Run with the AI Shift Interview and Live Skill Check (recommended)

1. **Shift Interview:** Claude interviews the worker (age, job, years, a real shift, what they want next), extracts their skills and estimates their experience level from their answers plus voice signals (pace, filler words, pauses). The worker can also turn on the **camera** and attach a photo to an answer (a certificate, a meter reading, a tool) for Claude to look at. Photos stay in memory only, leave the device only on Send, and are never used to judge the person's looks.
   - **Work videos:** the worker can upload a clip of their daily work. The browser takes 6–10 timestamped frames (the video file never leaves the device); Claude reviews them, lists what it saw with clickable timestamps and safety notes, and asks follow-up questions about it.
   - **Market in your state:** an AI market analysis button researches job opportunities and competition for the green roles in the chosen state with live web search, citing every source. Without a key it shows BijakMatch sample figures, labelled Sample.
2. **Live Skill Check:** once skills are extracted, the worker can join a real-time voice call on **LiveKit Cloud**. A voice agent asks them to walk through each skill and marks it *confirmed*, *partly shown* or *not confirmed*. The results appear on the task cards and in the Skills Passport.

Set up once: copy `.env.example` to `.env` and fill in your Anthropic key and your LiveKit Cloud project URL, key and secret (cloud.livekit.io → Settings → API keys). Then run two terminals:

```bash
# Terminal 1: website + API (http://localhost:5050)
cd server
npm install
npm start

# Terminal 2: live voice agent (connects out to LiveKit Cloud)
cd agent
npm install
npm run dev
```

The voice agent uses LiveKit Inference for speech (Deepgram Nova-3 in multilingual mode for English and Malay, Cartesia Sonic 3.5 for the voice) and Claude (`claude-opus-4-8`, change it with `BIJAK_VOICE_MODEL`) to run the conversation. Typed or spoken interview answers work in Chrome or Edge. Without a key, or with a plain static server, the interview falls back to a scripted offline interviewer, and the live call shows a setup message.

Open your browser to:
- **Landing Page:** [http://localhost:5050/index.html](http://localhost:5050/index.html)
- **App Shell (SPA):** [http://localhost:5050/app.html](http://localhost:5050/app.html)
- **Direct to Path Comparison:** [http://localhost:5050/app.html#paths](http://localhost:5050/app.html#paths)

---

## 📁 Repository Structure

```text
REROLE/
├── README.md                      # This guide
│
├── .env.example                   # Keys for Claude + LiveKit Cloud (copy to .env)
│
├── 📁 server/                     # Node server: serves site/, /api/interview (Claude), /api/livekit/token
│   └── server.mjs
│
├── 📁 agent/                      # LiveKit Cloud voice agent for the live skill check
│   └── agent.mjs
│
├── 📁 site/                       # 🌟 THE ACTIVE PRODUCTION APP
│   ├── index.html                 # Animated scroll landing page
│   ├── app.html                   # Core 3-stage application shell
│   ├── app.js                     # Unified application logic & simulation engine
│   ├── app-data.js                # v2 Dataset (NOSS cards, certs whitelist, snapshots)
│   ├── bijak.js                   # Character avatar rig & sample people profiles
│   ├── bijak.css                  # Design system tokens and styles
│   └── photos/                    # Real Malaysian workplace & solar farm photos
│
├── 📁 docs/                       # 📚 DOCUMENTATION & SPECIFICATIONS
│   ├── TECHNICAL_SPECIFICATION.md # Definitive English engineering & algorithm spec
│   ├── PAGE_BY_PAGE.md            # Detailed UI/UX wireframes & interaction spec
│   ├── SOLUTION.md                # Visual aesthetics, character rig & design tokens
│   ├── ReRole Green 提案.pdf       # Original competition proposal (Chinese)
│   └── Domain 1.pdf               # Competition challenge brief & rubric
│
└── 📁 archive/                    # 📦 LEGACY / HISTORICAL PROTOTYPES
    ├── redesign/                  # Intermediate static mockups (01, 02, 03)
    └── web/                       # Original v0 Chinese prototype
```

---

## 🧩 Core Architecture & Key Features

1. **Three-Track Skill Profile Engine:**  
   Cross-references recognized credentials (SKM Levels 2 & 3, HRD Corp, DOSH) against a 5-phase workplace shift interview to categorize skills into **Verified**, **Hidden** (targets PPT certification), and **Rusty** (eligible for 50% refresher courses).
2. **Transparent 4-Part Match Score:**  
   $0 - 100$ score broken down into **Task Overlap**, **Market Demand**, **Worker Interest**, and **Ease of Move**, plus a configurable **SDG Priority Bonus** (SDG 4 & 8 vs SDG 7).
3. **Window Score (Timing Dynamics):**  
   Calculates whether a target skill window is *Long*, *Narrowing*, or *Closing* using $w_d \cdot \Delta\text{Demand} - w_s \cdot \Delta\text{Supply} + w_p \cdot \Delta\text{Premium}$.
4. **Unified Weekly Simulation Engine:**  
   Powers path comparison, timeline projection, 24-month scrubber, and interactive calendar with a deterministic 4-step sequence: **PPT** $\rightarrow$ **Rusty Refreshers** $\rightarrow$ **Window Gaps** $\rightarrow$ **Licences**.
5. **Honest Licence Budget Blocker:**  
   Detects when statutory licence fees exceed disposable income within 24 months, visually flags broken bridges, and provides real government subsidy options (HRD Corp employer levy, PERKESO EIS, PTPK skills loans).
6. **Career Transition Card:**  
   Print-ready (`window.print()`) standardized passport summarizing the worker's verified skills, missing licences, 4-week actionable next step, and risk mitigation plan.
