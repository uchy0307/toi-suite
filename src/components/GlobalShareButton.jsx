import React, { useEffect, useState, useRef } from "react";
import html2canvas from "html2canvas";
import QRCode from "qrcode";

const C = {
  bg: "#f0ede8", surface: "#ffffff",
  border: "#c8c0b4", borderActive: "#8a6030",
  gold: "#8a6030", goldDim: "#5a3a10",
  text: "#1a1210", textSub: "#3a3028", textMuted: "#6a5e50"
};

/**
 * Global floating share button.
 * Appears on every page (except catalog "/") as a fixed FAB.
 * Captures the current viewport via html2canvas, embeds QR + branding,
 * then offers download / X share / LINE share.
 */
export default function GlobalShareButton() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [path, setPath] = useState(typeof window !== "undefined" ? window.location.pathname : "/");
  const captureTargetRef = useRef(null);

  useEffect(() => {
    QRCode.toDataURL("https://toi-suite.vercel.app", { width: 200, margin: 1 }).then(setQrUrl).catch(() => {});
  }, []);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    // Patch pushState/replaceState to also fire onPop
    const orig = { p: history.pushState, r: history.replaceState };
    history.pushState = function (...a) { orig.p.apply(this, a); onPop(); };
    history.replaceState = function (...a) { orig.r.apply(this, a); onPop(); };
    const t = setInterval(() => {
      if (window.location.pathname !== path) setPath(window.location.pathname);
    }, 800);
    return () => {
      window.removeEventListener("popstate", onPop);
      history.pushState = orig.p;
      history.replaceState = orig.r;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show only on /:id paths (not catalog "/")
  const showOn = /^\/[0-9]{3}$/.test(path);
  if (!showOn) return null;

  const captureViewport = async () => {
    setBusy(true);
    try {
      // Capture the main app content (excluding our FAB itself)
      const main = document.querySelector("#root > div") || document.body;
      // Temporarily hide our FAB
      const fab = document.getElementById("__global_share_fab__");
      const prevFab = fab && fab.style.display;
      if (fab) fab.style.display = "none";

      // Add ephemeral branding overlay
      const overlay = document.createElement("div");
      overlay.id = "__share_overlay__";
      overlay.style.cssText = "position:fixed;right:14px;bottom:14px;width:230px;padding:10px;background:#ffffff;border:1.5px solid #8a6030;border-radius:10px;display:flex;align-items:center;gap:10px;z-index:9999;font-family:sans-serif";
      overlay.innerHTML = `
        <div style="flex:1;font-size:11px;color:#5a3a10">
          <div style="font-weight:800;font-size:13px;color:#8a6030">toi-suite</div>
          <div style="color:#6a5e50;font-size:9px">200の問い シリーズ</div>
          <div style="color:#8a6030;font-size:9px;margin-top:2px">toi-suite.vercel.app</div>
        </div>
        ${qrUrl ? `<img src="${qrUrl}" alt="QR" style="width:56px;height:56px" />` : ""}
      `;
      document.body.appendChild(overlay);

      // Allow paint
      await new Promise(r => setTimeout(r, 100));

      const canvas = await html2canvas(document.body, {
        backgroundColor: "#f0ede8",
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
        ignoreElements: (el) => el.id === "__global_share_fab__"
      });

      overlay.remove();
      if (fab) fab.style.display = prevFab || "";

      return canvas.toDataURL("image/png");
    } finally {
      setBusy(false);
    }
  };

  const saveAsImage = async () => {
    const url = await captureViewport();
    if (!url) return;
    if (navigator.share && navigator.canShare) {
      try {
        const blob = await (await fetch(url)).blob();
        const file = new File([blob], "toi-suite-share.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: "200の問い", text: "自己理解アプリ toi-suite" });
          setOpen(false);
          return;
        }
      } catch {}
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = `toi-suite-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setOpen(false);
  };

  const shareX = () => {
    const text = `🪞 200の問い シリーズで自分を映してみた #200の問い #自己理解`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent("https://toi-suite.vercel.app" + path)}`, "_blank", "noopener");
    setOpen(false);
  };

  const shareLINE = () => {
    window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent("https://toi-suite.vercel.app" + path)}`, "_blank", "noopener");
    setOpen(false);
  };

  return (
    <div id="__global_share_fab__" style={{ position: "fixed", right: 14, bottom: 14, zIndex: 9998, fontFamily: "sans-serif" }}>
      {open && (
        <div style={{
          position: "absolute",
          right: 0,
          bottom: 60,
          background: C.surface,
          border: `1.5px solid ${C.borderActive}`,
          borderRadius: 12,
          padding: 10,
          width: 180,
          boxShadow: "0 6px 20px rgba(0,0,0,0.18)"
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.gold, marginBottom: 8, padding: "2px 4px" }}>📤 結果をシェア</div>
          <button onClick={saveAsImage} disabled={busy} style={{ width: "100%", padding: "10px 8px", marginBottom: 6, background: busy ? "#ddd" : C.surface, border: `1.5px solid ${C.borderActive}`, borderRadius: 8, color: C.goldDim, fontSize: 11, fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", textAlign: "left" }}>
            {busy ? "🌀 画像生成中…" : "📷 画像保存"}
          </button>
          <button onClick={shareX} style={{ width: "100%", padding: "10px 8px", marginBottom: 6, background: "#000", border: "none", borderRadius: 8, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", textAlign: "left" }}>
            𝕏 でシェア
          </button>
          <button onClick={shareLINE} style={{ width: "100%", padding: "10px 8px", background: "#06c755", border: "none", borderRadius: 8, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", textAlign: "left" }}>
            💬 LINEでシェア
          </button>
          <div style={{ marginTop: 6, fontSize: 9, color: C.textMuted, textAlign: "center" }}>結果ページで使ってください</div>
        </div>
      )}
      <button
        onClick={() => setOpen(o => !o)}
        title="結果をシェア"
        style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: `linear-gradient(135deg,${C.gold},${C.goldDim})`,
          border: "none",
          color: "#fff",
          fontSize: 22,
          cursor: "pointer",
          boxShadow: "0 4px 14px rgba(138,96,48,0.45)"
        }}
      >
        📤
      </button>
    </div>
  );
}
