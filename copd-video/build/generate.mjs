// COPD エビデンス・ショート（30秒×5本）の HyperFrames コンポジションを生成する。
// 台本は content.mjs、テンプレートは template.mjs。
// 使い方: node build/generate.mjs  → v1.html … v5.html（プロジェクト直下。HyperFrames は ../ の参照を許さないため）
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { VIDEOS, VOICE } from "./content.mjs";
import { buildHtml } from "./template.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// 音声（build/voice.mjs と build/bgm.py の出力）。無ければ無音のまま生成する。
const VOICE_MANIFEST = join(ROOT, "assets", "voice", "manifest.json");
const voiceClips = existsSync(VOICE_MANIFEST) ? JSON.parse(readFileSync(VOICE_MANIFEST, "utf8")).clips : {};
const HAS_BGM = existsSync(join(ROOT, "assets", "bgm", "ambient.wav"));

VIDEOS.forEach((v, i) => {
  const clips = (voiceClips[v.id] ?? []).map((c) => ({ src: `assets/voice/${c.file}`, start: c.start, duration: c.duration }));
  const dots = VIDEOS.map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("");
  const html = buildHtml(v, {
    compId: `copd-${v.id}`,
    title: `COPD エビデンス・ショート ${i + 1}/5 ${v.theme}`,
    seriesHtml: `<b>COPD</b> エビデンス・ショート ${i + 1}/5`,
    badgeHtml: `<div class="dots">${dots}</div>`,
    clips,
    bgmSrc: HAS_BGM ? "assets/bgm/ambient.wav" : null,
    credit: clips.length ? `音声：${VOICE.credit}　BGM：オリジナル` : null,
  });
  const file = join(ROOT, `${v.id}.html`);
  writeFileSync(file, html);
  console.log("wrote", file);
});
