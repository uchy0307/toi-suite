# 6軸分析システム セットアップガイド

「10問ラリー → Gemini API で6軸スコアリング → レーダー描画 → Supabase 保存」のパイプライン。

## 6軸の定義（変更不可）

| 軸キー       | 名称   | 意味                                       |
| ------------ | ------ | ------------------------------------------ |
| `decision`   | 決断力 | 迷わず機を捉える力                         |
| `mental`     | 精神力 | プレッシャーに屈しない芯の強さ             |
| `resilience` | 適応力 | 逆境を好機に変える柔軟性                   |
| `insight`    | 洞察力 | 本質を見抜き、先を読む力                   |
| `discipline` | 規律心 | 己を律し、継続する力                       |
| `vision`     | 大義   | 己のためだけでなく、世のために動く志       |

## 追加されたファイル

```
api/
  analyze.js                    Vercel Serverless Function（Gemini呼び出し）
src/
  lib/
    gemini.js                   /api/analyze の薄いラッパー（フォールバック付）
    supabase.js                 Supabase クライアント + saveAnalysis
  components/
    PageBase.jsx                10問ラリー→分析→レーダーの汎用コンポーネント
supabase/
  migrations/0001_init.sql      answersテーブル＋RLSポリシー
.env.example                    環境変数テンプレ
_push_6axis_system.bat          一発push用Windowsバッチ
README_6AXIS.md                 このファイル
```

`vercel.json` は `/api/*` を rewrite から除外するよう修正済み。

## PageBase の使い方

任意の Page***.jsx から以下のように呼び出せます:

```jsx
import PageBase from "../components/PageBase.jsx";

const QUESTIONS = [
  { id: "q1", q: "最近、自分の判断に迷いが出た瞬間は？", type: "text", placeholder: "例：..." },
  { id: "q2", q: "プレッシャー下での反応は？", type: "choice", options: ["凍る", "燃える", "冷静"] },
  // ...10問
];

export default function Page042() {
  return (
    <PageBase
      questionSetId="app042"
      title="己を映す10の問い"
      subtitle="侍の美学で6軸を測る"
      questions={QUESTIONS}
    />
  );
}
```

`type` は `text`（textarea）または `choice`（options 配列必須）の2種。10問未満なら自動で穴埋め。

## セットアップ手順（うっちー様の最終アクション）

### 1. 依存をインストール

```bash
cd "C:\Users\user\Documents\Claude\Projects\note 200本\toi-suite"
npm install
npm run build   # 動作確認
```

### 2. Gemini API キーを取得

https://aistudio.google.com/apikey で取得（無料枠あり）。

### 3. Supabase プロジェクト作成

1. https://supabase.com で新規プロジェクト作成
2. Settings → API → `Project URL` と `anon public` キーをコピー
3. SQL Editor を開き `supabase/migrations/0001_init.sql` の中身を貼り付けて RUN

### 4. Vercel 環境変数を登録

Vercel ダッシュボード → 当該プロジェクト → Settings → Environment Variables に以下を追加:

| Key                       | Value                                 | Environment        |
| ------------------------- | ------------------------------------- | ------------------ |
| `GEMINI_API_KEY`          | (Gemini APIキー)                      | Production / Preview |
| `VITE_SUPABASE_URL`       | `https://xxx.supabase.co`             | Production / Preview |
| `VITE_SUPABASE_ANON_KEY`  | `eyJhbGc...` (Supabase anon publicキー) | Production / Preview |

### 5. push してデプロイ

```bash
_push_6axis_system.bat
```

または手動で:

```bash
git add -A
git commit -m "feat: 6-axis analysis system (Gemini + Supabase + RadarChart)"
git push origin main
```

Vercel が GitHub と連携済みなら自動デプロイされます。

### 6. 動作確認

1. デプロイURLにアクセス
2. PageBase を組み込んだページで10問に回答
3. 「6軸で己を映す」ボタンで分析実行
4. レーダーチャート＋総評＋アドバイスが表示されることを確認
5. Supabase ダッシュボード → Table Editor → `answers` テーブルに行が増えているか確認

## トラブルシューティング

- **`GEMINI_API_KEY missing` エラー** → Vercel の環境変数に登録されていない
- **レーダーが「⚠️ オフライン簡易分析」と表示される** → API側でエラー。Vercel の Function Logs を確認
- **Supabase 保存ステータスが「failed」** → RLS ポリシー未適用 or anon keyが間違い
- **`/api/analyze` が 404** → `vercel.json` の rewrite が反映されていない（再デプロイ）

## ローカル開発時の注意

`npm run dev` だけでは `/api/analyze` は動きません（Vercel CLI が必要）。
ローカルAPIテストには:

```bash
npm i -g vercel
vercel dev
```

を使ってください。本番デプロイ後の動作確認だけで十分なら不要です。
