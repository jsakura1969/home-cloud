# COPD エビデンス・ショート（30秒 × 5本）

HyperFrames（HTML → MP4）で作った、COPD解説の縦型ショート動画です。
各シーンの数値と出典は [evidence.md](evidence.md)（PubMed / ClinicalTrials.gov / FDA から MCP 経由で取得）に対応しています。

| # | ファイル | テーマ | 主な出典 |
|---|---|---|---|
| 1 | [out/copd-v1.mp4](out/copd-v1.mp4) | COPDはどれくらい多い？ | GBD 2021（PMID 41561564）、メタ解析（PMID 38273271） |
| 2 | [out/copd-v2.mp4](out/copd-v2.mp4) | 禁煙は治療の土台 | Lung Health Study（PMID 15710956, 41164942） |
| 3 | [out/copd-v3.mp4](out/copd-v3.mp4) | 吸入薬：2剤から3剤へ | IMPACT（PMID 29668352）、ETHOS（PMID 32579807） |
| 4 | [out/copd-v4.mp4](out/copd-v4.mp4) | 新しい治療：生物学的製剤 | BOREAS/NOTUS（PMID 39900091）、MATINEE（PMID 40305712）、FDA 添付文書 |
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

## 注意
- 医療情報の一般的な解説です。個別の治療判断は主治医と相談してください。
- 動画4の承認情報は米国FDAのものです。日本での承認状況は確認していません。
- 数値は論文の抄録と FDA 添付文書から転記しました。公開前に、主な数値は原文で再確認してください。

## ライセンス
- 音声: VOICEVOX:四国めたん（[VOICEVOX 利用規約](https://voicevox.hiroshiba.jp/term/)、キャラクターの規約に従う）
- BGM: 本プロジェクトで合成したオリジナル
- フォント: Noto Sans JP（SIL Open Font License 1.1、`assets/fonts/OFL.txt`）
- GSAP: GreenSock Standard License（`node_modules/gsap` 参照）
