import React, { lazy, Suspense, useState, useEffect, useMemo } from "react";
import { BrowserRouter, Routes, Route, useParams, Link, useNavigate } from "react-router-dom";
import AppGate from "./AppGate.jsx";

// Vite glob import - 全Page*.jsxを動的に発見
const pageModules = import.meta.glob("./pages/Page*.jsx");

const C = {
  bg: "#f0ede8", surface: "#ffffff", surface2: "#e8e4de", surface3: "#ddd8d0",
  border: "#c8c0b4", borderActive: "#8a6030",
  gold: "#8a6030", goldLight: "#f5e8d0", goldDim: "#5a3a10",
  goldBg: "rgba(138,96,48,0.08)", text: "#1a1210",
  textSub: "#3a3028", textMuted: "#6a5e50",
};

// 200本のメタデータ (カタログ用)
import { APP_INDEX } from "./appIndex.js";

function Loading() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: C.gold, fontSize: 14 }}>
      🌀 読み込み中...
    </div>
  );
}

function NotFound() {
  return (
    <div style={{ minHeight: "100vh", padding: 40, textAlign: "center", background: C.bg }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🤔</div>
      <div style={{ fontSize: 18, color: C.gold, fontWeight: 700, marginBottom: 12 }}>そのアプリは見つかりません</div>
      <Link to="/" style={{ color: C.gold }}>← カタログに戻る</Link>
    </div>
  );
}

function PageRoute() {
  const { id } = useParams();
  const path = `./pages/Page${id}.jsx`;
  const loader = pageModules[path];
  if (!loader) return <NotFound />;
  const Component = useMemo(() => lazy(loader), [path]);
  return (
    <AppGate appId={id}>
      <div>
        <BackBar />
        <Suspense fallback={<Loading />}>
          <Component />
        </Suspense>
      </div>
    </AppGate>
  );
}

function BackBar() {
  const navigate = useNavigate();
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 100, background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8, maxWidth: 540, margin: "0 auto" }}>
      <button onClick={() => navigate("/")} style={{ background: "transparent", border: "none", color: C.gold, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
        ← カタログ
      </button>
      <div style={{ flex: 1 }} />
      <Link to="/000" style={{ color: C.gold, textDecoration: "none", fontSize: 11 }}>🧬 人格分析 #000</Link>
    </div>
  );
}

function Catalog() {
  const [search, setSearch] = useState("");
  const [history, setHistory] = useState({});

  useEffect(() => {
    // 各appの履歴件数を集計
    const h = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const m = key && key.match(/^app(\d{2,3})_history_v1$/);
        if (m) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || "[]");
            h[m[1].padStart(3, "0")] = data.length;
          } catch (e) {}
        }
      }
    } catch (e) {}
    setHistory(h);
  }, []);

  const filtered = APP_INDEX.filter(a => {
    if (!search) return true;
    return a.name.includes(search) || a.id.includes(search) || (a.category || "").includes(search);
  });

  const grouped = {};
  for (const a of filtered) {
    const cat = a.category || "その他";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(a);
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "sans-serif", maxWidth: 540, margin: "0 auto" }}>
      {/* ヘッダー */}
      <div style={{ padding: "20px 18px", background: `linear-gradient(135deg,${C.gold},${C.goldDim})`, color: "#fff" }}>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>200の問い シリーズ</div>
        <div style={{ fontSize: 11, color: "#f5e8d0", lineHeight: 1.6 }}>自己理解を深める200本のAI対話アプリ統合スイート</div>
      </div>

      {/* メタアプリへの誘導(目立つカード) */}
      <Link to="/000" style={{ textDecoration: "none" }}>
        <div style={{ margin: 14, padding: 16, background: C.surface, border: `2px solid ${C.borderActive}`, borderRadius: 14, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 36 }}>🧬</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.gold }}>#000 200の問い 人格分析</div>
            <div style={{ fontSize: 10, color: C.textSub, marginTop: 4, lineHeight: 1.6 }}>全アプリ実績から横断的にあなたの人格を可視化する最上位メタアプリ</div>
          </div>
          <div style={{ color: C.gold, fontSize: 18 }}>→</div>
        </div>
      </Link>

      {/* 検索 */}
      <div style={{ padding: "0 14px 14px" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 アプリを検索 (例: 強み、副業、感情)"
          style={{ width: "100%", background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 10, color: C.text, padding: "10px 14px", fontSize: 13 }}
        />
      </div>

      {/* カテゴリ別アプリ一覧 */}
      <div style={{ padding: "0 14px 40px" }}>
        {Object.entries(grouped).map(([cat, apps]) => (
          <div key={cat} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, marginBottom: 8, padding: "0 4px" }}>📂 {cat} ({apps.length}本)</div>
            {apps.map(a => {
              const hcount = history[a.id] || 0;
              return (
                <Link key={a.id} to={`/${a.id}`} style={{ textDecoration: "none" }}>
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontSize: 20 }}>{a.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>#{a.id} {a.name}</div>
                      {hcount > 0 && <div style={{ fontSize: 9, color: C.gold, marginTop: 2 }}>📊 {hcount}回実施済み</div>}
                    </div>
                    <div style={{ color: C.textMuted, fontSize: 14 }}>›</div>
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: C.textMuted, fontSize: 12 }}>
            該当するアプリがありません
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    document.body.style.background = "#f0ede8";
    document.documentElement.style.background = "#f0ede8";
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Catalog />} />
        <Route path="/:id" element={<PageRoute />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
