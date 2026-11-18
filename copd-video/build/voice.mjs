// ナレーション音声を VOICEVOX エンジンで生成する。
// 前提: エンジンが http://127.0.0.1:50021 で動いていること（README 参照）。
// 必要: ffmpeg（音量の正規化）
// 使い方: node build/voice.mjs  → assets/voice/<id>-s<k>.wav と manifest.json
// クレジット: VOICEVOX:四国めたん（商用・非商用可、クレジット表記が条件）
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { NARRATION, SLOTS, VOICE } from "./content.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ENGINE = process.env.VOICEVOX_URL ?? "http://127.0.0.1:50021";
const OUT = join(ROOT, "assets", "voice");
const LEAD = 0.3; // シーン開始から話し始めるまで
const TAIL = 0.3; // 次のシーンまでの余白
const BASE_SPEED = 1.05;
const MAX_SPEED = 1.25;

async function query(text) {
  const res = await fetch(`${ENGINE}/audio_query?speaker=${VOICE.styleId}&text=${encodeURIComponent(text)}`, { method: "POST" });
  if (!res.ok) throw new Error(`audio_query ${res.status}`);
  return res.json();
}

async function synth(q) {
  const res = await fetch(`${ENGINE}/synthesis?speaker=${VOICE.styleId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(q),
  });
  if (!res.ok) throw new Error(`synthesis ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// WAV のヘッダから長さ（秒）を読む
function wavSeconds(buf) {
  const byteRate = buf.readUInt32LE(28);
  let off = 12;
  while (off < buf.length) {
    const id = buf.toString("ascii", off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    if (id === "data") return size / byteRate;
    off += 8 + size;
  }
  throw new Error("no data chunk");
}

mkdirSync(OUT, { recursive: true });
const manifest = { voice: VOICE, lead: LEAD, clips: {} };

for (const [id, lines] of Object.entries(NARRATION)) {
  manifest.clips[id] = [];
  for (const [k, text] of lines.entries()) {
    const slot = SLOTS[k][1] - SLOTS[k][0];
    const limit = slot - LEAD - TAIL;
    const q = await query(text);
    q.prePhonemeLength = 0.05;
    q.postPhonemeLength = 0.1;
    let speed = BASE_SPEED;
    let wav, sec;
    for (;;) {
      q.speedScale = speed;
      wav = await synth(q);
      sec = wavSeconds(wav);
      if (sec <= limit || speed >= MAX_SPEED) break;
      speed = Math.min(MAX_SPEED, +(speed * (sec / limit) + 0.01).toFixed(2));
    }
    if (sec > limit) throw new Error(`${id}-s${k}: ${sec.toFixed(2)}s > ${limit.toFixed(2)}s even at ${speed}x — shorten the line`);
    const file = `${id}-s${k}.wav`;
    // 音量を −16 LUFS（ピーク −1.5 dBTP）に揃え、48kHz で保存
    const raw = join(OUT, `.raw-${file}`);
    writeFileSync(raw, wav);
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", raw, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000", "-ac", "1", join(OUT, file)]);
    rmSync(raw);
    manifest.clips[id].push({ file, text, start: +(SLOTS[k][0] + LEAD).toFixed(2), duration: +sec.toFixed(3), speed, limit: +limit.toFixed(2) });
    console.log(`${file}  ${sec.toFixed(2)}s / ${limit.toFixed(2)}s  x${speed}  ${text}`);
  }
}
writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log("wrote", join(OUT, "manifest.json"));
