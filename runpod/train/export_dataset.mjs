// Builds the training files for the task-card classifier.
//   node runpod/train/export_dataset.mjs
// Sources: the scripted interview answers in src/site/app-data.js (each one already labelled with
// the task cards it shows) plus hand-written English and Bahasa Malaysia lines in data/seed_extra.jsonl.
// Output (runpod/train/out/): labels.json, train.jsonl, val.jsonl. The split is by a hash of the text,
// so the same line always lands on the same side and the split never shifts between runs.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const outDir = path.join(here, "out");

const ctx = vm.createContext({ window: {} });
vm.runInContext(fs.readFileSync(path.join(root, "src/site/app-data.js"), "utf8"), ctx);
const D = vm.runInContext("DATA", ctx);

const labels = D.TASKCARDS.map(t => t.n);
const rows = [];
for (const [job, j] of Object.entries(D.JOBS)) {
  for (const step of j.interview) {
    rows.push({ text: step.a, labels: step.cards || [], source: `scripted:${job}` });
    if (step.follow) rows.push({ text: step.follow.a, labels: step.follow.cards || [], source: `scripted:${job}` });
  }
}
for (const line of fs.readFileSync(path.join(here, "data/seed_extra.jsonl"), "utf8").split("\n").filter(Boolean)) {
  rows.push({ ...JSON.parse(line), source: "seed_extra" });
}

// Keep only labels that exist as task cards, drop duplicate texts, and fail loudly on a typo.
const seen = new Set();
const clean = [];
for (const r of rows) {
  const bad = r.labels.filter(l => !labels.includes(l));
  if (bad.length) throw new Error(`Unknown task card(s) ${JSON.stringify(bad)} in: ${r.text}`);
  const key = r.text.trim().toLowerCase();
  if (seen.has(key)) continue;
  seen.add(key);
  clean.push({ text: r.text.trim(), labels: r.labels, source: r.source });
}

const bucket = text => parseInt(crypto.createHash("sha1").update(text).digest("hex").slice(0, 8), 16) % 5;
const train = clean.filter(r => bucket(r.text) !== 0); // about 80%
const val = clean.filter(r => bucket(r.text) === 0);   // about 20%

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "labels.json"), JSON.stringify(D.TASKCARDS.map(({ n, kw }) => ({ name: n, keywords: kw })), null, 2));
const write = (name, list) => fs.writeFileSync(path.join(outDir, name), list.map(r => JSON.stringify(r)).join("\n") + "\n");
write("train.jsonl", train);
write("val.jsonl", val);

const count = list => labels.map(l => `${l}: ${list.filter(r => r.labels.includes(l)).length}`).join("\n  ");
console.log(`${clean.length} examples (${train.length} train, ${val.length} validation), ${labels.length} task cards`);
console.log(`train per card:\n  ${count(train)}`);
console.log(`validation per card:\n  ${count(val)}`);
const thin = labels.filter(l => train.filter(r => r.labels.includes(l)).length < 3);
if (thin.length) console.log(`\nWARNING: fewer than 3 training examples for: ${thin.join(", ")}`);
