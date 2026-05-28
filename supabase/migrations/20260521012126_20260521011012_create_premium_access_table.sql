/*
  # Stub: create_premium_access_table (idempotent)
*/

CREATE TABLE IF NOT EXISTS premium_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  granted_by text DEFAULT 'manual'
);

ALTER TABLE premium_access ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'premium_access' AND policyname = 'Users can view own premium access'
  ) THEN
    CREATE POLICY "Users can view own premium access"
      ON premium_access FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;
