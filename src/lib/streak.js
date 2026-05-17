// Streak / engagement tracking utilities
// All data lives in localStorage; no server dependency.

import { APP_INDEX } from "../appIndex.js";

const KEY_STREAK = "toi_streak_v1"; // { lastDate: "YYYY-MM-DD", count: number, longest: number }
const KEY_COMPLETED = "toi_completed_v1"; // [appId, ...] unique

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getStreak() {
  try {
    const raw = localStorage.getItem(KEY_STREAK);
    if (!raw) return { count: 0, longest: 0, lastDate: null };
    const s = JSON.parse(raw);
    // Reset if more than 1 day passed
    if (s.lastDate && s.lastDate !== todayStr() && s.lastDate !== yesterdayStr()) {
      return { count: 0, longest: s.longest || 0, lastDate: s.lastDate };
    }
    return s;
  } catch {
    return { count: 0, longest: 0, lastDate: null };
  }
}

export function recordSession(appId) {
  try {
    // Update streak
    const cur = getStreak();
    const today = todayStr();
    const yesterday = yesterdayStr();
    let next;
    if (cur.lastDate === today) {
      next = cur; // already counted today
    } else if (cur.lastDate === yesterday) {
      next = { count: (cur.count || 0) + 1, lastDate: today, longest: Math.max((cur.count || 0) + 1, cur.longest || 0) };
    } else {
      next = { count: 1, lastDate: today, longest: Math.max(1, cur.longest || 0) };
    }
    localStorage.setItem(KEY_STREAK, JSON.stringify(next));

    // Track completed apps
    if (appId) {
      const raw = localStorage.getItem(KEY_COMPLETED);
      const arr = raw ? JSON.parse(raw) : [];
      if (!arr.includes(appId)) {
        arr.push(appId);
        localStorage.setItem(KEY_COMPLETED, JSON.stringify(arr));
      }
    }
    return next;
  } catch {
    return null;
  }
}

export function getCompletedAppIds() {
  try {
    const raw = localStorage.getItem(KEY_COMPLETED);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  // Fallback: detect from app{N}_history keys
  const set = new Set();
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      const m = k && k.match(/^app(\d{2,3})_history/);
      if (m) {
        const data = JSON.parse(localStorage.getItem(k) || "[]");
        if (Array.isArray(data) && data.length > 0) set.add(m[1].padStart(3, "0"));
      }
    }
  } catch {}
  return set;
}

export function getCompletedCategories() {
  const set = new Set();
  const done = getCompletedAppIds();
  for (const a of APP_INDEX) {
    if (done.has(a.id) && a.category) set.add(a.category);
  }
  return set;
}

export function getTotalAppCount() {
  return APP_INDEX.filter(a => a.id !== "000").length;
}

export function getCategoryCount() {
  const cats = new Set(APP_INDEX.filter(a => a.id !== "000").map(a => a.category).filter(Boolean));
  return cats.size;
}

// Achievement definitions
export const ACHIEVEMENTS = [
  {
    id: "first",
    emoji: "🎯",
    title: "はじめの一歩",
    desc: "最初の1本を実施",
    check: (st) => st.completed.size >= 1
  },
  {
    id: "ten",
    emoji: "⚔️",
    title: "10本制覇",
    desc: "10本のアプリを完了",
    check: (st) => st.completed.size >= 10
  },
  {
    id: "fifty",
    emoji: "🏆",
    title: "50本踏破",
    desc: "50本のアプリを完了",
    check: (st) => st.completed.size >= 50
  },
  {
    id: "hundred",
    emoji: "👑",
    title: "100本踏破",
    desc: "100本のアプリを完了",
    check: (st) => st.completed.size >= 100
  },
  {
    id: "full",
    emoji: "🌟",
    title: "全制覇",
    desc: "全200本を完了",
    check: (st) => st.completed.size >= 200
  },
  {
    id: "streak3",
    emoji: "🔥",
    title: "三日坊主突破",
    desc: "3日連続で実施",
    check: (st) => (st.streak.count || st.streak.longest || 0) >= 3
  },
  {
    id: "streak7",
    emoji: "🌈",
    title: "1週間継続",
    desc: "7日連続で実施",
    check: (st) => (st.streak.count || st.streak.longest || 0) >= 7
  },
  {
    id: "streak30",
    emoji: "💎",
    title: "30日継続",
    desc: "30日連続で実施",
    check: (st) => (st.streak.count || st.streak.longest || 0) >= 30
  },
  {
    id: "allcat",
    emoji: "🎴",
    title: "全カテゴリ踏破",
    desc: "全カテゴリで1本以上を完了",
    check: (st) => st.categoriesDone.size >= st.totalCategories
  },
  {
    id: "meta",
    emoji: "🧬",
    title: "メタの扉",
    desc: "#000 メタ人格分析を実施",
    check: (st) => st.completed.has("000")
  }
];

export function computeState() {
  const streak = getStreak();
  const completed = getCompletedAppIds();
  const categoriesDone = getCompletedCategories();
  const totalCategories = getCategoryCount();
  return { streak, completed, categoriesDone, totalCategories };
}

export function evaluateAchievements() {
  const st = computeState();
  return ACHIEVEMENTS.map(a => ({ ...a, unlocked: a.check(st) }));
}
