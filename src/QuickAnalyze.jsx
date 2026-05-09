import React, { useState } from "react";

const C = {
  bg: "#f0ede8", surface: "#ffffff", border: "#c8c0b4",
  gold: "#8a6030", goldDim: "#5a3a10", goldLight: "#f5e8d0", goldBg: "rgba(138,96,48,0.08)",
  text: "#1a1210", textSub: "#3a3028", textMuted: "#6a5e50",
  green: "#1a4a30", greenLight: "#d0eedd",
  blue: "#1a4a6a", red: "#8a3030", purple: "#5a3a6a"
};

// 日本語キーワード抽出 (正規表現でカナ/漢字/英数の連続を切る)
function extractKeywords(text) {
  if (!text) return [];
  const tokens = text.match(/[一-龥ァ-ヴA-Za-z0-9]{2,}/g) || [];
  const stopwords = new Set([
    "こと","それ","これ","ため","とき","場合","自分","あなた","とても","本当",
    "あまり","とくに","よう","もの","しれ","ない","する","します","ある","あります",
    "なる","なります","ができ","います","でしょ","でき","だけ","から","まで","として",
    "について","みたい","かもしれない","でも","だけど","しかし","けれど","いる","です",
    "ます","でしょう","だっ","だった","ていた","ても","でも",
  ]);
  const counts = {};
  for (const t of tokens) {
    if (t.length < 2) continue;
    if (stopwords.has(t)) continue;
    counts[t] = (counts[t] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
}

// 傾向分析: カテゴリ語の出現頻度をカウント
const TENDENCY_DICT = {
  "知的活動": ["学", "読", "考", "分析", "整理", "理論", "知識", "情報", "論理", "思考", "研究", "図解", "言語", "資料"],
  "対人活動": ["人", "話", "聞く", "相手", "家族", "友", "仲間", "コミュ", "親", "子供", "会話", "関係", "繋がり", "信頼"],
  "創造活動": ["作", "描", "創", "想像", "表現", "デザイン", "アイデア", "アート", "曲", "詩", "物語", "発想", "新しい"],
  "感情・内省": ["感じ", "気持ち", "心", "不安", "嬉し", "悲し", "怒り", "好き", "嫌い", "夢", "願い", "後悔", "感謝"],
  "行動・実践": ["やる", "実行", "行動", "始め", "動く", "挑戦", "実践", "試", "取り組", "挑む", "前進", "進める"],
};

function analyzeText(text) {
  const lower = text.toLowerCase();
  const tendency = {};
  for (const [cat, words] of Object.entries(TENDENCY_DICT)) {
    let hits = 0;
    for (const w of words) {
      const matches = text.match(new RegExp(w, "g"));
      if (matches) hits += matches.length;
    }
    tendency[cat] = hits;
  }
  const total = Object.values(tendency).reduce((a, b) => a + b, 0) || 1;
  const tendencyPct = Object.fromEntries(
    Object.entries(tendency).map(([k, v]) => [k, Math.round(v / total * 100)])
  );
  return { tendency, tendencyPct };
}

// localStorage全履歴を取得
function getAllHistories() {
  const all = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const m = key && key.match(/^app(\d{2,3})_history_v[12]$/);
      if (!m) continue;
      try {
        const data = JSON.parse(localStorage.getItem(key) || "[]");
        if (Array.isArray(data) && data.length > 0) {
          all.push({ id: m[1].padStart(3, "0"), count: data.length, data });
        }
      } catch (e) {}
    }
  } catch (e) {}
  return all.sort((a, b) => parseInt(a.id) - parseInt(b.id));
}

export default function QuickAnalyze({ onClose }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    runAnalysis();
  }, []);

  async function runAnalysis() {
    setLoading(true); setError("");
    try {
      // クリップボードのプロンプト + 全localStorage履歴を集約
      let clipboard = "";
      try { clipboard = await navigator.clipboard.readText(); } catch (e) {}
      const histories = getAllHistories();

      // 全テキストを集約
      let allText = clipboard || "";
      const histTexts = [];
      for (const h of histories) {
        for (const session of h.data) {
          const t = session.analysis || session.preview || session.text || "";
          if (t) {
            allText += " " + t;
            histTexts.push({ id: h.id, text: t.slice(0, 200) });
          }
        }
      }

      if (allText.length < 30) {
        setError("分析するテキストが見つかりませんでした。\nまずアプリで5問答えて、プロンプトをコピーしてからこのボタンを押してください。");
        setLoading(false);
        return;
      }

      // 各種分析
      const keywords = extractKeywords(allText);
      const { tendencyPct } = analyzeText(allText);

      // 質問ごとの長さ (クリップボードのプロンプト解析)
      const lengthAnalysis = analyzeQuestionLengths(clipboard);

      // 一言コメント生成
      const topTendency = Object.entries(tendencyPct).sort((a, b) => b[1] - a[1])[0];
      const topKw = keywords[0] ? keywords[0][0] : "";
      const comment = generateComment(topTendency, topKw, histories.length);

      setResult({
        totalChars: allText.length,
        appsCovered: histories.length,
        sessionsCount: histories.reduce((s, h) => s + h.count, 0),
        keywords, tendencyPct, lengthAnalysis, comment, topTendency, topKw,
        histories,
      });
    } catch (e) {
      setError("分析エラー: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  function analyzeQuestionLengths(text) {
    // プロンプトから 【XX】 ... 形式の各質問の回答長を推定
    const matches = [...text.matchAll(/【([^】]+)】\s*\n?([^【]{0,500})/g)];
    return matches.slice(0, 7).map(m => ({
      title: m[1].slice(0, 12),
      length: m[2].trim().length,
    }));
  }

  function generateComment(topTendency, topKw, appCount) {
    const [cat, pct] = topTendency || ["?", 0];
    const parts = [];
    if (cat && pct >= 30) {
      parts.push(`あなたの回答は「${cat}」傾向が${pct}%で最も高い`);
    }
    if (topKw) {
      parts.push(`軸となるテーマは「${topKw}」`);
    }
    if (appCount >= 3) {
      parts.push(`${appCount}本のappで蓄積されたパターンと整合`);
    } else if (appCount === 0) {
      parts.push(`今回のプロンプトのみから抽出`);
    }
    return parts.join("。") + "。";
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, boxSizing: "border-box" }}>
      <div style={{ background: C.surface, borderRadius: 16, maxWidth: 480, width: "100%", maxHeight: "90vh", overflow: "auto", padding: 20, boxSizing: "border-box", border: `1.5px solid ${C.borderActive || C.gold}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.gold }}>📊 簡易分析</div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: 20, color: C.textMuted, cursor: "pointer" }}>✕</button>
        </div>

        {loading && <div style={{ textAlign: "center", padding: 20, color: C.textMuted }}>解析中...</div>}

        {error && (
          <div style={{ background: "#fff3e0", border: `1px solid ${C.gold}`, borderRadius: 8, padding: 12, fontSize: 11, color: C.text, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
            ⚠️ {error}
          </div>
        )}

        {result && (
          <>
            <div style={{ background: C.goldBg, border: `1px solid ${C.gold}`, borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 11, color: C.gold, lineHeight: 1.7 }}>
              💡 {result.comment}
            </div>

            <div style={{ background: C.bg, borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 11 }}>
              <div style={{ fontWeight: 700, color: C.gold, marginBottom: 6 }}>📈 量の特徴</div>
              <div>総文字数: <strong>{result.totalChars.toLocaleString()}</strong>字</div>
              <div>カバーapp: <strong>{result.appsCovered}</strong>本 / セッション計 <strong>{result.sessionsCount}</strong>回</div>
              {result.lengthAnalysis.length > 0 && (
                <>
                  <div style={{ marginTop: 6, fontSize: 10, color: C.textMuted }}>各問の回答長:</div>
                  {result.lengthAnalysis.map((q, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, marginTop: 2 }}>
                      <div style={{ width: 70, color: C.textSub }}>{q.title}</div>
                      <div style={{ flex: 1, background: C.surface, height: 6, borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${Math.min(100, q.length / 3)}%`, height: "100%", background: C.gold }} />
                      </div>
                      <div style={{ width: 30, textAlign: "right", color: C.textMuted, fontSize: 9 }}>{q.length}字</div>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div style={{ background: C.bg, borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 11 }}>
              <div style={{ fontWeight: 700, color: C.gold, marginBottom: 6 }}>🔑 頻出キーワード</div>
              {result.keywords.length === 0 ? (
                <div style={{ fontSize: 10, color: C.textMuted }}>抽出できませんでした</div>
              ) : (
                result.keywords.slice(0, 5).map(([word, count], i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, padding: "3px 0" }}>
                    <span style={{ width: 18, color: C.gold, fontWeight: 700, fontSize: 10 }}>#{i + 1}</span>
                    <span style={{ flex: 1 }}>{word}</span>
                    <span style={{ color: C.textMuted, fontSize: 10 }}>{count}回</span>
                  </div>
                ))
              )}
            </div>

            <div style={{ background: C.bg, borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 11 }}>
              <div style={{ fontWeight: 700, color: C.gold, marginBottom: 6 }}>🎯 思考・行動の傾向</div>
              {Object.entries(result.tendencyPct).sort((a, b) => b[1] - a[1]).map(([cat, pct], i) => (
                <div key={cat} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0", fontSize: 10 }}>
                  <div style={{ width: 80, color: C.textSub }}>{cat}</div>
                  <div style={{ flex: 1, background: C.surface, height: 8, borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: i === 0 ? C.gold : C.goldDim, opacity: 0.7 }} />
                  </div>
                  <div style={{ width: 30, textAlign: "right", color: C.textMuted }}>{pct}%</div>
                </div>
              ))}
            </div>

            {result.histories.length > 0 && (
              <div style={{ background: C.bg, borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 10, color: C.textSub }}>
                <div style={{ fontWeight: 700, color: C.gold, marginBottom: 6, fontSize: 11 }}>📚 解析対象app</div>
                {result.histories.map(h => (
                  <span key={h.id} style={{ display: "inline-block", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "2px 6px", margin: "2px", fontSize: 9 }}>
                    #{h.id}({h.count})
                  </span>
                ))}
              </div>
            )}

            <div style={{ fontSize: 9, color: C.textMuted, padding: "8px 4px 0", borderTop: `1px solid ${C.border}`, lineHeight: 1.7 }}>
              ℹ️ この簡易分析はAIなしで(数えるだけで)算出した統計です。<br />
              本格的な分析は「🤖 AI起動」ボタンからChatGPTで実施してください。
            </div>
          </>
        )}
      </div>
    </div>
  );
}
