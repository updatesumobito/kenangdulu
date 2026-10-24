-- Match the existing private server role. Browser roles remain denied.
DO $$ DECLARE t text; BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='komukuna_backend') THEN
  FOREACH t IN ARRAY ARRAY['frame_asset_links','addon_catalog','credit_reservations','notification_templates','notification_outbox','worker_health'] LOOP
   EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON %I TO komukuna_backend',t);
   EXECUTE format('CREATE POLICY komukuna_backend_access ON %I FOR ALL TO komukuna_backend USING (true) WITH CHECK (true)',t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['frame_revisions','payment_adjustments','credit_grants','credit_ledger'] LOOP
   EXECUTE format('GRANT SELECT,INSERT ON %I TO komukuna_backend',t);
   EXECUTE format('CREATE POLICY komukuna_backend_access ON %I FOR ALL TO komukuna_backend USING (true) WITH CHECK (true)',t);
  END LOOP;
  GRANT EXECUTE ON FUNCTION enqueue_order_status(),prevent_credit_mutation() TO komukuna_backend;
 END IF;
END $$;
CREATE FUNCTION prevent_history_mutation() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER AS $$
BEGIN RAISE EXCEPTION 'Historical revisions and financial records are immutable'; END $$;
CREATE TRIGGER frame_revisions_immutable BEFORE UPDATE OR DELETE ON frame_revisions FOR EACH ROW EXECUTE FUNCTION prevent_history_mutation();
CREATE TRIGGER payment_adjustments_immutable BEFORE UPDATE OR DELETE ON payment_adjustments FOR EACH ROW EXECUTE FUNCTION prevent_history_mutation();
CREATE TRIGGER credit_grants_immutable BEFORE UPDATE OR DELETE ON credit_grants FOR EACH ROW EXECUTE FUNCTION prevent_history_mutation();
REVOKE EXECUTE ON FUNCTION prevent_history_mutation() FROM PUBLIC;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='komukuna_backend') THEN GRANT EXECUTE ON FUNCTION prevent_history_mutation() TO komukuna_backend; END IF;
END $$;
