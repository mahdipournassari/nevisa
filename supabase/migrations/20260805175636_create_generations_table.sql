/*
# Create user_generations table for storing AI-generated content

## Purpose
Stores every piece of content a user generates with the AI, so each signed-in user
can browse, re-run, and delete their own history from any device.

## New Tables
- `user_generations`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to auth.uid() — references auth.users with cascade delete)
  - `template_id` (text, not null — which template was used, e.g. 'instagram-caption')
  - `topic` (text, not null — the user's input prompt)
  - `tone` (text, not null — the selected tone, e.g. 'motivational')
  - `length` (text, not null — the selected length, e.g. 'medium')
  - `result_text` (text, not null — the generated content)
  - `created_at` (timestamptz, defaults to now)

## Security
- RLS enabled on `user_generations`.
- Four owner-scoped policies (select/insert/update/delete) restricted to `authenticated`.
- `user_id` defaults to `auth.uid()` so client inserts that omit `user_id` still pass the WITH CHECK.
- Users can only see, create, modify, and delete their own rows — never anyone else's.

## Notes
1. Email confirmation stays OFF — users can sign in immediately after sign-up.
2. The `DEFAULT auth.uid()` on `user_id` is what allows `.insert({ template_id, topic, ... })`
   without explicitly passing the owner — the database fills it from the session.
*/

CREATE TABLE IF NOT EXISTS user_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id text NOT NULL,
  topic text NOT NULL,
  tone text NOT NULL,
  length text NOT NULL,
  result_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_generations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_generations" ON user_generations;
CREATE POLICY "select_own_generations"
  ON user_generations FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_generations" ON user_generations;
CREATE POLICY "insert_own_generations"
  ON user_generations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_generations" ON user_generations;
CREATE POLICY "update_own_generations"
  ON user_generations FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_generations" ON user_generations;
CREATE POLICY "delete_own_generations"
  ON user_generations FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_generations_user_id ON user_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_generations_created_at ON user_generations(created_at DESC);
