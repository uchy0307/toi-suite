import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { APP_INDEX } from "../appIndex.js";
import { getCompletedAppIds } from "../lib/streak.js";

const C = {
  bg: "#f0ede8", surface: "#ffffff",
  border: "#c8c0b4", borderActive: "#8a6030",
  gold: "#8a6030", goldDim: "#5a3a10", goldLight: "#f5e8d0",
  text: "#1a1210", textSub: "#3a3028", textMuted: "#6a5e50"
};

/**
 * Daily pick — chooses ONE app a day to highlight.
 * Selection logic:
 * - Prefer apps from the user's onboarding-recommended set
 * - Prefer apps the user hasn't completed yet
 * - Stable per-day (uses date as seed)
 */
function pickDaily(onboarding) {
  const completed = getCompletedAppIds();
  const recommended = new Set((onboarding && onboarding.recommended) || []);
  // Filter pool: non-meta apps not yet completed
  let pool = APP_INDEX.filter(a => a.id !== "000" && !completed.has(a.id));
  if (pool.length === 0) pool = APP_INDEX.filter(a => a.id !== "000");
  // Prefer recommended
  const preferred = pool.filter(a => recommended.has(a.id));
  const usePool = preferred.length > 0 ? preferred : pool;
  // Stable per-day index
  const d = new Date();
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  const idx = seed % usePool.length;
  return usePool[idx];
}

export default function DailyPick({ onboarding }) {
  const [pick, setPick] = useState(null);

  useEffect(() => {
    setPick(pickDaily(onboarding));
  }, [onboarding]);

  if (!pick) return null;

  const today = new Date();
  const monthDay = `${today.getMonth() + 1}月${today.getDate()}日`;

  return (
    <div style={{ padding: "0 14px 14px" }}>
      <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 6, padding: "0 4px", fontFamily: "sans-serif" }}>
        ✨ 今日のおすすめ — {monthDay}
      </div>
      <Link to={`/${pick.id}`} style={{ textDecoration: "none" }}>
        <div style={{
          background: `linear-gradient(135deg, #fff8e8, ${C.goldLight})`,
          border: `1.5px solid ${C.gold}`,
          borderRadius: 14,
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          boxShadow: "0 3px 10px rgba(138,96,48,0.18)",
          fontFamily: '"Noto Serif JP", "Hiragino Mincho ProN", "Yu Mincho", serif',
          transition: "transform 0.15s"
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}>
          <div style={{ fontSize: 42, lineHeight: 1 }}>{pick.emoji}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: C.gold, fontWeight: 600, marginBottom: 2, fontFamily: "sans-serif" }}>
              #{pick.id} · {pick.category}
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.goldDim, lineHeight: 1.35 }}>
              {pick.name}
            </div>
            <div style={{ fontSize: 10, color: C.textSub, marginTop: 4, fontFamily: "sans-serif" }}>
              タップして始める →
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
