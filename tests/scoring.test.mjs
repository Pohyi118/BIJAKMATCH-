// Regression test: the shared scoring function must give exactly the same scores as the
// original in-browser computePathMatch did before the weights moved into rules.v1.js.
// Run: node --test tests/
import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const site = path.join(root, "src/site");

// A page-less browser: every DOM call returns another inert proxy.
function inert() {
  const f = function () {};
  return new Proxy(f, {
    get: (t, k) => (k === Symbol.toPrimitive ? () => "" : k === "length" ? 0 : k === "then" ? undefined : inert()),
    apply: () => inert(),
    construct: () => inert(),
    set: () => true
  });
}

function loadApp(initialStore = {}) {
  const store = { ...initialStore };
  const win = {
    localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem() {} },
    location: { hash: "#home", href: "http://x/", origin: "http://x", protocol: "http:", search: "" },
    history: { replaceState() {} },
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    fetch: () => Promise.reject(new Error("no network")),
    addEventListener() {}, scrollTo() {}, navigator: {}, console,
    setTimeout, setInterval, clearInterval, clearTimeout,
    requestAnimationFrame: () => 0, Motion: inert(), gsap: inert()
  };
  win.window = win; win.self = win; win.globalThis = win; win.document = inert();
  const ctx = vm.createContext(win);
  const html = fs.readFileSync(path.join(site, "index.html"), "utf8");
  const scripts = [...html.matchAll(/<script src="([^"]+\.js)"><\/script>/g)].map(m => m[1]).filter(s => !s.startsWith("http"));
  for (const f of scripts) {
    let src = fs.readFileSync(path.join(site, f), "utf8");
    if (f === "bijak.js") src = src.replace(/^const BM =/, "var BM =");
    vm.runInContext(src, ctx, { filename: f });
  }
  vm.runInContext(fs.readFileSync(path.join(root, "tests/legacy-computePathMatch.js"), "utf8"), ctx, { filename: "legacy" });
  return ctx;
}

test("new scoring equals the legacy computePathMatch on a wide grid of worker states", () => {
  const ctx = loadApp();
  const out = vm.runInContext(`(() => {
    let checked = 0; const bad = [];
    const jobs = Object.keys(D.JOBS);
    const interests = ["yes", "maybe", "no"];
    for (const job of jobs) for (const goal of ["income", "quick"]) for (const scenario of ["moderate", "accelerated"])
    for (const rel of D.SNAPSHOTS.map(s => s.id)) for (const hours of [1, 4, 8, 15]) for (const budget of [0, 50, 100, 300])
    for (const sdg of ["sdg4_8", "sdg7"]) for (const hrd of [true, false]) for (const iv of interests)
    for (const withCert of [false, true]) {
      const st = fresh("ahmad", true);
      Object.assign(st, { job, goal, scenario, dataRelease: rel, hours, budget, sdgPriority: sdg, hrdLevy: hrd,
        interests: { stay: iv, evolve: interests[(interests.indexOf(iv) + 1) % 3], pivot: "maybe" } });
      st.certsHeld = withCert ? ["SKM Level 2, electrical"] : [];
      const saved = S; S = st;
      for (const p of PATH_IDS) {
        const a = computePathMatch(p, st), b = legacyComputePathMatch(p, st);
        checked++;
        if (a.total !== b.total || JSON.stringify(a.parts) !== JSON.stringify(b.parts) || JSON.stringify(a.maxParts) !== JSON.stringify(b.maxParts))
          bad.push([job, goal, scenario, rel, hours, budget, sdg, hrd, iv, withCert, p, a.total, b.total].join("|"));
      }
      S = saved;
    }
    return JSON.stringify({ checked, bad: bad.slice(0, 5), badCount: bad.length });
  })()`, ctx);
  const r = JSON.parse(out);
  assert.ok(r.checked > 5000, "grid should cover thousands of states, got " + r.checked);
  assert.equal(r.badCount, 0, "mismatches, first few: " + r.bad.join(" ; "));
});

test("score bands and experience levels come from the rules file", async () => {
  const { createRequire } = await import("node:module");
  const { bandFor, experienceLevel } = createRequire(import.meta.url)("../src/site/shared/scoring.js");
  assert.equal(bandFor(80), "strong");
  assert.equal(bandFor(60), "good");
  assert.equal(bandFor(45), "fair");
  assert.equal(bandFor(44), "weak");
  assert.equal(experienceLevel(80), "Expert");
  assert.equal(experienceLevel(55), "Experienced");
  assert.equal(experienceLevel(30), "Developing");
  assert.equal(experienceLevel(0), "Beginner");
});

test("a browser that saved a removed sample person (Faiz) loads as Ahmad", () => {
  const saved = JSON.parse(vm.runInContext("JSON.stringify(S)", loadApp()));
  const ctx = loadApp({ "bm-state-v2": JSON.stringify({ ...saved, person: "faiz", name: "Faiz", job: "fork" }) });
  assert.equal(vm.runInContext("S.person", ctx), "ahmad");
  assert.equal(vm.runInContext("S.name", ctx), "Ahmad");
  assert.equal(vm.runInContext("S.job", ctx), "fork", "other saved answers are kept");
  assert.ok(!vm.runInContext("V.profile()", ctx).includes("Faiz"));
});
