CREATE TABLE addon_catalog (
 id uuid PRIMARY KEY,name text NOT NULL,price integer NOT NULL CHECK(price>=0),partner_price integer CHECK(partner_price>=0),
 entitlement_key text NOT NULL CHECK(entitlement_key IN ('photos','storage','voice','video','notes','guests','submitDays','galleryDays','exportDays')),
 units bigint NOT NULL CHECK(units>0),enabled boolean NOT NULL DEFAULT false,version integer NOT NULL DEFAULT 1
);
ALTER TABLE addon_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY addons_read ON addon_catalog FOR SELECT USING(enabled OR kv_admin());
CREATE TABLE credit_grants (
 id uuid PRIMARY KEY,org_id uuid NOT NULL REFERENCES organizations(id),plan_id text NOT NULL REFERENCES plans(id),
 snapshot jsonb NOT NULL,units integer NOT NULL CHECK(units>0),reason text NOT NULL,actor_id uuid NOT NULL REFERENCES users(id),
 idempotency_key uuid NOT NULL UNIQUE,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX credit_grants_org_idx ON credit_grants(org_id,created_at);
CREATE INDEX credit_grants_plan_idx ON credit_grants(plan_id);
CREATE INDEX credit_grants_actor_idx ON credit_grants(actor_id);
CREATE TABLE credit_reservations (
 id uuid PRIMARY KEY,grant_id uuid NOT NULL REFERENCES credit_grants(id),org_id uuid NOT NULL REFERENCES organizations(id),
 user_id uuid NOT NULL REFERENCES users(id),state text NOT NULL DEFAULT 'reserved' CHECK(state IN ('reserved','redeemed','released')),
 order_id uuid REFERENCES orders(id),expires_at timestamptz NOT NULL DEFAULT (now()+interval '30 minutes'),
 idempotency_key uuid NOT NULL UNIQUE,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX credit_reservations_grant_idx ON credit_reservations(grant_id);
CREATE INDEX credit_reservations_org_idx ON credit_reservations(org_id,state);
CREATE INDEX credit_reservations_user_idx ON credit_reservations(user_id);
CREATE INDEX credit_reservations_order_idx ON credit_reservations(order_id);
CREATE INDEX credit_reservations_expiry_idx ON credit_reservations(expires_at) WHERE state='reserved';
CREATE TABLE credit_ledger (
 id uuid PRIMARY KEY,grant_id uuid NOT NULL REFERENCES credit_grants(id),org_id uuid NOT NULL REFERENCES organizations(id),
 reservation_id uuid REFERENCES credit_reservations(id),kind text NOT NULL CHECK(kind IN ('grant','reserve','redeem','release','refund')),
 delta integer NOT NULL,actor_id uuid REFERENCES users(id),created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(reservation_id,kind)
);
CREATE INDEX credit_ledger_grant_idx ON credit_ledger(grant_id);
CREATE INDEX credit_ledger_org_idx ON credit_ledger(org_id,created_at);
CREATE INDEX credit_ledger_actor_idx ON credit_ledger(actor_id);
CREATE FUNCTION prevent_credit_mutation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Credit ledger is append-only'; END $$;
CREATE TRIGGER credit_ledger_immutable BEFORE UPDATE OR DELETE ON credit_ledger FOR EACH ROW EXECUTE FUNCTION prevent_credit_mutation();
REVOKE EXECUTE ON FUNCTION prevent_credit_mutation() FROM PUBLIC;
ALTER TABLE credit_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY credit_grants_read ON credit_grants FOR SELECT USING(kv_admin() OR kv_org(org_id));
CREATE POLICY credit_reservations_read ON credit_reservations FOR SELECT USING(kv_admin() OR kv_org(org_id));
CREATE POLICY credit_ledger_read ON credit_ledger FOR SELECT USING(kv_admin() OR kv_org(org_id));

CREATE TABLE notification_templates (
 id text PRIMARY KEY,subject text NOT NULL,body text NOT NULL,enabled boolean NOT NULL DEFAULT false,version integer NOT NULL DEFAULT 1
);
CREATE TABLE notification_outbox (
 id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES users(id),event_id uuid REFERENCES events(id),template_id text NOT NULL REFERENCES notification_templates(id),
 recipient text NOT NULL,subject text NOT NULL,body text NOT NULL,template_version integer NOT NULL,
 state text NOT NULL DEFAULT 'queued' CHECK(state IN ('queued','sending','sent','failed')),attempts integer NOT NULL DEFAULT 0,
 idempotency_key text NOT NULL UNIQUE,error text,next_attempt_at timestamptz NOT NULL DEFAULT now(),created_at timestamptz NOT NULL DEFAULT now(),sent_at timestamptz
);
CREATE INDEX notification_outbox_queue_idx ON notification_outbox(state,next_attempt_at);
CREATE INDEX notification_outbox_user_idx ON notification_outbox(user_id,created_at);
CREATE INDEX notification_outbox_event_idx ON notification_outbox(event_id);
CREATE INDEX notification_outbox_template_idx ON notification_outbox(template_id);
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_outbox ENABLE ROW LEVEL SECURITY;
CREATE POLICY notification_templates_admin ON notification_templates FOR SELECT USING(kv_admin());
CREATE POLICY notification_outbox_admin ON notification_outbox FOR SELECT USING(kv_admin());
INSERT INTO notification_templates(id,subject,body) VALUES
 ('order_status','Perkembangan acara {{name}}','Status pesanan {{orderId}}: {{status}}. Buka portal pesanan Anda untuk melihat detail.'),
 ('retention','Masa penyimpanan {{name}} akan berakhir','Unduh kenangan {{name}} melalui portal sebelum {{date}}. Hubungi penyelenggara bila membutuhkan bantuan.');
REVOKE ALL ON addon_catalog,credit_grants,credit_reservations,credit_ledger,notification_templates,notification_outbox FROM PUBLIC;
DO $$ DECLARE r text; BEGIN
 FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON addon_catalog,credit_grants,credit_reservations,credit_ledger,notification_templates,notification_outbox FROM %I',r); END IF;
 END LOOP;
END $$;
