/* BijakMatch: API base, helpers, backend health.
   Classic script; shares one global scope with the other app-*.js files (load order in index.html). */
/* BijakMatch app.js — Rebuilt logic engine v2 following proposal (ReRole Green 提案.pdf).
   Integrates three-track skills, shift interview, 4-part match scoring, window scores,
   time machine, single weekly simulation engine, licence gates, honest subsidies,
   calendar with evidence blocks, rescheduling, change direction, and transition card. */

const { animate, stagger } = Motion;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const D = DATA;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const rm = n => "RM" + Math.round(n).toLocaleString("en-MY");
const esc = s => String(s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* Backend API Configuration & Universal Base URL Resolver */
const API_BASE = (() => {
  if (typeof window !== "undefined" && window.BIJAK_API_BASE) return window.BIJAK_API_BASE;
  if (typeof location !== "undefined" && location.protocol.startsWith("http")) {
    if (location.port && location.port !== "5050" && (location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
      return `http://${location.hostname}:5050`;
    }
    return "";
  }
  return "http://localhost:5050";
})();

const apiUrl = ep => `${API_BASE}/${ep.replace(/^\//, "")}`;

let backendStatus = { ok: false, checked: false, endpoints: [] };
async function checkBackendHealth() {
  try {
    const res = await fetch(apiUrl("/api/health"), { method: "GET" });
    if (res.ok) {
      const data = await res.json();
      backendStatus = { ok: true, checked: true, ...data };
      console.log("[BijakMatch Backend Linked]", backendStatus);
    } else {
      backendStatus = { ok: false, checked: true };
    }
  } catch (e) {
    backendStatus = { ok: false, checked: true, error: e.message };
  }
}
checkBackendHealth();

