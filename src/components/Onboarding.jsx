import React, { useState } from "react";
import { APP_INDEX } from "../appIndex.js";

const C = {
  bg: "#f0ede8", surface: "#ffffff", surface2: "#e8e4de", surface3: "#ddd8d0",
  border: "#c8c0b4", borderActive: "#8a6030",
  gold: "#8a6030", goldLight: "#f5e8d0", goldDim: "#5a3a10",
  goldBg: "rgba(138,96,48,0.08)", text: "#1a1210",
  textSub: "#3a3028", textMuted: "#6a5e50",
};

export const ONBOARDING_KEY = "toi_onboarding_v1";

const QUESTIONS = [
  {
    id: "mood",
    label: "今日のあなたの心情は？",
    icon: "💭",
    options: [
      { value: "calm", label: "落ち着いている", emoji: "🌿" },
      { value: "anxious", label: "不安", emoji: "🌧️" },
      { value: "excited", label: "興奮", emoji: "🔥" },
      { value: "angry", label: "怒り", emoji: "⚡" },
      { value: "sad", label: "悲しみ", emoji: "💧" },
    ],
  },
  {
    id: "theme",
    label: "最近気になっているテーマは？",
    icon: "🎯",
    options: [
      { value: "work", label: "仕事", emoji: "💼" },
      { value: "love", label: "恋愛", emoji: "💕" },
      { value: "family", label: "家族", emoji: "👨‍👩‍👧" },
      { value: "health", label: "健康", emoji: "🌱" },
      { value: "growth", label: "自己実現", emoji: "✨" },
    ],
  },
  {
    id: "time",
    label: "今、自分に使える時間は？",
    icon: "⏰",
    options: [
      { value: "short", label: "5分", emoji: "⚡" },
      { value: "medium", label: "15分", emoji: "🕐" },
      { value: "long", label: "30分以上", emoji: "🧘" },
    ],
  },
  {
    id: "age",
    label: "あなたの年代は？",
    icon: "🎂",
    options: [
      { value: "20s", label: "20代", emoji: "🌱" },
      { value: "30s", label: "30代", emoji: "🌿" },
      { value: "40s", label: "40代", emoji: "🌳" },
      { value: "50plus", label: "50代以上", emoji: "🌲" },
    ],
  },
];

// テーマ→カテゴリ
const THEME_TO_CATS = {
  work: ["ビジネス・キャリア", "学習・思考"],
  love: ["人間関係", "QOL・メンタル"],
  family: ["人間関係", "自己理解"],
  health: ["QOL・メンタル", "自己理解"],
  growth: ["自己理解", "クリエイティブ"],
};

// 心情→カテゴリ加重
const MOOD_TO_CATS = {
  calm: ["自己理解", "学習・思考"],
  anxious: ["QOL・メンタル", "自己理解"],
  excited: ["クリエイティブ", "ビジネス・キャリア"],
  angry: ["QOL・メンタル", "人間関係"],
  sad: ["QOL・メンタル", "人間関係"],
};

export function recommendAppIds(answers) {
  if (!answers) return [];
  const themeCats = THEME_TO_CATS[answers.theme] || [];
  const moodCats = MOOD_TO_CATS[answers.mood] || [];
  const primary = APP_INDEX.filter(a => themeCats.includes(a.category) && a.id !== "000");
  const secondary = APP_INDEX.filter(a => moodCats.includes(a.category) && !themeCats.includes(a.category) && a.id !== "000");
  const limit = answers.time === "short" ? 10 : answers.time === "medium" ? 20 : 30;
  const merged = [...primary, ...secondary].slice(0, limit);
  return merged.map(a => a.id);
}

export function loadOnboarding() {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearOnboarding() {
  try { localStorage.removeItem(ONBOARDING_KEY); } catch {}
}

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const q = QUESTIONS[step];
  const total = QUESTIONS.length;
  const progress = ((step) / total) * 100;

  const choose = (value) => {
    const next = { ...answers, [q.id]: value };
    setAnswers(next);
    if (step < total - 1) {
      setStep(step + 1);
    } else {
      const recommended = recommendAppIds(next);
      const payload = { ...next, recommended, savedAt: Date.now() };
      try { localStorage.setItem(ONBOARDING_KEY, JSON.stringify(payload)); } catch {}
      if (onComplete) onComplete(payload);
    }
  };

  const goBack = () => { if (step > 0) setStep(step - 1); };

  const skip = () => {
    try { localStorage.setItem(ONBOARDING_KEY, JSON.stringify({ skipped: true, savedAt: Date.now(), recommended: [] })); } catch {}
    if (onComplete) onComplete({ skipped: true, recommended: [] });
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, boxSizing: "border-box" }}>
      <div style={{ maxWidth: 460, width: "100%", background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 16, padding: 24, boxSizing: "border-box" }}>
        {/* プログレスバー */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.textMuted, marginBottom: 6 }}>
            <span>STEP {step + 1} / {total}</span>
            <button onClick={skip} style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: 10, cursor: "pointer", textDecoration: "underline" }}>スキップ</button>
          </div>
          <div style={{ height: 4, background: C.surface2, borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: `${progress + (100/total)}%`, height: "100%", background: `linear-gradient(135deg,${C.gold},${C.goldDim})`, transition: "width 0.3s" }} />
          </div>
        </div>

        {/* ロゴ・タイトル */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>{q.icon}</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.gold, marginBottom: 4 }}>
            あなたに合うアプリを見つけます
          </div>
          <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{q.label}</div>
        </div>

        {/* 選択肢 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {q.options.map(opt => (
            <button
              key={opt.value}
              onClick={() => choose(opt.value)}
              style={{
                background: C.surface,
                border: `1.5px solid ${C.border}`,
                borderRadius: 12,
                padding: "14px 16px",
                fontSize: 14,
                color: C.text,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 12,
                textAlign: "left",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = C.borderActive;
                e.currentTarget.style.background = C.goldBg;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.background = C.surface;
              }}
            >
              <span style={{ fontSize: 22 }}>{opt.emoji}</span>
              <span style={{ fontWeight: 600 }}>{opt.label}</span>
            </button>
          ))}
        </div>

        {/* 戻る */}
        {step > 0 && (
          <button
            onClick={goBack}
            style={{ marginTop: 16, width: "100%", background: "transparent", border: "none", color: C.textMuted, fontSize: 11, cursor: "pointer", padding: "8px 0" }}
          >
            ← 前の質問に戻る
          </button>
        )}

        {/* 注釈 */}
        <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${C.border}`, fontSize: 10, color: C.textMuted, lineHeight: 1.7, textAlign: "center" }}>
          回答はこのブラウザにのみ保存されます。後から「やり直す」で再設定できます。
        </div>
      </div>
    </div>
  );
}
