import React, { useEffect, useState } from "react";
import { getStreak, evaluateAchievements, getCompletedAppIds, getTotalAppCount, getCategoryCount, getCompletedCategories } from "../lib/streak.js";

const GOLD = "#8a6030";
const GOLD_DIM = "#5a3a10";
const GOLD_LIGHT = "#f5e8d0";
const BORDER = "#c8c0b4";
const BG = "#f0ede8";
const SURFACE = "#ffffff";
const TEXT_MUTED = "#6a5e50";
const TEXT_SUB = "#3a3028";

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
    window.addEventListener("focus", refresh);
    const t = setInterval(refresh, 60000);
    return () => { window.removeEventListener("focus", refresh); clearInterval(t); };
  }, []);

  const unlocked = achievements.filter(a => a.unlocked);
  const shownAchievements = showAll ? achievements : unlocked.slice(0, 4);
  const progressPct = Math.min(100, Math.round((completedSize / totalApps) * 100));

  const wrapStyle = {
    margin: "0 14px 14px",
    background: SURFACE,
    border: "1.5px solid " + BORDER,
    borderRadius: 14,
    padding: "14px 14px 12px",
    boxShadow: "0 2px 8px rgba(40,30,20,0.04)"
  };
  const streakBoxStyle = {
    textAlign: "center",
    padding: "8px 10px",
    background: "linear-gradient(135deg, #fff8e8, " + GOLD_LIGHT + ")",
    border: "1px solid " + GOLD,
    borderRadius: 10,
    minWidth: 70
  };
  const progressFillStyle = {
    height: "100%",
    width: progressPct + "%",
    background: "linear-gradient(90deg, " + GOLD + ", " + GOLD_DIM + ")",
    transition: "width 0.4s ease"
  };

  return (
    <div style={wrapStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
        <div style={streakBoxStyle}>
          <div style={{ fontSize: 22, lineHeight: 1 }}>🔥</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: GOLD_DIM, lineHeight: 1.1, marginTop: 2 }}>
            {streak.count || 0}<span style={{ fontSize: 10, fontWeight: 600, marginLeft: 2 }}>日</span>
          </div>
          <div style={{ fontSize: 8, color: TEXT_MUTED, marginTop: 2 }}>最長 {streak.longest || 0}日</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: TEXT_SUB, marginBottom: 4 }}>
            <span style={{ fontWeight: 700 }}>📚 進捗</span>
            <span>{completedSize} / {totalApps} 本 ({progressPct}%)</span>
          </div>
          <div style={{ height: 8, background: BG, border: "1px solid " + BORDER, borderRadius: 4, overflow: "hidden" }}>
            <div style={progressFillStyle} />
          </div>
          <div style={{ fontSize: 9, color: TEXT_MUTED, marginTop: 4 }}>
            🎴 カテゴリ {catsDoneSize}/{totalCats} 制覇
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px solid " + BORDER, paddingTop: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: GOLD }}>🏆 アチーブメント ({unlocked.length}/{achievements.length})</div>
          <button
            onClick={() => setShowAll(s => !s)}
            style={{ background: "transparent", border: "none", color: GOLD, fontSize: 9, cursor: "pointer", textDecoration: "underline" }}
          >
            {showAll ? "獲得済のみ" : "全部見る"}
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(64px, 1fr))", gap: 6 }}>
          {shownAchievements.length === 0 && (
            <div style={{ gridColumn: "1 / -1", fontSize: 10, color: TEXT_MUTED, padding: "8px 4px" }}>
              アプリを実施するとここにバッジが並びます。
            </div>
          )}
          {shownAchievements.map(a => {
            const badgeStyle = {
              background: a.unlocked ? GOLD_LIGHT : BG,
              border: "1px solid " + (a.unlocked ? GOLD : BORDER),
              borderRadius: 8,
              padding: "6px 4px",
              textAlign: "center",
              opacity: a.unlocked ? 1 : 0.45,
              transition: "all 0.2s"
            };
            const emojiStyle = {
              fontSize: 20,
              lineHeight: 1,
              filter: a.unlocked ? "none" : "grayscale(1)"
            };
            return (
              <div key={a.id} title={a.title + " - " + a.desc} style={badgeStyle}>
                <div style={emojiStyle}>{a.emoji}</div>
                <div style={{ fontSize: 8, color: GOLD_DIM, fontWeight: 700, marginTop: 2, lineHeight: 1.2, minHeight: 18 }}>
                  {a.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
