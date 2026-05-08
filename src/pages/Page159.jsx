// === Page159.jsx === 自分史・一瞬の輝き - δ方式 v1.0
// Auto-generated from Page004 template (Phase 1 mass deploy)
// Theme keywords: 自分史, 輝き, 人生

import React, { useState, useRef, useEffect } from "react";

// ───────────────────────────────────────────────────────────
// 自分史・一瞬の輝き v2.0 - 4階層カテゴリ＋10問ラリー＋6軸レーダー (Page159)
// δ方式実装: API呼び出しゼロ、プロンプト生成のみ
// ───────────────────────────────────────────────────────────
// テーマ: 自分史・一瞬の輝き を構造化し、本人視点での再認識と次の一手を引き出す
// 構造:
//  - 4階層カテゴリ: 生活領域 / 感情タイプ / 思考パターン / 時間スコープ
//  - 10回会話ラリー: Q1〜Q10の段階的ヒアリング、進捗バー、前へ/次へ/スキップ
//  - 自分史・一瞬の輝きレーダー: 6軸 (睡眠/食欲/集中/気分/対人/興味)
//  - 診断ロジック: 感情循環モデル + マズロー欲求段階
//  - 履歴保存・呼び出し・削除 (localStorageから復元)
//  - プロンプト派生: 分析 / 他者視点 / 深掘り / 履歴サマリ
// ───────────────────────────────────────────────────────────

window._tapOn = typeof window._tapOn !== "undefined" ? window._tapOn : true;
window._speaking = false;

function T(type = "tap") {
  if (!window._tapOn) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    if (type === "tap") {
      o.frequency.setValueAtTime(880, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.06);
      g.gain.setValueAtTime(0.12, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      o.start(); o.stop(ctx.currentTime + 0.08);
    } else if (type === "success") {
      [523, 659, 784].forEach((f, i) => {
        const o2 = ctx.createOscillator(), g2 = ctx.createGain();
        o2.connect(g2); g2.connect(ctx.destination);
        o2.frequency.value = f;
        g2.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.1);
        g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.2);
        o2.start(ctx.currentTime + i * 0.1); o2.stop(ctx.currentTime + i * 0.1 + 0.25);
      });
    } else if (type === "send") {
      o.frequency.setValueAtTime(660, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.06);
      g.gain.setValueAtTime(0.1, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      o.start(); o.stop(ctx.currentTime + 0.1);
    } else if (type === "next") {
      o.frequency.setValueAtTime(740, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(988, ctx.currentTime + 0.07);
      g.gain.setValueAtTime(0.09, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
      o.start(); o.stop(ctx.currentTime + 0.09);
    }
  } catch (e) {}
}

function doSpeak(text) {
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ja-JP"; u.rate = 0.95;
    u.onend = () => { window._speaking = false; };
    const v = window.speechSynthesis.getVoices().find(v => v.lang.includes("ja"));
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
    window._speaking = true;
  } catch (e) {}
}

function doStopSpeak() { try { window.speechSynthesis.cancel(); window._speaking = false; } catch (e) {} }

const C = {
  bg: "#f0ede8", surface: "#ffffff", surface2: "#e8e4de", surface3: "#ddd8d0",
  border: "#c8c0b4", borderActive: "#8a6030",
  gold: "#8a6030", goldLight: "#f5e8d0", goldDim: "#5a3a10",
  goldBg: "rgba(138,96,48,0.08)", text: "#1a1210",
  textSub: "#3a3028", textMuted: "#6a5e50",
  green: "#1a4a30", greenLight: "#d0eedd",
  blue: "#1a4a6a", blueLight: "#d0e0ee",
  red: "#a02018", purple: "#4a1890",
};

// ============================================================
// 階層カテゴリ定義 (大カテゴリ→詳細)
// ============================================================

// 生活領域 7カテゴリ
const DOMAIN_CATS = {
  "仕事・キャリア": [
    "業務量過多", "上司との関係", "同僚との関係", "評価・処遇への不満",
    "将来のキャリアが見えない", "転職を考えている", "業務内容のミスマッチ",
  ],
  "人間関係": [
    "友人関係", "ご近所・地域", "SNSでの繋がり",
    "苦手な人がいる", "孤独感", "人付き合いの疲れ",
  ],
  "家族・パートナー": [
    "パートナーとの関係", "子育ての悩み", "親との関係",
    "介護の負担", "義実家との関係", "離婚・別居の悩み",
  ],
  "健康・身体": [
    "不眠・睡眠の質", "体調不良が続く", "体重・食生活",
    "運動不足", "持病・通院", "メンタル不調の自覚",
  ],
  "お金・将来": [
    "収入への不安", "貯蓄が足りない", "ローン・借金",
    "老後資金", "子供の教育費", "投資の不安",
  ],
  "自分自身": [
    "自己肯定感の低さ", "外見・体型の悩み", "性格・気質",
    "能力・スキル不足", "やりたいことが分からない", "成長の停滞",
  ],
  "社会・世間": [
    "ニュース・報道に疲れる", "社会問題への不安", "災害・気候不安",
    "戦争・政治", "経済・物価高",
  ],
};

// 感情タイプ 6カテゴリ
const EMOTION_CATS = {
  "不安系": [
    "漠然とした不安", "心配・気がかり", "恐れ・怖さ",
    "緊張・気が休まらない", "何かが起きそうな予感",
  ],
  "怒り系": [
    "苛立ち・イライラ", "憤り・腹立たしさ", "不満・不公平感",
    "嫉妬・羨望", "理不尽への怒り",
  ],
  "悲しみ系": [
    "落ち込み・憂鬱", "虚しさ・空虚感", "孤独感",
    "後悔・取り返せない感", "喪失感",
  ],
  "無気力系": [
    "やる気が出ない", "興味・関心の喪失", "疲労感が取れない",
    "何もしたくない", "意味を感じない",
  ],
  "焦り系": [
    "焦燥感", "急かされる感覚", "時間が足りない",
    "周りに置いていかれる感", "結果が出ない焦り",
  ],
  "罪悪感系": [
    "自責の念", "後ろめたさ", "申し訳なさ",
    "過去の言動への悔い", "迷惑をかけている感覚",
  ],
};

// 思考パターン 6カテゴリ (CBT認知の歪み)
const COGNITIVE_CATS = {
  "極端思考": [
    "白黒思考（0か100か）", "一般化（いつも・絶対）",
    "最悪想定（破局思考）", "拡大解釈・縮小解釈",
  ],
  "自己責任過多": [
    "自己批判・自責", "べき思考（〜すべき）",
    "完璧主義", "罪悪感の引き取り",
  ],
  "他者比較": [
    "SNSでの比較", "同僚・友人との比較",
    "過去の自分との比較", "理想像との比較",
  ],
  "反芻思考": [
    "過去の出来事を繰り返し考える", "後悔のループ",
    "言われた一言が頭から離れない", "失敗の再生",
  ],
  "未来不安": [
    "先取り心配", "起きるか分からないことへの不安",
    "計画が崩れる恐れ", "コントロールできない未来",
  ],
  "心読み": [
    "他人の気持ちを推測", "嫌われている感覚",
    "評価を気にしすぎる", "顔色を読む疲れ",
  ],
};

// 時間スコープ 4カテゴリ
const TIME_CATS = {
  "短期（直近）": [
    "今日のこと", "今週のこと", "数日前から",
  ],
  "中期（数週〜数ヶ月）": [
    "今月のこと", "最近1〜3ヶ月", "季節の変わり目から",
  ],
  "長期（半年以上）": [
    "半年〜1年", "数年前から", "ずっと前から",
  ],
  "未来軸（先取り）": [
    "来月のこと", "来年のこと", "5年後・10年後",
    "老後・将来", "起こるか分からない先のこと",
  ],
};

// ============================================================
// 10回会話ラリー設計 (q1〜q10)
// ============================================================

const RALLY_QUESTIONS = [
  { id: "q1", step: 1, q: "今、「自分史」について頭の中にあることを全部書き出してください。", placeholder: "例：自分史が気がかり、最近自分史について思い出すこと、引っかかっている言葉... 小さなことでも全部" },
  { id: "q2", step: 2, q: "書き出したものの中で、今「一番心が動いている」のはどれですか？なぜ動くのですか？", placeholder: "例：〇〇が一番引っかかる。なぜなら..." },
  { id: "q3", step: 3, q: "それはいつから？きっかけになった出来事はありますか？", placeholder: "例：〇月から / 〇〇があった日から / きっかけは思い当たらない など" },
  { id: "q4", step: 4, q: "これまでに自分史についてどう取り組んできましたか？効いた・効かなかったのは？", placeholder: "例：本を読んだ / 誰かに相談した / 試したが続かなかった など" },
  { id: "q5", step: 5, q: "もし「自分史」が理想の状態に近づいたら、何が一番変わると思いますか？", placeholder: "例：朝の気分が変わる / 周りとの関係が変わる / 自信がつく など" },
  { id: "q6", step: 6, q: "「自分史」のうち、自分でコントロールできる部分はどこですか？できない部分は？", placeholder: "コントロールできる：...\nコントロールできない：..." },
  { id: "q7", step: 7, q: "親友が同じテーマで悩んでいたら、あなたは何と声をかけますか？", placeholder: "例：「焦らなくていい」「一回休んでみたら」など、優しい言葉" },
  { id: "q8", step: 8, q: "最悪のシナリオは何ですか？それが現実になる確率は何%くらいだと思いますか？", placeholder: "最悪の場合：...\n確率：約〇%" },
  { id: "q9", step: 9, q: "1年後、「自分史」はどうなっていそうですか？残っているとしたら何が変わっていますか？", placeholder: "例：解決している / 形を変えて残っている / 別の課題に置き換わる など" },
  { id: "q10", step: 10, q: "今夜寝る前にできる、ほんの小さな一歩は何ですか？", placeholder: "例：3分書く / 信頼できる人にLINE / 関連動画を1本見る など" },
];

// ============================================================
// 自分史・一瞬の輝きレーダー 6軸
// ============================================================

const HEALTH_AXES = [
  { id: "clar", icon: "🔍", label: "明晰さ", desc: "やりたいことが見えている度合い" },
  { id: "ener", icon: "⚡", label: "活力", desc: "行動に向かう気力" },
  { id: "conn", icon: "🤝", label: "繋がり", desc: "支え合える関係の充実" },
  { id: "grow", icon: "🌱", label: "成長", desc: "前進している感覚" },
  { id: "joy", icon: "✨", label: "喜び", desc: "楽しいと感じる瞬間の量" },
  { id: "peac", icon: "🕊️", label: "平穏", desc: "心の落ち着き" },
];

// 診断ロジック - 感情循環モデル
const EMOTION_CYCLE = {
  diagnose: (domain, emotion, cognitive) => {
    const e = (emotion || []).join(" ");
    const c = (cognitive || []).join(" ");
    const d = (domain || []).join(" ");
    if (/孤独|嫉妬|苦手な人|パートナー|親|義実家|友人/.test(d + " " + e))
      return { label: "関係修復フェーズ", color: C.red, desc: "対人関係の摩耗が中心です。まず「安全な関係」を1つ取り戻すのが最優先。", action: "今週、安心して話せる相手と15分だけ話す約束を取る" };
    if (/反芻|心読み|べき思考|完璧|自己批判|罪悪感/.test(c + " " + e))
      return { label: "思考整理フェーズ", color: C.blue, desc: "思考が同じ軌道をぐるぐる回っています。一度「外に出す」ことが解放の鍵。", action: "気になることを紙に全部書き出し、コントロール可能/不可で分ける" };
    if (/無気力|疲労|興味の喪失|焦り|時間が足りない/.test(e + " " + d))
      return { label: "行動転換フェーズ", color: C.gold, desc: "やることが多すぎるか、やり方が合っていません。「やめる」を決めるのが先。", action: "今週「やめること」を1つだけ決めて実行する" };
    if (/未来不安|破局|転職|キャリア|やりたいことが分からない|意味を感じない/.test(c + " " + d + " " + e))
      return { label: "意味再発見フェーズ", color: C.green, desc: "進んでいる方向と心の北極星がずれています。「今やっていることの意味」を再点検。", action: "1日1回、今日やったことの中から「自分なりに意味があった瞬間」を1つ書き出す" };
    return { label: "バランス調整フェーズ", color: C.green, desc: "現時点では大きな崩れはなさそうです。さらに「自分を労わる時間」を増やしましょう。", action: "1日10分、何もしない時間を意図的に確保する" };
  },
};

const MASLOW = {
  diagnose: (domain, emotion, time) => {
    const s = [...(domain || []), ...(emotion || []), ...(time || [])].join(" ");
    if (/不眠|体調|食生活|疲労|健康|身体|メンタル不調/.test(s))
      return { level: 2, name: "安全欲求", desc: "心身の土台が揺らいでいます。「体を整える」ことが最優先。" };
    if (/孤独|友人関係|苦手な人|パートナー|親|義実家|嫉妬/.test(s))
      return { level: 3, name: "所属・愛情欲求", desc: "「ここに居ていい」という安心感が薄れています。1つでも安全な繋がりを。" };
    if (/評価|自己肯定感|外見|罪悪感|他者比較|SNS/.test(s))
      return { level: 4, name: "承認欲求", desc: "自分を認めてもらいたい欲求が満たされていません。まず自分自身からの承認を。" };
    if (/やりたいこと|意味|キャリア|成長|未来|興味の喪失/.test(s))
      return { level: 5, name: "自己実現欲求", desc: "成長・実現への欲求が動いています。「自分にとっての意味」を再構築する時期。" };
    return { level: 3, name: "所属・愛情欲求", desc: "基本欲求は満たされています。さらに繋がりを深めると次の段階が見えます。" };
  },
};

// ============================================================
// δ方式プロンプト生成
// ============================================================

const buildAnalysisPrompt = (userName, persona, rallyAnswers, radarScores) => {
  const cycle = EMOTION_CYCLE.diagnose(persona.domain, persona.emotion, persona.cognitive);
  const maslow = MASLOW.diagnose(persona.domain, persona.emotion, persona.time);

  const nm = (userName || "").trim();

  // 健康レーダー文字列化
  const radarBlock = HEALTH_AXES.map(ax => {
    const v = radarScores[ax.id] || 3;
    const bar = "■".repeat(v) + "□".repeat(5 - v);
    return `${ax.icon} ${ax.label}: ${bar} (${v}/5) - ${ax.desc}`;
  }).join("\n");

  // 一番低い軸
  const lowestAxis = HEALTH_AXES.slice().sort((a, b) => (radarScores[a.id] || 3) - (radarScores[b.id] || 3))[0];
  const lowestVal = radarScores[lowestAxis.id] || 3;

  // ペルソナ要約
  const personaBlock = `生活領域: ${(persona.domain || []).join("・") || "(未選択)"}
感情タイプ: ${(persona.emotion || []).join("・") || "(未選択)"}
思考パターン: ${(persona.cognitive || []).join("・") || "(未選択)"}
時間スコープ: ${(persona.time || []).join("・") || "(未選択)"}`;

  // 10ラリー回答
  let rallyBlock = "";
  if (Array.isArray(rallyAnswers) && rallyAnswers.some(a => a && a.trim())) {
    rallyBlock = "\n━━━ 10回会話ラリーの回答 ━━━\n";
    RALLY_QUESTIONS.forEach((rq, i) => {
      const ans = (rallyAnswers[i] || "").trim();
      rallyBlock += `Q${rq.step}. ${rq.q}\n  → ${ans || "(スキップ)"}\n`;
    });
  }

  return `あなたは「「自分史・一瞬の輝き」の専門家」です。認知行動療法(CBT)・成功循環モデル・マズロー欲求段階の知見を踏まえ、以下の人物の自分史を構造化し、解放への道筋を提示してください。

${nm ? `【対象者】${nm}` : "【対象者】(匿名)"}

━━━ ペルソナ4軸分析 ━━━
${personaBlock}

━━━ 自分史・一瞬の輝きレーダー (6軸主観スコア / 5段階) ━━━
${radarBlock}
※ 最も低い軸: 【${lowestAxis.icon} ${lowestAxis.label}: ${lowestVal}/5】 - ${lowestAxis.desc}

━━━ 感情循環モデル診断 ━━━
現在のフェーズ: 【${cycle.label}】
${cycle.desc}
今週の一手: ${cycle.action}

━━━ マズロー欲求段階診断 ━━━
優先欲求: 【${maslow.name}（第${maslow.level}段階）】
${maslow.desc}
${rallyBlock}
━━━ 出力フォーマット ━━━

### 【自分史・一瞬の輝き 構造マップ】
感情・思考・行動・環境の4分類で、本人の言葉を引用しながら整理してください（300〜400字）。

### 【本当の原因の特定】
表面的な自分史の奥にある根本原因を、ペルソナ4軸と10ラリー回答を統合して論理的に示してください（300〜400字）。

### 【健康レーダーから見えるサイン】
最も低い軸「${lowestAxis.label}」を中心に、生活全体への波及と回復の最短ルートを示してください（200〜300字）。

### 【今すぐできる一手】
コントロールできることの中から、今夜寝る前または明日朝にできる「最小単位の行動」を1つ提示してください。10ラリーQ10の回答を参考に。

### 【思考の書き換え】
最もネガティブな思考パターンを取り出し、CBTの認知再構成法でより現実的な視点に書き換えてください（具体例つき、200〜300字）。

### 【1ヶ月後の自分への手紙】
1ヶ月この処方箋を続けたあとの自分から、今の自分に向けた短い手紙（150〜200字）を書いてください。

合計1200〜1800字。途中で終わらず、全セクションを書き切ってください。

━━━ 使い方 ━━━
このプロンプトをコピーして Claude / ChatGPT / Gemini に貼り付けてください。`;
};

const buildPerspectivePrompt = (userName, analysisText) => {
  return `あなたは「他者視点分析の専門家」です。以下の自分史・一瞬の輝き分析を踏まえ、3つの異なる視点からその人を見たときに何が見えるかを描写してください。

### 👫 親友・友人の視点
${userName ? userName + "さんを" : "この人を"}よく知る親友として、「この人がいま抱えているもの」「無理しすぎているところ」「あなたのままでいい部分」を率直に語ってください。愛情ある正直さで。2〜3段落。

### ❤️ 大切な家族・パートナーの視点
身近にいる人として、「そばにいて感じること」「気づいているけど言えていないこと」「あなたが思っているよりずっと大切に思っていること」を語ってください。2〜3段落。

### 🔮 1年後の自分の視点
1年後の${userName ? userName + "さん" : "あなた"}が今を振り返って語ってください。「あの頃の自分は…」「今から見れば…」「あの選択をしたから今がある」。2〜3段落。

各視点は語りかける形式で。鋭く、温かく、読んで「確かに…」と思わせる内容に。合計900〜1200字。途中で終わらないこと。

──────────────────────────
【元の分析結果】
${(analysisText || "").slice(0, 1200)}
──────────────────────────`;
};

const buildDeepDivePrompt = (userName, analysisText, theme) => {
  return `あなたは「強み言語化の専門家」です。以下の人物の自分史・一瞬の輝き分析結果を踏まえ、特定のテーマについて深掘りした追加分析を行ってください。

### 深掘りテーマ
${theme}

### 出力フォーマット
1. このテーマがその人の現状とどう繋がっているか（3〜4文）
2. 具体的な向き合い方を3パターン
3. 注意すべき落とし穴を1つ
4. 今日から始められる小さな実験を1つ

合計600〜800字で。

──────────────────────────
${userName ? "【対象者】" + userName + "\n\n" : ""}【元の分析結果】
${(analysisText || "").slice(0, 1000)}
──────────────────────────`;
};

const buildHistorySummaryPrompt = (history) => {
  const recent = history.slice(0, 5);
  return `あなたは継続的なメンタルケアをサポートするコーチです。以下は同じ人の過去${recent.length}回分のセッション履歴です。

この人の変化・回復・繰り返されているパターン・今後の課題を200〜300字程度でサマリしてください。
過去から現在への流れが分かるように、時系列を意識して書いてください。

──────────────────────────
${recent.map((h, i) => `【${i + 1}回目 ${h.date}】\n${(h.analysis || h.preview || "").slice(0, 400)}`).join("\n\n---\n\n")}
──────────────────────────`;
};

// ============================================================
// ストレージ
// ============================================================

const HISTORY_KEY = "app159_history_v2";
const loadHistory = () => { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; } };
const saveHistory = (h) => { try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(-50))); } catch {} };

const PROFILE_KEY = "app159_profile_v2";
const loadProfile = () => { try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || "null"); } catch { return null; } };
const saveProfile = (p) => { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch {} };

// ============================================================
// UI Components
// ============================================================

const Chip = ({ label, selected, onClick, multi, small }) => (
  <button onClick={onClick} style={{
    padding: small ? "5px 10px" : "6px 12px",
    borderRadius: 20, fontSize: small ? 11 : 11.5, cursor: "pointer",
    background: selected ? C.goldLight : C.surface2,
    border: `1.5px solid ${selected ? C.borderActive : C.border}`,
    color: selected ? C.goldDim : C.textSub,
    fontWeight: selected ? 700 : 400, transition: "all 0.15s", whiteSpace: "nowrap",
  }}>
    {selected && multi ? "✓ " : ""}{label}
  </button>
);

const CategoryBtn = ({ name, count, selectedCount, expanded, onClick }) => (
  <button onClick={onClick} style={{
    padding: "10px 12px", borderRadius: 10,
    background: expanded ? C.goldLight : (selectedCount > 0 ? C.surface : C.surface2),
    border: `1.5px solid ${expanded ? C.borderActive : (selectedCount > 0 ? C.gold : C.border)}`,
    color: expanded ? C.goldDim : C.textSub,
    fontSize: 12, fontWeight: 700, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: 8, textAlign: "left", width: "100%",
  }}>
    <span>
      {expanded ? "▼ " : "▶ "}{name}
      {selectedCount > 0 && (
        <span style={{ marginLeft: 6, fontSize: 10, color: C.gold }}>
          ({selectedCount}選択)
        </span>
      )}
    </span>
    <span style={{ fontSize: 10, color: C.textMuted, fontWeight: 400 }}>
      {count}項目
    </span>
  </button>
);

const HierCatPicker = ({ catObj, selected, multi, expandedCat, setExpandedCat, onPick, label, icon }) => {
  const countSelected = (catName) => {
    const items = catObj[catName] || [];
    if (multi) {
      const arr = selected || [];
      return items.filter(it => arr.includes(it)).length;
    } else {
      return selected && items.includes(selected) ? 1 : 0;
    }
  };
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 12, color: C.textSub, marginBottom: 8, fontWeight: 600 }}>
        {icon} {label}
        {multi && <span style={{ marginLeft: 6, fontSize: 10, color: C.textMuted }}>(複数選択可)</span>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {Object.keys(catObj).map((catName) => {
          const isExpanded = expandedCat === catName;
          const items = catObj[catName] || [];
          const sCount = countSelected(catName);
          return (
            <div key={catName}>
              <CategoryBtn
                name={catName}
                count={items.length}
                selectedCount={sCount}
                expanded={isExpanded}
                onClick={() => { T("tap"); setExpandedCat(isExpanded ? null : catName); }}
              />
              {isExpanded && (
                <div style={{
                  display: "flex", flexWrap: "wrap", gap: 5,
                  padding: "8px 10px", marginTop: 4, marginBottom: 4,
                  background: C.goldBg, borderRadius: 8,
                  border: `1px dashed ${C.border}`,
                }}>
                  {items.map((opt) => {
                    const sel = multi ? (selected || []).includes(opt) : selected === opt;
                    return (
                      <Chip key={opt} label={opt} selected={sel} multi={multi}
                        onClick={() => onPick(opt)} small />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PromptCard = ({ title, prompt, onCopied }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    T("send");
    try { await navigator.clipboard.writeText(prompt); }
    catch {
      const el = document.createElement("textarea");
      el.value = prompt;
      el.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(el); el.select();
      document.execCommand("copy"); document.body.removeChild(el);
    }
    setCopied(true); T("success");
    if (onCopied) onCopied();
    setTimeout(() => setCopied(false), 2500);
  };
  return (
    <div style={{ background: C.surface, border: `1.5px solid ${C.borderActive}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.gold }}>{title}</div>
        <button onClick={copy} style={{ padding: "7px 14px", background: copied ? C.greenLight : C.gold, border: `1px solid ${copied ? C.green : C.gold}`, borderRadius: 8, color: copied ? C.green : "#fff", fontSize: 11, fontWeight: 700 }}>
          {copied ? "✅ コピー済" : "📋 コピー"}
        </button>
      </div>
      <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, fontSize: 11.5, lineHeight: 1.85, color: C.text, whiteSpace: "pre-wrap", maxHeight: 320, overflowY: "auto", fontFamily: "monospace" }}>
        {prompt}
      </div>
    </div>
  );
};

// 自分史・一瞬の輝きレーダー (6軸SVG)
const HealthRadar = ({ scores, onChange }) => {
  const W = 280, H = 280, cx = 140, cy = 140, r = 90, n = 6;
  const ang = (i) => (2 * Math.PI / n) * i - Math.PI / 2;
  const pt = (i, rad) => ({ x: cx + rad * Math.cos(ang(i)), y: cy + rad * Math.sin(ang(i)) });
  const dataPath = HEALTH_AXES.map((ax, i) => {
    const v = (scores[ax.id] || 3) / 5;
    const p = pt(i, v * r);
    return `${i === 0 ? "M" : "L"}${p.x},${p.y}`;
  }).join(" ") + " Z";
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
  const gridColors = ["#ece6dd", "#e0d8cc", "#d4cabb", "#c8c0b4", "#bcb2a4"];
  return (
    <div style={{ background: C.surface, borderRadius: 14, padding: 16, marginBottom: 14, border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 12, color: C.gold, fontWeight: 700, marginBottom: 10, textAlign: "center" }}>
        🩺 自分史・一瞬の輝きレーダー (6軸)
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
          <rect width={W} height={H} fill={C.surface} />
          {gridLevels.map((lv, li) => {
            const d = HEALTH_AXES.map((_, i) => {
              const p = pt(i, r * lv);
              return `${i === 0 ? "M" : "L"}${p.x},${p.y}`;
            }).join(" ") + " Z";
            return <path key={li} d={d} fill="none" stroke={gridColors[li]} strokeWidth={1} />;
          })}
          {HEALTH_AXES.map((_, i) => {
            const p = pt(i, r);
            return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={C.border} strokeWidth={1} />;
          })}
          <path d={dataPath} fill="rgba(138,96,48,0.15)" stroke={C.gold} strokeWidth={2} strokeLinejoin="round" />
          {HEALTH_AXES.map((ax, i) => {
            const v = (scores[ax.id] || 3) / 5;
            const p = pt(i, v * r);
            return <circle key={ax.id} cx={p.x} cy={p.y} r={5} fill={C.gold} />;
          })}
          {HEALTH_AXES.map((ax, i) => {
            const lp = pt(i, r + 28);
            return (
              <g key={ax.id}>
                <text x={lp.x} y={lp.y - 7} textAnchor="middle" fontSize={15} dominantBaseline="middle">{ax.icon}</text>
                <text x={lp.x} y={lp.y + 9} textAnchor="middle" fontSize={9} fill={C.textSub} fontFamily="sans-serif">{ax.label}</text>
              </g>
            );
          })}
        </svg>
      </div>
      {onChange && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 8, textAlign: "center" }}>
            ↓ 各軸を1〜5で評価してください
          </div>
          {HEALTH_AXES.map(ax => (
            <div key={ax.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 14, width: 22 }}>{ax.icon}</div>
              <div style={{ fontSize: 11, color: C.text, width: 40, flexShrink: 0, fontWeight: 600 }}>{ax.label}</div>
              <div style={{ display: "flex", gap: 3, flex: 1 }}>
                {[1, 2, 3, 4, 5].map(n => {
                  const sel = (scores[ax.id] || 3) === n;
                  return (
                    <button key={n} onClick={() => { T("tap"); onChange(ax.id, n); }} style={{
                      flex: 1, padding: "6px 0", borderRadius: 6,
                      background: sel ? C.gold : C.surface2,
                      border: `1px solid ${sel ? C.goldDim : C.border}`,
                      color: sel ? "#fff" : C.textMuted,
                      fontSize: 11, fontWeight: 700, cursor: "pointer",
                    }}>{n}</button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ResultPasteBox = ({ value, onChange, onSave, saved, label }) => (
  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: C.textSub, marginBottom: 8 }}>{label || "📥 AIから返ってきた結果を貼り付け"}</div>
    <textarea value={value} onChange={e => onChange(e.target.value)}
      placeholder="ここにAIの回答をコピー&ペーストしてください..."
      rows={5}
      style={{ width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, padding: "10px 12px", fontSize: 12, resize: "vertical", lineHeight: 1.7, fontFamily: "sans-serif", marginBottom: 8 }} />
    <button onClick={onSave} disabled={!value.trim()}
      style={{ width: "100%", padding: "10px 0", background: !value.trim() ? C.surface3 : saved ? C.greenLight : `linear-gradient(135deg,${C.gold},${C.goldDim})`, border: `1px solid ${saved ? C.green : "transparent"}`, borderRadius: 10, color: !value.trim() ? C.textMuted : saved ? C.green : "#fff", fontSize: 12, fontWeight: 700 }}>
      {saved ? "✅ 履歴に保存しました" : "💾 履歴に保存"}
    </button>
  </div>
);

// ============================================================
// Main Component
// ============================================================

export default function App() {
  useEffect(() => {
    document.body.style.background = "#f0ede8";
    document.documentElement.style.background = "#f0ede8";
  }, []);

  const savedProfile = loadProfile();
  const [screen, setScreen] = useState("home"); // home | persona | radar | rally | result | history
  const [tapOn, setTapOn] = useState(true);
  const tapOnRef = useRef(true);
  const toggleTap = () => { const next = !tapOnRef.current; tapOnRef.current = next; setTapOn(next); window._tapOn = next; };

  const [isSpeaking, setIsSpeaking] = useState(false);
  const toggleSpeak = (text) => {
    if (window._speaking) { doStopSpeak(); setIsSpeaking(false); }
    else if (text) { doSpeak(text); setIsSpeaking(true); }
  };

  const [userName, setUserName] = useState(savedProfile?.userName || "");

  // 4階層カテゴリ選択状態
  const [persona, setPersona] = useState({
    domain: [], emotion: [], cognitive: [], time: [],
  });
  const [expDomain, setExpDomain] = useState(null);
  const [expEmotion, setExpEmotion] = useState(null);
  const [expCognitive, setExpCognitive] = useState(null);
  const [expTime, setExpTime] = useState(null);

  // 健康レーダースコア
  const [radarScores, setRadarScores] = useState({ clar: 3, ener: 3, conn: 3, grow: 3, joy: 3, peac: 3 });

  // 10ラリー
  const [rallyIdx, setRallyIdx] = useState(0);
  const [rallyAnswers, setRallyAnswers] = useState(Array(10).fill(""));

  // δ方式: 生成プロンプトと貼り付け結果
  const [analysisPrompt, setAnalysisPrompt] = useState("");
  const [analysisText, setAnalysisText] = useState("");
  const [analysisSaved, setAnalysisSaved] = useState(false);

  const [perspPrompt, setPerspPrompt] = useState("");
  const [deepTheme, setDeepTheme] = useState("");
  const [deepPrompt, setDeepPrompt] = useState("");
  const [summaryPrompt, setSummaryPrompt] = useState("");

  const [history, setHistory] = useState(loadHistory());
  const [selectedHistory, setSelectedHistory] = useState(null);

  // ペルソナ多選択トグル
  const togglePersonaMulti = (key, val) => {
    T("tap");
    setPersona(prev => {
      const c = prev[key] || [];
      return { ...prev, [key]: c.includes(val) ? c.filter(v => v !== val) : [...c, val] };
    });
  };

  const updateRadar = (id, val) => {
    setRadarScores(prev => ({ ...prev, [id]: val }));
  };

  // ラリーが何問でも回答できれば進める。最低1カテゴリは選択を要求。
  const personaReady = ["domain", "emotion", "cognitive", "time"].some(k => (persona[k] || []).length > 0);

  const goToRadar = () => {
    T("next");
    setScreen("radar");
  };

  const goToRally = () => {
    T("next");
    setRallyIdx(0);
    setScreen("rally");
  };

  const rallyNext = () => {
    T("next");
    if (rallyIdx < RALLY_QUESTIONS.length - 1) setRallyIdx(rallyIdx + 1);
    else generatePromptAndShow();
  };
  const rallyPrev = () => { T("tap"); if (rallyIdx > 0) setRallyIdx(rallyIdx - 1); };
  const rallySkip = () => {
    T("tap");
    setRallyAnswers(prev => { const a = [...prev]; a[rallyIdx] = ""; return a; });
    rallyNext();
  };
  const rallySetAns = (val) => {
    setRallyAnswers(prev => { const a = [...prev]; a[rallyIdx] = val; return a; });
  };

  const generatePromptAndShow = () => {
    const p = buildAnalysisPrompt(userName, persona, rallyAnswers, radarScores);
    setAnalysisPrompt(p);
    setScreen("result");
    T("success");
    saveProfile({ userName });
  };

  const saveAnalysisToHistory = () => {
    if (!analysisText.trim()) return;
    const rec = {
      id: Date.now(),
      date: new Date().toLocaleDateString("ja-JP"),
      time: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
      userName: userName || "匿名",
      preview: analysisText.slice(0, 60),
      analysis: analysisText,
      persona,
      rallyAnswers,
      radarScores,
    };
    const newH = [rec, ...history].slice(0, 50);
    setHistory(newH); saveHistory(newH);
    setAnalysisSaved(true); T("success");
    setTimeout(() => setAnalysisSaved(false), 2500);
  };

  const loadFromHistory = (rec) => {
    T("tap");
    setUserName(rec.userName === "匿名" ? "" : (rec.userName || ""));
    setPersona(rec.persona || { domain: [], emotion: [], cognitive: [], time: [] });
    setRallyAnswers(rec.rallyAnswers || Array(10).fill(""));
    setRadarScores(rec.radarScores || { clar: 3, ener: 3, conn: 3, grow: 3, joy: 3, peac: 3 });
    setAnalysisText(rec.analysis || "");
    setAnalysisPrompt(buildAnalysisPrompt(
      rec.userName === "匿名" ? "" : (rec.userName || ""),
      rec.persona || { domain: [], emotion: [], cognitive: [], time: [] },
      rec.rallyAnswers || Array(10).fill(""),
      rec.radarScores || { clar: 3, ener: 3, conn: 3, grow: 3, joy: 3, peac: 3 }
    ));
    setSelectedHistory(null);
    setScreen("result");
    T("success");
  };

  const deleteHistory = (id) => {
    T("tap");
    const newH = history.filter(h => h.id !== id);
    setHistory(newH); saveHistory(newH);
  };

  const generatePerspective = () => {
    T("tap");
    if (!analysisText.trim()) {
      alert("先に上のテキストエリアにAIの分析結果を貼り付けてください");
      return;
    }
    setPerspPrompt(buildPerspectivePrompt(userName, analysisText));
  };

  const generateDeepDive = () => {
    T("tap");
    if (!analysisText.trim()) {
      alert("先に上のテキストエリアにAIの分析結果を貼り付けてください");
      return;
    }
    if (!deepTheme.trim()) {
      alert("深掘りしたいテーマを入力してください");
      return;
    }
    setDeepPrompt(buildDeepDivePrompt(userName, analysisText, deepTheme));
  };

  const generateHistorySummary = () => {
    T("tap");
    setSummaryPrompt(buildHistorySummaryPrompt(history));
  };

  const resetAll = () => {
    T("tap");
    setScreen("home");
    setPersona({ domain: [], emotion: [], cognitive: [], time: [] });
    setExpDomain(null); setExpEmotion(null); setExpCognitive(null); setExpTime(null);
    setRadarScores({ clar: 3, ener: 3, conn: 3, grow: 3, joy: 3, peac: 3 });
    setRallyIdx(0); setRallyAnswers(Array(10).fill(""));
    setAnalysisPrompt(""); setAnalysisText(""); setAnalysisSaved(false);
    setPerspPrompt(""); setDeepTheme(""); setDeepPrompt("");
    setSummaryPrompt(""); setSelectedHistory(null);
  };

  const goHome = () => { T("tap"); setScreen("home"); };

  const currentRally = RALLY_QUESTIONS[rallyIdx] || RALLY_QUESTIONS[0];
  const rallyAns = rallyAnswers[rallyIdx] || "";
  const rallyProgress = ((rallyIdx + 1) / RALLY_QUESTIONS.length) * 100;
  const rallyAnsweredCount = rallyAnswers.filter(a => a && a.trim()).length;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "sans-serif", maxWidth: 520, margin: "0 auto", display: "flex", flexDirection: "column" }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}body,html{background:#f0ede8!important}@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#ddd}textarea:focus,input:focus{border-color:${C.borderActive}!important;outline:none}button{font-family:inherit;cursor:pointer}`}</style>

      {/* Header */}
      <div style={{ padding: "12px 16px 0", borderBottom: `1px solid ${C.border}`, background: C.surface, boxShadow: "0 1px 6px rgba(0,0,0,0.06)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg,${C.gold},${C.goldDim})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🪞</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.goldDim }}>自分史・一瞬の輝き</div>
            <div style={{ fontSize: 9, color: C.textMuted }}>4階層カテゴリ × 10ラリー × 6軸レーダー</div>
          </div>
          <button onClick={toggleTap} style={{ padding: "4px 7px", background: tapOn ? C.goldBg : C.surface2, border: `1px solid ${tapOn ? C.borderActive : C.border}`, borderRadius: 7, fontSize: 10, color: tapOn ? C.gold : C.textMuted, fontWeight: 600 }}>{tapOn ? "🔔音ON" : "🔕音OFF"}</button>
          <button onClick={() => toggleSpeak(analysisText)} style={{ padding: "4px 7px", background: isSpeaking ? C.goldBg : C.surface2, border: `1px solid ${isSpeaking ? C.borderActive : C.border}`, borderRadius: 7, fontSize: 10, color: isSpeaking ? C.gold : C.textSub, fontWeight: 600 }}>{isSpeaking ? "⏹停止" : "🔈読上"}</button>
          <button onClick={goHome} style={{ padding: "4px 8px", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 10, color: C.textSub }}>🏠</button>
        </div>
      </div>

      {/* ホーム */}
      {screen === "home" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 18px 40px", animation: "fadeUp 0.4s ease" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🪞</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.gold, marginBottom: 8, lineHeight: 1.5 }}>自分史・一瞬の輝き v2</div>
            <div style={{ fontSize: 13, color: C.textSub, lineHeight: 1.9 }}>「自分史・一瞬の輝き」を<span style={{ color: C.goldDim, fontWeight: 600 }}>4階層カテゴリ・10問ラリー・6軸レーダー</span>で構造化し、自分視点で深掘りする。CBT × 成功循環 × マズロー。</div>
          </div>

          <div style={{ background: C.goldBg, border: `1px solid ${C.borderActive}`, borderRadius: 12, padding: 14, marginBottom: 20, fontSize: 11.5, color: C.gold, lineHeight: 1.7 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>🎁 完全無料・コストゼロ・永久動作</div>
            δ方式：このアプリは「分析プロンプト」を生成します。それを ChatGPT / Claude / Gemini にコピーして使えば、料金もAPI契約も不要。あなた自身のAIが分析してくれます。
          </div>

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, marginBottom: 20 }}>
            {[
              { n: "01", t: "4階層カテゴリで状況を構造化", d: "生活領域 / 感情 / 思考パターン / 時間スコープ" },
              { n: "02", t: "自分史・一瞬の輝きレーダー", d: "睡眠・食欲・集中・気分・対人・興味の6軸を1〜5で評価" },
              { n: "03", t: "10問ラリーで深掘り", d: "全出し→重さ→きっかけ→対処→未来視点まで10問" },
              { n: "04", t: "AI分析プロンプト生成", d: "CBT × 成功循環 × マズローを踏まえた構造化分析" },
            ].map(item => (
              <div key={item.n} style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: C.goldDim, fontWeight: 700, width: 18, flexShrink: 0, marginTop: 2 }}>{item.n}</div>
                <div><div style={{ fontSize: 13, color: C.text, fontWeight: 600, marginBottom: 2 }}>{item.t}</div><div style={{ fontSize: 11, color: C.textSub, lineHeight: 1.6 }}>{item.d}</div></div>
              </div>
            ))}
            <div style={{ fontSize: 11, color: C.textMuted, paddingTop: 10, borderTop: `1px solid ${C.border}`, marginTop: 4 }}>所要時間：約15〜20分</div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: C.textSub, marginBottom: 6 }}>お名前（任意）</div>
            <input value={userName} onChange={e => setUserName(e.target.value)} placeholder="例：田中"
              style={{ width: "100%", background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 10, color: C.text, padding: "10px 14px", fontSize: 14 }} />
          </div>

          <button onClick={() => { T("tap"); setScreen("persona"); }} style={{ width: "100%", padding: "14px 0", background: `linear-gradient(135deg,${C.gold},${C.goldDim})`, border: "none", borderRadius: 14, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 16px rgba(138,96,48,0.3)` }}>
            ▶ セッションを始める
          </button>

          {history.length > 0 && (
            <button onClick={() => { T("tap"); setScreen("history"); }} style={{ marginTop: 14, width: "100%", padding: "12px 0", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12, color: C.textSub, fontSize: 13, fontWeight: 600 }}>
              📚 過去の記録を見る（{history.length}件）
            </button>
          )}
        </div>
      )}

      {/* ペルソナ設定 - 4階層カテゴリ */}
      {screen === "persona" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 32px" }}>
          <div style={{ fontSize: 12, color: C.textSub, marginBottom: 16, padding: "10px 14px", background: C.goldLight, borderRadius: 10, border: `1px solid ${C.border}`, lineHeight: 1.8 }}>
            今のあなたの状態を<strong style={{ color: C.goldDim }}>4軸で構造化</strong>します。<br />
            関係する項目を、各カテゴリから複数選択してください。少なくとも1つ選べば次に進めます。
          </div>

          <HierCatPicker
            catObj={DOMAIN_CATS}
            selected={persona.domain}
            multi={true}
            expandedCat={expDomain}
            setExpandedCat={setExpDomain}
            onPick={(o) => togglePersonaMulti("domain", o)}
            label="生活領域（自分史の発生源 7カテゴリ）"
            icon="🏡"
          />

          <HierCatPicker
            catObj={EMOTION_CATS}
            selected={persona.emotion}
            multi={true}
            expandedCat={expEmotion}
            setExpandedCat={setExpEmotion}
            onPick={(o) => togglePersonaMulti("emotion", o)}
            label="感情タイプ（どんな感情か 6カテゴリ）"
            icon="💭"
          />

          <HierCatPicker
            catObj={COGNITIVE_CATS}
            selected={persona.cognitive}
            multi={true}
            expandedCat={expCognitive}
            setExpandedCat={setExpCognitive}
            onPick={(o) => togglePersonaMulti("cognitive", o)}
            label="思考パターン（認知の歪み 6カテゴリ）"
            icon="🧠"
          />

          <HierCatPicker
            catObj={TIME_CATS}
            selected={persona.time}
            multi={true}
            expandedCat={expTime}
            setExpandedCat={setExpTime}
            onPick={(o) => togglePersonaMulti("time", o)}
            label="時間スコープ（いつから／いつまで 4カテゴリ）"
            icon="🕰"
          />

          <button onClick={personaReady ? goToRadar : null} disabled={!personaReady}
            style={{
              width: "100%", padding: "14px 0",
              background: personaReady ? `linear-gradient(135deg,${C.gold},${C.goldDim})` : C.surface3,
              border: "none", borderRadius: 14,
              color: personaReady ? "#fff" : C.textMuted,
              fontSize: 15, fontWeight: 700,
              cursor: personaReady ? "pointer" : "not-allowed",
              marginBottom: 10,
            }}>
            {personaReady ? "▶ 自分史・一瞬の輝きレーダーへ" : "まずは1項目以上選択"}
          </button>

          <button onClick={goHome} style={{ width: "100%", padding: "10px 0", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, color: C.textSub, fontSize: 12 }}>
            ← ホームへ戻る
          </button>
        </div>
      )}

      {/* 健康レーダー */}
      {screen === "radar" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 32px" }}>
          <div style={{ fontSize: 12, color: C.textSub, marginBottom: 16, padding: "10px 14px", background: C.goldLight, borderRadius: 10, border: `1px solid ${C.border}`, lineHeight: 1.8 }}>
            今のメンタル健康を<strong style={{ color: C.goldDim }}>6軸で評価</strong>してください。<br />
            1=とても悪い・5=とても良い。直感でOKです。最も低い軸が「優先デトックス対象」になります。
          </div>

          <HealthRadar scores={radarScores} onChange={updateRadar} />

          <button onClick={goToRally}
            style={{
              width: "100%", padding: "14px 0",
              background: `linear-gradient(135deg,${C.gold},${C.goldDim})`,
              border: "none", borderRadius: 14, color: "#fff",
              fontSize: 15, fontWeight: 700, cursor: "pointer",
              marginBottom: 10,
            }}>
            ▶ 10問ラリーへ進む
          </button>

          <button onClick={() => { T("tap"); setScreen("persona"); }} style={{ width: "100%", padding: "10px 0", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, color: C.textSub, fontSize: 12 }}>
            ← ペルソナ設定に戻る
          </button>
        </div>
      )}

      {/* 10ラリー */}
      {screen === "rally" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 32px" }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.goldDim }}>
                Q{currentRally.step} / {RALLY_QUESTIONS.length}
              </div>
              <div style={{ fontSize: 11, color: C.textMuted }}>
                回答済み: {rallyAnsweredCount} / {RALLY_QUESTIONS.length}
              </div>
            </div>
            <div style={{ height: 6, background: C.surface2, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${rallyProgress}%`, background: `linear-gradient(90deg,${C.gold},${C.goldDim})`, borderRadius: 3, transition: "width 0.25s ease" }} />
            </div>
          </div>

          <div style={{ background: C.surface, border: `1.5px solid ${C.borderActive}`, borderRadius: 14, padding: 18, marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: C.gold, fontWeight: 700, marginBottom: 8 }}>
              💬 ラリー {currentRally.step}/10 ({currentRally.id})
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, lineHeight: 1.6, marginBottom: 12 }}>
              {currentRally.q}
            </div>
            <textarea value={rallyAns} onChange={(e) => rallySetAns(e.target.value)}
              placeholder={currentRally.placeholder} rows={4}
              style={{ width: "100%", padding: "10px 14px", background: C.surface2, border: `1.5px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13, fontFamily: "sans-serif", lineHeight: 1.6, resize: "vertical" }} />
            <div style={{ fontSize: 10, color: C.textMuted, marginTop: 4 }}>
              ※ 回答は任意。スキップ可能です。
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <button onClick={rallyPrev} disabled={rallyIdx === 0} style={{
              flex: 1, padding: "12px 0",
              background: rallyIdx === 0 ? C.surface3 : C.surface2,
              border: `1px solid ${C.border}`, borderRadius: 10,
              color: rallyIdx === 0 ? C.textMuted : C.textSub,
              fontSize: 13, fontWeight: 700,
              cursor: rallyIdx === 0 ? "not-allowed" : "pointer",
            }}>← 前へ</button>
            <button onClick={rallySkip} style={{
              flex: 1, padding: "12px 0",
              background: C.surface2, border: `1px solid ${C.border}`,
              borderRadius: 10, color: C.textSub,
              fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>⏭ スキップ</button>
            <button onClick={rallyNext} style={{
              flex: 1.4, padding: "12px 0",
              background: `linear-gradient(135deg,${C.gold},${C.goldDim})`,
              border: "none", borderRadius: 10, color: "#fff",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>
              {rallyIdx < RALLY_QUESTIONS.length - 1 ? "次へ →" : "🎯 完了→生成"}
            </button>
          </div>

          <div style={{ display: "flex", gap: 4, marginTop: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {RALLY_QUESTIONS.map((rq, i) => {
              const ans = rallyAnswers[i] || "";
              const filled = ans.trim().length > 0;
              const current = i === rallyIdx;
              return (
                <button key={rq.id} onClick={() => { T("tap"); setRallyIdx(i); }}
                  style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: current ? C.gold : (filled ? C.greenLight : C.surface2),
                    border: `1.5px solid ${current ? C.goldDim : (filled ? C.green : C.border)}`,
                    color: current ? "#fff" : (filled ? C.green : C.textMuted),
                    fontSize: 10, fontWeight: 700, cursor: "pointer",
                  }}
                  title={`Q${rq.step}: ${rq.q}`}>
                  {rq.step}
                </button>
              );
            })}
          </div>

          <button onClick={() => { T("tap"); setScreen("radar"); }} style={{ marginTop: 16, width: "100%", padding: "10px 0", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, color: C.textSub, fontSize: 11, fontWeight: 600 }}>
            ← レーダーに戻る
          </button>
        </div>
      )}

      {/* 結果 */}
      {screen === "result" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 32px" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.goldDim, marginBottom: 12 }}>📋 自分史・一瞬の輝き分析</div>

          <HealthRadar scores={radarScores} />

          <PromptCard title="📋 メイン分析プロンプト (CBT × 成功循環 × マズロー)" prompt={analysisPrompt} />

          <ResultPasteBox value={analysisText} onChange={setAnalysisText} onSave={saveAnalysisToHistory} saved={analysisSaved} />

          <div style={{ marginBottom: 14 }}>
            <button onClick={generatePerspective} style={{ width: "100%", padding: "11px 0", background: `linear-gradient(135deg,${C.blue},#0a3a5a)`, border: "none", borderRadius: 11, color: "#fff", fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
              👥 他者視点プロンプトを生成（親友・家族・1年後の自分）
            </button>
            {perspPrompt && <PromptCard title="👥 他者視点プロンプト" prompt={perspPrompt} />}
          </div>

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textSub, marginBottom: 8 }}>🔍 特定テーマで深掘り</div>
            <input value={deepTheme} onChange={e => setDeepTheme(e.target.value)} placeholder="例：仕事に持っていかない方法 / 人間関係の整理 / 自己否定との向き合い方..."
              style={{ width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, padding: "9px 12px", fontSize: 12, marginBottom: 8 }} />
            <button onClick={generateDeepDive}
              style={{ width: "100%", padding: "10px 0", background: deepTheme.trim() ? `linear-gradient(135deg,${C.gold},${C.goldDim})` : C.surface3, border: "none", borderRadius: 10, color: deepTheme.trim() ? "#fff" : C.textMuted, fontSize: 12, fontWeight: 700 }}>
              🔍 深掘りプロンプトを生成
            </button>
          </div>
          {deepPrompt && <PromptCard title="🔍 深掘りプロンプト" prompt={deepPrompt} />}

          <button onClick={() => { T("tap"); setScreen("rally"); }} style={{ width: "100%", padding: "12px 0", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12, color: C.textSub, fontSize: 13, fontWeight: 700, marginBottom: 8, cursor: "pointer" }}>
            🔄 ラリー回答を見直す
          </button>

          <button onClick={resetAll} style={{ width: "100%", padding: "12px 0", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, color: C.textSub, fontSize: 12 }}>
            🏠 ホームへ戻る / 別の人で始める
          </button>
        </div>
      )}

      {/* 履歴一覧 */}
      {screen === "history" && !selectedHistory && (
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 18px 40px" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.gold, marginBottom: 16 }}>📊 セッション履歴</div>
          {history.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: C.textMuted, fontSize: 13 }}>まだ履歴がありません</div>
          ) : (
            <>
              {history.length >= 2 && (
                <div style={{ marginBottom: 14 }}>
                  <button onClick={generateHistorySummary} style={{ width: "100%", padding: "10px 0", marginBottom: 8, background: C.goldBg, border: `1px solid ${C.borderActive}`, borderRadius: 10, color: C.gold, fontSize: 12, fontWeight: 600 }}>
                    🧠 過去{history.length}回分の傾向サマリプロンプトを生成
                  </button>
                  {summaryPrompt && <PromptCard title="🧠 履歴サマリプロンプト" prompt={summaryPrompt} />}
                </div>
              )}
              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8 }}>👆 タップすると詳細を確認できます</div>
              {history.map((h) => (
                <div key={h.id || h.date} onClick={() => setSelectedHistory(h)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 10, cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ fontSize: 12, color: C.gold, fontWeight: 600 }}>{h.userName}</div>
                    <div style={{ fontSize: 11, color: C.textMuted }}>{h.date} {h.time || ""} ›</div>
                  </div>
                  <div style={{ fontSize: 11, color: C.textSub, lineHeight: 1.6 }}>{h.preview}...</div>
                </div>
              ))}
              <button onClick={() => { if (window.confirm("履歴を全削除しますか？")) { setHistory([]); saveHistory([]); } }} style={{ width: "100%", padding: "10px 0", marginTop: 4, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 10, color: C.textMuted, fontSize: 11 }}>🗑 履歴を全削除</button>
            </>
          )}
          <button onClick={goHome} style={{ width: "100%", padding: "12px 0", marginTop: 12, background: `linear-gradient(135deg,${C.gold},${C.goldDim})`, border: "none", borderRadius: 12, color: "#fff", fontSize: 13, fontWeight: 700 }}>🏠 ホームへ</button>
        </div>
      )}

      {/* 履歴詳細 */}
      {screen === "history" && selectedHistory && (
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 18px 40px" }}>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 12 }}>{selectedHistory.date} {selectedHistory.time || ""} のセッション ({selectedHistory.userName})</div>
          {selectedHistory.radarScores && <HealthRadar scores={selectedHistory.radarScores} />}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: C.textSub, fontWeight: 600, marginBottom: 10 }}>AI分析結果</div>
            <div style={{ fontSize: 12, color: C.text, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{selectedHistory.analysis}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => loadFromHistory(selectedHistory)} style={{ flex: 1, padding: "12px 0", background: C.gold, border: "none", borderRadius: 12, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              🔄 呼び出す
            </button>
            <button onClick={() => deleteHistory(selectedHistory.id)} style={{ padding: "12px 18px", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12, color: C.red, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              🗑
            </button>
            <button onClick={() => setSelectedHistory(null)} style={{ flex: 1, padding: "12px 0", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12, color: C.textSub, fontSize: 12, fontWeight: 700 }}>← 一覧へ</button>
          </div>
        </div>
      )}
    </div>
  );
}
