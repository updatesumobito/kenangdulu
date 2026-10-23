-- Interactive Supabase API roles and the private backend connection use
-- separate policies. Table access remains revoked from the public API roles.
ALTER POLICY events_read ON public.events TO authenticated;
ALTER POLICY events_edit ON public.events TO authenticated;
ALTER POLICY orders_read ON public.orders TO authenticated;
ALTER POLICY media_read ON public.media TO authenticated;
ALTER POLICY frames_read ON public.frames TO authenticated;
ALTER POLICY user_self ON public.users TO authenticated;
ALTER POLICY org_self ON public.organizations TO authenticated;
ALTER POLICY staff_self ON public.event_staff TO authenticated;
ALTER POLICY revisions_read ON public.revisions TO authenticated;
ALTER POLICY requests_read ON public.requests TO authenticated;
ALTER POLICY documents_read ON public.documents TO authenticated;
ALTER POLICY templates_read ON public.templates TO authenticated;
