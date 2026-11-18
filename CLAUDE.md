# Claude 活用リポジトリ

このリポジトリには、Claude を使いこなすためのスキルと、チャットで育てられる役割別エージェントが入っています。
返答・ドキュメントは日本語で書くこと。

## 役割別エージェント（`.claude/agents/`）
依頼内容に合うものがあれば、そのエージェントに任せる（Agent ツールで呼び出す）。

| エージェント | 使う場面 | 呼び方の例 |
|---|---|---|
| `計画係` | 着手前の計画・設計・段取り | 「計画係で計画を立てて」 |
| `調査係` | Web・資料・コードの調査、比較 | 「調査係で〜を調べて」 |
| `レビュー係` | コード・計画・文章のレビュー、完了前の検証 | 「レビュー係でチェックして」 |
| `文章係` | 日本語の文書・メール作成、推敲 | 「文章係でメールを書いて」 |

Agent ツールの subagent_type には上の日本語名を指定する（ファイル名は planner.md / researcher.md / reviewer.md / ja-writer.md）。
典型的な流れ: 計画係で計画 → 実装・作業 → レビュー係で検証。調べものは調査係、文章化は文章係。

## エージェントの教育
エージェントの結果に注文があれば `teach-agent` スキルで覚えさせる。
- `/teach-agent 調査係 出典には必ず確認日を書く`
- `/teach-agent 文章係 show`
- 「文章係には今後、箇条書きを多めにするよう覚えさせて」のような普通の言い方でもよい

学習内容は各エージェントファイル末尾の「学習メモ」に保存され、コミット・push される。

## 教育部屋（エージェントごとの専用チャット）
エージェントごとに専用のチャット（セッション）を「教育部屋」として使う。セッションのタイトルが「教育部屋: <エージェント名>」のもの、または最初のメッセージで教育部屋だと指定されたものが該当する。
教育部屋では次のように振る舞う:
- 担当エージェントの定義ファイルを最初に読み、そのエージェント本人として依頼をこなす（練習用の課題を出されたら実際にやってみせる）。
- ユーザーからダメ出し・好みの指摘があれば、teach-agent スキルの手順で担当エージェントの学習メモに反映し、コミット・push する。他のエージェントのファイルは触らない。
- 学習メモを更新したら、新しいルールでやり直した結果を見せる。
- 「今日の学習内容まとめて」と言われたら、そのチャットで追加・削除したルールを一覧にする。
- 教育部屋以外のチャットでは、通常どおり各エージェントを Agent ツールで呼び出して使う。

## 導入済みスキル（`.claude/skills/`、出典: skills.sh agent-workflows）
- obra/superpowers: brainstorming, writing-plans, executing-plans, systematic-debugging, verification-before-completion, requesting-code-review, subagent-driven-development, dispatching-parallel-agents
- vercel-labs/skills: find-skills（新しいスキルの検索・導入）
- vercel-labs/agent-browser: agent-browser（ブラウザ自動操作）。CLI 本体が必要: `agent-browser` コマンドが無ければ `npm i -g agent-browser` を実行してから使う
- 自作: teach-agent

スキルの更新: `npx skills update -p -y`（`skills-lock.json` で管理）
