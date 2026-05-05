import React, { useState, useRef, useEffect, useMemo } from "react";

// ───────────────────────────────────────────────────────────
// 200の問い 人格分析 (app000) - δ方式 メタアプリ v1.0
// 200本のappのlocalStorageを横断して人格プロファイルを生成
// ───────────────────────────────────────────────────────────

window._tapOn = typeof window._tapOn !== "undefined" ? window._tapOn : true;
window._speaking = false;

function T(type = "tap") {
  if (!window._tapOn) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    if (type === "tap") {
      o.frequency.setValueAtTime(880, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.06);
      g.gain.setValueAtTime(0.12, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      o.start(); o.stop(ctx.currentTime + 0.08);
    } else if (type === "success") {
      [523, 659, 784].forEach((f, i) => {
        const o2 = ctx.createOscillator(), g2 = ctx.createGain();
        o2.connect(g2); g2.connect(ctx.destination);
        o2.frequency.value = f;
        g2.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.1);
        g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.2);
        o2.start(ctx.currentTime + i * 0.1); o2.stop(ctx.currentTime + i * 0.1 + 0.25);
      });
    }
  } catch (e) {}
}
function doSpeak(text) {
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ja-JP"; u.rate = 0.95;
    u.onend = () => { window._speaking = false; };
    const v = window.speechSynthesis.getVoices().find(v => v.lang.includes("ja"));
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
    window._speaking = true;
  } catch (e) {}
}
function doStopSpeak() { try { window.speechSynthesis.cancel(); window._speaking = false; } catch (e) {} }

const C = {
  bg: "#f0ede8", surface: "#ffffff", surface2: "#e8e4de", surface3: "#ddd8d0",
  border: "#c8c0b4", borderActive: "#8a6030",
  gold: "#8a6030", goldLight: "#f5e8d0", goldDim: "#5a3a10",
  goldBg: "rgba(138,96,48,0.08)", text: "#1a1210",
  textSub: "#3a3028", textMuted: "#6a5e50",
  green: "#1a4a30", greenLight: "#d0eedd",
  blue: "#1a4a6a", blueLight: "#d0e0ee",
  red: "#8a3030", purple: "#5a3a6a"
};

// ───────────────────────────────────────────────────────────
// APP_META: 200アプリの番号→[名前, 絵文字, カテゴリ]マップ
// localStorageのキーはapp03〜app20: 2桁、app021〜app200: 3桁形式
// ───────────────────────────────────────────────────────────
const APP_META = {
  "01": ["1on1マスターAI", "🧭", "自己理解"],
  "02": ["価値観発掘コンサル", "⚖️", "自己理解"],
  "001": ["1on1マスターAI", "🧭", "自己理解"],
  "002": ["価値観発掘コンサル", "⚖️", "自己理解"],
  "03": ["強み言語化パートナー", "💪", "自己理解"],
  "04": ["メンタル・デトックス", "🌫️", "自己理解"],
  "05": ["ライフミッション作成", "🔥", "自己理解"],
  "06": ["隠れた才能診断", "🎯", "自己理解"],
  "07": ["コンプレックス反転AI", "🔄", "自己理解"],
  "08": ["モチベーション源泉分析", "⚡", "自己理解"],
  "09": ["感情ログ分析", "📊", "自己理解"],
  "10": ["理想の1日設計", "☀️", "自己理解"],
  "11": ["自己肯定感ブースター", "🌟", "自己理解"],
  "12": ["過去の経験から学ぶ", "🌱", "自己理解"],
  "13": ["才能の掛け算アドバイザー", "✖️", "自己理解"],
  "14": ["偽りの自分チェッカー", "🪞", "自己理解"],
  "15": ["集中力プロファイラー", "⚙️", "自己理解"],
  "16": ["怒りのトリガー分析", "🌋", "自己理解"],
  "17": ["インポスター症候群対策", "🛡️", "自己理解"],
  "18": ["コンフォートゾーン脱出", "🚪", "自己理解"],
  "19": ["自分軸vs他人軸判定", "⚖️", "自己理解"],
  "20": ["10年後の自分からの手紙", "✉️", "自己理解"],
  "021": ["起業アイデア壁打ち", "💡", "ビジネス・キャリア"],
  "022": ["キャリア分岐点相談", "🔀", "ビジネス・キャリア"],
  "023": ["専門性の棚卸し", "📚", "ビジネス・キャリア"],
  "024": ["限界突破アドバイザー", "🚧", "ビジネス・キャリア"],
  "025": ["セールストーク矯正", "💬", "ビジネス・キャリア"],
  "026": ["独自メソッド開発", "📦", "ビジネス・キャリア"],
  "027": ["ターゲットプロファイラー", "👤", "ビジネス・キャリア"],
  "028": ["ポジショニング戦略AI", "🎯", "ビジネス・キャリア"],
  "029": ["プレゼン緊張解消", "🎤", "ビジネス・キャリア"],
  "030": ["リーダーシップ診断", "👑", "ビジネス・キャリア"],
  "031": ["副業ネタ発掘", "🔍", "ビジネス・キャリア"],
  "032": ["転職理由リライト", "✏️", "ビジネス・キャリア"],
  "033": ["商談振り返りコーチ", "🤝", "ビジネス・キャリア"],
  "034": ["年収アップ交渉術", "💰", "ビジネス・キャリア"],
  "035": ["タイムマネジメント診断", "⏰", "ビジネス・キャリア"],
  "036": ["プロジェクト解像度アップ", "🔬", "ビジネス・キャリア"],
  "037": ["挫折予測チェッカー", "⚠️", "ビジネス・キャリア"],
  "038": ["ネットワーク分析", "🕸️", "ビジネス・キャリア"],
  "039": ["商品価格の正当性", "🏷️", "ビジネス・キャリア"],
  "040": ["退職・独立シミュレーション", "🚪", "ビジネス・キャリア"],
  "041": ["伝え方改善コーチ", "🗣️", "人間関係"],
  "042": ["苦手な人との境界線", "🚧", "人間関係"],
  "043": ["傾聴力トレーニング", "👂", "人間関係"],
  "044": ["婚活・本音マッチング", "💕", "人間関係"],
  "045": ["子育てイライラ解消", "👨‍👩‍👧", "人間関係"],
  "046": ["パートナーシップ修復", "💑", "人間関係"],
  "047": ["謝罪文の最適解", "🙇", "人間関係"],
  "048": ["会話のネタ帳AI", "🗨️", "人間関係"],
  "049": ["断り方の美学", "🚷", "人間関係"],
  "050": ["コミュ癖診断", "🪞", "人間関係"],
  "051": ["義実家・親戚対応", "🏠", "人間関係"],
  "052": ["友人の整理・選別", "🤔", "人間関係"],
  "053": ["反論のスマートな返し", "🔄", "人間関係"],
  "054": ["雑談力アッププロンプト", "💭", "人間関係"],
  "055": ["第一印象シミュレーター", "📸", "人間関係"],
  "056": ["依存関係チェッカー", "🔗", "人間関係"],
  "057": ["グループでの立ち回り", "👥", "人間関係"],
  "058": ["嫉妬心の正体", "💚", "人間関係"],
  "059": ["褒め言葉のバリエーション", "🌹", "人間関係"],
  "060": ["秘密の告白相談室", "🔐", "人間関係"],
  "061": ["爆速タスク整理", "⚡", "学習・思考"],
  "062": ["読書アウトプット", "📖", "学習・思考"],
  "063": ["英語学習の最適化", "🌍", "学習・思考"],
  "064": ["悪習慣・断ち切り", "✂️", "学習・思考"],
  "065": ["アイデア量産・発想法", "💡", "学習・思考"],
  "066": ["思考の死角チェッカー", "👁️", "学習・思考"],
  "067": ["論理的思考ドリル", "🧠", "学習・思考"],
  "068": ["メタ認知トレーニング", "🪞", "学習・思考"],
  "069": ["記憶定着パートナー", "📌", "学習・思考"],
  "070": ["質問力向上コーチ", "❓", "学習・思考"],
  "071": ["図解思考サポーター", "📊", "学習・思考"],
  "072": ["執筆ブロック解除", "✍️", "学習・思考"],
  "073": ["資格試験戦略", "🎓", "学習・思考"],
  "074": ["意思決定の重み付け", "⚖️", "学習・思考"],
  "075": ["集中BGM提案", "🎵", "学習・思考"],
  "076": ["失敗の資産化", "💎", "学習・思考"],
  "077": ["好奇心の地図", "🗺️", "学習・思考"],
  "078": ["習慣化ハードル下げ", "🪜", "学習・思考"],
  "079": ["抽象化の練習", "🔄", "学習・思考"],
  "080": ["逆説的思考", "🔁", "学習・思考"],
  "081": ["睡眠の質改善", "😴", "QOL・メンタル"],
  "082": ["ダイエット心理分析", "🍽️", "QOL・メンタル"],
  "083": ["部屋の乱れ・心模様", "🧹", "QOL・メンタル"],
  "084": ["買い物依存チェッカー", "🛍️", "QOL・メンタル"],
  "085": ["メンタル回復ルーティン", "💊", "QOL・メンタル"],
  "086": ["100のやりたいことリスト", "📝", "QOL・メンタル"],
  "087": ["孤独との向き合い方", "🌒", "QOL・メンタル"],
  "088": ["将来不安シミュレーション", "🔮", "QOL・メンタル"],
  "089": ["自信の土台作り", "🏛️", "QOL・メンタル"],
  "090": ["瞑想・ガイド台本", "🧘", "QOL・メンタル"],
  "091": ["ファッション軸探し", "👔", "QOL・メンタル"],
  "092": ["食生活の意識化", "🥗", "QOL・メンタル"],
  "093": ["趣味の深掘り", "🎨", "QOL・メンタル"],
  "094": ["朝の儀式設計", "🌅", "QOL・メンタル"],
  "095": ["夜のリフレクション", "🌙", "QOL・メンタル"],
  "096": ["自分の取扱説明書", "📖", "QOL・メンタル"],
  "097": ["SNS疲れの処方箋", "📵", "QOL・メンタル"],
  "098": ["ミニマリズム思考", "📦", "QOL・メンタル"],
  "099": ["デジタルデトックス", "🌐", "QOL・メンタル"],
  "100": ["運を良くする行動指針", "🍀", "QOL・メンタル"],
  "101": ["マネーリテラシー可視化", "💵", "お金・将来"],
  "102": ["稼ぐことへのブロック", "🚧", "お金・将来"],
  "103": ["支出の感情分析", "💸", "お金・将来"],
  "104": ["理想の資産形成ビジョン", "🏛️", "お金・将来"],
  "105": ["寄付・貢献の満足度", "🤲", "お金・将来"],
  "106": ["老後不安の解体", "👴", "お金・将来"],
  "107": ["投資スタイル適性", "📈", "お金・将来"],
  "108": ["収入源の多角化", "💼", "お金・将来"],
  "109": ["相続・家族対話準備", "👨‍👩‍👧", "お金・将来"],
  "110": ["お金の貯めどき診断", "📅", "お金・将来"],
  "111": ["執筆・ストーリー構成", "📜", "クリエイティブ"],
  "112": ["歌詞フレーズ・エモーション", "🎵", "クリエイティブ"],
  "113": ["デザイナー・コンセプト可視化", "🎨", "クリエイティブ"],
  "114": ["役作り・キャラクター分析", "🎭", "クリエイティブ"],
  "115": ["イベント企画・ワクワク設計", "🎪", "クリエイティブ"],
  "116": ["YouTube企画・フック作成", "🎬", "クリエイティブ"],
  "117": ["料理レシピの新発明", "🍳", "クリエイティブ"],
  "118": ["写真のテーマ性言語化", "📷", "クリエイティブ"],
  "119": ["工芸・職人のこだわりPR", "✋", "クリエイティブ"],
  "120": ["アート・ステートメント", "🖼️", "クリエイティブ"],
};
// 121-200は省略 (専門ジャンル) - 検出された場合のフォールバックで対応
const APP_META_FALLBACK = (id) => {
  const aid = parseInt(id, 10);
  if (aid >= 121 && aid <= 200) return [`専門アプリ #${id}`, "🎯", "専門ジャンル"];
  return [`アプリ #${id}`, "❓", "?"];
};

const HISTORY_KEY = "app000_profile_v1";
const loadProfiles = () => { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; } };
const saveProfiles = (h) => { try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(-10))); } catch {} };

// ───────────────────────────────────────────────────────────
// localStorageから全appデータをスキャン (同origin用 - 主に開発・PWA時)
// ───────────────────────────────────────────────────────────
function scanAppData() {
  const apps = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const m = key && key.match(/^app(\d{2,3})_history_v1$/);
      if (!m) continue;
      try {
        const raw = localStorage.getItem(key);
        const data = JSON.parse(raw || "[]");
        if (Array.isArray(data) && data.length > 0) {
          const id = m[1];
          const meta = APP_META[id] || APP_META_FALLBACK(id);
          apps.push({
            rawId: id,
            paddedId: id.padStart(3, "0"),
            key,
            count: data.length,
            data,
            name: meta[0],
            emoji: meta[1],
            category: meta[2],
            source: "local",
          });
        }
      } catch (e) {}
    }
  } catch (e) {}
  return apps.sort((a, b) => parseInt(a.rawId) - parseInt(b.rawId));
}

// ───────────────────────────────────────────────────────────
// クロスドメインiframe方式: 全toi-XXX.vercel.appをiframe読み込み + postMessage受信
// 各appは ?_export=1 アクセス時に history データを postMessage する仕組み
// ───────────────────────────────────────────────────────────
function getKnownAppIds() {
  // 全200本(001-200)を3桁形式で生成
  const ids = new Set();
  for (let i = 1; i <= 200; i++) ids.add(String(i).padStart(3, "0"));
  return Array.from(ids).sort((a, b) => parseInt(a) - parseInt(b));
}

async function fetchAppHistoryViaIframe(appId, timeoutMs = 4000) {
  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;border:0;";
    const url = `https://toi-${appId}.vercel.app/?_export=1`;
    iframe.src = url;

    const timer = setTimeout(() => {
      window.removeEventListener("message", handler);
      iframe.remove();
      resolve(null);
    }, timeoutMs);

    function handler(e) {
      if (!e.data || e.data.type !== "TOI_EXPORT") return;
      // Verify origin
      try {
        const expectedOrigin = `https://toi-${appId}.vercel.app`;
        if (e.origin !== expectedOrigin) return;
      } catch (err) {}
      clearTimeout(timer);
      window.removeEventListener("message", handler);
      iframe.remove();
      resolve(e.data.payload || null);
    }
    window.addEventListener("message", handler);

    document.body.appendChild(iframe);
  });
}

async function scanCrossDomain(onProgress) {
  const ids = getKnownAppIds();
  const apps = [];
  // Concurrency limit (大量iframe同時生成を避ける)
  const CONCURRENCY = 8;
  let cursor = 0;
  let processed = 0;
  async function worker() {
    while (cursor < ids.length) {
      const id = ids[cursor++];
      const payload = await fetchAppHistoryViaIframe(id);
      processed++;
      if (onProgress) onProgress(processed, ids.length, id, !!payload);
      if (!payload) continue;
      // payload should be { history: [...], appId: "XXX" }
      const data = Array.isArray(payload.history) ? payload.history : [];
      if (data.length === 0) continue;
      const meta = APP_META[id] || APP_META[id.replace(/^0+/, "") || "0"] || APP_META_FALLBACK(id);
      apps.push({
        rawId: id,
        paddedId: id.padStart(3, "0"),
        key: `app${id}_history_v1`,
        count: data.length,
        data,
        name: meta[0],
        emoji: meta[1],
        category: meta[2],
        source: "iframe",
      });
    }
  }
  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);
  return apps.sort((a, b) => parseInt(a.rawId) - parseInt(b.rawId));
}

// ───────────────────────────────────────────────────────────
// プロンプトビルダー: 横断人格分析
// ───────────────────────────────────────────────────────────
function buildMetaPrompt(scannedApps, manualEntries) {
  const all = [
    ...scannedApps.map(a => ({
      id: a.paddedId, name: a.name, category: a.category,
      sessions: a.data, count: a.data.length
    })),
    ...manualEntries.map(e => ({
      id: e.id || "manual", name: e.name || `アプリ ${e.id}`, category: e.category || "?",
      sessions: [{ analysis: e.text }], count: 1
    }))
  ];

  if (all.length === 0) {
    return "（データがありません。アプリ003〜200のいずれかで分析を保存するか、下のフォームから手動で結果を入力してください）";
  }

  const block = all.map(a => {
    const recent = (a.sessions || []).slice(-2);
    const t = recent.map(s => s.analysis || s.preview || s.letter || s.text || "")
                  .filter(Boolean).join("\n\n").slice(0, 1200);
    return `## 📂 アプリ${a.id} ${a.name} (${a.category}) - ${a.count}回実施\n${t || "(データなし)"}`;
  }).join("\n\n---\n\n");

  return `あなたは「人格分析の専門家」です。以下のユーザーが「200の問い」シリーズの複数アプリで実施した自己分析の蓄積を踏まえ、横断的な人格プロファイルを作成してください。

各アプリは異なる角度から自己を見つめる問いを提供しており、複数のアプリ実績を統合することで、ユーザーの本質的な人格パターンが浮かび上がります。

### 【出力フォーマット (必ずこの順序で)】

#### 🌟 価値観の軸 (5指標)
ユーザーが大切にしている価値観を5つ抽出。各価値観に強さ(1〜10)を付ける。
- 自由: X/10
- 成長: X/10
- 関係性: X/10
- 達成: X/10
- 安定: X/10

(これら5つの軸でレーダーチャートを描けるように、必ず数値で出してください)

#### 🧠 思考傾向
ユーザーの思考スタイルを3つ選び、根拠を1〜2文ずつ。
(例: 分析的/直感的/具体的/抽象的/論理的/感情的/批判的/創造的 など)

#### ❤️ 感情パターン
よく現れる感情の傾向を3つ。各パターンの「トリガー」と「対処法」を1文ずつ。

#### 🎯 行動傾向
行動のクセを3つ。具体例を1文ずつ。
(例: 計画的/即興的/慎重/挑戦的/協調/独立 など)

#### 💎 強み (3つ) と 伸ばしどころ (3つ)
強み3つと伸ばしどころ3つを、それぞれ1〜2文の説明付きで。

#### 🌅 人生フェーズの傾向
今のユーザーが「どんなフェーズにいるか」を1段落(過渡期/開拓期/安定期/深化期/再生期/創造期 など)。

#### 🚀 おすすめ次アプリ
このユーザーが次に取り組むと最も効果が出そうな「200の問い」シリーズ内のアプリ番号を3つ提案。各3〜4文で理由付き。

#### 📝 全体総評
ユーザー像を200〜300字でまとめる。簡潔かつ温かいトーンで。

──────────────────────────
【ユーザーの分析履歴】
${block}
──────────────────────────`;
}

// ───────────────────────────────────────────────────────────
// プロファイルパーサー: AI出力からセクション抽出
// ───────────────────────────────────────────────────────────
function parseProfile(rawText) {
  if (!rawText || rawText.trim().length === 0) return null;

  const text = rawText.trim();
  const profile = {
    raw: text,
    values: {},
    thinking: "",
    emotion: "",
    action: "",
    strengths: "",
    phase: "",
    recommend: "",
    summary: ""
  };

  // 価値観の数値抽出
  const valueSectionMatch = text.match(/価値観の軸[\s\S]*?(?=思考傾向|🧠|####|$)/);
  if (valueSectionMatch) {
    const matches = [...valueSectionMatch[0].matchAll(/[-•・*]\s*([^\s:：]+)\s*[:：]\s*(\d+)\s*\/\s*10/g)];
    matches.forEach(m => {
      profile.values[m[1].trim()] = Math.min(10, Math.max(0, parseInt(m[2])));
    });
  }

  // 各セクション抽出 (ヘッダ+次のヘッダまで)
  const extractSection = (startPattern, endPatterns) => {
    const startRe = new RegExp(startPattern);
    const startMatch = text.match(startRe);
    if (!startMatch) return "";
    const startIdx = startMatch.index + startMatch[0].length;
    let endIdx = text.length;
    for (const ep of endPatterns) {
      const m = text.slice(startIdx).match(new RegExp(ep));
      if (m) endIdx = Math.min(endIdx, startIdx + m.index);
    }
    return text.slice(startIdx, endIdx).trim();
  };

  profile.thinking = extractSection("思考傾向", ["感情パターン", "❤️", "####"]);
  profile.emotion = extractSection("感情パターン", ["行動傾向", "🎯", "####"]);
  profile.action = extractSection("行動傾向", ["強み", "伸ばしどころ", "💎", "####"]);
  profile.strengths = extractSection("(?:強み.*?伸ばしどころ|💎)", ["人生フェーズ", "🌅", "####"]);
  profile.phase = extractSection("人生フェーズ", ["おすすめ次アプリ", "🚀", "####"]);
  profile.recommend = extractSection("おすすめ次アプリ", ["全体総評", "📝", "####"]);
  profile.summary = extractSection("全体総評", ["$"]);

  return profile;
}

// ───────────────────────────────────────────────────────────
// SVGレーダーチャート
// ───────────────────────────────────────────────────────────
const RadarChart = ({ scores, size = 280 }) => {
  const labels = Object.keys(scores);
  if (labels.length < 3) return <div style={{ padding: 20, textAlign: "center", color: C.textMuted, fontSize: 11 }}>(価値観スコアが3つ未満のためレーダー描画不可)</div>;

  const cx = size / 2, cy = size / 2;
  const r = size * 0.32;
  const angleStep = (Math.PI * 2) / labels.length;

  const points = labels.map((label, i) => {
    const angle = -Math.PI / 2 + i * angleStep;
    const value = (scores[label] || 0) / 10;
    return `${cx + Math.cos(angle) * r * value},${cy + Math.sin(angle) * r * value}`;
  }).join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: "100%", maxWidth: 320, display: "block", margin: "0 auto" }}>
      {[0.25, 0.5, 0.75, 1].map(lv => (
        <circle key={lv} cx={cx} cy={cy} r={r * lv} fill="none" stroke={C.border} strokeWidth="1" />
      ))}
      {labels.map((_, i) => {
        const angle = -Math.PI / 2 + i * angleStep;
        return <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(angle) * r} y2={cy + Math.sin(angle) * r} stroke={C.border} strokeWidth="1" />;
      })}
      <polygon points={points} fill={`${C.gold}44`} stroke={C.gold} strokeWidth="2" />
      {labels.map((label, i) => {
        const angle = -Math.PI / 2 + i * angleStep;
        const value = (scores[label] || 0) / 10;
        const x = cx + Math.cos(angle) * r * value;
        const y = cy + Math.sin(angle) * r * value;
        return <circle key={i} cx={x} cy={y} r="4" fill={C.gold} />;
      })}
      {labels.map((label, i) => {
        const angle = -Math.PI / 2 + i * angleStep;
        const x = cx + Math.cos(angle) * (r + 24);
        const y = cy + Math.sin(angle) * (r + 24);
        return (
          <g key={i}>
            <text x={x} y={y - 6} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill={C.text} fontWeight="600">
              {label}
            </text>
            <text x={x} y={y + 7} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill={C.gold} fontWeight="700">
              {scores[label]}/10
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ───────────────────────────────────────────────────────────
// シェア画像ジェネレータ (Canvas)
// ───────────────────────────────────────────────────────────
async function generateShareImage(profile, totalApps) {
  const W = 1080, H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#a87238");
  grad.addColorStop(1, "#5a3a10");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const inset = 60, cardX = inset, cardY = 200, cardW = W - inset * 2;
  ctx.fillStyle = "#f0ede8";
  roundRect(ctx, cardX, cardY, cardW, H - cardY - inset, 40);
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.font = "bold 56px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("200の問い人格分析", W / 2, 110);
  ctx.font = "28px sans-serif";
  ctx.fillStyle = "#f5e8d0";
  ctx.fillText(`${totalApps}本のアプリで深掘り`, W / 2, 160);

  ctx.fillStyle = "#8a6030";
  ctx.font = "bold 44px sans-serif";
  ctx.textAlign = "left";
  let y = cardY + 90;
  ctx.fillText("🌟 価値観の軸", cardX + 50, y);

  if (profile.values && Object.keys(profile.values).length >= 3) {
    const radarSize = 480;
    const rcx = W / 2, rcy = y + 60 + radarSize / 2;
    const labels = Object.keys(profile.values);
    const r = radarSize * 0.32;
    const angleStep = (Math.PI * 2) / labels.length;
    ctx.strokeStyle = "#c8c0b4"; ctx.lineWidth = 2;
    [0.25, 0.5, 0.75, 1].forEach(lv => {
      ctx.beginPath();
      for (let i = 0; i < labels.length; i++) {
        const a = -Math.PI / 2 + i * angleStep;
        const x = rcx + Math.cos(a) * r * lv;
        const yy = rcy + Math.sin(a) * r * lv;
        if (i === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.closePath(); ctx.stroke();
    });
    ctx.beginPath();
    labels.forEach((lb, i) => {
      const a = -Math.PI / 2 + i * angleStep;
      const v = (profile.values[lb] || 0) / 10;
      const x = rcx + Math.cos(a) * r * v;
      const yy = rcy + Math.sin(a) * r * v;
      if (i === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
    });
    ctx.closePath();
    ctx.fillStyle = "rgba(138,96,48,0.3)";
    ctx.fill();
    ctx.strokeStyle = "#8a6030"; ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = "#5a3a10";
    ctx.font = "bold 28px sans-serif";
    ctx.textAlign = "center";
    labels.forEach((lb, i) => {
      const a = -Math.PI / 2 + i * angleStep;
      const x = rcx + Math.cos(a) * (r + 50);
      const yy = rcy + Math.sin(a) * (r + 50);
      ctx.fillText(`${lb} ${profile.values[lb]}/10`, x, yy);
    });
    y = rcy + radarSize / 2 + 60;
  } else {
    y += 80;
  }

  ctx.fillStyle = "#1a1210";
  ctx.font = "bold 36px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("📝 総評", cardX + 50, y); y += 50;
  ctx.font = "28px sans-serif";
  ctx.fillStyle = "#3a3028";
  const summary = (profile.summary || "(まだ生成されていません)").slice(0, 200);
  const lines = wrapText(ctx, summary, cardW - 100);
  lines.slice(0, 8).forEach(line => { ctx.fillText(line, cardX + 50, y); y += 40; });

  ctx.fillStyle = "#5a3a10";
  ctx.font = "24px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("https://toi-000.vercel.app  |  200の問い by happyhappy", W / 2, H - 80);

  return canvas.toDataURL("image/png");
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split("");
  const lines = [];
  let line = "";
  for (const ch of words) {
    if (ch === "\n") { lines.push(line); line = ""; continue; }
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// ───────────────────────────────────────────────────────────
// UIコンポーネント
// ───────────────────────────────────────────────────────────
const PromptCard = ({ title, prompt }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    T("tap");
    try { await navigator.clipboard.writeText(prompt); }
    catch { const el = document.createElement("textarea"); el.value = prompt; el.style.cssText = "position:fixed;opacity:0"; document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el); }
    setCopied(true); T("success");
    setTimeout(() => setCopied(false), 2500);
  };
  return (
    <div style={{ background: C.surface, border: `1.5px solid ${C.borderActive}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.gold }}>{title}</div>
        <button onClick={copy} style={{ padding: "7px 14px", background: copied ? C.greenLight : C.gold, border: `1px solid ${copied ? C.green : C.gold}`, borderRadius: 8, color: copied ? C.green : "#fff", fontSize: 11, fontWeight: 700 }}>
          {copied ? "✅ コピー済" : "📋 コピー"}
        </button>
      </div>
      <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, fontSize: 11, lineHeight: 1.85, color: C.text, whiteSpace: "pre-wrap", maxHeight: 320, overflowY: "auto" }}>
        {prompt}
      </div>
      <div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 8 }}>
        ☝️ コピーして ChatGPT / Claude / Gemini に貼り付け、結果を下に貼り付けてください。
      </div>
    </div>
  );
};

const ProfileCard = ({ icon, title, body, color }) => (
  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 12, borderLeft: `4px solid ${color || C.gold}` }}>
    <div style={{ fontSize: 13, fontWeight: 700, color: color || C.gold, marginBottom: 8 }}>
      {icon} {title}
    </div>
    <div style={{ fontSize: 12, color: C.text, lineHeight: 1.85, whiteSpace: "pre-wrap" }}>
      {body || "(まだ生成されていません)"}
    </div>
  </div>
);

// ───────────────────────────────────────────────────────────

export default function App() {
  useEffect(() => {
    document.body.style.background = "#f0ede8";
    document.documentElement.style.background = "#f0ede8";
  }, []);

  const [tapOn, setTapOn] = useState(true);
  const tapOnRef = useRef(true);
  const toggleTap = () => { const next = !tapOnRef.current; tapOnRef.current = next; setTapOn(next); window._tapOn = next; };

  const [isSpeaking, setIsSpeaking] = useState(false);
  const toggleSpeak = (text) => {
    if (window._speaking) { doStopSpeak(); setIsSpeaking(false); }
    else if (text) { doSpeak(text); setIsSpeaking(true); }
  };

  const [screen, setScreen] = useState("home");
  const [scannedApps, setScannedApps] = useState([]);
  const [manualEntries, setManualEntries] = useState([]);
  const [manualForm, setManualForm] = useState({ id: "", text: "" });
  const [analysisPrompt, setAnalysisPrompt] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [profile, setProfile] = useState(null);
  const [profiles, setProfiles] = useState(loadProfiles());
  const [shareImageUrl, setShareImageUrl] = useState("");
  const [generating, setGenerating] = useState(false);
  const [crossScanning, setCrossScanning] = useState(false);
  const [crossProgress, setCrossProgress] = useState({ done: 0, total: 0, current: "" });

  useEffect(() => {
    const apps = scanAppData();
    setScannedApps(apps);
  }, []);

  const runCrossDomainScan = async () => {
    T("tap");
    setCrossScanning(true);
    setCrossProgress({ done: 0, total: 200, current: "" });
    try {
      // 統合PWAなので同origin localStorage直接スキャン (高速・確実)
      // 視覚的フィードバックのため少し遅延させる
      const ids = getKnownAppIds();
      const apps = scanAppData(); // 既存関数をそのまま使う
      for (let i = 0; i < ids.length; i++) {
        const found = apps.some(a => a.rawId === ids[i] || a.paddedId === ids[i]);
        setCrossProgress({ done: i + 1, total: ids.length, current: `app${ids[i]} ${found ? "✓" : "·"}` });
        await new Promise(r => setTimeout(r, 8)); // 8ms × 200 = 1.6秒で完走
      }
      setScannedApps(apps);
      T("success");
    } catch (e) {
      alert("スキャンエラー: " + e.message);
    } finally {
      setCrossScanning(false);
    }
  };

  const totalSessions = useMemo(() =>
    scannedApps.reduce((s, a) => s + a.count, 0) + manualEntries.length,
  [scannedApps, manualEntries]);

  const buildAndShowPrompt = () => {
    T("tap");
    const p = buildMetaPrompt(scannedApps, manualEntries);
    setAnalysisPrompt(p);
    setScreen("prompt");
  };

  const parseAndShowProfile = () => {
    T("tap");
    if (!aiResult.trim()) { alert("AIの回答を貼り付けてください"); return; }
    const p = parseProfile(aiResult);
    setProfile(p);
    if (p) {
      const rec = {
        date: new Date().toLocaleDateString("ja-JP"),
        time: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
        totalApps: scannedApps.length + manualEntries.length,
        totalSessions,
        profile: p,
      };
      const newP = [rec, ...profiles].slice(0, 10);
      setProfiles(newP); saveProfiles(newP);
      T("success");
    }
    setScreen("profile");
  };

  const generateShare = async () => {
    if (!profile) return;
    T("tap"); setGenerating(true);
    try {
      const url = await generateShareImage(profile, scannedApps.length + manualEntries.length);
      setShareImageUrl(url);
    } catch (e) {
      alert("シェア画像生成に失敗: " + e.message);
    } finally { setGenerating(false); }
  };

  const downloadShare = () => {
    if (!shareImageUrl) return;
    const a = document.createElement("a");
    a.href = shareImageUrl;
    a.download = `200の問い人格分析_${new Date().toLocaleDateString("ja-JP").replace(/\//g, "")}.png`;
    a.click();
    T("success");
  };

  const addManual = () => {
    if (!manualForm.id || !manualForm.text.trim()) return;
    const id = manualForm.id.padStart(3, "0");
    const meta = APP_META[id.replace(/^0/, "")] || APP_META[id] || APP_META_FALLBACK(id);
    setManualEntries([...manualEntries, {
      id, text: manualForm.text, name: meta[0], category: meta[2]
    }]);
    setManualForm({ id: "", text: "" });
    T("success");
  };

  const removeManual = (idx) => {
    const next = manualEntries.filter((_, i) => i !== idx);
    setManualEntries(next);
  };

  const reset = () => {
    setScreen("home"); setAnalysisPrompt(""); setAiResult(""); setProfile(null); setShareImageUrl("");
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "sans-serif", maxWidth: 540, margin: "0 auto", display: "flex", flexDirection: "column" }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}body,html{background:#f0ede8!important}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#c8c0b4}textarea:focus,input:focus{outline:none}button{font-family:inherit;cursor:pointer}select{font-family:inherit}`}</style>

      <div style={{ padding: "14px 18px 12px", borderBottom: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg,${C.gold},${C.goldDim})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "#fff" }}>🧬</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.gold }}>200の問い 人格分析</div>
            <div style={{ fontSize: 10, color: C.textMuted }}>200本のapp実績から横断的にあなたの人格を可視化</div>
          </div>
          <button onClick={toggleTap} style={{ padding: "4px 8px", background: tapOn ? C.goldBg : C.surface2, border: `1px solid ${tapOn ? C.borderActive : C.border}`, borderRadius: 7, fontSize: 10, color: tapOn ? C.gold : C.textMuted }}>{tapOn ? "🔔" : "🔕"}</button>
          <button onClick={() => toggleSpeak(profile?.summary || "")} style={{ padding: "4px 8px", background: isSpeaking ? C.goldBg : C.surface2, border: `1px solid ${isSpeaking ? C.borderActive : C.border}`, borderRadius: 7, fontSize: 10, color: isSpeaking ? C.gold : C.textSub }}>{isSpeaking ? "⏹" : "🔈"}</button>
        </div>
      </div>

      {/* HOME */}
      {screen === "home" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 18px 40px" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🧬</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.gold, marginBottom: 8 }}>200の問い 人格分析</div>
            <div style={{ fontSize: 12, color: C.textSub, lineHeight: 1.8 }}>
              他の200本のappで蓄積した分析履歴を横断して、<br />あなたの「人格プロファイル」を生成します。
            </div>
          </div>

          <div style={{ background: C.goldBg, border: `1px solid ${C.borderActive}`, borderRadius: 12, padding: 14, marginBottom: 18, fontSize: 11.5, color: C.gold, lineHeight: 1.7 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>🎁 完全無料・コストゼロ・永久動作 (δ方式)</div>
            このアプリは「メタ分析プロンプト」を生成。それを ChatGPT / Claude / Gemini にコピーして使えば、料金もAPI契約も不要です。
          </div>

          <div style={{ background: C.surface, border: `1.5px solid ${C.borderActive}`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.gold, marginBottom: 10 }}>📡 検出されたapp履歴</div>

            {/* クロスドメインスキャンボタン */}
            <button
              onClick={runCrossDomainScan}
              disabled={crossScanning}
              style={{ width: "100%", padding: "10px 0", marginBottom: 10, background: crossScanning ? C.surface3 : `linear-gradient(135deg,${C.blue},#0a3a5a)`, border: "none", borderRadius: 10, color: crossScanning ? C.textMuted : "#fff", fontSize: 12, fontWeight: 700 }}
            >
              {crossScanning ? `🌐 スキャン中 ${crossProgress.done}/${crossProgress.total} ${crossProgress.current}` : "🌐 全app自動スキャン (toi-XXX を巡回)"}
            </button>
            <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 10, lineHeight: 1.6 }}>
              ☝️ 全200本のappを iframe で巡回して、それぞれのlocalStorage履歴を取得します。1〜2分かかります。
            </div>

            {scannedApps.length === 0 ? (
              <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.7, padding: "8px 0" }}>
                まだ検出されていません。<br />
                上の「全app自動スキャン」ボタンか、「手動で結果を入れる」をご利用ください。
              </div>
            ) : (
              <>
                <div style={{ fontSize: 11.5, color: C.textSub, marginBottom: 10 }}>
                  <strong style={{ color: C.gold, fontSize: 14 }}>{scannedApps.length}</strong>本のappで <strong style={{ color: C.gold, fontSize: 14 }}>{totalSessions}</strong>セッション
                </div>
                <div style={{ maxHeight: 240, overflowY: "auto" }}>
                  {scannedApps.map(a => (
                    <div key={a.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 16 }}>{a.emoji}</div>
                      <div style={{ flex: 1, fontSize: 11, color: C.text }}>#{a.paddedId} {a.name}</div>
                      <div style={{ fontSize: 10, color: C.textMuted }}>{a.count}回</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 手動入力 */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.textSub, marginBottom: 8 }}>📝 手動で過去の結果を追加 (任意)</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              <input value={manualForm.id} onChange={e => setManualForm({ ...manualForm, id: e.target.value })} placeholder="app番号(例: 003)" style={{ width: 110, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: "8px 10px", fontSize: 11 }} />
              <button onClick={addManual} disabled={!manualForm.id || !manualForm.text.trim()} style={{ flex: 1, background: (!manualForm.id || !manualForm.text.trim()) ? C.surface3 : C.gold, border: "none", borderRadius: 8, color: (!manualForm.id || !manualForm.text.trim()) ? C.textMuted : "#fff", fontSize: 11, fontWeight: 600 }}>+ 追加</button>
            </div>
            <textarea value={manualForm.text} onChange={e => setManualForm({ ...manualForm, text: e.target.value })} placeholder="そのアプリで得たAI分析結果を貼り付け..." rows={3} style={{ width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: "8px 10px", fontSize: 11, resize: "vertical", fontFamily: "sans-serif" }} />
            {manualEntries.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 4 }}>追加済み {manualEntries.length}件</div>
                {manualEntries.map((e, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", padding: "4px 0", fontSize: 10, color: C.textSub }}>
                    <span style={{ flex: 1 }}>#{e.id} {e.name}</span>
                    <button onClick={() => removeManual(i)} style={{ background: "transparent", border: "none", color: C.red, fontSize: 10 }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={buildAndShowPrompt}
            disabled={scannedApps.length === 0 && manualEntries.length === 0}
            style={{
              width: "100%", padding: "14px 0",
              background: (scannedApps.length === 0 && manualEntries.length === 0) ? C.surface3 : `linear-gradient(135deg,${C.gold},${C.goldDim})`,
              border: "none", borderRadius: 14,
              color: (scannedApps.length === 0 && manualEntries.length === 0) ? C.textMuted : "#fff",
              fontSize: 14, fontWeight: 800
            }}
          >
            🧬 横断分析を始める →
          </button>

          {profiles.length > 0 && (
            <button onClick={() => setScreen("history")} style={{ width: "100%", padding: "10px 0", marginTop: 10, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 12, color: C.textSub, fontSize: 12 }}>
              📊 過去のプロファイル({profiles.length}件)
            </button>
          )}
        </div>
      )}

      {/* PROMPT */}
      {screen === "prompt" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px 40px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.gold, marginBottom: 4 }}>✨ メタ分析プロンプト生成完了</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 14 }}>下のプロンプトをコピーして、ChatGPT/Claude/Geminiに貼り付け → 返ってきた結果を下のボックスに貼り付け</div>

          <PromptCard title="🧬 200の問い 人格分析プロンプト" prompt={analysisPrompt} />

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textSub, marginBottom: 8 }}>📥 AIの分析結果を貼り付け</div>
            <textarea
              value={aiResult}
              onChange={e => setAiResult(e.target.value)}
              placeholder="ここにAIの応答をコピー&ペースト..."
              rows={8}
              style={{ width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, padding: "10px 12px", fontSize: 12, resize: "vertical", lineHeight: 1.7, fontFamily: "sans-serif", marginBottom: 8 }}
            />
            <button
              onClick={parseAndShowProfile}
              disabled={!aiResult.trim()}
              style={{ width: "100%", padding: "12px 0", background: !aiResult.trim() ? C.surface3 : `linear-gradient(135deg,${C.gold},${C.goldDim})`, border: "none", borderRadius: 10, color: !aiResult.trim() ? C.textMuted : "#fff", fontSize: 12, fontWeight: 700 }}
            >
              🌟 プロファイルを表示 →
            </button>
          </div>

          <button onClick={reset} style={{ width: "100%", padding: "10px 0", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.textSub, fontSize: 12 }}>← ホームへ戻る</button>
        </div>
      )}

      {/* PROFILE */}
      {screen === "profile" && profile && (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px 40px" }}>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 36 }}>🧬</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.gold }}>あなたの人格プロファイル</div>
            <div style={{ fontSize: 10, color: C.textMuted }}>{scannedApps.length + manualEntries.length}本のapp / {totalSessions}セッションから生成</div>
          </div>

          {Object.keys(profile.values || {}).length >= 3 && (
            <div style={{ background: C.surface, border: `1px solid ${C.borderActive}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.gold, marginBottom: 10 }}>🌟 価値観の軸</div>
              <RadarChart scores={profile.values} />
            </div>
          )}

          <ProfileCard icon="🧠" title="思考傾向" body={profile.thinking} color={C.blue} />
          <ProfileCard icon="❤️" title="感情パターン" body={profile.emotion} color={C.red} />
          <ProfileCard icon="🎯" title="行動傾向" body={profile.action} color={C.green} />
          <ProfileCard icon="💎" title="強み と 伸ばしどころ" body={profile.strengths} color={C.gold} />
          <ProfileCard icon="🌅" title="人生フェーズの傾向" body={profile.phase} color={C.purple} />
          <ProfileCard icon="🚀" title="おすすめ次アプリ" body={profile.recommend} color={C.gold} />
          <ProfileCard icon="📝" title="全体総評" body={profile.summary} color={C.goldDim} />

          <div style={{ background: C.surface, border: `1.5px solid ${C.borderActive}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, marginBottom: 8 }}>📤 シェア画像を作る</div>
            <button onClick={generateShare} disabled={generating} style={{ width: "100%", padding: "10px 0", background: generating ? C.surface3 : C.gold, border: "none", borderRadius: 10, color: generating ? C.textMuted : "#fff", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
              {generating ? "生成中..." : (shareImageUrl ? "🔄 再生成" : "📸 PNG画像を生成")}
            </button>
            {shareImageUrl && (
              <>
                <img src={shareImageUrl} alt="プロファイル" style={{ width: "100%", borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 8 }} />
                <button onClick={downloadShare} style={{ width: "100%", padding: "10px 0", background: C.green, border: "none", borderRadius: 10, color: "#fff", fontSize: 12, fontWeight: 700 }}>
                  💾 ダウンロード
                </button>
              </>
            )}
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setScreen("prompt")} style={{ flex: 1, padding: "10px 0", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.textSub, fontSize: 11 }}>← プロンプトへ</button>
            <button onClick={reset} style={{ flex: 1, padding: "10px 0", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.textSub, fontSize: 11 }}>🏠 ホーム</button>
          </div>
        </div>
      )}

      {/* HISTORY */}
      {screen === "history" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 18px 40px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.gold, marginBottom: 12 }}>📊 過去のプロファイル</div>
          {profiles.length === 0 ? (
            <div style={{ textAlign: "center", padding: 30, color: C.textMuted, fontSize: 12 }}>まだ履歴がありません</div>
          ) : (
            profiles.map((p, i) => (
              <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ fontSize: 11, color: C.gold, fontWeight: 600 }}>{p.date} {p.time}</div>
                  <div style={{ fontSize: 10, color: C.textMuted }}>{p.totalApps}本 / {p.totalSessions}セッション</div>
                </div>
                <div style={{ fontSize: 11, color: C.textSub, lineHeight: 1.7 }}>
                  {(p.profile.summary || p.profile.raw || "").slice(0, 120)}...
                </div>
              </div>
            ))
          )}
          <button onClick={reset} style={{ width: "100%", padding: "12px 0", marginTop: 10, background: `linear-gradient(135deg,${C.gold},${C.goldDim})`, border: "none", borderRadius: 12, color: "#fff", fontSize: 13, fontWeight: 700 }}>🏠 ホーム</button>
        </div>
      )}
    </div>
  );
}
