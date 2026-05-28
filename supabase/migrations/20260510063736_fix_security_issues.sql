/*
  # Fix Security Issues

  ## Changes

  1. Fix mutable search_path on trigger functions
     - Recreate `notify_trade_request` and `notify_trade_response` with `SET search_path = ''`
       and fully-qualified table names.

  2. Fix notifications INSERT policy (always-true WITH CHECK)
     - Drop the overly permissive "System can insert notifications" policy.
     - Trigger functions run as SECURITY DEFINER (postgres role) and bypass RLS,
       so they can still insert without a permissive policy.

  3. Revoke EXECUTE on trigger functions from anon and authenticated
     - These are trigger-only and must not be callable directly via REST.

  4. Revoke EXECUTE on PostGIS st_estimatedextent variants from public roles
     - These SECURITY DEFINER functions don't need to be publicly callable.

  Note: spatial_ref_sys RLS and postgis schema relocation are extension-managed
  and cannot be changed without superuser/extension ownership — skipped.
*/

-- ── 1. Fix mutable search_path: notify_trade_request ──────────────────────────
CREATE OR REPLACE FUNCTION public.notify_trade_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  sender_name text;
BEGIN
  SELECT COALESCE(p.display_name, au.email, 'Alguém')
    INTO sender_name
    FROM public.profiles p
    JOIN auth.users au ON au.id = p.id
   WHERE p.id = NEW.sender_id;

  INSERT INTO public.notifications (user_id, type, payload)
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

-- ── 2. Fix mutable search_path: notify_trade_response ─────────────────────────
CREATE OR REPLACE FUNCTION public.notify_trade_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  receiver_name text;
BEGIN
  IF OLD.status = 'pending' AND NEW.status IN ('accepted', 'declined') THEN
    SELECT COALESCE(p.display_name, au.email, 'Alguém')
      INTO receiver_name
      FROM public.profiles p
      JOIN auth.users au ON au.id = p.id
     WHERE p.id = NEW.receiver_id;

    INSERT INTO public.notifications (user_id, type, payload)
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

-- ── 3. Fix notifications INSERT policy (always-true WITH CHECK) ───────────────
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- ── 4. Revoke direct EXECUTE on trigger functions ─────────────────────────────
REVOKE EXECUTE ON FUNCTION public.notify_trade_request()  FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_trade_response() FROM anon, authenticated;

-- ── 5. Revoke EXECUTE on PostGIS st_estimatedextent from public roles ──────────
REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text)                FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text)          FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text, boolean) FROM anon, authenticated;
