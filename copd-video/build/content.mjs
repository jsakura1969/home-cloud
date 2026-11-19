// COPD エビデンス・ショートの台本（テロップ・数値・出典・ナレーション）。
// 内容は ../evidence.md のエビデンス表に対応（各シーンの src が出典）。

export { SLOTS } from "./template.mjs";

// ---------------------------------------------------------------- content
export const VIDEOS = [
  {
    id: "v1",
    theme: "COPDはどれくらい多い？",
    scenes: [
      { type: "hook", kicker: "慢性閉塞性肺疾患", title: "COPDって<br>知ってる？", sub: "たばこ・大気汚染で肺が傷み、<br>息が吐き出しにくくなる病気" },
      {
        type: "stat", label: "世界の患者数（2021年）", count: 2.13, decimals: 2, unit: "億人",
        sub: "2億1,340万人が COPD を抱えている",
        src: "Cao Z, et al. BMJ Public Health 2026（GBD 2021）｜PMID 41561564",
      },
      {
        type: "stat", label: "COPDによる死亡（1年間）", count: 370, unit: "万人",
        sub: "世界の死因 <b>第3位</b>",
        src: "Cao Z, et al. BMJ Public Health 2026｜PMID 41561564 ／ Chen S, et al. Lancet Glob Health 2023｜PMID 37474226",
      },
      {
        type: "icons", label: "40歳以上では", big: "約8人に1人", total: 8, hit: 1,
        note: "肺機能検査（FEV1/FVC＜0.7）で12.6%。診断基準により約7〜13%",
        src: "Al Wachami N, et al. BMC Public Health 2024（メタ解析 42研究）｜PMID 38273271",
      },
      {
        type: "close", kicker: "最大のリスク因子", lines: ["大気の微粒子（PM）", "そして喫煙"],
        take: "息切れ・せき・たんが続くなら<br>早めに受診を",
        src: "Cao Z, et al. BMJ Public Health 2026（PM は DALYs の41.7%）｜PMID 41561564",
      },
    ],
  },
  {
    id: "v2",
    theme: "禁煙は治療の土台",
    scenes: [
      { type: "hook", kicker: "COPDの治療", title: "まず最初に<br>やることは？", sub: "答えは、薬より先に「禁煙」" },
      {
        type: "stat", label: "Lung Health Study（RCT）", count: 5887, unit: "人",
        sub: "軽い気流閉塞のある喫煙者を<br>禁煙支援 vs 通常ケアに割り付け",
        src: "Anthonisen NR, et al. Ann Intern Med 2005｜PMID 15710956",
      },
      {
        type: "compare", label: "14.5年後の全死亡（1000人年あたり）",
        bars: [
          { name: "通常ケア", value: 10.38, tone: "muted" },
          { name: "禁煙支援", value: 8.83, tone: "accent" },
        ],
        caption: "禁煙支援を受けた群で<b>死亡が少なかった</b>（HR 1.18、95%CI 1.02–1.37）",
        src: "Anthonisen NR, et al. Ann Intern Med 2005｜PMID 15710956",
      },
      {
        type: "stat", label: "32.5年後も", big: "呼吸器死亡↓",
        sub: "肺がん以外の呼吸器疾患による死亡を<br>減らす効果が続いていた（HR 1.21）",
        note: "※全死亡の差は32.5年時点では有意でなくなった",
        src: "Zhang J, et al. Am J Epidemiol 2026｜PMID 41164942",
      },
      {
        type: "close", kicker: "まとめ", lines: ["禁煙支援は", "COPD治療の土台"],
        take: "成功したのが一部の人でも<br>集団の死亡を減らした",
        src: "Anthonisen NR, et al. Ann Intern Med 2005｜PMID 15710956",
      },
    ],
  },
  {
    id: "v3",
    theme: "吸入薬：2剤から3剤へ",
    scenes: [
      { type: "hook", kicker: "増悪をくり返す人の吸入薬", title: "2剤か、<br>3剤か", sub: "吸入ステロイド ＋ 気管支拡張薬2種" },
      {
        type: "compare", label: "IMPACT試験：増悪（回/年）",
        bars: [
          { name: "2剤 UMEC/VI", value: 1.21, tone: "muted" },
          { name: "3剤", value: 0.91, tone: "accent" },
        ],
        caption: "3剤で増悪が<b>25%減</b>（10,355人）",
        src: "Lipson DA, et al. NEJM 2018｜PMID 29668352｜NCT02164513",
      },
      {
        type: "compare", label: "ETHOS試験：増悪（回/年）",
        bars: [
          { name: "2剤 GFF", value: 1.42, tone: "muted" },
          { name: "3剤 BGF320", value: 1.08, tone: "accent" },
        ],
        caption: "別の3剤でも<b>24%減</b>（8,509人）",
        src: "Rabe KF, et al. NEJM 2020｜PMID 32579807｜NCT02465567",
      },
      {
        type: "duo", label: "死亡リスクの低下も報告",
        cards: [
          { name: "IMPACT", value: "HR 0.72", sub: "vs UMEC/VI" },
          { name: "ETHOS", value: "HR 0.51", sub: "vs GFF" },
        ],
        note: "※どちらも追加データを集めた二次解析の結果",
        src: "Lipson DA, et al. AJRCCM 2020｜PMID 32162970 ／ Martinez FJ, et al. AJRCCM 2021｜PMID 33252985",
      },
      {
        type: "close", kicker: "注意点", lines: ["ICSを含む薬では", "肺炎が増える"], tone: "warn",
        take: "対象は「増悪歴のある人」<br>使い分けは主治医と相談を",
        src: "IMPACT: 肺炎 HR 1.53｜PMID 29668352 ／ ETHOS: 3.5–4.5% vs 2.3%｜PMID 32579807",
      },
    ],
  },
  {
    id: "v4",
    theme: "新しい治療：生物学的製剤",
    scenes: [
      { type: "hook", kicker: "3剤を使っても増悪する人へ", title: "注射で<br>炎症を抑える", sub: "COPDにも「生物学的製剤」の時代" },
      {
        type: "stat", label: "対象になる目印", big: "好酸球 ≥300",
        sub: "血液中の好酸球（/μL）が多い<br>＝ 2型炎症のタイプ",
        src: "BOREAS/NOTUS 試験の登録基準｜PMID 39900091",
      },
      {
        type: "compare", label: "中等度〜重度の増悪（回/年）",
        bars: [
          { name: "プラセボ", value: 1.156, tone: "muted" },
          { name: "デュピルマブ", value: 0.794, tone: "accent" },
        ],
        caption: "増悪が<b>約31%減</b>（1,874人）",
        src: "Bhatt SP, et al. Lancet Respir Med 2025｜PMID 39900091",
      },
      {
        type: "duo", label: "日本でも COPD で使える",
        cards: [
          { name: "日本での承認", value: "2025年", sub: "既存治療で<br>効果不十分な場合" },
          { name: "使い方", value: "2週ごと", sub: "300mgを皮下注射" },
        ],
        src: "サノフィ プレスリリース 2025年3月27日（デュピクセント COPD 適応追加の承認）",
      },
      {
        type: "close", kicker: "まとめ", lines: ["タイプを見分けて", "治療を上乗せ"],
        take: "重い増悪の年間回数では<br>デュピルマブに有意差なし",
        src: "Bhatt SP, et al. Lancet Respir Med 2025（重度増悪 RR 0.674, p=0.073）｜PMID 39900091",
      },
    ],
  },
  {
    id: "v5",
    theme: "薬以外の治療",
    scenes: [
      { type: "hook", kicker: "COPDの治療", title: "薬だけじゃ<br>ない", sub: "リハビリ・ワクチン・酸素" },
      {
        type: "stat", label: "呼吸リハビリで6分間の歩行距離が", count: 44, unit: "m 伸びた", prefix: "+",
        sub: "息切れ・疲れ・生活の質も改善<br>（65件のRCT、3,822人）",
        src: "McCarthy B, et al. Cochrane 2015｜PMID 25705944",
      },
      {
        type: "stat", label: "インフルエンザワクチン（不活化）", big: "増悪が減る",
        sub: "1人あたりの増悪回数 −0.37",
        note: "※試験数が少なく、エビデンスの質は低い",
        src: "Kopsaftis Z, et al. Cochrane 2018｜PMID 29943802",
      },
      {
        type: "duo", label: "在宅酸素は、効く人が限られる",
        cards: [
          { name: "重い低酸素", value: "生存↑", sub: "夜間だけの群は死亡1.94倍（NOTT）", tone: "accent" },
          { name: "中等度の低酸素", value: "差なし", sub: "SpO2 89–93%で死亡・入院 HR 0.94（LOTT）", tone: "muted" },
        ],
        src: "NOTT Group. Ann Intern Med 1980｜PMID 6776858 ／ LOTT Group. NEJM 2016｜PMID 27783918",
      },
      {
        type: "close", kicker: "まとめ", lines: ["動く・防ぐ・補う", "薬と組み合わせて"],
        take: "COPDは<br>治療で向き合える病気",
        src: "このシリーズの出典一覧は evidence.md（PMID・DOI付き）",
      },
    ],
  },
];

// ---------------------------------------------------------------- narration
// シーンごとの読み上げ文（VOICEVOX）。英字略語や読み違えやすい語はカタカナにしている。
// 各シーンの枠（SLOTS）− 0.6秒に収まるよう、build/voice.mjs が話速を調整する。
export const NARRATION = {
  v1: [
    "シーオーピーディー、知ってる？",
    "世界の患者数は、およそ二億一千三百万人。",
    "亡くなる人は年に三百七十万人。世界の死因、第三位です。",
    "四十歳以上では、およそ八人に一人という推計です。",
    "主なリスクは大気汚染と喫煙。せきが続いたら受診を。",
  ],
  v2: [
    "治療で、まずやることは？",
    "約六千人の喫煙者で、禁煙支援の効果を調べた試験があります。",
    "十四年半後、禁煙支援を受けた人たちは、死亡が少なくなっていました。",
    "三十二年半後も、呼吸器の病気による死亡を減らす効果が続いていました。",
    "禁煙支援は、シーオーピーディー治療の土台です。",
  ],
  v3: [
    "吸入薬は、二剤か、三剤か。",
    "インパクト試験では、三剤で増悪が二十五パーセント減りました。",
    "イーソス試験でも、別の三剤で二十四パーセント減りました。",
    "死亡リスクの低下も報告されていますが、二次解析の結果です。",
    "吸入ステロイドで肺炎が増えるため、主治医と相談を。",
  ],
  v4: [
    "三剤でも増悪する人には、注射の治療も。",
    "目印は、血液中の好酸球が多いタイプです。",
    "デュピルマブで、中等度以上の増悪が約三割減りました。",
    "日本でも二千二十五年に、シーオーピーディーで承認されています。",
    "タイプを見分けて、治療を上乗せします。",
  ],
  v5: [
    "治療は、薬だけじゃありません。",
    "呼吸リハビリで、六分間に歩ける距離が四十四メートル伸びました。",
    "インフルエンザワクチンで、増悪が減ることも分かっています。",
    "在宅酸素が効くのは、重い低酸素の人。中等度では差がありませんでした。",
    "薬と組み合わせて、シーオーピーディーと向き合いましょう。",
  ],
};

export { VOICE } from "./voice-lib.mjs";
