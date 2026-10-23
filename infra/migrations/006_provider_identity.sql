ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider_id uuid UNIQUE;
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS organizations_owner_idx ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS orders_user_idx ON orders(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS orders_designer_idx ON orders(designer_id);
CREATE INDEX IF NOT EXISTS events_customer_idx ON events(customer_id);
CREATE INDEX IF NOT EXISTS staff_user_idx ON event_staff(user_id);
CREATE INDEX IF NOT EXISTS guests_event_idx ON guests(event_id);
CREATE INDEX IF NOT EXISTS media_guest_idx ON media(guest_id);
CREATE INDEX IF NOT EXISTS jobs_event_idx ON jobs(event_id);
CREATE INDEX IF NOT EXISTS audit_event_idx ON audit(event_id,created_at DESC);
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE migrations ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION kv_user() RETURNS uuid LANGUAGE sql STABLE
SET search_path = '' AS $$ SELECT nullif(current_setting('app.user_id',true),'')::uuid $$;
