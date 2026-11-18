"""COPD ショート用のオリジナル BGM（30秒の静かなパッド）を生成する。

外部素材を使わず、正弦波の和音をその場で合成するため、著作権やクレジットの心配はない。
使い方: python3 build/bgm.py  → assets/bgm/ambient.wav（48kHz・ステレオ・16bit）
必要: numpy
"""
import wave
from pathlib import Path

import numpy as np

SR = 48000
DUR = 30.0
OUT = Path(__file__).resolve().parent.parent / "assets" / "bgm" / "ambient.wav"

# ゆっくり進む明るめの和音（各7.5秒）: Cmaj9 → Am9 → Fmaj9 → Gsus2
CHORDS = [
    [48, 55, 59, 62, 64],  # C3 G3 B3 D4 E4
    [45, 52, 55, 59, 60],  # A2 E3 G3 B3 C4
    [41, 48, 52, 55, 57],  # F2 C3 E3 G3 A3
    [43, 50, 55, 57, 62],  # G2 D3 G3 A3 D4
]
CHORD_LEN = DUR / len(CHORDS)
XFADE = 2.5  # 和音どうしを重ねる秒数


def midi_hz(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def voice(freq, n, detune):
    """柔らかい音色: 基音＋弱い倍音、左右でわずかにずらす"""
    t = np.arange(n) / SR
    out = np.zeros((n, 2))
    for ch, d in enumerate((-detune, detune)):
        f = freq * (1 + d)
        tone = np.sin(2 * np.pi * f * t) + 0.18 * np.sin(2 * np.pi * 2 * f * t) + 0.06 * np.sin(2 * np.pi * 3 * f * t)
        out[:, ch] = tone
    return out


def envelope(n, attack, release):
    env = np.ones(n)
    a, r = int(attack * SR), int(release * SR)
    env[:a] = np.sin(np.linspace(0, np.pi / 2, a)) ** 2
    env[-r:] = np.cos(np.linspace(0, np.pi / 2, r)) ** 2
    return env


def main():
    total = int(DUR * SR)
    mix = np.zeros((total, 2))
    for i, chord in enumerate(CHORDS):
        start = max(0.0, i * CHORD_LEN - XFADE / 2)
        end = min(DUR, (i + 1) * CHORD_LEN + XFADE / 2)
        s, e = int(start * SR), int(end * SR)
        n = e - s
        env = envelope(n, XFADE, XFADE)[:, None]
        for j, note in enumerate(chord):
            gain = 0.5 if j == 0 else 0.28  # ベースを少し太く
            mix[s:e] += voice(midi_hz(note), n, detune=0.0015 + 0.0005 * j) * gain * env

    # ごく弱い「息」のようなノイズ（決定論的な乱数）＋ゆっくりした音量のゆらぎ
    rng = np.random.default_rng(7)
    noise = rng.standard_normal((total, 2))
    kernel = np.ones(400) / 400  # 簡易ローパス
    for ch in range(2):
        noise[:, ch] = np.convolve(noise[:, ch], kernel, mode="same")
    t = np.arange(total) / SR
    mix += noise * 0.6 * (0.5 + 0.5 * np.sin(2 * np.pi * t / 6.0))[:, None]
    mix *= (0.85 + 0.15 * np.sin(2 * np.pi * t / 10.0))[:, None]

    # 全体のフェードイン1秒・フェードアウト2.5秒、ピーク −6 dBFS に正規化
    mix *= envelope(total, 1.0, 2.5)[:, None]
    mix *= 10 ** (-6 / 20) / np.max(np.abs(mix))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    pcm = (mix * 32767).astype("<i2")
    with wave.open(str(OUT), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print("wrote", OUT)


if __name__ == "__main__":
    main()
