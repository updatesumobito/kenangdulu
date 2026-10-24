ALTER TABLE frames ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1 CHECK(version>0);
ALTER TABLE frames ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE frame_revisions (
 id uuid PRIMARY KEY,
 frame_id uuid NOT NULL REFERENCES frames(id) ON DELETE CASCADE,
 event_id uuid NOT NULL REFERENCES events(id),
 version integer NOT NULL CHECK(version>0),
 name text NOT NULL,
 schema jsonb NOT NULL,
 actor_id uuid REFERENCES users(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(frame_id,version)
);
CREATE INDEX frame_revisions_event_idx ON frame_revisions(event_id,created_at DESC);
CREATE INDEX frame_revisions_actor_idx ON frame_revisions(actor_id);
ALTER TABLE frame_revisions ENABLE ROW LEVEL SECURITY;
-- API authorization is enforced with eventAccess; direct SQL follows existing event tenancy.
CREATE POLICY frame_revisions_read ON frame_revisions FOR SELECT USING (
 EXISTS(SELECT 1 FROM events e WHERE e.id=frame_revisions.event_id)
);
CREATE TABLE frame_asset_links (
 frame_id uuid NOT NULL REFERENCES frames(id) ON DELETE CASCADE,
 asset_id uuid NOT NULL REFERENCES frame_assets(id) ON DELETE CASCADE,
 event_id uuid NOT NULL REFERENCES events(id),
 PRIMARY KEY(frame_id,asset_id)
);
CREATE INDEX frame_asset_links_asset_idx ON frame_asset_links(asset_id);
CREATE INDEX frame_asset_links_event_idx ON frame_asset_links(event_id);
ALTER TABLE frame_asset_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY frame_asset_links_read ON frame_asset_links FOR SELECT USING (
 EXISTS(SELECT 1 FROM events e WHERE e.id=frame_asset_links.event_id)
);
-- Browser roles never write these tables directly. The private application role owns writes.
REVOKE ALL ON frame_revisions,frame_asset_links FROM PUBLIC;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
  REVOKE ALL ON frame_revisions,frame_asset_links FROM anon;
 END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
  REVOKE ALL ON frame_revisions,frame_asset_links FROM authenticated;
 END IF;
END $$;
