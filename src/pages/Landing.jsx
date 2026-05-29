import React from "react";
import { Link, useNavigate } from "react-router-dom";

/**
 * Landing.jsx
 * 公開ヒーロー画面 — 初見訪問者向け。
 * - コンセプト訴求
 * - 無料お試し3問へ誘導
 * - 既にコード持ってる人は /catalog へ
 * - note記事への購入導線
 */

const C = {
  bg: "#f0ede8",
  surface: "#ffffff",
  gold: "#8a6030",
  goldDim: "#5a3a10",
  goldLight: "#f5e8d0",
  text: "#1a1210",
  textSub: "#3a3028",
};

export default function Landing() {
  const nav = useNavigate();
  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        fontFamily: '"Hiragino Mincho ProN","Yu Mincho","Noto Serif JP",serif',
        color: C.text,
      }}
    >
      <div style={{ maxWidth: 540, margin: "0 auto", padding: "0 16px" }}>
        {/* Hero */}
        <header
          style={{
            padding: "56px 8px 36px",
            textAlign: "center",
            background: `radial-gradient(circle at top,${C.goldLight} 0%,transparent 70%)`,
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.35em",
              color: C.gold,
              marginBottom: 14,
              fontFamily: "system-ui,sans-serif",
            }}
          >
            SAMURAI AESTHETICS
          </div>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 900,
              color: C.goldDim,
              lineHeight: 1.3,
              marginBottom: 14,
              letterSpacing: "-0.01em",
            }}
          >
            苦徹成珠
            <br />
            侍の美学
          </h1>
          <p
            style={{
              fontSize: 14,
              color: C.textSub,
              lineHeight: 1.9,
              maxWidth: 380,
              margin: "0 auto 28px",
              fontFamily: "system-ui,sans-serif",
            }}
          >
            全ての成熟した悩める大人へ。
            <br />
            6軸の自己分析と200の問いで、
            <br />
            自分の現在地と本質を可視化する。
          </p>
          <button
            onClick={() => nav("/sample")}
            style={{
              padding: "16px 36px",
              borderRadius: 999,
              background: `linear-gradient(135deg,${C.gold},${C.goldDim})`,
              color: "#fff",
              border: "none",
              fontSize: 15,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 8px 24px rgba(138,96,48,0.35)",
              fontFamily: "system-ui,sans-serif",
            }}
          >
            🌀 3問で自分を診断（無料）
          </button>
        </header>

        {/* Value props */}
        <section style={{ padding: "20px 4px 30px" }}>
          {[
            {
              icon: "🎯",
              title: "6軸レーダー診断",
              text: "決断力 / 精神力 / 適応力 / 洞察力 / 規律心 / 大義 — 6つの軸であなたの内面を可視化",
            },
            {
              icon: "📜",
              title: "200の問い",
              text: "心理学・古典・現代思想を侍の視座で再編した、ここでしか出会えない問い",
            },
            {
              icon: "🔄",
              title: "成長を記録",
              text: "回答履歴とレーダーの推移であなたの変化を見える化",
            },
          ].map((v, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 14,
                alignItems: "flex-start",
                padding: "16px 14px",
                background: C.surface,
                borderRadius: 14,
                border: `1px solid ${C.goldLight}`,
                marginBottom: 10,
              }}
            >
              <div style={{ fontSize: 30, flexShrink: 0 }}>{v.icon}</div>
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: C.goldDim,
                    marginBottom: 4,
                    fontFamily: "system-ui,sans-serif",
                  }}
                >
                  {v.title}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: C.textSub,
                    lineHeight: 1.7,
                    fontFamily: "system-ui,sans-serif",
                  }}
                >
                  {v.text}
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* CTA reapeat */}
        <section
          style={{
            padding: "30px 14px 40px",
            background: C.goldLight,
            borderRadius: 16,
            marginBottom: 20,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: C.goldDim,
              marginBottom: 10,
            }}
          >
            まずは無料で試す
          </div>
          <div
            style={{
              fontSize: 12,
              color: C.textSub,
              lineHeight: 1.8,
              marginBottom: 18,
              fontFamily: "system-ui,sans-serif",
            }}
          >
            3問だけ答えれば、あなたの傾向が分かります。
            <br />
            登録もコードも要りません。
          </div>
          <button
            onClick={() => nav("/sample")}
            style={{
              padding: "14px 32px",
              borderRadius: 999,
              background: `linear-gradient(135deg,${C.gold},${C.goldDim})`,
              color: "#fff",
              border: "none",
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "system-ui,sans-serif",
            }}
          >
            診断を始める
          </button>
        </section>

        {/* Pricing — CV optimization (2026-05-29 Phase 3 第1弾) */}
        <section
          style={{
            padding: "26px 18px 30px",
            background: C.surface,
            borderRadius: 16,
            border: `1px solid ${C.goldLight}`,
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.3em",
              color: C.gold,
              marginBottom: 10,
              fontFamily: "system-ui,sans-serif",
            }}
          >
            FULL ACCESS
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: C.goldDim,
              lineHeight: 1.4,
              marginBottom: 6,
            }}
          >
            200の問い、1本ずつ解錠
          </div>
          <div
            style={{
              fontSize: 13,
              color: C.textSub,
              lineHeight: 1.7,
              marginBottom: 18,
              fontFamily: "system-ui,sans-serif",
            }}
          >
            note記事1本 = 該当の問い1ページが永久に開く
          </div>
          {/* 価格表記の心理学的最適化: anchor + decoy + 比喩 */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "baseline",
              gap: 6,
              marginBottom: 6,
              fontFamily: "system-ui,sans-serif",
            }}
          >
            <span style={{ fontSize: 14, color: C.textSub }}>¥</span>
            <span
              style={{
                fontSize: 44,
                fontWeight: 900,
                color: C.goldDim,
                lineHeight: 1,
              }}
            >
              100
            </span>
            <span style={{ fontSize: 13, color: C.textSub }}>/ 一度きり</span>
          </div>
          <div
            style={{
              fontSize: 11,
              color: C.textSub,
              marginBottom: 18,
              fontFamily: "system-ui,sans-serif",
            }}
          >
            ☕ 缶コーヒー1本以下 ・ 税込 ・ 買い切り（月額なし）
          </div>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: "0 0 20px",
              fontSize: 12,
              color: C.textSub,
              lineHeight: 1.9,
              fontFamily: "system-ui,sans-serif",
              textAlign: "left",
              maxWidth: 320,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            <li>✓ 該当ページのコード入力 → 永久閲覧</li>
            <li>✓ AI対話プロンプト・テンプレ・実用ワークシート付</li>
            <li>✓ 30日チャレンジ + 5項目セルフチェック</li>
            <li>✓ 失敗回避リスト + 体験談</li>
          </ul>
          <a
            href="https://note.com/happy_happy_4649"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              padding: "14px 32px",
              borderRadius: 999,
              background: `linear-gradient(135deg,${C.gold},${C.goldDim})`,
              color: "#fff",
              fontSize: 14,
              fontWeight: 800,
              textDecoration: "none",
              fontFamily: "system-ui,sans-serif",
              boxShadow: "0 6px 18px rgba(138,96,48,0.25)",
            }}
          >
            📜 noteで1本選んで購入する
          </a>
          <div
            style={{
              fontSize: 10,
              color: C.textSub,
              marginTop: 12,
              fontFamily: "system-ui,sans-serif",
              opacity: 0.85,
            }}
          >
            購入後、記事内のアクセスコードを下の「コード入力」へ
          </div>
        </section>

        {/* Already have code */}
        <section
          style={{
            padding: "20px 14px",
            borderTop: `1px solid ${C.goldLight}`,
            marginTop: 20,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: C.textSub,
              marginBottom: 10,
              fontFamily: "system-ui,sans-serif",
            }}
          >
            note記事でアクセスコードを購入済みの方
          </div>
          <Link
            to="/catalog"
            style={{
              display: "inline-block",
              padding: "10px 22px",
              borderRadius: 999,
              border: `2px solid ${C.gold}`,
              color: C.gold,
              fontSize: 12,
              fontWeight: 700,
              textDecoration: "none",
              fontFamily: "system-ui,sans-serif",
            }}
          >
            🗝️ コードを入力してカタログを開く
          </Link>
        </section>

        {/* Footer */}
        <footer
          style={{
            padding: "30px 0 50px",
            textAlign: "center",
            fontSize: 10,
            color: C.textSub,
            fontFamily: "system-ui,sans-serif",
            lineHeight: 1.8,
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <a
              href="https://note.com/happy_happy_4649"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: C.gold, marginRight: 14, textDecoration: "none" }}
            >
              📝 note
            </a>
            <a
              href="https://www.youtube.com/@Otona_Psychology"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: C.gold, marginRight: 14, textDecoration: "none" }}
            >
              🧠 大人YT
            </a>
            <a
              href="https://www.youtube.com/@Japanese.Samurai.Channel"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: C.gold, textDecoration: "none" }}
            >
              ⚔️ 歴史YT
            </a>
          </div>
          <div>© 苦徹成珠 · SAMURAI AESTHETICS</div>
        </footer>
      </div>
    </div>
  );
}
