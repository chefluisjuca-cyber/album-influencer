-- 1. Alter database defaults for profiles
ALTER TABLE public.profiles ALTER COLUMN show_in_nearby SET DEFAULT true;
ALTER TABLE public.profiles ALTER COLUMN accepts_trades SET DEFAULT true;

-- 2. Create trigger to automatically insert a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, show_in_nearby, accepts_trades, is_premium)
  VALUES (
    new.id,
    COALESCE(split_part(new.email, '@', 1), 'Colecionador'),
    true,
    true,
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill any missing profiles and ensure all existing profiles have show_in_nearby set to true
INSERT INTO public.profiles (id, display_name, show_in_nearby, accepts_trades, is_premium)
SELECT 
  id,
  COALESCE(split_part(email, '@', 1), 'Colecionador'),
  true,
  true,
  false
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET show_in_nearby = true;
