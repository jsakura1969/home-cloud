// HyperFrames コンポジション（縦型 1080×1920・30秒・5シーン）の HTML テンプレート。
// generate.mjs（COPD 5本）と daily.mjs（毎日の1本）が共通で使う。
// アセットのパスは、プロジェクト直下（または .build/<id>/）から見た相対パス。
export const W = 1080;
export const H = 1920;
export const DURATION = 30;
// 5シーン構成: 導入 / 根拠1 / 根拠2 / 根拠3 / まとめ
export const SLOTS = [
  [0, 4],
  [4, 11],
  [11, 18],
  [18, 24.5],
  [24.5, 30],
];
export const BGM_VOLUME = 0.15; // ナレーション（−16 LUFS）より約16dB下

// ---------------------------------------------------------------- helpers
const esc = (s) => String(s).replace(/&(?!\w+;)/g, "&amp;");
const fmt = (n, d = 0) =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

// ---------------------------------------------------------------- illustrations
// 場面に添えるオリジナルの線画（自作。製品写真やロゴは使わない）。content の scene.illustration で指定する。
export const ILLUSTRATIONS = {
  // 粉を吸うタイプの吸入器（ドライパウダー）：回転グリップ付きの筒形
  "inhaler-dpi": `
    <path class="soft" d="M78 34h44l8 26H70z"/>
    <rect x="66" y="60" width="68" height="92" rx="12"/>
    <rect class="soft" x="82" y="78" width="36" height="44" rx="6"/>
    <rect x="62" y="152" width="76" height="30" rx="9"/>
    <path d="M76 156v22M88 156v22M100 156v22M112 156v22M124 156v22"/>
    <circle class="dot" cx="100" cy="20" r="4"/><circle class="dot" cx="86" cy="14" r="3"/><circle class="dot" cx="114" cy="12" r="3"/>
    <path d="M150 46c10 8 10 22 0 30M164 38c16 14 16 32 0 46"/>`,
  // スプレータイプの吸入器（定量噴霧式）：L字の本体＋缶
  "inhaler-mdi": `
    <rect class="soft" x="108" y="18" width="36" height="92" rx="14"/>
    <path d="M98 62h56v104a12 12 0 0 1-12 12h-32a12 12 0 0 1-12-12z"/>
    <path d="M98 128H54a10 10 0 0 0-10 10v20a10 10 0 0 0 10 10h44"/>
    <circle class="dot" cx="30" cy="148" r="4"/><circle class="dot" cx="18" cy="136" r="3"/><circle class="dot" cx="16" cy="160" r="3"/><circle class="dot" cx="26" cy="124" r="2.5"/><circle class="dot" cx="24" cy="172" r="2.5"/>`,
  // 飲み薬：カプセルと錠剤
  pill: `
    <g transform="rotate(-35 90 100)"><rect x="40" y="76" width="110" height="48" rx="24"/><path class="soft" d="M95 76h31a24 24 0 0 1 0 48H95z"/></g>
    <circle cx="150" cy="150" r="26"/><path d="M134 150h32"/>`,
  // 注射（皮下注射のペン型）
  injection: `
    <g transform="rotate(-40 100 100)"><rect x="70" y="30" width="60" height="110" rx="14"/><rect class="soft" x="84" y="52" width="32" height="50" rx="6"/><path d="M100 140v22M92 162h16M100 162v24"/><path d="M86 18h28v12H86z"/></g>`,
};

function illustrationTag(name) {
  if (!name) return "";
  const body = ILLUSTRATIONS[name];
  if (!body) throw new Error(`unknown illustration "${name}" (use: ${Object.keys(ILLUSTRATIONS).join(", ")})`);
  return `<svg class="illus a" viewBox="-10 -10 220 220" aria-hidden="true"><circle class="halo" cx="100" cy="100" r="104"/>${body}</svg>`;
}

function sceneBody(s, i, credit) {
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
        ${s.note ? `<p class="note a">${s.note}</p>` : ""}
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
        ${s.src ? `<div class="src a">出典：${esc(s.src)}${credit ? `<br>${credit}` : ""}</div>` : ""}`;
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
.ep { font-size: 34px; font-weight: 900; color: var(--accent); letter-spacing: 0.04em; }
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
.illus { position: absolute; right: 0; top: 10px; width: 300px; height: 300px; fill: rgba(62,214,195,0.08); stroke: var(--accent); stroke-width: 6; stroke-linejoin: round; stroke-linecap: round; }
.illus .soft { fill: rgba(62,214,195,0.28); }
.illus .halo { fill: #0e2440; stroke: rgba(62,214,195,0.22); stroke-width: 3; }
.illus .dot { fill: var(--accent); stroke: none; }
.close-lines { margin-top: 30px; font-size: 96px; line-height: 1.3; font-weight: 900; display: flex; flex-direction: column; }
.take { font-size: 54px; line-height: 1.6; font-weight: 700; color: var(--ink); }
`;

const LUNG_SVG = `<svg class="lung" viewBox="0 0 200 200" aria-hidden="true"><path d="M100 20v60M100 80c-10 10-22 12-30 26M100 80c10 10 22 12 30 26"/><path d="M70 60c-30 10-50 50-50 95 0 20 12 30 30 25 20-5 28-20 28-40V70c0-6-3-12-8-10z"/><path d="M130 60c30 10 50 50 50 95 0 20-12 30-30 25-20-5-28-20-28-40V70c0-6 3-12 8-10z"/></svg>`;

function audioTags(clips, bgmSrc) {
  const vo = (clips ?? [])
    .map(
      (c, k) =>
        `\n    <audio id="vo-s${k}" src="${c.src}" data-start="${c.start}" data-duration="${c.duration}" data-volume="1" data-track-index="3"></audio>`,
    )
    .join("");
  const bgm = bgmSrc
    ? `\n    <audio id="bgm" src="${bgmSrc}" data-start="0" data-duration="${DURATION}" data-volume="${BGM_VOLUME}" data-fade-in="1" data-fade-out="2" data-track-index="4"></audio>`
    : "";
  return vo + bgm;
}

/**
 * 1本分の HyperFrames コンポジション（HTML）を返す。
 * @param v      { theme, scenes[5] }（content.mjs の VIDEOS 要素、または daily の content.json）
 * @param opts   { compId, title, seriesHtml, badgeHtml, clips:[{src,start,duration}], bgmSrc, credit }
 */
export function buildHtml(v, opts) {
  const { compId, title, seriesHtml, badgeHtml, clips, bgmSrc, credit } = opts;
  const scenes = v.scenes
    .map((s, i) => {
      const [start, end] = SLOTS[i];
      return `
    <section id="s${i}" class="scene clip scene-${s.type}" data-start="${start}" data-duration="${end - start}" data-track-index="1">${illustrationTag(s.illustration)}${sceneBody(s, i, credit)}
    </section>`;
    })
    .join("");

  return `<!doctype html>
<html lang="ja" data-resolution="portrait">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=${W}, height=${H}" />
  <title>${title}</title>
  <script src="assets/gsap.min.js"></script>
  <style>${CSS}</style>
</head>
<body>
  <div id="root" data-composition-id="${compId}" data-start="0" data-duration="${DURATION}" data-width="${W}" data-height="${H}">
    ${LUNG_SVG}
    <div id="header" class="header clip" data-start="0" data-duration="${DURATION}" data-track-index="0">
      <div class="series">${seriesHtml}</div>
      ${badgeHtml}
    </div>
    <div id="theme" class="theme clip" data-start="0" data-duration="${DURATION}" data-track-index="0">${v.theme}</div>
    ${scenes}
    <div id="progress" class="progress clip" data-start="0" data-duration="${DURATION}" data-track-index="2"><div class="progress-fill"></div></div>${audioTags(clips, bgmSrc)}
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

        scene.querySelectorAll(".illus").forEach(function (el) {
          tl.fromTo(el, { rotation: -6, scale: 0.85 }, { rotation: 4, scale: 1, duration: (end - start) - 0.5, ease: "sine.inOut", transformOrigin: "50% 60%" }, start + 0.1);
        });
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
