# Claude 活用リポジトリ

このリポジトリには、Claude を使いこなすためのスキルと、チャットで育てられる役割別エージェントが入っています。
返答・ドキュメントは日本語で書くこと。

## 役割別エージェント（`.claude/agents/`）
依頼内容に合うものがあれば、そのエージェントに任せる（Agent ツールで呼び出す）。

| エージェント | 使う場面 | 呼び方の例 |
|---|---|---|
| `planner` | 着手前の計画・設計・段取り | 「planner で計画を立てて」 |
| `researcher` | Web・資料・コードの調査、比較 | 「researcher で〜を調べて」 |
| `reviewer` | コード・計画・文章のレビュー、完了前の検証 | 「reviewer でチェックして」 |
| `ja-writer` | 日本語の文書・メール作成、推敲 | 「ja-writer でメールを書いて」 |

典型的な流れ: planner で計画 → 実装・作業 → reviewer で検証。調べものは researcher、文章化は ja-writer。

## エージェントの教育
エージェントの結果に注文があれば `teach-agent` スキルで覚えさせる。
- `/teach-agent researcher 出典には必ず確認日を書く`
- `/teach-agent ja-writer show`
- 「ja-writer には今後、箇条書きを多めにするよう覚えさせて」のような普通の言い方でもよい

学習内容は各エージェントファイル末尾の「学習メモ」に保存され、コミット・push される。

## 導入済みスキル（`.claude/skills/`、出典: skills.sh agent-workflows）
- obra/superpowers: brainstorming, writing-plans, executing-plans, systematic-debugging, verification-before-completion, requesting-code-review, subagent-driven-development, dispatching-parallel-agents
- vercel-labs/skills: find-skills（新しいスキルの検索・導入）
- vercel-labs/agent-browser: agent-browser（ブラウザ自動操作）。CLI 本体が必要: `agent-browser` コマンドが無ければ `npm i -g agent-browser` を実行してから使う
- 自作: teach-agent

スキルの更新: `npx skills update -p -y`（`skills-lock.json` で管理）
