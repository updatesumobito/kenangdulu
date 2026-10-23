CREATE TABLE event_couple_access (
 event_id uuid PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
 code_hash text NOT NULL,
 enabled boolean NOT NULL DEFAULT true,
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE event_couple_access ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON event_couple_access FROM PUBLIC;
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
  REVOKE ALL ON event_couple_access FROM anon;
 END IF;
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
  REVOKE ALL ON event_couple_access FROM authenticated;
 END IF;
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='komukuna_backend') THEN
  GRANT SELECT,INSERT,UPDATE,DELETE ON event_couple_access TO komukuna_backend;
  CREATE POLICY komukuna_backend_access ON event_couple_access FOR ALL TO komukuna_backend USING (true) WITH CHECK (true);
 END IF;
END $$;
