// src/lib/supabase.js
// Supabase クライアントの初期化と分析結果保存ヘルパー
//
// 環境変数（Vite では import.meta.env で読み込み、VITE_ プレフィックス必須）:
//   VITE_SUPABASE_URL
//   VITE_SUPABASE_ANON_KEY
//
// envが未設定でもimport自体は失敗させない（saveAnalysisがno-opになる）。

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

let _client = null;
let _warned = false;

export function getSupabase() {
  if (_client) return _client;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    if (!_warned) {
      console.warn("[supabase] env not set (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)");
      _warned = true;
    }
    return null;
  }
  _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false }, // ゲスト保存中心なので未使用
  });
  return _client;
}

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/**
 * 分析結果を Supabase.answers テーブルに保存
 * @param {object} params
 * @param {string} [params.userId]      - 任意のユーザーID (uuid)。なしならnull扱い
 * @param {string} params.questionSetId - 例: "app042"
 * @param {Array}  params.rawAnswers    - 10件の回答配列
 * @param {object} params.scores        - { decision, mental, resilience, insight, discipline, vision }
 * @param {string} [params.summary]     - 総評
 * @param {string} [params.advice]      - アドバイス
 * @returns {Promise<{ ok: boolean, data?: any, error?: any }>}
 */
export async function saveAnalysis({ userId, questionSetId, rawAnswers, scores, summary, advice }) {
  const sb = getSupabase();
  if (!sb) {
    return { ok: false, error: "supabase not configured" };
  }
  const row = {
    user_id: userId || null,
    question_set_id: questionSetId || null,
    raw_answers: rawAnswers || [],
    score_decision: scores?.decision ?? null,
    score_mental: scores?.mental ?? null,
    score_resilience: scores?.resilience ?? null,
    score_insight: scores?.insight ?? null,
    score_discipline: scores?.discipline ?? null,
    score_vision: scores?.vision ?? null,
    summary: summary || null,
    advice: advice || null,
  };
  try {
    const { data, error } = await sb.from("answers").insert(row).select().single();
    if (error) {
      console.warn("[supabase] insert error:", error.message);
      return { ok: false, error };
    }
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e };
  }
}
