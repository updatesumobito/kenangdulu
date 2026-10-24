ALTER TABLE orders ADD COLUMN IF NOT EXISTS deadline timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal' CHECK(priority IN ('normal','high','urgent'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS material_checklist jsonb NOT NULL DEFAULT '{}';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_expires_at timestamptz NOT NULL DEFAULT (now()+interval '48 hours');
CREATE INDEX orders_work_queue_idx ON orders(fulfillment,deadline,created_at) WHERE status='paid';
CREATE INDEX orders_payment_expiry_idx ON orders(payment_expires_at) WHERE status IN ('awaiting_payment','payment_rejected','rejected');
CREATE TABLE payment_adjustments (
 id uuid PRIMARY KEY,order_id uuid NOT NULL REFERENCES orders(id),actor_id uuid NOT NULL REFERENCES users(id),
 kind text NOT NULL CHECK(kind IN ('cancel','expire','refund')),amount integer NOT NULL DEFAULT 0 CHECK(amount>=0),
 reason text NOT NULL,reference text NOT NULL DEFAULT '',idempotency_key uuid NOT NULL UNIQUE,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX payment_adjustments_order_idx ON payment_adjustments(order_id,created_at);
CREATE INDEX payment_adjustments_actor_idx ON payment_adjustments(actor_id);
ALTER TABLE payment_adjustments ENABLE ROW LEVEL SECURITY;
CREATE POLICY payment_adjustments_read ON payment_adjustments FOR SELECT USING(EXISTS(SELECT 1 FROM orders o WHERE o.id=payment_adjustments.order_id));
REVOKE ALL ON payment_adjustments FROM PUBLIC;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON payment_adjustments FROM anon; END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON payment_adjustments FROM authenticated; END IF;
END $$;
