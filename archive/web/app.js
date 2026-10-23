const S = {
  account: null,
  page: "home",
  scenario: "moderate",
  snap: SNAPSHOTS.length - 1,
  track: {},     // 每个账号在路线页正在看的路
  chosen: {},    // 每个账号选定的岗位
  cond: {},      // 每个账号的"我的条件"
  done: {},      // 每个账号已完成的步骤
  menuOpen: false,
  showTeamPlan: false,
};

const $app = document.getElementById("app");
const $drawer = document.getElementById("drawer");
const $scrim = document.getElementById("scrim");

const STATUS = {
  verified: { name: "已验证", hint: "有证书，也在做", weight: 1 },
  rusty:    { name: "生锈了", hint: "有证书，但很久没做", weight: 0.6 },
  hidden:   { name: "隐藏技能", hint: "每天在做，但没有证书", weight: 0.8 },
};

/* ---------- 计算 ---------- */

function trend(id, snap = S.snap, scenario = S.scenario) {
  const s = SKILLS[id];
  const v = s.trend[snap];
  return Math.round(scenario === "fast" ? v * s.fast : v);
}

function roleDemand(role, snap = S.snap) {
  const vals = role.needs.map((id) => trend(id, snap));
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

function cond(acc) {
  if (!S.cond[acc.id]) S.cond[acc.id] = { hours: acc.hours, budget: acc.budget, goal: "fast" };
  return S.cond[acc.id];
}

function monthsFor(role, acc) {
  return Math.max(1, Math.round((role.months * 4) / cond(acc).hours));
}

function match(acc, role, snap = S.snap) {
  const have = role.needs.reduce((sum, id) => sum + (acc.skills[id] ? STATUS[acc.skills[id]].weight : 0), 0);
  const months = monthsFor(role, acc);
  const easeRaw = Math.max(0, 20 - (role.license ? 5 : 0) - Math.min(12, months)) / 20;
  const demandRaw = Math.min(1, Math.max(0, (roleDemand(role, snap) + 10) / 40));
  const haveRaw = have / role.needs.length;

  // 两种目标用不同权重：快点转工看重已有任务和上手容易；多赚一点看重市场需求和收入前景。
  const weights = cond(acc).goal === "income"
    ? { overlap: 25, demand: 25, pay: 20, interest: 15, ease: 15 }
    : { overlap: 40, demand: 25, pay: 0, interest: 15, ease: 20 };
  const parts = [
    { label: "任务重叠", raw: haveRaw, max: weights.overlap },
    { label: "市场需求", raw: demandRaw, max: weights.demand },
    { label: "收入前景", raw: role.pay, max: weights.pay },
    { label: "你的兴趣", raw: acc.interest[role.track], max: weights.interest },
    { label: "上手容易", raw: easeRaw, max: weights.ease },
  ].filter((p) => p.max > 0).map((p) => ({ ...p, value: Math.round(p.raw * p.max) }));
  return { total: parts.reduce((sum, p) => sum + p.value, 0), parts };
}

function bestPaths(acc, snap = S.snap) {
  return Object.keys(TRACKS).map((track) => {
    const options = Object.entries(ROLES).filter(([, r]) => r.track === track);
    const [id, role] = options
      .map(([id, r]) => [id, r, match(acc, r, snap).total])
      .sort((a, b) => b[2] - a[2])[0];
    return { track, id, role, score: match(acc, role, snap) };
  });
}

function recommendedTrack(acc) {
  return bestPaths(acc).sort((a, b) => b.score.total - a.score.total)[0].track;
}

function changesSincePrevious() {
  if (S.snap === 0) return [];
  return Object.keys(SKILLS)
    .map((id) => ({ id, delta: trend(id) - trend(id, S.snap - 1) }))
    .filter((c) => c.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3);
}

function buildSteps(acc, roleId) {
  const role = ROLES[roleId];
  const c = cond(acc);
  const steps = [];
  const hidden = role.needs.filter((id) => acc.skills[id] === "hidden");
  const rusty = role.needs.filter((id) => acc.skills[id] === "rusty");
  let missing = role.needs.filter((id) => !acc.skills[id]);

  if (hidden.length) {
    steps.push({
      title: "用 PPT 认证已有能力",
      detail: hidden.map((id) => SKILLS[id].name).join("、"),
      provider: "JPK 技能发展局", hours: 16, cost: null, term: "PPT",
      note: "不用上课，交工作证据即可",
    });
  }
  rusty.forEach((id) => steps.push({
    title: "复习：" + SKILLS[id].name, detail: "你有证书，只需要复习，不用重新上课",
    provider: COURSES[id].provider, hours: Math.round(COURSES[id].hours / 2), cost: 0,
  }));

  missing = missing.sort((a, b) =>
    c.goal === "income" ? trend(b) - trend(a) : COURSES[a].hours - COURSES[b].hours);
  missing.forEach((id) => {
    const course = COURSES[id];
    steps.push({
      title: course.name, detail: "补上缺口：" + SKILLS[id].name,
      provider: course.provider, hours: course.hours, cost: course.cost, hrd: course.hrd,
    });
  });

  if (role.license) {
    const lic = LICENSES[role.license];
    steps.push({
      title: "考取 " + role.license, detail: "这个岗位的法定要求",
      provider: lic.provider, hours: lic.hours, cost: lic.cost, license: true,
    });
  }

  let week = 1;
  return steps.map((step) => {
    const weeks = Math.max(1, Math.ceil(step.hours / c.hours));
    const covered = step.hrd && acc.employed;
    const locked = step.cost > 0 && !covered && step.cost > c.budget * 3;
    const out = { ...step, week, weeks, covered, locked };
    week += weeks;
    return out;
  });
}

/* ---------- 小组件 ---------- */

const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
const acc = () => ACCOUNTS.find((a) => a.id === S.account);
const initials = (name) => name.replace("Puan ", "").split(" ").map((w) => w[0]).join("").slice(0, 2);

function avatar(a, size = "") {
  return `<span class="avatar ${size}" style="--c:${a.color}" aria-hidden="true">${initials(a.name)}</span>`;
}

function info(key, label = "这是什么？") {
  return `<button class="info" data-action="glossary" data-key="${key}" aria-label="${label}">i</button>`;
}

function confDots(n) {
  const word = ["", "低", "中", "高"][n];
  return `<span class="conf" title="信心：${word}"><span class="dots" data-n="${n}"><i></i><i></i><i></i></span>${word}</span>`;
}

function signed(v) {
  return (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v) + "%";
}

function money(v) {
  if (v === null || v === undefined) return "费用待确认";
  return v === 0 ? "免费" : "RM " + v.toLocaleString();
}

function segmented(name, value, options) {
  return `<div class="seg" role="radiogroup">${options.map(([v, label]) =>
    `<button role="radio" aria-checked="${v === value}" data-action="set" data-name="${name}" data-value="${v}">${label}</button>`
  ).join("")}</div>`;
}

function sdgTags(list) {
  return list.map((t) => {
    const goal = String(t).split(".")[0];
    return `<span class="sdg" title="SDG ${goal}：${SDG[goal]}">SDG ${t}</span>`;
  }).join("");
}

/* ---------- 页面 ---------- */

function pickerView() {
  return `
  <main class="picker">
    <div class="picker-inner">
      <p class="brand"><span class="brand-mark" aria-hidden="true"></span>ReRole Green</p>
      <h1>看懂 AI 怎么改变你的工作，<br>找到负担得起的下一步。</h1>
      <p class="lead">选一个演示账号开始。每个人的情况不同，看到的建议也不同。</p>
      <ul class="accounts">
        ${ACCOUNTS.map((a) => `
          <li>
            <button class="account" data-action="login" data-id="${a.id}">
              ${avatar(a, "lg")}
              <span class="account-text">
                <strong>${a.name}${a.type === "hr" ? '<span class="tag">团队视图</span>' : ""}</strong>
                <span>${a.title}${a.age ? `，${a.age} 岁` : ""}</span>
                <span class="muted">${a.blurb}</span>
              </span>
            </button>
          </li>`).join("")}
      </ul>
      <p class="fine">所有人物和数值都是合成数据（SAMPLE），仅供演示。</p>
    </div>
  </main>`;
}

function shell(content) {
  const a = acc();
  const nav = a.type === "hr"
    ? [["team", "团队"], ["trends", "AI 趋势"]]
    : [["home", "首页"], ["trends", "AI 趋势"], ["path", "我的路线"], ["plan", "我的计划"]];
  return `
  <div class="shell">
    <aside class="sidebar">
      <p class="brand"><span class="brand-mark" aria-hidden="true"></span>ReRole Green</p>
      <nav aria-label="主导航">
        ${nav.map(([id, label]) => `<a href="#${id}" class="nav-link" ${S.page === id ? 'aria-current="page"' : ""}>${label}</a>`).join("")}
      </nav>
      <p class="sample">SAMPLE<br><span>合成数据，仅供演示</span></p>
    </aside>
    <div class="main-col">
      <header class="topbar">
        <div class="switcher">
          <button class="who" data-action="menu" aria-expanded="${S.menuOpen}">
            ${avatar(a)}<span>${a.name}</span><span class="muted">${a.title}</span><span class="caret" aria-hidden="true"></span>
          </button>
          ${S.menuOpen ? `
          <div class="menu" role="menu">
            <p class="menu-label">切换账号</p>
            ${ACCOUNTS.map((x) => `<button role="menuitem" data-action="login" data-id="${x.id}" ${x.id === a.id ? 'aria-current="true"' : ""}>${avatar(x, "sm")}${x.name}<span class="muted">${x.title}</span></button>`).join("")}
            <button role="menuitem" class="menu-foot" data-action="logout">回到账号选择</button>
          </div>` : ""}
        </div>
      </header>
      <main class="content" id="content" tabindex="-1">${content}</main>
    </div>
  </div>`;
}

function homeView() {
  const a = acc();
  const groups = ["verified", "rusty", "hidden"].map((k) => ({
    k, list: Object.entries(a.skills).filter(([, v]) => v === k).map(([id]) => SKILLS[id].name),
  }));
  const steps = S.chosen[a.id] ? buildSteps(a, S.chosen[a.id]) : null;
  const doneCount = (S.done[a.id] || []).length;

  return `
  <header class="page-head">
    <h1>你好，${a.name}</h1>
    <p class="lead">${a.title}，${a.years ? a.years + " 年经验" : "刚毕业"}，每周可以学习 ${cond(a).hours} 小时。</p>
  </header>

  <section class="block">
    <h2>你现在有的技能</h2>
    <div class="skill-trio">
      ${groups.map((g) => `
        <div class="trio-col trio-${g.k}">
          <p class="trio-count">${g.list.length}</p>
          <p class="trio-name">${STATUS[g.k].name}</p>
          <p class="muted small">${STATUS[g.k].hint}</p>
          <ul>${g.list.map((n) => `<li>${n}</li>`).join("") || '<li class="muted">暂无</li>'}</ul>
        </div>`).join("")}
    </div>
  </section>

  <section class="block focus">
    <h2>最值得先知道的事</h2>
    <p>${a.focus} ${info("PPT", "PPT 是什么？")}</p>
  </section>

  <section class="block">
    <h2>你的进度</h2>
    ${steps ? `
      <div class="progress" role="progressbar" aria-valuenow="${doneCount}" aria-valuemin="0" aria-valuemax="${steps.length}">
        <span style="width:${(doneCount / steps.length) * 100}%"></span>
      </div>
      <p class="muted">已完成 ${doneCount} 步，共 ${steps.length} 步，目标是${ROLES[S.chosen[a.id]].name}。</p>`
    : `<p class="muted">你还没选路线。先看看 AI 正在怎么改变你的工作。</p>`}
  </section>

  <div class="actions">
    <a class="btn primary" href="#trends">看 AI 怎么改变我的工作</a>
  </div>`;
}

function trendsView() {
  const a = acc();
  const snap = SNAPSHOTS[S.snap];
  const ids = Object.keys(SKILLS).sort((x, y) => trend(y) - trend(x));
  const max = 50;
  const changes = changesSincePrevious();
  const roleIds = Object.keys(ROLES).sort((x, y) => roleDemand(ROLES[y]) - roleDemand(ROLES[x]));
  const mine = a.skills ? Object.keys(a.skills) : [];
  const up = mine.filter((id) => trend(id) > 5).length;
  const down = mine.filter((id) => trend(id) < 0).length;

  return `
  <header class="page-head">
    <h1>世界在怎么变？</h1>
    <p class="lead">数据截至 ${snap.label}，来自 ${SOURCES.length} 个来源。<button class="link" data-action="sources">查看来源</button></p>
  </header>

  <div class="controls">
    <div class="control">
      <span class="control-label">AI 变化速度 ${info("scenario")}</span>
      ${segmented("scenario", S.scenario, [["moderate", "中等"], ["fast", "快速"]])}
    </div>
    <div class="control">
      <span class="control-label">数据时间点</span>
      ${segmented("snap", String(S.snap), SNAPSHOTS.map((s, i) => [String(i), s.label]))}
    </div>
  </div>
  <p class="notice">这些是估计，不是预言。演示数值为合成数据。</p>

  ${a.skills ? `
  <section class="block mine">
    <h2>和你有关的</h2>
    <p>你的 ${mine.length} 项技能里，<strong>${up} 项需求在上升</strong>，${mine.length - up - down} 项基本稳定，<strong>${down} 项在下降</strong>。表里标着「你有」的就是你的技能。</p>
  </section>` : ""}

  <section class="block">
    <div class="block-head">
      <h2>技能需求变化</h2>
      <p class="muted small">和一年前相比。点一行看这个数怎么来的。</p>
    </div>
    <div class="chart" role="table" aria-label="技能需求变化">
      <div class="chart-axis" role="row" aria-hidden="true">
        <span></span><span class="axis-labels"><span>需求下降</span><span>需求上升</span></span><span></span><span></span>
      </div>
      ${ids.map((id) => {
        const v = trend(id);
        const w = (Math.min(Math.abs(v), max) / max) * 50;
        const has = a.skills && a.skills[id];
        return `
        <button class="chart-row" role="row" data-action="skill" data-id="${id}">
          <span class="row-name" role="cell">${SKILLS[id].name}${has ? '<span class="you">你有</span>' : ""}</span>
          <span class="row-bar" role="cell" aria-hidden="true">
            <span class="bar ${v < 0 ? "down" : "up"}" data-bar="${id}" style="${v < 0 ? `right:50%` : `left:50%`};width:${w}%"></span>
          </span>
          <span class="row-val ${v < 0 ? "down" : "up"}" role="cell">${v < 0 ? "↓" : "↑"} ${signed(v)}</span>
          <span role="cell">${confDots(SKILLS[id].conf)}</span>
        </button>`;
      }).join("")}
    </div>
  </section>

  <section class="block">
    <h2>和上一期相比</h2>
    ${changes.length ? `<ul class="changes">${changes.map((c) => `
      <li><span class="${c.delta > 0 ? "up" : "down"}">${c.delta > 0 ? "↑" : "↓"} ${signed(c.delta)}</span><span>${SKILLS[c.id].name}<span class="muted">，从 ${signed(trend(c.id, S.snap - 1))} 变为 ${signed(trend(c.id))}</span></span></li>`).join("")}
    </ul>` : `<p class="muted">这是最早的一期数据，没有可以比较的。选一个更晚的时间点看看变化。</p>`}
  </section>

  <section class="block">
    <div class="block-head">
      <h2>岗位前景</h2>
      <p class="muted small">岗位需求 = 这个岗位所需技能的平均需求变化。</p>
    </div>
    <table class="table">
      <thead><tr><th>岗位</th><th>需求变化</th><th>窗口期 ${info("window")}</th><th>需要执照</th></tr></thead>
      <tbody>${roleIds.map((id) => {
        const r = ROLES[id]; const d = roleDemand(r);
        return `<tr><td>${r.name}</td><td class="${d < 0 ? "down" : "up"}">${d < 0 ? "↓" : "↑"} ${signed(d)}</td><td>${r.window}</td><td>${r.license || "不需要"}</td></tr>`;
      }).join("")}</tbody>
    </table>
  </section>

  ${a.type === "hr" ? "" : `<div class="actions"><a class="btn primary" href="#path">看适合我的路</a></div>`}`;
}

function pathView() {
  const a = acc();
  const paths = bestPaths(a);
  const rec = recommendedTrack(a);
  const track = S.track[a.id] || rec;
  const p = paths.find((x) => x.track === track);
  const r = p.role;
  const have = r.needs.filter((id) => a.skills[id]);
  const missing = r.needs.filter((id) => !a.skills[id]);

  return `
  <header class="page-head">
    <h1>你该往哪走？</h1>
    <p class="lead">下面三条路都可行。系统标出最匹配的一条，由你决定走哪条。</p>
  </header>

  <div class="control goal">
    <span class="control-label">我更在意</span>
    ${segmented("goal", cond(a).goal, [["fast", "快点转工"], ["income", "多赚一点"]])}
    <p class="muted small">${cond(a).goal === "income"
      ? "现在更看重市场需求和收入前景，需要多考执照的岗位也可能排到前面。"
      : "现在更看重你已经会的任务和上手难易，能最快开始新工作的岗位排在前面。"}</p>
  </div>

  <div class="tabs" role="tablist">
    ${paths.map((x) => `
      <button role="tab" aria-selected="${x.track === track}" data-action="track" data-value="${x.track}">
        <span class="tab-name">${TRACKS[x.track].name}${x.track === rec ? '<span class="star">最匹配</span>' : ""}</span>
        <span class="tab-score">${x.score.total}</span>
      </button>`).join("")}
  </div>

  <section class="path-detail">
    <div class="path-main">
      <p class="muted">${TRACKS[track].hint}</p>
      <h2 class="role-title">${r.name}</h2>
      <div class="score-big"><span class="num">${p.score.total}</span><span class="muted">/ 100 匹配度 ${info("match")}</span></div>
      <dl class="parts">
        ${p.score.parts.map((x) => `
          <div class="part">
            <dt>${x.label}</dt>
            <dd><span class="part-bar"><span style="width:${(x.value / x.max) * 100}%"></span></span><span class="part-val">${x.value}<span class="muted">/${x.max}</span></span></dd>
          </div>`).join("")}
      </dl>
    </div>

    <div class="path-side">
      <div class="have-miss">
        <div>
          <h3>你已经会的</h3>
          <ul>${have.map((id) => `<li><span class="mark ok" aria-hidden="true"></span>${SKILLS[id].name}<span class="muted small">${STATUS[a.skills[id]].name}</span></li>`).join("") || '<li class="muted">暂无</li>'}</ul>
        </div>
        <div>
          <h3>你还缺的</h3>
          <ul>${missing.map((id) => `<li><span class="mark gap" aria-hidden="true"></span>${SKILLS[id].name}</li>`).join("") || '<li class="muted">没有缺口</li>'}</ul>
        </div>
      </div>
      <dl class="facts">
        <div><dt>大约需要</dt><dd>${monthsFor(r, a)} 个月（每周 ${cond(a).hours} 小时）</dd></div>
        <div><dt>预计花费</dt><dd>${money(r.cost)}</dd></div>
        <div><dt>法定执照</dt><dd>${r.license || "不需要"}</dd></div>
        <div><dt>窗口期</dt><dd>${r.window} ${info("window")}</dd></div>
        <div><dt>对应 SDG</dt><dd>${sdgTags(r.sdg)}</dd></div>
      </dl>
    </div>
  </section>

  <section class="block">
    <h2>三条路对比</h2>
    <table class="table compare">
      <thead><tr><th></th>${paths.map((x) => `<th ${x.track === track ? 'class="current"' : ""}>${TRACKS[x.track].name}</th>`).join("")}</tr></thead>
      <tbody>
        <tr><th>岗位</th>${paths.map((x) => `<td>${x.role.name}</td>`).join("")}</tr>
        <tr><th>匹配度</th>${paths.map((x) => `<td><strong>${x.score.total}</strong></td>`).join("")}</tr>
        <tr><th>需要时间</th>${paths.map((x) => `<td>${monthsFor(x.role, a)} 个月</td>`).join("")}</tr>
        <tr><th>预计花费</th>${paths.map((x) => `<td>${money(x.role.cost)}</td>`).join("")}</tr>
        <tr><th>法定执照</th>${paths.map((x) => `<td>${x.role.license || "不需要"}</td>`).join("")}</tr>
        <tr><th>窗口期</th>${paths.map((x) => `<td>${x.role.window}</td>`).join("")}</tr>
      </tbody>
    </table>
  </section>

  <div class="actions">
    <button class="btn primary" data-action="choose" data-id="${p.id}">选这条路：${r.name}</button>
    ${S.chosen[a.id] && S.chosen[a.id] !== p.id ? `<p class="muted small">你目前选的是${ROLES[S.chosen[a.id]].name}。换路后，已完成的步骤会保留。</p>` : ""}
  </div>`;
}

function planView() {
  const a = acc();
  const roleId = S.chosen[a.id];
  if (!roleId) {
    return `
    <header class="page-head"><h1>这周做什么？</h1></header>
    <div class="empty">
      <p>你还没选路线，所以还没有计划。选好路线后，这里会按你的时间和预算排好每一步。</p>
      <a class="btn primary" href="#path">去选路线</a>
    </div>`;
  }
  const c = cond(a);
  const steps = buildSteps(a, roleId);
  const done = S.done[a.id] || [];
  const current = steps.findIndex((s) => !done.includes(s.title));
  const now = steps[current];

  return `
  <header class="page-head">
    <h1>这周做什么？</h1>
    <p class="lead">目标：${ROLES[roleId].name}。改动下面的条件，计划会马上重排。</p>
  </header>

  <section class="block conditions">
    <h2>我的条件</h2>
    <div class="controls">
      <div class="control"><span class="control-label">每周时间</span>${segmented("hours", String(c.hours), [["2", "2 小时"], ["4", "4 小时"], ["8", "8 小时"]])}</div>
      <div class="control"><span class="control-label">每月预算</span>${segmented("budget", String(c.budget), [["0", "RM 0"], ["100", "RM 100"], ["300", "RM 300 以上"]])}</div>
      <div class="control"><span class="control-label">我更在意</span>${segmented("goal", c.goal, [["fast", "快点转工"], ["income", "多赚一点"]])}</div>
    </div>
  </section>

  <div class="plan-grid">
    <section class="block">
      <h2>你的 ${steps.length} 步</h2>
      <ol class="timeline">
        ${steps.map((s, i) => {
          const isDone = done.includes(s.title);
          const state = isDone ? "done" : i === current ? "current" : "todo";
          return `
          <li class="step ${state} ${s.locked ? "locked" : ""}">
            <span class="dot" aria-hidden="true"></span>
            <div class="step-body">
              <p class="step-when">${isDone ? "已完成" : `第 ${s.week} 周开始，约 ${s.weeks} 周`}</p>
              <h3>${s.title}${s.term ? " " + info(s.term) : ""}</h3>
              <p class="muted">${s.detail}</p>
              <p class="step-meta">
                <span>${s.provider}</span>
                <span>${s.hours} 小时</span>
                <span>${money(s.cost)}</span>
                ${s.covered ? `<span class="ok-text">HRD Corp 可报销 ${info("HRD")}</span>` : ""}
              </p>
              ${s.locked ? `<p class="warn">超出你的预算，目前无法免费完成。可以申请：HRD Corp 失业人士培训资助、SEDA 培训补贴（资格待核实）。</p>` : ""}
              ${state === "current" && !s.locked ? `<button class="btn secondary sm" data-action="done" data-title="${esc(s.title)}">标记为完成</button>` : ""}
            </div>
          </li>`;
        }).join("")}
      </ol>
    </section>

    <aside class="block week">
      <h2>本周任务</h2>
      ${now ? `
        <p class="muted small">来自第 ${current + 1} 步：${now.title}</p>
        <ul class="checklist">
          <li><label><input type="checkbox"> 学习 ${Math.ceil(c.hours / 2)} 小时：${now.title}</label></li>
          <li><label><input type="checkbox"> 证据 ${Math.floor(c.hours / 2) || 1} 小时：在工作中记录一次异常处理过程（先问主管）</label></li>
        </ul>` : `<p>全部完成了。可以回到路线页看看下一个目标。</p>`}
      <div class="week-actions">
        <button class="btn primary" data-action="card">查看我的转型卡</button>
        <a class="btn secondary" href="#path">我想换方向</a>
      </div>
    </aside>
  </div>`;
}

function teamView() {
  const t = TEAM;
  const level = (v) => (v >= 60 ? "full" : v >= 25 ? "part" : "gap");
  const levelName = { full: "足够", part: "一部分人有", gap: "缺口" };
  return `
  <header class="page-head">
    <h1>你的团队缺什么？</h1>
    <p class="lead">${t.name}，${t.size} 人。格子里是已有这项技能的人数比例（合成数据）。</p>
  </header>

  <section class="block">
    <h2>技能缺口</h2>
    <div class="heat-wrap">
      <table class="heat">
        <thead><tr><th></th>${t.skills.map((id) => `<th>${SKILLS[id].name}</th>`).join("")}</tr></thead>
        <tbody>${t.groups.map((g) => `
          <tr><th>${g.name}<span class="muted small">${g.count} 人</span></th>
          ${g.have.map((v) => `<td class="cell ${level(v)}" title="${levelName[level(v)]}">${v}%</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </div>
    <p class="legend">
      <span><i class="cell full"></i>足够（60% 以上）</span>
      <span><i class="cell part"></i>一部分人有（25–59%）</span>
      <span><i class="cell gap"></i>缺口（25% 以下）</span>
    </p>
  </section>

  <section class="block">
    <h2>关键发现</h2>
    <ul class="findings">${t.findings.map((f) => `<li>${f}</li>`).join("")}</ul>
  </section>

  ${S.showTeamPlan ? `
  <section class="block">
    <h2>团队培训建议</h2>
    <table class="table">
      <thead><tr><th>对象</th><th>建议</th><th>费用</th></tr></thead>
      <tbody>${t.plan.map((p) => `<tr><td>${p.who}</td><td>${p.what}</td><td>${p.cost}</td></tr>`).join("")}</tbody>
    </table>
  </section>` : ""}

  <div class="actions">
    ${S.showTeamPlan ? "" : `<button class="btn primary" data-action="teamplan">生成团队培训建议</button>`}
    <p class="muted small">这些只是建议。每位员工的路线由员工本人决定，系统不做录用或淘汰判断。</p>
  </div>`;
}

/* ---------- 抽屉 ---------- */

function openDrawer(html) {
  $drawer.innerHTML = `<button class="drawer-close" data-action="close" aria-label="关闭">×</button>${html}`;
  $drawer.hidden = false;
  $scrim.hidden = false;
  requestAnimationFrame(() => document.body.classList.add("drawer-open"));
  $drawer.focus();
}

function closeDrawer() {
  document.body.classList.remove("drawer-open");
  $drawer.hidden = true;
  $scrim.hidden = true;
}

function skillDrawer(id) {
  const s = SKILLS[id];
  const a = acc();
  const v = trend(id);
  const snap = SNAPSHOTS[S.snap];
  return `
  <h2>${s.name}</h2>
  <p class="drawer-big ${v < 0 ? "down" : "up"}">${v < 0 ? "↓" : "↑"} ${signed(v)}</p>
  <p class="muted">和一年前相比，${S.scenario === "fast" ? "快速" : "中等"}变化情景，数据截至 ${snap.label}。</p>
  ${a.skills && a.skills[id] ? `<p class="you-line">你有这项技能：${STATUS[a.skills[id]].name}（${STATUS[a.skills[id]].hint}）</p>` : ""}
  <h3>为什么会这样</h3>
  <p>${s.kind}。</p>
  <h3>这个数怎么来的</h3>
  <p>招聘广告里提到这项技能的次数变化，再按 AI 在这项任务上的使用程度调整。</p>
  <h3>来源</h3>
  <ul class="src-list">
    ${SOURCES.slice(0, s.conf >= 2 ? 3 : 1).concat(SOURCES[3]).map((src) => `
      <li>${src.url ? `<a href="${src.url}" target="_blank" rel="noopener">${src.name}</a>` : src.name}<span class="muted small">抓取于 ${snap.retrieved}</span></li>`).join("")}
  </ul>
  <h3>信心 ${info("conf")}</h3>
  <p>${confDots(s.conf)}</p>
  <h3>对应 SDG</h3>
  <p>${s.sdg.map((g) => `<span class="sdg">SDG ${g} ${SDG[g]}</span>`).join("")}</p>`;
}

function sourcesDrawer() {
  const snap = SNAPSHOTS[S.snap];
  return `
  <h2>数据来源</h2>
  <p class="muted">每条记录都保存来源、抓取日期和版本。当前版本：${snap.id}。</p>
  <ul class="src-list big">
    ${SOURCES.map((s) => `<li>${s.url ? `<a href="${s.url}" target="_blank" rel="noopener">${s.name}</a>` : `<strong>${s.name}</strong>`}<span>${s.what}</span><span class="muted small">抓取于 ${snap.retrieved}</span></li>`).join("")}
  </ul>
  <p class="notice">本演示中的数值为合成数据，用来展示数据结构和界面，不代表真实统计。</p>`;
}

function glossaryDrawer(key) {
  const g = GLOSSARY[key];
  return `<h2>${g.title}</h2><p>${g.body}</p>${g.url ? `<p><a href="${g.url}" target="_blank" rel="noopener">官方网站</a></p>` : ""}`;
}

function cardDrawer() {
  const a = acc();
  const roleId = S.chosen[a.id];
  const r = ROLES[roleId];
  const steps = buildSteps(a, roleId);
  const first = steps[0];
  const score = match(a, r).total;
  const fastDemand = Math.round(r.needs.map((id) => trend(id, S.snap, "fast")).reduce((x, y) => x + y, 0) / r.needs.length);
  const modDemand = Math.round(r.needs.map((id) => trend(id, S.snap, "moderate")).reduce((x, y) => x + y, 0) / r.needs.length);
  const have = r.needs.filter((id) => a.skills[id]).length;
  return `
  <div class="card-print">
    <p class="muted small">我的转型卡</p>
    <h2>${a.name}：${r.name}</h2>
    <dl class="facts">
      <div><dt>路线</dt><dd>${TRACKS[r.track].name}，匹配度 ${score}</dd></div>
      <div><dt>第一步</dt><dd>${first.title}（约 ${first.weeks} 周，${money(first.cost)}）</dd></div>
      <div><dt>技能</dt><dd>已经会 ${have} 项，还缺 ${r.needs.length - have} 项</dd></div>
      <div><dt>还缺执照</dt><dd>${r.license || "不需要"}</dd></div>
      <div><dt>两种情景</dt><dd>岗位需求：中等 ${signed(modDemand)}，快速 ${signed(fastDemand)}</dd></div>
      <div><dt>什么时候该换路</dt><dd>第 8 周还没完成前两步，或者窗口期变为「短」</dd></div>
      <div><dt>SDG 贡献</dt><dd>${sdgTags(r.sdg)}</dd></div>
    </dl>
    <p class="muted small">数据截至 ${SNAPSHOTS[S.snap].label}。合成数据（SAMPLE），估计值，不承诺就业或薪资。</p>
  </div>
  <button class="btn primary" data-action="print">打印或存为 PDF</button>`;
}

/* ---------- 渲染与事件 ---------- */

function render() {
  if (!S.account) {
    $app.innerHTML = pickerView();
    return;
  }
  const a = acc();
  const allowed = a.type === "hr" ? ["team", "trends"] : ["home", "trends", "path", "plan"];
  if (!allowed.includes(S.page)) S.page = allowed[0];
  const views = { home: homeView, trends: trendsView, path: pathView, plan: planView, team: teamView };

  // 记下旧条形的位置，重绘后从旧位置过渡到新位置，让变化看得见。
  const before = {};
  $app.querySelectorAll("[data-bar]").forEach((b) => { before[b.dataset.bar] = b.getAttribute("style"); });
  $app.innerHTML = shell(views[S.page]());
  const bars = [...$app.querySelectorAll("[data-bar]")].filter((b) => before[b.dataset.bar]);
  if (!bars.length) return;
  const after = bars.map((b) => b.getAttribute("style"));
  bars.forEach((b) => b.setAttribute("style", before[b.dataset.bar]));
  void $app.offsetWidth;
  bars.forEach((b, i) => b.setAttribute("style", after[i]));
}

function go(page) {
  if (location.hash.slice(1) === page) render();
  else location.hash = page;
}

window.addEventListener("hashchange", () => {
  S.page = location.hash.slice(1) || "home";
  S.menuOpen = false;
  render();
  window.scrollTo(0, 0);
});

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) {
    if (S.menuOpen && !e.target.closest(".switcher")) { S.menuOpen = false; render(); }
    return;
  }
  const a = S.account && acc();
  const { action } = el.dataset;

  if (action === "login") {
    S.account = el.dataset.id;
    S.menuOpen = false;
    const home = acc().type === "hr" ? "team" : "home";
    go(home);
  } else if (action === "logout") {
    S.account = null; S.menuOpen = false; history.replaceState(null, "", location.pathname); render();
  } else if (action === "menu") {
    S.menuOpen = !S.menuOpen; render();
  } else if (action === "set") {
    const { name, value } = el.dataset;
    if (name === "scenario") S.scenario = value;
    else if (name === "snap") S.snap = Number(value);
    else if (name === "goal") { cond(a).goal = value; delete S.track[a.id]; }
    else cond(a)[name] = Number(value);
    render();
  } else if (action === "track") {
    S.track[a.id] = el.dataset.value; render();
  } else if (action === "choose") {
    S.chosen[a.id] = el.dataset.id; go("plan");
  } else if (action === "done") {
    (S.done[a.id] = S.done[a.id] || []).push(el.dataset.title); render();
  } else if (action === "teamplan") {
    S.showTeamPlan = true; render();
  } else if (action === "skill") {
    openDrawer(skillDrawer(el.dataset.id));
  } else if (action === "sources") {
    openDrawer(sourcesDrawer());
  } else if (action === "glossary") {
    e.stopPropagation(); openDrawer(glossaryDrawer(el.dataset.key));
  } else if (action === "card") {
    openDrawer(cardDrawer());
  } else if (action === "print") {
    window.print();
  } else if (action === "close") {
    closeDrawer();
  }
});

$scrim.addEventListener("click", closeDrawer);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { closeDrawer(); if (S.menuOpen) { S.menuOpen = false; render(); } }
});

// 演示用：?as=ahmad#trends 直接以某个账号打开某一页。
const startAs = new URLSearchParams(location.search).get("as");
if (ACCOUNTS.some((a) => a.id === startAs)) {
  S.account = startAs;
  S.page = location.hash.slice(1);
  if (S.page === "plan") S.chosen[startAs] = bestPaths(acc()).sort((x, y) => y.score.total - x.score.total)[0].id;
}
render();
