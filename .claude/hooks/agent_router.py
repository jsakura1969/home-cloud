#!/usr/bin/env python3
"""UserPromptSubmit フック: 依頼文を agent-triggers.json の条件と照合し、
該当するエージェントを Agent ツールで呼ぶよう Claude に指示を追加する。
教育部屋のチャットでは委任せず、担当エージェントの起動条件に一致したかを知らせる。
失敗しても依頼の処理を止めないよう、例外時は何も出力せず終了する。"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))


def training_room_agent(transcript_path):
    """教育部屋のチャットなら担当エージェント名を返す（「教育部屋: 計画係」など）。それ以外は None。"""
    try:
        with open(transcript_path, encoding="utf-8") as f:
            for i, line in enumerate(f):
                if i > 200:
                    break
                m = re.search(r"教育部屋[:：]\s*([^\s」\"\\、。]+)", line)
                if m:
                    return m.group(1)
    except Exception:
        pass
    return None


def room_context(room, cfg, prompt, low):
    """教育部屋では委任せず、担当エージェントの起動条件に一致したかを知らせる。"""
    agent = next((a for a in cfg["agents"] if a["name"] == room), None)
    if agent is None:
        return None
    found = [k for k in agent.get("keywords", []) if k.lower() in low]
    n = agent.get("long_request_chars")
    if n and len(prompt) >= n:
        found.append(f"{n}文字以上の長い依頼")
    if found:
        msg = (f"【起動条件チェック（教育部屋: {room}）】この依頼は{room}の起動条件に一致します（検出: {'、'.join(found[:3])}）。"
               f"通常のチャットでも{room}が自動で呼ばれます。あなたは{room}本人として、そのまま依頼をこなしてください（Agent ツールで委任しない）。")
    else:
        msg = (f"【起動条件チェック（教育部屋: {room}）】この依頼は今の{room}の起動条件のどれにも一致しません。"
               f"あなたは{room}本人として、そのまま依頼をこなしてください（Agent ツールで委任しない）。"
               f"ただし、これが{room}に任せるべき種類の依頼なら、返答の最後に1行で「通常のチャットではこの依頼で{room}は自動起動しません。"
               f"キーワード「…」を起動条件に追加しますか？」と、追加候補（他の依頼に紛れにくい語）を1〜3個添えて提案すること。"
               f"ユーザーが同意したら teach-agent スキルの手順で .claude/hooks/agent-triggers.json を更新し、コミット・push する。"
               f"挨拶・雑談・教育についての指示（ダメ出しや学習メモの操作）の場合は提案しない。")
    return msg


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
    room = training_room_agent(data.get("transcript_path") or "")
    if room:
        msg = room_context(room, cfg, prompt, low)
        if msg:
            print(json.dumps({"hookSpecificOutput": {"hookEventName": "UserPromptSubmit",
                                                     "additionalContext": msg}}, ensure_ascii=False))
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
