-- ============================================================
-- toi-suite 初期マイグレーション
-- 6軸分析結果の保存先テーブル
-- ============================================================

create extension if not exists "pgcrypto";

create table if not exists public.answers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid,
  question_set_id text,
  raw_answers jsonb,
  score_decision int,
  score_mental int,
  score_resilience int,
  score_insight int,
  score_discipline int,
  score_vision int,
  summary text,
  advice text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 検索用インデックス
create index if not exists answers_user_id_idx on public.answers(user_id);
create index if not exists answers_question_set_id_idx on public.answers(question_set_id);
create index if not exists answers_created_at_idx on public.answers(created_at desc);

-- ============================================================
-- Row Level Security
-- anon キーでの直接INSERTを許可（書き込み専用ポリシー）
-- 読み出しは別途認証経由を推奨
-- ============================================================

alter table public.answers enable row level security;

-- 既存ポリシーを冪等に再作成
drop policy if exists "anon can insert answers" on public.answers;
create policy "anon can insert answers"
  on public.answers
  for insert
  to anon
  with check (true);

-- 自分のレコードのみ読める（user_id=auth.uid()）
drop policy if exists "user can read own answers" on public.answers;
create policy "user can read own answers"
  on public.answers
  for select
  to authenticated
  using (auth.uid() = user_id);
