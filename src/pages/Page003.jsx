import React, { useState, useRef, useEffect } from "react";

// ───────────────────────────────────────────────────────────
// 強み言語化パートナー - 旧仕様完全復元版 (#003)
// 機能: 16軸タレントマップ × 4象限レーダー × 才能発掘5問
// δ方式実装: API呼び出しゼロ、プロンプト生成のみ
// ───────────────────────────────────────────────────────────
// 設計の柱:
//  - 16のタレント（思考/実行/人間関係/影響力 各4）を4段階リッカートで自己評価
//  - 4象限レーダーチャートで強み構造を可視化（領域スコア + TOP5）
//  - 才能発掘の5つの深い問い（苦労なく / 子供時代 / 褒められて意外 / 唯一無二 / 市場価値）
//  - δ方式プロンプト生成: 分析 / 他者視点 / 深掘り / 市場ポジショニング / 履歴サマリ
//  - AI結果のペースト保存・履歴復元 (localStorage)
//  - 主要ボタンに音声フィードバック・読上機能
// ───────────────────────────────────────────────────────────

window._tapOn = typeof window._tapOn !== "undefined" ? window._tapOn : true;
window._speaking = false;

function T(type) {
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
    } else if (type === "select") {
      o.frequency.setValueAtTime(740, ctx.currentTime);
      g.gain.setValueAtTime(0.06, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      o.start(); o.stop(ctx.currentTime + 0.05);
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
  red: "#a02018", redLight: "#f0d8d0",
  purple: "#4a1890", purpleLight: "#e0d4f0",
};

// ============================================================
// 16タレント定義 (4領域 × 4タレント)
// ============================================================

const CATEGORIES = {
  thinking:  { label: "思考領域",     icon: "🧠", color: C.blue,  bg: C.blueLight,  desc: "考え抜く力 — 戦略・設計・学習・内省" },
  exec:      { label: "実行領域",     icon: "⚙️", color: C.gold,  bg: C.goldLight,  desc: "やり切る力 — 達成・規律・責任・完遂" },
  relation:  { label: "人間関係領域", icon: "🤝", color: C.green, bg: C.greenLight, desc: "繋ぐ力 — 共感・受容・親密・調整" },
  influence: { label: "影響力領域",   icon: "🦁", color: C.red,   bg: C.redLight,   desc: "動かす力 — 確信・指令・社交・競争" },
};

const TALENTS = [
  { id: "strategy",       cat: "thinking",  icon: "♟", label: "戦略立案",  desc: "選択肢を見極め最短ルートを描く",   check: "複雑な状況を見ると自然に道筋が頭に浮かぶ" },
  { id: "future",         cat: "thinking",  icon: "🔮", label: "未来設計",  desc: "まだ見えない可能性を構想する",     check: "「もし◯◯になったら」と未来を想像することが好き" },
  { id: "learn",          cat: "thinking",  icon: "📚", label: "学習欲",    desc: "新しい知識・技能を吸収し続ける",   check: "知らないテーマを掘り下げると時間を忘れる" },
  { id: "introspect",     cat: "thinking",  icon: "🪞", label: "内省力",    desc: "自分と他者の本質を深く見つめる",   check: "一人で考える時間が自分の力になっている" },
  { id: "achieve",        cat: "exec",      icon: "🏆", label: "達成欲",    desc: "目標達成への強い駆動力を持つ",     check: "毎日「何かを達成した」感覚がないと落ち着かない" },
  { id: "discipline",     cat: "exec",      icon: "📏", label: "規律性",    desc: "秩序とルーティンで物事を整える",   check: "予定や順序が決まっていると力を発揮できる" },
  { id: "responsibility", cat: "exec",      icon: "🛡", label: "責任感",    desc: "言ったことをやり抜く誠実さがある", check: "引き受けたことは何があっても完了させる" },
  { id: "completion",     cat: "exec",      icon: "✅", label: "完遂力",    desc: "途中で投げ出さず最後まで仕上げる", check: "終わらせていないものが残ると気持ち悪い" },
  { id: "empathy",        cat: "relation",  icon: "💗", label: "共感力",    desc: "相手の感情を察知し言葉にできる",   check: "相手の気分の揺らぎが言葉より先に分かる" },
  { id: "acceptance",     cat: "relation",  icon: "🌿", label: "受容力",    desc: "違いを否定せず肯定できる懐の深さ", check: "意見が違う相手にもまず耳を傾けられる" },
  { id: "intimacy",       cat: "relation",  icon: "🫶", label: "親密性",    desc: "深く長く続く関係を築く",           check: "広く浅くより少数と深く付き合う方が好き" },
  { id: "harmony",        cat: "relation",  icon: "⚖️", label: "調整力",    desc: "対立を解きほぐし合意を作る",       check: "場の空気が固まった時に動かせる役割になりがち" },
  { id: "selfbelief",     cat: "influence", icon: "🦁", label: "自己確信",  desc: "自分の判断軸を持ちブレない",       check: "周りの意見より自分の感覚を信じる方だ" },
  { id: "command",        cat: "influence", icon: "🚩", label: "指令性",    desc: "場を仕切り方向を示せる",           check: "決まらない会議で「じゃあこうしよう」と動かす" },
  { id: "socialize",      cat: "influence", icon: "🎤", label: "社交力",    desc: "初対面でも空気を温められる",       check: "知らない人と話しても緊張せず楽しめる" },
  { id: "compete",        cat: "influence", icon: "🥇", label: "競争心",    desc: "勝負と比較からエネルギーを得る",   check: "ランキングや勝敗が見えると燃えるタイプだ" },
];

const CAT_KEYS = Object.keys(CATEGORIES);

// ============================================================
// 5つの才能発掘の問い
// ============================================================

const QUESTIONS = [
  {
    id: "natural",
    title: "苦労せずできること",
    q: "他の人が「すごい」「なんでそんなに上手いの？」と言ったのに、自分では「これくらい誰でもできる」と思っていたことは何ですか？",
    hint: "苦労なくできることの中に、本当の才能が眠っています。",
    placeholder: "例：人の話を聴くこと / 資料を構造化すること / 細かい違和感に気づくこと..."
  },
  {
    id: "child",
    title: "子供時代の夢中",
    q: "子供の頃、時間を忘れて夢中になっていたことを教えてください。今の仕事や生き方と、見えない糸でつながっていそうですか？",
    hint: "子供の夢中は「動機の原型」です。",
    placeholder: "例：図鑑を眺めて整理すること、誰かを助ける役回り、空想の世界を作ること..."
  },
  {
    id: "praise",
    title: "褒められて意外だった経験",
    q: "「そんな当たり前のことで？」と思ったのに褒められた経験を、できるだけ具体的に書いてください。誰に・何を・どう言われましたか？",
    hint: "「当たり前」と感じる地点こそ、自分には見えない強みです。",
    placeholder: "例：◯◯さんに「△△が早い」と言われたが、自分では普通だと思っていた..."
  },
  {
    id: "irreplaceable",
    title: "自分にしかできなかった瞬間",
    q: "仕事や日常で「これは自分だから動かせた」「他の人には難しかったかもしれない」と感じた瞬間はいつですか？",
    hint: "唯一無二の瞬間にあなたの市場価値が現れます。",
    placeholder: "例：◯◯の場面で、私の××があったから△△ができた..."
  },
  {
    id: "market",
    title: "稼げる強みへの変換",
    q: "ここまでの強みを「仕事・サービス・副業」に変えるとしたら、どんな形がありえそうですか？まだ実現していなくても構いません。",
    hint: "言語化できれば動き出せます。荒削りでOK。",
    placeholder: "例：◯◯のスキルを活かして△△向けに××を提供する..."
  },
];

// ============================================================
// スコア計算
// ============================================================

function calcScores(ratings) {
  const talentScores = {};
  TALENTS.forEach(t => {
    const v = ratings[t.id] || 0;
    talentScores[t.id] = v ? 25 * v : 0;
  });
  const catScores = {};
  CAT_KEYS.forEach(k => {
    const sum = TALENTS.filter(t => t.cat === k).reduce((a, t) => a + (talentScores[t.id] || 0), 0);
    catScores[k] = Math.round(sum / 4);
  });
  const top5 = TALENTS
    .map(t => ({ id: t.id, cat: t.cat, icon: t.icon, label: t.label, desc: t.desc, score: talentScores[t.id] || 0 }))
    .filter(t => t.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  const dominantCat = CAT_KEYS.reduce((m, k) => catScores[k] > (catScores[m] || -1) ? k : m, CAT_KEYS[0]);
  return { talentScores, catScores, top5, dominantCat };
}


// ============================================================
// δ方式プロンプトビルダー (5種類)
// ============================================================

function buildAnalysisPrompt(userName, scores, answers, mode) {
  const top5Block = scores.top5.map((t, i) => (i + 1) + "位: " + t.label + "（" + t.desc + "） / " + CATEGORIES[t.cat].label + " / スコア" + t.score).join("\n");
  const catBlock = CAT_KEYS.map(k => "・" + CATEGORIES[k].label + ": " + scores.catScores[k] + "（" + CATEGORIES[k].desc + "）").join("\n");
  const answerBlock = QUESTIONS.map(q => "【" + q.title + "】\n" + (answers[q.id] || "（未回答）")).join("\n\n");
  const dominantLabel = CATEGORIES[scores.dominantCat] ? CATEGORIES[scores.dominantCat].label : "";
  const modeInstructions = {
    deep:    "1500〜1800字で深く詳しく分析してください。途中で終わらず、全セクションを書き切ること。",
    simple:  "500〜700字で要点だけ簡潔に分析してください。読みやすさ最優先。",
    poetic:  "900〜1100字で詩的・物語的に表現してください。比喩を使い、心に響く言葉で。",
  };
  const userBlock = userName ? "\n━━━ 対象者 ━━━\n" + userName : "";

  return "あなたは「強み言語化の専門家」です。以下のセルフ診断結果と本人の語りから、無意識の才能を「稼げる言葉」に変換してください。\n\n"
    + "━━━ 16タレントマップ TOP5 ━━━\n" + top5Block + "\n\n"
    + "━━━ 4領域スコア ━━━\n" + catBlock + "\n（主領域：" + dominantLabel + "）\n\n"
    + "━━━ 5つの語り ━━━\n" + answerBlock + userBlock + "\n\n"
    + "━━━ 出力フォーマット ━━━\n\n"
    + "### 【あなたの3大強み】\nTOP5の中から本人の語りと最も整合する3つを選び、それぞれに固有名（キャッチーな呼び名）を付けて、3〜4文で深く描写してください。本人の言葉を引用しながら。\n\n"
    + "### 【強みの組み合わせの妙】\n3つの強みが重なった時に生まれる「あなただけの掛け算」を1段落で描いてください。\n\n"
    + "### 【市場価値への変換】\nそれぞれの強みがどんな仕事・ニーズ・場面に変換できるか、具体例を3〜5個挙げてください（職種名・サービス名レベルの具体度で）。\n\n"
    + "### 【あなただけのキャッチフレーズ】\n強みを一言で表現するフレーズを3パターン提案してください（プロフィール文・名刺・SNSプロフィール用に）。\n\n"
    + "### 【今週のアクション】\n最初の一歩として今週できる具体的な実験を1つ提示してください（締切は1週間以内、対象が明確なもの）。\n\n"
    + "━━━ 出力条件 ━━━\n" + modeInstructions[mode]
    + "\n本人の語りの言葉を必ず引用すること。一般論で終わらせず、この人だけの分析にすること。";
}

function buildPerspectivePrompt(userName, analysisText) {
  const subj = userName ? userName + "さん" : "この人";
  return "あなたは「他者視点分析の専門家」です。以下の強み分析を踏まえ、3つの異なる視点から" + subj + "を見たときに何が見えるかを描写してください。\n\n"
    + "### 👫 親友・友人の視点\n" + subj + "をよく知る親友として「強みだなと感じるところ」「もったいないと感じるところ」「一緒にいて感じる心地よさ」を率直に語ってください。愛情ある正直さで。2〜3段落。\n\n"
    + "### ❤️ 大切な家族・パートナーの視点\n身近にいる人(パートナー・親・子など)として「家でだけ見せる強み」「もっとこうしてほしいこと」「あなたの知らないあなたの良さ」を語ってください。2〜3段落。\n\n"
    + "### 🔮 10年後の自分の視点\n10年後の" + subj + "が今を振り返って「あの頃の自分は強みに気づいていなかった…」「今から見れば◯◯が一番大事だった」と語ってください。変わったこと・変わらなかったこと。2〜3段落。\n\n"
    + "各視点は語りかける形式で、鋭く、温かく。合計1000〜1300字。途中で終わらないこと。\n\n"
    + "━━━ 元の強み分析 ━━━\n" + (analysisText || "").slice(0, 1500);
}

function buildDeepDivePrompt(userName, analysisText, theme) {
  const userLine = userName ? "\n対象者：" + userName : "";
  return "あなたは「強み言語化の専門家」です。以下の人物の強み分析を踏まえ、特定のテーマで深掘りした追加分析を行ってください。\n\n"
    + "━━━ 深掘りテーマ ━━━\n" + theme + "\n\n"
    + "━━━ 出力フォーマット ━━━\n"
    + "1) このテーマがその人の強みとどう繋がっているか（3〜4文）\n"
    + "2) このテーマで活かす具体的なやり方を3パターン\n"
    + "3) このテーマで陥りがちな落とし穴を1つ（強みが裏返ると弱みになる構造で）\n"
    + "4) 今日から始められる小さな実験を1つ（24時間以内に着手できるもの）\n\n"
    + "合計700〜900字で。本人の言葉を引用すること。" + userLine + "\n\n"
    + "━━━ 元の強み分析 ━━━\n" + (analysisText || "").slice(0, 1200);
}

function buildPositioningPrompt(userName, scores, analysisText) {
  const top3Labels = scores.top5.slice(0, 3).map(t => t.label).join(" × ");
  const userLine = userName ? "\n対象者：" + userName : "";
  return "あなたは「個人ブランド戦略コンサルタント」です。以下の強み分析を踏まえ、市場における独自ポジショニングを設計してください。\n\n"
    + "━━━ 強み（TOP3）━━━\n" + top3Labels + "\n\n"
    + "━━━ 出力フォーマット ━━━\n\n"
    + "### 【独自ポジション】\n「◯◯ × △△ × ××で、◇◇な人を救う/喜ばせる/伸ばす人」というテンプレで、3案提示してください。\n\n"
    + "### 【ターゲット顧客像】\n最も価値を届けられる相手はどんな人か。職業・状況・悩みを具体的に1段落。\n\n"
    + "### 【提供できる価値】\nそのターゲットに対して、3段階で価値を提示してください：\n- 入口（無料／低価格）：__\n- 中核（メイン商品）：__\n- 高単価（最終ゴール）：__\n\n"
    + "### 【コピー候補】\nキャッチコピー3案（10〜20字以内、覚えやすく刺さるもの）\n\n"
    + "### 【最初の一歩】\n今週できる小さな実験を1つ（顧客の声を1人から取りに行く形で）\n\n"
    + "━━━ 出力条件 ━━━\n合計900〜1200字。具体的な職種名・サービス名で。一般論禁止。" + userLine + "\n\n"
    + "━━━ 元の強み分析 ━━━\n" + (analysisText || "").slice(0, 1500);
}

function buildHistorySummaryPrompt(history) {
  const recent = history.slice(0, 5);
  const block = recent.map((h, i) => "【" + (i + 1) + "回目 " + h.date + "】TOP3: " + ((h.top3 || []).join("/")) + "\n" + ((h.analysis || h.preview || "").slice(0, 400))).join("\n\n---\n\n");
  return "あなたは継続的な自己成長をサポートするコーチです。以下は同じ人の過去" + recent.length + "回分のセッション履歴です。\n\n"
    + "この人の強みの変化・繰り返し現れるパターン・成長の方向性・今後の課題を300〜400字でサマリしてください。\n"
    + "過去から現在への流れが分かるように、時系列を意識して書いてください。最後に「次の3ヶ月で取り組むテーマ」を1つ提案してください。\n\n"
    + "━━━ 履歴 ━━━\n" + block;
}

// ============================================================
// レーダーチャート（4象限 領域スコア）
// ============================================================

function QuadRadarChart(props) {
  const catScores = props.catScores;
  const dominantCat = props.dominantCat;
  const W = 280, H = 280, cx = 140, cy = 140, r = 90, n = 4;
  const ang = (i) => (2 * Math.PI / n) * i - Math.PI / 2;
  const pt = (i, rad) => ({ x: cx + rad * Math.cos(ang(i)), y: cy + rad * Math.sin(ang(i)) });
  const dataPath = CAT_KEYS.map((k, i) => {
    const p = pt(i, ((catScores[k] || 0) / 100) * r);
    return (i === 0 ? "M" : "L") + p.x + "," + p.y;
  }).join(" ") + " Z";
  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const gridColors = ["#ece7df", "#ddd6cb", "#cdc5b6", "#bcb1a0"];

  return (
    <div style={{ background: C.surface, borderRadius: 14, padding: 16, marginBottom: 14, border: "1px solid " + C.border }}>
      <div style={{ fontSize: 12, color: C.gold, fontWeight: 700, marginBottom: 6, textAlign: "center" }}>強み構造マップ（4領域）</div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg width={W} height={H} viewBox={"0 0 " + W + " " + H} style={{ display: "block" }}>
          <rect width={W} height={H} fill={C.surface} />
          {gridLevels.map((lv, li) => {
            const d = Array.from({ length: n }, (_, i) => {
              const p = pt(i, r * lv);
              return (i === 0 ? "M" : "L") + p.x + "," + p.y;
            }).join(" ") + " Z";
            return <path key={li} d={d} fill="none" stroke={gridColors[li]} strokeWidth={1} />;
          })}
          {Array.from({ length: n }, (_, i) => {
            const p = pt(i, r);
            return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={C.border} strokeWidth={1} />;
          })}
          <path d={dataPath} fill="rgba(138,96,48,0.12)" stroke={C.gold} strokeWidth={2.2} strokeLinejoin="round" />
          {CAT_KEYS.map((k, i) => {
            const p = pt(i, ((catScores[k] || 0) / 100) * r);
            return (catScores[k] || 0) > 0
              ? <circle key={k} cx={p.x} cy={p.y} r={5} fill={CATEGORIES[k].color} />
              : null;
          })}
          {CAT_KEYS.map((k, i) => {
            const lp = pt(i, r + 32);
            return (
              <g key={k}>
                <text x={lp.x} y={lp.y - 8} textAnchor="middle" fontSize={17} dominantBaseline="middle">
                  {CATEGORIES[k].icon}
                </text>
                <text x={lp.x} y={lp.y + 9} textAnchor="middle" fontSize={9} fill={dominantCat === k ? C.gold : C.textSub} fontWeight={dominantCat === k ? 700 : 500} fontFamily="sans-serif">
                  {CATEGORIES[k].label.replace("領域", "")}
                </text>
                <text x={lp.x} y={lp.y + 20} textAnchor="middle" fontSize={9} fill={CATEGORIES[k].color} fontWeight={700} fontFamily="sans-serif">
                  {catScores[k] || 0}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ============================================================
// ストレージ
// ============================================================

const HISTORY_KEY = "app03_history_v2";
const PROFILE_KEY = "app03_profile_v1";
function loadHistory() { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch (e) { return []; } }
function saveHistory(h) { try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(-30))); } catch (e) {} }
function loadProfile() { try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || "null"); } catch (e) { return null; } }
function saveProfile(p) { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch (e) {} }

// ============================================================
// UI Components
// ============================================================

function PromptCard(props) {
  const title = props.title;
  const prompt = props.prompt;
  const accent = props.accent || C.borderActive;
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    T("send");
    try { await navigator.clipboard.writeText(prompt); }
    catch (e) {
      const el = document.createElement("textarea");
      el.value = prompt;
      el.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(el); el.select();
      document.execCommand("copy"); document.body.removeChild(el);
    }
    setCopied(true); T("success");
    setTimeout(() => setCopied(false), 2500);
  };
  return (
    <div style={{ background: C.surface, border: "1.5px solid " + accent, borderRadius: 14, padding: 16, marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: accent }}>{title}</div>
        <button onClick={copy} style={{ padding: "7px 14px", background: copied ? C.greenLight : accent, border: "1px solid " + (copied ? C.green : accent), borderRadius: 8, color: copied ? C.green : "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
          {copied ? "✅ コピー済" : "📋 コピー"}
        </button>
      </div>
      <div style={{ background: C.surface2, border: "1px solid " + C.border, borderRadius: 10, padding: 12, fontSize: 11.5, lineHeight: 1.85, color: C.text, whiteSpace: "pre-wrap", maxHeight: 320, overflowY: "auto", fontFamily: "monospace" }}>
        {prompt}
      </div>
      <div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 8, lineHeight: 1.6 }}>
        ☝️ コピーして ChatGPT / Claude / Gemini に貼り付けてください。
      </div>
    </div>
  );
}

function ScaleSelector(props) {
  const value = props.value;
  const onChange = props.onChange;
  const color = props.color;
  const labels = ["全く違う", "やや違う", "やや当てはまる", "とても当てはまる"];
  return (
    <div style={{ display: "flex", gap: 5 }}>
      {[1, 2, 3, 4].map(n => {
        const sel = value === n;
        return (
          <button
            key={n}
            onClick={(e) => { e.stopPropagation(); T("select"); onChange(n); }}
            title={labels[n - 1]}
            style={{
              flex: 1,
              padding: "8px 0",
              background: sel ? color : C.surface2,
              border: "1px solid " + (sel ? color : C.border),
              borderRadius: 8,
              color: sel ? "#fff" : C.textSub,
              fontSize: 11,
              fontWeight: sel ? 700 : 500,
              cursor: "pointer",
              transition: "all 0.12s"
            }}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

function ResultPasteBox(props) {
  const value = props.value;
  const onChange = props.onChange;
  const onSave = props.onSave;
  const saved = props.saved;
  const disabled = !value.trim();
  return (
    <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 12, padding: 14, marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.textSub, marginBottom: 8 }}>📥 AIから返ってきた結果を貼り付け</div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="ここにAIの回答をコピー&ペーストしてください..."
        rows={5}
        style={{ width: "100%", background: C.surface2, border: "1px solid " + C.border, borderRadius: 10, color: C.text, padding: "10px 12px", fontSize: 12, resize: "vertical", lineHeight: 1.7, fontFamily: "sans-serif", marginBottom: 8 }}
      />
      <button
        onClick={onSave}
        disabled={disabled}
        style={{ width: "100%", padding: "10px 0", background: disabled ? C.surface3 : saved ? C.greenLight : "linear-gradient(135deg," + C.gold + "," + C.goldDim + ")", border: "1px solid " + (saved ? C.green : "transparent"), borderRadius: 10, color: disabled ? C.textMuted : saved ? C.green : "#fff", fontSize: 12, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer" }}
      >
        {saved ? "✅ 履歴に保存しました" : "💾 履歴に保存"}
      </button>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function App() {
  useEffect(() => {
    document.body.style.background = "#f0ede8";
    document.documentElement.style.background = "#f0ede8";
  }, []);

  const savedProfile = loadProfile();

  const [tapOn, setTapOn] = useState(true);
  const tapOnRef = useRef(true);
  const toggleTap = () => { const next = !tapOnRef.current; tapOnRef.current = next; setTapOn(next); window._tapOn = next; };

  const [isSpeaking, setIsSpeaking] = useState(false);
  const toggleSpeak = (text) => {
    if (window._speaking) { doStopSpeak(); setIsSpeaking(false); }
    else if (text) { doSpeak(text); setIsSpeaking(true); }
  };

  const [screen, setScreen] = useState("home");
  const [userName, setUserName] = useState((savedProfile && savedProfile.userName) || "");

  const [ratings, setRatings] = useState({});
  const [activeCatTab, setActiveCatTab] = useState("thinking");

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [curAns, setCurAns] = useState("");

  const [mode, setMode] = useState("deep");
  const [analysisPrompt, setAnalysisPrompt] = useState("");
  const [analysisText, setAnalysisText] = useState("");
  const [analysisSaved, setAnalysisSaved] = useState(false);

  const [perspPrompt, setPerspPrompt] = useState("");
  const [posPrompt, setPosPrompt] = useState("");
  const [deepTheme, setDeepTheme] = useState("");
  const [deepPrompt, setDeepPrompt] = useState("");

  const [history, setHistory] = useState(loadHistory());
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [summaryPrompt, setSummaryPrompt] = useState("");

  const currentQ = QUESTIONS[step];
  const ratedCount = Object.values(ratings).filter(v => v > 0).length;
  const allRated = ratedCount === TALENTS.length;
  const scores = allRated ? calcScores(ratings) : null;

  const progress = screen === "home" ? 0
    : screen === "rating" ? 1
    : screen === "questions" ? 2
    : screen === "result" ? 3 : 0;

  const setRating = (talentId, n) => {
    setRatings(prev => Object.assign({}, prev, { [talentId]: n }));
  };

  const goRatingNext = () => {
    if (!allRated) return;
    T("tap");
    saveProfile({ userName });
    setScreen("questions");
    T("success");
  };

  const submitAnswer = () => {
    T("tap");
    if (!curAns.trim()) return;
    const newAnswers = Object.assign({}, answers, { [currentQ.id]: curAns });
    setAnswers(newAnswers);
    setCurAns("");
    if (step < QUESTIONS.length - 1) setStep(s => s + 1);
    else { generatePromptAndShow(newAnswers); }
  };

  const generatePromptAndShow = (finalAnswers) => {
    const sc = calcScores(ratings);
    const p = buildAnalysisPrompt(userName, sc, finalAnswers, mode);
    setAnalysisPrompt(p);
    setScreen("result");
    T("success");
  };

  const regeneratePromptWithMode = (newMode) => {
    setMode(newMode);
    const sc = calcScores(ratings);
    setAnalysisPrompt(buildAnalysisPrompt(userName, sc, answers, newMode));
    T("tap");
  };

  const saveAnalysisToHistory = () => {
    if (!analysisText.trim()) return;
    const sc = calcScores(ratings);
    const rec = {
      id: Date.now(),
      date: new Date().toLocaleDateString("ja-JP"),
      time: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
      userName: userName || "匿名",
      preview: analysisText.slice(0, 80),
      analysis: analysisText,
      mode: mode,
      ratings: ratings,
      answers: answers,
      top3: sc.top5.slice(0, 3).map(t => t.label),
      catScores: sc.catScores,
      dominantCat: sc.dominantCat,
    };
    const newH = [rec].concat(history).slice(0, 30);
    setHistory(newH); saveHistory(newH);
    setAnalysisSaved(true); T("success");
    setTimeout(() => setAnalysisSaved(false), 2500);
  };

  const generatePerspective = () => {
    T("tap");
    if (!analysisText.trim()) {
      alert("先に上のテキストエリアにAIの分析結果を貼り付けてください");
      return;
    }
    setPerspPrompt(buildPerspectivePrompt(userName, analysisText));
  };

  const generatePositioning = () => {
    T("tap");
    if (!analysisText.trim()) {
      alert("先に上のテキストエリアにAIの分析結果を貼り付けてください");
      return;
    }
    const sc = calcScores(ratings);
    setPosPrompt(buildPositioningPrompt(userName, sc, analysisText));
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

  const loadFromHistory = (rec) => {
    T("tap");
    setUserName(rec.userName === "匿名" ? "" : (rec.userName || ""));
    setRatings(rec.ratings || {});
    setAnswers(rec.answers || {});
    setAnalysisText(rec.analysis || "");
    if (rec.ratings && Object.keys(rec.ratings).length === TALENTS.length) {
      const sc = calcScores(rec.ratings);
      setAnalysisPrompt(buildAnalysisPrompt(rec.userName, sc, rec.answers || {}, rec.mode || "deep"));
      setMode(rec.mode || "deep");
    }
    setSelectedHistory(null);
    setScreen("result");
    T("success");
  };

  const deleteHistoryItem = (id) => {
    if (!confirm("この履歴を削除しますか？")) return;
    T("tap");
    const newH = history.filter(h => h.id !== id);
    setHistory(newH);
    saveHistory(newH);
    if (selectedHistory && selectedHistory.id === id) setSelectedHistory(null);
  };

  const resetAll = () => {
    setScreen("home"); setStep(0);
    setRatings({}); setAnswers({}); setCurAns("");
    setAnalysisPrompt(""); setAnalysisText(""); setAnalysisSaved(false);
    setPerspPrompt(""); setPosPrompt(""); setDeepTheme(""); setDeepPrompt("");
    setSummaryPrompt(""); setSelectedHistory(null);
    setMode("deep");
  };

  const goldGrad = "linear-gradient(135deg," + C.gold + "," + C.goldDim + ")";

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "sans-serif", maxWidth: 520, margin: "0 auto", display: "flex", flexDirection: "column" }}>
      <style>{"*{box-sizing:border-box;margin:0;padding:0}body,html{background:#f0ede8!important}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#c8c0b4}textarea:focus,input:focus{outline:none;border-color:" + C.borderActive + "!important}button{font-family:inherit;cursor:pointer}"}</style>

      {/* ヘッダー */}
      <div style={{ padding: "14px 16px 0", borderBottom: "1px solid " + C.border, background: C.surface, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: goldGrad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, flexShrink: 0 }}>💪</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.gold }}>強み言語化パートナー</div>
            <div style={{ fontSize: 9, color: C.textMuted }}>16タレントマップ × 才能発掘5問</div>
          </div>
          <button onClick={toggleTap} style={{ padding: "4px 8px", background: tapOn ? C.goldBg : C.surface2, border: "1px solid " + (tapOn ? C.borderActive : C.border), borderRadius: 7, fontSize: 10, color: tapOn ? C.gold : C.textMuted, fontWeight: 600 }}>
            {tapOn ? "🔔音ON" : "🔕音OFF"}
          </button>
          <button onClick={() => toggleSpeak(analysisText)} style={{ padding: "4px 7px", background: isSpeaking ? C.goldBg : C.surface2, border: "1px solid " + (isSpeaking ? C.borderActive : C.border), borderRadius: 7, fontSize: 10, color: isSpeaking ? C.gold : C.textSub, fontWeight: 600 }}>
            {isSpeaking ? "⏹停止" : "🔈読上"}
          </button>
          <button onClick={() => { setSelectedHistory(null); setScreen(screen === "history" ? "home" : "history"); }} style={{ padding: "5px 10px", background: C.surface2, border: "1px solid " + C.border, borderRadius: 8, fontSize: 10, color: C.textSub }}>📊 履歴</button>
        </div>
        {(screen === "rating" || screen === "questions" || screen === "result") && (
          <div style={{ display: "flex", gap: 4, paddingBottom: 10 }}>
            {["強みセルフ診断", "才能発掘の問い", "強み分析"].map((lbl, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ height: 2, borderRadius: 1, background: progress > i ? C.gold : C.border, marginBottom: 3, transition: "background 0.4s" }} />
                <div style={{ fontSize: 9, color: progress > i ? C.gold : C.textMuted }}>{lbl}</div>
              </div>
            ))}
          </div>
        )}
        {!(screen === "rating" || screen === "questions" || screen === "result") && <div style={{ height: 10 }} />}
      </div>

      {/* ホーム */}
      {screen === "home" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "26px 18px 40px", animation: "fadeUp 0.4s ease" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 46, marginBottom: 10 }}>💪</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.gold, marginBottom: 10, lineHeight: 1.5 }}>強み言語化パートナー</div>
            <div style={{ fontSize: 13, color: C.textSub, lineHeight: 1.9 }}>
              「苦労せずできるのに、他の人が苦労していること」<br />
              の中に、あなたの<span style={{ color: C.goldDim, fontWeight: 600 }}>稼げる強み</span>が眠っています。
            </div>
          </div>

          <div style={{ background: C.goldBg, border: "1px solid " + C.borderActive, borderRadius: 12, padding: 14, marginBottom: 18, fontSize: 11.5, color: C.gold, lineHeight: 1.75 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>🎁 完全無料・コストゼロ・永久動作</div>
            このアプリは「分析プロンプト」を生成します。それを ChatGPT / Claude / Gemini にコピーして使えば、料金もAPI契約も不要。あなた自身のAIが分析してくれます。
          </div>

          <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 14, padding: 16, marginBottom: 18 }}>
            {[
              { n: "01", t: "16タレントを4段階で自己採点", d: "思考・実行・人間関係・影響力 各4軸 = 計16タレント" },
              { n: "02", t: "才能発掘の5つの深い問い", d: "苦労なく / 子供時代 / 褒められて意外 / 唯一無二 / 市場価値" },
              { n: "03", t: "AI分析プロンプトと4象限レーダー", d: "強み構造の可視化 + 5種類のプロンプト生成" }
            ].map(item => (
              <div key={item.n} style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: C.goldDim, fontWeight: 700, width: 18, flexShrink: 0, marginTop: 2 }}>{item.n}</div>
                <div>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 600, marginBottom: 2 }}>{item.t}</div>
                  <div style={{ fontSize: 11, color: C.textSub, lineHeight: 1.6 }}>{item.d}</div>
                </div>
              </div>
            ))}
            <div style={{ fontSize: 11, color: C.textMuted, paddingTop: 10, borderTop: "1px solid " + C.border, marginTop: 4 }}>
              所要時間：約20〜25分 ／ 正解はありません
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: C.textSub, marginBottom: 6 }}>お名前（任意）</div>
            <input
              value={userName}
              onChange={e => setUserName(e.target.value)}
              placeholder="例：田中"
              style={{ width: "100%", background: C.surface, border: "1.5px solid " + C.border, borderRadius: 10, color: C.text, padding: "10px 14px", fontSize: 14 }}
            />
          </div>

          <button onClick={() => { T("tap"); setScreen("rating"); }} style={{ width: "100%", padding: "14px 0", background: goldGrad, border: "none", borderRadius: 14, color: "#fff", fontSize: 14, fontWeight: 700 }}>
            セッションを始める →
          </button>

          {history.length > 0 && (
            <button onClick={() => { T("tap"); setScreen("history"); }} style={{ width: "100%", padding: "12px 0", marginTop: 12, background: C.surface2, border: "1px solid " + C.border, borderRadius: 12, color: C.textSub, fontSize: 13, fontWeight: 600 }}>
              📚 過去の記録を見る（{history.length}件）
            </button>
          )}
        </div>
      )}

      {/* 強みセルフ診断 */}
      {screen === "rating" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 40px", animation: "fadeUp 0.4s ease" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.gold, marginBottom: 4 }}>16タレント・セルフ診断</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 14, lineHeight: 1.7 }}>
            それぞれのタレントに対し「自分にどれくらい当てはまるか」を <span style={{ color: C.gold, fontWeight: 600 }}>1〜4</span> で選んでください。
            （1=全く違う、4=とても当てはまる）／ 進捗 {ratedCount} / {TALENTS.length}
          </div>

          <div style={{ display: "flex", gap: 5, marginBottom: 12, overflowX: "auto" }}>
            {CAT_KEYS.map(k => {
              const sel = activeCatTab === k;
              const ratedInCat = TALENTS.filter(t => t.cat === k && (ratings[t.id] || 0) > 0).length;
              return (
                <button key={k} onClick={() => { T("tap"); setActiveCatTab(k); }} style={{
                  flex: 1, minWidth: 80, padding: "8px 6px",
                  background: sel ? CATEGORIES[k].color : C.surface2,
                  border: "1px solid " + (sel ? CATEGORIES[k].color : C.border),
                  borderRadius: 9,
                  color: sel ? "#fff" : C.textSub,
                  fontSize: 10.5, fontWeight: sel ? 700 : 500
                }}>
                  <div style={{ fontSize: 14, marginBottom: 1 }}>{CATEGORIES[k].icon}</div>
                  <div>{CATEGORIES[k].label.replace("領域", "")}</div>
                  <div style={{ fontSize: 9, opacity: 0.85, marginTop: 1 }}>{ratedInCat}/4</div>
                </button>
              );
            })}
          </div>

          <div style={{ background: CATEGORIES[activeCatTab].bg, border: "1px solid " + CATEGORIES[activeCatTab].color, borderRadius: 10, padding: "10px 12px", marginBottom: 14, fontSize: 11, color: CATEGORIES[activeCatTab].color, lineHeight: 1.6 }}>
            <strong>{CATEGORIES[activeCatTab].icon} {CATEGORIES[activeCatTab].label}</strong> ／ {CATEGORIES[activeCatTab].desc}
          </div>

          {TALENTS.filter(t => t.cat === activeCatTab).map(t => {
            const v = ratings[t.id] || 0;
            const rated = v > 0;
            return (
              <div key={t.id} style={{ background: C.surface, border: "1px solid " + (rated ? CATEGORIES[t.cat].color : C.border), borderRadius: 12, padding: "12px 14px", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ fontSize: 22, flexShrink: 0 }}>{t.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: rated ? CATEGORIES[t.cat].color : C.text }}>{t.label}</div>
                    <div style={{ fontSize: 10, color: C.textSub, marginTop: 1 }}>{t.desc}</div>
                  </div>
                </div>
                <div style={{ fontSize: 10.5, color: C.textMuted, marginBottom: 8, lineHeight: 1.55, padding: "6px 8px", background: C.surface2, borderRadius: 7 }}>
                  💭 {t.check}
                </div>
                <ScaleSelector value={v} onChange={(n) => setRating(t.id, n)} color={CATEGORIES[t.cat].color} />
              </div>
            );
          })}

          <div style={{ height: 12 }} />

          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {(() => {
              const idx = CAT_KEYS.indexOf(activeCatTab);
              const prevK = idx > 0 ? CAT_KEYS[idx - 1] : null;
              const nextK = idx < CAT_KEYS.length - 1 ? CAT_KEYS[idx + 1] : null;
              return (
                <>
                  {prevK && (
                    <button onClick={() => { T("tap"); setActiveCatTab(prevK); window.scrollTo(0, 0); }} style={{ flex: 1, padding: "11px 0", background: C.surface, border: "1px solid " + C.border, borderRadius: 11, color: C.textSub, fontSize: 12, fontWeight: 600 }}>
                      ← {CATEGORIES[prevK].label.replace("領域", "")}
                    </button>
                  )}
                  {nextK && (
                    <button onClick={() => { T("tap"); setActiveCatTab(nextK); window.scrollTo(0, 0); }} style={{ flex: 1, padding: "11px 0", background: C.surface, border: "1px solid " + CATEGORIES[nextK].color, borderRadius: 11, color: CATEGORIES[nextK].color, fontSize: 12, fontWeight: 700 }}>
                      {CATEGORIES[nextK].label.replace("領域", "")} →
                    </button>
                  )}
                </>
              );
            })()}
          </div>

          <button onClick={goRatingNext} disabled={!allRated} style={{
            width: "100%", padding: "14px 0",
            background: allRated ? goldGrad : C.surface3,
            border: "none", borderRadius: 14,
            color: allRated ? "#fff" : C.textMuted, fontSize: 14, fontWeight: 700,
            cursor: allRated ? "pointer" : "not-allowed"
          }}>
            {allRated ? "次へ：才能発掘の問い →" : ("あと " + (TALENTS.length - ratedCount) + " 個 採点してください")}
          </button>

          <button onClick={resetAll} style={{ width: "100%", padding: "10px 0", marginTop: 8, background: "transparent", border: "none", color: C.textMuted, fontSize: 12 }}>
            🏠 ホームへ戻る（採点はリセット）
          </button>
        </div>
      )}

      {/* 才能発掘 5つの問い */}
      {screen === "questions" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 40px", animation: "fadeUp 0.4s ease" }}>
          <div style={{ fontSize: 11, color: C.gold, fontWeight: 600, marginBottom: 6 }}>問い {step + 1} / {QUESTIONS.length}</div>
          <div style={{ height: 4, background: C.border, borderRadius: 2, marginBottom: 18 }}>
            <div style={{ height: "100%", width: (((step + 1) / QUESTIONS.length) * 100) + "%", background: "linear-gradient(90deg," + C.gold + "," + C.goldDim + ")", borderRadius: 2, transition: "width 0.5s" }} />
          </div>

          <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 14, padding: 18, marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: C.gold, fontWeight: 700, marginBottom: 8 }}>{currentQ.title}</div>
            <div style={{ fontSize: 14.5, color: C.text, lineHeight: 1.9, marginBottom: 12 }}>{currentQ.q}</div>
            <div style={{ fontSize: 11, color: C.textSub, fontStyle: "italic", padding: "8px 12px", background: C.goldLight, borderRadius: 8, lineHeight: 1.7 }}>💡 {currentQ.hint}</div>
          </div>

          <textarea
            value={curAns}
            onChange={e => setCurAns(e.target.value)}
            placeholder={currentQ.placeholder}
            rows={5}
            style={{ width: "100%", background: C.surface, border: "1.5px solid " + C.border, borderRadius: 12, color: C.text, padding: "12px 14px", fontSize: 13, resize: "vertical", lineHeight: 1.8, fontFamily: "sans-serif", marginBottom: 12 }}
          />

          <button onClick={submitAnswer} disabled={!curAns.trim()} style={{
            width: "100%", padding: "14px 0",
            background: curAns.trim() ? goldGrad : C.surface3,
            border: "none", borderRadius: 14,
            color: curAns.trim() ? "#fff" : C.textMuted, fontSize: 14, fontWeight: 700
          }}>
            {step < QUESTIONS.length - 1 ? "次の問いへ →" : "✨ 強み分析プロンプトを生成"}
          </button>

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {step > 0 && (
              <button onClick={() => { T("tap"); setStep(s => s - 1); setCurAns(answers[QUESTIONS[step - 1].id] || ""); }} style={{ flex: 1, padding: "10px 0", background: "transparent", border: "none", color: C.textMuted, fontSize: 12 }}>
                ← 前へ
              </button>
            )}
            <button onClick={resetAll} style={{ flex: 1, padding: "10px 0", background: "transparent", border: "none", color: C.textMuted, fontSize: 12 }}>
              🏠 ホームへ
            </button>
          </div>
        </div>
      )}

      {/* 結果画面 */}
      {screen === "result" && analysisPrompt && (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 40px", animation: "fadeUp 0.4s ease" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.gold, marginBottom: 4 }}>✨ 強み分析プロンプトが生成されました</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 14 }}>
            下のプロンプトをコピーして、お使いのAI（ChatGPT / Claude / Gemini 等）に貼り付けてください
          </div>

          {scores && <QuadRadarChart catScores={scores.catScores} dominantCat={scores.dominantCat} />}

          {scores && (
            <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 14, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: C.gold, fontWeight: 700, marginBottom: 10 }}>🏅 あなたのタレント TOP5</div>
              {scores.top5.map((t, i) => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i < scores.top5.length - 1 ? 8 : 0 }}>
                  <div style={{ width: 22, height: 22, background: CATEGORIES[t.cat].color, color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ fontSize: 16, flexShrink: 0 }}>{t.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{t.label}</div>
                    <div style={{ fontSize: 10, color: C.textSub }}>{CATEGORIES[t.cat].label} ／ {t.desc}</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: CATEGORIES[t.cat].color, flexShrink: 0 }}>{t.score}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {[{ k: "deep", l: "🌊 深い分析" }, { k: "simple", l: "📝 シンプル" }, { k: "poetic", l: "🎨 詩的" }].map(m => (
              <button key={m.k} onClick={() => regeneratePromptWithMode(m.k)} style={{
                flex: 1, padding: "8px 0",
                background: mode === m.k ? goldGrad : C.surface,
                border: "1px solid " + (mode === m.k ? "transparent" : C.border),
                borderRadius: 9,
                color: mode === m.k ? "#fff" : C.textSub,
                fontSize: 11, fontWeight: mode === m.k ? 700 : 500
              }}>
                {m.l}
              </button>
            ))}
          </div>

          <PromptCard title="📋 メイン強み分析プロンプト" prompt={analysisPrompt} accent={C.borderActive} />

          <ResultPasteBox value={analysisText} onChange={setAnalysisText} onSave={saveAnalysisToHistory} saved={analysisSaved} />

          <div style={{ marginBottom: 14 }}>
            <button onClick={generatePerspective} style={{ width: "100%", padding: "11px 0", background: "linear-gradient(135deg," + C.blue + ",#0a3a5a)", border: "none", borderRadius: 11, color: "#fff", fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
              👥 他者視点プロンプトを生成
            </button>
            {perspPrompt && <PromptCard title="👥 他者視点プロンプト" prompt={perspPrompt} accent={C.blue} />}
          </div>

          <div style={{ marginBottom: 14 }}>
            <button onClick={generatePositioning} style={{ width: "100%", padding: "11px 0", background: "linear-gradient(135deg," + C.green + ",#0a3a1a)", border: "none", borderRadius: 11, color: "#fff", fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
              🎯 市場ポジショニング戦略プロンプトを生成
            </button>
            {posPrompt && <PromptCard title="🎯 ポジショニング戦略プロンプト" prompt={posPrompt} accent={C.green} />}
          </div>

          <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textSub, marginBottom: 8 }}>🔍 特定テーマで深掘り</div>
            <input value={deepTheme} onChange={e => setDeepTheme(e.target.value)} placeholder="例：副業に活かす方法 / 弱みとどう向き合うか..." style={{ width: "100%", background: C.surface2, border: "1px solid " + C.border, borderRadius: 9, color: C.text, padding: "9px 12px", fontSize: 12, marginBottom: 8 }} />
            <button onClick={generateDeepDive} style={{
              width: "100%", padding: "10px 0",
              background: deepTheme.trim() ? "linear-gradient(135deg," + C.purple + ",#2a0860)" : C.surface3,
              border: "none", borderRadius: 10,
              color: deepTheme.trim() ? "#fff" : C.textMuted, fontSize: 12, fontWeight: 700
            }}>
              🔍 深掘りプロンプトを生成
            </button>
          </div>
          {deepPrompt && <PromptCard title="🔍 深掘りプロンプト" prompt={deepPrompt} accent={C.purple} />}

          <button onClick={resetAll} style={{ width: "100%", padding: "12px 0", marginTop: 10, background: C.surface, border: "1px solid " + C.border, borderRadius: 12, color: C.textSub, fontSize: 12 }}>
            🏠 ホームへ戻る ／ 別のセッションを始める
          </button>
        </div>
      )}

      {/* 履歴一覧 */}
      {screen === "history" && !selectedHistory && (
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 16px 40px" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.gold, marginBottom: 14 }}>📚 過去の記録</div>
          {history.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: C.textMuted, fontSize: 13 }}>まだ履歴がありません</div>
          ) : (
            <>
              {history.length >= 2 && (
                <div style={{ marginBottom: 14 }}>
                  <button onClick={generateHistorySummary} style={{ width: "100%", padding: "11px 0", marginBottom: 8, background: C.goldBg, border: "1px solid " + C.borderActive, borderRadius: 10, color: C.gold, fontSize: 12, fontWeight: 600 }}>
                    🧠 過去 {history.length} 回分の傾向サマリプロンプトを生成
                  </button>
                  {summaryPrompt && <PromptCard title="🧠 履歴サマリプロンプト" prompt={summaryPrompt} accent={C.gold} />}
                </div>
              )}

              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8 }}>👆 タップで詳細／🔄 で復元</div>
              {history.map((h) => (
                <div key={h.id || h.date} style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 12, padding: "12px 14px", marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ fontSize: 12, color: C.gold, fontWeight: 700 }}>{h.userName}</div>
                    <div style={{ fontSize: 10, color: C.textMuted }}>{h.date} {h.time || ""}</div>
                  </div>
                  {h.top3 && h.top3.length > 0 && (
                    <div style={{ fontSize: 10.5, color: (CATEGORIES[h.dominantCat] && CATEGORIES[h.dominantCat].color) || C.textSub, marginBottom: 6, fontWeight: 600 }}>
                      🏅 TOP3: {h.top3.join(" / ")}
                      {h.dominantCat && CATEGORIES[h.dominantCat] && (" ／ 主領域: " + CATEGORIES[h.dominantCat].label)}
                    </div>
                  )}
                  <div onClick={() => setSelectedHistory(h)} style={{ fontSize: 11, color: C.textSub, lineHeight: 1.6, cursor: "pointer", marginBottom: 8 }}>
                    {h.preview}...
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => loadFromHistory(h)} style={{ flex: 1, padding: "7px 0", background: C.gold, border: "none", borderRadius: 8, color: "#fff", fontSize: 11, fontWeight: 700 }}>
                      🔄 復元
                    </button>
                    <button onClick={() => setSelectedHistory(h)} style={{ flex: 1, padding: "7px 0", background: C.surface2, border: "1px solid " + C.border, borderRadius: 8, color: C.textSub, fontSize: 11, fontWeight: 600 }}>
                      📖 詳細
                    </button>
                    <button onClick={() => deleteHistoryItem(h.id)} style={{ padding: "7px 12px", background: C.surface2, border: "1px solid " + C.border, borderRadius: 8, color: C.red, fontSize: 11, fontWeight: 700 }}>
                      🗑
                    </button>
                  </div>
                </div>
              ))}

              <button onClick={() => { if (confirm("履歴を全削除しますか？")) { setHistory([]); saveHistory([]); } }} style={{ width: "100%", padding: "10px 0", marginTop: 4, background: "transparent", border: "1px solid " + C.border, borderRadius: 10, color: C.textMuted, fontSize: 11 }}>
                🗑 履歴を全削除
              </button>
            </>
          )}
          <button onClick={resetAll} style={{ width: "100%", padding: "12px 0", marginTop: 12, background: goldGrad, border: "none", borderRadius: 12, color: "#fff", fontSize: 13, fontWeight: 700 }}>
            🏠 ホームへ
          </button>
        </div>
      )}

      {/* 履歴詳細 */}
      {screen === "history" && selectedHistory && (
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 16px 40px" }}>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8 }}>
            {selectedHistory.date} {selectedHistory.time || ""} のセッション ({selectedHistory.userName})
          </div>
          {selectedHistory.top3 && (
            <div style={{ fontSize: 12, color: C.gold, fontWeight: 700, marginBottom: 12 }}>
              🏅 TOP3: {selectedHistory.top3.join(" / ")}
              {selectedHistory.dominantCat && CATEGORIES[selectedHistory.dominantCat] && (
                <span style={{ color: CATEGORIES[selectedHistory.dominantCat].color, marginLeft: 8 }}>
                  ／ 主領域: {CATEGORIES[selectedHistory.dominantCat].label}
                </span>
              )}
            </div>
          )}
          {selectedHistory.catScores && (
            <QuadRadarChart catScores={selectedHistory.catScores} dominantCat={selectedHistory.dominantCat} />
          )}
          <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 12, padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: C.textSub, fontWeight: 700, marginBottom: 10 }}>AI分析結果</div>
            <div style={{ fontSize: 12, color: C.text, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{selectedHistory.analysis}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={async () => {
              const text = "【強み言語化パートナー】" + selectedHistory.date + "\nTOP3: " + ((selectedHistory.top3 || []).join(" / ")) + "\n\n" + selectedHistory.analysis;
              try { await navigator.clipboard.writeText(text); }
              catch (e) {
                const el = document.createElement("textarea");
                el.value = text;
                el.style.cssText = "position:fixed;opacity:0";
                document.body.appendChild(el); el.select();
                document.execCommand("copy"); document.body.removeChild(el);
              }
              T("success");
            }} style={{ flex: 1, padding: "12px 0", background: C.surface, border: "1px solid " + C.border, borderRadius: 12, color: C.textSub, fontSize: 12 }}>
              📋 コピー
            </button>
            <button onClick={() => loadFromHistory(selectedHistory)} style={{ flex: 1, padding: "12px 0", background: goldGrad, border: "none", borderRadius: 12, color: "#fff", fontSize: 12, fontWeight: 700 }}>
              🔄 この内容で復元
            </button>
            <button onClick={() => setSelectedHistory(null)} style={{ flex: 1, padding: "12px 0", background: C.surface2, border: "1px solid " + C.border, borderRadius: 12, color: C.textSub, fontSize: 12 }}>
              ← 一覧へ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
