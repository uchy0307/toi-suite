import React, { useState, useRef, useEffect } from "react";

// ───────────────────────────────────────────────────────────
// 価値観発掘コンサル - 旧仕様復元版
// 機能: 12軸価値観・レーダーチャート・深掘り5問
// δ方式実装: API呼び出しゼロ、プロンプト生成のみ
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
};

// ============================================================
// 12軸価値観定義
// ============================================================

const VALUES = [
  { id: "freedom", icon: "🦅", label: "自由・独立", desc: "自分の意思で動く・誰にも縛られない" },
  { id: "security", icon: "🏡", label: "安定・安全", desc: "リスクを避け安心できる基盤を持つ" },
  { id: "growth", icon: "🌱", label: "成長・挑戦", desc: "常に学び昨日の自分を超え続ける" },
  { id: "connect", icon: "❤️", label: "繋がり・愛", desc: "深い人間関係と揺るぎない所属感" },
  { id: "achieve", icon: "🏆", label: "達成・成功", desc: "目標を超え結果で自分を証明する" },
  { id: "contrib", icon: "🌍", label: "貢献・使命", desc: "社会と人の役に立ち跡を残す" },
  { id: "create", icon: "🎨", label: "創造・表現", desc: "作り表現し世界に独自の何かを生む" },
  { id: "health", icon: "⚡", label: "健康・活力", desc: "心身の充実を保ちエネルギーに溢れる" },
  { id: "wealth", icon: "💎", label: "富・豊かさ", desc: "経済的自由を手にし選択肢を広げる" },
  { id: "wisdom", icon: "🔭", label: "知恵・真理", desc: "物事の本質を理解し深く考え続ける" },
  { id: "family", icon: "🏮", label: "家族・伝統", desc: "受け継ぎ守り次の世代に渡す" },
  { id: "fun", icon: "🎭", label: "楽しみ・遊び", desc: "人生を謳歌し笑いと喜びに溢れる" },
];

const QUESTIONS = [
  {
    id: "regret",
    title: "後悔という名の羅針盤",
    q: "人生でもっとも後悔している決断を教えてください。その時あなたは何を犠牲にし、何のためにその犠牲を払いましたか？",
    hint: "後悔の裏には本当に大切にしているものが眠っています。"
  },
  {
    id: "death",
    title: "死の前夜という鏡",
    q: "死ぬ前日の夜、一人でいる自分を想像してください。「これだけはやっておけばよかった」と思うことは？「やり切れた」と思えることは？",
    hint: "死という視点だけが本当の優先順位を照らし出します。"
  },
  {
    id: "anger",
    title: "怒りという告白",
    q: "あなたが最も深く怒りを感じる時はどんな時ですか？その怒りの裏に隠れている「絶対に曲げられないもの」は何ですか？",
    hint: "怒りはあなたの価値観への侵害のサインです。"
  },
  {
    id: "envy",
    title: "羨望という地図",
    q: "誰かを羨ましいと感じた最も最近の経験を教えてください。その人の「何」が羨ましかったのでしょうか？",
    hint: "羨望はあなた自身が渇望している未来を指し示します。"
  },
  {
    id: "respect",
    title: "尊敬という投影",
    q: "心から尊敬する人を一人思い浮かべてください。その人の「どこ」を尊敬しますか？なぜその部分があなたの心を動かすのでしょうか？",
    hint: "尊敬する理由はあなた自身の価値観の鏡です。"
  }
];

// ============================================================
// δ方式プロンプト生成
// ============================================================

const buildValueAnalysisPrompt = (userName, rankings, answers) => {
  const top5 = rankings.slice(0, 5).map((id, i) => {
    const v = VALUES.find(v => v.id === id);
    return `${i + 1}位: ${v?.label}（${v?.desc}）`;
  });

  const answerBlock = QUESTIONS.map(q => `【${q.title}】\n${answers[q.id] || "（未回答）"}`).join("\n\n");

  return `あなたは「価値観発掘コンサルタント」です。以下の人物の価値観分析を行ってください。

【選んだ価値観 TOP5】
${top5.join("\n")}

【5つの深い問いへの回答】
${answerBlock}
${userName ? `\n【対象者】${userName}` : ""}

━━━ 出力フォーマット ━━━

### 【TOP3コアバリュー分析】
TOP3の価値観それぞれについて、回答内容の具体的な言葉を引用しながら、「なぜその価値観がこの人の核にあるのか」を3〜4文で論じてください。

### 【価値観の構造】
これらの価値観同士がどう絡み合い、相互補完・相互矛盾しているか、2〜3段落で描写してください。

### 【価値観の葛藤ポイント】
この人がどんな場面で葛藤しやすいか、具体的な状況を2〜3つ示してください。

### 【あなたの人生の問い】
この人が一生をかけて向き合うであろう根本的な問いを1つ、詩的に表現してください。

### 【今週の決断テスト】
今週中にできる小さな選択で「本当の価値観を確かめる」具体的なアクションを1つ提示してください。

━━━ 出力条件 ━━━
・合計1200〜1800字で、全セクションを書き切ること
・引用を具体的に、本人の言葉を活かすこと
・最後まで途中で終わらないこと

この分析をあなたのAI（Claude / ChatGPT / Gemini）に渡して実行してください。`;
};

// ============================================================
// レーダーチャート
// ============================================================

const RadarChart = ({ rankings }) => {
  const scores = [100, 85, 70, 55, 40, 25];
  const top6 = Array.from({ length: 6 }, (_, i) => {
    const id = rankings[i];
    const v = id ? VALUES.find(v => v.id === id) : null;
    return v ? { ...v, score: scores[i] } : { id: "", icon: "", label: "", desc: "", score: 0 };
  });

  const W = 280, H = 280, cx = 140, cy = 140, r = 90, n = 6;
  const ang = (i) => (2 * Math.PI / n) * i - Math.PI / 2;
  const pt = (i, rad) => ({ x: cx + rad * Math.cos(ang(i)), y: cy + rad * Math.sin(ang(i)) });
  const dataPath = top6.map((v, i) => { const p = pt(i, (v.score / 100) * r); return `${i === 0 ? "M" : "L"}${p.x},${p.y}`; }).join(" ") + " Z";
  const gridLevels = [0.33, 0.66, 1.0];
  const gridColors = ["#e8e4de", "#d8d0c8", "#c8c0b4"];

  return (
    <div style={{ background: C.surface, borderRadius: 14, padding: 16, marginBottom: 14, border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 12, color: C.gold, fontWeight: 600, marginBottom: 10, textAlign: "center" }}>価値観レーダーチャート</div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
          <rect width={W} height={H} fill={C.surface} />
          {gridLevels.map((lv, li) => {
            const d = Array.from({ length: n }, (_, i) => { const p = pt(i, r * lv); return `${i === 0 ? "M" : "L"}${p.x},${p.y}`; }).join(" ") + " Z";
            return <path key={li} d={d} fill="none" stroke={gridColors[li]} strokeWidth={1} />;
          })}
          {Array.from({ length: n }, (_, i) => {
            const p = pt(i, r);
            return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={C.border} strokeWidth={1} />;
          })}
          <path d={dataPath} fill="rgba(138,96,48,0.1)" stroke={C.gold} strokeWidth={2} strokeLinejoin="round" />
          {top6.map((v, i) => {
            const p = pt(i, (v.score / 100) * r);
            return v.score > 0 ? <circle key={i} cx={p.x} cy={p.y} r={5} fill={C.gold} /> : null;
          })}
          {top6.map((v, i) => {
            const lp = pt(i, r + 28);
            return v.label ? (
              <g key={i}>
                <text x={lp.x} y={lp.y - 7} textAnchor="middle" fontSize={15} dominantBaseline="middle">{v.icon}</text>
                <text x={lp.x} y={lp.y + 9} textAnchor="middle" fontSize={8} fill={C.textSub} fontFamily="sans-serif">{v.label}</text>
              </g>
            ) : null;
          })}
        </svg>
      </div>
      {rankings.slice(0, 5).map((id, i) => {
        const v = VALUES.find(v => v.id === id);
        const sc = [100, 85, 70, 55, 40][i];
        return (
          <div key={id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ width: 16, fontSize: 11, color: C.gold, fontWeight: 700 }}>{i + 1}</div>
            <div style={{ fontSize: 13 }}>{v?.icon}</div>
            <div style={{ fontSize: 11, color: C.text, width: 80, flexShrink: 0 }}>{v?.label}</div>
            <div style={{ flex: 1, height: 5, background: C.surface2, borderRadius: 3 }}>
              <div style={{ height: "100%", width: `${sc}%`, background: `linear-gradient(90deg,${C.gold},${C.goldDim})`, borderRadius: 3 }} />
            </div>
            <div style={{ fontSize: 10, color: C.textSub, width: 28, textAlign: "right" }}>{sc}</div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================
// ストレージ
// ============================================================

const HISTORY_KEY = "app002_history_v1";
const loadHistory = () => { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; } };
const saveHistory = (h) => { try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(-50))); } catch {} };

// ============================================================
// Main Component
// ============================================================

export default function App() {
  useEffect(() => {
    document.body.style.background = "#f0ede8";
    document.documentElement.style.background = "#f0ede8";
  }, []);

  const [screen, setScreen] = useState("home");
  const [tapOn, setTapOn] = useState(true);
  const tapOnRef = useRef(true);
  const toggleTap = () => { const next = !tapOnRef.current; tapOnRef.current = next; setTapOn(next); window._tapOn = next; };

  const [isSpeaking, setIsSpeaking] = useState(false);
  const toggleSpeak = (text) => {
    if (window._speaking) { doStopSpeak(); setIsSpeaking(false); }
    else if (text) { doSpeak(text); setIsSpeaking(true); }
  };

  const [userName, setUserName] = useState("");
  const [rankings, setRankings] = useState([]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [curAns, setCurAns] = useState("");

  const [prompt, setPrompt] = useState("");
  const [promptReady, setPromptReady] = useState(false);
  const [copied, setCopied] = useState(false);

  const [history, setHistory] = useState(loadHistory());

  const currentQ = QUESTIONS[step];
  const progress = screen === "ranking" ? 1 : screen === "questions" ? 2 : 3;

  const toggleRank = (id) => {
    T("tap");
    setRankings(prev => prev.includes(id) ? prev.filter(v => v !== id) : prev.length < 5 ? [...prev, id] : prev);
  };

  const submitAnswer = () => {
    T("tap");
    if (!curAns.trim()) return;
    const newAnswers = { ...answers, [currentQ.id]: curAns };
    setAnswers(newAnswers);
    setCurAns("");
    if (step < QUESTIONS.length - 1) {
      setStep(s => s + 1);
    } else {
      generatePrompt(newAnswers);
    }
  };

  const generatePrompt = (finalAnswers) => {
    const p = buildValueAnalysisPrompt(userName, rankings, finalAnswers);
    setPrompt(p);
    setPromptReady(true);
    setScreen("result");
    T("success");
  };

  const copyPrompt = async () => {
    T("send");
    try { await navigator.clipboard.writeText(prompt); }
    catch {
      const el = document.createElement("textarea");
      el.value = prompt;
      el.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(el); el.select();
      document.execCommand("copy"); document.body.removeChild(el);
    }
    setCopied(true);
    T("success");
    setTimeout(() => setCopied(false), 2500);
  };

  const saveToHistory = () => {
    const rec = {
      date: new Date().toLocaleDateString("ja-JP"),
      userName: userName || "匿名",
      top3: rankings.slice(0, 3).map(id => VALUES.find(v => v.id === id)?.label),
      rankings,
      answers,
    };
    const newH = [...history, rec];
    setHistory(newH);
    saveHistory(newH);
    T("success");
  };

  const resetAll = () => {
    T("tap");
    setScreen("home");
    setRankings([]);
    setStep(0);
    setAnswers({});
    setCurAns("");
    setPrompt("");
    setPromptReady(false);
    setUserName("");
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "sans-serif", maxWidth: 520, margin: "0 auto", display: "flex", flexDirection: "column" }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#ddd}textarea:focus{border-color:${C.borderActive}!important;outline:none}`}</style>

      {/* Header */}
      <div style={{ padding: "12px 14px 0", borderBottom: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg,${C.gold},${C.goldDim})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>⚖️</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.gold }}>価値観発掘コンサル</div>
            <div style={{ fontSize: 9, color: C.textMuted }}>VALUE DISCOVERY</div>
          </div>
          <button onClick={toggleTap} style={{ padding: "4px 8px", background: tapOn ? C.goldBg : C.surface2, border: `1px solid ${tapOn ? C.borderActive : C.border}`, borderRadius: 7, fontSize: 10, color: tapOn ? C.gold : C.textMuted, cursor: "pointer", fontWeight: 600 }}>{tapOn ? "🔔音ON" : "🔕音OFF"}</button>
          <button onClick={() => setScreen("home")} style={{ padding: "4px 8px", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 10, color: C.textSub, cursor: "pointer" }}>🏠 ホーム</button>
        </div>
        {screen !== "home" && (
          <div style={{ display: "flex", gap: 4, paddingBottom: 10 }}>
            {["価値観選択", "深掘り質問", "分析"].map((lbl, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ height: 2, borderRadius: 1, background: progress > i ? C.gold : C.border, marginBottom: 3, transition: "background 0.4s" }} />
                <div style={{ fontSize: 9, color: progress > i ? C.gold : C.textMuted }}>{lbl}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ホーム */}
      {screen === "home" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 16px 40px", animation: "fadeUp 0.4s ease" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>⚖️</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.gold, marginBottom: 10, lineHeight: 1.5 }}>あなたの価値観を発掘する</div>
            <div style={{ fontSize: 13, color: C.textSub, lineHeight: 1.9 }}>人生の多くの迷いは、自分の価値観を知らないまま決断していることから生まれます。<span style={{ color: C.goldDim, fontWeight: 600 }}>12の価値観から優先順位を選び、5つの深い問いに向き合う</span>ことで、本当に大切にしているものを言語化します。</div>
          </div>

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
            {[
              { n: "01", t: "12軸の価値観から選択", d: "自由・成長・安定・繋がり・達成・貢献・創造・健康・富・知恵・家族・楽しみ" },
              { n: "02", t: "5つの深い問い", d: "後悔・死・怒り・羨望・尊敬の視点から本音を掘り下げる" },
              { n: "03", t: "AI分析＋レーダーチャート", d: "価値観マップの生成＋六角形で数値化・可視化" }
            ].map(item => (
              <div key={item.n} style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: C.goldDim, fontWeight: 700, width: 18, flexShrink: 0, marginTop: 2 }}>{item.n}</div>
                <div><div style={{ fontSize: 13, color: C.text, fontWeight: 600, marginBottom: 2 }}>{item.t}</div><div style={{ fontSize: 11, color: C.textSub, lineHeight: 1.6 }}>{item.d}</div></div>
              </div>
            ))}
            <div style={{ fontSize: 11, color: C.textMuted, paddingTop: 10, borderTop: `1px solid ${C.border}`, marginTop: 4 }}>所要時間：約15〜20分</div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: C.textSub, marginBottom: 6 }}>お名前（任意）</div>
            <input value={userName} onChange={e => setUserName(e.target.value)} placeholder="例：田中" style={{ width: "100%", background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 10, color: C.text, padding: "10px 14px", fontSize: 14 }} />
          </div>

          <button onClick={() => { T("tap"); setScreen("ranking"); }} style={{ width: "100%", padding: "14px 0", background: `linear-gradient(135deg,${C.gold},${C.goldDim})`, border: "none", borderRadius: 14, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            セッションを始める →
          </button>
        </div>
      )}

      {/* ランキング */}
      {screen === "ranking" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 40px", animation: "fadeUp 0.4s ease" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>価値観ランキング</div>
          <div style={{ fontSize: 12, color: C.textSub, marginBottom: 14, lineHeight: 1.8 }}>大切なものを<span style={{ color: C.gold, fontWeight: 600 }}>上位5つ</span>選んでください。（{rankings.length}/5）</div>

          {VALUES.map(v => {
            const rank = rankings.indexOf(v.id) + 1;
            const sel = rank > 0;
            return (
              <div key={v.id} onClick={() => toggleRank(v.id)} style={{
                padding: "12px 14px", borderRadius: 12, border: `1px solid ${sel ? C.borderActive : C.border}`, background: sel ? C.goldBg : C.surface2, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 12, position: "relative", marginBottom: 8
              }}>
                {sel && <div style={{ position: "absolute", top: -8, right: -8, width: 22, height: 22, borderRadius: "50%", background: `linear-gradient(135deg,${C.gold},${C.goldDim})`, color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{rank}</div>}
                <div style={{ fontSize: 20, flexShrink: 0 }}>{v.icon}</div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: sel ? 700 : 500, color: sel ? C.goldDim : C.text, marginBottom: 2 }}>{v.label}</div><div style={{ fontSize: 10, color: C.textSub }}>{v.desc}</div></div>
              </div>
            );
          })}

          <div style={{ height: 14 }} />
          <button onClick={() => { if (rankings.length === 5) { T("tap"); setScreen("questions"); } }} style={{
            width: "100%", padding: "13px 0", background: rankings.length === 5 ? `linear-gradient(135deg,${C.gold},${C.goldDim})` : C.surface3, border: "none", borderRadius: 14,
            color: rankings.length === 5 ? "#fff" : C.textMuted, fontSize: 14, fontWeight: 700
          }}>
            {rankings.length === 5 ? "次へ →" : `あと${5 - rankings.length}つ選んでください`}
          </button>
        </div>
      )}

      {/* 問い */}
      {screen === "questions" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 40px", animation: "fadeUp 0.4s ease" }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 600, marginBottom: 4 }}>問い {step + 1} / {QUESTIONS.length}</div>
          <div style={{ height: 4, background: C.border, borderRadius: 2, marginBottom: 16 }}>
            <div style={{ height: "100%", width: `${(step / QUESTIONS.length) * 100}%`, background: `linear-gradient(90deg,${C.gold},${C.goldDim})`, borderRadius: 2, transition: "width 0.5s" }} />
          </div>

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: C.gold, fontWeight: 700, marginBottom: 8 }}>{currentQ.title}</div>
            <div style={{ fontSize: 14, color: C.text, lineHeight: 1.9, marginBottom: 12 }}>{currentQ.q}</div>
            <div style={{ fontSize: 11, color: C.textSub, fontStyle: "italic", padding: "8px 12px", background: C.goldLight, borderRadius: 8 }}>💡 {currentQ.hint}</div>
          </div>

          <textarea value={curAns} onChange={e => setCurAns(e.target.value)} placeholder="ここに回答を入力してください..." rows={5}
            style={{ width: "100%", background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 12, color: C.text, padding: "12px 14px", fontSize: 13, resize: "none", lineHeight: 1.8, fontFamily: "sans-serif", marginBottom: 12 }} />

          <button onClick={submitAnswer} disabled={!curAns.trim()} style={{
            width: "100%", padding: "13px 0", background: curAns.trim() ? `linear-gradient(135deg,${C.gold},${C.goldDim})` : C.surface3, border: "none", borderRadius: 14,
            color: curAns.trim() ? "#fff" : C.textMuted, fontSize: 14, fontWeight: 700
          }}>
            {step < QUESTIONS.length - 1 ? "次の問いへ →" : "分析を生成する ✦"}
          </button>

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {step > 0 && <button onClick={() => { T("tap"); setStep(s => s - 1); setCurAns(""); }} style={{ flex: 1, padding: "9px 0", background: "transparent", border: "none", color: C.textMuted, fontSize: 12 }}>← 前へ</button>}
            <button onClick={resetAll} style={{ flex: 1, padding: "9px 0", background: "transparent", border: "none", color: C.textMuted, fontSize: 12 }}>🏠 ホームへ</button>
          </div>
        </div>
      )}

      {/* 結果 */}
      {screen === "result" && promptReady && (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 32px" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.goldDim, marginBottom: 12 }}>📊 あなたの価値観マップ</div>

          <RadarChart rankings={rankings} />

          <div style={{ background: C.surface, border: `1.5px solid ${C.borderActive}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.gold }}>AIプロンプト</div>
              <button onClick={copyPrompt} style={{ padding: "7px 14px", background: copied ? C.greenLight : C.gold, border: `1px solid ${copied ? C.green : C.gold}`, borderRadius: 8, color: copied ? C.green : "#fff", fontSize: 11, fontWeight: 700 }}>
                {copied ? "✅ コピー済" : "📋 コピー"}
              </button>
            </div>
            <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, fontSize: 11, lineHeight: 1.7, color: C.text, whiteSpace: "pre-wrap", maxHeight: 280, overflowY: "auto", fontFamily: "monospace" }}>
              {prompt}
            </div>
            <div style={{ fontSize: 10, color: C.textMuted, marginTop: 8 }}>
              ☝️ コピーして Claude / ChatGPT / Gemini に貼り付けてください。
            </div>
          </div>

          <button onClick={saveToHistory} style={{ width: "100%", padding: "12px 0", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12, color: C.textSub, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
            💾 履歴に保存
          </button>

          <button onClick={resetAll} style={{ width: "100%", padding: "12px 0", background: `linear-gradient(135deg,${C.gold},${C.goldDim})`, border: "none", borderRadius: 12, color: "#fff", fontSize: 13, fontWeight: 700 }}>
            🔄 新規セッション
          </button>
        </div>
      )}
    </div>
  );
}
