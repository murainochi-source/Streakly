/*
  # Optimize RLS Policies for Performance

  1. Changes
    - Drop existing RLS policies on habits table
    - Recreate policies with optimized auth.uid() calls wrapped in SELECT
    - This prevents re-evaluation of auth.uid() for each row, improving query performance at scale

  2. Security
    - Maintains same security level as before
    - All habits remain private to the user who created them
    - Users can only access habits where user_id matches their authenticated user ID

  3. Performance Impact
    - auth.uid() is now evaluated once per query instead of once per row
    - Significantly improves performance when querying large datasets
*/

DROP POLICY IF EXISTS "Users can view own habits" ON habits;
DROP POLICY IF EXISTS "Users can insert own habits" ON habits;
DROP POLICY IF EXISTS "Users can update own habits" ON habits;
DROP POLICY IF EXISTS "Users can delete own habits" ON habits;

CREATE POLICY "Users can view own habits"
  ON habits FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own habits"
  ON habits FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own habits"
  ON habits FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own habits"
  ON habits FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);
