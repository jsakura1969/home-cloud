// COPD エビデンス・ショート（30秒×5本）の HyperFrames コンポジションを生成する。
// 内容は ../evidence.md のエビデンス表に対応（各シーンの src が出典）。
// 使い方: node build/generate.mjs  → v1.html … v5.html（プロジェクト直下。HyperFrames は ../ の参照を許さないため）
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const W = 1080;
const H = 1920;
const DURATION = 30;
// 5シーン構成: 導入 / 根拠1 / 根拠2 / 根拠3 / まとめ
const SLOTS = [
  [0, 4],
  [4, 11],
  [11, 18],
  [18, 24.5],
  [24.5, 30],
];

// ---------------------------------------------------------------- content
const VIDEOS = [
  {
    id: "v1",
    theme: "COPDはどれくらい多い？",
    scenes: [
      { type: "hook", kicker: "慢性閉塞性肺疾患", title: "COPDって<br>知ってる？", sub: "たばこ・大気汚染で肺が傷み、<br>息が吐き出しにくくなる病気" },
      {
        type: "stat", label: "世界の患者数（2021年）", count: 2.13, decimals: 2, unit: "億人",
        sub: "2億1,340万人が COPD を抱えている",
        src: "Cao Z, et al. BMJ Public Health 2026（GBD 2021）｜PMID 41561564",
      },
      {
        type: "stat", label: "COPDによる死亡（1年間）", count: 370, unit: "万人",
        sub: "世界の死因 <b>第3位</b>",
        src: "Cao Z, et al. BMJ Public Health 2026｜PMID 41561564 ／ Chen S, et al. Lancet Glob Health 2023｜PMID 37474226",
      },
      {
        type: "icons", label: "40歳以上では", big: "約8人に1人", total: 8, hit: 1,
        note: "肺機能検査（FEV1/FVC＜0.7）で12.6%。診断基準により約7〜13%",
        src: "Al Wachami N, et al. BMC Public Health 2024（メタ解析 42研究）｜PMID 38273271",
      },
      {
        type: "close", kicker: "最大のリスク因子", lines: ["大気の微粒子（PM）", "そして喫煙"],
        take: "息切れ・せき・たんが続くなら<br>早めに受診を",
        src: "Cao Z, et al. BMJ Public Health 2026（PM は DALYs の41.7%）｜PMID 41561564",
      },
    ],
  },
  {
    id: "v2",
    theme: "禁煙は治療の土台",
    scenes: [
      { type: "hook", kicker: "COPDの治療", title: "まず最初に<br>やることは？", sub: "答えは、薬より先に「禁煙」" },
      {
        type: "stat", label: "Lung Health Study（RCT）", count: 5887, unit: "人",
        sub: "軽い気流閉塞のある喫煙者を<br>禁煙支援 vs 通常ケアに割り付け",
        src: "Anthonisen NR, et al. Ann Intern Med 2005｜PMID 15710956",
      },
      {
        type: "compare", label: "14.5年後の全死亡（1000人年あたり）",
        bars: [
          { name: "通常ケア", value: 10.38, tone: "muted" },
          { name: "禁煙支援", value: 8.83, tone: "accent" },
        ],
        caption: "禁煙支援を受けた群で<b>死亡が少なかった</b>（HR 1.18、95%CI 1.02–1.37）",
        src: "Anthonisen NR, et al. Ann Intern Med 2005｜PMID 15710956",
      },
      {
        type: "stat", label: "32.5年後も", big: "呼吸器死亡↓",
        sub: "肺がん以外の呼吸器疾患による死亡を<br>減らす効果が続いていた（HR 1.21）",
        note: "※全死亡の差は32.5年時点では有意でなくなった",
        src: "Zhang J, et al. Am J Epidemiol 2026｜PMID 41164942",
      },
      {
        type: "close", kicker: "まとめ", lines: ["禁煙支援は", "COPD治療の土台"],
        take: "成功したのが一部の人でも<br>集団の死亡を減らした",
        src: "Anthonisen NR, et al. Ann Intern Med 2005｜PMID 15710956",
      },
    ],
  },
  {
    id: "v3",
    theme: "吸入薬：2剤から3剤へ",
    scenes: [
      { type: "hook", kicker: "増悪をくり返す人の吸入薬", title: "2剤か、<br>3剤か", sub: "吸入ステロイド ＋ 気管支拡張薬2種" },
      {
        type: "compare", label: "IMPACT試験：増悪（回/年）",
        bars: [
          { name: "2剤 UMEC/VI", value: 1.21, tone: "muted" },
          { name: "3剤", value: 0.91, tone: "accent" },
        ],
        caption: "3剤で増悪が<b>25%減</b>（10,355人）",
        src: "Lipson DA, et al. NEJM 2018｜PMID 29668352｜NCT02164513",
      },
      {
        type: "compare", label: "ETHOS試験：増悪（回/年）",
        bars: [
          { name: "2剤 GFF", value: 1.42, tone: "muted" },
          { name: "3剤 BGF320", value: 1.08, tone: "accent" },
        ],
        caption: "別の3剤でも<b>24%減</b>（8,509人）",
        src: "Rabe KF, et al. NEJM 2020｜PMID 32579807｜NCT02465567",
      },
      {
        type: "duo", label: "死亡リスクの低下も報告",
        cards: [
          { name: "IMPACT", value: "HR 0.72", sub: "vs UMEC/VI" },
          { name: "ETHOS", value: "HR 0.51", sub: "vs GFF" },
        ],
        note: "※どちらも追加データを集めた二次解析の結果",
        src: "Lipson DA, et al. AJRCCM 2020｜PMID 32162970 ／ Martinez FJ, et al. AJRCCM 2021｜PMID 33252985",
      },
      {
        type: "close", kicker: "注意点", lines: ["ICSを含む薬では", "肺炎が増える"], tone: "warn",
        take: "対象は「増悪歴のある人」<br>使い分けは主治医と相談を",
        src: "IMPACT: 肺炎 HR 1.53｜PMID 29668352 ／ ETHOS: 3.5–4.5% vs 2.3%｜PMID 32579807",
      },
    ],
  },
  {
    id: "v4",
    theme: "新しい治療：生物学的製剤",
    scenes: [
      { type: "hook", kicker: "3剤を使っても増悪する人へ", title: "注射で<br>炎症を抑える", sub: "COPDにも「生物学的製剤」の時代" },
      {
        type: "stat", label: "対象になる目印", big: "好酸球 ≥300",
        sub: "血液中の好酸球（/μL）が多い<br>＝ 2型炎症のタイプ",
        src: "BOREAS/NOTUS・MATINEE の登録基準｜PMID 39900091, 40305712",
      },
      {
        type: "compare", label: "中等度〜重度の増悪（回/年）",
        bars: [
          { name: "プラセボ", value: 1.156, tone: "muted" },
          { name: "デュピルマブ", value: 0.794, tone: "accent" },
          { name: "プラセボ", value: 1.01, tone: "muted" },
          { name: "メポリズマブ", value: 0.8, tone: "accent2" },
        ],
        caption: "デュピルマブ <b>約31%減</b>（1,874人）／ メポリズマブ <b>21%減</b>（804人）",
        src: "Bhatt SP, et al. Lancet Respir Med 2025｜PMID 39900091 ／ Sciurba FC, et al. NEJM 2025｜PMID 40305712",
      },
      {
        type: "duo", label: "米国FDAで COPD の適応",
        cards: [
          { name: "Dupixent", value: "注射", sub: "デュピルマブ" },
          { name: "Nucala", value: "注射", sub: "メポリズマブ" },
          { name: "Ohtuvayre", value: "吸入", sub: "エンシフェントリン（2024）" },
        ],
        note: "※米国の承認情報。日本の承認状況は別途確認を",
        src: "FDA label BLA 761055 ／ DailyMed Nucala ／ FDA NDA 217389",
      },
      {
        type: "close", kicker: "まとめ", lines: ["タイプを見分けて", "治療を上乗せ"],
        take: "重い増悪の年間回数では<br>デュピルマブに有意差なし",
        src: "Bhatt SP, et al. Lancet Respir Med 2025（重度増悪 RR 0.674, p=0.073）｜PMID 39900091",
      },
    ],
  },
  {
    id: "v5",
    theme: "薬以外の治療",
    scenes: [
      { type: "hook", kicker: "COPDの治療", title: "薬だけじゃ<br>ない", sub: "リハビリ・ワクチン・酸素" },
      {
        type: "stat", label: "呼吸リハビリで6分間の歩行距離が", count: 44, unit: "m 伸びた", prefix: "+",
        sub: "息切れ・疲れ・生活の質も改善<br>（65件のRCT、3,822人）",
        src: "McCarthy B, et al. Cochrane 2015｜PMID 25705944",
      },
      {
        type: "stat", label: "インフルエンザワクチン（不活化）", big: "増悪が減る",
        sub: "1人あたりの増悪回数 −0.37",
        note: "※試験数が少なく、エビデンスの質は低い",
        src: "Kopsaftis Z, et al. Cochrane 2018｜PMID 29943802",
      },
      {
        type: "duo", label: "在宅酸素は、効く人が限られる",
        cards: [
          { name: "重い低酸素", value: "生存↑", sub: "夜間だけの群は死亡1.94倍（NOTT）", tone: "accent" },
          { name: "中等度の低酸素", value: "差なし", sub: "SpO2 89–93%で死亡・入院 HR 0.94（LOTT）", tone: "muted" },
        ],
        src: "NOTT Group. Ann Intern Med 1980｜PMID 6776858 ／ LOTT Group. NEJM 2016｜PMID 27783918",
      },
      {
        type: "close", kicker: "まとめ", lines: ["動く・防ぐ・補う", "薬と組み合わせて"],
        take: "COPDは<br>治療で向き合える病気",
        src: "このシリーズの出典一覧は evidence.md（PMID・DOI付き）",
      },
    ],
  },
];

// ---------------------------------------------------------------- helpers
const esc = (s) => String(s).replace(/&(?!\w+;)/g, "&amp;");
const fmt = (n, d = 0) =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

function sceneBody(s, i) {
  const src = s.src ? `<div class="src a">出典：${esc(s.src)}</div>` : "";
  switch (s.type) {
    case "hook":
      return `
        <div class="kicker a">${s.kicker}</div>
        <h1 class="hook-title a">${s.title}</h1>
        <div class="rule a"></div>
        <p class="hook-sub a">${s.sub}</p>`;
    case "stat": {
      const big =
        s.count !== undefined
          ? `<div class="big a"><span class="pre">${s.prefix ?? ""}</span><span class="num" data-count="${s.count}" data-decimals="${s.decimals ?? 0}">${fmt(0, s.decimals ?? 0)}</span><span class="unit">${s.unit}</span></div>`
          : `<div class="big big-text a">${s.big}</div>`;
      return `
        <div class="label a">${s.label}</div>
        ${big}
        <p class="sub a">${s.sub}</p>
        ${s.note ? `<p class="note a">${s.note}</p>` : ""}
        ${src}`;
    }
    case "compare": {
      const max = Math.max(...s.bars.map((b) => b.value)) * 1.08;
      const bars = s.bars
        .map(
          (b) => `
          <div class="bar-row a">
            <div class="bar-name">${b.name}</div>
            <div class="bar-track"><div class="bar-fill tone-${b.tone}" style="width:${((b.value / max) * 100).toFixed(1)}%"></div></div>
            <div class="bar-val tone-text-${b.tone}">${b.value}</div>
          </div>`,
        )
        .join("");
      return `
        <div class="label a">${s.label}</div>
        <div class="bars ${s.bars.length > 2 ? "bars-4" : ""}">${bars}</div>
        <p class="sub a">${s.caption}</p>
        ${src}`;
    }
    case "icons": {
      const person = (on) =>
        `<svg class="person ${on ? "on" : ""}" viewBox="0 0 60 120" aria-hidden="true"><circle cx="30" cy="20" r="16"/><path d="M8 116V62a22 22 0 0 1 44 0v54z"/></svg>`;
      const people = Array.from({ length: s.total }, (_, k) => person(k === s.total - 1)).join("");
      return `
        <div class="label a">${s.label}</div>
        <div class="big big-text a">${s.big}</div>
        <div class="people a">${people}</div>
        <p class="note a">${s.note}</p>
        ${src}`;
    }
    case "duo": {
      const cards = s.cards
        .map(
          (c) => `
          <div class="card a tone-card-${c.tone ?? "accent"}">
            <div class="card-name">${c.name}</div>
            <div class="card-value">${c.value}</div>
            <div class="card-sub">${c.sub}</div>
          </div>`,
        )
        .join("");
      return `
        <div class="label a">${s.label}</div>
        <div class="cards cards-${s.cards.length}">${cards}</div>
        ${s.note ? `<p class="note a">${s.note}</p>` : ""}
        ${src}`;
    }
    case "close":
      return `
        <div class="kicker a ${s.tone === "warn" ? "warn" : ""}">${s.kicker}</div>
        <h2 class="close-lines">${s.lines.map((l) => `<span class="a">${l}</span>`).join("")}</h2>
        <div class="rule a ${s.tone === "warn" ? "warn-bg" : ""}"></div>
        <p class="take a">${s.take}</p>
        ${src}`;
    default:
      throw new Error(`unknown scene type ${s.type} (scene ${i})`);
  }
}

const CSS = `
@font-face { font-family: "Noto Sans JP"; font-weight: 400; src: url("assets/fonts/NotoSansJP-Regular.ttf") format("truetype"); }
@font-face { font-family: "Noto Sans JP"; font-weight: 700; src: url("assets/fonts/NotoSansJP-Bold.ttf") format("truetype"); }
@font-face { font-family: "Noto Sans JP"; font-weight: 900; src: url("assets/fonts/NotoSansJP-Black.ttf") format("truetype"); }
:root {
  --ground: #0a1b2e;
  --ground-2: #10294a;
  --ink: #f3f6fa;
  --ink-2: #b6c3d4;
  --ink-3: #8193ab;
  --accent: #3ed6c3;
  --accent-2: #8fb8ff;
  --muted: #4b5f7a;
  --warn: #ff8a6b;
  --font: "Noto Sans JP", sans-serif;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: var(--ground); }
#root {
  position: relative; width: 100%; height: 100%; overflow: hidden;
  font-family: var(--font); color: var(--ink);
  background: radial-gradient(1200px 900px at 85% 8%, #17406b 0%, rgba(23,64,107,0) 60%),
              radial-gradient(900px 900px at 0% 100%, #0f3a4a 0%, rgba(15,58,74,0) 60%),
              var(--ground);
}
.lung {
  position: absolute; right: -160px; top: 300px; width: 760px; height: 760px; opacity: 0.07;
  fill: none; stroke: var(--accent); stroke-width: 10;
}
.header {
  position: absolute; left: 88px; right: 88px; top: 96px;
  display: flex; align-items: center; justify-content: space-between;
  font-size: 30px; font-weight: 700; letter-spacing: 0.08em; color: var(--ink-2);
}
.header .series b { color: var(--accent); font-weight: 900; }
.dots { display: flex; gap: 14px; }
.dots i { width: 18px; height: 18px; border-radius: 50%; background: var(--muted); display: block; }
.dots i.on { background: var(--accent); }
.theme {
  position: absolute; left: 88px; right: 88px; top: 160px;
  font-size: 40px; font-weight: 900; color: var(--ink); letter-spacing: 0.02em;
}
.progress { position: absolute; left: 0; bottom: 0; height: 12px; width: 100%; background: rgba(255,255,255,0.08); }
.progress-fill { height: 100%; width: 100%; background: var(--accent); transform-origin: 0 50%; transform: scaleX(0); }
.scene {
  position: absolute; left: 88px; right: 88px; top: 300px; bottom: 120px;
  display: flex; flex-direction: column; justify-content: center;
}
.kicker { font-size: 44px; font-weight: 700; color: var(--accent); letter-spacing: 0.06em; }
.kicker.warn { color: var(--warn); }
.hook-title { margin-top: 28px; font-size: 128px; line-height: 1.18; font-weight: 900; letter-spacing: -0.01em; }
.rule { margin: 56px 0 48px; width: 160px; height: 10px; border-radius: 5px; background: var(--accent); transform-origin: 0 50%; }
.rule.warn-bg { background: var(--warn); }
.hook-sub { font-size: 50px; line-height: 1.6; color: var(--ink-2); font-weight: 700; }
.label { font-size: 48px; font-weight: 700; color: var(--ink-2); line-height: 1.45; }
.big { margin: 36px 0 28px; font-weight: 900; line-height: 1.05; display: flex; align-items: baseline; flex-wrap: wrap; }
.big .num { font-size: 230px; color: var(--accent); letter-spacing: -0.03em; font-variant-numeric: tabular-nums; }
.big .pre { font-size: 160px; color: var(--accent); }
.big .unit { font-size: 92px; margin-left: 16px; }
.big-text { font-size: 132px; color: var(--accent); letter-spacing: -0.01em; }
.sub { font-size: 50px; line-height: 1.6; font-weight: 700; }
.sub b, .take b { color: var(--accent); font-weight: 900; }
.note { margin-top: 28px; font-size: 38px; line-height: 1.55; color: var(--ink-2); font-weight: 400; }
.src {
  position: absolute; left: 0; right: 0; bottom: 0;
  font-size: 27px; line-height: 1.5; color: var(--ink-3); font-weight: 400;
  border-top: 2px solid rgba(255,255,255,0.12); padding-top: 22px;
}
.bars { margin: 56px 0 48px; display: flex; flex-direction: column; gap: 40px; }
.bars-4 { gap: 26px; }
.bar-row { display: grid; grid-template-columns: 1fr; gap: 14px; position: relative; }
.bar-name { font-size: 40px; font-weight: 700; color: var(--ink-2); }
.bar-track { height: 92px; background: rgba(255,255,255,0.06); border-radius: 14px; overflow: hidden; margin-right: 210px; }
.bars-4 .bar-track { height: 64px; }
.bar-fill { height: 100%; border-radius: 14px; transform-origin: 0 50%; transform: scaleX(0); }
.bar-val { position: absolute; right: 0; bottom: 4px; font-size: 76px; font-weight: 900; font-variant-numeric: tabular-nums; }
.bars-4 .bar-val { font-size: 58px; bottom: 0; }
.tone-accent { background: var(--accent); }
.tone-accent2 { background: var(--accent-2); }
.tone-muted { background: var(--muted); }
.tone-text-accent { color: var(--accent); }
.tone-text-accent2 { color: var(--accent-2); }
.tone-text-muted { color: var(--ink-2); }
.people { margin: 40px 0 8px; display: flex; gap: 22px; }
.person { width: 92px; height: 184px; fill: var(--muted); }
.person.on { fill: var(--accent); }
.cards { margin: 52px 0 12px; display: grid; gap: 28px; }
.cards-2 { grid-template-columns: 1fr 1fr; }
.cards-3 { grid-template-columns: 1fr; gap: 22px; }
.card { border-radius: 28px; padding: 40px 36px; background: rgba(255,255,255,0.06); border: 3px solid var(--accent); }
.cards-3 .card { display: grid; grid-template-columns: 300px 1fr; grid-template-rows: auto auto; column-gap: 24px; padding: 30px 36px; align-items: baseline; }
.cards-3 .card .card-name { grid-row: 1 / span 2; font-size: 46px; color: var(--ink); align-self: center; }
.cards-3 .card .card-value { font-size: 56px; margin: 0; }
.cards-3 .card .card-sub { margin: 0; }
.tone-card-muted { border-color: var(--muted); }
.tone-card-muted .card-value { color: var(--ink-2); }
.card-name { font-size: 38px; font-weight: 700; color: var(--ink-2); line-height: 1.4; }
.card-value { margin: 18px 0 14px; font-size: 88px; font-weight: 900; color: var(--accent); line-height: 1.1; }
.card-sub { font-size: 34px; line-height: 1.5; color: var(--ink-2); }
.close-lines { margin-top: 30px; font-size: 96px; line-height: 1.3; font-weight: 900; display: flex; flex-direction: column; }
.take { font-size: 54px; line-height: 1.6; font-weight: 700; color: var(--ink); }
`;

const LUNG_SVG = `<svg class="lung" viewBox="0 0 200 200" aria-hidden="true"><path d="M100 20v60M100 80c-10 10-22 12-30 26M100 80c10 10 22 12 30 26"/><path d="M70 60c-30 10-50 50-50 95 0 20 12 30 30 25 20-5 28-20 28-40V70c0-6-3-12-8-10z"/><path d="M130 60c30 10 50 50 50 95 0 20-12 30-30 25-20-5-28-20-28-40V70c0-6 3-12 8-10z"/></svg>`;

function buildVideo(v, index) {
  const compId = `copd-${v.id}`;
  const dots = VIDEOS.map((_, k) => `<i class="${k === index ? "on" : ""}"></i>`).join("");
  const scenes = v.scenes
    .map((s, i) => {
      const [start, end] = SLOTS[i];
      return `
    <section id="s${i}" class="scene clip scene-${s.type}" data-start="${start}" data-duration="${end - start}" data-track-index="1">${sceneBody(s, i)}
    </section>`;
    })
    .join("");

  return `<!doctype html>
<html lang="ja" data-resolution="portrait">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=${W}, height=${H}" />
  <title>COPD エビデンス・ショート ${index + 1}/5 ${v.theme}</title>
  <script src="assets/gsap.min.js"></script>
  <style>${CSS}</style>
</head>
<body>
  <div id="root" data-composition-id="${compId}" data-start="0" data-duration="${DURATION}" data-width="${W}" data-height="${H}">
    ${LUNG_SVG}
    <div id="header" class="header clip" data-start="0" data-duration="${DURATION}" data-track-index="0">
      <div class="series"><b>COPD</b> エビデンス・ショート ${index + 1}/5</div>
      <div class="dots">${dots}</div>
    </div>
    <div id="theme" class="theme clip" data-start="0" data-duration="${DURATION}" data-track-index="0">${v.theme}</div>
    ${scenes}
    <div id="progress" class="progress clip" data-start="0" data-duration="${DURATION}" data-track-index="2"><div class="progress-fill"></div></div>
  </div>
  <script>
    (function () {
      var SLOTS = ${JSON.stringify(SLOTS)};
      var tl = gsap.timeline({ paused: true });
      tl.fromTo(".header, .theme", { opacity: 0, y: -24 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, 0);
      tl.fromTo(".progress-fill", { scaleX: 0 }, { scaleX: 1, duration: ${DURATION}, ease: "none" }, 0);
      tl.fromTo(".lung", { rotation: -4, scale: 0.96 }, { rotation: 4, scale: 1.04, duration: ${DURATION}, ease: "sine.inOut" }, 0);

      SLOTS.forEach(function (slot, i) {
        var start = slot[0], end = slot[1];
        var scene = document.getElementById("s" + i);
        var items = scene.querySelectorAll(".a");
        tl.fromTo(items, { opacity: 0, y: 46 }, { opacity: 1, y: 0, duration: 0.55, ease: "power3.out", stagger: 0.16 }, start + 0.1);

        scene.querySelectorAll(".rule").forEach(function (el) {
          tl.fromTo(el, { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "power2.out" }, start + 0.5);
        });
        scene.querySelectorAll(".bar-fill").forEach(function (el, k) {
          tl.fromTo(el, { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: "power2.out" }, start + 0.7 + k * 0.35);
        });
        scene.querySelectorAll(".person").forEach(function (el, k) {
          tl.fromTo(el, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.35, ease: "back.out(2)" }, start + 0.8 + k * 0.12);
        });
        scene.querySelectorAll(".person.on").forEach(function (el) {
          tl.fromTo(el, { scale: 1 }, { scale: 1.18, duration: 0.4, yoyo: true, repeat: 1, ease: "power1.inOut", transformOrigin: "50% 100%" }, start + 2.2);
        });
        scene.querySelectorAll(".num").forEach(function (el) {
          var target = parseFloat(el.getAttribute("data-count"));
          var dec = parseInt(el.getAttribute("data-decimals"), 10) || 0;
          var o = { v: 0 };
          tl.fromTo(o, { v: 0 }, {
            v: target, duration: 1.6, ease: "power2.out",
            onUpdate: function () {
              el.textContent = o.v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
            }
          }, start + 0.5);
        });
        if (i < SLOTS.length - 1) {
          tl.to(items, { opacity: 0, y: -30, duration: 0.35, ease: "power2.in" }, end - 0.4);
        }
      });

      window.__timelines = window.__timelines || {};
      window.__timelines["${compId}"] = tl;
      tl.seek(0);
    })();
  </script>
</body>
</html>
`;
}

VIDEOS.forEach((v, i) => {
  const file = join(ROOT, `${v.id}.html`);
  writeFileSync(file, buildVideo(v, i));
  console.log("wrote", file);
});
