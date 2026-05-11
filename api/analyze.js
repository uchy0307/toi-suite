// Vercel Serverless Function
// /api/analyze - 10問ラリーの回答を Gemini API で6軸スコアリング
//
// 6軸定義（変更不可）:
//   decision   - 決断力: 迷わず機を捉える力
//   mental     - 精神力: プレッシャーに屈しない芯の強さ
//   resilience - 適応力: 逆境を好機に変える柔軟性
//   insight    - 洞察力: 本質を見抜き、先を読む力
//   discipline - 規律心: 己を律し、継続する力
//   vision     - 大義: 己のためだけでなく、世のために動く志

export default async function handler(req, res) {
  // CORSヘッダー（同一originだが念のため）
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // body は Vercel が自動 parse する（Content-Type: application/json 前提）
  const body = req.body || {};
  const { rawAnswers, questionSetId } = body;
  if (!rawAnswers || !Array.isArray(rawAnswers)) {
    return res.status(400).json({ error: "rawAnswers (array) required" });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY missing (set in Vercel env)" });
  }

  const formatted = rawAnswers
    .map((a, i) => `Q${i + 1}: ${typeof a === "string" ? a : JSON.stringify(a)}`)
    .join("\n");

  const prompt = `あなたは「侍の美学」に基づき人間の資質を6軸でスコアリングする分析者です。
以下の10問への回答から、各軸を0-100でスコア化し、200文字程度の総評（侍の哲学トーン）と次の一手のアドバイスを返してください。

【6軸の定義】
- decision（決断力）: 迷わず機を捉える力
- mental（精神力）: プレッシャーに屈しない芯の強さ
- resilience（適応力）: 逆境を好機に変える柔軟性
- insight（洞察力）: 本質を見抜き、先を読む力
- discipline（規律心）: 己を律し、継続する力
- vision（大義）: 己のためだけでなく、世のために動く志

質問セット: ${questionSetId || "(unknown)"}
回答:
${formatted}

【出力JSON形式・厳守】
{
  "scores": {
    "decision": 0-100の整数,
    "mental": 0-100の整数,
    "resilience": 0-100の整数,
    "insight": 0-100の整数,
    "discipline": 0-100の整数,
    "vision": 0-100の整数
  },
  "analysis_summary": "200文字程度の侍トーン総評",
  "advice": "次に成すべき具体的アクション（150字以内）"
}

スコアは回答内容から論理的に導出すること。空欄や曖昧な回答は中央値（50前後）に寄せて評価。`;

  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const r = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!r.ok) {
      const errText = await r.text();
      return res.status(502).json({ error: `Gemini API error: ${r.status}`, detail: errText.slice(0, 500) });
    }

    const data = await r.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      return res.status(500).json({ error: "Gemini response JSON parse failed", raw: text.slice(0, 500) });
    }

    // バリデーション: scores の6軸が揃っているか
    const required = ["decision", "mental", "resilience", "insight", "discipline", "vision"];
    const scores = parsed.scores || {};
    for (const k of required) {
      if (typeof scores[k] !== "number") {
        scores[k] = 50; // フォールバック
      } else {
        scores[k] = Math.max(0, Math.min(100, Math.round(scores[k])));
      }
    }
    parsed.scores = scores;
    parsed.analysis_summary = parsed.analysis_summary || "（総評を生成できませんでした）";
    parsed.advice = parsed.advice || "（アドバイスを生成できませんでした）";

    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(500).json({ error: e.message || "unknown error" });
  }
}
