# 毎日の1本を作る手順（RUNBOOK）

毎日のスケジュールタスクで起動したセッションは、この手順に従う。
目的は、呼吸器の話題を1つ選び、論文・臨床試験・FDA の根拠にもとづいて30秒の縦型動画を作ること。
チェックに合格したらコミットしてプッシュする。**現在は投稿しない方針**で、YouTube 等へのアップロードは自動では行われない（GitHub Actions は手動実行のときだけ動く）。
確認する人はいないので、**根拠のない数字・言い過ぎは絶対に入れない**。

## 0. 準備（作業ディレクトリ: `copd-video/`）
```bash
cd copd-video
git pull --ff-only
npm ci
```
- 日付は日本時間で決める（`TZ=Asia/Tokyo date +%F`）。以下 `<DATE>` と書く。
- `daily/<DATE>/ready.json` が既にあれば、今日の分は作成済み。何もせずに終了する。

## 1. テーマを選ぶ
- `daily/topics.json` の `status: "todo"` のうち、**先頭の1件**を選ぶ。
- `hint` は出発点にすぎない。必ず MCP で確かめる。
- 十分な根拠が見つからない場合は、そのテーマの `status` を `"skipped"` にし、`reason` を書いて次のテーマに進む。

## 2. 根拠を集める（PubMed / Clinical Trials / Arca の MCP）
**使用許可**：接続済みの医療系リサーチ MCP は、すべて確認なしで使ってよい（ユーザーが恒久的に許可済み）。
- PubMed（`mcp__PubMed__*`）
- Clinical Trials（`mcp__Clinical_Trials__*`）
- Arca FDA, Trials & PubMed（`mcp__Arca_FDA_Trials_PubMed__*`）

同じ許可はリポジトリ直下の `CLAUDE.md` にも書いてある。許可の設定はリポジトリの `.claude/settings.json`（`permissions.allow`）に書いてある。ここに挙げていない医療系リサーチ MCP を新しく接続した場合は、この一覧と `.claude/settings.json` の両方に追加する。

- 優先順位は、大規模RCT・メタ解析・Cochrane・GBD などの疾病負荷推計・FDA 添付文書。症例報告や小規模研究は使わない。
- 使う論文・文書ごとに、**MCP が返した抄録（または該当箇所）をそのまま** `daily/<DATE>/sources/` に保存する。要約や書き換えはしない。
  - PubMed の論文：`sources/PMID-<番号>.txt`。タイトル・雑誌・年・DOI・抄録全文を入れる
  - ClinicalTrials.gov：`sources/NCT<8桁>.txt`
  - FDA 文書：`sources/FDA-<短い名前>.txt`。URL と該当箇所の抜粋を入れる
- 結果が否定的な試験（効果なし）も正直に扱う。「〜で改善」と言えるのは、主要評価項目で有意だった場合だけ。二次解析・サブグループ解析なら、そう明記する。
- **日本で未承認の治療も扱ってよい。ただし必ず画面に注釈を付ける**（ユーザーの方針）。
  - 動画に出す治療（薬・ワクチン・機器）は、すべて `content.json` の `japan` に書き、日本での承認状況を確かめる
    - 承認済み：`"status": "approved"`。根拠（PMDA の添付文書・承認情報、厚労省・製薬会社の発表など）を URL 付きで書く
    - 未承認：`"status": "not-approved"`。`scene`（その治療が出るシーン番号）と `note`（画面に出す注釈）を書く
    - 薬・機器ではないもの（禁煙支援・リハビリなど）：`"status": "not-applicable"`
  - 未承認の治療が出るシーンには、注釈を画面に表示する（`note` や `card.sub` など）。文言は次のどちらか
    - 「日本では承認されていません」（または「日本では未承認」）
    - 複数の薬を並べ、一部だけ日本で承認されている場合は「○○のみ日本で承認」
  - 注釈は `japan[].note` と同じ文を、そのシーンの画面テキストに入れる（daily.mjs が一致を確認する）
  - ナレーションで未承認薬に触れる場合も、「日本では未承認ですが」のように一言添える
  - 承認状況は、Arca の `search_medical`（sourceTypes: `global_regulatory`。PMDA・厚労省の文書を含む）で探す。見つからなければ Web で探す
  - PMDA（www.pmda.go.jp）と厚労省（www.mhlw.go.jp）のサイトは、クラウド環境「home-cloud」のネットワークで許可済み。添付文書・審査報告書・承認通知・報道発表の本文を直接開いて確かめる。古いページは移転・削除されていることがあるので、URLが実際に開けることも確認し、本文の該当箇所を `sources/` に保存する
  - 承認状況を確認できない場合は、承認済みとは書かない。未承認として注釈を付けるか、その治療を外す

## 3. `daily/<DATE>/content.json` を書く
既存の COPD 動画（`build/content.mjs` の `VIDEOS`）と同じ5シーン構成にする。
1. `hook`（導入）
2. 根拠1
3. 根拠2
4. 根拠3
5. `close`（まとめ）

```jsonc
{
  "date": "<DATE>",
  "topicId": "asthma-burden",          // topics.json の id
  "theme": "喘息はどれくらい多い？",     // 画面上部の見出し（18字以内）
  "scenes": [
    { "type": "hook", "kicker": "…", "title": "1行目<br>2行目", "sub": "…<br>…" },
    { "type": "stat", "label": "…", "count": 262, "unit": "百万人", "sub": "…", "note": "…", "src": "Author X, et al. Journal 2024｜PMID 12345678" },
    { "type": "compare", "label": "…（回/年）", "bars": [{ "name": "プラセボ", "value": 1.2, "tone": "muted" }, { "name": "薬A", "value": 0.8, "tone": "accent" }], "caption": "…<b>33%減</b>…", "src": "…｜PMID …" },
    { "type": "duo", "label": "…", "cards": [{ "name": "…", "value": "…", "sub": "…" }, { "name": "…", "value": "…", "sub": "…", "tone": "muted" }], "note": "…", "src": "…" },
    { "type": "close", "kicker": "まとめ", "lines": ["1行目", "2行目"], "take": "…<br>…", "src": "…" }
  ],
  "narration": ["導入の1文", "根拠1の1文", "根拠2の1文", "根拠3の1文", "まとめの1文"],
  "claims": [
    { "scene": 1, "value": "262", "source": "PMID 12345678", "quote": "抄録から一字一句そのまま写した文" },
    { "scene": 2, "value": "33", "from": "0.67", "derivation": "rate ratio 0.67 → 33%減", "source": "PMID …", "quote": "… rate ratio, 0.67 …" }
  ],
  "japan": [
    { "treatment": "吸入ステロイド（ICS）", "status": "approved", "evidence": "PMDA 添付文書 https://www.pmda.go.jp/…" },
    { "treatment": "薬B", "status": "not-approved", "scene": 2, "note": "※薬Bは日本では承認されていません", "evidence": "国内承認なし（確認先 URL）" },
    { "treatment": "禁煙支援", "status": "not-applicable", "evidence": "薬・機器ではない" }
  ],
  "plainNumbers": [
    { "scene": 0, "value": "3", "reason": "「3剤」は薬の数（数値データではない）" }
  ],
  "youtube": {
    "title": "喘息は世界で2億6千万人？【30秒でわかるエビデンス】",   // 60字以内（#Shorts は自動で付く）
    "summary": "説明欄の冒頭2〜3行（400字以内）",
    "tags": ["喘息", "吸入ステロイド"],
    "hashtags": ["#喘息"]
  }
}
```

### シーンの種類（見た目は `build/template.mjs`）
- `stat`：
  - `count` ＋ `unit`（数字がカウントアップする）、または `big`（短い文字。1行に収まる長さ）
  - `count` は最大5桁程度。大きい数は「億」「万」を `unit` に入れる
- `compare`：棒グラフ。棒は2本または4本。`tone` は `muted`（対照）/ `accent` / `accent2`
- `duo`：カードが2枚（横に並ぶ）または3枚（縦に並ぶ）
- `icons`：人型アイコン。`total` 人のうち1人を強調する。例：「約8人に1人」

### イラスト（任意）
- 薬が出てくる場面には、`"illustration"` でオリジナルの線画を添えられる。画面右上に表示される
  - `inhaler-dpi`：粉を吸うタイプの吸入器（例：ブデソニドのタービュヘイラー）
  - `inhaler-flat`：平たい本体＋スライド式カバーの粉の吸入器（例：テリルジー、レルベアのエリプタ）
  - `inhaler-capsule`：カプセルを入れて吸う吸入器（例：エナジアのブリーズヘラー）
  - 製品ごとに吸入器の形が違うので、取り上げる薬に合う形を選ぶ（3剤配合薬に `inhaler-dpi` は合わない）
  - `inhaler-mdi`：スプレータイプの吸入器（例：サルブタモールなどの発作止め）
  - `pill`：飲み薬
  - `injection`：注射（生物学的製剤など）
- 製品の写真・ロゴ・商品の形をそのまま描いたものは使わない（著作権・商標のため）
- 文字と重なると、レイアウトチェックで不合格になる

### 書き方のルール（daily.mjs が自動でチェックする）
- **画面に出る数字は、すべて裏付けが必要**。どちらかで裏付ける：
  - `claims`：`quote` が `sources/*.txt` に一字一句あり、`value`（または `from`）がその中にあること。換算した数字は `from` と `derivation` で説明する
  - `plainNumbers`：データではない数字（「3剤」「6分間」など）に理由を書く
- 根拠シーン（1〜3）の `src` には、PMID / NCT番号 / FDA文書 のいずれかを必ず入れる。`src` に書いた PMID・NCT には、すべて `sources` のファイルが必要。
- `src` の書式は「著者 et al. 雑誌 年｜PMID 番号」。複数ある場合は「／」で区切る。
- `narration`：
  - 1文40字以内。数字は漢数字で書き、画面の数字を言い換えるだけにする
  - 英字の略語はカタカナにする（例：シーオーピーディー、エフディーエー）
- 字数の目安：
  - `hook.title` は1行7字まで
  - `close.lines` は1行9字まで
  - `big` は6字程度まで
  - はみ出しはレイアウトチェックで検出される
- 断定しすぎない：
  - 「治る」「必ず」「予防できる」は使わない
  - 「〜が減った（試験名）」「〜と報告」のように書く
- まとめの `take` に、受診や主治医への相談を促す一言を入れるとよい。

## 4. チェックと書き出し
```bash
node build/daily.mjs <DATE> --check-only   # 構造・出典・数値・レイアウトだけを素早く確認
node build/daily.mjs <DATE>                # 音声生成（VOICEVOX を自動起動）→ 書き出し → 最終チェック
```
- 失敗したら、表示された理由を直して再実行する。**チェックを緩めたり、`ready.json` を手で作ったりしてはいけない。**
- 成功すると、`daily/<DATE>/short.mp4`・`preview.jpg`・`metadata.json`・`ready.json` ができる。`topics.json` は自動で `done` になる。
- `preview.jpg`（5シーンの静止画）を必ず目で確認する。文字の重なり・読みにくさ・内容の誤りがあれば直して作り直す。
- 音声の読みは `daily/<DATE>/voice/manifest.json` の `kana` で確認する。読み違いはカタカナに直す。

## 5. コミットしてプッシュ
```bash
git add daily/<DATE> daily/topics.json
git commit -m "Daily short <DATE>: <テーマ>"
git push origin HEAD:claude/elegant-bohr-9674ux
```
- 現在は投稿しない方針のため、プッシュしても YouTube にはアップロードされない。`.github/workflows/youtube-upload.yml` は手動実行（Run workflow）のときだけ動く。**投稿の操作はしないこと。**
- 将来、投稿を再開した場合は、アップロード成功時に Actions が `daily/<DATE>/youtube.json` をコミットする。
- プッシュが拒否された場合（Actions の書き戻しとの競合）は、`git pull --rebase` してからプッシュし直す。

## 6. 報告
最後に、次の内容を短く報告する：
- テーマ
- 使った主な出典
- チェックの結果
- プッシュしたかどうか

失敗して公開しなかった場合は、その理由と、人が対応すべきことを書く。
