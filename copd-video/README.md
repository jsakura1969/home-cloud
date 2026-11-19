# COPD エビデンス・ショート（30秒 × 5本）

HyperFrames（HTML → MP4）で作った、COPD解説の縦型ショート動画です。
各シーンの数値と出典は [evidence.md](evidence.md)（PubMed / ClinicalTrials.gov から MCP 経由で取得。国内承認情報は製薬会社の発表資料）に対応しています。

| # | ファイル | テーマ | 主な出典 |
|---|---|---|---|
| 1 | [out/copd-v1.mp4](out/copd-v1.mp4) | COPDはどれくらい多い？ | GBD 2021（PMID 41561564）、メタ解析（PMID 38273271） |
| 2 | [out/copd-v2.mp4](out/copd-v2.mp4) | 禁煙は治療の土台 | Lung Health Study（PMID 15710956, 41164942） |
| 3 | [out/copd-v3.mp4](out/copd-v3.mp4) | 吸入薬：2剤から3剤へ | IMPACT（PMID 29668352）、ETHOS（PMID 32579807） |
| 4 | [out/copd-v4.mp4](out/copd-v4.mp4) | 新しい治療：生物学的製剤 | BOREAS/NOTUS（PMID 39900091）、日本での承認（サノフィ発表 2025年3月） |
| 5 | [out/copd-v5.mp4](out/copd-v5.mp4) | 薬以外の治療 | Cochrane（PMID 25705944, 29943802）、NOTT、LOTT |

仕様: 1080×1920（9:16）、30fps、30.0秒、H.264 ＋ AAC（48kHz ステレオ）、全体の音量は約 −13.5 LUFS。

## 音声
- **ナレーション**: VOICEVOX（四国めたん・ノーマル）。シーンごとに1文、出典は読み上げず画面に表示
- **BGM**: `build/bgm.py` で合成したオリジナルの環境音（外部素材なし）。ナレーションより約16dB小さく、フェードイン/アウトあり
- **クレジット**: 音声は **VOICEVOX:四国めたん**（商用・非商用可。クレジット表記が条件。詳細は [ずんずんPJ 音源利用規約](https://zunko.jp/con_ongen_kiyaku.html)）。
  各動画のまとめシーンに表示済み。SNS に投稿するときは、概要欄にも「VOICEVOX:四国めたん」と書いてください

## 構成
各動画は5シーン（導入 0–4秒 / 根拠1 4–11秒 / 根拠2 11–18秒 / 根拠3 18–24.5秒 / まとめ 24.5–30秒）。
根拠のシーンには、画面下に出典（著者・雑誌・年・PMID）を表示しています。

## 作り直し方
```bash
npm install
# ナレーションを作り直すとき（VOICEVOX エンジンを Docker で起動）
docker run -d --name voicevox -p 127.0.0.1:50021:50021 voicevox/voicevox_engine:cpu-0.26.0
node build/voice.mjs   # assets/voice/*.wav と manifest.json（シーンの枠に収まるよう話速を自動調整）
python3 build/bgm.py   # assets/bgm/ambient.wav（numpy が必要）
npm run build          # build/generate.mjs の台本から v1.html〜v5.html を生成
npm run check          # HyperFrames lint
node build/render.mjs snap v1   # 確認用の静止画（.build/snap-v1/）
npm run render         # out/copd-v1.mp4〜v5.mp4 を書き出し
```
- 台本（テロップ・数値・出典）は `build/content.mjs` の `VIDEOS`、ナレーション文は同じファイルの `NARRATION` にまとめてあります。テロップを直したら `npm run build`、ナレーションを直したら `node build/voice.mjs` → `npm run build` の順に実行します。
- HyperFrames はプロジェクトごとに `index.html` を1つ想定しているため、`build/render.mjs` が動画ごとに `.build/<id>/` を作って書き出します。
- HyperFrames 0.9.13 と GSAP 3.15.0 は、バージョンを固定しています。GSAP は `assets/gsap.min.js` として同梱しています。

## 毎日の自動作成と YouTube 公開
1. **毎日 12時ごろ（日本時間）**：Claude のスケジュールタスクが新しいセッションを起動する。セッションは [daily/RUNBOOK.md](daily/RUNBOOK.md) に従って作業する。
   - [daily/topics.json](daily/topics.json) から次のテーマを選ぶ
   - PubMed・Clinical Trials・Arca で根拠を集める
   - `node build/daily.mjs <日付>` で動画を作る
2. **自動チェック（関門）**：1つでも失敗した日は `ready.json` ができず、公開されない。チェック内容：
   - 画面の数字がすべて保存した抄録の引用で裏付けられていること
   - 出典があること
   - 文字のはみ出しがないこと
   - 音声の長さ・音量
   - 説明欄の免責文とクレジット
3. **GitHub Actions**（[.github/workflows/youtube-upload.yml](../.github/workflows/youtube-upload.yml)）：`ready.json` のプッシュで YouTube に**公開**アップロードする。動画URLを `daily/<日付>/youtube.json` に記録する。

### 初期設定（最初に一度だけ）
1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作り、**YouTube Data API v3** を有効にする。
2. 「OAuth 同意画面」を設定する。
   - 種類は「外部」
   - スコープに `.../auth/youtube.upload` を追加する
   - **公開ステータスを「本番環境」にする**（「テスト」のままだと、トークンが7日で切れる）
   - 未審査のため、許可のときに警告が出るが、自分のアカウントなら続行してよい
3. 「認証情報」で **OAuth クライアント ID（種類：デスクトップ アプリ）** を作り、クライアントIDとシークレットを控える。
4. 自分のパソコンで次を実行し、表示された URL を、動画を上げるチャンネルの Google アカウントで許可する：
   ```bash
   YT_CLIENT_ID=… YT_CLIENT_SECRET=… node copd-video/scripts/youtube-auth.mjs
   ```
5. GitHub のリポジトリ設定 → Secrets and variables → Actions に、次の3つを登録する：
   - `YT_CLIENT_ID`
   - `YT_CLIENT_SECRET`
   - `YT_REFRESH_TOKEN`（手順4で表示された値）
6. Actions の「YouTube upload」を手動実行（Run workflow）する。最初は `dry_run` をオンにして送信内容を確かめ、次にオフで実行して1本目を公開する。

### 注意（自動公開について）
- **非公開に固定される場合がある**：Google の監査を受けていない API プロジェクトからの動画は、「非公開」に固定されることがある。2026年時点では扱いがはっきりしない。
  - 固定された場合は、Actions のログに警告が出る。`youtube.json` の `privacyStatus` にも記録される
  - そのときは、YouTube Studio で手動で公開に切り替えるか、Google に [監査を申請](https://support.google.com/youtube/contact/yt_api_form) する
- **医療情報**：自動チェックで数値と出典の整合は確かめるが、解釈の誤りまでは防げない。公開された動画はときどき見直すこと。
- **止め方**：Claude のスケジュールタスクを停止する。アップロードだけ止めたい場合は、GitHub の Actions で「YouTube upload」ワークフローを無効にする。

## 注意
- 医療情報の一般的な解説です。個別の治療判断は主治医と相談してください。
- 日本で未承認の薬は扱わない方針です。動画4は日本で承認済みのデュピルマブのみを扱います。
- 数値は論文の抄録と製薬会社の発表資料から転記しました。公開前に、主な数値は原文で再確認してください。

## ライセンス
- 音声: VOICEVOX:四国めたん（[VOICEVOX 利用規約](https://voicevox.hiroshiba.jp/term/)、キャラクターの規約に従う）
- BGM: 本プロジェクトで合成したオリジナル
- フォント: Noto Sans JP（SIL Open Font License 1.1、`assets/fonts/OFL.txt`）
- GSAP: GreenSock Standard License（`node_modules/gsap` 参照）
