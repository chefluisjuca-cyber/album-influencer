/*
  # Add is_premium column to profiles

  ## Changes
  - Adds `is_premium` boolean column to `profiles` table (default false)
  - Existing users remain on the free plan automatically
  - No RLS changes needed (existing policies cover this column)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_premium'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_premium boolean NOT NULL DEFAULT false;
  END IF;
END $$;
