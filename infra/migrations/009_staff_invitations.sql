CREATE TABLE IF NOT EXISTS staff_invitations (
 id uuid PRIMARY KEY,
 event_id uuid NOT NULL REFERENCES events(id),
 email text NOT NULL,
 permissions jsonb NOT NULL,
 token_hash text UNIQUE NOT NULL,
 created_by uuid NOT NULL REFERENCES users(id),
 expires_at timestamptz NOT NULL DEFAULT now()+interval '7 days',
 accepted_at timestamptz,
 revoked boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS staff_invitations_event_idx ON staff_invitations(event_id);
CREATE INDEX IF NOT EXISTS staff_invitations_creator_idx ON staff_invitations(created_by);
ALTER TABLE staff_invitations ENABLE ROW LEVEL SECURITY;
