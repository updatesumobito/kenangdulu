CREATE TABLE IF NOT EXISTS event_assets (
 id uuid PRIMARY KEY,event_id uuid NOT NULL REFERENCES events(id),
 object_key text NOT NULL,mime text NOT NULL,bytes integer NOT NULL CHECK(bytes>0),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS event_assets_event_idx ON event_assets(event_id);
ALTER TABLE event_assets ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS preview_tokens (
 token_hash text PRIMARY KEY,event_id uuid NOT NULL REFERENCES events(id),
 snapshot jsonb NOT NULL,expires_at timestamptz NOT NULL,
 revoked boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS preview_tokens_event_idx ON preview_tokens(event_id);
ALTER TABLE preview_tokens ENABLE ROW LEVEL SECURITY;
