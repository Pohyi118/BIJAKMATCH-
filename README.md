> [!IMPORTANT]
> ## 📁 Submission Documents & Templates
> **All required submission templates are in the Google Drive folder below. Download them before you start.**
>
> ### 👉 [**OPEN THE GOOGLE DRIVE FOLDER**](https://drive.google.com/drive/folders/1xw7c2aN8N-at8hPEULzkcU76e_FFb0Ef) 👈

---

# BijakMatch (ReRole Green)

> An AI career navigator that turns what a Malaysian TVET worker already does on shift into verified skills, a fair ranking of Stay / Evolve / Pivot green-career paths, and a plan that fits their hours and budget.

---

## Team Information

| Field                  | Details                                     |
| ---------------------- | ------------------------------------------- |
| **Team Name**          | TODO: team name                             |
| **Team Domain**        | Domain 1                                    |
| **SDG Track (1–17)**   | TODO: confirm track (the app tags SDG 4, 7 and 8) |
| **Team Leader**        | TODO                                        |
| **University**         | TODO                                        |
| **Number of Members**  | TODO                                        |

## Links

| Resource          | Link                                           |
| ----------------- | ---------------------------------------------- |
| GitHub Repository | https://github.com/Pohyi118/BIJAKMATCH-        |
| Replit Project    | TODO                                           |
| Live Demo         | TODO                                           |
| RunPod Endpoint   | TODO (created from your RunPod account, see below) |
| Slide Deck        | TODO                                           |
| Demo Video        | TODO                                           |

---

## Overview

### Problem

Technicians, inspectors, electricians and forklift operators in Malaysia are told AI will change their jobs, but have no way to show the skills they already have, see which of their tasks are exposed, or find a green-career move they can afford. Certificates miss most of what they do at work, and career tools ask for a CV they may not have.

### Solution

Bijak, an AI interviewer, talks to the worker about a real shift (typed or spoken, with optional photos and work-video frames) and extracts their skills. Each skill is sorted as **Verified**, **Hidden** (eligible for PPT recognition) or **Rusty** (refresher). The app then scores three paths with a transparent four-part match score, simulates 24 months at the worker's own hours and budget, and ends in a printable Career Transition Card.

### Key Features

- **AI shift interview** — Claude interviews the worker, extracts skills from their own words and checks them live over a voice call.
- **Three-track skill profile** — certificates plus interview evidence become Verified, Hidden and Rusty skills.
- **Transparent match score** — Task Overlap, Market Demand, Interest and Ease of Move, plus an SDG bonus. Age, gender and background are not inputs. Weights live in one versioned file.
- **Honest affordability** — a 24-month weekly simulation flags licences the worker cannot yet afford and lists subsidy options (HRD Corp, PERKESO EIS, PTPK).
- **Market analysis** — cited web research per state; without a key the app shows clearly labelled sample figures.

### Tech Stack

| Layer         | Technology                                              |
| ------------- | ------------------------------------------------------- |
| Frontend      | Plain HTML, CSS and JavaScript (`src/site`)             |
| Backend       | Node.js (`node:http`), Zod (`src/server`)               |
| Database      | None; worker state stays in the browser (localStorage)  |
| AI / Compute  | Anthropic Claude API, LiveKit Cloud voice agent (Deepgram STT, Cartesia TTS) |
| Hosting / Dev | Replit (run config in `.replit`); RunPod: GPU speech-to-text, GLM-5.3, model training |

---

## Project Structure

```
.
├── docs/                    # Specifications, design notes, archived prototypes
│   ├── PAGE_BY_PAGE.md          # Pages, flow and gate as shipped
│   ├── TECHNICAL_SPECIFICATION.md
│   ├── SOLUTION.md
│   ├── design-system/           # Design tokens
│   └── archive/                 # Earlier vision doc and prototypes
├── runpod/
│   ├── handler.py           # RunPod serverless handler: Whisper speech-to-text and task-card classify
│   ├── train/               # Task-card classifier training for a RunPod Pod (export_dataset.mjs, train.py, data/, out/)
│   ├── Dockerfile           # Worker image for the endpoint
│   └── requirements.txt     # Worker dependencies
├── src/
│   ├── site/                # Web app (index.html, app-*.js, shared/ scoring rules)
│   ├── server/              # Node API: interview, market, certificate check, LiveKit token
│   └── agent/               # LiveKit voice agent for the live skill check
├── submission/              # Required submission documents
│   ├── SDC2026_TeamName_Preliminary.pdf      # Preliminary submission
│   ├── SDC2026_TeamName_TechDeclaration.pdf  # Technology declaration
│   ├── SDC2026_TeamName_Replit_POU.pdf       # Replit proof of use
│   └── SDC2026_TeamName_Runpod_POU.pdf       # RunPod proof of use
├── tests/
│   ├── scoring.test.mjs     # Scoring regression tests
│   ├── runpod.test.mjs      # RunPod speech client tests (fake network)
│   └── runpodllm.test.mjs   # GLM-5.3 client tests (fake network)
├── .env.example             # Example environment variables
├── .gitignore
├── .replit                  # Replit run configuration
├── LICENSE
├── package.json             # npm start / npm test
├── requirements.txt         # Python dependencies (RunPod handler)
└── README.md
```

### Architecture

```
Browser (src/site)  ── HTTP JSON ──►  src/server (Node, port 5050) ──► Anthropic API (interview, market search)
   │ localStorage state                       │
   │                                          └─ /api/livekit/token ──► LiveKit Cloud ──► src/agent (voice skill check)
   └─ shared/rules.v1.js + scoring.js: the same score function runs offline in the browser
```

Without API keys the app still runs: an offline interviewer and labelled sample market figures take over.

---

## App flow

Profile → Skills → AI impact → Paths → Courses → Plan, with Home as the dashboard. Paths stay locked until the worker has skills and has set time and budget. Details: [docs/PAGE_BY_PAGE.md](docs/PAGE_BY_PAGE.md).

---

## How to Run

### Option 1 — Run on Replit

1. Import this repository via **Create Repl → Import from GitHub**.
2. Open the **Secrets** tab (🔒) and add the variables from `.env.example` (at least `ANTHROPIC_API_KEY`; add the three `LIVEKIT_*` values for the live voice check).
3. Click **Run**. The `.replit` file installs the server dependencies and starts `src/server/server.mjs`.

### Option 2 — Run Locally

```bash
# 1. Clone the repository
git clone https://github.com/Pohyi118/BIJAKMATCH-.git
cd BIJAKMATCH-

# 2. Configure environment variables
cp .env.example .env            # then fill in your values (the app also runs without keys)

# 3. Start the website and API (http://localhost:5050)
npm start

# 4. Optional, second terminal: live voice skill check agent
npm run agent
```

Needs Node.js 20 or newer. Open `http://localhost:5050/index.html`.

### Run Tests

```bash
npm test
```

---

## How We Use Replit *(Required)*

TODO: describe how the team used Replit (development, hosting, secrets). Only write what the team actually did.

📄 Proof of use: [`submission/SDC2026_TeamName_Replit_POU.pdf`](submission/SDC2026_TeamName_Replit_POU.pdf)

## How We Use RunPod *(Required)*

RunPod does three jobs. Only the Replit server talks to RunPod, so the key never reaches the browser.

| Use | Where | Needs |
| --- | --- | --- |
| **GPU speech-to-text** for voice answers in English and Bahasa Malaysia | `runpod/handler.py` on a Serverless endpoint, called by `POST /api/transcribe`. The interview has a **Record answer (GPU)** button. | `RUNPOD_API_KEY` + `RUNPOD_ENDPOINT_ID` |
| **GLM-5.3** runs the shift interview when no Anthropic key is set | RunPod public endpoint (OpenAI-compatible), called from `src/server/runpodllm.mjs`. Low reasoning effort and a 2,000-token cap per turn. Text only: photos and video frames are not sent. | `RUNPOD_API_KEY` only, no deployment |
| **Model training**: a task-card classifier (answer text to one of 15 task cards) | `runpod/train/` on a GPU Pod | a RunPod Pod |

```
Browser ──audio──► POST /api/transcribe (Replit, src/server) ──► RunPod Serverless endpoint (Whisper, GPU)
Browser ──answer─► POST /api/interview  (Replit, src/server) ──► Claude, or GLM-5.3 on RunPod, or the offline interviewer
Pod ── runpod/train/train.py ──► fine-tuned classifier ──► saved on a RunPod network volume ──► handler.py "classify"
```

**Interview model order:** Claude if `ANTHROPIC_API_KEY` is set; otherwise GLM-5.3 if `RUNPOD_API_KEY` is set; otherwise the offline scripted interviewer. If GLM fails, the offline interviewer answers, so the interview never stops. Whatever model answers, the server checks its output the same way (known job keys, known task cards, score between 0 and 100). Worker answers go to RunPod's hosted GLM when that path is used, so tell workers before they start.

**Set up speech-to-text (Serverless endpoint):**

1. Build and push the image: `docker build -t <dockerhub-user>/bijakmatch-stt:1 runpod/` then `docker push <dockerhub-user>/bijakmatch-stt:1`.
2. In RunPod: **Serverless → New Endpoint**, choose that image, pick a GPU with 16 GB or more, active workers 0, max workers 1.
3. Copy the endpoint ID and create an API key (Settings → API Keys).
4. Add `RUNPOD_API_KEY` and `RUNPOD_ENDPOINT_ID` to Replit Secrets (or `.env` locally) and restart.
5. Check `GET /api/health` shows `"runpodConfigured": true`, then press **Record answer (GPU)** in the interview.

**Train on RunPod (Pod):**

1. Make the data (already committed in `runpod/train/out/`; rerun after editing `runpod/train/data/seed_extra.jsonl`): `node runpod/train/export_dataset.mjs`.
2. In RunPod: **Pods → Deploy**, pick a GPU (a 24 GB card is plenty) and the **RunPod PyTorch** template. Attach a **Network Volume** so the model survives the Pod.
3. In the Pod terminal:

```bash
git clone https://github.com/Pohyi118/BIJAKMATCH-.git && cd BIJAKMATCH-
pip install transformers numpy          # torch is already in the template
python runpod/train/train.py --out /runpod-volume/models/taskcards
```

4. Training prints the validation score for the trained model **and** for the keyword matcher the app uses today, and saves both in `metrics.json` next to the model. Stop the Pod when it finishes so it stops costing credits.
5. The Serverless endpoint mounts the same volume. Send `{"input": {"classify": ["I lock out the breaker first"]}}` to get the matching task cards.

**Honest status:** the dataset is 85 answers (67 train, 18 validation): the scripted interviews plus hand-written English and Bahasa Malaysia lines. On those 18 validation answers the existing keyword matcher scores micro-F1 0.57. That number only shows the pipeline works; real accuracy needs real, consented worker answers. The classifier is not wired into scoring yet. A natural use is a deterministic cross-check on the interview model's task extraction. The training script has not been run on a GPU yet, and the speech endpoint and GLM path have been tested only against a fake server.

📄 Proof of use: [`submission/SDC2026_TeamName_Runpod_POU.pdf`](submission/SDC2026_TeamName_Runpod_POU.pdf)

---

## Core Architecture & Key Features

1. **Three-track skill profile engine** — cross-references recognised credentials (SKM Levels 2 and 3, HRD Corp, DOSH) with a 5-phase workplace shift interview.
2. **Transparent 4-part match score** — 0–100, built from Task Overlap, Market Demand, Worker Interest and Ease of Move, plus a configurable SDG priority bonus. All weights are in [`src/site/shared/rules.v1.js`](src/site/shared/rules.v1.js) and used through one pure function, [`scoring.js`](src/site/shared/scoring.js), with a regression test.
3. **Window score** — whether a target skill window is Long, Narrowing or Closing, from demand, supply and pay changes.
4. **Unified weekly simulation engine** — path comparison, 24-month scrubber and calendar share one deterministic sequence: PPT, rusty refreshers, window gaps, licences.
5. **Licence budget blocker** — flags licences whose fees exceed disposable income within 24 months and lists subsidy options.
6. **Career Transition Card** — print-ready summary of verified skills, missing licences and a 4-week next step.

## Challenges & Learnings

- TODO: what the team found hard and learned.

## Future Improvements

- [ ] Deterministic filter for unstable job news and announcements (design agreed, not built)
- [ ] Fairness checks: input allowlist and gender counterfactual tests in CI
- [ ] Server-side `/api/score` and an audit log
- [ ] Bahasa Malaysia interview and UI
- [ ] Run the training on a GPU Pod, add real consented answers, and use the classifier as a cross-check on task extraction

## Team

| Name        | Role                | GitHub                                   |
| ----------- | ------------------- | ---------------------------------------- |
| TODO        | TODO                | TODO                                     |

---

## Submission Checklist

- [ ] Team name, domain (Domain 1 / Domain 2) and SDG track filled in
- [ ] Slide deck link added
- [ ] Demo video link added
- [ ] Replit used, with proof of use in `submission/`
- [ ] RunPod used, with proof of use in `submission/`
- [ ] Preliminary submission completed (`SDC2026_TeamName_Preliminary.pdf`)
- [ ] Technology declaration completed (`SDC2026_TeamName_TechDeclaration.pdf`)
- [ ] Submission files renamed with your team name (replace `TeamName`)
- [ ] "How to Run" steps verified
- [ ] No API keys or secrets committed to the repository

## License

This project is licensed under the [Apache License 2.0](LICENSE).
