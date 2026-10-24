CREATE POLICY members_read ON members FOR SELECT USING(user_id=kv_user() OR kv_org(org_id) OR kv_admin());
CREATE POLICY events_org_member_read ON events FOR SELECT USING(
 channel='PARTNER_SELF_SERVICE' AND EXISTS(SELECT 1 FROM members m WHERE m.org_id=events.org_id AND m.user_id=kv_user() AND m.permissions ?| ARRAY['gallery_view','event_edit','media_moderate','live_wall_view','media_export'])
);
CREATE POLICY organizations_member_read ON organizations FOR SELECT USING(EXISTS(SELECT 1 FROM members m WHERE m.org_id=organizations.id AND m.user_id=kv_user()));
CREATE POLICY orders_org_billing_read ON orders FOR SELECT USING(EXISTS(SELECT 1 FROM members m WHERE m.org_id=orders.org_id AND m.user_id=kv_user() AND m.permissions ? 'billing_view'));
CREATE INDEX IF NOT EXISTS members_user_org_idx ON members(user_id,org_id);
CREATE FUNCTION enqueue_order_status() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE t notification_templates%ROWTYPE; target_email text; dedupe text; BEGIN
 IF NEW.status=OLD.status AND NEW.fulfillment=OLD.fulfillment THEN RETURN NEW; END IF;
 SELECT * INTO t FROM notification_templates WHERE id='order_status' AND enabled=true;
 IF NOT FOUND THEN RETURN NEW; END IF;
 SELECT email INTO target_email FROM users WHERE id=NEW.user_id;
 IF target_email IS NULL THEN RETURN NEW; END IF;
 dedupe:='order:'||NEW.id::text||':'||NEW.status||':'||NEW.fulfillment||':'||NEW.revision_count::text;
 INSERT INTO notification_outbox(id,user_id,template_id,recipient,subject,body,template_version,idempotency_key)
 VALUES(gen_random_uuid(),NEW.user_id,t.id,target_email,replace(t.subject,'{{name}}',NEW.brief->>'name'),replace(replace(replace(t.body,'{{name}}',NEW.brief->>'name'),'{{orderId}}',NEW.id::text),'{{status}}',NEW.status||' / '||NEW.fulfillment),t.version,dedupe)
 ON CONFLICT(idempotency_key) DO NOTHING;
 RETURN NEW;
END $$;
CREATE TRIGGER order_status_outbox AFTER UPDATE OF status,fulfillment ON orders FOR EACH ROW EXECUTE FUNCTION enqueue_order_status();
REVOKE EXECUTE ON FUNCTION enqueue_order_status() FROM PUBLIC;
