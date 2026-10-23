// ReRole Green 演示数据。
// 所有人物和数值都是合成数据（SAMPLE），只用来展示界面；结构按提案里的真实来源设计。

const SNAPSHOTS = [
  { id: "2025-01", label: "2025 年 1 月", retrieved: "2025-01-20" },
  { id: "2025-09", label: "2025 年 9 月", retrieved: "2025-09-18" },
  { id: "2026-03", label: "2026 年 3 月", retrieved: "2026-03-15" },
];

const SOURCES = [
  { name: "Anthropic Economic Index", what: "AI 在各项工作任务中的实际使用程度", url: "https://huggingface.co/datasets/Anthropic/EconomicIndex" },
  { name: "ILO 生成式 AI 职业暴露指数", what: "各职业受生成式 AI 影响的理论上限", url: "https://www.ilo.org" },
  { name: "OpenDOSM 劳动力统计", what: "马来西亚官方就业数据", url: "https://open.dosm.gov.my" },
  { name: "求职网站人工抽样", what: "每期约 100 条招聘广告里出现的技能关键词，只记录岗位信息", url: null },
];

const SDG = {
  4: "优质教育",
  7: "清洁能源",
  8: "体面工作和经济增长",
  9: "产业、创新和基础设施",
  11: "可持续城市和社区",
};

// trend：三期快照中的需求变化（%），中等情景。fast：快速情景下的放大系数。
const SKILLS = {
  fault:      { name: "异常排查与故障诊断",   trend: [12, 18, 24],   fast: 1.15, conf: 3, sdg: [8, 9],  kind: "判断层任务，AI 只能辅助，需要人在现场判断" },
  inverter:   { name: "逆变器故障诊断",       trend: [14, 21, 32],   fast: 1.15, conf: 3, sdg: [7, 8],  kind: "判断层任务，光伏电站扩张带动需求" },
  pvsafety:   { name: "光伏现场安全评估",     trend: [10, 17, 24],   fast: 1.15, conf: 3, sdg: [7, 8],  kind: "法定安全要求，必须由人负责" },
  evmaint:    { name: "EV 充电桩维护",        trend: [8, 15, 19],    fast: 1.1,  conf: 2, sdg: [7, 11], kind: "充电网络扩张中，岗位还在成形" },
  pvinstall:  { name: "光伏基础安装",         trend: [16, 14, 9],    fast: 0.7,  conf: 2, sdg: [7],     kind: "需求仍在上升，但相关课程增长更快，竞争变大" },
  elecsafety: { name: "电气安全检查与上锁挂牌", trend: [6, 8, 10],   fast: 1.1,  conf: 3, sdg: [8],     kind: "所有电气岗位的基础要求" },
  automation: { name: "与自动化设备协作",     trend: [9, 12, 15],    fast: 1.2,  conf: 2, sdg: [8, 9],  kind: "增强型任务，AI 和机器让这项工作更重要" },
  bess:       { name: "储能电池系统维护",     trend: [5, 11, 17],    fast: 1.1,  conf: 1, sdg: [7],     kind: "新兴领域，来源少，信心较低" },
  mentoring:  { name: "指导新人",             trend: [4, 5, 6],      fast: 1.0,  conf: 1, sdg: [4],     kind: "人际任务，受 AI 影响小" },
  machineop:  { name: "基础设备操作",         trend: [-3, -6, -9],   fast: 1.6,  conf: 2, sdg: [9],     kind: "重复性操作，正在被自动化替代" },
  visual:     { name: "人工目检",             trend: [-6, -11, -15], fast: 1.6,  conf: 2, sdg: [9],     kind: "视觉检测系统正在接手这项工作" },
  paramlog:   { name: "手工参数记录",         trend: [-12, -20, -28], fast: 1.6, conf: 3, sdg: [8],     kind: "高 AI 暴露任务，传感器和软件已能自动记录" },
};

// pay：收入前景（0–1，示例值）。track：stay 留在原岗升级，evolve 转向绿色岗位，pivot 换新跑道，decline 正在缩小的岗位。
const ROLES = {
  autotech:    { name: "自动化产线技术员",   track: "stay",   needs: ["fault", "automation", "elecsafety", "machineop"], license: null,           months: 2, cost: 0,    pay: 0.4, window: "稳定", sdg: ["8.2", "9.4"] },
  pvom:        { name: "光伏运维技术员",     track: "evolve", needs: ["fault", "inverter", "pvsafety", "elecsafety"],   license: "GCPV 认证",     months: 4, cost: 450,  pay: 0.8, window: "长",   sdg: ["4.4", "7.2", "8.5"] },
  pvinstaller: { name: "光伏安装员",         track: "evolve", needs: ["pvinstall", "pvsafety", "elecsafety"],           license: "GCPV 认证",     months: 3, cost: 300,  pay: 0.5, window: "收窄", sdg: ["4.3", "7.2"] },
  evtech:      { name: "EV 充电桩安装维护员", track: "pivot",  needs: ["evmaint", "elecsafety", "fault", "automation"],  license: "ST 电气资格证", months: 7, cost: 1200, pay: 0.7, window: "中",   sdg: ["4.4", "7.2", "11.2"] },
  besstech:    { name: "储能系统技术员",     track: "pivot",  needs: ["bess", "inverter", "elecsafety", "fault"],       license: "ST 电气资格证", months: 8, cost: 1500, pay: 0.9, window: "长",   sdg: ["4.4", "7.2", "8.5"] },
  paramclerk:  { name: "产线数据记录员",     track: "decline", needs: ["paramlog", "machineop"],                        license: null,           months: 0, cost: 0,    pay: 0.1, window: "短",   sdg: ["8.5"] },
  qcvisual:    { name: "人工质检员",         track: "decline", needs: ["visual", "machineop"],                          license: null,           months: 0, cost: 0,    pay: 0.1, window: "短",   sdg: ["8.5"] },
};

const TRACKS = {
  stay:   { name: "留在原岗升级", hint: "不换工作，把重心移到 AI 替代不了的任务" },
  evolve: { name: "转向绿色岗位", hint: "用现有经验进入相近的绿色岗位" },
  pivot:  { name: "换新跑道",     hint: "进入新领域，时间和花费更多" },
};

// 补技能差距用的示例课程。费用和开课日期需在提交前核实。
const COURSES = {
  fault:      { name: "设备故障诊断实务",     provider: "HRD Corp 课程目录",   hours: 16, cost: 0,   hrd: true },
  inverter:   { name: "逆变器故障诊断入门",   provider: "SEDA 认可培训机构",   hours: 20, cost: 150, hrd: true },
  pvsafety:   { name: "光伏现场安全短课程",   provider: "SEDA 认可培训机构",   hours: 16, cost: 300, hrd: true },
  evmaint:    { name: "EV 充电设备维护",       provider: "HRD Corp 课程目录",   hours: 24, cost: 400, hrd: true },
  pvinstall:  { name: "光伏系统安装基础",     provider: "SEDA 认可培训机构",   hours: 24, cost: 250, hrd: true },
  elecsafety: { name: "电气安全与上锁挂牌",   provider: "免费网课",            hours: 8,  cost: 0,   hrd: false },
  automation: { name: "与工业机器人协作基础", provider: "免费网课",            hours: 12, cost: 0,   hrd: false },
  bess:       { name: "储能电池系统入门",     provider: "HRD Corp 课程目录",   hours: 24, cost: 500, hrd: true },
};

const LICENSES = {
  "GCPV 认证":     { cost: 600, hours: 24, provider: "SEDA Malaysia", url: "https://www.seda.gov.my" },
  "ST 电气资格证": { cost: 800, hours: 40, provider: "能源委员会（Suruhanjaya Tenaga）", url: "https://www.st.gov.my" },
};

// skills 的值：verified 有证书也在做，rusty 有证书没在做，hidden 在做但没证书。
const ACCOUNTS = [
  {
    id: "ahmad", name: "Ahmad", age: 28, title: "产线技术员", years: 5, color: "#0F5C4D",
    blurb: "有电气证书，五年没做过电气工作", hours: 4, budget: 100, employed: true,
    skills: { automation: "verified", machineop: "verified", paramlog: "verified", elecsafety: "rusty", fault: "hidden", mentoring: "hidden" },
    interest: { stay: 0.4, evolve: 0.9, pivot: 0.6 },
    focus: "你每天做的「异常排查」在光伏运维岗位里需求正在上升。你没有这方面的证书，但可以通过 PPT 申请认证，不用重新上课。",
  },
  {
    id: "siti", name: "Siti", age: 34, title: "质检员", years: 8, color: "#8A5A00",
    blurb: "每周只能抽出 2 小时学习", hours: 2, budget: 100, employed: true,
    skills: { visual: "verified", paramlog: "verified", machineop: "verified", fault: "hidden" },
    interest: { stay: 0.8, evolve: 0.5, pivot: 0.3 },
    focus: "你每周只有 2 小时，所以第一步要短而且免费：先把你处理异常的经验认证下来。",
  },
  {
    id: "raj", name: "Raj", age: 41, title: "维修技工", years: 15, color: "#5B4B8A",
    blurb: "经验丰富，但大多没有证书", hours: 4, budget: 300, employed: true,
    skills: { machineop: "verified", automation: "verified", fault: "hidden", elecsafety: "hidden", inverter: "hidden", mentoring: "hidden" },
    interest: { stay: 0.5, evolve: 0.7, pivot: 0.8 },
    focus: "你有 4 项隐藏技能：每天都在做，却没有证书。通过 PPT 把它们认证下来，是成本最低的第一步。",
  },
  {
    id: "meiling", name: "Mei Ling", age: 22, title: "TVET 应届生", years: 0, color: "#A23B5A",
    blurb: "刚毕业，还没决定往哪走", hours: 8, budget: 100, employed: false,
    skills: { elecsafety: "verified", pvinstall: "verified" },
    interest: { stay: 0.2, evolve: 0.8, pivot: 0.9 },
    focus: "你已经有光伏基础安装的证书，但这项技能的课程正在变多，竞争变大。可以考虑往判断层发展，例如逆变器诊断。",
  },
  {
    id: "farid", name: "Farid", age: 30, title: "求职中", years: 6, color: "#2F6690",
    blurb: "刚被裁员，目前没有学习预算", hours: 8, budget: 0, employed: false,
    skills: { machineop: "verified", paramlog: "verified", elecsafety: "verified", automation: "rusty" },
    interest: { stay: 0.6, evolve: 0.6, pivot: 0.5 },
    focus: "你目前的预算是 0。系统会先安排免费的步骤；需要付费的执照会如实标出，并告诉你可以申请哪些补贴。",
  },
  {
    id: "aisyah", name: "Puan Aisyah", title: "HR 经理", color: "#3D6B35", type: "hr",
    blurb: "负责一条 40 人的产线团队",
  },
];

const TEAM = {
  name: "E&E 产线 A",
  size: 40,
  skills: ["fault", "elecsafety", "automation", "pvsafety", "inverter"],
  groups: [
    { name: "技术员", count: 18, have: [70, 45, 60, 5, 0] },
    { name: "质检员", count: 12, have: [30, 10, 25, 0, 0] },
    { name: "维修技工", count: 10, have: [85, 80, 40, 20, 15] },
  ],
  findings: [
    "维修技工离光伏运维岗位最近：80% 已有电气安全能力，缺口主要在光伏安全和逆变器诊断。",
    "技术员的「手工参数记录」需求在下降。先培训「与自动化设备协作」，可以让他们留在原岗。",
    "质检员整体缺口最大，适合从免费的电气安全网课开始。",
  ],
  plan: [
    { who: "维修技工（10 人）", what: "6 人先通过 PPT 认证故障诊断，再报光伏现场安全短课程", cost: "HRD Corp 可报销" },
    { who: "技术员（18 人）", what: "与工业机器人协作基础（免费网课），每周 2 小时", cost: "免费" },
    { who: "质检员（12 人）", what: "电气安全与上锁挂牌（免费网课）", cost: "免费" },
  ],
};

const GLOSSARY = {
  PPT: { title: "PPT（先前成就认证）", body: "马来西亚技能发展局（JPK）的制度：有经验但没有证书的人，可以用工作证据申请 SKM 证书，不用重新上课。", url: "https://www.dsd.gov.my" },
  HRD: { title: "HRD Corp 可报销", body: "雇主已向 HRD Corp 注册时，员工上这门课的费用可以由雇主的培训基金支付。", url: "https://hrdcorp.gov.my" },
  window: { title: "窗口期", body: "这项技能还能保持抢手多久。需求增长快、课程供给增长慢，窗口期就长；课程越开越多，窗口期就在收窄。" },
  match: { title: "匹配度怎么算", body: "满分 100，权重随你的目标变化，全部公开，不是黑箱。选「快点转工」：任务重叠 40、市场需求 25、你的兴趣 15、上手容易 20。选「多赚一点」：任务重叠 25、市场需求 25、收入前景 20、你的兴趣 15、上手容易 15。" },
  conf: { title: "信心", body: "三个点表示高：至少两个来源方向一致。两个点是中。一个点是低：只有一个来源，或者来源之间有分歧。" },
  scenario: { title: "情景", body: "中等变化按目前观察到的 AI 实际使用程度推算；快速变化按 AI 影响的理论上限推算。两者都是估计。" },
};
