import React, { useState, useRef, useEffect } from "react";

// ───────────────────────────────────────────────────────────
// 1on1マスターAI (App.jsx) - δ方式 v1.0
// API呼び出しゼロ。プロンプトを生成→ユーザーが自分のAIで実行
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

const QUESTIONS = [
  {
    id: "q1",
    title: "最近の関係性",
    q: "1on1する相手との最近の関係性、距離感はどんな感じですか?",
    placeholder: "例：部下で最近昇進して距離が出た、パートナーと最近仕事の話が少ない..."
  },
  {
    id: "q2",
    title: "相手の状態",
    q: "相手は今どんな状況・気持ちにあると感じていますか?",
    placeholder: "例：重たいプロジェクトに取り組んでいて疲れている、新しいチャレンジに不安がある..."
  },
  {
    id: "q3",
    title: "対話の目的",
    q: "この1on1で達成したいことは何ですか?(評価/共感/育成/問題解決等)",
    placeholder: "例：成長を認める、困っていることを聞き出す、キャリアについて考える..."
  },
  {
    id: "q4",
    title: "気がかりな点",
    q: "触れにくいけれど扱いたいテーマはありますか?",
    placeholder: "例：最近のパフォーマンス低下、以前の約束が守られていないこと..."
  },
  {
    id: "q5",
    title: "理想の終わり方",
    q: "1on1終了時にどんな空気・状態になっていたら成功ですか?",
    placeholder: "例：相手が少しスッキリした顔で帰る、次のアクションが明確になっている..."
  }
];

const HISTORY_KEY = "app01_history_v1";
const loadHistory = () => { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; } };
const saveHistory = (h) => { try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(-30))); } catch {} };

// ───────────────────────────────────────────────────────────
// δ方式: プロンプトビルダー (API呼び出しゼロ)
// ───────────────────────────────────────────────────────────

const buildAnalysisPrompt = (userName, answers, mode = "deep") => {
  const userBlock = `${userName ? `【対話者名】${userName}\n\n` : ""}${QUESTIONS.map(q => `【${q.title}】\n${answers[q.id] || "（未回答）"}`).join("\n\n")}`;

  const modeInstructions = {
    deep: `1200〜1500字で深く詳しく分析してください。途中で終わらないこと。`,
    simple: `400〜600字で要点だけ簡潔に分析してください。読みやすさ最優先。`,
    poetic: `800〜1000字で詩的・物語的に表現してください。比喩を使い、心に響く言葉で。`
  };

  return `あなたは1on1ミーティングのプロコーチです。以下の状況から、相手との関係性を深め、対話の目的を達成するための具体的な問いかけ8つと、注意すべき地雷ポイント3つを提示してください。

### 【具体的な問いかけ8つ】
各質問は「相手を引き出し、本当の気持ちを引き上げる」ものを選んでください。テンプレート的ではなく、この状況固有のものを。

### 【注意すべき地雷ポイント3つ】
この人間関係・この状況では踏むと関係が壊れる、或いは相手が引き籠もるテーマを3つ抽出してください。

### 【対話の流れ設計】
開始から終了までの流れ(導入→深掘り→課題抽出→行動化)をざっくり示してください。

${modeInstructions[mode]}

──────────────────────────
${userBlock}
──────────────────────────`;
};

const buildPerspectivePrompt = (userName, analysisText) => {
  return `あなたは「対話スキル分析の専門家」です。以下の1on1設計案を踏まえ、3つの異なる視点からその対話を見たときに何が見えるかを描写してください。

### 👫 相手の視点
${userName ? userName + "さんが" : "この対話の相手が"}この1on1を振り返ったときに感じることは？「この人(対話者)のどんなところに心が開いたか」「何を感じて帰ったか」2〜3段落。

### 🔮 第三者(観察者)の視点
第三者として両者の対話を見た時、この1on1の成功要因は何か？どうしてこの設計なら相手は心を開くのか？心理学的視点で2〜3段落。

### 💡 3ヶ月後の視点
この1on1の後3ヶ月経った時、「あの対話があったから今がある」と感じられるような成果は？関係性の変化、相手の成長2〜3段落。

各視点は語りかける形式で。鋭く、温かく、読んで「確かに…」と思わせる内容に。合計900〜1200字。途中で終わらないこと。

──────────────────────────
【元の分析結果】
${(analysisText || "").slice(0, 1200)}
──────────────────────────`;
};

const buildDeepDivePrompt = (userName, analysisText, theme) => {
  return `あなたは「1on1スキルの専門家」です。以下の分析結果を踏まえ、特定のテーマについて深掘りした追加分析を行ってください。

### 深掘りテーマ
${theme}

### 出力フォーマット
1. このテーマがこの1on1でどう活かせるか(3〜4文)
2. 具体的な問いかけワーディングを3パターン(「〜のは？」という形式で)
3. よくある失敗パターンを1つ(そしてその対策も)
4. 今日から始められる小さな練習を1つ

合計600〜800字で。

──────────────────────────
${userName ? "【相手名】" + userName + "\n\n" : ""}【元の分析結果】
${(analysisText || "").slice(0, 1000)}
──────────────────────────`;
};

const buildHistorySummaryPrompt = (history) => {
  const recent = history.slice(0, 5);
  return `あなたは継続的な1on1スキル向上をサポートするコーチです。以下は同じ人の過去${recent.length}回分のセッション設計履歴です。

この人の成長・パターン・繰り返されている課題・今後の改善点を200〜300字程度でサマリしてください。
時系列を意識して、「最初は〜だったが、今は〜になった」という変化の流れが分かるように書いてください。

──────────────────────────
${recent.map((h, i) => `【${i + 1}セッション目 ${h.date}】\n${(h.analysis || h.preview || "").slice(0, 400)}`).join("\n\n---\n\n")}
──────────────────────────`;
};

// ───────────────────────────────────────────────────────────
// UI Components
// ───────────────────────────────────────────────────────────

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
      <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, fontSize: 11.5, lineHeight: 1.85, color: C.text, whiteSpace: "pre-wrap", maxHeight: 280, overflowY: "auto" }}>
        {prompt}
      </div>
      <div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 8, lineHeight: 1.6 }}>
        ☝️ コピーして ChatGPT / Claude / Gemini に貼り付けてください。結果は下のボックスに貼り付ければ履歴に保存されます。
      </div>
    </div>
  );
};

const ResultPasteBox = ({ value, onChange, onSave, saved }) => (
  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: C.textSub, marginBottom: 8 }}>📥 AIから返ってきた結果を貼り付け</div>
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="ここにAIの回答をコピー&ペーストしてください..."
      rows={5}
      style={{ width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, padding: "10px 12px", fontSize: 12, resize: "vertical", lineHeight: 1.7, fontFamily: "sans-serif", marginBottom: 8 }}
    />
    <button
      onClick={onSave}
      disabled={!value.trim()}
      style={{ width: "100%", padding: "10px 0", background: !value.trim() ? C.surface3 : saved ? C.greenLight : `linear-gradient(135deg,${C.gold},${C.goldDim})`, border: `1px solid ${saved ? C.green : "transparent"}`, borderRadius: 10, color: !value.trim() ? C.textMuted : saved ? C.green : "#fff", fontSize: 12, fontWeight: 700 }}
    >
      {saved ? "✅ 履歴に保存しました" : "💾 履歴に保存"}
    </button>
  </div>
);

// ───────────────────────────────────────────────────────────

export default function App() {
  useEffect(() => {
    document.body.style.background = "#f0ede8";
    document.documentElement.style.background = "#f0ede8";
  }, []);

  const [tapOn, setTapOn] = useState(true);
  const tapOnRef = useRef(true);
  const toggleTap = () => { const next = !tapOnRef.current; tapOnRef.current = next; setTapOn(next); window._tapOn = next; };

  const [isSpeaking, setIsSpeaking] = useState(false);
  const toggleSpeak = (text) => {
    if (window._speaking) { doStopSpeak(); setIsSpeaking(false); }
    else if (text) { doSpeak(text); setIsSpeaking(true); }
  };

  const [screen, setScreen] = useState("home");
  const [userName, setUserName] = useState("");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [currentAnswer, setCurrentAnswer] = useState("");

  // δ方式: 生成されたプロンプトと、AIから貼り付けてもらった結果
  const [mode, setMode] = useState("deep"); // deep | simple | poetic
  const [analysisPrompt, setAnalysisPrompt] = useState("");
  const [analysisText, setAnalysisText] = useState(""); // ユーザーがAIから貼り付け
  const [analysisSaved, setAnalysisSaved] = useState(false);

  const [perspPrompt, setPerspPrompt] = useState("");

  const [deepTheme, setDeepTheme] = useState("");
  const [deepPrompt, setDeepPrompt] = useState("");

  const [history, setHistory] = useState(loadHistory());
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [summaryPrompt, setSummaryPrompt] = useState("");

  const currentQ = QUESTIONS[step];

  const submitAnswer = () => {
    T("tap");
    if (!currentAnswer.trim()) return;
    const newAnswers = { ...answers, [currentQ.id]: currentAnswer };
    setAnswers(newAnswers);
    setCurrentAnswer("");
    if (step < QUESTIONS.length - 1) setStep(s => s + 1);
    else { generatePromptAndShow(newAnswers); }
  };

  const generatePromptAndShow = (finalAnswers) => {
    const p = buildAnalysisPrompt(userName, finalAnswers, mode);
    setAnalysisPrompt(p);
    setScreen("result");
    T("success");
  };

  const regeneratePromptWithMode = (newMode) => {
    setMode(newMode);
    setAnalysisPrompt(buildAnalysisPrompt(userName, answers, newMode));
    T("tap");
  };

  const saveAnalysisToHistory = () => {
    if (!analysisText.trim()) return;
    const rec = {
      date: new Date().toLocaleDateString("ja-JP"),
      time: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
      userName: userName || "匿名",
      preview: analysisText.slice(0, 60),
      analysis: analysisText,
      mode,
    };
    const newH = [rec, ...history].slice(0, 30);
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
    setScreen("home"); setStep(0); setAnswers({}); setCurrentAnswer("");
    setAnalysisPrompt(""); setAnalysisText(""); setAnalysisSaved(false);
    setPerspPrompt(""); setDeepTheme(""); setDeepPrompt("");
    setSummaryPrompt(""); setSelectedHistory(null);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "sans-serif", maxWidth: 520, margin: "0 auto", display: "flex", flexDirection: "column" }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}body,html{background:#f0ede8!important}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#c8c0b4}textarea:focus,input:focus{outline:none}button{font-family:inherit;cursor:pointer}`}</style>

      {/* ヘッダー */}
      <div style={{ padding: "14px 18px 0", borderBottom: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg,${C.gold},${C.goldDim})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19 }}>🧭</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.gold }}>1on1マスターAI</div>
            <div style={{ fontSize: 10, color: C.textMuted }}>相手の心を開く対話設計をAIがサポート</div>
          </div>
          <button onClick={toggleTap} style={{ padding: "4px 8px", background: tapOn ? C.goldBg : C.surface2, border: `1px solid ${tapOn ? C.borderActive : C.border}`, borderRadius: 7, fontSize: 10, color: tapOn ? C.gold : C.textMuted, fontWeight: 600 }}>{tapOn ? "🔔音ON" : "🔕音OFF"}</button>
          <button onClick={() => toggleSpeak(analysisText)} style={{ padding: "4px 7px", background: isSpeaking ? C.goldBg : C.surface2, border: `1px solid ${isSpeaking ? C.borderActive : C.border}`, borderRadius: 7, fontSize: 10, color: isSpeaking ? C.gold : C.textSub, fontWeight: 600 }}>{isSpeaking ? "⏹停止" : "🔈読上"}</button>
          <button onClick={() => { setSelectedHistory(null); setScreen(screen === "history" ? "home" : "history"); }} style={{ padding: "5px 10px", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 10, color: C.textSub }}>📊 履歴</button>
        </div>
        {screen === "questions" && <div style={{ display: "flex", gap: 4, paddingBottom: 12 }}>{QUESTIONS.map((_, i) => <div key={i} style={{ flex: 1, height: 2, borderRadius: 1, background: step > i ? C.gold : step === i ? C.goldDim : C.border }} />)}</div>}
        {screen !== "questions" && <div style={{ height: 12 }} />}
      </div>

      {/* ホーム */}
      {screen === "home" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 18px 40px" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>🧭</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.gold, marginBottom: 12, lineHeight: 1.5 }}>1on1マスターAI</div>
            <div style={{ fontSize: 13, color: C.textSub, lineHeight: 1.9 }}>上司・部下・パートナーとの1on1を成功させるための対話設計をAIが一瞬で提案。相手の心を開き、本当に必要な会話ができます。</div>
          </div>
          <div style={{ background: C.goldBg, border: `1px solid ${C.borderActive}`, borderRadius: 12, padding: 14, marginBottom: 20, fontSize: 11.5, color: C.gold, lineHeight: 1.7 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>🎁 完全無料・コストゼロ・永久動作</div>
            このアプリは「対話設計プロンプト」を生成します。それを ChatGPT / Claude / Gemini にコピーして使えば、料金もAPI契約も不要。あなた自身のAIが提案してくれます。
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, marginBottom: 20 }}>
            {QUESTIONS.map((q, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: i < QUESTIONS.length - 1 ? 12 : 0 }}>
                <div style={{ fontSize: 10, color: C.goldDim, fontWeight: 700, width: 18, flexShrink: 0, marginTop: 2 }}>{String(i + 1).padStart(2, "0")}</div>
                <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{q.title}</div>
              </div>
            ))}
            <div style={{ fontSize: 11, color: C.textMuted, paddingTop: 10, borderTop: `1px solid ${C.border}`, marginTop: 10 }}>所要時間：約10分 ／ 正解はありません</div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: C.textSub, marginBottom: 6 }}>あなたのお名前(任意)</div>
            <input value={userName} onChange={e => setUserName(e.target.value)} placeholder="例：田中" style={{ width: "100%", background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 10, color: C.text, padding: "10px 14px", fontSize: 14 }} />
          </div>
          <button onClick={() => { T("tap"); setScreen("questions"); }} style={{ width: "100%", padding: "14px 0", background: `linear-gradient(135deg,${C.gold},${C.goldDim})`, border: "none", borderRadius: 14, color: "#fff", fontSize: 14, fontWeight: 700 }}>セッションを始める →</button>
          {history.length > 0 && <button onClick={() => setScreen("history")} style={{ width: "100%", padding: "10px 0", marginTop: 10, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 12, color: C.textSub, fontSize: 12 }}>📊 過去の記録を見る({history.length}件)</button>}
        </div>
      )}

      {/* 質問画面 */}
      {screen === "questions" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 18px 40px" }}>
          <div style={{ fontSize: 11, color: C.gold, fontWeight: 600, marginBottom: 6 }}>問い {step + 1} / {QUESTIONS.length}</div>
          <div style={{ height: 4, background: C.border, borderRadius: 2, marginBottom: 20 }}>
            <div style={{ height: "100%", width: `${(step / QUESTIONS.length) * 100}%`, background: `linear-gradient(90deg,${C.gold},${C.goldDim})`, borderRadius: 2, transition: "width 0.5s" }} />
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, marginBottom: 18 }}>
            <div style={{ fontSize: 11, color: C.gold, fontWeight: 700, marginBottom: 10 }}>{currentQ.title}</div>
            <div style={{ fontSize: 15, color: C.text, lineHeight: 1.85, whiteSpace: "pre-wrap", marginBottom: 14 }}>{currentQ.q}</div>
          </div>
          <textarea value={currentAnswer} onChange={e => setCurrentAnswer(e.target.value)} placeholder={currentQ.placeholder} rows={5} style={{ width: "100%", background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 12, color: C.text, padding: "12px 14px", fontSize: 13, resize: "none", lineHeight: 1.7, fontFamily: "sans-serif", marginBottom: 12 }} />
          <button onClick={submitAnswer} disabled={!currentAnswer.trim()} style={{ width: "100%", padding: "14px 0", background: currentAnswer.trim() ? `linear-gradient(135deg,${C.gold},${C.goldDim})` : C.surface3, border: "none", borderRadius: 14, color: currentAnswer.trim() ? "#fff" : C.textMuted, fontSize: 14, fontWeight: 700 }}>{step < QUESTIONS.length - 1 ? "次の問いへ →" : "プロンプトを生成 →"}</button>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {step > 0 && <button onClick={() => { setStep(s => s - 1); setCurrentAnswer(""); }} style={{ flex: 1, padding: "10px 0", background: "transparent", border: "none", color: C.textMuted, fontSize: 12 }}>← 前へ</button>}
            <button onClick={resetAll} style={{ flex: 1, padding: "10px 0", background: "transparent", border: "none", color: C.textMuted, fontSize: 12 }}>🏠 ホームへ</button>
          </div>
        </div>
      )}

      {/* 結果画面 */}
      {screen === "result" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px 40px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.gold, marginBottom: 4 }}>✨ 対話設計プロンプトが生成されました</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 14 }}>下のプロンプトをコピーして、お使いのAI(ChatGPT等)に貼り付けてください</div>

          {/* モード切替 */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {[{ k: "deep", l: "🌊 深い分析" }, { k: "simple", l: "📝 シンプル" }, { k: "poetic", l: "🎨 詩的" }].map(m => (
              <button key={m.k} onClick={() => regeneratePromptWithMode(m.k)} style={{ flex: 1, padding: "8px 0", background: mode === m.k ? `linear-gradient(135deg,${C.gold},${C.goldDim})` : C.surface, border: `1px solid ${mode === m.k ? "transparent" : C.border}`, borderRadius: 9, color: mode === m.k ? "#fff" : C.textSub, fontSize: 11, fontWeight: mode === m.k ? 700 : 500 }}>
                {m.l}
              </button>
            ))}
          </div>

          <PromptCard title="📋 対話設計プロンプト" prompt={analysisPrompt} />

          <ResultPasteBox value={analysisText} onChange={setAnalysisText} onSave={saveAnalysisToHistory} saved={analysisSaved} />

          {/* 他者視点 */}
          <div style={{ marginBottom: 14 }}>
            <button onClick={generatePerspective} style={{ width: "100%", padding: "11px 0", background: `linear-gradient(135deg,${C.blue},#0a3a5a)`, border: "none", borderRadius: 11, color: "#fff", fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
              👥 対話分析プロンプトを生成
            </button>
            {perspPrompt && <PromptCard title="👥 対話分析プロンプト" prompt={perspPrompt} />}
          </div>

          {/* 深掘り */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textSub, marginBottom: 8 }}>🔍 特定スキルで深掘り</div>
            <input value={deepTheme} onChange={e => setDeepTheme(e.target.value)} placeholder="例：部下が心を開きやすい聞き方 / 難しい話をどう切り出すか..." style={{ width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, padding: "9px 12px", fontSize: 12, marginBottom: 8 }} />
            <button onClick={generateDeepDive} style={{ width: "100%", padding: "10px 0", background: deepTheme.trim() ? `linear-gradient(135deg,${C.gold},${C.goldDim})` : C.surface3, border: "none", borderRadius: 10, color: deepTheme.trim() ? "#fff" : C.textMuted, fontSize: 12, fontWeight: 700 }}>🔍 深掘りプロンプトを生成</button>
          </div>
          {deepPrompt && <PromptCard title="🔍 深掘りプロンプト" prompt={deepPrompt} />}

          <button onClick={resetAll} style={{ width: "100%", padding: "12px 0", marginTop: 10, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, color: C.textSub, fontSize: 12 }}>🏠 ホームへ戻る / 別の人で始める</button>
        </div>
      )}

      {/* 履歴一覧 */}
      {screen === "history" && !selectedHistory && (
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 18px 40px" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.gold, marginBottom: 16 }}>📊 セッション履歴</div>
          {history.length === 0 ? <div style={{ textAlign: "center", padding: 40, color: C.textMuted, fontSize: 13 }}>まだ履歴がありません</div> : (
            <>
              {history.length >= 2 && (
                <div style={{ marginBottom: 14 }}>
                  <button onClick={generateHistorySummary} style={{ width: "100%", padding: "10px 0", marginBottom: 8, background: C.goldBg, border: `1px solid ${C.borderActive}`, borderRadius: 10, color: C.gold, fontSize: 12, fontWeight: 600 }}>
                    🧠 過去{history.length}回分の成長傾向プロンプトを生成
                  </button>
                  {summaryPrompt && <PromptCard title="🧠 成長傾向プロンプト" prompt={summaryPrompt} />}
                </div>
              )}
              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8 }}>👆 タップすると詳細を確認できます</div>
              {history.map((h, i) => (
                <div key={i} onClick={() => setSelectedHistory(h)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 10, cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ fontSize: 12, color: C.gold, fontWeight: 600 }}>{h.userName}</div>
                    <div style={{ fontSize: 11, color: C.textMuted }}>{h.date} {h.time || ""} ›</div>
                  </div>
                  <div style={{ fontSize: 11, color: C.textSub, lineHeight: 1.6 }}>{h.preview}...</div>
                </div>
              ))}
              <button onClick={() => { if (confirm("履歴を全削除しますか？")) { setHistory([]); saveHistory([]); } }} style={{ width: "100%", padding: "10px 0", marginTop: 4, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 10, color: C.textMuted, fontSize: 11 }}>🗑 履歴を全削除</button>
            </>
          )}
          <button onClick={resetAll} style={{ width: "100%", padding: "12px 0", marginTop: 12, background: `linear-gradient(135deg,${C.gold},${C.goldDim})`, border: "none", borderRadius: 12, color: "#fff", fontSize: 13, fontWeight: 700 }}>🏠 ホームへ</button>
        </div>
      )}

      {/* 履歴詳細 */}
      {screen === "history" && selectedHistory && (
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 18px 40px" }}>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 12 }}>{selectedHistory.date} {selectedHistory.time || ""} のセッション ({selectedHistory.userName})</div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: C.textSub, fontWeight: 600, marginBottom: 10 }}>対話設計案</div>
            <div style={{ fontSize: 12, color: C.text, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{selectedHistory.analysis}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={async () => {
              const text = `【1on1マスターAI】${selectedHistory.date}\n\n${selectedHistory.analysis}`;
              try { await navigator.clipboard.writeText(text); }
              catch { const el = document.createElement("textarea"); el.value = text; el.style.cssText = "position:fixed;opacity:0"; document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el); }
              T("success");
            }} style={{ flex: 1, padding: "12px 0", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, color: C.textSub, fontSize: 12 }}>
              📋 コピー
            </button>
            <button onClick={() => setSelectedHistory(null)} style={{ flex: 1, padding: "12px 0", background: `linear-gradient(135deg,${C.gold},${C.goldDim})`, border: "none", borderRadius: 12, color: "#fff", fontSize: 12, fontWeight: 700 }}>← 一覧へ</button>
          </div>
        </div>
      )}
    </div>
  );
}
