#!/usr/bin/env python3
"""PreToolUse(Bash) フック: git commit / git push / gh pr create の前に、
今回の依頼でまだレビュー係を呼んでいなければ、先に呼ぶよう Claude に伝える。
コマンドは止めず（ブロックしない）、指示を追加するだけ。"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))


def reviewed_since_last_user_message(transcript_path):
    """直近のユーザー発言以降に レビュー係 の Agent 呼び出しがあるか。"""
    try:
        with open(transcript_path, encoding="utf-8") as f:
            lines = f.readlines()
    except Exception:
        return False
    for line in reversed(lines):
        try:
            ev = json.loads(line)
        except Exception:
            continue
        msg = ev.get("message") or {}
        content = msg.get("content")
        if ev.get("type") == "assistant" and isinstance(content, list):
            for c in content:
                if c.get("type") == "tool_use" and (c.get("input") or {}).get("subagent_type") == "レビュー係":
                    return True
        if ev.get("type") == "user" and (isinstance(content, str) or (
                isinstance(content, list) and any(c.get("type") == "text" for c in content))):
            return False
    return False


def main():
    data = json.load(sys.stdin)
    cmd = (data.get("tool_input") or {}).get("command") or ""
    with open(os.path.join(HERE, "agent-triggers.json"), encoding="utf-8") as f:
        cfg = json.load(f).get("pre_commit_review", {})
    if not cfg.get("enabled") or not re.search(cfg["commands_regex"], cmd):
        return
    if cfg.get("skip_regex") and re.search(cfg["skip_regex"], cmd):
        return
    tp = data.get("transcript_path") or ""
    if reviewed_since_last_user_message(tp):
        return
    try:
        with open(tp, encoding="utf-8") as f:
            if "教育部屋:" in f.read(200000):
                return
    except Exception:
        pass
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "additionalContext": (
                "【レビュー係の起動条件に一致】コミット・push・PR作成の前です。今回の依頼ではまだレビュー係を呼んでいません。"
                "このコマンドの結果を確認したら、次の公開操作（push・PR作成など）に進む前に、Agent ツールで subagent_type=\"レビュー係\" を呼び、"
                "変更内容（git diff など）と依頼の要件を渡して検証させてください。指摘があれば直してから進めること。"
                "設定ファイルの一行修正など明らかに軽微な場合は省略してよい。"
            ),
        }
    }, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        pass
    sys.exit(0)
