-- The application authorizes requests in its Node API. Browser clients must
-- never read password hashes, session tokens or private media through REST.
-- Scope revocations to this application's objects, not Supabase-owned schemas.
DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'migrations','users','sessions','organizations','members','plans','orders',
    'events','event_staff','revisions','frames','requests','documents','guests',
    'invitations','guest_sessions','intents','media','display_tokens','jobs',
    'audit','reports','rate_limits','frame_assets','templates','entitlement_changes','upload_parts','staff_invitations','event_assets','preview_tokens'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', table_name);
  END LOOP;
END $$;
REVOKE EXECUTE ON FUNCTION public.kv_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.kv_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.kv_org(uuid) FROM PUBLIC, anon, authenticated;
