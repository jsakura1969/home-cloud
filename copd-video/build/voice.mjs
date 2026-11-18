// COPD 5本のナレーション音声を VOICEVOX エンジンで生成する（処理本体は voice-lib.mjs）。
// 使い方: node build/voice.mjs  → assets/voice/<id>-s<k>.wav と manifest.json
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { NARRATION } from "./content.mjs";
import { LEAD, VOICE, synthesizeLines } from "./voice-lib.mjs";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "assets", "voice");
const manifest = { voice: VOICE, lead: LEAD, clips: {} };
for (const [id, lines] of Object.entries(NARRATION)) {
  manifest.clips[id] = (await synthesizeLines(lines, { outDir: OUT, prefix: `${id}-` })).map(({ kana, ...c }) => c);
}
writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log("wrote", join(OUT, "manifest.json"));
