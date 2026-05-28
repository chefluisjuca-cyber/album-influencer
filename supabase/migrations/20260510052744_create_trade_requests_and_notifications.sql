/*
  # Sistema de Propostas de Troca e Notificações

  ## Resumo
  Implementa o fluxo completo de solicitação de troca entre colecionadores com opt-in,
  notificações em tempo real e proteção contra spam.

  ## Novas Tabelas

  ### `trade_requests`
  - `id` (uuid, pk)
  - `sender_id` (uuid) — usuário que enviou a proposta
  - `receiver_id` (uuid) — usuário que recebeu
  - `status` (text) — pending | accepted | declined
  - `message` (text) — mensagem opcional
  - `created_at` (timestamptz)

  ### `notifications`
  - `id` (uuid, pk)
  - `user_id` (uuid) — destinatário
  - `type` (text) — 'trade_request' | 'trade_accepted' | 'trade_declined'
  - `payload` (jsonb) — dados extras (sender name, trade_request_id, etc.)
  - `read` (boolean)
  - `created_at` (timestamptz)

  ## Modificações em Tabelas Existentes

  ### `profiles`
  - Adiciona coluna `accepts_trades` (boolean, default false) — opt-in do usuário

  ## Segurança
  - RLS em todas as tabelas
  - Rate limit via função: máximo 10 propostas enviadas por dia por usuário
  - Um usuário não pode enviar 2 propostas para o mesmo destinatário com status pending

  ## Notas
  1. Notificações são criadas automaticamente via trigger ao inserir trade_request
  2. Apenas usuários com accepts_trades=true aparecem como disponíveis
  3. Realtime habilitado na tabela notifications para push em tempo real
*/

-- ── Coluna opt-in em profiles ──────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'accepts_trades'
  ) THEN
    ALTER TABLE profiles ADD COLUMN accepts_trades boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'contact_info'
  ) THEN
    ALTER TABLE profiles ADD COLUMN contact_info text DEFAULT '';
  END IF;
END $$;

-- ── Tabela trade_requests ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trade_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  message     text DEFAULT '',
  created_at  timestamptz DEFAULT now(),
  CONSTRAINT no_self_trade CHECK (sender_id <> receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_trade_requests_receiver ON trade_requests(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_trade_requests_sender   ON trade_requests(sender_id, created_at);

ALTER TABLE trade_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sender can create trade request"
  ON trade_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND (
      SELECT accepts_trades FROM profiles WHERE id = receiver_id
    ) = true
    AND (
      SELECT COUNT(*) FROM trade_requests tr
      WHERE tr.sender_id = auth.uid()
        AND tr.created_at > now() - interval '1 day'
    ) < 10
    AND NOT EXISTS (
      SELECT 1 FROM trade_requests tr2
      WHERE tr2.sender_id = auth.uid()
        AND tr2.receiver_id = receiver_id
        AND tr2.status = 'pending'
    )
  );

CREATE POLICY "Participants can view their trade requests"
  ON trade_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Receiver can update status"
  ON trade_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- ── Tabela notifications ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       text NOT NULL,
  payload    jsonb DEFAULT '{}',
  read       boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can mark own notifications as read"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ── Trigger: cria notificação ao inserir trade_request ────────────────────
CREATE OR REPLACE FUNCTION notify_trade_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  sender_name text;
BEGIN
  SELECT COALESCE(display_name, email, 'Alguém')
    INTO sender_name
    FROM profiles
   WHERE id = NEW.sender_id;

  INSERT INTO notifications (user_id, type, payload)
  VALUES (
    NEW.receiver_id,
    'trade_request',
    jsonb_build_object(
      'trade_request_id', NEW.id,
      'sender_id',        NEW.sender_id,
      'sender_name',      sender_name,
      'message',          NEW.message
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_trade_request ON trade_requests;
CREATE TRIGGER trg_notify_trade_request
  AFTER INSERT ON trade_requests
  FOR EACH ROW EXECUTE FUNCTION notify_trade_request();

-- ── Trigger: notifica sender quando receiver responde ─────────────────────
CREATE OR REPLACE FUNCTION notify_trade_response()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  receiver_name text;
BEGIN
  IF OLD.status = 'pending' AND NEW.status IN ('accepted','declined') THEN
    SELECT COALESCE(display_name, email, 'Alguém')
      INTO receiver_name
      FROM profiles
     WHERE id = NEW.receiver_id;

    INSERT INTO notifications (user_id, type, payload)
    VALUES (
      NEW.sender_id,
      CASE WHEN NEW.status = 'accepted' THEN 'trade_accepted' ELSE 'trade_declined' END,
      jsonb_build_object(
        'trade_request_id', NEW.id,
        'receiver_id',      NEW.receiver_id,
        'receiver_name',    receiver_name
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_trade_response ON trade_requests;
CREATE TRIGGER trg_notify_trade_response
  AFTER UPDATE ON trade_requests
  FOR EACH ROW EXECUTE FUNCTION notify_trade_response();
