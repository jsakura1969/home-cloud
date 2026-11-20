// 毎日の1本を作る: 入力チェック（関門）→ HTML → lint・レイアウト → 音声 → 書き出し → 検証 → metadata.json → ready.json
// 1つでもチェックに失敗したら ready.json を作らない（= GitHub Actions はアップロードしない）。
//
// 使い方: node build/daily.mjs <YYYY-MM-DD> [--check-only]
//   入力: daily/<date>/content.json と daily/<date>/sources/*.txt（RUNBOOK.md 参照）
//   出力: daily/<date>/voice/*.wav, short.mp4, preview.jpg, metadata.json, ready.json
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DURATION, SLOTS, buildHtml } from "./template.mjs";
import { VOICE, engineReady, synthesizeLines } from "./voice-lib.mjs";
import { checkLayout } from "./layout-check.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HF = join(ROOT, "node_modules", ".bin", "hyperframes");
const SERIES = "呼吸器エビデンス・ショート";
const DISCLAIMER = "本動画は一般的な医療情報の提供を目的としたもので、診断や治療の代わりにはなりません。症状や治療については医師にご相談ください。";

const [date, ...flags] = process.argv.slice(2);
const checkOnly = flags.includes("--check-only");
if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? "")) {
  console.error("usage: node build/daily.mjs <YYYY-MM-DD> [--check-only]");
  process.exit(2);
}
const DAY = join(ROOT, "daily", date);
const TOPICS_FILE = join(ROOT, "daily", "topics.json");
const errors = [];
const passed = [];
const fail = (msg) => errors.push(msg);
const ok = (msg) => passed.push(msg);
const stop = () => {
  if (!errors.length) return;
  console.error(`\n✗ ${errors.length} check(s) failed — NOT ready for upload:\n- ${errors.join("\n- ")}`);
  if (!checkOnly) rmSync(join(DAY, "ready.json"), { force: true });
  process.exit(1);
};
const step = (s) => console.log(`\n== ${s}`);

// ---------------------------------------------------------------- 1. 入力
step("load content.json");
// 本番の実行では、合格するまで ready.json を消しておく（--check-only は既存の結果に触れない）
if (!checkOnly) rmSync(join(DAY, "ready.json"), { force: true });
const content = JSON.parse(readFileSync(join(DAY, "content.json"), "utf8"));
const topics = JSON.parse(readFileSync(TOPICS_FILE, "utf8"));
const topic = topics.topics.find((t) => t.id === content.topicId);

// ---------------------------------------------------------------- 2. 関門: 構造・テーマ
step("gate: structure and topic");
if (content.date !== date) fail(`content.date (${content.date}) != ${date}`);
if (!topic) fail(`topicId "${content.topicId}" is not in topics.json`);
else if (topic.status === "done" && topic.date !== date) fail(`topic "${topic.id}" was already published on ${topic.date}`);
else ok(`topic ${content.topicId}`);
if (!content.theme || [...content.theme].length > 18) fail("theme must be 1–18 characters");
if (!Array.isArray(content.scenes) || content.scenes.length !== 5) fail("scenes must have exactly 5 items");
if (!Array.isArray(content.narration) || content.narration.length !== 5) fail("narration must have exactly 5 lines");
if (content.scenes?.[0]?.type !== "hook") fail("scene 0 must be type hook");
if (content.scenes?.[4]?.type !== "close") fail("scene 4 must be type close");
const yt = content.youtube ?? {};
if (!yt.title || [...yt.title].length > 60) fail("youtube.title must be 1–60 characters");
if (!yt.summary || [...yt.summary].length > 400) fail("youtube.summary must be 1–400 characters");
if (/[<>]/.test(JSON.stringify(yt))) fail("youtube fields must not contain < or >");
stop();

// ---------------------------------------------------------------- 3. 関門: 出典と数値
step("gate: sources and numbers");
const norm = (s) => String(s).replace(/<[^>]+>/g, " ").replace(/[\s\u3000]+/g, " ").replace(/[，,]/g, "").replace(/[–—−]/g, "-").toLowerCase();
const srcFiles = existsSync(join(DAY, "sources")) ? readdirSync(join(DAY, "sources")) : [];
const sourceText = {};
for (const f of srcFiles) sourceText[f.replace(/\.txt$/, "")] = norm(readFileSync(join(DAY, "sources", f), "utf8"));
// "PMID 12345" → PMID-12345, "NCT01234567" → NCT01234567, "FDA ..." は sources/FDA-*.txt が1つ以上必要
const refsIn = (text) => {
  const refs = [];
  for (const m of String(text).matchAll(/PMID[\s:：]*(\d{5,9})/g)) refs.push(`PMID-${m[1]}`);
  for (const m of String(text).matchAll(/\b(NCT\d{8})\b/g)) refs.push(m[1]);
  return refs;
};
const visibleText = (s) => {
  const parts = [s.kicker, s.title, s.sub, s.label, s.big, s.unit, s.prefix, s.caption, s.note, s.take, ...(s.lines ?? [])];
  if (s.count !== undefined) parts.push(String(s.count));
  for (const b of s.bars ?? []) parts.push(b.name, String(b.value));
  for (const c of s.cards ?? []) parts.push(c.name, c.value, c.sub);
  return parts.filter((x) => x !== undefined && x !== null).join(" ");
};
const numbersIn = (text) => [...norm(text).matchAll(/\d+(?:\.\d+)?/g)].map((m) => m[0]);

const claims = content.claims ?? [];
const plain = content.plainNumbers ?? [];
for (const [k, s] of (content.scenes ?? []).entries()) {
  // 根拠シーン（1〜3）には、検証できる出典（PMID / NCT / FDA 文書）が必要
  if (k >= 1 && k <= 3) {
    const refs = refsIn(s.src);
    const fdaOk = /FDA|DailyMed/.test(s.src ?? "") && srcFiles.some((f) => f.startsWith("FDA-"));
    if (!refs.length && !fdaOk) fail(`scene ${k}: src must cite a PMID, NCT number or FDA document`);
  }
  for (const r of refsIn(s.src)) if (!sourceText[r]) fail(`scene ${k}: ${r} is cited but sources/${r}.txt is missing`);
  // 画面に出る数値は、すべて引用文で裏付けるか、plainNumbers で理由を書く
  for (const n of numbersIn(visibleText(s))) {
    const byClaim = claims.some((c) => c.scene === k && norm(c.value) === n);
    const byPlain = plain.some((p) => p.scene === k && norm(p.value) === n && p.reason);
    if (!byClaim && !byPlain) fail(`scene ${k}: number "${n}" on screen has no claim (quote) or plainNumbers entry`);
  }
}
for (const [i, c] of claims.entries()) {
  const id = refsIn(c.source)[0] ?? (/^FDA-/.test(c.source) ? c.source : null);
  const text = id && sourceText[id];
  if (!text) {
    fail(`claim ${i} (${c.value}): source "${c.source}" has no sources/*.txt`);
    continue;
  }
  const q = norm(c.quote ?? "");
  if (q.length < 15) fail(`claim ${i} (${c.value}): quote is too short`);
  else if (!text.includes(q)) fail(`claim ${i} (${c.value}): quote not found verbatim in ${id}.txt`);
  else if (!q.includes(norm(c.from ?? c.value))) fail(`claim ${i}: "${c.from ?? c.value}" does not appear in its quote${c.from ? "" : " (use from + derivation for converted numbers)"}`);
  else if (c.from && !c.derivation) fail(`claim ${i}: "from" needs a "derivation" explaining the conversion`);
  const scene = content.scenes[c.scene];
  if (scene && c.scene >= 1 && id.startsWith("PMID") && !refsIn(scene.src).includes(id) && !refsIn(content.scenes[4]?.src).includes(id))
    fail(`claim ${i}: ${id} is not shown in scene ${c.scene}'s source line`);
}
// 日本での承認状況（ユーザーの方針: 未承認の治療も扱えるが、必ず画面に注釈を付ける）
const japan = content.japan ?? [];
const JP_NOTE = /日本では承認されていません|日本では未承認|のみ日本で承認/;
if (!Array.isArray(japan) || !japan.length) fail("japan: list every treatment/drug/vaccine/test shown, with its approval status in Japan");
for (const [i, j] of japan.entries()) {
  const name = j.treatment ?? `#${i}`;
  if (!j.treatment) fail(`japan[${i}]: treatment is required`);
  if (j.status === "approved") {
    if (!(j.evidence && /https?:\/\//.test(j.evidence))) fail(`japan[${i}] (${name}): approved needs evidence with a URL (PMDA 添付文書・承認情報、厚労省・製薬会社の発表など)`);
  } else if (j.status === "not-approved") {
    const scene = content.scenes?.[j.scene];
    if (!scene) fail(`japan[${i}] (${name}): not-approved needs "scene" (the scene index where it appears)`);
    else if (!j.note || !JP_NOTE.test(j.note)) fail(`japan[${i}] (${name}): note must say 「日本では承認されていません」 or 「○○のみ日本で承認」`);
    else if (!norm(visibleText(scene)).includes(norm(j.note))) fail(`japan[${i}] (${name}): the note "${j.note}" must appear on screen in scene ${j.scene}`);
  } else if (j.status !== "not-applicable") {
    fail(`japan[${i}] (${name}): status must be "approved", "not-approved" or "not-applicable"`);
  }
}
// ナレーションに算用数字を使う場合も裏付けが必要（原則は漢数字で、画面の数字を言い換えるだけ）
for (const [k, line] of (content.narration ?? []).entries()) {
  for (const n of numbersIn(line)) {
    if (!claims.some((c) => c.scene === k && norm(c.value) === n) && !plain.some((p) => p.scene === k && norm(p.value) === n))
      fail(`narration ${k}: number "${n}" is not backed by a claim`);
  }
  if ([...line].length > 40) fail(`narration ${k}: too long (${[...line].length} > 40 characters)`);
}
if (!errors.length) ok(`${claims.length} claims verified against ${srcFiles.length} source files`);
stop();

// ---------------------------------------------------------------- 4. HTML・lint・レイアウト
step("build composition");
const number = topic.number ?? Math.max(0, ...topics.topics.map((t) => t.number ?? 0)) + 1;
const build = join(ROOT, ".build", `daily-${date}`);
const voiceDir = join(DAY, "voice");
rmSync(build, { recursive: true, force: true });
mkdirSync(build, { recursive: true });
symlinkSync("../../assets", join(build, "assets"));
mkdirSync(voiceDir, { recursive: true });
symlinkSync(join("..", "..", "daily", date, "voice"), join(build, "voice"));
cpSync(join(ROOT, "hyperframes.json"), join(build, "hyperframes.json"));
const credit = `音声：${VOICE.credit}　BGM：オリジナル`;
const writeHtml = (clips) =>
  writeFileSync(
    join(build, "index.html"),
    buildHtml(content, {
      compId: `daily-${date}`,
      title: `${SERIES} #${number} ${content.theme}`,
      seriesHtml: `<b>呼吸器</b> エビデンス・ショート`,
      badgeHtml: `<div class="ep">#${number}</div>`,
      clips,
      bgmSrc: "assets/bgm/ambient.wav",
      credit,
    }),
  );
writeHtml([]);
try {
  execFileSync(HF, ["lint", "."], { cwd: build, stdio: "pipe" });
  ok("hyperframes lint");
} catch (e) {
  fail(`hyperframes lint failed:\n${e.stdout}`);
}
const layout = await checkLayout(build);
layout.forEach((m) => fail(`layout: ${m}`));
if (!layout.length) ok("layout (no overflow / unexpected wraps)");
stop();
if (checkOnly) {
  console.log(`\n✓ content checks passed (${passed.length}). --check-only: stopping before voice/render.`);
  process.exit(0);
}

// ---------------------------------------------------------------- 5. 音声
step("narration (VOICEVOX)");
execFileSync("bash", [join(ROOT, "build", "engine.sh")], { stdio: "inherit" });
if (!(await engineReady(10000))) fail("VOICEVOX engine is not reachable");
stop();
const clips = await synthesizeLines(content.narration, { outDir: voiceDir });
writeFileSync(join(voiceDir, "manifest.json"), JSON.stringify({ voice: VOICE, clips }, null, 2) + "\n");
ok("narration fits every scene");
writeHtml(clips.map((c) => ({ src: `voice/${c.file}`, start: c.start, duration: c.duration })));

// ---------------------------------------------------------------- 6. 確認用の静止画・書き出し
step("snapshot + render");
const snapDir = join(build, "snap");
execFileSync(HF, ["snapshot", ".", "--at", SLOTS.map(([a, b]) => ((a + b) / 2).toFixed(2)).join(","), "--no-end", "-o", snapDir], { cwd: build, stdio: "pipe" });
cpSync(join(snapDir, "contact-sheet.jpg"), join(DAY, "preview.jpg"));
const mp4 = join(DAY, "short.mp4");
execFileSync(HF, ["render", ".", "-q", "delivery", "-f", "30", "-o", mp4], { cwd: build, stdio: "pipe" });

// ---------------------------------------------------------------- 7. 関門: 書き出し結果
step("gate: rendered media");
const probe = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type,codec_name,width,height:format=duration", "-of", "json", mp4]).toString());
const v = probe.streams.find((s) => s.codec_type === "video");
const a = probe.streams.find((s) => s.codec_type === "audio");
const dur = +probe.format.duration;
if (Math.abs(dur - DURATION) > 0.1) fail(`duration ${dur}s (expected ${DURATION}s)`);
if (!v || v.width !== 1080 || v.height !== 1920) fail(`video must be 1080x1920 (got ${v?.width}x${v?.height})`);
if (!a) fail("no audio stream");
// ebur128 の集計（Summary）は標準エラーに出る
const summary = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", mp4, "-vn", "-af", "ebur128=peak=true", "-f", "null", "-"], { encoding: "utf8" }).stderr.split("Summary:").pop();
const lufs = +(summary.match(/I:\s*(-?[\d.]+)\s*LUFS/)?.[1] ?? NaN);
const peak = +(summary.match(/Peak:\s*(-?[\d.]+)\s*dBFS/)?.[1] ?? NaN);
if (!(lufs >= -17 && lufs <= -11)) fail(`loudness ${lufs} LUFS (expected -17 to -11)`);
if (!(peak <= -0.5)) fail(`true peak ${peak} dBFS (expected ≤ -0.5)`);
if (!errors.length) ok(`media: ${dur}s 1080x1920 ${a.codec_name} ${lufs} LUFS peak ${peak}`);
stop();

// ---------------------------------------------------------------- 8. YouTube 用メタデータ
step("metadata.json");
// 出典は PMID / NCT 番号で重複を除き（最初に出た表記を使う）、PubMed・ClinicalTrials.gov のリンクを添える
const sources = [];
const seenRefs = new Set();
for (const s of content.scenes.flatMap((sc) => String(sc.src ?? "").split(/／/)).map((x) => x.trim()).filter(Boolean)) {
  const refs = refsIn(s);
  if (refs.length && refs.every((r) => seenRefs.has(r))) continue;
  if (!refs.length && sources.some((x) => x.startsWith(s))) continue;
  refs.forEach((r) => seenRefs.add(r));
  const links = refs.map((r) => (r.startsWith("PMID-") ? `https://pubmed.ncbi.nlm.nih.gov/${r.slice(5)}/` : `https://clinicaltrials.gov/study/${r}`));
  sources.push(links.length ? `${s}\n  ${links.join(" ")}` : s);
}
const title = `${yt.title} #Shorts`;
const description = [
  yt.summary,
  "",
  "▼出典",
  ...sources.map((s) => `・${s}`),
  "",
  "▼この動画について",
  `${SERIES} #${number}。論文・臨床試験データベース（PubMed／ClinicalTrials.gov／FDA）の情報をもとに作成しています。`,
  DISCLAIMER,
  credit,
  "",
  ["#呼吸器", "#医療", "#Shorts", ...(yt.hashtags ?? [])].join(" "),
].join("\n");
if ([...title].length > 100) fail(`title too long (${[...title].length} > 100)`);
if (Buffer.byteLength(description) > 4900) fail("description exceeds YouTube's 5000-byte limit");
if (!description.includes(VOICE.credit) || !description.includes(DISCLAIMER)) fail("description must include the VOICEVOX credit and disclaimer");
stop();
const metadata = {
  title,
  description,
  tags: [...new Set(["呼吸器", "医療", "エビデンス", "Shorts", ...(yt.tags ?? [])])].slice(0, 15),
  categoryId: "27",
  defaultLanguage: "ja",
  privacyStatus: "public",
  selfDeclaredMadeForKids: false,
  containsSyntheticMedia: true,
  file: "short.mp4",
};
writeFileSync(join(DAY, "metadata.json"), JSON.stringify(metadata, null, 2) + "\n");
ok("metadata.json");

// ---------------------------------------------------------------- 9. 合格
topic.status = "done";
topic.date = date;
topic.number = number;
topic.video = `daily/${date}/short.mp4`;
writeFileSync(TOPICS_FILE, JSON.stringify(topics, null, 2) + "\n");
writeFileSync(join(DAY, "ready.json"), JSON.stringify({ date, topicId: content.topicId, number, checks: passed, createdAt: new Date().toISOString() }, null, 2) + "\n");
console.log(`\n✓ all checks passed (${passed.length}) — daily/${date}/ready.json written\n- ${passed.join("\n- ")}`);
