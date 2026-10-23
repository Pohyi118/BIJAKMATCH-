/* BijakMatch dataset v2. Rebuilt to follow proposal flow (ReRole Green 提案.pdf).
   Sample prototype dataset anchored to Malaysian occupational standards (NOSS) and real provider types. */
const DATA = (() => {
  // e: exposure to AI at a fast pace in [2026, 2028, 2030]; steady pace uses 70% of it
  const JOBS = {
    tech: {
      n: "Production technician",
      tasks: [
        { n: "Parameter logging", e: [.45, .65, .82] },
        { n: "Equipment start-up check", e: [.35, .55, .72] },
        { n: "Fault diagnosis", e: [.20, .32, .45] },
        { n: "Machine changeover", e: [.15, .25, .35] },
        { n: "Safety isolation", e: [.05, .08, .12] },
        { n: "Wiring, SKM Level 2", e: [.04, .06, .10] }
      ],
      interview: [
        { phase: "Start of shift", q: "When you reach the line in the morning, what do you do first?", a: "I check the machines are safe to start and read the night shift's handover notes.", cards: ["Equipment start-up check", "Shift handover notes"] },
        { phase: "Normal running", q: "When the machine runs normally, what do you watch? How often do you write it down?", a: "I monitor temperature and pressure parameters and record them in the log every hour.", cards: ["Parameter logging"] },
        { phase: "When something goes wrong", q: "Last time a machine alarmed and stopped the line, how did you find the cause?", a: "I read the fault code on the inverter, checked the sensor wiring and found a loose cable.", cards: ["Fault diagnosis"],
          follow: { q: "You mentioned the inverter. Do you read its fault codes yourself?", a: "Yes, I look them up in the manual and test the drive parameters.", cards: ["Inverter fault diagnosis"] } },
        { phase: "Safety", q: "Before you open an electrical cabinet, what do you do first?", a: "Switch off, lock it, tag it with my card, and use a meter to test that it is completely dead.", cards: ["Safety isolation", "Multimeter testing"] },
        { phase: "Working with others", q: "Who comes to you for help? What do you teach new staff?", a: "New operators come to me. I teach them safe machine start-up and how to clear jams.", cards: ["Training others"] }
      ]
    },
    qc: {
      n: "QC inspector",
      tasks: [
        { n: "Visual inspection", e: [.50, .70, .85] },
        { n: "Measurement records", e: [.40, .60, .78] },
        { n: "Sampling plans", e: [.20, .30, .42] },
        { n: "Root-cause checks", e: [.12, .20, .30] },
        { n: "Safety isolation", e: [.06, .10, .15] }
      ],
      interview: [
        { phase: "Start of shift", q: "When you reach the QC station in the morning, what do you do first?", a: "I calibrate the micrometers and inspect the first batch off line 2.", cards: ["Quality visual inspection", "Equipment start-up check"] },
        { phase: "Normal running", q: "When parts arrive, how do you verify them?", a: "I take samples according to the lot size, measure dimensions, and log deviations.", cards: ["Quality visual inspection", "Parameter logging"] },
        { phase: "When something goes wrong", q: "When a defect trend spikes, what do you do?", a: "I stop the lot, isolate the suspect pallet, and perform root-cause checks with the tech.", cards: ["Fault diagnosis"] },
        { phase: "Safety", q: "What safety procedures do you follow around running conveyor stations?", a: "I confirm the safety guard interlocks and never reach past the light curtain.", cards: ["Safety isolation"] },
        { phase: "Working with others", q: "Who do you communicate quality issues with?", a: "I review rejection reports with line supervisors and train junior inspectors.", cards: ["Training others"] }
      ]
    },
    elec: {
      n: "Maintenance electrician",
      tasks: [
        { n: "Meter reading", e: [.40, .60, .75] },
        { n: "Maintenance logs", e: [.35, .55, .70] },
        { n: "Fault diagnosis", e: [.15, .25, .35] },
        { n: "Panel wiring", e: [.05, .08, .12] },
        { n: "Safety isolation", e: [.04, .06, .10] }
      ],
      interview: [
        { phase: "Start of shift", q: "What is your morning routine?", a: "I review the overnight breakdown work orders and test substation batteries.", cards: ["Equipment start-up check", "Shift handover notes"] },
        { phase: "Normal running", q: "During normal shift hours, what maintenance work do you perform?", a: "I inspect distribution switchboards, thermal-scan breakers, and record load readings.", cards: ["Multimeter testing", "Parameter logging"] },
        { phase: "When something goes wrong", q: "When a main motor trip occurs, how do you trace it?", a: "I test continuity with a multimeter, check the PLC ladder status, and inspect drive fault codes.", cards: ["Fault diagnosis", "Inverter fault diagnosis", "Multimeter testing"] },
        { phase: "Safety", q: "What is your lock-out procedure on high-voltage panels?", a: "Isolate main breaker, apply padlock, verify zero voltage with an approved tester, and ground.", cards: ["Safety isolation"] },
        { phase: "Working with others", q: "How do you coordinate with plant technicians?", a: "I conduct briefings before major shutdown overhauls and mentor apprentices.", cards: ["Training others"] }
      ]
    },
    fork: {
      n: "Forklift operator",
      tasks: [
        { n: "Stock counting", e: [.50, .70, .85] },
        { n: "Route planning", e: [.40, .60, .75] },
        { n: "Loading and unloading", e: [.20, .35, .50] },
        { n: "Equipment start-up check", e: [.10, .18, .28] },
        { n: "Safety isolation", e: [.05, .08, .12] }
      ],
      interview: [
        { phase: "Start of shift", q: "What do you do before operating your vehicle?", a: "I perform the 12-point pre-use checklist, brake test, and check hydraulic fluid.", cards: ["Equipment start-up check"] },
        { phase: "Normal running", q: "How do you handle incoming goods?", a: "I scan inbound pallets, stage them in high-bay racking, and record warehouse locations.", cards: ["Forklift safe handling", "Parameter logging"] },
        { phase: "When something goes wrong", q: "What happens if a rack sensor reports a stack obstruction?", a: "I halt the aisle, dismount safely, and diagnose if the pallet or sensor bracket shifted.", cards: ["Fault diagnosis"] },
        { phase: "Safety", q: "What safety rules do you enforce at blind crossings?", a: "Honk horn at intersections, keep forks 100mm off the ground, and respect pedestrian walkway barriers.", cards: ["Safety isolation"] },
        { phase: "Working with others", q: "How do you coordinate with the receiving team?", a: "We sync on the warehouse management terminal and I train trainee drivers on stack limits.", cards: ["Training others"] }
      ]
    },
    admin: {
      n: "Admin clerk",
      tasks: [
        { n: "Data entry", e: [.60, .80, .92] },
        { n: "Filing and records", e: [.50, .70, .85] },
        { n: "Scheduling", e: [.30, .45, .60] },
        { n: "Customer calls", e: [.15, .25, .35] },
        { n: "Solving staff problems", e: [.05, .10, .15] }
      ],
      interview: [
        { phase: "Start of shift", q: "What is your morning task list?", a: "I review the inbox, extract purchase orders, and verify billing entries.", cards: ["Parameter logging"] },
        { phase: "Normal running", q: "What systems do you operate during the day?", a: "I update inventory spreadsheets, process vendor invoices, and schedule delivery slots.", cards: ["Parameter logging"] },
        { phase: "When something goes wrong", q: "When an invoice mismatch or dispatch discrepancy happens?", a: "I audit delivery notes, trace shipping manifests, and call the warehouse supervisor.", cards: ["Fault diagnosis"] },
        { phase: "Safety", q: "What office and document compliance do you observe?", a: "I maintain confidential archives and observe ergonomics and fire exit protocols.", cards: ["Safety isolation"] },
        { phase: "Working with others", q: "How do you support front-line operations?", a: "I guide department reps on digital form submissions and resolve vendor queries.", cards: ["Training others"] }
      ]
    },
    student: {
      n: "TVET student",
      tasks: [
        { n: "Lab reports", e: [.30, .45, .60] },
        { n: "Calculations", e: [.30, .50, .65] },
        { n: "Reading drawings", e: [.10, .18, .28] },
        { n: "Wiring, SKM Level 2", e: [.04, .06, .10] },
        { n: "Team projects", e: [.04, .06, .10] }
      ],
      interview: [
        { phase: "Start of shift", q: "When you arrive at the TVET workshop?", a: "I inspect my personal PPE, check multimeter batteries, and review today's wiring schematic.", cards: ["Equipment start-up check", "Reading drawings"] },
        { phase: "Normal running", q: "What practical assignments are you executing?", a: "I bend conduits, wire relay contactors on the training panel, and test circuits.", cards: ["Wiring, SKM Level 2", "Multimeter testing"] },
        { phase: "When something goes wrong", q: "When your test bench breaker trips during testing?", a: "I trace the schematic, test continuity across contactor terminals, and fix short circuits.", cards: ["Fault diagnosis", "Reading drawings"] },
        { phase: "Safety", q: "What isolation rule did your instructor drill into you?", a: "Always lock off the main supply, test with a calibrated meter before touching any conductor.", cards: ["Safety isolation", "Multimeter testing"] },
        { phase: "Working with others", q: "How do you collaborate in practical groups?", a: "I divide assembly tasks, verify group members' wiring connections, and explain relay diagrams.", cards: ["Training others"] }
      ]
    }
  };

  const AUTO_AT = .65, ASSIST_AT = .30;
  const fate = e => e >= AUTO_AT ? "ai" : e >= ASSIST_AT ? "help" : "you";
  const FATE = { ai: "Done by AI", help: "AI helps, you lead", you: "Stays with you" };

  // Task dictionary: about 15 standard cards with keywords and NOSS unit codes
  const TASKCARDS = [
    { n: "Equipment start-up check", kw: ["start", "machine", "check", "morning", "inspect", "prep", "pre-use", "routine", "power"], noss: "EE-021-2:2012 (code to verify)" },
    { n: "Shift handover notes", kw: ["handover", "notes", "night shift", "logbook", "reading notes", "work orders"], noss: "Z-009-2:2015 (code to verify)" },
    { n: "Parameter logging", kw: ["parameter", "log", "logging", "temperature", "pressure", "meter", "hourly", "record", "data", "spreadsheets", "invoices"], noss: "EE-021-2:2012 (code to verify)" },
    { n: "Fault diagnosis", kw: ["fault", "alarm", "stopped", "troubleshoot", "cause", "broken", "diagnose", "defect", "mismatch", "trace"], noss: "EE-021-3:2012 (code to verify)" },
    { n: "Inverter fault diagnosis", kw: ["inverter", "drive", "fault code", "vfd", "inverter manual", "frequency drive", "motor trip"], noss: "EE-320-3:2012 (code to verify)" },
    { n: "Safety isolation", kw: ["isolate", "switch off", "lock", "tag", "loto", "lockout", "dead", "safety cabinet", "breaker", "guard", "interlock"], noss: "EE-021-2:2012 (code to verify)" },
    { n: "Multimeter testing", kw: ["multimeter", "voltage", "current", "testing", "continuity", "probe", "meter", "tester"], noss: "EE-021-2:2012 (code to verify)" },
    { n: "Wiring, SKM Level 2", kw: ["wiring", "cable", "wire", "conduit", "panel wiring", "circuits", "cabling"], noss: "EE-021-2:2012 (code to verify)" },
    { n: "Reading drawings", kw: ["drawings", "schematic", "blueprint", "diagram", "circuit diagram", "relay diagram"], noss: "EE-021-2:2012 (code to verify)" },
    { n: "PLC basics", kw: ["plc", "ladder logic", "controller", "programmable", "automation", "ladder"], noss: "EE-021-3:2012 (code to verify)" },
    { n: "Sensor troubleshooting", kw: ["sensor", "proximity", "photoelectric", "transducer", "bracket"], noss: "EE-021-3:2012 (code to verify)" },
    { n: "Training others", kw: ["train", "teach", "new staff", "operator", "show them", "guide", "mentor", "briefing", "apprentice"], noss: "Z-009-3:2015 (code to verify)" },
    { n: "Machine changeover", kw: ["changeover", "tooling", "setup", "jig", "fixture"], noss: "EE-021-2:2012 (code to verify)" },
    { n: "Quality visual inspection", kw: ["visual inspection", "defect", "sampling", "qc", "calibrate", "micrometer", "dimensions"], noss: "QC-010-2:2014 (code to verify)" },
    { n: "Forklift safe handling", kw: ["forklift", "pallet", "stacking", "loading", "unloading", "high-bay", "aisle"], noss: "LOG-011-2:2013 (code to verify)" }
  ];

  // Whitelist of recognised certificates and the skills each certifies
  const CERTS = {
    "SKM Level 2, electrical": {
      n: "SKM Level 2: Electrical Installation & Maintenance",
      skills: ["Wiring, SKM Level 2", "Multimeter testing", "Reading drawings", "Safety isolation"],
      hoursCredit: 40
    },
    "SKM Level 3, electrical": {
      n: "SKM Level 3: Electrical Industrial Automation",
      skills: ["Wiring, SKM Level 2", "Multimeter testing", "Reading drawings", "Safety isolation", "PLC basics", "Sensor troubleshooting", "Fault diagnosis"],
      hoursCredit: 80
    },
    "HRD Corp short course: Electrical Safety": {
      n: "HRD Corp Certified: Electrical Lockout / Tagout & OSH",
      skills: ["Safety isolation", "OSH safety induction"],
      hoursCredit: 16
    },
    "Forklift operator permit": {
      n: "DOSH Certified Forklift Operator Permit",
      skills: ["Forklift safe handling", "Equipment start-up check"],
      hoursCredit: 24
    }
  };

  const STAY_ROLE = {
    tech: "Line technician with automation",
    qc: "QC analyst with vision systems",
    elec: "Maintenance lead, smart systems",
    fork: "Warehouse systems operator",
    admin: "Digital records officer",
    student: "Production technician"
  };

  // Base task overlap between current job and each path (0 to 1)
  const TASKOVER = {
    tech: { stay: .85, evolve: .62, pivot: .52 },
    qc: { stay: .80, evolve: .45, pivot: .40 },
    elec: { stay: .75, evolve: .82, pivot: .78 },
    fork: { stay: .80, evolve: .35, pivot: .45 },
    admin: { stay: .80, evolve: .25, pivot: .25 },
    student: { stay: .60, evolve: .68, pivot: .62 }
  };

  // Paths specification
  const PATHS = {
    stay: {
      name: "Stay",
      sub: "Stay and adapt",
      photo: "photos/factory-line.webp",
      alt: "Worker on a factory line",
      suit: "#4F74C8",
      tool: "tablet",
      wx: "cloud",
      hours: 60,
      cost: 600,
      pay: [2400, 3200],
      demand: { moderate: .52, accelerated: .36 },
      goalFit: { income: .50, quick: .95 },
      sdg: [8, 9],
      sdgWhy: "8.2 more productive factory work with automation; 9.2 modern manufacturing",
      skills: [
        ["OSH safety induction", "law"],
        ["PLC basics", "most"],
        ["Sensor troubleshooting", "most"],
        ["Data dashboards", "most"],
        ["Lean and 5S", "nice"],
        ["Training others", "nice"]
      ],
      gates: [],
      windowTask: "Working with automation cells",
      exit: "Your line automates logging and changeover before you finish PLC basics.",
      backup: "evolve",
      jobs: [["Penang", 140], ["Selangor", 120], ["Johor", 90], ["Kedah", 55], ["Perak", 40]],
      seekers: 9,
      growth: "Flat to slow",
      risk: "Higher"
    },
    evolve: {
      name: "Evolve",
      sub: "Solar PV technician",
      photo: "photos/rooftop-crew.webp",
      alt: "Crew installing solar panels on a rooftop",
      suit: "#1E5A3A",
      tool: "panel",
      wx: "sun",
      hours: 200,
      cost: 3900,
      pay: [2800, 4500],
      demand: { moderate: .82, accelerated: .88 },
      goalFit: { income: .92, quick: .52 },
      sdg: [7, 4, 8, 13],
      sdgWhy: "7.2 renewable energy expansion; 4.4 high-value green skills; 8.5 decent employment; 13 climate mitigation",
      skills: [
        ["Electrical competency (ST)", "law"],
        ["GCPV certificate", "law"],
        ["Inverter fault diagnosis", "most"],
        ["Working at height", "most"],
        ["Safety isolation", "most"],
        ["Reading drawings", "nice"]
      ],
      gates: ["Electrical competency (ST)", "GCPV certificate"],
      windowTask: "Inverter fault diagnosis",
      exit: "You can't pay for the GCPV exam within 12 months, even with employer support.",
      backup: "stay",
      jobs: [["Selangor", 120], ["Johor", 85], ["Penang", 60], ["Kedah", 45], ["Sabah", 30]],
      seekers: 4,
      growth: "Growing fast",
      risk: "Low"
    },
    pivot: {
      name: "Pivot",
      sub: "EV charger technician",
      photo: "photos/ev-charging-tnb.webp",
      alt: "Electric vehicle charging station at TNB Research, Kajang",
      suit: "#D2694D",
      tool: "plug",
      wx: "part",
      hours: 180,
      cost: 3000,
      pay: [2600, 4200],
      demand: { moderate: .72, accelerated: .80 },
      goalFit: { income: .80, quick: .45 },
      sdg: [7, 11, 9, 4],
      sdgWhy: "7 clean transport electrification; 11.2 cleaner city transit; 9.4 modernized power infrastructure",
      skills: [
        ["Electrical competency (ST)", "law"],
        ["EV charger installation", "most"],
        ["Safety isolation", "most"],
        ["Fault diagnosis", "most"],
        ["Customer service", "nice"],
        ["App-based job tickets", "nice"]
      ],
      gates: ["Electrical competency (ST)"],
      windowTask: "EV charger installation",
      exit: "EV charger openings in your state stay under 20 in two data releases in a row.",
      backup: "evolve",
      jobs: [["Selangor", 70], ["Kuala Lumpur", 55], ["Johor", 35], ["Penang", 30], ["Melaka", 15]],
      seekers: 6,
      growth: "Growing fast, smaller base",
      risk: "Some"
    }
  };

  // Window score weights: 0.5 * deltaDemand - 0.3 * deltaSupply + 0.2 * deltaPremium
  const W = { d: .5, s: .3, p: .2 };
  const windowOf = ([d, sup, pr]) => W.d * d - W.s * sup + W.p * pr;
  const windowLabel = v => v >= .20 ? "Long" : v >= 0 ? "Narrowing" : "Closing";
  const GROUP = { law: "Required by law", most: "Most asked", nice: "Good to have" };

  // SDG Priorities for ranking reordering
  const SDGFIT = {
    sdg4_8: {
      name: "SDG 4 & 8: Decent Work & Skills",
      desc: "Prioritizes immediate decent job creation and TVET upskilling pathways.",
      stay: .75,
      evolve: .85,
      pivot: .70
    },
    sdg7: {
      name: "SDG 7: Clean & Affordable Energy",
      desc: "Prioritizes carbon-neutral power transition (Solar PV & EV infrastructure).",
      stay: .25,
      evolve: 1.00,
      pivot: .90
    }
  };

  // Honest Subsidy Options when budget blocks a licence
  const SUBSIDIES = [
    {
      id: "hrd",
      title: "HRD Corp via Employer (Levy Grant)",
      amount: "Up to 100% course fee covered",
      desc: "If your employer is registered with HRD Corp, fees are claimed directly from the employer levy pool.",
      badge: "Employer funded",
      check: "Ask HR if company pays levy"
    },
    {
      id: "eis",
      title: "PERKESO EIS Training Allowance",
      amount: "Up to RM4,000 allowance + course fee",
      desc: "For workers facing automation disruption or retrenchment risk under the Employment Insurance System.",
      badge: "Govt allowance",
      check: "Check PERKESO EIS portal"
    },
    {
      id: "ptpk",
      title: "PTPK Skills Development Loan",
      amount: "Low-interest tuition + RM400/mo living grant",
      desc: "Skills Development Fund Corporation loan for accredited public & private TVET programmes (SKM & ST).",
      badge: "Low-interest loan",
      check: "Check PTPK portal eligibility"
    }
  ];

  // Course catalogue: includes intake week, prerequisites, HRD Corp claimable status, refreshable flag
  const COURSES = [
    {
      id: "ppt",
      step: 1,
      short: "PPT evidence",
      n: "Recognition of Prior Achievement (PPT) for SKM",
      by: "JPK-accredited assessment centre (example)",
      hours: 20,
      fee: 400,
      intakeWeek: 1,
      mode: "Portfolio assessment of your past work",
      track: "cert",
      skills: ["Wiring, SKM Level 2", "Safety isolation", "Multimeter testing"],
      hrd: "Claimable (example)",
      prereq: "Evidence of workplace tasks",
      refreshable: false,
      photo: "photos/electrician-panel.webp",
      sdg: [4, 10],
      why: "Validates your unwritten workplace experience into an official government SKM certificate."
    },
    {
      id: "safety",
      step: 2,
      short: "Safety refresher",
      n: "Electrical safety and isolation refresher",
      by: "TVET college (example)",
      hours: 12,
      fee: 250,
      intakeWeek: 1,
      mode: "Weekend practical class",
      track: "cert",
      skills: ["Safety isolation"],
      hrd: "Claimable (example)",
      prereq: "None",
      refreshable: true,
      photo: "photos/assembly.webp",
      sdg: [8, 4],
      why: "Refreshes high-voltage lockout/tagout procedures to eliminate safety hazards."
    },
    {
      id: "drawings",
      step: 2,
      short: "Drawings refresh",
      n: "Reading electrical single-line & schematic drawings",
      by: "edX / TVET online (example)",
      hours: 12,
      fee: 0,
      intakeWeek: 1,
      mode: "Online, self-paced",
      track: "auto",
      skills: ["Reading drawings"],
      hrd: "Free",
      prereq: "None",
      refreshable: true,
      photo: "photos/electrician-panel.webp",
      sdg: [4],
      why: "Ensures you can confidently interpret modern electrical schematics without a full retraining course."
    },
    {
      id: "pvbasics",
      step: 3,
      short: "Inverter checks",
      n: "Solar PV inverter checks & fault diagnostics",
      by: "OpenLearning / SEDA training partner (example)",
      hours: 16,
      fee: 150,
      intakeWeek: 2,
      mode: "Online & workshop demo",
      track: "auto",
      skills: ["Inverter fault diagnosis"],
      hrd: "Claimable (example)",
      prereq: "Electrical basics",
      refreshable: false,
      photo: "photos/rooftop-solar.webp",
      sdg: [7],
      why: "Closing the gap on solar inverter fault isolation gives you the biggest market window score boost."
    },
    {
      id: "height",
      step: 3,
      short: "Height safety",
      n: "Working at height & rooftop safety",
      by: "NIOSH-accredited trainer (example)",
      hours: 8,
      fee: 350,
      intakeWeek: 3,
      mode: "1-day practical harness drill",
      track: "cert",
      skills: ["Working at height"],
      hrd: "Claimable (example)",
      prereq: "None",
      refreshable: false,
      photo: "photos/rooftop-crew.webp",
      sdg: [8],
      why: "Compulsory safety passport for rooftop commercial and residential PV array installations."
    },
    {
      id: "st",
      step: 4,
      short: "ST competency",
      n: "Electrical Competency Certificate (ST wireman / chargeman prep)",
      by: "Suruhanjaya Tenaga-registered institute (example)",
      hours: 80,
      fee: 1500,
      intakeWeek: 6,
      mode: "Weekend classes & ST board examination",
      track: "cert",
      skills: ["Electrical competency (ST)"],
      hrd: "To be confirmed",
      prereq: "SKM Electrical Level 2 or 3 years electrical work",
      refreshable: false,
      photo: "photos/electrician-panel.webp",
      sdg: [8, 4],
      why: "Statutory licence required by Malaysian law (Electricity Supply Act) to sign off wiring and installations."
    },
    {
      id: "gcpv",
      step: 4,
      short: "GCPV",
      n: "Grid-Connected Photovoltaic (GCPV) Systems Certificate",
      by: "SEDA-registered training provider (example)",
      hours: 60,
      fee: 1800,
      intakeWeek: 16,
      mode: "Intensive 5-day course + SEDA exam",
      track: "cert",
      skills: ["GCPV certificate"],
      hrd: "To be confirmed",
      prereq: "Electrical Competency (ST) or recognised electrical cert",
      refreshable: false,
      photo: "photos/floating-solar-upm.webp",
      sdg: [7, 4],
      why: "SEDA legal requirement for technicians commissioning grid-connected solar installations in Malaysia."
    },
    {
      id: "plc",
      step: 3,
      short: "PLC basics",
      n: "Programmable Logic Controller (PLC) fundamentals",
      by: "Coursera / TVET college (example)",
      hours: 20,
      fee: 120,
      intakeWeek: 2,
      mode: "Online, self-paced & lab simulation",
      track: "auto",
      skills: ["PLC basics"],
      hrd: "Free to audit",
      prereq: "None",
      refreshable: false,
      photo: "photos/cutting-machine.webp",
      sdg: [9, 4],
      why: "Essential foundation for troubleshooting automated factory line sensors and actuators."
    },
    {
      id: "sensor",
      step: 3,
      short: "Sensors",
      n: "Industrial sensor troubleshooting & calibration",
      by: "TVET college (example)",
      hours: 16,
      fee: 300,
      intakeWeek: 4,
      mode: "Evening lab class",
      track: "self",
      skills: ["Sensor troubleshooting"],
      hrd: "Claimable (example)",
      prereq: "None",
      refreshable: false,
      photo: "photos/cutting-machine.webp",
      sdg: [9],
      why: "Helps you maintain vision systems and photoelectric arrays on modernized manufacturing lines."
    },
    {
      id: "dash",
      step: 3,
      short: "Dashboards",
      n: "Industrial IoT data dashboards for the shop floor",
      by: "edX (example)",
      hours: 10,
      fee: 0,
      intakeWeek: 2,
      mode: "Online, self-paced",
      track: "auto",
      skills: ["Data dashboards"],
      hrd: "Free",
      prereq: "None",
      refreshable: false,
      photo: "photos/factory-line.webp",
      sdg: [9],
      why: "Allows you to interpret real-time machine telemetry and predictive maintenance feeds."
    },
    {
      id: "lean",
      step: 3,
      short: "Lean 5S",
      n: "Lean manufacturing and 5S operational excellence",
      by: "Coursera (example)",
      hours: 8,
      fee: 0,
      intakeWeek: 1,
      mode: "Online, self-paced",
      track: "auto",
      skills: ["Lean and 5S"],
      hrd: "Free to audit",
      prereq: "None",
      refreshable: false,
      photo: "photos/assembly.webp",
      sdg: [9, 12],
      why: "Boosts supervisory qualifications for shop-floor continuous improvement."
    },
    {
      id: "osh",
      step: 1,
      short: "OSH induction",
      n: "Occupational Safety & Health (OSH) induction",
      by: "NIOSH-accredited trainer (example)",
      hours: 8,
      fee: 200,
      intakeWeek: 1,
      mode: "1-day workshop",
      track: "cert",
      skills: ["OSH safety induction"],
      hrd: "Claimable (example)",
      prereq: "None",
      refreshable: false,
      photo: "photos/factory-line.webp",
      sdg: [8],
      why: "Satisfies statutory safety induction standards for plant and contractor entry."
    },
    {
      id: "evc",
      step: 4,
      short: "EV chargers",
      n: "EV Charger (AC & DC Fast) Installation and Maintenance",
      by: "TVET college / Industry partner (example)",
      hours: 40,
      fee: 1200,
      intakeWeek: 8,
      mode: "Weekend classes & hands-on station commissioning",
      track: "cert",
      skills: ["EV charger installation"],
      hrd: "To be confirmed",
      prereq: "Electrical Competency (ST) recommended",
      refreshable: false,
      photo: "photos/ev-charging-tnb.webp",
      sdg: [7, 11],
      why: "Targeted technical credential covering OCPP networking, load balancing, and high-voltage DC protection."
    },
    {
      id: "fault",
      step: 3,
      short: "Fault finding",
      n: "Industrial electrical fault diagnostics methods",
      by: "TVET college (example)",
      hours: 16,
      fee: 300,
      intakeWeek: 3,
      mode: "Evening workshop",
      track: "self",
      skills: ["Fault diagnosis"],
      hrd: "Claimable (example)",
      prereq: "None",
      refreshable: false,
      photo: "photos/electrician-panel.webp",
      sdg: [9],
      why: "Systematic root-cause methodology to trace electrical faults safely and swiftly."
    },
    {
      id: "service",
      step: 3,
      short: "Customer service",
      n: "Customer communication & digital service tickets",
      by: "OpenLearning (example)",
      hours: 6,
      fee: 0,
      intakeWeek: 1,
      mode: "Online, self-paced",
      track: "auto",
      skills: ["Customer service"],
      hrd: "Free",
      prereq: "None",
      refreshable: false,
      photo: "photos/ev-charging-tnb.webp",
      sdg: [8],
      why: "Prepares field technicians for front-facing commercial charger and residential solar service visits."
    },
    {
      id: "tickets",
      step: 3,
      short: "Job tickets",
      n: "Field service & mobile dispatch ticket apps",
      by: "OpenLearning (example)",
      hours: 4,
      fee: 0,
      intakeWeek: 1,
      mode: "Online, self-paced",
      track: "auto",
      skills: ["App-based job tickets"],
      hrd: "Free",
      prereq: "None",
      refreshable: false,
      photo: "photos/ev-charging-tnb.webp",
      sdg: [9],
      why: "Familiarizes technicians with modern mobile dispatching and SLA logging applications."
    },
    {
      id: "trainers",
      step: 3,
      short: "Train the trainer",
      n: "Train the trainer basics for workshop supervisors",
      by: "TVET college (example)",
      hours: 12,
      fee: 250,
      intakeWeek: 2,
      mode: "Weekend workshop",
      track: "self",
      skills: ["Training others"],
      hrd: "Claimable (example)",
      prereq: "None",
      refreshable: false,
      photo: "photos/assembly.webp",
      sdg: [4],
      why: "Formal pedagogical certification for leading safety briefings and onboarding technical staff."
    }
  ];

  const TRACK = {
    auto: "Syncs automatically",
    cert: "Finish with a certificate",
    self: "You record it"
  };

  const HISTORY = [
    { y: "1990s", n: "Paper checklists and logbooks", t: "Every parameter reading recorded by pen." },
    { y: "2005", n: "Barcode scanners", t: "Inventory and parts tracked with optical handhelds." },
    { y: "2011", n: "Touchscreen HMI panels", t: "Machine setpoints moved directly onto touchscreen consoles." },
    { y: "2018", n: "Sensors on the line", t: "Vibration and thermal sensors report self-diagnostics." },
    { y: "2024", n: "AI vision and predictive agents", t: "Cameras inspect defects automatically; AI models draft shift logs." }
  ];

  const SDG = {
    4: ["Quality education", "#C5192D", "#fff"],
    5: ["Gender equality", "#FF3A21", "#1F2A24"],
    7: ["Affordable and clean energy", "#FCC30B", "#1F2A24"],
    8: ["Decent work and economic growth", "#A21942", "#fff"],
    9: ["Industry, innovation and infrastructure", "#FD6925", "#1F2A24"],
    10: ["Reduced inequalities", "#DD1367", "#fff"],
    11: ["Sustainable cities and communities", "#FD9D24", "#1F2A24"],
    12: ["Responsible consumption and production", "#BF8B2E", "#1F2A24"],
    13: ["Climate action", "#3F7E44", "#fff"]
  };

  const SKILL_SDG = {
    "Electrical competency (ST)": [8, 4],
    "GCPV certificate": [7, 4],
    "Inverter fault diagnosis": [7],
    "Working at height": [8],
    "Safety isolation": [8],
    "Reading drawings": [4],
    "OSH safety induction": [8],
    "PLC basics": [9, 4],
    "Sensor troubleshooting": [9],
    "Data dashboards": [9],
    "Lean and 5S": [9, 12],
    "Training others": [4],
    "EV charger installation": [7, 11],
    "Fault diagnosis": [9],
    "Customer service": [8],
    "App-based job tickets": [9],
    "Multimeter testing": [8],
    "Wiring, SKM Level 2": [8, 4],
    "Forklift safe handling": [8]
  };

  // AI scenarios
  const SCEN = {
    moderate: {
      n: "Moderate pace",
      k: .7,
      src: "Anthropic Economic Index (AEI 2025): observed real-world workplace AI diffusion"
    },
    accelerated: {
      n: "Accelerated pace",
      k: 1.0,
      src: "ILO Generative AI & Jobs Index: theoretical upper-bound technological exposure"
    }
  };

  // Time machine data releases
  const SNAPSHOTS = [
    {
      id: "2025-01",
      n: "Jan 2025",
      releaseTag: "Release v1.0",
      mult: { stay: 1.15, evolve: 0.90, pivot: 0.82 },
      taskMetrics: {
        "Inverter fault diagnosis": { d: .35, s: .20, p: .20, label: "Narrowing" },
        "Working with automation cells": { d: .25, s: .35, p: .10, label: "Narrowing" },
        "EV charger installation": { d: .30, s: .15, p: .20, label: "Long" },
        "Parameter logging": { d: -.30, s: 0, p: -.10, label: "Closing" }
      },
      note: ["EV charger posts were rare (mostly pilot hubs)", "Solar commercial rooftop uptake was starting to climb", "Parameter logging was still manually written on most lines"]
    },
    {
      id: "2025-09",
      n: "Sep 2025",
      releaseTag: "Release v1.1",
      mult: { stay: 1.05, evolve: 0.96, pivot: 0.94 },
      taskMetrics: {
        "Inverter fault diagnosis": { d: .50, s: .20, p: .35, label: "Long" },
        "Working with automation cells": { d: .30, s: .40, p: .10, label: "Narrowing" },
        "EV charger installation": { d: .55, s: .25, p: .28, label: "Long" },
        "Parameter logging": { d: -.50, s: 0, p: -.15, label: "Closing" }
      },
      note: ["Parameter logging postings dropped by 35%", "EV charger postings doubled in Selangor & Penang", "First utility-scale solar battery hybrid tenders announced"]
    },
    {
      id: "2026-03",
      n: "Mar 2026",
      releaseTag: "Release v2.0 (Latest)",
      mult: { stay: 1.00, evolve: 1.00, pivot: 1.00 },
      taskMetrics: {
        "Inverter fault diagnosis": { d: .65, s: .20, p: .40, label: "Long" },
        "Working with automation cells": { d: .30, s: .45, p: .10, label: "Narrowing" },
        "EV charger installation": { d: .70, s: .30, p: .30, label: "Long" },
        "Parameter logging": { d: -.65, s: 0, p: -.20, label: "Closing" }
      },
      note: ["Basic panel installation courses grew rapidly, narrowing that entry window", "Inverter fault diagnosis & ST electrical competency in steep demand", "EV fast charger network installations expanding along PLUS highway"]
    }
  ];

  const SIGNALS = [
    ["ai", "Anthropic Economic Index", "AI adoption observed across workplace tasks. CC BY 4.0.", "Live quarterly pipeline", "Q4 2025 release"],
    ["ai", "ILO Generative AI and Jobs", "Theoretical maximum exposure index by occupation group.", "Global Benchmark", "2025 edition"],
    ["market", "OpenDOSM Labour Statistics", "Quarterly state-level employment and wage rates.", "Free API verified", "Latest Q4 release"],
    ["market", "MyMAHIR (TalentCorp) Green Taxonomies", "Official Malaysian skill definitions and growth drivers.", "Industry taxonomy", "2025/2026"],
    ["market", "MGTC Green Jobs Portal", "Live Malaysian green job listings and licensed prerequisites.", "Sample dataset", "March 2026 snapshot"],
    ["market", "Job-site research sample", "Dual-round sample of 220 postings: task keywords, licence requirements, pay.", "Manual sample", "Two rounds verified"],
    ["market", "HRD Corp Training Catalogue", "Registered training provider fees, course hours and claimable status.", "Official catalogue sample", "Verified 2026"]
  ];

  const REASONS = [
    "Too hard or prerequisites take too long",
    "No time due to overtime shift changes",
    "Lost interest in this technical track",
    "Found an alternative immediate job offer",
    "The green market and local demand changed"
  ];

  const STATES = ["Johor", "Kedah", "Kelantan", "Kuala Lumpur", "Melaka", "Negeri Sembilan", "Pahang", "Penang", "Perak", "Perlis", "Sabah", "Sarawak", "Selangor", "Terengganu"];
  const SLOTS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].flatMap(d => [[d, "Morning"], [d, "Evening"]]);

  // Job World: where each kind of station sits on the workplace map (percent of the map), up to 4 per zone
  const ZONES = {
    panel: { n: "Electrical panels", slots: [[6, 14], [19, 14], [12.5, 36]] },
    dock: { n: "Loading bay", slots: [[38, 17], [51, 30]] },
    desk: { n: "Control and office", slots: [[71, 18], [88, 18], [73, 36], [90, 36]] },
    line: { n: "Production line", slots: [[18, 57], [41, 57], [57, 57]] },
    bench: { n: "Workbenches", slots: [[13, 82], [31, 86], [47, 79]] },
    rack: { n: "Storage", slots: [[72, 80], [88, 86]] }
  };

  // Job World: a short hands-on scenario per task (Try), how the work changes (Understand)
  // and which path skills the task gives evidence for (Pivot).
  // ai steps: [who, text] where who is "ai" or "you". opts: [choice, verdict, why]; verdict is best | ok | risk.
  // carries: skill names from PATHS[*].skills or TASKCARDS that this task shows you can do.
  const TASKSIM = {
    "Parameter logging": {
      zone: "line",
      now: ["Walk the line every hour", "Read temperature and pressure gauges", "Write readings in the logbook"],
      ai: [["ai", "Sensors record readings every minute"], ["ai", "The dashboard flags readings that drift"], ["you", "You check the flagged machine and decide"]],
      aiDoes: "Records readings automatically and spots values that drift from normal.",
      youDo: "Decide whether a drift is a real problem, and act on it at the machine.",
      setup: "The dashboard flags Oven 2: temperature has risen 4°C in 20 minutes. It is still inside the limit.",
      ask: "What do you do?",
      opts: [
        ["Ignore it. It is still inside the limit.", "risk", "Trends matter. A slow rise often means a fan or heater fault that will stop the line later."],
        ["Go to Oven 2, check the fan and heater, and note what you find.", "best", "The AI saw the pattern. You know what causes it and can check it by hand."],
        ["Stop the whole line straight away.", "ok", "Safe, but costly. Checking first is usually enough while values are inside the limit."]
      ],
      keep: ["Reading how a machine behaves", "Deciding when to act"],
      learn: ["Data dashboards", "Sensor troubleshooting"],
      carries: ["Data dashboards", "Sensor troubleshooting"]
    },
    "Equipment start-up check": {
      zone: "line",
      now: ["Walk round each machine", "Tick a paper checklist", "Report anything odd to the supervisor"],
      ai: [["ai", "Tablet checklist with a photo for each point"], ["ai", "The machine runs its own self-test"], ["you", "You check guards, leaks and wear by eye and hand"]],
      aiDoes: "Runs machine self-tests and keeps the checklist on a tablet.",
      youDo: "Spot what sensors cannot: a loose guard, a leak, a worn belt, a burning smell.",
      setup: "The self-test on Press 1 says \"All OK\". On your walk-round you see a small oil patch under it.",
      ask: "What do you do?",
      opts: [
        ["Trust the self-test and start the press.", "risk", "Sensors only check what they measure. A leak can mean a hydraulic hose about to burst."],
        ["Photograph the leak, tag the press, and ask maintenance to check it before start-up.", "best", "Your eyes caught what the sensor could not, and the photo makes it traceable."],
        ["Wipe it up and keep an eye on it.", "ok", "Better than nothing, but with no record nobody fixes the cause."]
      ],
      keep: ["Hands-on inspection", "Safety judgement"],
      learn: ["OSH safety induction", "Digital checklists"],
      carries: ["OSH safety induction", "Equipment start-up check"]
    },
    "Fault diagnosis": {
      zone: "panel",
      now: ["Read the alarm and fault code", "Look the code up in the manual", "Test wiring and parts until you find the cause"],
      ai: [["ai", "The assistant suggests the three most likely causes"], ["you", "You test each cause safely at the machine"], ["you", "You fix it and record whether the guess was right"]],
      aiDoes: "Suggests likely causes from the fault code and past repairs.",
      youDo: "Test safely, find the real cause, fix it, and correct the system when it guessed wrong.",
      setup: "Conveyor 3 stops with fault F07. The assistant says: \"70% likely motor overload, 20% sensor fault.\"",
      ask: "What do you do first?",
      opts: [
        ["Reset the overload and restart.", "risk", "If the real cause is a jam or a bad sensor, it trips again, or the motor overheats."],
        ["Isolate the conveyor, check for a jam, then test motor current and the sensor.", "best", "The AI narrows the search. You confirm it safely with your meter and your eyes."],
        ["Call the supplier and wait.", "ok", "Sometimes needed, but you can usually find the cause yourself and save hours of downtime."]
      ],
      keep: ["Fault finding", "Multimeter testing", "Safe isolation"],
      learn: ["Inverter fault diagnosis", "Sensor troubleshooting"],
      carries: ["Fault diagnosis", "Inverter fault diagnosis", "Sensor troubleshooting"]
    },
    "Machine changeover": {
      zone: "line",
      now: ["Stop the line and remove the old tooling", "Fit new jigs and set the parameters", "Run test parts and adjust"],
      ai: [["ai", "The system loads the saved recipe for the new product"], ["you", "You fit and align the tooling"], ["you", "You check the first parts and fine-tune"]],
      aiDoes: "Loads saved settings for each product and times every changeover.",
      youDo: "Fit and align tools by hand, and judge when the first parts are right.",
      setup: "The new recipe loads by itself. The first test part has a burr on one edge.",
      ask: "What do you do?",
      opts: [
        ["Accept it. The recipe is approved.", "risk", "Approved settings cannot see a worn tool or a jig that sits slightly off."],
        ["Check jig alignment and tool wear, adjust, and run another test part.", "best", "You know how small mechanical changes show up on the part."],
        ["Ask the system to load the recipe again.", "ok", "Worth a try, but the cause is usually physical, not in the settings."]
      ],
      keep: ["Mechanical setup", "Quality judgement"],
      learn: ["PLC basics", "Lean and 5S"],
      carries: ["PLC basics", "Lean and 5S"]
    },
    "Safety isolation": {
      zone: "panel",
      now: ["Switch off and lock the isolator", "Tag it with your name", "Prove it dead with a meter"],
      ai: [["ai", "A digital permit records who isolated what"], ["you", "You lock, tag and test with your own hands"], ["you", "You decide when it is safe to work"]],
      aiDoes: "Keeps digital permits and reminds you of each step.",
      youDo: "Every physical step. A competent person must isolate and prove dead; no system can do it for you.",
      setup: "The permit app shows Panel B as \"Isolated\" by the night shift. You need to open it.",
      ask: "What do you do?",
      opts: [
        ["The app says isolated, so open the panel.", "risk", "Never trust a record alone. A lock may have been removed, or the wrong feeder isolated."],
        ["Fit your own lock and tag, then prove it dead with a tested meter before touching anything.", "best", "This is the part AI can never do for you, and it keeps you alive."],
        ["Phone the night shift and ask if it is safe.", "ok", "Good to ask, but you still have to test it yourself."]
      ],
      keep: ["Safe isolation", "Multimeter testing"],
      learn: ["Electrical competency (ST)"],
      carries: ["Safety isolation"]
    },
    "Wiring, SKM Level 2": {
      zone: "bench",
      now: ["Read the wiring drawing", "Cut, terminate and route the cables", "Test continuity and insulation"],
      ai: [["ai", "A tablet shows the drawing and cable list"], ["you", "You route and terminate every cable"], ["you", "You test; the app records the results"]],
      aiDoes: "Shows drawings on a tablet and stores your test results.",
      youDo: "All the hands-on wiring and testing.",
      setup: "The drawing on the tablet says terminal X2:4. The panel in front of you is labelled X2:5 at that spot.",
      ask: "What do you do?",
      opts: [
        ["Wire it as the drawing says.", "risk", "If the panel was changed, you may wire the wrong circuit."],
        ["Stop, check the panel against the latest drawing revision, and ask the engineer to confirm.", "best", "Spotting mismatches between the drawing and the real panel is skilled work."],
        ["Wire it to match the label on the panel.", "ok", "Might be right, but nobody has confirmed which one is correct."]
      ],
      keep: ["Wiring", "Reading drawings"],
      learn: ["Working at height", "Electrical competency (ST)"],
      carries: ["Reading drawings", "Wiring, SKM Level 2"]
    },
    "Visual inspection": {
      zone: "line",
      now: ["Pick samples from the line", "Check each part by eye under a lamp", "Mark and set aside bad parts"],
      ai: [["ai", "A camera checks every part"], ["ai", "It flags suspected defects"], ["you", "You check unclear cases and decide"]],
      aiDoes: "Checks every part with a camera and flags suspected defects.",
      youDo: "Decide on unclear cases, find out why defects happen, and help the camera learn.",
      setup: "The camera flags 14 of 200 boards. 3 are marked \"low confidence\": the mark could be a scratch, or just dust.",
      ask: "What do you do?",
      opts: [
        ["Reject all 14 to be safe.", "ok", "Safe for the customer, but you may scrap good boards. The unclear ones need a human look."],
        ["Reject the 11 clear defects, inspect the 3 unclear boards yourself, and record what you found.", "best", "Your decisions on unclear cases also teach the camera."],
        ["Pass the 3 unclear ones. The camera was not sure.", "risk", "If one is a real scratch, it reaches the customer."]
      ],
      keep: ["Quality judgement", "Defect recognition"],
      learn: ["Data dashboards", "Root-cause analysis"],
      carries: ["Data dashboards", "Quality visual inspection"]
    },
    "Measurement records": {
      zone: "desk",
      now: ["Measure parts with a micrometer", "Write the values on a form", "Type the form into a spreadsheet"],
      ai: [["ai", "Digital gauges send values straight in"], ["ai", "A control chart shows if the process drifts"], ["you", "You act when the chart shows a trend"]],
      aiDoes: "Takes readings straight from digital gauges and draws control charts.",
      youDo: "Read the chart, spot trends early, and stop the process before parts go bad.",
      setup: "The control chart shows 6 points in a row creeping upward. Every part still passes.",
      ask: "What do you do?",
      opts: [
        ["Nothing. All parts pass.", "risk", "Six points trending one way usually means the process is drifting."],
        ["Tell the line technician, check the tool for wear, and measure more often for now.", "best", "You caught the drift before it made bad parts."],
        ["Recalibrate the gauge.", "ok", "Worth checking, but the gauge is not the only suspect."]
      ],
      keep: ["Precise measurement", "Reading trends"],
      learn: ["Data dashboards"],
      carries: ["Data dashboards"]
    },
    "Sampling plans": {
      zone: "desk",
      now: ["Look up the lot size in the table", "Pick how many parts to check", "Decide accept or reject"],
      ai: [["ai", "The system suggests a sample size from supplier history"], ["you", "You adjust it when something has changed"], ["you", "You make the final accept or reject call"]],
      aiDoes: "Suggests sample sizes from each supplier's history.",
      youDo: "Adjust when something has changed, and sign off the decision.",
      setup: "The system says check only 5 parts from Supplier K because their record is good. Last week they moved to a new factory.",
      ask: "What do you do?",
      opts: [
        ["Follow the system and check 5.", "risk", "That record is from the old factory. It does not apply yet."],
        ["Use the normal sample size until the new factory proves itself.", "best", "You know about the move; the system does not."],
        ["Reject the lot to be safe.", "ok", "Too strict without evidence. Check it first."]
      ],
      keep: ["Judgement", "Supplier knowledge"],
      learn: ["Lean and 5S", "Data dashboards"],
      carries: ["Lean and 5S"]
    },
    "Root-cause checks": {
      zone: "line",
      now: ["Collect the bad parts", "Ask operators what changed", "Test ideas until the cause is found"],
      ai: [["ai", "The system links defects to machine, shift and material"], ["you", "You go to the line and check the top suspects"], ["you", "You agree the fix with the team"]],
      aiDoes: "Finds patterns: which machine, shift or material lot the defects come from.",
      youDo: "Go to the line, talk to people, and prove the cause.",
      setup: "Defects spike. The system says they all come from the night shift.",
      ask: "What do you do?",
      opts: [
        ["Report the night shift for poor work.", "risk", "A pattern is not a cause. Night shift may run a different material lot or a colder machine."],
        ["Visit the night shift and compare material lot, settings and machine temperature with day shift.", "best", "You turn a pattern into a proven cause."],
        ["Wait for more data.", "ok", "More data helps, but bad parts keep coming meanwhile."]
      ],
      keep: ["Problem solving", "Talking with the team"],
      learn: ["Sensor troubleshooting", "Training others"],
      carries: ["Fault diagnosis", "Training others"]
    },
    "Meter reading": {
      zone: "panel",
      now: ["Walk to each meter and switchboard", "Write down load and voltage", "Enter the values at the end of shift"],
      ai: [["ai", "Smart meters send readings every minute"], ["ai", "The system alerts on overloads"], ["you", "You check the board and fix the cause"]],
      aiDoes: "Reads meters remotely and alerts you to overloads.",
      youDo: "Go to the board, find out why, and rebalance or repair it.",
      setup: "Alert: board DB-4, phase L2 at 92% load. The other two phases sit at 50%.",
      ask: "What do you do?",
      opts: [
        ["Raise the alarm limit so it stops alerting.", "risk", "This hides the problem. An unbalanced board can overheat."],
        ["Inspect DB-4, find which circuits were added to L2, and plan to rebalance.", "best", "The meter shows the symptom; you fix the cause."],
        ["Switch DB-4 off.", "ok", "Too drastic unless it is overheating. Inspect first."]
      ],
      keep: ["Electrical testing", "Load balancing"],
      learn: ["Data dashboards", "Electrical competency (ST)"],
      carries: ["Data dashboards", "Electrical competency (ST)"]
    },
    "Maintenance logs": {
      zone: "desk",
      now: ["Fill in the job card by hand", "File it in the binder", "Type a summary every month"],
      ai: [["ai", "App job tickets with photos and voice notes"], ["ai", "The system drafts the monthly report"], ["you", "You check the report and plan the next jobs"]],
      aiDoes: "Records jobs from app tickets and writes the monthly summary.",
      youDo: "Make sure the records are true, and plan work from them.",
      setup: "The AI-written report says Motor M12 was \"replaced\". You only replaced its bearing.",
      ask: "What do you do?",
      opts: [
        ["Leave it. Close enough.", "risk", "Wrong records lead to wrong decisions, like ordering a motor nobody needs."],
        ["Correct it to \"bearing replaced\" and add the part number.", "best", "You are responsible for the record, not the AI."],
        ["Delete the entry.", "ok", "Then the repair disappears from the history."]
      ],
      keep: ["Accurate records", "Planning work"],
      learn: ["App-based job tickets"],
      carries: ["App-based job tickets"]
    },
    "Panel wiring": {
      zone: "bench",
      now: ["Read the panel drawing", "Wire and label breakers and terminals", "Test, then energise"],
      ai: [["ai", "Drawing and parts list on a tablet"], ["you", "You wire, label and test"], ["you", "You sign off before it is energised"]],
      aiDoes: "Shows drawings and checks your test results against limits.",
      youDo: "All the hands-on wiring, testing and sign-off.",
      setup: "Your insulation test reads 0.8 MΩ. The limit is 1 MΩ, but the app shows \"Pass\" because of a settings error.",
      ask: "What do you do?",
      opts: [
        ["The app says pass, so energise.", "risk", "Below the limit is a fail. The app is wrong."],
        ["Treat it as a fail, find the circuit with low insulation, and report the app error.", "best", "You know the limits, and you check the tool too."],
        ["Test once more and energise if it passes.", "ok", "Re-testing is fine, but find out why it read low."]
      ],
      keep: ["Panel wiring", "Testing"],
      learn: ["EV charger installation", "Electrical competency (ST)"],
      carries: ["EV charger installation", "Wiring, SKM Level 2"]
    },
    "Stock counting": {
      zone: "rack",
      now: ["Walk the racks with a clipboard", "Count pallets and cartons", "Enter the counts in the system"],
      ai: [["ai", "Scanners and cameras count the stock"], ["ai", "The system lists mismatches"], ["you", "You check mismatches in person"]],
      aiDoes: "Counts stock with scanners and lists mismatches.",
      youDo: "Find out why a count is wrong: wrong place, damage, or loss.",
      setup: "The system shows 40 cartons at rack B-12. The scanner sees 34.",
      ask: "What do you do?",
      opts: [
        ["Change the system to 34.", "risk", "The 6 cartons may be sitting in the wrong place, lost for good."],
        ["Check the nearby racks and the staging area, then record what you find.", "best", "They are usually misplaced, and only a person can go and look."],
        ["Count again tomorrow.", "ok", "Delays the orders waiting for those cartons."]
      ],
      keep: ["Knowing the warehouse", "Problem solving"],
      learn: ["App-based job tickets", "Data dashboards"],
      carries: ["App-based job tickets", "Data dashboards"]
    },
    "Route planning": {
      zone: "dock",
      now: ["Look at today's orders", "Plan the pick order in your head", "Drive the route"],
      ai: [["ai", "The system plans the shortest pick route"], ["you", "You adjust for blocked aisles and people"], ["you", "You drive safely"]],
      aiDoes: "Plans pick routes and the order of jobs.",
      youDo: "Adjust for what the system cannot see: blocked aisles, wet floors, people.",
      setup: "Your route goes through Aisle 4. A cleaner has just mopped it and put up a sign.",
      ask: "What do you do?",
      opts: [
        ["Follow the route. It is the fastest.", "risk", "A wet floor under a loaded forklift is a skid risk."],
        ["Take Aisle 5 and mark Aisle 4 as blocked in the app.", "best", "You keep everyone safe and update the system for the next driver."],
        ["Wait until the floor dries.", "ok", "Safe, but slower than it needs to be."]
      ],
      keep: ["Safe driving", "Reading the floor"],
      learn: ["App-based job tickets", "Customer service"],
      carries: ["App-based job tickets"]
    },
    "Loading and unloading": {
      zone: "dock",
      now: ["Check the delivery note", "Unload pallets onto the bay", "Inspect and put away"],
      ai: [["ai", "The scanner checks pallets against the order"], ["you", "You handle the load safely"], ["you", "You spot damage and refuse bad goods"]],
      aiDoes: "Checks deliveries against the order automatically.",
      youDo: "Handle loads safely and judge damage.",
      setup: "The scanner says the pallet matches the order. The wrap is torn and one carton is crushed.",
      ask: "What do you do?",
      opts: [
        ["The scanner says OK, so put it away.", "risk", "You accept damaged goods, and the supplier will not pay for them later."],
        ["Photograph the damage, note it on the delivery note before signing, and set the pallet aside.", "best", "Your eyes protect the company's money."],
        ["Refuse the whole truck.", "ok", "Too much for one damaged pallet."]
      ],
      keep: ["Safe handling", "Spotting damage"],
      learn: ["Customer service"],
      carries: ["Forklift safe handling", "Customer service"]
    },
    "Data entry": {
      zone: "desk",
      now: ["Read the paper form", "Type it into the system", "Check for typing errors"],
      ai: [["ai", "AI reads forms and fills the system"], ["ai", "It marks fields it is unsure of"], ["you", "You check unsure fields and fix errors"]],
      aiDoes: "Reads forms and invoices and types them in.",
      youDo: "Check the unclear fields and catch mistakes that cost money.",
      setup: "The AI read an invoice total as RM8,500. The scan is blurry and it could be RM3,500. It marked the field \"unsure\".",
      ask: "What do you do?",
      opts: [
        ["Accept RM8,500.", "risk", "Overpaying a supplier by RM5,000 is hard to get back."],
        ["Check the purchase order and call the supplier to confirm the amount.", "best", "You use context the AI does not have."],
        ["Skip this invoice for now.", "ok", "The supplier will chase it. Better to settle it now."]
      ],
      keep: ["Accuracy", "Checking against context"],
      learn: ["Data dashboards", "App-based job tickets"],
      carries: ["Data dashboards", "App-based job tickets"]
    },
    "Filing and records": {
      zone: "rack",
      now: ["Sort the documents", "File them in the right folder", "Find files when someone asks"],
      ai: [["ai", "Documents are scanned and tagged automatically"], ["ai", "Search finds files in seconds"], ["you", "You decide what is confidential and who sees it"]],
      aiDoes: "Scans, tags and finds documents.",
      youDo: "Decide what is confidential, who may see it, and how long to keep it.",
      setup: "A contractor asks for \"all files about Line 2\". Search returns 40 files, including two staff medical letters.",
      ask: "What do you do?",
      opts: [
        ["Send all 40.", "risk", "Medical letters are personal data. Sharing them breaks the PDPA."],
        ["Remove the confidential files, send the rest, and log the request.", "best", "The AI finds files; you protect people."],
        ["Refuse the request.", "ok", "The contractor may need those files to do the job."]
      ],
      keep: ["Confidentiality", "Judgement"],
      learn: ["Customer service", "App-based job tickets"],
      carries: ["Customer service"]
    },
    "Scheduling": {
      zone: "desk",
      now: ["Collect requests by phone and email", "Fit them into the calendar", "Tell everyone the plan"],
      ai: [["ai", "The system proposes a schedule"], ["you", "You handle clashes and special cases"], ["you", "You explain changes to people"]],
      aiDoes: "Proposes schedules that fit everyone's free slots.",
      youDo: "Handle clashes, priorities and people's real situations.",
      setup: "The system books a 6 a.m. delivery. The receiving supervisor is on medical leave this week.",
      ask: "What do you do?",
      opts: [
        ["Keep it. The system knows best.", "risk", "Nobody may be there to receive the goods."],
        ["Move it to 9 a.m. when the backup supervisor starts, and tell the supplier.", "best", "You knew about the leave; the system did not."],
        ["Cancel the delivery.", "ok", "Delays the stock for no good reason."]
      ],
      keep: ["Coordination", "Clear communication"],
      learn: ["App-based job tickets", "Customer service"],
      carries: ["App-based job tickets"]
    },
    "Customer calls": {
      zone: "desk",
      now: ["Answer the call", "Find the answer in the files", "Call back if needed"],
      ai: [["ai", "A chatbot answers simple questions"], ["ai", "It passes hard cases to you with a summary"], ["you", "You solve the hard cases"]],
      aiDoes: "Answers simple questions and summarises the rest for you.",
      youDo: "Handle upset customers and problems with no standard answer.",
      setup: "The chatbot hands you a customer: \"Third time my order is late. I want to cancel.\"",
      ask: "What do you do?",
      opts: [
        ["Send the standard apology template.", "risk", "A third template will lose the customer."],
        ["Call them, find where the order is, and give a clear date or a fix.", "best", "People keep customers; templates do not."],
        ["Cancel the order as asked.", "ok", "Sometimes right, but try to solve it first."]
      ],
      keep: ["Customer care", "Problem solving"],
      learn: ["Customer service"],
      carries: ["Customer service"]
    },
    "Solving staff problems": {
      zone: "desk",
      now: ["Listen to the problem", "Check the rules", "Agree a solution"],
      ai: [["ai", "AI finds the right policy and past cases"], ["you", "You listen and understand"], ["you", "You agree a fair outcome"]],
      aiDoes: "Finds the right policy and past cases quickly.",
      youDo: "Listen, weigh the situation, and agree something fair.",
      setup: "A worker asks to swap shifts for a family emergency. The policy bot says swaps need 7 days' notice.",
      ask: "What do you do?",
      opts: [
        ["Say no. Policy is policy.", "risk", "Rules allow exceptions for emergencies. Refusing damages trust."],
        ["Find a colleague willing to swap, get the supervisor's OK, and record it as an emergency exception.", "best", "You applied the rule with good sense."],
        ["Let them go without telling anyone.", "ok", "Kind, but it leaves the line short-staffed."]
      ],
      keep: ["Listening", "Fairness"],
      learn: ["Training others", "Customer service"],
      carries: ["Training others", "Customer service"]
    },
    "Lab reports": {
      zone: "desk",
      now: ["Record results in the lab", "Write up the method and results", "Hand it in for marking"],
      ai: [["ai", "AI drafts the write-up from your data"], ["you", "You check the results make sense"], ["you", "You explain what went wrong and why"]],
      aiDoes: "Drafts text and tables from your measurements.",
      youDo: "Check the numbers are real and explain what they mean.",
      setup: "The AI draft says your circuit drew 12 A. Your meter showed 1.2 A.",
      ask: "What do you do?",
      opts: [
        ["Hand it in. The AI writes well.", "risk", "A number ten times too big fails the report and hides a real mistake."],
        ["Correct the value, check your other numbers, and note the error.", "best", "You own the results, not the AI."],
        ["Redo the whole experiment.", "ok", "Not needed. You already have the right reading."]
      ],
      keep: ["Checking results", "Explaining"],
      learn: ["Data dashboards"],
      carries: ["Data dashboards"]
    },
    "Calculations": {
      zone: "desk",
      now: ["Write the formula", "Work out the numbers", "Check the units"],
      ai: [["ai", "A calculator app does the maths"], ["you", "You choose the right formula"], ["you", "You check the answer is sensible"]],
      aiDoes: "Does the arithmetic instantly.",
      youDo: "Pick the right method and spot answers that cannot be right.",
      setup: "The app says a 2.5 mm² cable can carry 250 A.",
      ask: "What do you do?",
      opts: [
        ["Use it. Apps do not make mistakes.", "risk", "A 2.5 mm² cable carries roughly 20 to 27 A. At 250 A it would start a fire."],
        ["See that it is about ten times too high, check the inputs, and recalculate.", "best", "Knowing roughly what is sensible is the skill."],
        ["Use a thicker cable to be safe.", "ok", "Safe, but you still do not know what went wrong."]
      ],
      keep: ["Number sense", "Electrical knowledge"],
      learn: ["Reading drawings", "Electrical competency (ST)"],
      carries: ["Electrical competency (ST)"]
    },
    "Reading drawings": {
      zone: "bench",
      now: ["Read the schematic", "Find the parts on the board", "Follow the circuit"],
      ai: [["ai", "An app highlights parts on a phone photo"], ["you", "You follow the circuit and understand it"], ["you", "You spot errors in the drawing"]],
      aiDoes: "Highlights parts and labels on a photo.",
      youDo: "Understand how the circuit works and find mistakes in the drawing.",
      setup: "The app labels a contactor K2. The drawing says K2 runs the pump, but its wire goes to the fan.",
      ask: "What do you do?",
      opts: [
        ["Trust the app's label.", "risk", "The app reads labels, not circuits."],
        ["Trace the wire, confirm which load it feeds, and mark up the drawing.", "best", "Tracing circuits is a skill employers pay for."],
        ["Ask a friend.", "ok", "Fine, but learn to trace it yourself."]
      ],
      keep: ["Reading drawings", "Tracing circuits"],
      learn: ["PLC basics", "Inverter fault diagnosis"],
      carries: ["Reading drawings", "PLC basics"]
    },
    "Team projects": {
      zone: "bench",
      now: ["Split the work", "Build your part", "Put it together and test"],
      ai: [["ai", "AI tracks tasks and deadlines"], ["you", "You agree who does what"], ["you", "You help teammates when they are stuck"]],
      aiDoes: "Keeps track of tasks and reminds people.",
      youDo: "Agree roles, sort out disagreements, and help each other.",
      setup: "The tracker shows your teammate's part as \"Done\", but their wiring fails the test.",
      ask: "What do you do?",
      opts: [
        ["Tell the lecturer it is their fault.", "risk", "Blame does not fix the panel, and the team is marked together."],
        ["Find the fault together and show them how you tested it.", "best", "Teaching others is a skill every green job asks for."],
        ["Quietly rewire it yourself.", "ok", "Fixes it, but they do not learn."]
      ],
      keep: ["Teamwork", "Training others"],
      learn: ["Training others", "Customer service"],
      carries: ["Training others"]
    }
  };

  return {
    ZONES,
    TASKSIM,
    JOBS,
    AUTO_AT,
    ASSIST_AT,
    fate,
    FATE,
    TASKCARDS,
    CERTS,
    STAY_ROLE,
    TASKOVER,
    PATHS,
    W,
    windowOf,
    windowLabel,
    GROUP,
    SDGFIT,
    SUBSIDIES,
    COURSES,
    TRACK,
    HISTORY,
    SDG,
    SKILL_SDG,
    SCEN,
    SNAPSHOTS,
    SIGNALS,
    REASONS,
    STATES,
    SLOTS
  };
})();
