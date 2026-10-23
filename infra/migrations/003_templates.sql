CREATE TABLE IF NOT EXISTS frame_assets(id uuid PRIMARY KEY,event_id uuid NOT NULL REFERENCES events(id),object_key text NOT NULL,mime text NOT NULL,bytes integer NOT NULL,created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS templates(id uuid PRIMARY KEY,name text NOT NULL,schema jsonb NOT NULL,created_by uuid REFERENCES users(id),created_at timestamptz DEFAULT now());
ALTER TABLE frame_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY templates_read ON templates FOR SELECT USING(true);
CREATE TABLE IF NOT EXISTS entitlement_changes(id uuid PRIMARY KEY,event_id uuid NOT NULL REFERENCES events(id),order_id uuid NOT NULL UNIQUE REFERENCES orders(id),actor_id uuid REFERENCES users(id),previous_snapshot jsonb NOT NULL,new_snapshot jsonb NOT NULL,reason text NOT NULL,created_at timestamptz DEFAULT now());
ALTER TABLE entitlement_changes ENABLE ROW LEVEL SECURITY;
