import React from "react";
import { Link } from "react-router-dom";

const C = {
  bg: "#f0ede8",
  surface: "#ffffff",
  gold: "#8a6030",
  goldDim: "#5a3a10",
  goldLight: "#f5e8d0",
  text: "#1a1210",
  textSub: "#3a3028",
};

export default function Drama001() {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: '"Hiragino Mincho ProN","Yu Mincho","Noto Serif JP",serif', color: C.text }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 16px" }}>
        <header style={{ padding: "40px 8px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.35em", color: C.gold, marginBottom: 14, fontFamily: "system-ui,sans-serif" }}>
            音声ドラマ 第1話
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: C.goldDim, lineHeight: 1.4, marginBottom: 14 }}>
            島津義弘 関ヶ原 敵中突破の刻
            <br />
            <span style={{ fontSize: 18, color: C.gold }}>捨て奸の死兵が示した魂</span>
          </h1>
        </header>

        <div style={{ position: "relative", paddingTop: "56.25%", background: "#000", borderRadius: 14, overflow: "hidden", marginBottom: 24, boxShadow: "0 12px 30px rgba(0,0,0,0.18)" }}>
          <iframe
            src="https://www.youtube.com/embed/QYKdjDxSIyM?rel=0"
            title="島津義弘 関ヶ原 敵中突破の刻"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
          />
        </div>

        <section style={{ background: C.surface, border: `1px solid ${C.goldLight}`, borderRadius: 14, padding: "20px 22px", marginBottom: 22 }}>
          <h2 style={{ fontSize: 15, color: C.goldDim, marginBottom: 12, fontWeight: 800 }}>この物語の核心</h2>
          <p style={{ fontSize: 13, lineHeight: 2, color: C.textSub, margin: 0 }}>
            慶長五年九月十五日、関ヶ原。十五万対十五万の戦場で、薩摩の老将・島津義弘は齢六十六、率いる兵わずか千五百で布陣した。
            <br />
            半日で西軍は崩壊、退路は閉ざされる。義弘が選んだのは「敵中突破」──家康の本陣を貫いて駆け抜ける、戦国史上もっとも誇り高い退却劇。
            <br /><br />
            捨て奸（すてがまり）。命を捨てて主君を逃がす死兵の戦法で、千五百のうち薩摩に帰り着いたのはわずか八十余名。
            <br /><br />
            <strong style={{ color: C.goldDim }}>死ぬ覚悟が、生き残る道を開く。</strong>
            これが薩摩武士の哲学であり、三百年後の明治維新を中心となった薩摩藩の伏線となった。
          </p>
        </section>

        <section style={{ background: C.goldLight, borderRadius: 14, padding: "22px 18px", marginBottom: 20, textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.goldDim, marginBottom: 10 }}>
            あなたの「精神力」軸を知る
          </div>
          <div style={{ fontSize: 11, color: C.textSub, lineHeight: 1.7, marginBottom: 16, fontFamily: "system-ui,sans-serif" }}>
            島津義弘の哲学「死ぬ覚悟が生き残る道を開く」──
            <br />
            あなたの中の侍性は、6軸の自己分析で可視化できる。
          </div>
          <Link to="/sample" style={{ display: "inline-block", padding: "12px 28px", borderRadius: 999, background: `linear-gradient(135deg,${C.gold},${C.goldDim})`, color: "#fff", fontSize: 13, fontWeight: 800, textDecoration: "none", marginBottom: 10 }}>
            🌀 7問で自分を診断（無料）
          </Link>
        </section>

        <section style={{ background: C.surface, border: `1px solid ${C.goldLight}`, borderRadius: 14, padding: "18px 18px", marginBottom: 24, textAlign: "center" }}>
          <div style={{ fontSize: 12, color: C.textSub, lineHeight: 1.7, marginBottom: 14 }}>
            さらに深く問う──200の問いから「精神力」を磨くアプリ
          </div>
          <a href="https://note.com/happy_happy_4649" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", padding: "10px 22px", borderRadius: 999, border: `2px solid ${C.gold}`, color: C.gold, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
            📜 note の問い一覧へ
          </a>
        </section>

        <div style={{ textAlign: "center", padding: "20px 0 40px" }}>
          <Link to="/" style={{ fontSize: 11, color: C.textSub, textDecoration: "none" }}>
            ← トップに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
