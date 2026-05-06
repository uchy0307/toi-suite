import React, { useState, useRef, useEffect } from "react";

// ───────────────────────────────────────────────────────────
// 1on1マスターAI - 旧仕様完全復元版 (ペルソナ6次元)
// δ方式実装: API呼び出しゼロ、プロンプト生成のみ
// ───────────────────────────────────────────────────────────
// 旧仕様の体験を復元:
//  - 部下の名前入力 (プロフィールに保存・プロンプトに反映)
//  - 旧仕様の質問順 (年齢→ポジション→業種→職種→家族→性格→状況)
//  - プロンプト生成→結果画面への自動遷移
//  - 全主要ボタンに音声フィードバック
//  - 履歴閲覧/再表示/削除 (localStorageから復元)
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
    } else if (type === "send") {
      o.frequency.setValueAtTime(660, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.06);
      g.gain.setValueAtTime(0.1, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      o.start(); o.stop(ctx.currentTime + 0.1);
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
  red: "#a02018", purple: "#4a1890",
  userBubble: "#1a3828", userText: "#d8f0e0",
};

// ============================================================
// ペルソナ定義 (6次元)
// ============================================================

const ROLE_HIERARCHY = {
  exec: {
    label: "役員", icon: "👑",
    desc: "取締役・執行役員・C suite",
    subordinateLabel: "直属部下のポジション",
    subordinateOpts: ["シニアマネージャー・部長クラス", "マネージャー・課長クラス", "専門職・エキスパート"],
  },
  senior: {
    label: "シニアマネージャー", icon: "🏛",
    desc: "部長・シニアマネージャー・グループ長",
    subordinateLabel: "直属部下のポジション",
    subordinateOpts: ["マネージャー・課長クラス", "リーダー・主任クラス", "ベテラン・中堅社員"],
  },
  manager: {
    label: "マネージャー", icon: "🎯",
    desc: "課長・マネージャー・チームリーダー",
    subordinateLabel: "部下のポジション",
    subordinateOpts: ["新入社員（1年目）", "若手（2〜4年目）", "中堅（5〜9年目）", "シニア・主任クラス", "もうすぐ管理職", "牽引層・リーダー候補", "ベテラン・専門職（非管理）"],
  },
};

const PERSONA = {
  industry: {
    label: "業種", icon: "🏢", multi: false,
    opts: [
      "自動車・輸送機器", "電機・精密機器", "化学・素材", "食品・飲料", "建設・ゼネコン",
      "不動産・デベロッパー", "プラント・設備", "印刷・出版",
      "ITシステム・SIer", "Web・アプリ開発", "AI・データサイエンス", "半導体・ハードウェア",
      "通信・キャリア", "ゲーム・エンタメIT",
      "総合商社", "専門商社", "百貨店・量販店", "EC・通販", "コンビニ・チェーン", "アパレル・ファッション",
      "総合病院・クリニック", "調剤薬局", "介護・福祉施設", "医療機器メーカー",
      "銀行・信託", "証券・投資", "生損保", "ベンチャーキャピタル", "会計・税務事務所",
      "居酒屋・レストラン", "ホテル・旅館", "航空・旅行", "ブライダル",
      "小学・中学・高校", "大学・研究機関", "学習塾・予備校",
      "国家公務員", "地方公務員", "独立行政法人", "NPO・社会福祉法人",
      "物流・運送", "倉庫・3PL", "広告・PR", "コンサルティング", "法律・特許事務所", "人材・派遣",
    ],
  },
  job: {
    label: "職種", icon: "💼", multi: true,
    opts: [
      "法人営業（大手向け）", "法人営業（中小向け）", "ルート営業", "代理店営業", "海外営業",
      "インサイドセールス", "カウンターセールス",
      "フロントエンドエンジニア", "バックエンドエンジニア", "インフラ・SRE", "データエンジニア",
      "AIエンジニア・ML", "QA・テスト", "PMエンジニア", "組み込みエンジニア",
      "プロダクトマネージャー", "プロジェクトマネージャー", "ITコンサルタント",
      "Webデザイナー", "UXデザイナー", "グラフィックデザイナー",
      "総務・庶務", "経理・会計", "人事・採用", "法務・コンプライアンス", "広報・IR",
      "マーケター・デジタルマーケ", "商品企画", "事業企画",
      "生産管理", "品質管理・QC", "購買・調達", "物流管理", "施工管理", "現場監督",
      "医師・研修医", "看護師", "薬剤師", "理学・作業療法士", "介護士・ケアマネ",
      "小売販売員", "店長", "飲食ホール・調理", "カスタマーサポート",
      "研究員・研究開発", "教師・講師", "コンサルタント", "税理士・会計士補",
    ],
  },
  family: {
    label: "家族構成", icon: "🏠", multi: false,
    opts: [
      "独身・一人暮らし", "独身・実家",
      "既婚・子なし", "既婚・子育て中（乳幼児）", "既婚・子育て中（小中高）",
      "既婚・子供は大学生", "既婚・子供は独立済み",
      "シングルペアレント", "介護中", "育休・産休復帰直後",
    ],
  },
  personality: {
    label: "性格・タイプ", icon: "🧠", multi: true,
    opts: [
      "真面目・完璧主義", "完璧にできるまで報告しない", "受け身・指示待ち",
      "仕事に意味・意義を求める", "変化を嫌い現状維持志向",
      "内向的・慎重派", "空気を読みすぎて本音を言えない", "優秀だが孤立しがち",
      "チームより個人プレー優先", "コミュ力は高いが継続力が弱い",
      "感情的になりやすい", "批判に過剰に傷つく", "承認欲求がとても強い",
      "素直だが自信がない", "表面上は元気だが無理している",
      "反発しやすい・自己主張強め", "プライドが高い・負けず嫌い",
      "明るいが詰めが甘い", "自己犠牲型・断れない",
      "やる気が見えない",
    ],
  },
  issue: {
    label: "最近の状況・悩み", icon: "⚡", multi: true,
    opts: [
      "メンタル不調の兆候がある", "残業・疲弊が続いている", "業務量過多で品質が落ちている",
      "転職を考えていそう", "昇進・キャリアで悩んでいる", "スキルアップへの焦り",
      "同期との差に焦りを感じている", "評価制度への不満・不信感",
      "人間関係でトラブル", "チームの雰囲気が悪化している", "上司との関係に距離感",
      "会社の方針・文化への不満", "急な異動・配置転換で戸惑い",
      "モチベが急落している", "目標が見えず停滞", "ミスが増えている",
      "リモートで孤立しがち", "プライベートで問題がある", "育休・産休復帰後で不安定",
      "特に問題はなさそう",
    ],
  },
};

const PERSONA_KEYS = Object.keys(PERSONA);

const AGE_RANGES = [
  { label: "20〜24歳", mid: 22 }, { label: "25〜29歳", mid: 27 },
  { label: "30〜34歳", mid: 32 }, { label: "35〜39歳", mid: 37 },
  { label: "40〜44歳", mid: 42 }, { label: "45〜49歳", mid: 47 },
  { label: "50〜54歳", mid: 52 }, { label: "55歳以上", mid: 57 },
];

// ============================================================
// 診断ロジック
// ============================================================

const getAgeRelation = (userAge, subAge) => {
  const diff = subAge - userAge;
  if (diff >= 5) return { label: "年上（5歳以上）", tag: "年上" };
  if (diff >= 1) return { label: "年上（1〜4歳）", tag: "少し年上" };
  if (diff === 0) return { label: "同学年・同年代", tag: "同年代" };
  if (diff >= -4) return { label: "年下（1〜4歳）", tag: "少し年下" };
  return { label: "年下（5歳以上）", tag: "年下" };
};

const SUCCESS_CYCLE = {
  diagnose: (issues, personality) => {
    const s = [...issues, ...personality].join(" ");
    if (/人間関係|ハラスメント|距離感|雰囲気/.test(s))
      return { label: "関係の質", color: C.red, desc: "信頼関係が損なわれています。まず「関係の質」の回復が最優先。", action: "評価・批判ゼロで話を聞く場を週1回作る" };
    if (/モチベ|意義|方針|評価制度|停滞|やる気/.test(s))
      return { label: "思考の質", color: C.blue, desc: "仕事の意味・方向性が見えなくなっています。「なぜ」を一緒に言語化することが鍵。", action: "「なぜこの仕事が大切か」を一緒に言語化する" };
    if (/ミス|疲弊|残業|品質|スキル|完璧|断れない/.test(s))
      return { label: "行動の質", color: C.gold, desc: "行動量は十分でも質や方向性がずれています。「やめること」を決めるのが先。", action: "「やることリスト」から「やめることリスト」を作る" };
    if (/転職|キャリア|昇進|差に焦り/.test(s))
      return { label: "結果の質", color: C.green, desc: "結果への焦りが思考・行動に影響しています。良い循環の入口は「関係の質」。", action: "小さな成功体験を作り、承認して伝える" };
    return { label: "バランス良好", color: C.green, desc: "現時点では大きな問題はなさそうです。さらに「関係の質」を深めましょう。", action: "今日の話題を翌日フォローする一言を添える" };
  },
};

const MASLOW = {
  diagnose: (issues, personality, family) => {
    const s = [...issues, ...personality, family].join(" ");
    if (/メンタル|疲弊|残業|プライベート|介護|育休/.test(s))
      return { level: 2, name: "安全欲求", desc: "心身の安全が脅かされています。「無理しなくていい」を先に伝えて。" };
    if (/人間関係|孤立|ハラスメント|雰囲気|距離感/.test(s))
      return { level: 3, name: "所属・愛情欲求", desc: "チームへの帰属感が低下。「ここに居ていい」という安心感を作ることが最優先。" };
    if (/承認欲求|評価|差に焦り|プライド|モチベ/.test(s))
      return { level: 4, name: "承認欲求", desc: "認められたい欲求が満たされていません。「見ている・評価している」を具体的な言葉で。" };
    if (/意義|キャリア|昇進|スキル|転職/.test(s))
      return { level: 5, name: "自己実現欲求", desc: "成長・実現への欲求が高まっています。キャリアビジョンを一緒に描きましょう。" };
    return { level: 3, name: "所属・愛情欲求", desc: "基本欲求は満たされています。所属感をさらに高めると自己実現への扉が開きます。" };
  },
};

// ============================================================
// δ方式プロンプト生成
// ============================================================

const buildPersonaPrompt = (p, userRole, userAge, subName) => {
  const cycle = SUCCESS_CYCLE.diagnose(p.issue, p.personality);
  const maslow = MASLOW.diagnose(p.issue, p.personality, p.family);
  const ageRel = p.ageRelation;

  const roleNote = userRole === "exec"
    ? `⚠️ 役員として接する場合：圧力をかけないよう意識的に「聴く側」に徹する。`
    : userRole === "senior"
    ? `⚠️ 部長として接する場合：部下が「本音を言える場」かどうかを常に意識する。`
    : ``;

  const nm = (subName || "").trim();
  const callName = nm ? `${nm}さん` : "部下";

  const openMap = {
    "新入社員（1年目）": `「${callName}、最近どう？仕事、少し慣れてきた？正直なところ聞かせて」`,
    "若手（2〜4年目）": `「${callName}、最近どう？ぶっちゃけ気になってることある？」`,
    "中堅（5〜9年目）": `「${callName}、最近どう？仕事に限らず、何か感じてることある？」`,
    "シニア・主任クラス": `「${callName}、最近チームどう見てる？正直な感想聞かせて」`,
    "もうすぐ管理職": `「${callName}、最近、仕事全体を見てどう感じてる？率直に」`,
    "牽引層・リーダー候補": `「${callName}、チームのこと、最近どう見てる？正直なところ」`,
    "ベテラン・専門職（非管理）": `「${callName}、最近、仕事で気になってることある？何でも」`,
  };
  const opening = openMap[p.position] || `「${callName}、最近どう？何か気になってることある？」`;

  const ngList = [];
  if (p.personality.includes("反発しやすい・自己主張強め")) ngList.push("「言い訳しないで」→ 関係の質が一気に崩壊");
  if (p.personality.includes("やる気が見えない")) ngList.push("「なんでやる気ないの？」→ 詰問で関係が悪化");
  if (p.personality.includes("表面上は元気だが無理している")) ngList.push("「元気そうだね」で終わる→ 無理を見抜けず機会損失");
  if (p.issue.includes("メンタル不調の兆候がある")) ngList.push("「気合いで乗り越えろ」→ 最悪の一言");
  if (p.personality.includes("批判に過剰に傷つく")) ngList.push("「それは違う」と即否定→ 心を閉ざすトリガー");
  if (ngList.length < 3) ngList.push("評価・批判から入る→ 部下が防御的になり本音が出なくなる");

  return `【1on1ペルソナ分析】
あなた: ${userRole === "exec" ? "役員" : userRole === "senior" ? "シニアマネージャー" : "マネージャー"}（${userAge}歳）
部下: ${nm ? nm + " / " : ""}${p.ageLabel} / ${p.industry} / ${(Array.isArray(p.job) ? p.job.join("・") : p.job)} / ${p.position}（${ageRel}）
家族: ${p.family}
性格: ${p.personality.join("・")}
状況: ${p.issue.join("・")}
${roleNote ? `\n${roleNote}` : ""}

━━━ 成功循環モデル診断 ━━━
課題ステージ：【${cycle.label}】
${cycle.desc}
今週の一手：${cycle.action}

━━━ マズロー欲求段階診断 ━━━
優先欲求：【${maslow.name}（第${maslow.level}段階）】
${maslow.desc}

━━━ 今日の1on1 トーク設計 ━━━

▶ Opening
${opening}
→ 評価せず、まず「聴く」姿勢を先に見せる

▶ Main（核心の問いかけ）
${[
  `「最近、仕事をしていて"これは意味があるな"と思える瞬間、ありますか？」`,
  `「もし今の仕事で一つだけ変えられるとしたら、何を変えたいですか？」`,
  `「自分が大切にしていることと、今の仕事がどう繋がっているか、感じていることはありますか？」`,
  `「私に足りていることや、こうしてほしいってことがあったら、聞かせてもらえますか？」`,
  `「ここまでの話を聞いて、あなたが一番やりたいことって何だと思いますか？」`
].join("\n")}

▶ Closing
「話してくれてありがとう。来週また聞かせて」
→ 約束が「関係の質」を積み上げる

━━━ 絶対やってはいけないこと ━━━
${ngList.slice(0, 4).map(n => `❌ ${n}`).join("\n")}

━━━ このプロンプトの使い方 ━━━
このペルソナ分析をあなたのAI（Claude / ChatGPT / Gemini）に渡して、以下を指示してください：

【AI指示】
「この部下ペルソナの分析を踏まえ、この1on1で効果的な問いかけ5つ と、注意すべき地雷ポイント2つ を400字で教えてください。また、成功循環モデルとマズロー理論を踏まえた、この人への接し方のコツを短く3点提示してください。」`;
};

// ============================================================
// ストレージ
// ============================================================

const HISTORY_KEY = "app001_history_v1";
const loadHistory = () => { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; } };
const saveHistory = (h) => { try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(-50))); } catch {} };

const PROFILE_KEY = "app001_profile_v1";
const loadProfile = () => { try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || "null"); } catch { return null; } };
const saveProfile = (p) => { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch {} };

// ============================================================
// UI Components
// ============================================================

const Chip = ({ label, selected, onClick, multi, small }) => (
  <button onClick={onClick} style={{
    padding: small ? "5px 10px" : "6px 12px",
    borderRadius: 20, fontSize: small ? 11 : 11.5, cursor: "pointer",
    background: selected ? C.goldLight : C.surface2,
    border: `1.5px solid ${selected ? C.borderActive : C.border}`,
    color: selected ? C.goldDim : C.textSub,
    fontWeight: selected ? 700 : 400, transition: "all 0.15s", whiteSpace: "nowrap",
  }}>
    {selected && multi ? "✓ " : ""}{label}
  </button>
);

const PromptCard = ({ title, prompt, onCopy }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    T("send");
    try { await navigator.clipboard.writeText(prompt); }
    catch {
      const el = document.createElement("textarea");
      el.value = prompt;
      el.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(el); el.select();
      document.execCommand("copy"); document.body.removeChild(el);
    }
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
      <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, fontSize: 11.5, lineHeight: 1.85, color: C.text, whiteSpace: "pre-wrap", maxHeight: 320, overflowY: "auto", fontFamily: "monospace" }}>
        {prompt}
      </div>
    </div>
  );
};

// ============================================================
// Main Component
// ============================================================

export default function App() {
  useEffect(() => {
    document.body.style.background = "#f0ede8";
    document.documentElement.style.background = "#f0ede8";
  }, []);

  const savedProfile = loadProfile();
  const [screen, setScreen] = useState("home");
  const [tapOn, setTapOn] = useState(true);
  const tapOnRef = useRef(true);
  const toggleTap = () => { const next = !tapOnRef.current; tapOnRef.current = next; setTapOn(next); window._tapOn = next; };

  // ユーザープロフィール
  const [userAge, setUserAge] = useState(savedProfile?.age || 40);
  const [userRole, setUserRole] = useState(savedProfile?.role || "manager");

  // ペルソナ
  const [persona, setPersona] = useState({});
  const [subAgeLabel, setSubAgeLabel] = useState("");
  const [subName, setSubName] = useState(""); // 部下の名前 (旧仕様復元)

  // 履歴
  const [history, setHistory] = useState(loadHistory());
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [promptReady, setPromptReady] = useState(false);

  const togglePersona = (key, val, multi) => {
    T("tap");
    setPersona(prev => {
      if (multi) { const c = prev[key] || []; return { ...prev, [key]: c.includes(val) ? c.filter(v => v !== val) : [...c, val] }; }
      return { ...prev, [key]: prev[key] === val ? undefined : val };
    });
  };

  const getSubAgeGroups = () => {
    const above = AGE_RANGES.filter(r => r.mid > userAge + 2);
    const same = AGE_RANGES.filter(r => Math.abs(r.mid - userAge) <= 4);
    const below = AGE_RANGES.filter(r => r.mid < userAge - 2);
    return { above, same, below };
  };

  const subAgeGroups = getSubAgeGroups();
  const selectedAgeRange = AGE_RANGES.find(r => r.label === subAgeLabel);
  const ageRelation = selectedAgeRange ? getAgeRelation(userAge, selectedAgeRange.mid) : null;
  const positionOpts = ROLE_HIERARCHY[userRole]?.subordinateOpts || PERSONA_KEYS;

  const isReady = PERSONA_KEYS.every(k => {
    const d = PERSONA[k]; const v = persona[k];
    return d.multi ? v && v.length > 0 : !!v;
  }) && subAgeLabel && persona.position;

  const buildFullPersona = () => ({
    ...persona,
    ageLabel: subAgeLabel,
    ageRelation: ageRelation?.tag || "年下",
    position: persona.position,
  });

  const generatePrompt = () => {
    T("tap");
    const fp = buildFullPersona();
    const p = buildPersonaPrompt(fp, userRole, userAge, subName);
    setPrompt(p);
    setPromptReady(true);
    setScreen("result"); // ★Bug修正: 生成後に結果画面へ自動遷移
    T("success");
  };

  const saveToHistory = () => {
    T("tap");
    const fp = buildFullPersona();
    const rec = {
      id: Date.now(),
      date: new Date().toLocaleString("ja-JP"),
      subName: subName || "",
      persona: `${subAgeLabel}/${(Array.isArray(fp.job) ? fp.job.join("・") : fp.job)}/${fp.position}`,
      personaFull: fp,
      subAgeLabel,
      prompt,
      role: userRole,
      age: userAge,
    };
    const newH = [...history, rec];
    setHistory(newH);
    saveHistory(newH);
    T("success");
  };

  const loadFromHistory = (rec) => {
    T("tap");
    setUserAge(rec.age || 40);
    setUserRole(rec.role || "manager");
    setSubName(rec.subName || "");
    setSubAgeLabel(rec.subAgeLabel || "");
    setPersona(rec.personaFull || {});
    setPrompt(rec.prompt || "");
    setPromptReady(true);
    setScreen("result");
    T("success");
  };

  const deleteHistory = (id) => {
    T("tap");
    const newH = history.filter(h => h.id !== id);
    setHistory(newH);
    saveHistory(newH);
  };

  const saveUserProfile = () => {
    T("tap");
    saveProfile({ age: userAge, role: userRole });
    setScreen("persona");
    T("success");
  };

  const resetPersona = () => {
    T("tap");
    setPersona({}); setSubAgeLabel(""); setSubName("");
    setScreen("persona");
    setPrompt(""); setPromptReady(false);
  };

  const goHome = () => { T("tap"); setScreen("home"); };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "sans-serif", maxWidth: 520, margin: "0 auto", display: "flex", flexDirection: "column" }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#ddd}textarea:focus,input:focus{border-color:${C.borderActive}!important;outline:none}`}</style>

      {/* Header */}
      <div style={{ padding: "12px 16px 0", borderBottom: `1px solid ${C.border}`, background: C.surface, boxShadow: "0 1px 6px rgba(0,0,0,0.06)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg,${C.gold},${C.goldDim})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🧭</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.goldDim }}>1on1 マスターAI</div>
            <div style={{ fontSize: 9, color: C.textMuted }}>ペルソナ×成功循環×マズロー</div>
          </div>
          <button onClick={toggleTap} style={{ padding: "4px 7px", background: tapOn ? C.goldBg : C.surface2, border: `1px solid ${tapOn ? C.borderActive : C.border}`, borderRadius: 7, fontSize: 10, color: tapOn ? C.gold : C.textMuted, cursor: "pointer", fontWeight: 600 }}>{tapOn ? "🔔音ON" : "🔕音OFF"}</button>
          <button onClick={goHome} style={{ padding: "4px 8px", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 10, color: C.textSub, cursor: "pointer" }}>🏠 ホーム</button>
        </div>
        {screen === "result" && (
          <div style={{ fontSize: 10, color: C.gold, marginBottom: 8, padding: "3px 8px", background: C.goldLight, borderRadius: 6, fontWeight: 600 }}>
            👤 {subName ? `${subName} / ` : ""}{subAgeLabel}（{ageRelation?.tag}）/ {persona.industry} / {(Array.isArray(persona.job) ? persona.job.join("・") : persona.job)}
          </div>
        )}
      </div>

      {/* ホーム */}
      {screen === "home" && (
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          <div style={{ textAlign: "center", paddingTop: 20, marginBottom: 28 }}>
            <div style={{ fontSize: 48, marginBottom: 10 }}>🧭</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.goldDim, marginBottom: 6 }}>1on1 マスターAI</div>
            <div style={{ fontSize: 12, color: C.textSub, lineHeight: 1.7 }}>成功循環モデル × マズロー心理学<br />管理職向けペルソナ分析ツール</div>
          </div>

          {/* 自分の年齢 */}
          <div style={{ background: C.surface, borderRadius: 14, padding: 18, marginBottom: 16, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>🎂 あなたの年齢</div>
            <div style={{ textAlign: "center", fontSize: 32, fontWeight: 700, color: C.goldDim, marginBottom: 8 }}>{userAge}<span style={{ fontSize: 16 }}>歳</span></div>
            <input type="range" min={22} max={65} value={userAge} onChange={e => setUserAge(Number(e.target.value))}
              style={{ width: "100%", marginBottom: 8 }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.textMuted }}>
              <span>22歳</span><span>65歳</span>
            </div>
          </div>

          {/* 自分の役職 */}
          <div style={{ background: C.surface, borderRadius: 14, padding: 18, marginBottom: 24, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>📊 あなたの役職</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Object.entries(ROLE_HIERARCHY).map(([key, role]) => (
                <button key={key} onClick={() => { T("tap"); setUserRole(key); }} style={{
                  padding: "14px 16px", borderRadius: 12, border: `2px solid ${userRole === key ? C.borderActive : C.border}`,
                  background: userRole === key ? C.goldLight : C.surface2, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 12, textAlign: "left",
                }}>
                  <div style={{ fontSize: 24 }}>{role.icon}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: userRole === key ? C.goldDim : C.text }}>{role.label}</div>
                    <div style={{ fontSize: 11, color: C.textMuted }}>{role.desc}</div>
                  </div>
                  {userRole === key && <div style={{ marginLeft: "auto", color: C.gold, fontSize: 18 }}>✓</div>}
                </button>
              ))}
            </div>
          </div>

          <button onClick={saveUserProfile} style={{ width: "100%", padding: "14px 0", background: `linear-gradient(135deg,${C.gold},${C.goldDim})`, border: "none", borderRadius: 14, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 16px rgba(138,96,48,0.3)` }}>
            ✅ 設定を保存して次へ
          </button>

          {/* 履歴アクセス (ホーム下部) */}
          {history.length > 0 && (
            <button onClick={() => { T("tap"); setScreen("history"); }} style={{ marginTop: 14, width: "100%", padding: "12px 0", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12, color: C.textSub, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              📊 過去の記録を見る（{history.length}件）
            </button>
          )}
        </div>
      )}

      {/* ペルソナ設定 - 旧仕様順: 名前 → 年齢 → ポジション → 業種 → 職種 → 家族 → 性格 → 状況 */}
      {screen === "persona" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 32px" }}>
          <div style={{ fontSize: 12, color: C.textSub, marginBottom: 16, padding: "10px 14px", background: C.goldLight, borderRadius: 10, border: `1px solid ${C.border}`, lineHeight: 1.8 }}>
            あなた：<strong style={{ color: C.goldDim }}>{ROLE_HIERARCHY[userRole]?.label}（{userAge}歳）</strong><br />
            部下のペルソナを設定してください。性格・状況は複数選択可。
          </div>

          {/* 部下の名前 (旧仕様復元) */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: C.textSub, marginBottom: 8, fontWeight: 600 }}>👤 部下の名前（任意）</div>
            <input
              type="text"
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              placeholder="例：田中、佐藤さん など"
              style={{
                width: "100%",
                padding: "10px 14px",
                background: C.surface,
                border: `1.5px solid ${C.border}`,
                borderRadius: 10,
                color: C.text,
                fontSize: 14,
                fontFamily: "sans-serif",
              }}
            />
            <div style={{ fontSize: 10, color: C.textMuted, marginTop: 4 }}>
              入力した名前はプロンプトの呼びかけに反映されます（任意）。
            </div>
          </div>

          {/* 部下の年齢 */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: C.textSub, marginBottom: 8, fontWeight: 600 }}>🎂 部下の年齢層</div>
            {subAgeGroups.above.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: C.red, marginBottom: 5, fontWeight: 600 }}>▲ 年上の部下</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {subAgeGroups.above.map(r => <Chip key={r.label} label={r.label} selected={subAgeLabel === r.label} onClick={() => { T("tap"); setSubAgeLabel(r.label); }} />)}
                </div>
              </div>
            )}
            {subAgeGroups.same.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: C.blue, marginBottom: 5, fontWeight: 600 }}>＝ 同学年・近い年代</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {subAgeGroups.same.map(r => <Chip key={r.label} label={r.label} selected={subAgeLabel === r.label} onClick={() => { T("tap"); setSubAgeLabel(r.label); }} />)}
                </div>
              </div>
            )}
            {subAgeGroups.below.length > 0 && (
              <div style={{ marginBottom: 4 }}>
                <div style={{ fontSize: 10, color: C.green, marginBottom: 5, fontWeight: 600 }}>▼ 年下の部下</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {subAgeGroups.below.map(r => <Chip key={r.label} label={r.label} selected={subAgeLabel === r.label} onClick={() => { T("tap"); setSubAgeLabel(r.label); }} />)}
                </div>
              </div>
            )}
          </div>

          {/* ポジション (役職階層) - 旧仕様順: 業種より先 */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: C.textSub, marginBottom: 8, fontWeight: 600 }}>📊 ポジション（{ROLE_HIERARCHY[userRole]?.subordinateLabel}）</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {positionOpts.map(o => (
                <Chip key={o} label={o} selected={persona.position === o} onClick={() => togglePersona("position", o, false)} small />
              ))}
            </div>
          </div>

          {/* 業種 */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: C.textSub, marginBottom: 8, fontWeight: 600 }}>🏢 業種</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {PERSONA.industry.opts.map(o => (
                <Chip key={o} label={o} selected={persona.industry === o} onClick={() => togglePersona("industry", o, false)} small />
              ))}
            </div>
          </div>

          {/* 職種 */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: C.textSub, marginBottom: 8, fontWeight: 600 }}>💼 職種</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {PERSONA.job.opts.map(o => (
                <Chip key={o} label={o} selected={(persona.job || []).includes(o)} onClick={() => togglePersona("job", o, true)} small />
              ))}
            </div>
          </div>

          {/* 家族 */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: C.textSub, marginBottom: 8, fontWeight: 600 }}>🏠 家族構成</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {PERSONA.family.opts.map(o => (
                <Chip key={o} label={o} selected={persona.family === o} onClick={() => togglePersona("family", o, false)} small />
              ))}
            </div>
          </div>

          {/* 性格 */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: C.textSub, marginBottom: 8, fontWeight: 600 }}>🧠 性格・タイプ</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {PERSONA.personality.opts.map(o => (
                <Chip key={o} label={o} selected={(persona.personality || []).includes(o)} onClick={() => togglePersona("personality", o, true)} small />
              ))}
            </div>
          </div>

          {/* 状況 */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: C.textSub, marginBottom: 8, fontWeight: 600 }}>⚡ 最近の状況・悩み</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {PERSONA.issue.opts.map(o => (
                <Chip key={o} label={o} selected={(persona.issue || []).includes(o)} onClick={() => togglePersona("issue", o, true)} small />
              ))}
            </div>
          </div>

          <button onClick={generatePrompt} disabled={!isReady} style={{
            width: "100%", padding: "14px 0", background: isReady ? `linear-gradient(135deg,${C.gold},${C.goldDim})` : C.surface3,
            border: "none", borderRadius: 14, color: isReady ? "#fff" : C.textMuted, fontSize: 15, fontWeight: 700, cursor: isReady ? "pointer" : "not-allowed"
          }}>
            {isReady ? "✨ プロンプト生成" : "まずは全項目を選択"}
          </button>
        </div>
      )}

      {/* 結果・プロンプト */}
      {screen === "result" && promptReady && (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 32px" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.goldDim, marginBottom: 16 }}>📋 ペルソナ分析プロンプト</div>

          <PromptCard title="AIへのプロンプト" prompt={prompt} onCopy={() => {}} />

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textSub, marginBottom: 8 }}>💡 使い方</div>
            <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.8 }}>
              1. 上のプロンプトをコピーします<br />
              2. ChatGPT/Claude/Gemini に貼り付けます<br />
              3. AIの回答を参考に1on1を実施します<br />
              4. 「履歴に保存」で管理できます
            </div>
          </div>

          <button onClick={saveToHistory} style={{ width: "100%", padding: "12px 0", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12, color: C.textSub, fontSize: 13, fontWeight: 700, marginBottom: 8, cursor: "pointer" }}>
            💾 履歴に保存
          </button>

          <button onClick={resetPersona} style={{ width: "100%", padding: "12px 0", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12, color: C.textSub, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            ← ペルソナを変更
          </button>
        </div>
      )}

      {/* 履歴一覧 (旧仕様復元: 過去保存と呼び出し) */}
      {screen === "history" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 32px" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.goldDim, marginBottom: 12 }}>📊 過去の記録</div>
          {history.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: C.textMuted, fontSize: 12 }}>記録はまだありません。</div>
          ) : (
            <>
              {history.slice().reverse().map((rec) => (
                <div key={rec.id || rec.date} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 4 }}>{rec.date}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.goldDim, marginBottom: 4 }}>
                    {rec.subName ? `${rec.subName} ・ ` : ""}{rec.persona}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button onClick={() => loadFromHistory(rec)} style={{ flex: 1, padding: "8px 0", background: C.gold, border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      🔄 呼び出す
                    </button>
                    <button onClick={() => deleteHistory(rec.id)} style={{ padding: "8px 12px", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, color: C.red, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
          <button onClick={goHome} style={{ width: "100%", padding: "12px 0", marginTop: 8, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12, color: C.textSub, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            ← ホームに戻る
          </button>
        </div>
      )}
    </div>
  );
}
