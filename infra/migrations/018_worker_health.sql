CREATE TABLE worker_health (id text PRIMARY KEY,last_seen_at timestamptz NOT NULL DEFAULT now(),detail jsonb NOT NULL DEFAULT '{}');
ALTER TABLE worker_health ENABLE ROW LEVEL SECURITY;
CREATE POLICY worker_health_admin ON worker_health FOR SELECT USING(kv_admin());
REVOKE ALL ON worker_health FROM PUBLIC;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON worker_health FROM anon; END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON worker_health FROM authenticated; END IF;
END $$;
ALTER TABLE payment_adjustments ALTER COLUMN actor_id DROP NOT NULL;
ALTER TABLE payment_adjustments ADD CONSTRAINT payment_actor_required CHECK(kind='expire' OR actor_id IS NOT NULL);
