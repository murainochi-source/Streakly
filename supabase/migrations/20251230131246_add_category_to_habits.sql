/*
  # Add category field to habits table

  1. Changes
    - Add `category` column to `habits` table
      - Type: text
      - Default: 'general'
      - Not null
    - Categories: study, exercise, health, work, personal, general
  
  2. Notes
    - Existing habits will automatically get 'general' as their category
    - Users can change categories when editing habits
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'habits' AND column_name = 'category'
  ) THEN
    ALTER TABLE habits ADD COLUMN category text NOT NULL DEFAULT 'general';
  END IF;
END $$;