/* BijakMatch: Load saved state from localStorage and migrate.
   Classic script; shares one global scope with the other app-*.js files (load order in index.html). */

let S;
try {
  S = JSON.parse(localStorage.getItem("bm-state-v2"));
} catch (e) {}
if (!S || S.v !== 2) {
  S = fresh("ahmad", true);
}
// Sample people other than Ahmad were removed; a browser that saved one of them (Faiz, Siti, ...) falls back to Ahmad.
const REMOVED_PEOPLE = { siti: "Siti", raj: "Raj", meiling: "Mei Ling", faiz: "Faiz", nurul: "Nurul" };
if (!BM.PEOPLE.some(p => p.id === S.person)) {
  if (S.name === REMOVED_PEOPLE[S.person]) S.name = BM.PEOPLE[0].n;
  S.person = BM.PEOPLE[0].id;
}
if (!S.done) S.done = {};
if (S.done.time === undefined) S.done.time = Boolean(S.done.profile);
if (!S.tab) S.tab = {};
if (!S.tab.cardMode) S.tab.cardMode = "sim";
if (!S.tab.impact || S.tab.impact === "tasks") S.tab.impact = "simulator";
if (!S.sprout) {
  S.sprout = {
    station: "qc",
    flowTab: "current",
    exp: "intermediate",
    rotated: false,
    zoom: 75,
    activeModal: null,
    simStep: "idle",
    simChoice: null,
    subtab: "details",
    savedStation: null
  };
}
if (!S.ai) S.ai = freshAI();
S.ai.pending = false;
if (!S.live) S.live = freshLive();
if (S.market && S.market.loading) S.market = { ...S.market, loading: false, error: "The page was reloaded during the analysis. Run it again." };
if (S.live.status === "live" || S.live.status === "connecting") S.live.status = Object.keys(S.live.results).length ? "done" : "idle";
if (!S.wage) S.wage = BM.PEOPLE.find(p => p.id === S.person)?.wage || 2800;

const save = () => {
  try {
    localStorage.setItem("bm-state-v2", JSON.stringify(S));
  } catch (e) {}
};

const person = () => BM.PEOPLE.find(p => p.id === S.person) || BM.PEOPLE[0];
const me = (extra = {}) => BM.avatarSVG({ ...person().a, ...extra });
const jobName = () => (S.job && D.JOBS[S.job]) ? D.JOBS[S.job].n : "Your job";

