/*
  # Create habits table for Streakly app

  1. New Tables
    - `habits`
      - `id` (uuid, primary key) - Unique identifier for each habit
      - `user_id` (uuid, foreign key) - References auth.users, tracks habit owner
      - `name` (text) - Name of the habit
      - `streak` (integer) - Current streak count, defaults to 0
      - `last_completed_date` (date) - Last date the habit was completed
      - `created_at` (timestamptz) - When the habit was created

  2. Security
    - Enable RLS on `habits` table
    - Add policy for users to read their own habits
    - Add policy for users to insert their own habits
    - Add policy for users to update their own habits
    - Add policy for users to delete their own habits

  3. Important Notes
    - All habits are private to the user who created them
    - Users can only access habits where user_id matches their auth.uid()
*/

CREATE TABLE IF NOT EXISTS habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  streak integer NOT NULL DEFAULT 0,
  last_completed_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own habits"
  ON habits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habits"
  ON habits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits"
  ON habits FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits"
  ON habits FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS habits_user_id_idx ON habits(user_id);