import React, { useState, useEffect } from "react";
import { CODE_HASHES } from "./codeHashes.js";

const C = {
  bg: "#f0ede8", surface: "#ffffff", border: "#c8c0b4",
  gold: "#8a6030", goldDim: "#5a3a10", goldLight: "#f5e8d0",
  text: "#1a1210", textSub: "#3a3028", textMuted: "#6a5e50",
  green: "#1a4a30", red: "#8a3030",
};

// シンプルなMD5実装(短縮ハッシュ用)
async function md5Short(text) {
  const buf = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("MD5", buf).catch(() => null);
  if (hashBuffer) {
    const hex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
    return hex.slice(0, 10);
  }
  // フォールバック: 簡易ハッシュ (Web CryptoでMD5未対応の場合)
  // 実際はSHA-256を10文字に切ったものに切り替える
  const sha = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(sha)).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 10);
}

// ブラウザによってはMD5サポートが無いので、SHA-256で再ハッシュ
// 注: codeHashes.jsもSHA-256ベースに合わせる必要あり
// → 簡易対応: ハッシュ照合は両方試す

const UNLOCK_KEY = "toi_unlocks_v1";
const MASTER_KEY = "toi_master_v1";

function loadUnlocks() {
  try { return JSON.parse(localStorage.getItem(UNLOCK_KEY) || "{}"); }
  catch { return {}; }
}
function saveUnlocks(u) {
  try { localStorage.setItem(UNLOCK_KEY, JSON.stringify(u)); } catch {}
}
function isMasterUnlocked() {
  return localStorage.getItem(MASTER_KEY) === "1";
}
function setMasterUnlocked() {
  try { localStorage.setItem(MASTER_KEY, "1"); } catch {}
}

export default function AppGate({ appId, children }) {
  const [unlocked, setUnlocked] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (isMasterUnlocked()) { setUnlocked(true); return; }
    const u = loadUnlocks();
    if (u[appId]) setUnlocked(true);
  }, [appId]);

  const tryUnlock = async () => {
    setError(""); setVerifying(true);
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { setError("コードを入力してください"); setVerifying(false); return; }

    try {
      const buf = new TextEncoder().encode(trimmed);
      const sha = await crypto.subtle.digest("SHA-256", buf);
      const hash = Array.from(new Uint8Array(sha)).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 10);

      const expected = CODE_HASHES[appId];
      const masterExpected = CODE_HASHES["MASTER"];

      if (hash === masterExpected) {
        setMasterUnlocked();
        setUnlocked(true);
      } else if (hash === expected) {
        const u = loadUnlocks();
        u[appId] = true;
        saveUnlocks(u);
        setUnlocked(true);
      } else {
        setError("コードが正しくありません");
      }
    } catch (e) {
      setError("照合エラー: " + e.message);
    } finally {
      setVerifying(false);
    }
  };

  if (unlocked) return children;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 380, width: "100%", background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: 20, boxSizing: "border-box" }}>
        <div style={{ fontSize: 36, textAlign: "center", marginBottom: 8 }}>🔐</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.gold, textAlign: "center", marginBottom: 6 }}>
          アプリ #{appId}
        </div>
        <div style={{ fontSize: 11, color: C.textSub, textAlign: "center", marginBottom: 20, lineHeight: 1.7 }}>
          このアプリは200の問いシリーズの有料コンテンツです<br />
          note記事の有料エリアに記載のアクセスコードを入力してください
        </div>

        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") tryUnlock(); }}
          placeholder={`例: TOI-${appId}-XXXX`}
          autoFocus
          style={{ width: "100%", background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "12px 10px", fontSize: 12, fontFamily: "monospace", marginBottom: 10, color: C.text, textAlign: "center", letterSpacing: 0.5, boxSizing: "border-box" }}
        />

        {error && <div style={{ fontSize: 11, color: C.red, marginBottom: 10, textAlign: "center" }}>⚠️ {error}</div>}

        <button
          onClick={tryUnlock}
          disabled={verifying || !code.trim()}
          style={{ width: "100%", padding: "12px 0", background: verifying || !code.trim() ? "#ccc" : `linear-gradient(135deg,${C.gold},${C.goldDim})`, border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 700, cursor: verifying || !code.trim() ? "default" : "pointer" }}
        >
          {verifying ? "🌀 照合中..." : "🔓 アンロック"}
        </button>

        <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${C.border}`, fontSize: 10, color: C.textMuted, lineHeight: 1.7 }}>
          💡 <strong>コード入手方法</strong>:<br />
          ・noteで個別購入(¥500): 該当アプリのコード入手<br />
          ・noteメンバーシップ加入: マスターコードで全アプリ解除
        </div>

        <div style={{ marginTop: 14, textAlign: "center" }}>
          <a href="/" style={{ fontSize: 11, color: C.gold, textDecoration: "underline" }}>← カタログに戻る</a>
        </div>
      </div>
    </div>
  );
}
