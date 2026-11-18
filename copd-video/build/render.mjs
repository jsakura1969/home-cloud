// 各動画を .build/<id>/index.html として用意し、snapshot または render を実行する。
// HyperFrames はプロジェクトごとに index.html を1つ想定しているため。
// 使い方: node build/render.mjs [snap|render] [v1 v2 ...]
import { cpSync, mkdirSync, rmSync, symlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const [mode = "render", ...ids] = process.argv.slice(2);
const list = ids.length ? ids : ["v1", "v2", "v3", "v4", "v5"];
const HF = join(ROOT, "node_modules", ".bin", "hyperframes");

for (const id of list) {
  const dir = join(ROOT, ".build", id);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  cpSync(join(ROOT, `${id}.html`), join(dir, "index.html"));
  cpSync(join(ROOT, "hyperframes.json"), join(dir, "hyperframes.json"));
  symlinkSync("../../assets", join(dir, "assets"));
  const args =
    mode === "snap"
      ? ["snapshot", ".", "--at", process.env.SNAP_AT ?? "0.3,2.5,7,14,21.5,28.5", "--no-end", "-o", join(ROOT, ".build", `snap-${id}`)]
      : ["render", ".", "-q", "delivery", "-f", "30", "-o", join(ROOT, "out", `copd-${id}.mp4`)];
  if (mode !== "snap") mkdirSync(join(ROOT, "out"), { recursive: true });
  console.log(`== ${mode} ${id}`);
  execFileSync(HF, args, { cwd: dir, stdio: "inherit" });
}
