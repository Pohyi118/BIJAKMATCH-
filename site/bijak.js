/* BijakMatch shared script: motion tokens, pause state, character rig, sample people. */
const BM = (() => {
  const T = { fast: .2, mid: .6, slow: 1.1 };
  const EASE = { out: [.2, .8, .2, 1], io: [.65, 0, .35, 1] };

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let paused = false;
  try { paused = localStorage.getItem("bm-pause") === "1"; } catch (e) {}
  const still = () => paused || reduce;
  function setPaused(v) {
    paused = v;
    try { localStorage.setItem("bm-pause", v ? "1" : "0"); } catch (e) {}
  }
  const isPaused = () => paused;

  // character palette: skin tones and outfits are illustration colours, not UI tokens
  const SKIN = { a: "#C98E6B", b: "#B98262", c: "#8A5A3C", d: "#E8C2A0", e: "#A86F4C", f: "#C48C68" };
  const SUIT = { blue: "#2F6CC8", forest: "#1E5A3A", clay: "#D2694D", sky: "#4F74C8", leaf: "#2C7A4F" };
  const HAT = "#F2C230", HAT_EDGE = "#D9A21C", HAIR = "#1E2328", MOUTH = "#5A2E1E", BROW = "#3A2A20";

  function avatarSVG({ skin = SKIN.a, suit = SUIT.blue, hijab = null, cls = "", arm = false, hat = true, tool = null } = {}) {
    const tools = {
      tablet: `<rect x="74" y="104" width="22" height="28" rx="3" fill="#1F2A24"/><rect x="77" y="108" width="16" height="18" rx="1.5" fill="#7BAE5E"/>`,
      panel: `<path d="M70 108 l26 -4 v20 l-26 4z" fill="#3E6CB8"/><path d="M70 115 l26 -4 M70 122 l26 -4 M79 106 v20 M88 105 v20" stroke="#DCE6F6" stroke-width="1"/>`,
      plug: `<rect x="78" y="106" width="14" height="20" rx="4" fill="#1F2A24"/><path d="M82 106 v-6 M88 106 v-6" stroke="#1F2A24" stroke-width="2.5"/><circle cx="85" cy="116" r="3" fill="#7BAE5E"/>`
    };
    return `<svg class="avatar ${cls}" viewBox="0 0 120 140" aria-hidden="true">
  <g class="av-body">
    <path d="M18 140 C 20 110, 38 98, 60 98 C 82 98, 100 110, 102 140 Z" fill="${suit}"/>
    <rect x="30" y="120" width="60" height="6" rx="2" fill="${HAT}"/>
    ${tool ? tools[tool] : ""}
    ${arm ? `<g class="av-arm"><path d="M92 118 C 102 104, 108 92, 108 80" stroke="${suit}" stroke-width="12" fill="none" stroke-linecap="round"/><circle cx="108" cy="74" r="7.5" fill="${skin}"/></g>` : ""}
    <g class="av-head">
      ${hijab ? `<path d="M33 62 C 33 36, 87 36, 87 62 L 90 100 C 76 108, 44 108, 30 100 Z" fill="${hijab}"/>`
              : `<rect x="52" y="82" width="16" height="18" fill="${skin}"/>`}
      <ellipse cx="60" cy="66" rx="${hijab ? 20 : 23}" ry="${hijab ? 23 : 26}" fill="${skin}"/>
      ${hijab ? "" : `<path d="M37 60 C 38 46, 82 46, 83 60 C 76 52, 44 52, 37 60 Z" fill="${HAIR}"/>`}
      ${hat ? `<path d="M33 54 C 33 28, 87 28, 87 54 Z" fill="${HAT}"/>
      <rect x="29" y="51" width="62" height="7" rx="3.5" fill="${HAT_EDGE}"/>
      <path d="M58 32 h4 v20 h-4z" fill="${HAT_EDGE}"/>` : ""}
      <path d="M46 63 q5 -3 10 0 M64 63 q5 -3 10 0" stroke="${BROW}" stroke-width="2" fill="none" stroke-linecap="round"/>
      <g class="av-lids"><ellipse cx="51" cy="69" rx="2.8" ry="3.2" fill="${HAIR}"/><ellipse cx="69" cy="69" rx="2.8" ry="3.2" fill="${HAIR}"/></g>
      <path class="av-mouth" d="M54 80 Q60 83 66 80" stroke="${MOUTH}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path class="av-smile" d="M52 78 Q60 87 68 78 Z" fill="${MOUTH}"/>
      <ellipse class="av-open" cx="60" cy="81" rx="4.5" ry="3" fill="${MOUTH}"/>
    </g>
  </g></svg>`;
  }

  // one sample dataset for every page
  const PEOPLE = [
    { id: "ahmad", n: "Ahmad", job: "tech", r: "Production technician, Penang", s: "Line may automate by 2028", a: { skin: SKIN.a, suit: SUIT.blue }, bg: "#DCE6F6", hours: 4, budget: 100, wage: 2800, goal: "income", certs: ["SKM Level 2, electrical"], hrdLevy: true, lastWork: { "Wiring, SKM Level 2": ">1y", "Multimeter testing": ">1y", "Reading drawings": ">1y", "Safety isolation": "recent" } },
    { id: "siti", n: "Siti", job: "qc", r: "QC inspector, Kulim", s: "Vision cameras now check parts", a: { skin: SKIN.b, suit: SUIT.forest, hijab: "#7BAE5E" }, bg: "#DCEBD2", hours: 6, budget: 50, wage: 2400, goal: "quick", certs: ["HRD Corp short course: Electrical Safety"], hrdLevy: true, lastWork: { "Safety isolation": "recent" } },
    { id: "raj", n: "Raj", job: "elec", r: "Maintenance electrician, Johor", s: "Wants a licence upgrade", a: { skin: SKIN.c, suit: SUIT.clay }, bg: "#F7DDD4", hours: 5, budget: 200, wage: 3400, goal: "income", certs: ["SKM Level 3, electrical"], hrdLevy: true, lastWork: { "Safety isolation": "recent", "PLC basics": "recent", "Wiring, SKM Level 2": "recent", "Fault diagnosis": "recent" } },
    { id: "meiling", n: "Mei Ling", job: "student", r: "TVET student, Ipoh", s: "Choosing her first job", a: { skin: SKIN.d, suit: SUIT.sky, hat: false }, bg: "#FBEDB8", hours: 10, budget: 0, wage: 1800, goal: "income", certs: [], hrdLevy: false, lastWork: {} },
    { id: "faiz", n: "Faiz", job: "fork", r: "Forklift operator, Shah Alam", s: "Warehouse adding robots", a: { skin: SKIN.e, suit: SUIT.leaf }, bg: "#DCEBD2", hours: 3, budget: 50, wage: 2200, goal: "quick", certs: ["Forklift operator permit"], hrdLevy: true, lastWork: { "Forklift safe handling": "recent", "Equipment start-up check": "recent" } },
    { id: "nurul", n: "Nurul", job: "admin", r: "Admin clerk, Kuching", s: "Data entry going digital", a: { skin: SKIN.f, suit: SUIT.sky, hijab: "#D2694D", hat: false }, bg: "#DCE6F6", hours: 4, budget: 100, wage: 2100, goal: "quick", certs: [], hrdLevy: false, lastWork: {} }
  ];

  function qrSVG(text, size = 130) {
    const S = 29;
    const grid = Array.from({ length: S }, () => Array(S).fill(0));
    const isRes = Array.from({ length: S }, () => Array(S).fill(false));

    function setFinder(r, c) {
      for (let i = -1; i <= 7; i++) {
        for (let j = -1; j <= 7; j++) {
          const nr = r + i, nc = c + j;
          if (nr >= 0 && nr < S && nc >= 0 && nc < S) {
            isRes[nr][nc] = true;
            if (i >= 0 && i <= 6 && j >= 0 && j <= 6) {
              grid[nr][nc] = (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) ? 1 : 0;
            } else {
              grid[nr][nc] = 0;
            }
          }
        }
      }
    }

    setFinder(0, 0);
    setFinder(0, S - 7);
    setFinder(S - 7, 0);

    for (let i = 8; i < S - 8; i++) {
      isRes[6][i] = true; grid[6][i] = i % 2 === 0 ? 1 : 0;
      isRes[i][6] = true; grid[i][6] = i % 2 === 0 ? 1 : 0;
    }

    const ar = 20, ac = 20;
    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        isRes[ar + i][ac + j] = true;
        grid[ar + i][ac + j] = (Math.abs(i) === 2 || Math.abs(j) === 2 || (i === 0 && j === 0)) ? 1 : 0;
      }
    }

    let h = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }

    for (let r = 0; r < S; r++) {
      for (let c = 0; c < S; c++) {
        if (!isRes[r][c]) {
          h = (h * 1103515245 + 12345) & 0x7fffffff;
          grid[r][c] = (h % 3 === 0 || (r + c) % 3 === 0) ? 1 : 0;
        }
      }
    }

    let rects = "";
    for (let r = 0; r < S; r++) {
      for (let c = 0; c < S; c++) {
        if (grid[r][c]) rects += `<rect x="${c}" y="${r}" width="1" height="1" fill="#1F2A24"/>`;
      }
    }
    return `<svg viewBox="0 0 ${S} ${S}" width="${size}" height="${size}" shape-rendering="crispEdges" role="img" aria-label="Verifiable QR Code">${rects}</svg>`;
  }

  const LOGO = `<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#1E5A3A"/><path d="M9 21c0-7 5-11 14-12-1 9-5 14-12 14" fill="#7BAE5E"/><path d="M10 23c3-4 6-7 10-10" stroke="#F2C230" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>`;

  return { T, EASE, still, setPaused, isPaused, avatarSVG, PEOPLE, SKIN, SUIT, LOGO, qrSVG };
})();
