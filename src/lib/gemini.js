// src/lib/gemini.js
// /api/analyze を呼び出して6軸スコアを取得するクライアントラッパー
//
// 戻り値:
// {
//   scores: { decision, mental, resilience, insight, discipline, vision } (0-100),
//   analysis_summary: string,
//   advice: string,
//   _source: "api" | "fallback"   // どこから来たかを示す
// }

const AXIS_KEYS = ["decision", "mental", "resilience", "insight", "discipline", "vision"];

/**
 * 回答テキストから簡易ヒューリスティックでスコアを生成（API失敗時のフォールバック）
 * @param {Array<string|object>} rawAnswers
 */
function localFallback(rawAnswers) {
  const texts = rawAnswers.map((a) => (typeof a === "string" ? a : JSON.stringify(a || "")));
  const totalLen = texts.reduce((s, t) => s + (t || "").length, 0);
  const filled = texts.filter((t) => t && t.trim().length > 0).length;

  // 回答の充実度・キーワード密度で簡易スコア生成
  const baseScore = Math.min(85, 40 + Math.floor(totalLen / 20) + filled * 3);

  const keywordHit = (re) => texts.filter((t) => re.test(t)).length;

  const scores = {
    decision:   Math.min(95, baseScore + keywordHit(/決め|選ぶ|即|挑戦|やる/g) * 3),
    mental:     Math.min(95, baseScore + keywordHit(/耐え|諦めない|踏ん張|信念|貫く/g) * 3),
    resilience: Math.min(95, baseScore + keywordHit(/変化|柔軟|切替|学ぶ|転換/g) * 3),
    insight:    Math.min(95, baseScore + keywordHit(/見抜|本質|理解|考え|分析/g) * 3),
    discipline: Math.min(95, baseScore + keywordHit(/毎日|習慣|続け|律|計画/g) * 3),
    vision:     Math.min(95, baseScore + keywordHit(/世|他者|貢献|大義|社会|誰か/g) * 3),
  };
  for (const k of AXIS_KEYS) scores[k] = Math.max(20, Math.min(100, scores[k]));

  return {
    scores,
    analysis_summary:
      "（オフライン簡易分析）回答からは芯のある気質が窺える。今は道半ば、刀の研ぎ方ひとつで景色は変わる。慢心せず、また怯えず、己の一歩を見つめ続けよ。",
    advice: "明日の朝、今日の自分が「やらなかった一つ」を紙に書き出せ。それを今日、片付けよ。",
    _source: "fallback",
  };
}

/**
 * 10問の回答を /api/analyze に送信し、6軸スコアを取得
 * @param {Array<string|object>} rawAnswers 10件の回答
 * @param {string} questionSetId 質問セット識別子（例: "app042"）
 * @returns {Promise<{scores, analysis_summary, advice, _source}>}
 */
export async function analyzeAnswers(rawAnswers, questionSetId) {
  if (!Array.isArray(rawAnswers)) {
    throw new Error("rawAnswers must be an array");
  }
  try {
    const r = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawAnswers, questionSetId: questionSetId || "unknown" }),
    });
    if (!r.ok) {
      console.warn("[gemini] /api/analyze non-OK:", r.status);
      const fb = localFallback(rawAnswers);
      fb._error = `API ${r.status}`;
      return fb;
    }
    const data = await r.json();
    if (!data || !data.scores) {
      const fb = localFallback(rawAnswers);
      fb._error = "no scores in response";
      return fb;
    }
    // 正規化
    for (const k of AXIS_KEYS) {
      if (typeof data.scores[k] !== "number") data.scores[k] = 50;
      data.scores[k] = Math.max(0, Math.min(100, Math.round(data.scores[k])));
    }
    data._source = "api";
    return data;
  } catch (e) {
    console.warn("[gemini] fetch failed, fallback:", e.message);
    const fb = localFallback(rawAnswers);
    fb._error = e.message;
    return fb;
  }
}

export { AXIS_KEYS };

export const AXIS_LABELS = {
  decision: "決断力",
  mental: "精神力",
  resilience: "適応力",
  insight: "洞察力",
  discipline: "規律心",
  vision: "大義",
};

export const AXIS_DESCRIPTIONS = {
  decision: "迷わず機を捉える力",
  mental: "プレッシャーに屈しない芯の強さ",
  resilience: "逆境を好機に変える柔軟性",
  insight: "本質を見抜き、先を読む力",
  discipline: "己を律し、継続する力",
  vision: "己のためだけでなく、世のために動く志",
};
