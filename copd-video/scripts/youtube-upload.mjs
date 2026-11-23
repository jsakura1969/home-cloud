// チェックに合格した毎日の動画（daily/<date>/ready.json があり youtube.json が無いもの）を YouTube にアップロードする。
// GitHub Actions（.github/workflows/youtube-upload.yml）から実行する。外部パッケージ不要（Node 22 の fetch のみ）。
//
// 必要な環境変数（GitHub Secrets）: YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN
// 使い方: node scripts/youtube-upload.mjs [--dry-run] [--date YYYY-MM-DD]
//   --dry-run  送信内容を表示するだけで、アップロードしない（認証情報も不要）
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DAILY = join(ROOT, "daily");
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const onlyDate = args.includes("--date") ? args[args.indexOf("--date") + 1] : null;

const pending = readdirSync(DAILY)
  .filter((d) => /^\d{4}-\d{2}-\d{2}[a-z]?$/.test(d))
  .filter((d) => !onlyDate || d === onlyDate)
  .filter((d) => existsSync(join(DAILY, d, "ready.json")) && !existsSync(join(DAILY, d, "youtube.json")))
  .sort();

if (!pending.length) {
  console.log("nothing to upload");
  process.exit(0);
}

async function accessToken() {
  const { YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN } = process.env;
  if (!YT_CLIENT_ID || !YT_CLIENT_SECRET || !YT_REFRESH_TOKEN) {
    throw new Error("YT_CLIENT_ID / YT_CLIENT_SECRET / YT_REFRESH_TOKEN are not set (add them as GitHub repository secrets)");
  }
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: YT_CLIENT_ID, client_secret: YT_CLIENT_SECRET, refresh_token: YT_REFRESH_TOKEN, grant_type: "refresh_token" }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`token refresh failed: ${res.status} ${json.error ?? ""} ${json.error_description ?? ""}`);
  return json.access_token;
}

function resource(meta) {
  return {
    snippet: {
      title: meta.title,
      description: meta.description,
      tags: meta.tags,
      categoryId: meta.categoryId ?? "27",
      defaultLanguage: meta.defaultLanguage ?? "ja",
      defaultAudioLanguage: meta.defaultLanguage ?? "ja",
    },
    status: {
      privacyStatus: meta.privacyStatus ?? "public",
      selfDeclaredMadeForKids: meta.selfDeclaredMadeForKids ?? false,
      containsSyntheticMedia: meta.containsSyntheticMedia ?? true,
      embeddable: true,
    },
  };
}

// 再開可能アップロード（resumable upload）: 1) セッション作成 → 2) 本体を PUT
async function upload(token, body, file) {
  const size = statSync(file).size;
  const init = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Type": "video/mp4",
      "X-Upload-Content-Length": String(size),
    },
    body: JSON.stringify(body),
  });
  if (!init.ok) throw new Error(`upload session failed: ${init.status} ${await init.text()}`);
  const location = init.headers.get("location");
  const put = await fetch(location, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "video/mp4", "Content-Length": String(size) },
    body: readFileSync(file),
  });
  const json = await put.json();
  if (!put.ok) throw new Error(`upload failed: ${put.status} ${JSON.stringify(json.error ?? json)}`);
  return json;
}

let failed = 0;
const token = dryRun ? null : await accessToken();
for (const date of pending) {
  const dir = join(DAILY, date);
  const meta = JSON.parse(readFileSync(join(dir, "metadata.json"), "utf8"));
  const file = join(dir, meta.file ?? "short.mp4");
  const body = resource(meta);
  if (dryRun) {
    console.log(`\n=== [dry-run] ${date}  ${file} (${(statSync(file).size / 1e6).toFixed(1)} MB)\n${JSON.stringify(body, null, 2)}`);
    continue;
  }
  try {
    const video = await upload(token, body, file);
    const result = {
      date,
      videoId: video.id,
      url: `https://www.youtube.com/shorts/${video.id}`,
      privacyStatus: video.status?.privacyStatus,
      requestedPrivacyStatus: body.status.privacyStatus,
      uploadedAt: new Date().toISOString(),
    };
    writeFileSync(join(dir, "youtube.json"), JSON.stringify(result, null, 2) + "\n");
    console.log(`uploaded ${date}: ${result.url} (privacy: ${result.privacyStatus})`);
    if (result.privacyStatus !== body.status.privacyStatus) {
      console.log(`::warning::${date} was requested as ${body.status.privacyStatus} but YouTube set it to ${result.privacyStatus}. Unaudited API projects may be locked to private; see README.`);
    }
  } catch (e) {
    failed++;
    console.log(`::error::${date}: ${e.message}`);
  }
}
process.exit(failed ? 1 : 0);
