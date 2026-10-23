/* BijakMatch: Icons, chips, tabs and other small widgets.
   Classic script; shares one global scope with the other app-*.js files (load order in index.html). */
/* ==========================================================================
   6. VISUAL PIECES, ICONS, AND WIDGETS
   ========================================================================== */
const WX = {
  sun: '<svg class="wx" viewBox="0 0 34 34" role="img" aria-label="Low risk"><circle cx="17" cy="17" r="7" fill="#F2C230"/><g stroke="#F2C230" stroke-width="3" stroke-linecap="round"><path d="M17 3v4M17 27v4M3 17h4M27 17h4M7 7l3 3M24 24l3 3M7 27l3-3M24 10l3-3"/></g></svg>',
  part: '<svg class="wx" viewBox="0 0 34 34" role="img" aria-label="Some risk"><circle cx="13" cy="13" r="7" fill="#F2C230"/><path d="M10 27h16a6 6 0 0 0 0-12 8 8 0 0 0-15 3 4.5 4.5 0 0 0-1 9z" fill="#B9C6D6"/></svg>',
  cloud: '<svg class="wx" viewBox="0 0 34 34" role="img" aria-label="Higher risk"><path d="M8 25h18a7 7 0 0 0 0-14 9 9 0 0 0-17 3 5.5 5.5 0 0 0-1 11z" fill="#8FA0B5"/><path d="M12 28l-2 4M18 28l-2 4M24 28l-2 4" stroke="#5E8FD6" stroke-width="2.4" stroke-linecap="round"/></svg>'
};

const ICON = {
  tech: '<circle cx="20" cy="20" r="7" fill="none" stroke="#1E5A3A" stroke-width="4"/><path d="M20 4v6M20 30v6M4 20h6M30 20h6M8.7 8.7l4.2 4.2M27.1 27.1l4.2 4.2M8.7 31.3l4.2-4.2M27.1 12.9l4.2-4.2" stroke="#1E5A3A" stroke-width="4" stroke-linecap="round"/>',
  qc: '<circle cx="17" cy="17" r="10" fill="#DCEBD2" stroke="#1E5A3A" stroke-width="4"/><path d="M25 25l10 10" stroke="#1E5A3A" stroke-width="5" stroke-linecap="round"/><path d="M12 17l4 4 6-7" stroke="#1E5A3A" stroke-width="3" fill="none" stroke-linecap="round"/>',
  elec: '<path d="M23 3L8 23h11l-3 14 16-21H21z" fill="#F2C230" stroke="#1E5A3A" stroke-width="3" stroke-linejoin="round"/>',
  fork: '<rect x="4" y="10" width="18" height="16" rx="3" fill="#1E5A3A"/><path d="M26 6v24h10" stroke="#1E5A3A" stroke-width="4" fill="none"/><circle cx="10" cy="32" r="4" fill="#7BAE5E"/><circle cx="21" cy="32" r="4" fill="#7BAE5E"/>',
  admin: '<path d="M8 3h17l8 8v26H8z" fill="#DCEBD2" stroke="#1E5A3A" stroke-width="3" stroke-linejoin="round"/><path d="M13 18h14M13 24h14M13 30h9" stroke="#1E5A3A" stroke-width="3" stroke-linecap="round"/>',
  student: '<path d="M20 6L2 15l18 9 18-9z" fill="#1E5A3A"/><path d="M9 19v9c6 5 16 5 22 0v-9" stroke="#1E5A3A" stroke-width="3.5" fill="#DCEBD2"/><path d="M35 15v11" stroke="#F2C230" stroke-width="3"/>'
};

const icon = k => `<svg class="ic" viewBox="0 0 40 40" aria-hidden="true">${ICON[k] || ICON.tech}</svg>`;
const chip = (n, track) => `<span class="chip ${track === "verified" ? "" : track === "hidden" ? "hidden" : "refresh"}">${esc(n)} <em style="font-size:14px;font-style:normal;margin-left:4px">(${track})</em></span>`;
const ring = (p, size = 120) => `<svg viewBox="0 0 120 120" width="${size}" height="${size}" role="img" aria-label="${Math.round(p * 100)}% done"><circle cx="60" cy="60" r="50" fill="none" style="stroke:var(--surface-muted)" stroke-width="14"/><circle cx="60" cy="60" r="50" fill="none" style="stroke:var(--primary)" stroke-width="14" stroke-linecap="round" stroke-dasharray="314.2" stroke-dashoffset="${314.2 * (1 - p)}" transform="rotate(-90 60 60)"/><text x="60" y="68" text-anchor="middle" font-family="Overpass,sans-serif" font-weight="800" font-size="26" style="fill:var(--text)">${Math.round(p * 100)}%</text></svg>`;

function weekGrid(slots) {
  return `<div class="week" aria-label="Your free times">${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => `<div><span>${d}</span>
    <i class="${slots.includes(d + "-Morning") ? "on" : ""}" title="${d} morning"></i><i class="${slots.includes(d + "-Evening") ? "half" : ""}" title="${d} evening"></i></div>`).join("")}</div>`;
}

function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.setAttribute("role", "status");
  t.textContent = msg;
  document.body.appendChild(t);
  if (!BM.still()) animate(t, { transform: ["translate(-50%,20px)", "translate(-50%,0)"] }, { duration: .3 });
  setTimeout(() => t.remove(), 2800);
}

const tabs = (key, list) => {
  const cur = S.tab[key] || list[0][0];
  return `<div class="tabs" role="tablist">${list.map(([id, n]) => `<button role="tab" aria-selected="${id === cur}" data-tab="${key}:${id}">${n}</button>`).join("")}</div>`;
};
const pageHead = (title, lead) => `<div class="ph"><div><h1>${title}</h1><p>${lead}</p></div></div>`;
const tabOf = (key, def) => S.tab[key] || def;

