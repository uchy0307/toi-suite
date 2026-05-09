// === Page000.jsx === 200の問い 横断集計・分析メタアプリ v3.0
// 設計意図: #001-#200 の取組履歴を集計し、横断的な分析プロンプトを生成する専用アプリ
// 独自ペルソナ設定・独自10問ラリー・独自レーダーは持たない（それらは個別ページの役割）

import React, { useState, useEffect } from "react";

const C = {
  bg: "#f0ede8", surface: "#ffffff", surface2: "#e8e4de", surface3: "#ddd8d0",
  border: "#c8c0b4", borderActive: "#8a6030",
  gold: "#8a6030", goldLight: "#f5e8d0", goldDim: "#5a3a10",
  goldBg: "rgba(138,96,48,0.08)", text: "#1a1210",
  textSub: "#3a3028", textMuted: "#6a5e50",
};

// ============================================================
// 全200問い 横断集計
// ============================================================
const loadAllAppHistories = () => {
  const list = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      const m = k && k.match(/^app(\d{3})_history_v[12]$/);
      if (!m) continue;
      const n = parseInt(m[1], 10);
      if (n === 0) continue;
      try {
        const arr = JSON.parse(localStorage.getItem(k) || "[]");
        if (Array.isArray(arr) && arr.length > 0) {
          const latest = arr[0] || null;
          list.push({
            n,
            count: arr.length,
            theme: (latest && (latest.theme || latest.title)) || `問い ${n}`,
            lastAt: latest && (latest.savedAt || latest.timestamp || latest.at) || null,
            radar: latest && latest.radar || null,
            categories: latest && (latest.persona || latest.categories) || null,
            sample: latest && (latest.summary || latest.note || latest.answer) || null,
          });
        }
      } catch {}
    }
  } catch {}
  list.sort((a, b) => a.n - b.n);
  return list;
};

const buildAnalysisPrompt = (rows) => {
  if (rows.length === 0) return "";
  const head = rows.map(r => `#${String(r.n).padStart(3, "0")} 「${r.theme}」 ${r.count}回`).join("\n");
  const totalSessions = rows.reduce((s, r) => s + r.count, 0);
  return `あなたは「200の問い」シリーズ全体を俯瞰してアドバイスする内省コーチです。

ユーザーは200の問い（#001〜#200）のうち、以下の問いに取り組んできました：

【取組実績】
取組中の問い：${rows.length}件 / 200
合計セッション数：${totalSessions}回

【問い別取組回数】
${head}

【あなたの仕事】
1. ユーザーが**繰り返し戻ってきている問い**を特定し、そこに潜む中心課題を一つの言葉で言い当てる
2. **手薄になっている領域**（取り組んでいない問いカテゴリ）を指摘し、その理由を仮説する
3. **次に取り組むべき問い**を3つ、具体的な番号で推薦する。なぜその順序かも添える
4. ユーザーの内省パターン全体を**一行のメタファー**で表現する

回答は箇条書きでなく、ユーザーに語りかけるように。決めつけず、選択肢を残す形で。`;
};

const buildDeepAnalysisPrompt = (rows) => {
  if (rows.length === 0) return "";
  const detail = rows.slice(0, 30).map(r => {
    const cats = r.categories ? Object.entries(r.categories).map(([k, v]) => `${k}:${Array.isArray(v) ? v.join("/") : v}`).join(" ") : "";
    return `#${String(r.n).padStart(3, "0")}「${r.theme}」(${r.count}回)${cats ? "\n  カテゴリ: " + cats : ""}${r.sample ? "\n  最近の記述: " + String(r.sample).slice(0, 120) : ""}`;
  }).join("\n");
  return `あなたは200の問いシリーズの横断分析者です。
以下はユーザーが取り組んできた問い（直近30件・上位）の詳細データです。

${detail}

このデータから読み取れる：
A. ユーザーの**繰り返し現れるテーマ**（同義の悩み・思考パターン）を3つ抽出
B. **進化が見える領域**と**停滞している領域**を区別して指摘
C. データだけでは見えない**盲点**を仮説として提示
D. 次の30日間の**実験課題**を1つ提案

冷たい分析ではなく、ユーザーの取り組みに敬意を払いながら、新しい視点を差し込むように書いてください。`;
};

const HISTORY_KEY = "app000_aggregate_history_v1";
const loadHistory = () => { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; } };
const saveHistory = (h) => { try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(-30))); } catch {} };

function PromptCard({ title, prompt }) {
  const [copied, setCopied] = useState(false);
  if (!prompt) return null;
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.gold }}>{title}</div>
        <button
          onClick={() => { navigator.clipboard.writeText(prompt).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); }}
          style={{ padding: "5px 10px", background: copied ? C.goldBg : C.surface2, border: `1px solid ${copied ? C.borderActive : C.border}`, borderRadius: 8, fontSize: 11, color: copied ? C.gold : C.textSub, fontWeight: 600 }}
        >{copied ? "✓ コピー済" : "📋 コピー"}</button>
      </div>
      <div style={{ fontSize: 11.5, color: C.textSub, lineHeight: 1.7, whiteSpace: "pre-wrap", maxHeight: 160, overflowY: "auto", padding: 10, background: C.bg, borderRadius: 8, border: `1px solid ${C.border}` }}>{prompt}</div>
      <div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 8, lineHeight: 1.6 }}>このプロンプトを ChatGPT / Claude / Gemini にコピーして貼り付ければ、あなたの200の問い取組履歴を踏まえた横断分析が得られます。</div>
    </div>
  );
}

function fmtDate(t) {
  if (!t) return "";
  try {
    const d = new Date(t);
    if (isNaN(d.getTime())) return "";
    return `${d.getMonth() + 1}/${d.getDate()}`;
  } catch { return ""; }
}

export default function Page() {
  const [rows, setRows] = useState([]);
  const [history, setHistory] = useState(loadHistory());
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    setRows(loadAllAppHistories());
  }, []);

  const refresh = () => setRows(loadAllAppHistories());

  const summaryPrompt = buildAnalysisPrompt(rows);
  const deepPrompt = buildDeepAnalysisPrompt(rows);
  const totalSessions = rows.reduce((s, r) => s + r.count, 0);

  const saveSnapshot = () => {
    const snap = {
      id: Date.now(),
      savedAt: new Date().toISOString(),
      pageCount: rows.length,
      sessionTotal: totalSessions,
      pages: rows.map(r => ({ n: r.n, theme: r.theme, count: r.count })),
    };
    const newH = [snap, ...history].slice(0, 30);
    setHistory(newH); saveHistory(newH);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, background: C.surface, position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg,${C.gold},${C.goldDim})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📊</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.goldDim }}>200の問い 横断分析</div>
              <div style={{ fontSize: 10, color: C.textMuted }}>#001〜#200の取組を集計し、内省全体を俯瞰</div>
            </div>
            <button onClick={refresh} style={{ padding: "6px 10px", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 11, color: C.textSub }}>🔄 更新</button>
          </div>
        </div>

        <div style={{ padding: "20px 16px 60px" }}>

          <div style={{ background: C.goldBg, border: `1px solid ${C.borderActive}`, borderRadius: 12, padding: 14, marginBottom: 18, fontSize: 12, color: C.gold, lineHeight: 1.7 }}>
            この画面は <strong>200の問い 全アプリ（#001〜#200）の集計と横断分析</strong> 専用です。各個別アプリで「履歴に保存」を押した記録がここに反映されます。独自の問いやレーダーは持ちません。
          </div>

          {rows.length === 0 ? (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 32, textAlign: "center", color: C.textMuted, fontSize: 13, lineHeight: 1.9 }}>
              まだ #001〜#200 の取組履歴がありません。<br />
              <a href="#/001" style={{ color: C.gold, fontWeight: 600 }}>#001</a> など個別アプリでセッションを実施し、「履歴に保存」を押すとここに集計されます。
            </div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
                <div style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 12px", textAlign: "center" }}>
                  <div style={{ fontSize: 10.5, color: C.textMuted, marginBottom: 4 }}>取組中の問い</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: C.gold }}>{rows.length}<span style={{ fontSize: 12, color: C.textMuted, marginLeft: 4 }}>/200</span></div>
                </div>
                <div style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 12px", textAlign: "center" }}>
                  <div style={{ fontSize: 10.5, color: C.textMuted, marginBottom: 4 }}>合計セッション数</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: C.gold }}>{totalSessions}</div>
                </div>
              </div>

              {/* === アプリ内分析（ChatGPT貼り付け前に自動診断） === */}
              <div style={{ background: C.surface, border: `2px solid ${C.borderActive}`, borderRadius: 14, padding: 16, marginBottom: 18 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.gold, marginBottom: 12 }}>🧭 アプリ内 横断分析（自動）</div>

                {/* 1. 取組頻度ランキング TOP5 */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: C.goldDim, marginBottom: 6 }}>① 繰り返し戻ってきている問い TOP5</div>
                  {(() => {
                    const top = [...rows].sort((a, b) => b.count - a.count).slice(0, 5);
                    const max = top[0]?.count || 1;
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        {top.map(r => (
                          <div key={r.n} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
                            <div style={{ width: 38, color: C.goldDim, fontWeight: 700 }}>#{String(r.n).padStart(3, "0")}</div>
                            <div style={{ flex: 1, height: 16, background: C.surface2, borderRadius: 8, overflow: "hidden" }}>
                              <div style={{ width: `${(r.count / max) * 100}%`, height: "100%", background: `linear-gradient(90deg,${C.gold},${C.goldDim})` }} />
                            </div>
                            <div style={{ width: 36, textAlign: "right", color: C.text, fontWeight: 600 }}>{r.count}回</div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                  <div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 6, lineHeight: 1.6 }}>頻繁に戻る問いは「未消化のテーマ」のサインです。同じ問いに何度も向き合うのは前進の証でもあります。</div>
                </div>

                {/* 2. 取組番号レンジ別 */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: C.goldDim, marginBottom: 6 }}>② 番号レンジ別 取組分布</div>
                  {(() => {
                    const buckets = [
                      { label: "#001-040", from: 1, to: 40 },
                      { label: "#041-080", from: 41, to: 80 },
                      { label: "#081-120", from: 81, to: 120 },
                      { label: "#121-160", from: 121, to: 160 },
                      { label: "#161-200", from: 161, to: 200 },
                    ];
                    const counted = buckets.map(b => ({ ...b, count: rows.filter(r => r.n >= b.from && r.n <= b.to).length, sessions: rows.filter(r => r.n >= b.from && r.n <= b.to).reduce((s, r) => s + r.count, 0) }));
                    const max = Math.max(1, ...counted.map(b => b.count));
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        {counted.map(b => (
                          <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
                            <div style={{ width: 80, color: C.textSub }}>{b.label}</div>
                            <div style={{ flex: 1, height: 14, background: C.surface2, borderRadius: 7, overflow: "hidden" }}>
                              <div style={{ width: `${(b.count / max) * 100}%`, height: "100%", background: b.count === 0 ? C.surface3 : C.gold }} />
                            </div>
                            <div style={{ width: 80, textAlign: "right", color: C.text, fontWeight: 600 }}>{b.count}件 / {b.sessions}回</div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                  <div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 6, lineHeight: 1.6 }}>取組が薄いレンジは「気づいていない盲点」かもしれません。</div>
                </div>

                {/* 3. テーマ語 自動抽出 */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: C.goldDim, marginBottom: 6 }}>③ テーマ語 頻出キーワード</div>
                  {(() => {
                    const tokens = {};
                    rows.forEach(r => {
                      const t = String(r.theme || "");
                      const matches = t.match(/[一-龯ぁ-んァ-ヴー]{2,}/g) || [];
                      matches.forEach(w => {
                        if (w.length > 8) return;
                        tokens[w] = (tokens[w] || 0) + r.count;
                      });
                    });
                    const top = Object.entries(tokens).sort((a, b) => b[1] - a[1]).slice(0, 12);
                    if (top.length === 0) return <div style={{ fontSize: 11, color: C.textMuted }}>テーマ語が抽出できませんでした。</div>;
                    const max = top[0][1];
                    return (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {top.map(([w, c]) => (
                          <span key={w} style={{ padding: "5px 10px", background: C.goldBg, border: `1px solid ${C.borderActive}`, borderRadius: 14, fontSize: 11, color: C.gold, fontWeight: 600, opacity: 0.5 + 0.5 * (c / max) }}>
                            {w} <span style={{ color: C.textMuted, fontWeight: 400 }}>×{c}</span>
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                  <div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 6, lineHeight: 1.6 }}>頻出語は今のあなたの中心テーマ。視点が偏っていないかチェックの材料に。</div>
                </div>

                {/* 4. 自動所見 */}
                <div style={{ background: C.goldBg, border: `1px solid ${C.borderActive}`, borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: C.gold, marginBottom: 6 }}>④ 自動所見</div>
                  {(() => {
                    const lines = [];
                    const total = rows.reduce((s, r) => s + r.count, 0);
                    const avg = total / Math.max(1, rows.length);
                    const heavy = rows.filter(r => r.count >= Math.max(3, avg * 2));
                    const untouchedRanges = [
                      { label: "#001-040", from: 1, to: 40 },
                      { label: "#041-080", from: 41, to: 80 },
                      { label: "#081-120", from: 81, to: 120 },
                      { label: "#121-160", from: 121, to: 160 },
                      { label: "#161-200", from: 161, to: 200 },
                    ].filter(b => rows.filter(r => r.n >= b.from && r.n <= b.to).length === 0).map(b => b.label);
                    if (rows.length < 5) lines.push(`• まだ${rows.length}件のみ。横断パターンが見えるのは10件以上から。気軽に色々試して大丈夫。`);
                    if (heavy.length > 0) lines.push(`• ${heavy.length}件の問いは平均より大幅に多く取り組んでいます（${heavy.map(h => "#" + String(h.n).padStart(3, "0")).join(" / ")}）。中心課題が固まりつつあります。`);
                    if (untouchedRanges.length > 0) lines.push(`• 未着手レンジ: ${untouchedRanges.join(" / ")}。意図的なら問題なし、無自覚なら一度開いてみる価値あり。`);
                    if (rows.length >= 30) lines.push(`• 30件以上の取組実績は内省習慣化のサイン。ここから次は「行動の試行」フェーズへ移すと進化が加速。`);
                    if (lines.length === 0) lines.push(`• 取組実績${rows.length}件 / 合計${total}回。バランスよく取り組めています。`);
                    return <div style={{ fontSize: 11.5, color: C.text, lineHeight: 1.9 }}>{lines.map((l, i) => <div key={i}>{l}</div>)}</div>;
                  })()}
                </div>
              </div>

              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8, lineHeight: 1.6 }}>↓ さらに深く分析したい場合は、以下のプロンプトをChatGPT/Claude/Geminiに貼り付けてください。</div>
              <PromptCard title="🧠 横断分析プロンプト（簡易）" prompt={summaryPrompt} />
              <PromptCard title="🔬 深掘り分析プロンプト（詳細データ含む）" prompt={deepPrompt} />

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18, marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>問い別 取組実績（{rows.length}件）</div>
                <button onClick={() => setShowDetail(!showDetail)} style={{ padding: "5px 10px", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 11, color: C.textSub }}>{showDetail ? "簡易表示" : "詳細表示"}</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {rows.map(r => (
                  <a key={r.n} href={`#/${String(r.n).padStart(3, "0")}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <div style={{ display: "flex", alignItems: "center", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: 11, color: C.goldDim, fontWeight: 700, width: 44, flexShrink: 0 }}>#{String(r.n).padStart(3, "0")}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.theme}</div>
                        {showDetail && r.sample && <div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{String(r.sample).slice(0, 80)}</div>}
                      </div>
                      {r.lastAt && <div style={{ fontSize: 10, color: C.textMuted, marginRight: 10 }}>{fmtDate(r.lastAt)}</div>}
                      <div style={{ fontSize: 11, color: C.gold, fontWeight: 700 }}>{r.count}回</div>
                    </div>
                  </a>
                ))}
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
                <button onClick={saveSnapshot} style={{ flex: 1, padding: "10px 0", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12, color: C.textSub, fontWeight: 600 }}>📌 現在のサマリを保存</button>
              </div>
            </>
          )}

          {history.length > 0 && (
            <div style={{ marginTop: 28 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>📚 過去のサマリ（{history.length}件）</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {history.map(h => (
                  <div key={h.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", fontSize: 11.5, color: C.textSub }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>{fmtDate(h.savedAt)} 時点</span>
                      <span>{h.pageCount}件 / {h.sessionTotal}セッション</span>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => { if (window.confirm("サマリ履歴を全削除しますか？")) { setHistory([]); saveHistory([]); } }} style={{ marginTop: 10, width: "100%", padding: "8px 0", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 10, color: C.textMuted, fontSize: 11 }}>🗑 サマリ履歴を全削除</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
