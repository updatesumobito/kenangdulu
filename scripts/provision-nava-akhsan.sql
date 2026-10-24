-- Explicit, atomic event copy. Run against the project's database as an operator.
-- Existing target events are left untouched on subsequent runs.
-- Copies configuration and access settings, never guest identities/media/sessions.
DO $$
<<copy_event>>
DECLARE
 source_event events%ROWTYPE;
 source_order orders%ROWTYPE;
 source_frame frames%ROWTYPE;
 event_id uuid := gen_random_uuid();
 order_id uuid := gen_random_uuid();
 frame_id uuid;
 new_settings jsonb;
 new_snapshot jsonb;
 source_brief jsonb;
 base_snapshot jsonb := '{}'::jsonb;
 legacy_snapshot text;
 frame_schema jsonb;
 published_frames jsonb;
 new_reveal timestamptz;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('provision:nava-akhsan',0));
 IF EXISTS(SELECT 1 FROM events WHERE slug='nava-akhsan') THEN
  RAISE NOTICE 'nava-akhsan already exists; no changes made';
  RETURN;
 END IF;
 SELECT * INTO STRICT source_event FROM events WHERE slug='wahyu-novita';
 SELECT * INTO STRICT source_order FROM orders WHERE id=source_event.order_id;
 IF NOT source_event.personal OR source_order.status<>'complimentary' THEN
  RAISE EXCEPTION 'Expected a personal, complimentary source event';
 END IF;
 IF EXISTS(SELECT 1 FROM frame_assets WHERE frame_assets.event_id=source_event.id)
 OR EXISTS(SELECT 1 FROM event_assets WHERE event_assets.event_id=source_event.id) THEN
  RAISE EXCEPTION 'Source has assets; copy storage and remap asset IDs before provisioning';
 END IF;
 new_settings := source_event.settings;
 new_snapshot := source_event.snapshot;
 source_brief := source_order.brief;
 -- Decode historical JSON strings only in the new copy; leave the source intact.
 WHILE jsonb_typeof(new_settings)='string' LOOP new_settings := (new_settings#>>'{}')::jsonb; END LOOP;
 WHILE jsonb_typeof(new_snapshot)='string' LOOP new_snapshot := (new_snapshot#>>'{}')::jsonb; END LOOP;
 WHILE jsonb_typeof(source_brief)='string' LOOP source_brief := (source_brief#>>'{}')::jsonb; END LOOP;
 -- Older snapshots spread an encoded plan string into numeric character keys.
 -- Recover that exact plan, then retain all explicit purchased quota overrides.
 SELECT string_agg(value#>>'{}','' ORDER BY key::integer) INTO legacy_snapshot
 FROM jsonb_each(new_snapshot) WHERE key ~ '^[0-9]+$';
 IF legacy_snapshot IS NOT NULL THEN
  base_snapshot := replace(legacy_snapshot,chr(92)||chr(34),chr(34))::jsonb;
  SELECT coalesce(jsonb_object_agg(key,value),'{}'::jsonb) INTO new_snapshot
  FROM jsonb_each(new_snapshot) WHERE key !~ '^[0-9]+$';
  new_snapshot := base_snapshot || new_snapshot;
 END IF;
 IF jsonb_typeof(new_snapshot)<>'object' OR jsonb_typeof(new_settings)<>'object' THEN
  RAISE EXCEPTION 'Source configuration could not be decoded';
 END IF;
 new_settings := new_settings || jsonb_build_object(
  'theme','curtain-olive','hashtag','#akhsanavainlove',
  'modes',(SELECT jsonb_agg(mode ORDER BY position) FROM jsonb_array_elements_text(new_settings->'modes') WITH ORDINALITY AS modes(mode,position) WHERE mode NOT IN ('photo_strip','gif'))
 );
 IF source_event.reveal_at IS NOT NULL THEN
  new_reveal := source_event.reveal_at + ('2026-10-25 00:00:00+07'::timestamptz-source_event.start_at);
  new_settings := jsonb_set(new_settings,'{revealAt}',to_jsonb(new_reveal));
 END IF;
 INSERT INTO orders(id,user_id,org_id,channel,plan_id,amount,snapshot,brief,status,fulfillment,designer_id)
 VALUES(order_id,source_order.user_id,source_order.org_id,source_order.channel,source_order.plan_id,0,new_snapshot,
  source_brief || jsonb_build_object('name','Nava & Akhsan','startAt','2026-10-25T00:00:00+07:00','endAt','2026-10-25T23:59:59+07:00','timezone','Asia/Jakarta','personal',true,'notes','Acara pribadi Nava & Akhsan, salinan konfigurasi Wahyu & Novita atas permintaan pemilik; tanpa transaksi pembayaran.'),
  'complimentary','delivered',source_order.designer_id);
 INSERT INTO events(id,order_id,org_id,customer_id,channel,slug,name,start_at,end_at,timezone,status,snapshot,settings,personal,revision,reveal_at)
 VALUES(event_id,order_id,source_event.org_id,source_event.customer_id,source_event.channel,'nava-akhsan','Nava & Akhsan',
  '2026-10-25 00:00:00+07','2026-10-25 23:59:59+07','Asia/Jakarta','live',new_snapshot,new_settings,true,1,new_reveal);
 FOR source_frame IN SELECT * FROM frames WHERE frames.event_id=source_event.id LOOP
  frame_id := gen_random_uuid();
  frame_schema := source_frame.schema;
  WHILE jsonb_typeof(frame_schema)='string' LOOP frame_schema := (frame_schema#>>'{}')::jsonb; END LOOP;
  -- Source is the legacy Maroon Moments template without external assets.
  IF frame_schema ? 'schemaVersion' THEN RAISE EXCEPTION 'Review v2 frame adaptation before provisioning'; END IF;
  frame_schema := frame_schema || jsonb_build_object('background','#150F03','text','Nava & Akhsan','textColor','#FAF4E8');
  INSERT INTO frames(id,event_id,name,schema,version) VALUES(frame_id,event_id,'Olive Moments',frame_schema,1);
  INSERT INTO frame_revisions(id,frame_id,event_id,version,name,schema,actor_id)
  VALUES(gen_random_uuid(),frame_id,event_id,1,'Olive Moments',frame_schema,source_event.customer_id);
 END LOOP;
 SELECT coalesce(jsonb_agg(to_jsonb(f) ORDER BY f.id),'[]'::jsonb) INTO published_frames FROM frames f WHERE f.event_id=copy_event.event_id;
 UPDATE events SET published=jsonb_build_object('settings',new_settings,'frames',published_frames) WHERE id=event_id;
 INSERT INTO revisions(id,event_id,version,settings,frames) VALUES(gen_random_uuid(),event_id,1,new_settings,published_frames);
 INSERT INTO event_couple_access(event_id,code_hash,enabled)
 SELECT copy_event.event_id,code_hash,enabled FROM event_couple_access WHERE event_couple_access.event_id=source_event.id;
 INSERT INTO event_staff(event_id,user_id,permissions)
 SELECT copy_event.event_id,user_id,permissions FROM event_staff WHERE event_staff.event_id=source_event.id;
 INSERT INTO audit(id,actor_id,event_id,action,detail)
 VALUES(gen_random_uuid(),source_event.customer_id,event_id,'personal.event.duplicate',jsonb_build_object('sourceSlug','wahyu-novita','targetSlug','nava-akhsan','theme','curtain-olive','copiedGuestMedia',false));
 RAISE NOTICE 'Created nava-akhsan: %',event_id;
END $$;
