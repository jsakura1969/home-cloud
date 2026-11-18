// テロップのはみ出し・不自然な折り返しを、実際にブラウザで描画して調べる。
// HyperFrames の inspect は折り返しを検出しないため、独自に行数と位置を測る。
// 使い方: node build/layout-check.mjs <index.html があるフォルダ>   → 問題があれば終了コード1
import { pathToFileURL } from "node:url";
import { join } from "node:path";
import { createRequire } from "node:module";
import { SLOTS } from "./template.mjs";

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  ({ chromium } = await import("playwright"));
}

// 要素ごとの最大行数（これを超えたら「折り返しすぎ」）
const MAX_LINES = {
  ".kicker": 1,
  ".hook-title": "br", // <br> の数＋1
  ".hook-sub": "br",
  ".label": 2,
  ".big": 1,
  ".big-text": 1,
  ".sub": 3,
  ".note": 2,
  ".bar-name": 1,
  ".bar-val": 1,
  ".card-name": 2,
  ".card-value": 1,
  ".card-sub": 3,
  ".close-lines > span": 1,
  ".take": "br",
  ".src": 3,
};

export async function checkLayout(dir) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto(pathToFileURL(join(dir, "index.html")).href);
  await page.evaluate(() => document.fonts.ready);
  const issues = [];
  for (const [i, [start, end]] of SLOTS.entries()) {
    const t = (start + end) / 2;
    const found = await page.evaluate(
      ({ i, t, MAX_LINES }) => {
        const tl = Object.values(window.__timelines)[0];
        tl.seek(t, false);
        const scene = document.getElementById("s" + i);
        const sb = scene.getBoundingClientRect();
        const src = scene.querySelector(".src");
        const floor = src ? src.getBoundingClientRect().top - 8 : sb.bottom;
        const out = [];
        const lineCount = (el) => {
          // 大きさの違う部品を横に並べた flex 要素（数字＋単位）は、子要素の行で数える
          if (getComputedStyle(el).display === "flex" && el.children.length) {
            const boxes = [...el.children].map((c) => c.getBoundingClientRect()).filter((b) => b.width > 0);
            const rows = [];
            for (const b of boxes.sort((a, c) => a.top - c.top)) {
              const row = rows.find((r) => b.top < r.bottom - 0.4 * (b.bottom - b.top));
              if (row) row.bottom = Math.max(row.bottom, b.bottom);
              else rows.push({ bottom: b.bottom });
            }
            return rows.length;
          }
          const r = document.createRange();
          r.selectNodeContents(el);
          const tops = new Set();
          for (const rect of r.getClientRects()) if (rect.width > 1) tops.add(Math.round(rect.top / 8));
          return tops.size;
        };
        for (const [sel, max] of Object.entries(MAX_LINES)) {
          for (const el of scene.querySelectorAll(sel)) {
            const limit = max === "br" ? el.querySelectorAll("br").length + 1 : max;
            const n = lineCount(el);
            if (n > limit) out.push(`scene ${i} ${sel}: ${n} lines (max ${limit}) "${el.textContent.trim().slice(0, 40)}"`);
            const b = el.getBoundingClientRect();
            if (b.right > sb.right + 2 || b.left < sb.left - 2) out.push(`scene ${i} ${sel}: overflows horizontally "${el.textContent.trim().slice(0, 40)}"`);
          }
        }
        // 本文（出典以外）が出典欄や画面外にはみ出していないか
        for (const el of scene.querySelectorAll(".a")) {
          if (el.classList.contains("src")) continue;
          const b = el.getBoundingClientRect();
          if (b.bottom > floor + 2) out.push(`scene ${i}: "${el.textContent.trim().slice(0, 30)}" overlaps the source line or bottom edge`);
          if (b.top < sb.top - 2) out.push(`scene ${i}: "${el.textContent.trim().slice(0, 30)}" overflows the top edge`);
        }
        return out;
      },
      { i, t, MAX_LINES },
    );
    issues.push(...found);
  }
  await browser.close();
  return issues;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const issues = await checkLayout(process.argv[2] ?? ".");
  if (issues.length) {
    console.error(issues.join("\n"));
    process.exit(1);
  }
  console.log("layout ok");
}
