// src/components/Onboarding.jsx
// パーソナライズ・オンボーディングクイズ
// 4問の回答から、心情×テーマでPage番号10〜30件をレコメンド

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { APP_INDEX } from "../appIndex.js";

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
};

export const ONBOARDING_KEY = "toi_onboarding_v1";

const QUESTIONS = [
  {
    id: "mood",
    q: "Q1. 今日のあなたの心情に最も近いものは？",
    options: [
      { value: "calm", label: "🧘 落ち着いている" },
      { value: "anxious", label: "😰 不安がある" },
      { value: "excited", label: "🔥 興奮している" },
      { value: "angry", label: "😠 怒りを感じる" },
      { value: "sad", label: "😢 悲しみがある" },
    ],
  },
  {
    id: "theme",
    q: "Q2. 今いちばん気になるテーマは？",
    options: [
      { value: "work", label: "💼 仕事・キャリア" },
      { value: "love", label: "💕 恋愛・パートナー" },
      { value: "family", label: "👨‍👩‍👧 家族・親子" },
      { value: "health", label: "🌿 健康・メンタル" },
      { value: "self", label: "🌟 自己実現・成長" },
    ],
  },
  {
    id: "time",
    q: "Q3. いま自分に使える時間は？",
    options: [
      { value: "5min", label: "⏱️ 5分くらい" },
      { value: "15min", label: "⏰ 15分くらい" },
      { value: "30min+", label: "🕰️ 30分以上" },
    ],
  },
  {
    id: "age",
    q: "Q4. あなたの年代は？",
    options: [
      { value: "20s", label: "🌱 20代" },
      { value: "30s", label: "🌿 30代" },
      { value: "40s", label: "🌳 40代" },
      { value: "50s+", label: "🌲 50代以上" },
    ],
  },
];

// テーマ → カテゴリ優先度
const THEME_CATEGORIES = {
  work: ["ビジネス・キャリア", "学習・思考"],
  love: ["人間関係"],
  family: ["人間関係", "QOL・メンタル"],
  health: ["QOL・メンタル"],
  self: ["自己理解", "メタ"],
};

// 心情 → 補助カテゴリ（テーマに上乗せ）
const MOOD_CATEGORIES = {
  calm: ["自己理解", "クリエイティブ"],
  anxious: ["QOL・メンタル", "自己理解"],
  excited: ["クリエイティブ", "ビジネス・キャリア"],
  angry: ["人間関係", "自己理解"],
  sad: ["QOL・メンタル", "自己理解"],
};

// 心情 → 特に推したい個別アプリID
const MOOD_PRIORITY_IDS = {
  calm: ["010", "020", "094", "095"],
  anxious: ["004", "085", "088", "089", "160"],
  excited: ["005", "021", "065", "115"],
  angry: ["016", "042", "049", "053"],
  sad: ["004", "011", "085", "087", "160"],
};

export function getRecommendations(onboarding) {
  if (!onboarding) return [];
  const { mood, theme, time } = onboarding;
  const themeCats = THEME_CATEGORIES[theme] || [];
  const moodCats = MOOD_CATEGORIES[mood] || [];
  const priorityIds = new Set(MOOD_PRIORITY_IDS[mood] || []);

  const scored = APP_INDEX
    .filter((a) => a.id !== "000")
    .map((a) => {
      let score = 0;
      if (themeCats.includes(a.category)) score += 10;
      if (themeCats[0] === a.category) score += 5;
      if (moodCats.includes(a.category)) score += 4;
      if (priorityIds.has(a.id)) score += 8;
      return { ...a, score };
    })
    .filter((a) => a.score > 0)
    .sort((a, b) => b.score - a.score);

  // 時間に応じて件数を変える
  const limit = time === "5min" ? 10 : time === "15min" ? 20 : 30;
  return scored.slice(0, limit);
}

export default function Onboarding({ onComplete, onSkip }) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});

  const cur = QUESTIONS[idx];
  const progress = ((idx + 1) / QUESTIONS.length) * 100;

  const select = (value) => {
    const next = { ...answers, [cur.id]: value };
    setAnswers(next);
    if (idx < QUESTIONS.length - 1) {
      setTimeout(() => setIdx(idx + 1), 150);
    } else {
      // 完了 → 保存
      const payload = { ...next, completedAt: new Date().toISOString() };
      try {
        localStorage.setItem(ONBOARDING_KEY, JSON.stringify(payload));
      } catch (e) {}
      setTimeout(() => onComplete && onComplete(payload), 200);
    }
  };

  const goPrev = () => {
    if (idx > 0) setIdx(idx - 1);
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
        padding: "20px 16px 32px",
        boxSizing: "border-box",
      }}
    >
      {/* ヘッダー */}
      <div
        style={{
          background: `linear-gradient(135deg,${C.gold},${C.goldDim})`,
          color: "#fff",
          borderRadius: 14,
          padding: "16px 18px",
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
          🗝️ あなたに合った問いを選びます
        </div>
        <div style={{ fontSize: 11, color: "#f5e8d0", lineHeight: 1.6 }}>
          4つの問いに答えるだけ。心情とテーマから最適なアプリを推薦します。
        </div>
      </div>

      {/* 進捗バー */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: C.goldDim }}>
            {idx + 1} / {QUESTIONS.length}
          </div>
          <button
            onClick={onSkip}
            style={{
              background: "transparent",
              border: "none",
              color: C.textMuted,
              fontSize: 11,
              cursor: "pointer",
              padding: "2px 6px",
            }}
          >
            スキップ →
          </button>
        </div>
        <div
          style={{
            height: 6,
            background: C.surface2,
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
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
          padding: 18,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: C.text,
            lineHeight: 1.6,
            marginBottom: 14,
          }}
        >
          {cur.q}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {cur.options.map((opt) => {
            const sel = answers[cur.id] === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => select(opt.value)}
                style={{
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: sel ? C.goldLight : C.surface2,
                  border: `1.5px solid ${sel ? C.borderActive : C.border}`,
                  color: sel ? C.goldDim : C.textSub,
                  fontWeight: sel ? 700 : 500,
                  fontSize: 13,
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 戻るボタン */}
      {idx > 0 && (
        <button
          onClick={goPrev}
          style={{
            width: "100%",
            padding: "10px 0",
            background: C.surface2,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            color: C.textSub,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          ← 前の問いに戻る
        </button>
      )}
    </div>
  );
}

// レコメンド結果表示用コンポーネント（カタログから呼ぶ用）
export function RecommendBanner({ onboarding, onReset }) {
  if (!onboarding) return null;
  const recs = getRecommendations(onboarding);
  if (recs.length === 0) return null;

  const moodLabel =
    QUESTIONS[0].options.find((o) => o.value === onboarding.mood)?.label || "";
  const themeLabel =
    QUESTIONS[1].options.find((o) => o.value === onboarding.theme)?.label || "";

  return (
    <div
      style={{
        margin: "0 14px 14px",
        padding: 14,
        background: C.surface,
        border: `1.5px solid ${C.borderActive}`,
        borderRadius: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 800, color: C.gold }}>
          ✨ あなたへのおすすめ ({recs.length}本)
        </div>
        <button
          onClick={onReset}
          style={{
            background: "transparent",
            border: `1px solid ${C.border}`,
            color: C.textMuted,
            fontSize: 10,
            cursor: "pointer",
            padding: "3px 8px",
            borderRadius: 6,
          }}
        >
          🔄 やり直す
        </button>
      </div>
      <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 10, lineHeight: 1.6 }}>
        {moodLabel} × {themeLabel}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 6,
          maxHeight: 280,
          overflowY: "auto",
        }}
      >
        {recs.map((a) => (
          <Link
            key={a.id}
            to={`/${a.id}`}
            style={{ textDecoration: "none" }}
          >
            <div
              style={{
                padding: "8px 10px",
                background: C.surface2,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <div style={{ fontSize: 16 }}>{a.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: C.gold,
                  }}
                >
                  #{a.id}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: C.text,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {a.name}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
