// src/components/PageBase.jsx
// 「10問ラリー → Gemini で6軸スコアリング → レーダー描画 → Supabase保存」
// を再利用可能にまとめた汎用ベースコンポーネント。
//
// 使い方:
//   import PageBase from "../components/PageBase.jsx";
//   const QUESTIONS = [
//     { id: "q1", q: "...", type: "text", placeholder: "..." },
//     { id: "q2", q: "...", type: "choice", options: ["A", "B", "C"] },
//     ...10件
//   ];
//   export default function Page042() {
//     return <PageBase questionSetId="app042" title="..." questions={QUESTIONS} />;
//   }

import React, { useState, useMemo } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { analyzeAnswers, AXIS_LABELS, AXIS_KEYS, AXIS_DESCRIPTIONS } from "../lib/gemini.js";
import { saveAnalysis, isSupabaseConfigured } from "../lib/supabase.js";
import {
  generateShareImage,
  downloadImage,
  shareToX,
  shareToLine,
  shareNative,
} from "../lib/shareImage.js";

const C = {
  bg: "#f0ede8",
  surface: "#ffffff",
  surface2: "#e8e4de",
  surface3: "#ddd8d0",
  border: "#c8c0b4",
  borderActive: "#8a6030",
  gold: "#8a6030",
  goldLight: "#f5e8d0",
  goldDim: "#5a3a10",
  goldBg: "rgba(138,96,48,0.08)",
  text: "#1a1210",
  textSub: "#3a3028",
  textMuted: "#6a5e50",
  red: "#a02018",
  green: "#1a4a30",
};

// 質問が10件未満でも動くようガード
function normalizeQuestions(qs) {
  const safe = Array.isArray(qs) ? qs.slice(0, 10) : [];
  while (safe.length < 10) {
    safe.push({
      id: `q${safe.length + 1}`,
      q: `（質問${safe.length + 1}は未設定です）`,
      type: "text",
      placeholder: "",
    });
  }
  return safe;
}

export default function PageBase({
  questionSetId = "app000",
  title = "10問ラリー × 6軸分析",
  subtitle = "侍の美学で己を映す",
  questions = [],
  userId = null,
}) {
  const QS = useMemo(() => normalizeQuestions(questions), [questions]);

  // screen: rally → loading → result
  const [screen, setScreen] = useState("rally");
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState(Array(10).fill(""));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { scores, analysis_summary, advice, _source, _error }
  const [savedStatus, setSavedStatus] = useState("idle"); // idle | saving | ok | failed | skipped
  const [errorText, setErrorText] = useState("");
  const [shareStatus, setShareStatus] = useState("idle"); // idle | generating | ready | error
  const [shareMsg, setShareMsg] = useState("");

  const cur = QS[idx];
  const progress = ((idx + 1) / 10) * 100;
  const answeredCount = answers.filter((a) => a && String(a).trim().length > 0).length;
  const allAnswered = answeredCount === 10;

  const setAns = (val) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  // 選択肢タップ → 自動進行（最終問は止める）
  const selectChoice = (val) => {
    setAns(val);
    if (idx < 9) {
      setTimeout(() => setIdx(idx + 1), 220);
    }
  };

  const goNext = () => {
    if (idx < 9) setIdx(idx + 1);
  };
  const goPrev = () => {
    if (idx > 0) setIdx(idx - 1);
  };

  const runAnalysis = async () => {
    setErrorText("");
    setScreen("loading");
    setLoading(true);
    try {
      const r = await analyzeAnswers(answers, questionSetId);
      setResult(r);
      setScreen("result");

      // Supabaseに保存（失敗してもUIは進む）
      if (isSupabaseConfigured()) {
        setSavedStatus("saving");
        const save = await saveAnalysis({
          userId,
          questionSetId,
          rawAnswers: answers,
          scores: r.scores,
          summary: r.analysis_summary,
          advice: r.advice,
        });
        setSavedStatus(save.ok ? "ok" : "failed");
      } else {
        setSavedStatus("skipped");
      }
    } catch (e) {
      setErrorText(e.message || "分析に失敗しました");
      setScreen("rally");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setAnswers(Array(10).fill(""));
    setIdx(0);
    setResult(null);
    setSavedStatus("idle");
    setErrorText("");
    setShareStatus("idle");
    setShareMsg("");
    setScreen("rally");
  };

  // 結果を画像化（ダウンロード or Webシェア）
  const buildImage = async () => {
    if (!result) return null;
    setShareStatus("generating");
    setShareMsg("画像生成中...");
    try {
      const { blob, dataUrl } = await generateShareImage({
        title,
        scores: result.scores,
        summary: result.analysis_summary,
        axisKeys: AXIS_KEYS,
        axisLabels: AXIS_LABELS,
      });
      setShareStatus("ready");
      setShareMsg("");
      return { blob, dataUrl };
    } catch (e) {
      setShareStatus("error");
      setShareMsg(e.message || "画像生成に失敗");
      return null;
    }
  };

  const handleDownload = async () => {
    const img = await buildImage();
    if (!img) return;
    downloadImage(img.dataUrl, `toi-suite-${questionSetId}.png`);
    setShareMsg("✅ 画像を保存しました");
  };

  const handleShareX = async () => {
    const img = await buildImage();
    if (!img) return;
    const native = await shareNative({
      blob: img.blob,
      text: `200の問い / 六軸の鏡 結果\n${title || ""}`,
    });
    if (!native.ok) {
      // Web Share API 非対応 → ダウンロード+Xインテント
      downloadImage(img.dataUrl, `toi-suite-${questionSetId}.png`);
      shareToX(`200の問い / 六軸の鏡 結果\n${title || ""}\n#200の問い #toi_suite`);
      setShareMsg("✅ 画像をDLしました。Xに添付してください");
    } else {
      setShareMsg("✅ 共有しました");
    }
  };

  const handleShareLine = async () => {
    const img = await buildImage();
    if (!img) return;
    const native = await shareNative({
      blob: img.blob,
      text: `200の問い / 六軸の鏡 結果\n${title || ""}`,
    });
    if (!native.ok) {
      downloadImage(img.dataUrl, `toi-suite-${questionSetId}.png`);
      shareToLine(`200の問い / 六軸の鏡 結果\n${title || ""}`);
      setShareMsg("✅ 画像をDLしました。LINEに添付してください");
    } else {
      setShareMsg("✅ 共有しました");
    }
  };

  // recharts用データ整形
  const chartData = useMemo(() => {
    if (!result?.scores) return [];
    return AXIS_KEYS.map((k) => ({
      axis: AXIS_LABELS[k],
      value: result.scores[k] || 0,
      fullMark: 100,
    }));
  }, [result]);

  // ============================================================
  // Rally画面
  // ============================================================
  const renderRally = () => (
    <div style={{ padding: "16px 16px 32px" }}>
      {/* タイトル */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.goldDim }}>{title}</div>
        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{subtitle}</div>
      </div>

      {/* 進捗バー */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.goldDim }}>
            Q{idx + 1} / 10
          </div>
          <div style={{ fontSize: 11, color: C.textMuted }}>
            回答済み: {answeredCount} / 10
          </div>
        </div>
        <div style={{ height: 6, background: C.surface2, borderRadius: 3, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: `linear-gradient(90deg,${C.gold},${C.goldDim})`,
              borderRadius: 3,
              transition: "width 0.25s ease",
            }}
          />
        </div>
      </div>

      {/* 質問カード */}
      <div
        style={{
          background: C.surface,
          border: `1.5px solid ${C.borderActive}`,
          borderRadius: 14,
          padding: 16,
          marginBottom: 14,
        }}
      >
        <div style={{ fontSize: 11, color: C.gold, fontWeight: 700, marginBottom: 8 }}>
          ⚔️ 問 {idx + 1} / 10
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text, lineHeight: 1.6, marginBottom: 12 }}>
          {cur.q}
        </div>

        {cur.type === "choice" && Array.isArray(cur.options) ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {cur.options.map((opt) => {
              const sel = answers[idx] === opt;
              return (
                <button
                  key={opt}
                  onClick={() => selectChoice(opt)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: sel ? C.goldLight : C.surface2,
                    border: `1.5px solid ${sel ? C.borderActive : C.border}`,
                    color: sel ? C.goldDim : C.textSub,
                    fontWeight: sel ? 700 : 500,
                    fontSize: 13,
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  {sel ? "● " : "○ "}
                  {opt}
                </button>
              );
            })}
          </div>
        ) : (
          <textarea
            value={answers[idx] || ""}
            onChange={(e) => setAns(e.target.value)}
            placeholder={cur.placeholder || "自由に記述してください..."}
            rows={4}
            style={{
              width: "100%",
              padding: "10px 14px",
              background: C.surface2,
              border: `1.5px solid ${C.border}`,
              borderRadius: 10,
              color: C.text,
              fontSize: 13,
              fontFamily: "sans-serif",
              lineHeight: 1.6,
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
        )}
      </div>

      {/* ナビゲーション */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          onClick={goPrev}
          disabled={idx === 0}
          style={{
            flex: 1,
            padding: "12px 0",
            background: idx === 0 ? C.surface3 : C.surface2,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            color: idx === 0 ? C.textMuted : C.textSub,
            fontSize: 13,
            fontWeight: 700,
            cursor: idx === 0 ? "not-allowed" : "pointer",
          }}
        >
          ← 前へ
        </button>
        {idx < 9 ? (
          <button
            onClick={goNext}
            disabled={!answers[idx] || !String(answers[idx]).trim()}
            style={{
              flex: 1,
              padding: "12px 0",
              background: !answers[idx] || !String(answers[idx]).trim() ? C.surface3 : C.surface2,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              color: !answers[idx] || !String(answers[idx]).trim() ? C.textMuted : C.textSub,
              fontSize: 13,
              fontWeight: 700,
              cursor: !answers[idx] || !String(answers[idx]).trim() ? "not-allowed" : "pointer",
            }}
          >
            次へ →
          </button>
        ) : (
          <button
            onClick={runAnalysis}
            disabled={!allAnswered || loading}
            style={{
              flex: 1,
              padding: "12px 0",
              background: allAnswered ? `linear-gradient(135deg,${C.gold},${C.goldDim})` : C.surface3,
              border: "none",
              borderRadius: 10,
              color: allAnswered ? "#fff" : C.textMuted,
              fontSize: 13,
              fontWeight: 700,
              cursor: allAnswered ? "pointer" : "not-allowed",
              boxShadow: allAnswered ? "0 2px 8px rgba(138,96,48,0.3)" : "none",
            }}
          >
            🎯 結果を見る
          </button>
        )}
      </div>

      {/* 進捗ドット */}
      <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap", marginBottom: 16 }}>
        {QS.map((q, i) => {
          const filled = answers[i] && String(answers[i]).trim().length > 0;
          const current = i === idx;
          return (
            <button
              key={q.id}
              onClick={() => setIdx(i)}
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: current ? C.gold : filled ? C.goldLight : C.surface2,
                border: `1.5px solid ${current ? C.goldDim : filled ? C.gold : C.border}`,
                color: current ? "#fff" : filled ? C.goldDim : C.textMuted,
                fontSize: 10,
                fontWeight: 700,
                cursor: "pointer",
              }}
              title={q.q}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* 分析開始ボタン */}
      <button
        onClick={runAnalysis}
        disabled={!allAnswered || loading}
        style={{
          width: "100%",
          padding: "14px 0",
          background: allAnswered ? `linear-gradient(135deg,${C.gold},${C.goldDim})` : C.surface3,
          border: "none",
          borderRadius: 14,
          color: allAnswered ? "#fff" : C.textMuted,
          fontSize: 15,
          fontWeight: 700,
          cursor: allAnswered ? "pointer" : "not-allowed",
          boxShadow: allAnswered ? "0 4px 14px rgba(138,96,48,0.3)" : "none",
        }}
      >
        {allAnswered ? "⚔️ 6軸で己を映す" : `あと ${10 - answeredCount} 問の回答を待つ`}
      </button>

      {errorText && (
        <div
          style={{
            marginTop: 10,
            padding: "8px 12px",
            background: "#fde8e8",
            border: `1px solid ${C.red}`,
            borderRadius: 8,
            color: C.red,
            fontSize: 11,
          }}
        >
          ⚠️ {errorText}
        </div>
      )}
    </div>
  );

  // ============================================================
  // Loading画面
  // ============================================================
  const renderLoading = () => (
    <div
      style={{
        padding: 40,
        textAlign: "center",
        minHeight: 400,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ fontSize: 56, marginBottom: 16, animation: "spin 2s linear infinite" }}>⚔️</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.goldDim, marginBottom: 8 }}>
        AIが10の答えを読み解いている...
      </div>
      <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.7 }}>
        6軸での評価には10〜20秒ほどかかります。<br />
        刀を抜く前の静寂をお楽しみください。
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );

  // ============================================================
  // Result画面
  // ============================================================
  const renderResult = () => {
    if (!result) return null;
    const scores = result.scores || {};
    const totalAvg =
      Math.round(
        AXIS_KEYS.reduce((s, k) => s + (scores[k] || 0), 0) / AXIS_KEYS.length
      );

    return (
      <div style={{ padding: "16px 16px 32px" }}>
        {/* タイトル */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.goldDim }}>📊 六軸の鏡</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
            総合 {totalAvg} / 100
            {result._source === "fallback" && (
              <span style={{ marginLeft: 8, color: C.red }}>
                ⚠️ オフライン簡易分析（API失敗）
              </span>
            )}
          </div>
        </div>

        {/* レーダーチャート */}
        <div
          style={{
            background: C.surface,
            border: `1.5px solid ${C.borderActive}`,
            borderRadius: 14,
            padding: 12,
            marginBottom: 14,
          }}
        >
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData} margin={{ top: 16, right: 30, bottom: 16, left: 30 }}>
                <PolarGrid stroke={C.border} />
                <PolarAngleAxis
                  dataKey="axis"
                  tick={{ fill: C.goldDim, fontSize: 12, fontWeight: 700 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: C.textMuted, fontSize: 9 }}
                  tickCount={6}
                />
                <Radar
                  name="あなた"
                  dataKey="value"
                  stroke={C.gold}
                  fill={C.gold}
                  fillOpacity={0.35}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* 軸ごとのスコア一覧 */}
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {AXIS_KEYS.map((k) => (
              <div
                key={k}
                style={{
                  padding: "8px 10px",
                  background: C.surface2,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                }}
              >
                <div style={{ fontSize: 10, color: C.textMuted }}>{AXIS_DESCRIPTIONS[k]}</div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: C.goldDim,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <span>{AXIS_LABELS[k]}</span>
                  <span style={{ fontSize: 18 }}>{scores[k] || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 総評 */}
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 14,
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, marginBottom: 6 }}>
            🗾 総評
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.85, color: C.text }}>
            {result.analysis_summary}
          </div>
        </div>

        {/* アドバイス */}
        <div
          style={{
            background: C.goldLight,
            border: `1px solid ${C.gold}`,
            borderRadius: 12,
            padding: 14,
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: C.goldDim, marginBottom: 6 }}>
            ⚡ 次の一手
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.85, color: C.text, fontWeight: 600 }}>
            {result.advice}
          </div>
        </div>

        {/* シェア */}
        <div
          style={{
            background: C.surface,
            border: `1.5px solid ${C.borderActive}`,
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, marginBottom: 8 }}>
            📣 結果をシェア
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            <button
              onClick={handleDownload}
              disabled={shareStatus === "generating"}
              style={{
                padding: "10px 0",
                background: C.surface2,
                border: `1.5px solid ${C.border}`,
                borderRadius: 10,
                color: C.goldDim,
                fontSize: 11,
                fontWeight: 700,
                cursor: shareStatus === "generating" ? "wait" : "pointer",
              }}
            >
              💾 画像保存
            </button>
            <button
              onClick={handleShareX}
              disabled={shareStatus === "generating"}
              style={{
                padding: "10px 0",
                background: "#000",
                border: "1.5px solid #000",
                borderRadius: 10,
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                cursor: shareStatus === "generating" ? "wait" : "pointer",
              }}
            >
              𝕏 でシェア
            </button>
            <button
              onClick={handleShareLine}
              disabled={shareStatus === "generating"}
              style={{
                padding: "10px 0",
                background: "#06C755",
                border: "1.5px solid #06C755",
                borderRadius: 10,
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                cursor: shareStatus === "generating" ? "wait" : "pointer",
              }}
            >
              LINE で
            </button>
          </div>
          {shareMsg && (
            <div
              style={{
                marginTop: 8,
                fontSize: 10,
                color: shareStatus === "error" ? C.red : C.textMuted,
                textAlign: "center",
              }}
            >
              {shareMsg}
            </div>
          )}
        </div>

        {/* 保存ステータス */}
        <div
          style={{
            padding: "8px 12px",
            background: C.surface2,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            fontSize: 10,
            color: C.textMuted,
            marginBottom: 12,
            textAlign: "center",
          }}
        >
          {savedStatus === "ok" && "💾 Supabaseに保存されました"}
          {savedStatus === "saving" && "💾 保存中..."}
          {savedStatus === "failed" && "⚠️ 保存に失敗（結果は表示できます）"}
          {savedStatus === "skipped" && "📝 ローカル表示のみ（Supabase未設定）"}
          {savedStatus === "idle" && "—"}
        </div>

        <button
          onClick={reset}
          style={{
            width: "100%",
            padding: "12px 0",
            background: C.surface2,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            color: C.textSub,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          🔄 もう一度問い直す
        </button>
      </div>
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        fontFamily: "sans-serif",
        maxWidth: 540,
        margin: "0 auto",
      }}
    >
      <style>{`*{box-sizing:border-box}textarea:focus,input:focus{border-color:${C.borderActive}!important;outline:none}`}</style>
      {screen === "rally" && renderRally()}
      {screen === "loading" && renderLoading()}
      {screen === "result" && renderResult()}
    </div>
  );
}
