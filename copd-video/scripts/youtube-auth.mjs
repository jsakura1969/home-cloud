// YouTube へのアップロード権限（リフレッシュトークン）を一度だけ取得する。あなたのパソコンで実行する。
// 前提: Google Cloud で「デスクトップ アプリ」の OAuth クライアントを作成済み（README 参照）。
//
// 使い方:
//   YT_CLIENT_ID=xxxx YT_CLIENT_SECRET=yyyy node scripts/youtube-auth.mjs
// ブラウザで表示された URL を開き、動画を上げる YouTube チャンネルの Google アカウントで許可する。
// 表示された refresh_token を、GitHub の Secrets に YT_REFRESH_TOKEN として登録する（チャットなどには貼らない）。
import { createServer } from "node:http";

const { YT_CLIENT_ID, YT_CLIENT_SECRET } = process.env;
if (!YT_CLIENT_ID || !YT_CLIENT_SECRET) {
  console.error("Set YT_CLIENT_ID and YT_CLIENT_SECRET (from your Google Cloud OAuth client) first.");
  process.exit(1);
}
const PORT = Number(process.env.PORT ?? 53682);
const REDIRECT = `http://127.0.0.1:${PORT}/callback`;
const SCOPE = "https://www.googleapis.com/auth/youtube.upload";

const authUrl =
  "https://accounts.google.com/o/oauth2/v2/auth?" +
  new URLSearchParams({ client_id: YT_CLIENT_ID, redirect_uri: REDIRECT, response_type: "code", scope: SCOPE, access_type: "offline", prompt: "consent" });

const server = createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT);
  if (url.pathname !== "/callback") return res.writeHead(404).end();
  const code = url.searchParams.get("code");
  if (!code) {
    res.writeHead(400).end(`Authorization failed: ${url.searchParams.get("error")}`);
    return;
  }
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: YT_CLIENT_ID, client_secret: YT_CLIENT_SECRET, redirect_uri: REDIRECT, grant_type: "authorization_code" }),
  });
  const json = await tokenRes.json();
  if (!json.refresh_token) {
    res.writeHead(500).end("No refresh_token returned. See the terminal.");
    console.error("No refresh_token in response:", json.error ?? json);
  } else {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" }).end("完了しました。ターミナルに戻ってください。");
    console.log("\nrefresh_token（GitHub Secrets の YT_REFRESH_TOKEN に登録してください）:\n");
    console.log(json.refresh_token + "\n");
  }
  server.close();
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("次の URL をブラウザで開き、YouTube チャンネルの Google アカウントで許可してください:\n");
  console.log(authUrl + "\n");
});
