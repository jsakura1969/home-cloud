# home-cloud

## 医療系リサーチ MCP の使用許可
接続済みの医療系の論文・臨床試験リサーチ MCP は、**すべて確認なしで使ってよい**（ユーザーが恒久的に許可済み）。
- PubMed（`mcp__PubMed__*`）
- Clinical Trials / ClinicalTrials.gov（`mcp__Clinical_Trials__*`）
- Arca FDA, Trials & PubMed（`mcp__Arca_FDA_Trials_PubMed__*`）

実際の許可設定は `.claude/settings.json` の `permissions.allow` にある。
医療系リサーチ MCP を新しく接続した場合は、この一覧と `.claude/settings.json` の両方に追加する。

## 動画の内容の方針
- **日本で使えない治療は動画にしない**（日本で未承認の薬・ワクチン・機器は、海外の承認情報としても扱わない）。詳細は `copd-video/daily/RUNBOOK.md`。

## プロジェクト
- `copd-video/`：呼吸器エビデンス・ショート動画（HyperFrames ＋ VOICEVOX）。概要は `copd-video/README.md`。
- 毎日の動画作成は `copd-video/daily/RUNBOOK.md` に従う。
