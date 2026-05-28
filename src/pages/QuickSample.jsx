import React, { useState } from "react";
import { Link } from "react-router-dom";

/**
 * QuickSample.jsx (Phase 2 拡張版 2026-05-28)
 * 無料7問のミニ自己分析。
 * - 6軸 (決断力・洞察力・大義・精神力・適応力・規律心) + 自己理解 を 7問で判定
 * - 結果画面で 軸別スコアの可視化 (横バー) + CTA 強化
 * - シェアボタン (X/LINE) + おすすめアプリ誘導
 */

const C = {
  bg: "#f0ede8",
  surface: "#ffffff",
  gold: "#8a6030",
  goldDim: "#5a3a10",
  goldLight: "#f5e8d0",
  text: "#1a1210",
  textSub: "#3a3028",
  textMuted: "#6a5e50",
};

const QUESTIONS = [
  {
    axis: "決断力",
    icon: "⚔️",
    q: "重大な決断を迫られたとき、あなたは",
    choices: [
      { t: "状況を整理して即決する", s: 3 },
      { t: "選択肢を比較して決める", s: 2 },
      { t: "信頼できる人に相談する", s: 1 },
      { t: "判断を先送りしがち", s: 0 },
    ],
  },
  {
    axis: "洞察力",
    icon: "👁️",
    q: "初対面の人を見るとき、最も気にするのは",
    choices: [
      { t: "言葉にしない素ぶり・気配", s: 3 },
      { t: "話の論理や中身", s: 2 },
      { t: "肩書きや経歴", s: 1 },
      { t: "あまり気にしない", s: 0 },
    ],
  },
  {
    axis: "大義",
    icon: "🏯",
    q: "あなたが行動する一番の動機は",
    choices: [
      { t: "自分や家族を超えた何かのため", s: 3 },
      { t: "自分の信念・矜持のため", s: 2 },
      { t: "実利・成果のため", s: 1 },
      { t: "やる気が出るときだけ", s: 0 },
    ],
  },
  {
    axis: "精神力",
    icon: "🔥",
    q: "理不尽な逆境に直面したとき",
    choices: [
      { t: "黙して耐え、機を待つ", s: 3 },
      { t: "正面から戦う", s: 2 },
      { t: "退いて立て直す", s: 1 },
      { t: "心が折れがち", s: 0 },
    ],
  },
  {
    axis: "適応力",
    icon: "🌊",
    q: "想定外の変化が起きたとき",
    choices: [
      { t: "むしろ機会と捉えて動く", s: 3 },
      { t: "落ち着いて適応していく", s: 2 },
      { t: "戸惑いつつ慣れていく", s: 1 },
      { t: "受け入れるのに時間がかかる", s: 0 },
    ],
  },
  {
    axis: "規律心",
    icon: "🎯",
    q: "決めたことを継続できるか",
    choices: [
      { t: "毎日決まった習慣がある", s: 3 },
      { t: "9割は守れている", s: 2 },
      { t: "ムラはあるが続けている", s: 1 },
      { t: "三日坊主になりがち", s: 0 },
    ],
  },
  {
    axis: "自己理解",
    icon: "🧬",
    q: "自分の強み・弱みについて",
    choices: [
      { t: "他人に言語化して伝えられる", s: 3 },
      { t: "自分では把握している", s: 2 },
      { t: "なんとなくわかる程度", s: 1 },
      { t: "正直よく分からない", s: 0 },
    ],
  },
];

const PROFILES = [
  {
    range: [18, 21],
    name: "達観型",
    icon: "🐉",
    text:
      "六軸の全てに高い完成度を宿す稀有な人。決断・洞察・大義・精神・適応・規律の全てが揃い、すでに『自分を超えた何か』のために生きる準備ができています。200の問いは、あなたが他者を導く時の言語と図譜になる。",
    rec: ["000", "020", "045"],
  },
  {
    range: [14, 17],
    name: "武士型",
    icon: "⚔️",
    text:
      "覚悟と矜持を内に宿す本物の侍。あと一歩、磨き残しの軸を整えれば達観に至る。多くの場合『規律心』か『適応力』が課題。200の問いで穴を埋めると、人格が一段上がります。",
    rec: ["001", "012", "087"],
  },
  {
    range: [10, 13],
    name: "求道型",
    icon: "🏯",
    text:
      "強い軸を持ちながら、磨き残しに気づいている人。最も伸びしろが大きい段階。弱い軸を1つずつ深掘りすれば、3ヶ月で武士型に到達する人が多い。",
    rec: ["005", "032", "099"],
  },
  {
    range: [6, 9],
    name: "彷徨型",
    icon: "🌫️",
    text:
      "葛藤の中で問いを抱えている時期。これは『迷い』ではなく『次の自分への入り口』です。200の問いで弱みを直視し、強みを再発見する旅が必要。",
    rec: ["008", "041", "112"],
  },
  {
    range: [0, 5],
    name: "兆し型",
    icon: "🌱",
    text:
      "まだ自分を知ることが始まったばかり。逆に、ここから6軸すべてを少しずつ整えていけば、半年後には別人になれる伸びしろがある。",
    rec: ["003", "067", "108"],
  },
];

function axisBar(score, max = 3, color = "#8a6030") {
  const pct = Math.round((score / max) * 100);
  return (
    <div style={{ flex: 1, marginLeft: 10 }}>
      <div style={{ height: 8, background: "#e5dfd5", borderRadius: 4, overflow: "hidden" }}>
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: `linear-gradient(90deg,${color},${C.goldDim})`,
            transition: "width 0.6s",
          }}
        />
      </div>
    </div>
  );
}

export default function QuickSample() {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState([]);

  const share = (kind) => {
    const total = scores.reduce((s, x) => s + x, 0);
    const profile = PROFILES.find((p) => total >= p.range[0] && total <= p.range[1]) || PROFILES[PROFILES.length - 1];
    const text = `私の傾向は『${profile.name} ${profile.icon}』(${total}/21点)。200の問いで自己理解を深める`;
    const url = "https://toi-suite.vercel.app/sample";
    if (kind === "x") {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
    } else if (kind === "line") {
      window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  if (step < QUESTIONS.length) {
    const q = QUESTIONS[step];
    const pct = Math.round(((step + 1) / QUESTIONS.length) * 100);
    return (
      <div style={{ minHeight: "100vh", background: C.bg, padding: "24px 16px", fontFamily: "system-ui,sans-serif" }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <div style={{ textAlign: "center", fontSize: 11, color: C.gold, marginBottom: 8, letterSpacing: "0.2em" }}>
            {step + 1} / {QUESTIONS.length}
          </div>
          <div style={{ height: 4, background: "#e5dfd5", borderRadius: 2, overflow: "hidden", marginBottom: 18 }}>
            <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg,${C.gold},${C.goldDim})`, transition: "width 0.4s" }} />
          </div>
          <div style={{ fontSize: 14, color: C.gold, fontWeight: 800, textAlign: "center", marginBottom: 6 }}>
            {q.icon} {q.axis}
          </div>
          <h2 style={{ fontSize: 19, color: C.text, fontWeight: 700, textAlign: "center", lineHeight: 1.6, marginBottom: 28, fontFamily: '"Hiragino Mincho ProN","Yu Mincho",serif' }}>
            {q.q}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {q.choices.map((c, i) => (
              <button
                key={i}
                onClick={() => {
                  setScores([...scores, c.s]);
                  setStep(step + 1);
                }}
                style={{
                  padding: "16px 18px",
                  background: C.surface,
                  border: `1.5px solid ${C.goldLight}`,
                  borderRadius: 14,
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: 14,
                  color: C.text,
                  fontWeight: 600,
                  fontFamily: "system-ui,sans-serif",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = C.gold;
                  e.currentTarget.style.background = C.goldLight;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = C.goldLight;
                  e.currentTarget.style.background = C.surface;
                }}
              >
                {c.t}
              </button>
            ))}
          </div>
          {step > 0 && (
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button
                onClick={() => {
                  const newScores = scores.slice(0, -1);
                  setScores(newScores);
                  setStep(step - 1);
                }}
                style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: 11, cursor: "pointer" }}
              >
                ← ひとつ戻る
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Result screen
  const total = scores.reduce((s, x) => s + x, 0);
  const profile = PROFILES.find((p) => total >= p.range[0] && total <= p.range[1]) || PROFILES[PROFILES.length - 1];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "40px 16px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>{profile.icon}</div>
          <div style={{ fontSize: 11, letterSpacing: "0.3em", color: C.gold, marginBottom: 6 }}>あなたの傾向は</div>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: C.goldDim, lineHeight: 1.2, marginBottom: 4 }}>
            {profile.name}
          </h1>
          <div style={{ fontSize: 12, color: C.textSub }}>（7軸合計 {total} / 21 点）</div>
        </div>

        {/* 6軸+1 スコア可視化 */}
        <div style={{ background: C.surface, border: `1.5px solid ${C.goldLight}`, borderRadius: 16, padding: 18, marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.gold, marginBottom: 12, letterSpacing: "0.15em" }}>
            軸別スコア
          </div>
          {QUESTIONS.map((q, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", marginBottom: 8, fontSize: 11 }}>
              <div style={{ width: 80, color: C.textSub }}>
                {q.icon} {q.axis}
              </div>
              {axisBar(scores[i] || 0)}
              <div style={{ width: 30, textAlign: "right", color: C.gold, fontWeight: 700, fontSize: 11 }}>
                {scores[i] || 0}/3
              </div>
            </div>
          ))}
        </div>

        {/* プロフィール文 */}
        <div style={{ background: C.surface, border: `1.5px solid ${C.goldLight}`, borderRadius: 16, padding: 20, marginBottom: 18 }}>
          <div style={{ fontSize: 14, color: C.text, lineHeight: 1.9, fontFamily: '"Hiragino Mincho ProN","Yu Mincho",serif' }}>
            {profile.text}
          </div>
        </div>

        {/* CTA: note + catalog */}
        <div style={{ background: C.goldLight, borderRadius: 16, padding: "22px 18px", marginBottom: 16, textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.goldDim, marginBottom: 10 }}>
            200の問いで深く知る
          </div>
          <div style={{ fontSize: 11, color: C.textSub, lineHeight: 1.7, marginBottom: 16 }}>
            あなたへのおすすめ: {profile.rec.map(id => `#${id}`).join(" / ")} など全200本のAI対話アプリは note記事の購入で解錠されます。
          </div>
          <a
            href="https://note.com/happy_happy_4649"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              padding: "12px 28px",
              borderRadius: 999,
              background: `linear-gradient(135deg,${C.gold},${C.goldDim})`,
              color: "#fff",
              fontSize: 13,
              fontWeight: 800,
              textDecoration: "none",
              marginBottom: 12,
            }}
          >
            📝 note記事を見る
          </a>
          <div>
            <Link to="/catalog" style={{ fontSize: 11, color: C.gold, textDecoration: "underline" }}>
              既にコードを持っている →
            </Link>
          </div>
        </div>

        {/* シェアボタン */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>
          <button
            onClick={() => share("x")}
            style={{ padding: "10px 18px", borderRadius: 999, background: "#111", color: "#fff", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            𝕏 でシェア
          </button>
          <button
            onClick={() => share("line")}
            style={{ padding: "10px 18px", borderRadius: 999, background: "#06C755", color: "#fff", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            LINE でシェア
          </button>
        </div>

        {/* もう一度 / トップ */}
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={() => { setScores([]); setStep(0); }}
            style={{ background: "transparent", border: `1px solid ${C.gold}`, color: C.gold, borderRadius: 999, padding: "8px 18px", fontSize: 11, cursor: "pointer", margin: "0 auto" }}
          >
            🔄 もう一度診断する
          </button>
          <Link to="/" style={{ fontSize: 11, color: C.textSub, textDecoration: "none" }}>
            ← トップに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
