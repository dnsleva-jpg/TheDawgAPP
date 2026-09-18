-- DO NOTHIN. — Supabase Schema
-- Paste this into the Supabase SQL Editor and click Run.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── PROFILES ────────────────────────────────────────────────
CREATE TABLE profiles (
  id                       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  program_start_date       TIMESTAMPTZ,
  current_streak           INT NOT NULL DEFAULT 0,
  longest_streak           INT NOT NULL DEFAULT 0,
  total_sessions_completed INT NOT NULL DEFAULT 0,
  total_focus_minutes      INT NOT NULL DEFAULT 0,
  has_onboarded            BOOLEAN NOT NULL DEFAULT false,
  subscription_status      TEXT NOT NULL DEFAULT 'free'
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- ─── AUTO-CREATE PROFILE ON SIGNUP ───────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ─── SESSIONS ────────────────────────────────────────────────
CREATE TABLE sessions (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_selected_minutes INT NOT NULL,
  duration_actual_seconds   INT NOT NULL DEFAULT 0,
  completed                 BOOLEAN NOT NULL DEFAULT false,
  broken_at                 TIMESTAMPTZ,
  session_mode              TEXT NOT NULL DEFAULT 'easy'
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own sessions"
  ON sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sessions"
  ON sessions FOR UPDATE
  USING (user_id = auth.uid());

-- ─── DAILY CHALLENGES ────────────────────────────────────────
CREATE TABLE daily_challenges (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_number        INT NOT NULL UNIQUE,
  phase             INT NOT NULL,
  title             TEXT NOT NULL,
  description       TEXT NOT NULL,
  verification_type TEXT NOT NULL DEFAULT 'manual',
  points            INT NOT NULL DEFAULT 10
);

ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read challenges"
  ON daily_challenges FOR SELECT
  USING (true);

-- ─── CHALLENGE COMPLETIONS ───────────────────────────────────
CREATE TABLE challenge_completions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  day_number   INT NOT NULL,
  UNIQUE (user_id, challenge_id)
);

ALTER TABLE challenge_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own completions"
  ON challenge_completions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own completions"
  ON challenge_completions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ─── FOCUS TESTS ─────────────────────────────────────────────
CREATE TABLE focus_tests (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  taken_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  test_number      INT NOT NULL,
  score_overall    INT NOT NULL,
  score_stillness  INT NOT NULL,
  score_blink_rate INT NOT NULL,
  score_completion INT NOT NULL,
  duration_seconds INT NOT NULL,
  passed           BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE focus_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own focus tests"
  ON focus_tests FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own focus tests"
  ON focus_tests FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own focus tests"
  ON focus_tests FOR UPDATE
  USING (user_id = auth.uid());
