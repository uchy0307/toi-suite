import React, { useEffect, useState } from "react";
import { getStreak, evaluateAchievements, getCompletedAppIds, getTotalAppCount, getCategoryCount, getCompletedCategories } from "../lib/streak.js";

const C = {
  bg: "#f0ede8", surface: "#ffffff",
  border: "#c8c0b4", borderActive: "#8a6030",
  gold: "#8a6030", goldDim: "#5a3a10", goldLight: "#f5e8d0",
  text: "#1a1210", textSub: "#3a3028", textMuted: "#6a5e50"
};

/**
 * EngagementBar - shows streak, completion progress, and achievement badges
 * Placed on the catalog top, below header.
 */
export default function EngagementBar() {
  const [streak, setStreak] = useState({ count: 0, longest: 0 });
  const [completedSize, setCompletedSize] = useState(0);
  const [achievements, setAchievements] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [catsDoneSize, setCatsDoneSize] = useState(0);
  const totalCats = getCategoryCount();
  const totalApps = getTotalAppCount();

  useEffect(() => {
    const refresh = () => {
      setStreak(getStreak());
      setCompletedSize(getCompletedAppIds().size);
      setCatsDoneSize(getCompletedCategories().size);
      setAchievements(evaluateAchievements());
    };
    refresh();
    // Recompute when window refocuses (data may have changed in another tab)
    window.addEventListener("focus", refresh);
    const t = setInterval(refresh, 60000);
    return () => { window.removeEventListener("focus", refresh); clearInterval(t); };
  }, []);

  const unlocked = achievements.filter(a => a.unlocked);
  const shownAchievements = showAll ? achievements : unlocked.slice(0, 4);

  const progressPct = Math.min(100, Math.round((completedSize / totalApps) * 100));

  return (
    <div style={{
      margin: "0 14px 14px",
      background: C.surface,
      border: `1.5px solid ${C.border}`,
      borderRadius: 14,
      padding: "14px 14px 12px",
      boxShadow: "0 2px 8px rgba(40,30,20,0.04)",
      fontFamily: '"Noto Serif JP", "Hiragino Mincho ProN", "Yu Mincho", serif'
    }}>
      {/* Top row: streak + progress */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
        <div style={{
          textAlign: "center",
          padding: "8px 10px",
          background: `linear-gradient(135deg, #fff8e8, ${C.goldLight})`,
          border: `1px solid ${C.gold}`,
          borderRadius: 10,
          minWidth: 70
        }}>
          <div style={{ fontSize: 22, lineHeight: 1 }}>🔥</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.goldDim, lineHeight: 1.1, marginTop: 2 }}>{streak.count || 0}<span style={{ fontSize: 10, fontWeight: 600, marginLeft: 2 }}>日</span></div>
          <div style={{ fontSize: 8, color: C.textMuted, marginTop: 2 }}>最長 {streak.longest || 0}日</div>
        </div>
        <div style={{ flex: 1, fontFamily: "sans-serif" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.textSub, marginBottom: 4 }}>
            <span style={{ fontWeight: 700 }}>📚 進捗</span>
            <span>{completedSize} / {totalApps} 本（{progressPct}%）</span>
          </div>
          <div style={{ height: 8, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progressPct}%`, background: `linear-gradient(90deg, ${C.gold}, ${C.goldDim})`, transition: "width 0.4s ease" }} />
          </div>
          <div style={{ fontSize: 9, color: C.textMuted, marginTop: 4 }}>
            🎴 カテゴリ {catsDoneSize}/{totalCats} 制覇
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, fontFamily: "sans-serif" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.gold }}>🏆 アチーブメント ({unlocked.length}/{achievements.length})</div>
          <button
            onClick={() => setShowAll(s => !s)}
            style={{ background: "transparent", border: "none", color: C.gold, fontSize: 9, cursor: "pointer", textDecoration: "underline" }}
          >
            {showAll ? "獲得済のみ表示" : "全部見る"}
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(64px, 1fr))", gap: 6 }}>
          {shownAchievements.length === 0 && (
            <div style={{ gridColumn: "1 / -1", fontSize: 10, color: C.textMuted, padding: "8px 4px", fontFamily: "sans-serif" }}>
              アプリを実施するとここにバッジが並びます。
            </div>
          )}
          {shownAchievements.map(a => (
            <div
              key={a.id}
              title={`${a.title} — ${a.desc}`}
              style={{
                background: a.unlocked ? C.goldLight : C.bg,
                border: `1px solid ${a.unlocked ? C.gold : C.border}`,
                borderRadius: 8,
                padding: "6px 4px",
                textAlign: "center",
                opacity: a.unlocked ? 1 : 0.45,
                transition: "all 0.2s",
                fontFamily: "sans-serif"
              }}
            >
              <div style={{ fontSize: 20, lineHeight: 1, filter: a.unlocked ? "none" : "grayscale(1)" }}>{a.emoji,}</div>
              <div style={{ fontSize: 8, color: C.goldDim, fontWeight: 700, marginTop: 2, lineHeight: 1.2, minHeight: 18 }}>
                {a.title}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
