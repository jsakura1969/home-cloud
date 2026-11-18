#!/usr/bin/env python3
"""UserPromptSubmit フック: 依頼文を agent-triggers.json の条件と照合し、
該当するエージェントを Agent ツールで呼ぶよう Claude に指示を追加する。
失敗しても依頼の処理を止めないよう、例外時は何も出力せず終了する。"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))


def in_training_room(transcript_path):
    """教育部屋のチャットでは、そのチャット自身がエージェント役なので委任しない。"""
    try:
        with open(transcript_path, encoding="utf-8") as f:
            for i, line in enumerate(f):
                if i > 200:
                    break
                if "教育部屋:" in line or "教育部屋：" in line:
                    return True
    except Exception:
        pass
    return False


def main():
    data = json.load(sys.stdin)
    prompt = (data.get("prompt") or "").strip()
    with open(os.path.join(HERE, "agent-triggers.json"), encoding="utf-8") as f:
        cfg = json.load(f)

    if len(prompt) < cfg.get("min_length", 6) or prompt.startswith("/"):
        return
    low = prompt.lower()
    if any(p.lower() in low for p in cfg.get("skip_phrases", [])):
        return
    if in_training_room(data.get("transcript_path") or ""):
        return

    hits = []
    for a in cfg["agents"]:
        found = [k for k in a.get("keywords", []) if k.lower() in low]
        n = a.get("long_request_chars")
        if n and len(prompt) >= n:
            found.append(f"{n}文字以上の長い依頼")
        if found:
            hits.append((a.get("order", 99), a["name"], a.get("when", ""), found[:3]))
    if not hits:
        return
    hits.sort()

    lines = ["【エージェント起動条件に一致】この依頼は次のエージェントの起動条件に当てはまります。"]
    for _, name, when, found in hits:
        lines.append(f"- {name}（検出: {'、'.join(found)}／条件: {when}）")
    names = " → ".join(h[1] for h in hits)
    lines.append(
        f"CLAUDE.md の起動ルールに従い、Agent ツールで subagent_type に上の名前を指定して積極的に任せてください（推奨順: {names}）。"
        "サブエージェントは会話を見られないので、目的・背景・必要な情報をプロンプトに含めること。"
        "挨拶や一言で答えられる質問など、明らかに不要な場合だけは呼ばずに答えてよい。その場合も、どのエージェントを使わなかったかは書かなくてよい。"
    )
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "UserPromptSubmit",
            "additionalContext": "\n".join(lines),
        }
    }, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        pass
    sys.exit(0)
