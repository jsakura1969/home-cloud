#!/usr/bin/env python3
"""講演スライド（15枚）を HTML で生成し、Chromium で PDF に書き出す。
使い方: python3 build_slides.py  → slides.html と 高齢者乳がん検診_講演スライド.pdf
数値は 05_slides_text.md（文章係）と 04_local_data_asaminami.md（区役所データ）に準拠。
"""
import pathlib, subprocess, sys

HERE = pathlib.Path(__file__).resolve().parent
ROSE, BLUE, GRAY, INK, MUTED, BG = "#C0395B", "#2F6DB5", "#B4B9C2", "#1F2A44", "#5B6475", "#FCFCFB"
GREEN, AMBER = "#2E8B57", "#E8A33D"


def chk(t="要確認"):
    return f'<span class="chk">{t}</span>'


def slide(n, title, body, foot=""):
    foot_html = f'<div class="foot">{foot}</div>' if foot else ""
    return f'''<section class="slide">
  <h1>{title}</h1>
  <div class="body">{body}</div>
  {foot_html}
  <div class="num">{n}/15</div>
</section>'''


def bullets(items, big=False):
    cls = "bul big" if big else "bul"
    return f'<ul class="{cls}">' + "".join(f"<li>{i}</li>" for i in items) + "</ul>"


def vbars(data, w=560, h=330, maxv=70, colors=None, unit="%"):
    """縦棒。data=[(label,value)]"""
    n = len(data); pad_l, pad_b, pad_t = 10, 40, 30
    bw = (w - pad_l) / n * 0.5; gap = (w - pad_l) / n
    s = [f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}">']
    base = h - pad_b
    s.append(f'<line x1="0" y1="{base}" x2="{w}" y2="{base}" stroke="#D5D8DE" stroke-width="1"/>')
    for i, (lab, v) in enumerate(data):
        x = pad_l + gap * i + (gap - bw) / 2
        bh = (h - pad_b - pad_t) * v / maxv
        c = (colors or {}).get(lab, GRAY)
        s.append(f'<path d="M{x},{base} v{-bh+4} q0,-4 4,-4 h{bw-8} q4,0 4,4 v{bh-4} z" fill="{c}"/>')
        weight = "800" if c != GRAY else "600"
        size = 30 if c != GRAY else 22
        s.append(f'<text x="{x+bw/2}" y="{base-bh-8}" text-anchor="middle" font-size="{size}" font-weight="{weight}" fill="{INK}">{v}{unit}</text>')
        s.append(f'<text x="{x+bw/2}" y="{base+28}" text-anchor="middle" font-size="20" fill="{MUTED}">{lab}</text>')
    s.append("</svg>")
    return "".join(s)


def hbars(data, w=600, rowh=38, maxv=50, colors=None, ref=None, unit="%", labw=90, fmt="{v}{unit}"):
    h = rowh * len(data) + 30
    s = [f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}">']
    span = w - labw - 70
    for i, (lab, v) in enumerate(data):
        y = 8 + i * rowh
        bl = span * v / maxv
        c = (colors or {}).get(lab, GRAY)
        bold = "800" if c != GRAY else "500"
        s.append(f'<text x="{labw-10}" y="{y+rowh*0.55}" text-anchor="end" font-size="19" font-weight="{bold}" fill="{INK}">{lab}</text>')
        s.append(f'<path d="M{labw},{y+4} h{bl-4} q4,0 4,4 v{rowh-18} q0,4 -4,4 h{-bl+4} z" fill="{c}"/>')
        s.append(f'<text x="{labw+bl+8}" y="{y+rowh*0.55}" font-size="19" font-weight="{bold}" fill="{INK}">{fmt.format(v=v, unit=unit)}</text>')
    if ref:
        rx = labw + span * ref[1] / maxv
        s.append(f'<line x1="{rx}" y1="2" x2="{rx}" y2="{h-22}" stroke="{INK}" stroke-width="2" stroke-dasharray="5,4"/>')
        s.append(f'<text x="{rx}" y="{h-4}" text-anchor="middle" font-size="16" fill="{MUTED}">{ref[0]}</text>')
    s.append("</svg>")
    return "".join(s)


def lines(series, xlabels, w=380, h=230, ymin=0, ymax=50, title=""):
    """series=[(name,[vals],color,dashed)] 直接ラベル付き"""
    pl, pr, pt, pb = 20, 110, 34, 34
    s = [f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}">']
    if title:
        s.append(f'<text x="0" y="18" font-size="17" font-weight="700" fill="{INK}">{title}</text>')
    iw, ih = w - pl - pr, h - pt - pb
    X = lambda i: pl + iw * i / (len(xlabels) - 1)
    Y = lambda v: pt + ih * (1 - (v - ymin) / (ymax - ymin))
    s.append(f'<line x1="{pl}" y1="{pt+ih}" x2="{pl+iw}" y2="{pt+ih}" stroke="#D5D8DE"/>')
    for i, xl in enumerate(xlabels):
        s.append(f'<text x="{X(i)}" y="{h-8}" text-anchor="middle" font-size="15" fill="{MUTED}">{xl}</text>')
    for name, vals, c, dashed in series:
        pts = " ".join(f"{X(i)},{Y(v)}" for i, v in enumerate(vals))
        da = ' stroke-dasharray="6,4"' if dashed else ""
        s.append(f'<polyline points="{pts}" fill="none" stroke="{c}" stroke-width="2.5"{da}/>')
        for i, v in enumerate(vals):
            s.append(f'<circle cx="{X(i)}" cy="{Y(v)}" r="4.5" fill="{c}" stroke="{BG}" stroke-width="2"/>')
        s.append(f'<text x="{X(len(vals)-1)+10}" y="{Y(vals[-1])+5}" font-size="15" font-weight="700" fill="{INK}">{name} {vals[-1]}</text>')
    s.append("</svg>")
    return "".join(s)


def timeline(fixed=False):
    w, h = 1100, 170
    seg = GREEN if fixed else ROSE
    s = [f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}">']
    x0, x1, x2 = 80, 300, 900
    s.append(f'<line x1="40" y1="90" x2="1060" y2="90" stroke="#D5D8DE" stroke-width="4"/>')
    s.append(f'<rect x="{x1}" y="78" width="{x2-x1}" height="24" rx="4" fill="{seg}" opacity="0.28"/>')
    for x, age, lab in [(x0+120, "69歳", "最後の検診"), (x2+60, "76歳", "しこり → ステージⅢ" if not fixed else "")]:
        if not lab:
            continue
        s.append(f'<circle cx="{x}" cy="90" r="10" fill="{INK}"/>')
        s.append(f'<text x="{x}" y="60" text-anchor="middle" font-size="24" font-weight="800" fill="{INK}">{age}</text>')
        s.append(f'<text x="{x}" y="132" text-anchor="middle" font-size="20" fill="{INK}">{lab}</text>')
    s.append(f'<text x="{(x1+x2)/2}" y="132" text-anchor="middle" font-size="20" fill="{INK}">70〜75歳：毎月の外来で血圧測定・処方</text>')
    s.append(f'<text x="{(x1+x2)/2}" y="160" text-anchor="middle" font-size="17" fill="{MUTED}">{"この6年間、乳がん検診の話は一度もなし" if not fixed else ""}</text>')
    if fixed:
        s.append(f'<g><rect x="{x1+10}" y="6" width="330" height="44" rx="22" fill="{GREEN}"/><text x="{x1+175}" y="35" text-anchor="middle" font-size="20" font-weight="700" fill="#fff">70歳「前回の検診はいつですか？」</text></g>')
        s.append(f'<text x="{x2+60}" y="60" text-anchor="middle" font-size="22" font-weight="800" fill="{GREEN}">早期発見の機会</text>')
    s.append("</svg>")
    return "".join(s)


CSS = f"""
@page {{ size: 1280px 720px; margin: 0; }}
* {{ box-sizing: border-box; }}
body {{ margin:0; background:{BG}; color:{INK};
  font-family: "Noto Sans JP", "IPAPGothic", "IPAGothic", sans-serif; }}
.slide {{ width:1280px; height:720px; position:relative; overflow:hidden; page-break-after: always;
  padding: 44px 64px 0 64px; background:{BG}; }}
.slide::before {{ content:""; position:absolute; left:0; top:0; width:12px; height:100%; background:{ROSE}; }}
h1 {{ margin:0 0 22px 0; font-size:38px; font-weight:800; letter-spacing:0.01em; line-height:1.25; }}
.body {{ display:flex; gap:40px; align-items:flex-start; }}
.col {{ flex:1; }}
.bul {{ margin:6px 0 0 0; padding-left:1.1em; font-size:28px; line-height:1.55; }}
.bul li {{ margin-bottom:14px; }}
.bul li::marker {{ color:{ROSE}; }}
.big {{ font-size:32px; }}
.foot {{ position:absolute; left:64px; right:120px; bottom:22px; font-size:12.5px; color:{MUTED}; line-height:1.45;
  border-top:1px solid #E3E5E9; padding-top:8px; }}
.num {{ position:absolute; right:40px; bottom:22px; font-size:16px; color:{MUTED}; }}
.chk {{ display:inline-block; font-size:13px; font-weight:700; color:#8A5A00; background:#FFF1D6; border:1px solid {AMBER};
  border-radius:4px; padding:0 5px; margin-left:6px; vertical-align:middle; line-height:1.6; }}
.hero {{ font-size:96px; font-weight:800; color:{ROSE}; line-height:1; }}
.hero.blue {{ color:{BLUE}; }}
.card {{ background:#fff; border:1px solid #E3E5E9; border-radius:14px; padding:20px 24px; margin-bottom:18px; }}
.card .k {{ font-size:18px; color:{MUTED}; }}
.card .v {{ font-size:46px; font-weight:800; line-height:1.15; }}
.card .s {{ font-size:17px; color:{MUTED}; }}
.band {{ margin-top:14px; background:#F6E7EC; border-left:6px solid {ROSE}; padding:12px 18px; font-size:20px; font-weight:700; }}
.bubble {{ position:relative; background:#fff; border:2px solid {BLUE}; border-radius:18px; padding:16px 22px; font-size:24px; margin-bottom:22px; }}
.bubble .who {{ font-size:16px; font-weight:700; color:{BLUE}; display:block; margin-bottom:4px; }}
.step {{ flex:1; background:#fff; border:1px solid #E3E5E9; border-radius:16px; padding:26px; font-size:27px; min-height:290px; position:relative; }}
.step .n {{ display:inline-block; width:44px; height:44px; border-radius:50%; background:{BLUE}; color:#fff; font-weight:800;
  font-size:24px; text-align:center; line-height:44px; margin-bottom:10px; }}
.arrow {{ font-size:44px; color:{GRAY}; align-self:center; }}
.badge {{ display:inline-block; margin-top:12px; background:{ROSE}; color:#fff; font-weight:800; border-radius:8px; padding:4px 12px; font-size:22px; }}
.key {{ display:flex; align-items:center; gap:26px; background:#fff; border:1px solid #E3E5E9; border-radius:16px; padding:18px 28px; margin-bottom:18px; }}
.key .no {{ font-size:46px; font-weight:800; color:{ROSE}; width:50px; }}
.key .t {{ font-size:30px; font-weight:700; }}
"""

S = []

# 1 タイトル
S.append(f'''<section class="slide" style="background:linear-gradient(135deg,#FBF1F4 0%,{BG} 60%)">
  <div style="margin-top:150px;font-size:26px;color:{MUTED}">2027年1月　安佐地区 医師向け講演</div>
  <div style="font-size:64px;font-weight:800;margin-top:14px">元気な70代を取りこぼさない</div>
  <div style="font-size:34px;font-weight:700;color:{ROSE};margin-top:14px">― かかりつけ医の一言で乳がん検診へ</div>
  <div style="font-size:24px;color:{MUTED};margin-top:28px">高齢者の乳がん検診受診を増やすために医師ができること</div>
  <div style="font-size:24px;margin-top:70px">演者名・所属 {chk("要記入")}　／　COI：開示すべき利益相反なし {chk("要記入")}</div>
  <div class="num">1/15</div>
</section>''')

# 2 症例
S.append(slide(2, "76歳、しこりに気づいて初めて受診した",
    f'''<div style="width:100%">{bullets(["高血圧で10年通院。元気で畑仕事も", "最後の検診は69歳。「もう年だから」", "診断はステージⅢ"])}
    <div style="margin-top:40px">{timeline()}</div></div>''',
    "本症例は説明のための架空の症例です。"))

# 3 キーメッセージ
S.append(slide(3, "今日お伝えしたい3つのこと",
    f'''<div style="width:100%">
    <div class="key"><div class="no">1</div><div class="t">広島市の70代以上の受診率は <span style="font-size:60px;color:{ROSE}">14%</span></div></div>
    <div class="key"><div class="no">2</div><div class="t">70〜74歳は勧める　75歳以上は話して勧める</div></div>
    <div class="key"><div class="no">3</div><div class="t">一番効くのは、かかりつけ医の一言</div></div></div>''',
    "①広島市の算定方法による令和6年度値（2年累積受診者÷対象者。対象者は就業者・要介護4/5・被爆者健康手帳保持者を除く）。出典：広島市におけるがん検診の実施状況について（令和7年度資料）、安佐南区役所提供"))

# 4 罹患
peak = (f'<svg width="560" height="320" viewBox="0 0 560 320">'
        f'<line x1="30" y1="270" x2="540" y2="270" stroke="#D5D8DE" stroke-width="2"/>'
        f'<path d="M30,268 C90,262 120,150 175,95 C215,60 235,140 275,150 C310,158 320,80 360,70 C400,62 420,120 460,160 C495,195 520,215 540,225 L540,270 L30,270 Z" fill="{ROSE}" opacity="0.18"/>'
        f'<path d="M30,268 C90,262 120,150 175,95 C215,60 235,140 275,150 C310,158 320,80 360,70 C400,62 420,120 460,160 C495,195 520,215 540,225" fill="none" stroke="{ROSE}" stroke-width="3"/>'
        f'<line x1="400" y1="40" x2="400" y2="270" stroke="{INK}" stroke-dasharray="5,4"/>'
        f'<text x="396" y="34" text-anchor="end" font-size="15" fill="{MUTED}">国の受診率統計は69歳まで</text>'
        f'<text x="190" y="80" text-anchor="middle" font-size="18" font-weight="700" fill="{INK}">45〜49歳</text>'
        f'<text x="352" y="58" text-anchor="middle" font-size="18" font-weight="700" fill="{INK}">65〜69歳</text>'
        f'<text x="500" y="128" text-anchor="middle" font-size="17" font-weight="700" fill="{INK}">70代以降も続く</text>'
        f'<text x="30" y="298" font-size="16" fill="{MUTED}">40歳</text><text x="540" y="298" text-anchor="end" font-size="16" fill="{MUTED}">90歳</text>'
        f'<text x="285" y="316" text-anchor="middle" font-size="14" fill="{MUTED}">模式図（目盛りなし）</text></svg>')
S.append(slide(4, "乳がんは60代後半にも山があり、70代以降も続く",
    f'''<div class="col" style="flex:1.25">{peak}<div style="font-size:22px;margin-top:4px">日本の乳がんは<b>二峰性</b>：45〜49歳と65〜69歳</div></div>
    <div class="col"><div class="card"><div class="k">広島市 女性の乳がん罹患</div><div class="v">875<span style="font-size:24px">人</span></div><div class="s">令和2年（令和元年 989人）・女性の部位別で最多</div></div>
    <div class="card"><div class="k">広島市 乳がん死亡</div><div class="v" style="color:{ROSE}">142<span style="font-size:24px">人</span></div><div class="s">令和6年（令和4・5年は各118人）・女性のがん死亡 第4位</div></div></div>''',
    "Hayashi N, et al. Breast Cancer, 2020（日本乳癌学会登録2017, 95,203例）／全国がん登録 広島県がん情報集計報告書（令和2年集計）／人口動態統計（いずれも広島市資料内、安佐南区役所提供）。全国の年齢階級別罹患数は確認中のため不掲載。"))

# 5 検診外発見
import math
def donut(p_hi, w=300):
    r, cx, cy, sw = 105, w/2, w/2, 46
    c = 2*math.pi*r
    a = c * p_hi/100
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 {w} {w}">'
            f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{GRAY}" stroke-width="{sw}"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{ROSE}" stroke-width="{sw}" stroke-dasharray="{a-3} {c-a+3}" transform="rotate(-90 {cx} {cy})"/>'
            f'<text x="{cx}" y="{cy-4}" text-anchor="middle" font-size="44" font-weight="800" fill="{INK}">84%</text>'
            f'<text x="{cx}" y="{cy+28}" text-anchor="middle" font-size="18" fill="{MUTED}">検診外で発見</text></svg>')
S.append(slide(5, "高齢者の乳がんは、検診の外で見つかっている",
    f'''<div class="col">{bullets(["75歳以上289例：検診発見は<b style='color:"+ROSE+"'>16%</b>だけ", "検診外発見は腫瘍が大きく、リンパ節転移も多い", "続けて検診を受けていた人は、進行例が少ない（米国）"])}</div>
    <div class="col" style="flex:0.8;text-align:center">{donut(84.1)}
    <div style="font-size:18px;display:flex;justify-content:center;gap:20px;margin-top:4px"><span><span style="display:inline-block;width:14px;height:14px;background:{ROSE};border-radius:3px"></span> 検診外 84.1%</span><span><span style="display:inline-block;width:14px;height:14px;background:{GRAY};border-radius:3px"></span> 検診発見 15.9%</span></div>
    <div style="font-size:17px;color:{MUTED};margin-top:10px">乳がん死：検診発見 0例／検診外 25例（10.3%）<br>※全死亡は調整後に差なし・単施設の後ろ向き研究</div></div>''',
    "Sato K, et al. Prev Med Rep, 2025（石巻赤十字病院、75〜98歳、単施設・後ろ向き）／Huang S, et al. JAMA Netw Open, 2025（米国SEER-Medicare、70歳以上の検診発見乳がん。前5年の検診歴あり：進行期 aOR 0.46、乳がん死 HR 0.63、観察研究）"))

# 6 年代別
S.append(slide(6, "70代以上の受診率は50代の4分の1以下",
    f'''<div class="col" style="flex:1.3"><div style="font-size:18px;color:{MUTED};margin-bottom:2px">広島市 年代別 乳がん検診受診率（令和6年度）</div>
    {vbars([("40代",56.1),("50代",60.7),("60代",35.2),("70代以上",14.2)], colors={"70代以上":ROSE})}
    <div class="band">国・県の受診率統計は40〜69歳だけ ＝ 70歳以上は「見えていない」</div></div>
    <div class="col" style="flex:0.8">{lines([("70代以上",[13.2,13.8,14.2],ROSE,False)], ["R4","R5","R6"], w=400, h=280, ymin=0, ymax=30, title="70代以上の推移（%）")}
    <div style="font-size:23px;margin-top:10px;line-height:1.5">3年間ほぼ横ばい<br><span style="color:{MUTED};font-size:19px">区役所でも高齢者の受診状況を<br>正確に示すデータは作れなかった</span></div></div>''',
    "広島市の算定方法：（前年度＋当該年度の受診者数）÷当該年度対象者数。対象者＝40歳以上人口−就業者（農林水産業除く）−要介護4/5−被爆者健康手帳保持者。国民生活基礎調査とは比較不可。出典：広島市におけるがん検診の実施状況（令和4〜6年度データ）、安佐南区役所提供 "+chk("引用表記")+"／国・県の算定対象40〜69歳：第3期がん対策推進基本計画（平成30年閣議決定）、安佐南区役所回答（2026年11月）"))

# 7 区別
wards = [("安佐北",41.9),("佐伯",39.3),("安芸",35.8),("安佐南",33.1),("東",27.8),("西",27.7),("南",23.2),("中",19.1)]
S.append(slide(7, "安佐地区は市内でも受診率が高い。まだ伸ばせる",
    f'''<div class="col" style="flex:1.15"><div style="font-size:18px;color:{MUTED}">区別 乳がん検診受診率（令和6年度）</div>
    {hbars(wards, w=600, rowh=50, maxv=50, colors={"安佐北":BLUE,"安佐南":BLUE}, ref=("市全体 29.7%",29.7))}</div>
    <div class="col">{lines([("安佐北",[38.2,41.5,42.8,41.9],BLUE,False),("安佐南",[31.7,33.5,33.4,33.1],"#7FA6D6",False),("市全体",[28.4,30.2,30.1,29.7],MUTED,True)], ["R3","R4","R5","R6"], w=460, h=300, ymin=20, ymax=50, title="推移（%）")}
    <div style="font-size:22px;line-height:1.55;margin-top:6px">安佐北区：<b>4年連続 市内1位</b><br>安佐南区：受診者 <b>4,521人/年</b>（市内最多）<br><span style="font-size:18px;color:{MUTED}">安佐北区は高齢化率も市内最高（35.9%）{chk()}</span></div></div>''',
    "共通脚注（広島市の算定方法）参照。令和3年度値・順位は安佐南区役所提供の集計表。区別×年代別の集計は資料になし。高齢化率：広島市「百歳以上高齢者の状況」令和7年度版（基準日要確認）。"))

# 8 年齢帯
def band_row(y, label, segs, note=""):
    out = [f'<text x="0" y="{y+24}" font-size="19" font-weight="700" fill="{INK}">{label}</text>']
    X = lambda a: 230 + (a-40)*13.5
    for a0, a1, kind, txt in segs:
        x0, x1 = X(a0), X(a1)
        if kind == "solid":
            out.append(f'<rect x="{x0}" y="{y+4}" width="{x1-x0}" height="30" rx="4" fill="{BLUE}"/>')
            out.append(f'<text x="{(x0+x1)/2}" y="{y+25}" text-anchor="middle" font-size="16" font-weight="700" fill="#fff">{txt}</text>')
        elif kind == "hatch":
            out.append(f'<rect x="{x0}" y="{y+4}" width="{x1-x0}" height="30" rx="4" fill="url(#hatch)" stroke="{BLUE}" stroke-width="1.5"/>')
            out.append(f'<text x="{(x0+x1)/2}" y="{y+25}" text-anchor="middle" font-size="16" font-weight="700" fill="{INK}">{txt}</text>')
        elif kind == "arrow":
            out.append(f'<line x1="{x0}" y1="{y+19}" x2="{x1}" y2="{y+19}" stroke="{BLUE}" stroke-width="4" marker-end="url(#ah)"/>')
            out.append(f'<text x="{(x0+x1)/2}" y="{y+2}" text-anchor="middle" font-size="16" fill="{INK}">{txt}</text>')
    return "".join(out)
X8 = lambda a: 230 + (a-40)*13.5
age_svg = [f'<svg width="1150" height="380" viewBox="0 0 1150 380"><defs>'
           f'<pattern id="hatch" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="0" y2="8" stroke="{BLUE}" stroke-width="2.5" opacity="0.5"/></pattern>'
           f'<marker id="ah" markerWidth="10" markerHeight="10" refX="6" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="{BLUE}"/></marker></defs>',
           f'<rect x="{X8(70)}" y="0" width="{X8(75)-X8(70)}" height="335" fill="#FFE9A8"/>',
           f'<text x="{(X8(70)+X8(75))/2}" y="372" text-anchor="middle" font-size="18" font-weight="800" fill="#8A5A00">取りこぼしゾーン</text>',
           band_row(20, "USPSTF 2024", [(40,75,"solid","40〜74歳 推奨B"),(75,90,"hatch","75歳〜  I（データ不足）")]),
           band_row(100, "米国がん協会 ACS", [(45,75,"solid","定期検診"),(75,90,"arrow","健康で余命10年以上なら継続")]),
           band_row(180, "ドイツ（2024〜）", [(50,76,"solid","公的検診 〜75歳に延長")]),
           band_row(260, "広島市の検診", [(40,90,"arrow","40歳以上（上限の記載なし）")]),
           ]
for a in range(40, 91, 10):
    age_svg.append(f'<text x="{X8(a)}" y="350" text-anchor="middle" font-size="16" fill="{MUTED}">{a}歳</text>')
age_svg.append("</svg>")
S.append(slide(8, "70〜74歳は指針の範囲内。上限で切らない",
    f'''<div style="width:100%">{"".join(age_svg)}
    <div style="font-size:22px;margin-top:6px">USPSTFの「I」は「勧めない」ではなく「判断に足るデータがない」という意味</div></div>''',
    "US Preventive Services Task Force, JAMA, 2024／Oeffinger KC, et al.（ACS）JAMA, 2015／Hunger T, et al. RöFo, 2026（ドイツの延長）／広島市 乳がん検診の案内。広島市の検診の上限年齢・厚労省指針の「受診を特に推奨する者」の年齢 "+chk()))

# 9 75歳以上
S.append(slide(9, "75歳以上は、年齢でなく元気さで決める",
    f'''<div class="col">
      <div class="card"><div class="k">検診継続と乳がん死（米国 約100万人）</div>
        <div style="font-size:28px;margin-top:6px"><b>70〜74歳</b>：HR <b style="color:{BLUE}">0.78</b>（減る方向）</div>
        <div style="font-size:28px"><b>75〜84歳</b>：HR <b>1.00</b>（差は見えず）</div></div>
      <div class="card"><div class="k">利益が出るまで</div><div class="v">約10年</div><div class="s">1000人検診で1人の乳がん死を防ぐまで 10.7年</div></div></div>
    <div class="col">
      <div class="card"><div class="k">75〜84歳：10年以内に他の病気で亡くなる割合</div>
        <div style="font-size:26px;margin-top:6px">併存疾患なし <b style="font-size:42px;color:{BLUE}">約3割</b>　多い <b style="font-size:42px;color:{ROSE}">約6割</b></div></div>
      <div class="card"><div class="k">過剰診断の可能性（75〜84歳）</div><div class="v">最大 約5割</div></div>
      <div class="band" style="font-size:24px">余命10年以上の元気な方に、利益と害を話して勧める</div></div>''',
    "García-Albéniz X, et al. Ann Intern Med, 2020（観察研究、余命10年以上が対象。70〜74歳：8年で1000人あたり−1.0人［95%CI −2.3〜0.1］）／Lee SJ, et al. BMJ, 2013／Demb J, et al. JNCI, 2020（29.8%／61.7%）／Richman IB, et al. Ann Intern Med, 2023（47%）"))

# 10 通院中
S.append(slide(10, "通院中の患者さんこそ、検診を受けていない",
    f'''<div style="width:100%">
    <div style="font-size:20px;color:{MUTED};margin-bottom:8px">定期通院中の40歳以上の外来患者（1施設、189人）</div>
    <div style="display:flex;height:84px;border-radius:10px;overflow:hidden;gap:2px">
      <div style="width:31.8%;background:{GRAY};display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700">受診 31.8%</div>
      <div style="width:68.2%;background:{ROSE};display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:800;color:#fff">未受診 68.2%</div></div>
    <div style="display:flex;gap:40px;margin-top:34px;align-items:center">
      <div class="bubble" style="border-color:{ROSE};font-size:34px;font-weight:700;flex:1">「通院しているから、要らない」<span class="who" style="color:{ROSE};margin-top:8px">未受診の理由で最多：未受診者の 50.3%</span></div>
      <div style="flex:1;font-size:26px;line-height:1.6">血圧や血糖は見ていても、<br><b>乳房は見ていない</b>。<br>だからこちらから聞く。</div></div></div>''',
    "Takeda E, et al. Int J Gen Med, 2023（千葉県の地方病院1施設、40歳以上の定期外来患者、男女・がん種混合）。参考：内閣府「がん対策に関する世論調査」（令和5年）の未受診理由上位「心配なときはいつでも受診できる」「費用」「時間がない」（割合 "+chk()+"）"))

# 11 医師の推奨
S.append(slide(11, "医師に勧められないことが、未受診の大きな要因",
    f'''<div class="col">{bullets(["「医師に勧められていない」人は受診しにくい", "かかりつけ医がいないと受診しにくい", "先生方がいること自体が受診の条件"])}</div>
    <div class="col" style="text-align:center">
      <div class="bubble" style="font-size:30px;font-weight:800;border-color:{ROSE};margin-top:10px">「先生から言われなかったから」</div>
      <div style="font-size:50px;color:{GRAY}">↓</div>
      <div style="font-size:40px;font-weight:800;color:{BLUE}">かかりつけ医の一言</div>
      <div style="font-size:20px;color:{MUTED};margin-top:24px">米国：高齢者の検診に賛成する医師 57%<br>実際に勧めていた医師 21%</div></div>''',
    "Schueler KM, et al. J Womens Health, 2008（221研究・約496万人、米国中心・横断研究主体。医師の推奨なし：受診の調整OR 0.16［0.08–0.33］、かかりつけ医なし：OR 0.41［0.32–0.53］）／Roetzheim RG, et al. J Am Geriatr Soc, 1995"))

# 12 確認して勧める
S.append(slide(12, "明日から① 外来で「確認して、勧める」",
    f'''<div style="width:100%">
    <div class="bubble"><span class="who">① まず確認</span>「前回の乳がん検診はいつでしたか？」</div>
    <div class="bubble"><span class="who">② 70〜74歳・元気な70代へ</span>「70歳を過ぎても受ける意味があります。広島市の検診なら<b>70歳以上は自己負担なし</b>ですよ」{chk()}</div>
    <div class="bubble"><span class="who">③ 75歳以上の元気な方へ</span>「治療しなくてよいものが見つかることもあります。それでも受けるか、一緒に決めましょう」</div>
    <div style="font-size:21px;color:{MUTED}">30秒の一言／看護師・受付の事前確認、問診票に1行追加でチームで聞く</div></div>''',
    "広島市の乳がん検診：70歳以上は証明書の提示で自己負担なし（令和8年度）"+chk("令和9年度の制度")+"。台本は実践の提案で、効果を直接検証したデータはない。"))

# 13 予約まで
S.append(slide(13, "明日から② その場で予約まで手伝う",
    f'''<div style="width:100%">
    <div style="display:flex;gap:18px">
      <div class="step"><div class="n">1</div><br>受診券の有無を確認<div style="font-size:18px;color:{MUTED};margin-top:10px">届くのは奇数年齢の方 {chk()}<br>「券が来ない＝対象外」の誤解に注意</div></div>
      <div class="arrow">▶</div>
      <div class="step"><div class="n">2</div><br>実施医療機関・集団検診を案内<div style="font-size:18px;color:{MUTED};margin-top:10px">市の検診ページ、区の保健センター</div></div>
      <div class="arrow">▶</div>
      <div class="step"><div class="n">3</div><br>その場で日時を決める<br><span class="badge">受診 約2倍</span><div style="font-size:16px;color:{MUTED};margin-top:6px">日時指定の招待（ベルギーRCT）</div></div></div>
    <div style="font-size:24px;margin-top:44px">広島市の検診：40歳以上、2年度に1回、マンモグラフィ　／　精検結果連絡票の提出にもご協力を</div></div>''',
    "広島市 乳がん検診の案内（受診券は受診時に必要）"+chk("令和9年度の送付対象・申込方法・安佐北区の実施機関")+"／Goossens MM, et al. Eur J Public Health, 2023（日時指定の招待：受診 RR 1.8〜2.3、絶対差 +4.4〜15.8ポイント）"))

# 14 リマインド
S.append(slide(14, "明日から③ リマインドで受診率は上がる",
    f'''<div class="col" style="flex:1.2"><div style="font-size:18px;color:{MUTED}">リマインダーなしと比べた受診率の上昇幅（中央値、ポイント）</div>
    {hbars([("電話など強化型",15.5),("リマインダー全体",12.3),("再受診",6.0),("文書のみ",4.5)], w=660, rowh=78, maxv=18, colors={"電話など強化型":ROSE}, labw=190, fmt="+{v}")}
    <div style="font-size:18px;color:{MUTED}">※高齢者に限った試験はほとんどない</div></div>
    <div class="col" style="flex:0.8">{bullets(["次の外来で「受けられましたか？」", "電子カルテに目印", "受診促進策は44 RCTの統合でも有効"])}</div>''',
    "The Community Guide, Cancer Screening: Client Reminders – Breast Cancer "+chk("数値更新")+"／Ferrari A, et al. Public Health Rev, 2025（44 RCT、OR 1.55［1.39–1.73］）／Scaioli G, et al. Eur J Cancer Prev, 2026"))

# 15 まとめ
S.append(slide(15, "次の外来で、一人に一言",
    f'''<div style="width:100%">
    <div style="display:flex;gap:18px;margin-bottom:10px">
      <div class="key" style="flex:1;margin:0"><div class="t">70〜74歳：<span style="color:{ROSE}">迷わず勧める</span></div></div>
      <div class="key" style="flex:1;margin:0"><div class="t">75歳以上：<span style="color:{BLUE}">元気な人に話して勧める</span></div></div></div>
    {timeline(fixed=True)}
    <div style="text-align:center;font-size:44px;font-weight:800;margin-top:6px">「前回の乳がん検診はいつですか？」</div></div>''',
    "症例は説明のための架空の症例です。"))

html = f'''<!doctype html><html lang="ja"><head><meta charset="utf-8"><title>高齢者乳がん検診 講演スライド</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;800&display=swap" rel="stylesheet">
<style>{CSS}</style></head><body>
{"".join(S)}
</body></html>'''
(HERE / "slides.html").write_text(html, encoding="utf-8")
print("wrote slides.html")
