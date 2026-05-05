import React, { lazy, Suspense, useState, useEffect, useMemo } from "react";
import { BrowserRouter, Routes, Route, useParams, Link, useNavigate } from "react-router-dom";
import AppGate from "./AppGate.jsx";
import QuickAnalyze from "./QuickAnalyze.jsx";

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

function MasterOnlyGate({ children }) {
  // 初回レンダー時に同期判定 (useEffect だと一瞬空白になる問題を回避)
  const unlocked = (() => {
    try { return localStorage.getItem("toi_master_v1") === "1"; }
    catch { return false; }
  })();
  if (unlocked) return children;
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, boxSizing: "border-box" }}>
      <div style={{ maxWidth: 380, width: "100%", background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: 24, boxSizing: "border-box", textAlign: "center" }}>
        <div style={{ fontSize: 44, marginBottom: 10 }}>🔒</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.gold, marginBottom: 8 }}>メンバーのみ利用可能</div>
        <div style={{ fontSize: 11, color: C.textSub, lineHeight: 1.7, marginBottom: 16 }}>
          このアプリ(#000 メタ人格分析)は<br />
          <strong>メンバーシップ加入者専用</strong>です<br />
          マスターコードを入力するとアクセスできます
        </div>
        <Link to="/" style={{ display: "inline-block", padding: "10px 20px", background: `linear-gradient(135deg,${C.gold},${C.goldDim})`, color: "#fff", borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>← カタログに戻る</Link>
      </div>
    </div>
  );
}

function PageRoute() {
  const { id } = useParams();
  const path = `./pages/Page${id}.jsx`;
  const loader = pageModules[path];
  if (!loader) return <NotFound />;
  const Component = useMemo(() => lazy(loader), [path]);

  // #000はメンバー専用
  if (id === "000") {
    return (
      <MasterOnlyGate>
        <div>
          <BackBar />
          <Suspense fallback={<Loading />}>
            <Component />
          </Suspense>
        </div>
      </MasterOnlyGate>
    );
  }

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
  const [showAnalyze, setShowAnalyze] = useState(false);
  const openChatGPT = async () => {
    let prompt = "";
    try { prompt = await navigator.clipboard.readText(); } catch (e) {}
    let url = "https://chatgpt.com/";
    if (prompt && prompt.length > 5 && prompt.length <= 1500) {
      url = `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`;
    } else if (prompt && prompt.length > 1500) {
      try { await navigator.clipboard.writeText(prompt); } catch {}
    }
    window.open(url, "_blank", "noopener");
  };
  return (
    <>
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "8px 10px", display: "flex", alignItems: "center", gap: 4, maxWidth: 540, margin: "0 auto", boxSizing: "border-box" }}>
        <button onClick={() => navigate("/")} style={{ background: "transparent", border: "none", color: C.gold, fontSize: 11, cursor: "pointer", padding: "4px 6px" }}>
          ← カタログ
        </button>
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowAnalyze(true)} title="クリップボードと履歴から簡易分析" style={{ background: C.goldBg, border: `1px solid ${C.borderActive}`, color: C.gold, fontSize: 10, cursor: "pointer", padding: "5px 7px", borderRadius: 6, fontWeight: 700 }}>
          📊 簡易分析
        </button>
        <button onClick={openChatGPT} title="ChatGPTでプロンプト分析" style={{ background: C.goldBg, border: `1px solid ${C.borderActive}`, color: C.gold, fontSize: 10, cursor: "pointer", padding: "5px 7px", borderRadius: 6, fontWeight: 700 }}>
          🤖 AI起動
        </button>
        <button onClick={() => navigate("/000")} style={{ color: C.gold, fontSize: 10, padding: "5px 7px", borderRadius: 6, background: C.goldBg, border: `1px solid ${C.borderActive}`, fontWeight: 700, cursor: "pointer" }}>
          🧬 #000
        </button>
      </div>
      {showAnalyze && <QuickAnalyze onClose={() => setShowAnalyze(false)} />}
    </>
  );
}

function CatalogGate({ children }) {
  // カタログはマスターキーのみで閲覧可能 (個別コードはアプリ単体に効く)
  const [unlocked, setUnlocked] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("toi_master_v1") === "1") setUnlocked(true);
  }, []);

  const tryUnlock = async () => {
    setError(""); setVerifying(true);
    const trimmed = code.trim().toUpperCase();
    try {
      const buf = new TextEncoder().encode(trimmed);
      const sha = await crypto.subtle.digest("SHA-256", buf);
      const hash = Array.from(new Uint8Array(sha)).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 10);
      // 動的にCODE_HASHESを取得 (循環import回避)
      const { CODE_HASHES } = await import("./codeHashes.js");
      if (hash === CODE_HASHES["MASTER"]) {
        localStorage.setItem("toi_master_v1", "1");
        setUnlocked(true);
      } else {
        setError("マスターコードが正しくありません");
      }
    } catch (e) {
      setError("照合エラー");
    } finally { setVerifying(false); }
  };

  if (unlocked) return children;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", boxSizing: "b