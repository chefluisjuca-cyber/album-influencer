/*
  # Criar tabela de coleções

  1. Nova Tabela
    - `collections`
      - `id` (uuid, primary key)
      - `user_id` (uuid, referência ao auth.users)
      - `data` (jsonb) — o mapa completo da coleção { [sectionCode]: { [stickerId]: count } }
      - `updated_at` (timestamptz)

  2. Segurança
    - RLS habilitado: cada usuário acessa apenas sua própria coleção
    - SELECT: usuário autenticado lê apenas seu próprio registro
    - INSERT: usuário autenticado insere apenas com seu próprio user_id
    - UPDATE: usuário autenticado atualiza apenas seu próprio registro
    - DELETE: usuário autenticado deleta apenas seu próprio registro
*/

CREATE TABLE IF NOT EXISTS collections (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data       jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT collections_user_id_unique UNIQUE (user_id)
);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own collection"
  ON collections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collection"
  ON collections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collection"
  ON collections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own collection"
  ON collections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
