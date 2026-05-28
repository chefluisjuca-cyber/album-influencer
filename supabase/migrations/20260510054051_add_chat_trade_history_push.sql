/*
  # Chat, Trade History, Push Subscriptions

  1. New Tables
    - `chat_messages` — mensagens diretas entre dois usuários que tiveram troca aceita
      - `id` uuid PK
      - `trade_request_id` uuid FK → trade_requests
      - `sender_id` uuid FK → auth.users
      - `content` text
      - `created_at` timestamptz
    - `push_subscriptions` — subscriptions da Web Push API por usuário
      - `id` uuid PK
      - `user_id` uuid FK → auth.users
      - `endpoint` text unique
      - `p256dh` text
      - `auth_key` text
      - `created_at` timestamptz
  2. Changes to existing tables
    - `trade_requests`: add `completed_at` timestamptz (null = em andamento, not null = concluída)
    - `notifications`: add type `trade_completed`
  3. Security
    - RLS enabled on both new tables
    - chat: only parties of the trade can read/write
    - push: only owner can manage own subscription
*/

-- ─── chat_messages ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_request_id uuid NOT NULL REFERENCES trade_requests(id) ON DELETE CASCADE,
  sender_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content          text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trade parties can read chat"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trade_requests tr
      WHERE tr.id = trade_request_id
        AND (tr.sender_id = auth.uid() OR tr.receiver_id = auth.uid())
        AND tr.status = 'accepted'
    )
  );

CREATE POLICY "Trade parties can insert chat"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM trade_requests tr
      WHERE tr.id = trade_request_id
        AND (tr.sender_id = auth.uid() OR tr.receiver_id = auth.uid())
        AND tr.status = 'accepted'
    )
  );

-- ─── push_subscriptions ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint  text NOT NULL UNIQUE,
  p256dh    text NOT NULL,
  auth_key  text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own push subscriptions"
  ON push_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own push subscriptions"
  ON push_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own push subscriptions"
  ON push_subscriptions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ─── trade_requests: add completed_at ─────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trade_requests' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE trade_requests ADD COLUMN completed_at timestamptz DEFAULT NULL;
  END IF;
END $$;

-- ─── indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS chat_messages_trade_idx ON chat_messages(trade_request_id, created_at);
CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS trade_requests_completed_idx ON trade_requests(sender_id, completed_at) WHERE completed_at IS NOT NULL;
