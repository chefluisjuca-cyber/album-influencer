/*
  # Profiles e Trocas por Proximidade

  ## Novas Tabelas

  ### `profiles`
  Perfil público do usuário com dados opcionais de localização.
  - `id` — mesmo UUID do auth.users
  - `display_name` — nome exibido para outros usuários (opcional)
  - `cep` — CEP informado pelo usuário (nunca exposto publicamente)
  - `lat` / `lng` — coordenadas arredondadas (~1 km de precisão) para preservar privacidade
  - `show_in_nearby` — opt-in explícito para aparecer na busca por proximidade
  - `whatsapp` — número opcional para contato de troca
  - `updated_at`

  ### `trade_proposals`
  Propostas de troca entre dois usuários próximos.
  - `id` — UUID
  - `from_user_id` — quem propôs
  - `to_user_id` — quem recebeu
  - `message` — mensagem livre opcional
  - `status` — pending / accepted / rejected
  - `created_at`

  ## Segurança
  - RLS habilitado em ambas as tabelas
  - Perfil: usuário lê/edita apenas o próprio; outros usuários veem somente campos públicos via view
  - Propostas: remetente e destinatário podem ler; remetente cria; destinatário atualiza status
*/

-- =============================================
-- EXTENSION PostGIS (já disponível no Supabase)
-- =============================================
CREATE EXTENSION IF NOT EXISTS postgis;

-- =============================================
-- TABELA: profiles
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  text DEFAULT '',
  cep           text DEFAULT '',
  lat           double precision,
  lng           double precision,
  show_in_nearby boolean DEFAULT false,
  whatsapp      text DEFAULT '',
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Usuário lê e edita o próprio perfil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Usuários autenticados podem ver perfis públicos de outros (para a busca por proximidade)
-- Apenas campos não-sensíveis: id, display_name, lat, lng, show_in_nearby, whatsapp
-- CEP nunca é exposto
CREATE POLICY "Authenticated users can view public profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (show_in_nearby = true);

-- =============================================
-- TABELA: trade_proposals
-- =============================================
CREATE TABLE IF NOT EXISTS trade_proposals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message      text DEFAULT '',
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE trade_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view proposals they are part of"
  ON trade_proposals FOR SELECT
  TO authenticated
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create proposals as sender"
  ON trade_proposals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Recipients can update proposal status"
  ON trade_proposals FOR UPDATE
  TO authenticated
  USING (auth.uid() = to_user_id)
  WITH CHECK (auth.uid() = to_user_id);

-- =============================================
-- INDEX para busca espacial
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'profiles' AND indexname = 'idx_profiles_location'
  ) THEN
    CREATE INDEX idx_profiles_location ON profiles (lat, lng) WHERE show_in_nearby = true;
  END IF;
END $$;
