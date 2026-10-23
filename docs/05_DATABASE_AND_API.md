# DATABASE & API — v2 NORMATIVE SCHEMA DELTA
**Apply these changes to legacy inventory below, then generate real checked-in migrations and RLS.**

## 1. New/modified entities
- `organizations`: `organization_type ENUM('platform','partner')`, owner, tenant branding.
- `customer_accounts`: id,user_id,contact fields, communication consents; direct buyers not assumed to own editable organization.
- `orders`: add `sales_channel ENUM('direct_managed','partner_self_service')`, `customer_account_id`, `purchasing_organization_id` nullable, `plan_entitlement_snapshot_id`, amount/taxes/discount snapshot, managed design reference.
- `event_fulfillment`: order_id,event_id, assigned_designer_id,status,request_deadline,preview_revision,approved_at,notes; manual handling states separate event status.
- `fulfillment_requests`: id,order_id,requester,kind (`assets|revision|correction`),message,attachments,status,counts_toward_quota,reason,reviewed_by,created_at.
- `event_customers`: event_id,customer_account_id, `role ENUM('buyer_viewer','client_approver','gallery_viewer')`, no edit privilege.
- `events`: add `sales_channel`, `managing_organization_id`, `customer_account_id` nullable, `order_id`, `published_settings_revision`; valid tenant ownership foreign keys; avoid nullable org that permits cross-access.
- `event_operator_assignments`: event_id,user_id,permission_mask/team role.
- `partner_credits` and `credit_transactions`: optional if enabled, ledger-backed and immutable adjustments; no phantom balance.
- `plan_entitlements`: video count, duration seconds, note count, memorybook enabled, `supports_frame`, `supports_strip`, film style count, total photo cap, guest identity cap, disposable per guest, voice count/time, gallery retention, owner export, livewall, revisions, storage bytes.
- `media_assets`: `kind=photo_strip|disposable_photo|voice|video_wish|wish_card|physical_booth`, duration, bytes, codec, video_playback_variant, processing state, moderation state, `consent_public_display` and source; short-lived signed access.
- `guest_identities` (or extend `guests`): event-scoped invited code hashed, verified flag, reservation scopes, no unnecessary phone mandatory.

## 2. SKU seeds **development only**
`MINI_99K`: price 99000, strip=false, frames=0, disposable_per_guest=15, guest_identity_cap=30, photo_outputs=450, voice_count=50, voice_sec=30, video_count=10, video_sec=15, notes=200, storage_gib=2, gallery_days=30, export_days=90, managed_revisions=0.
`CLASSIC_150K`: price 150000, strip=true, frames=1, guest_identity_cap=50, per_guest=15, photo_outputs=800, voice_count=100, voice_sec=30, video_count=20, video_sec=15, notes=500, storage_gib=4, gallery_days=60, revisions=1, livewall=true.
`CELEBRATION_299K`: price 299000, frames=3, per_guest=24, guest_identity_cap=100, photo_outputs=2000, voice=300x45s, video=50x30s, notes=1000, storage_gib=12, gallery_days=90, revisions=2, livewall=true, boomerang=true, memorybook=true.
`SIGNATURE_499K`: price 499000, frames=6, per_guest=36, guest_identity_cap=200, photo_outputs=5000, voice=800x60s, video=120x30s, notes=3000, storage_gib=35, gallery_days=90, revisions=3, livewall=true, boomerang=true, memorybook=true.

## 3. Mandatory endpoints (add to legacy routes)
- `POST /api/v1/direct/orders` public authenticated/guest-safe create; validates `MINI supports_frame=false`, contact+brief, terms; returns order/payment instructions no external charge.
- `GET /api/v1/direct/orders/:id`, `POST /api/v1/direct/orders/:id/assets`, `POST .../payment-proof`, `POST .../revision-requests`, `POST .../approve-preview`, `GET .../qr`, `GET .../gallery`, `POST .../exports`; **NO** direct customer PATCH event settings/frame API.
- `GET /api/v1/admin/fulfillment`, `PATCH /api/v1/admin/fulfillment/:id/assign`, `POST .../prepare`, `POST .../send-preview`, `POST .../resolve-revision`, `POST .../publish`; server verifies payment/approval or auditable override.
- `POST /api/v1/partner/organizations`, `GET /api/v1/partner/events`, `POST /api/v1/partner/events`, `PATCH /api/v1/partner/events/:id/settings`, `POST .../publish`, `POST .../frames`, `POST .../staff`, `GET .../analytics` all org and entitlement-checked; Mini frame ops return `PLAN_FEATURE_UNAVAILABLE`.
- `GET /api/v1/catalog/plans` sanitized runtime pricing; `PATCH /api/v1/admin/catalog/plans/:id` versioned with audit; `GET /api/v1/catalog/partner-pricing` only configured partner pricing, else unpriced contact flow.
- `POST /api/v1/guest/video/upload-intent`, `POST /api/v1/guest/video/:intentId/finalize` validates 15/30s after processing and max bytes, reserves quota; `POST .../voice`, `POST .../notes`; private access by scoped signed URL.
- `POST /api/v1/admin/events/:id/manual-physical-import`: receives only authorized final exports tagged physical_booth.

## 4. Authz policies & invariants
- Direct buyer is never `organization_admin` merely because they paid. Buyer `canView/approve/requestRevision`, not `canEditEvent`.
- Platform fulfill designer assigned order can set event but cannot verify payments/change plans without appropriate admin permission.
- Partner owner/editor `canEditEvent` only if event tenant matches AND purchase valid AND feature entitled; UI hiding alone insufficient.
- `MINI` backend attempts to create frame revision, photostrip intent or enable strip return 403/409 feature unavailable; no orphan frame records.
- Event photo total cap shared across modes; per-guest shot reservations and event bytes reserved atomically; prevent race when multiple clients finalize.
- Video job validates actual seconds/container/codec and updates usage only once. Failed/aborted upload releases reserved quota; no public ACL on raw bucket.

## 5. RLS/SQL test obligations
`platform_admin` cross-org superuser via server-only audited gate; `partner_owner` cannot SELECT/UPDATE other partner orders/events/media; `buyer` cannot UPDATE events/config/frames even their own event; `guest` can only create scoped own media; privileged service role never shipped client; all reads of private media routed via server authorization. Add transaction-race tests and direct HTTP negative cases.

---

## TECHNICAL REFERENCE (v1 details; use only where consistent with v2)

# DATABASE, API & DOMAIN CONTRACT — KOMUKUNA VIRTUAL
**Technical reference carried forward from v1.0 • schema blueprint, not applied migration**

## 1. Database principles
UUID primary keys, `created_at`/`updated_at` UTC timestamptz, per-event `timezone` IANA string default `Asia/Jakarta`; `organization_id`/`event_id` foreign keys; data-retention explicit. `auth.users` external managed table when Supabase used. RLS for user-scoped tables; anonymous guest access through controlled backend endpoints with signed event-scoped guest token, **not broad anonymous RLS**. Enumerated states with migrations/versioning. Index `(organization_id,event_id,created_at)` where appropriate; indexes for moderation, jobs, slug, payment.

## 2. Entity inventory
| Table | Fields / constraints / use |
|---|---|
| `organizations` | id, display_name, slug unique, owner_user_id, status, branding json, plan context |
| `organization_members` | organization_id,user_id,role; unique pair; invitation state |
| `events` | id,organization_id,slug,display_name,type,start_at,end_at,timezone,status,paused_at,published_revision_id,plan_snapshot_id; unique org+slug |
| `event_slug_aliases` | org_id,event_id,old_slug; no collision/reserved words; redirect only public safe |
| `event_settings_revisions` | id,event_id,revision_no,status draft/published,settings json validated,schema_version,created_by; unique event+revision |
| `event_modes` | event_id,mode,enabled,display_order,config json; unique event+mode |
| `themes` | id,owner_org_id nullable, name, version, approved assets, tokens json |
| `frame_templates` | id,org_id,event_id nullable,name,active_revision_id,visibility |
| `frame_revisions` | id,template_id,version,schema json,immutable published,asset refs,checksum |
| `plan_catalog` | id,code,price_idr,status,effective_from,effective_to |
| `plan_entitlements` | plan_id,photo_count,storage_bytes,frame_count,voice_count,guest_disposable_cap,disposable_exposure_cap,video_cap,expires config |
| `event_entitlements` | event_id,source_order_id,plan_snapshot,manual_override with audit; effective limits |
| `event_usage` | event_id,photo_finalized,voice_finalized,video_finalized,storage_used_bytes,storage_reserved_bytes,row_version |
| `guests` | id,event_id,display_name optional,invite_token_hash optional,identity_kind,verified_at; strict-key uniqueness as policy |
| `guest_sessions` | id,event_id,guest_id nullable,token_hash,client metadata privacy-minimal,expires_at,revoked_at |
| `capture_sessions` | id,event_id,guest_session_id,mode,frame_revision_id,state,config_snapshot,started_at,completed_at |
| `disposable_counters` | event_id,guest_id,limit,finalized_count,reserved_count,version; unique event+guest |
| `exposure_reservations` | id,event_id,guest_id, capture_session_id, expires_at, status, idempotency_key unique scoped,media_intent_id |
| `media_upload_intents` | id,event_id,session_id,object_key,client_key,size_max,content_type,state,reserved_bytes,expires_at; unique event+client_key |
| `media_assets` | id,event_id,guest_id,session_id,source,kind,object_key,thumbnail_key,bytes,width,height,duration_ms,privacy,moderation_status,processing_state,frame_revision_id,consent_revision,idempotency_key,created_at; unique event+idempotency_key |
| `wishes` | id,event_id,guest_id,text,card_template_id,media_asset_ids or junction,visibility,moderation status |
| `media_wishes` | wish_id,media_id,relation_type; fk pairs |
| `gallery_items` | id,event_id,media_id or wish_id,sort_order,visibility,approved_at,approved_by; uniqueness guards |
| `moderation_actions` | id,event_id,actor_id,action,target_type,target_id,reason,created_at |
| `display_tokens` | id,event_id,token_hash,scope,expires_at,revoked_at,created_by |
| `orders` | id,organization_id,event_id,plan_id,currency,total_idr,discount_idr,status,created_at |
| `payments` | id,order_id,method,status,proof_asset_key,external_ref,verified_by,verified_at,notes; no duplicated accepted payment evidence |
| `exports` | id,event_id,requested_by,scope,job_status,object_key,expires_at,file_count,bytes |
| `event_audit_logs` | id,event_id,actor_type,actor_id,action,old/new safe metadata,reason,created_at |
| `usage_events` | id,event_id,anonymous_session_hash,kind,payload_non_sensitive,created_at |
| `retention_requests` | id,event_id,requester,action,approved_at,completed_at,legal_hold marker |
| `device_integrations` | id,event_id,device_id,source_provider,secret_hash,revoked_at (P2) |

`media_assets` stores one object metadata row per upload; multi-output derivatives in `media_derivatives(id,asset_id,variant,object_key,bytes,checksum)`. Sensitive fields encrypted as necessary, not copied to analytics.

## 3. Key database invariants
- `event_usage` updated under row lock or atomic SQL statement that checks limits before increments. Never count exclusively in JS client.
- Capture/photo finalization must be exactly-once from the business perspective using unique idempotency key. Object storage is eventually reconciled, not assumed to support DB cross-service atomic transactions.
- `disposable_counters.finalized_count + reserved_count <= limit` transactionally when strict guest token used; reservation released on TTL with scheduled reconciliation.
- Asset `organization_id` may be denormalized but must be validated to match `events.organization_id`.
- `frame_revisions` and `event_settings_revisions` immutable after published. Capture session references snapshot IDs.
- Soft deletion hides immediately from queries and signed access, worker permanently deletes eligible physical objects after retention/hold constraints.
- `reveal_at` gating in **authorization query** and signed-read API, not only CSS blur in UI.

## 4. API conventions
REST `/api/v1`, JSON response `{data, meta}` or `{error:{code,message,details?,requestId}}`; ISO 8601 timestamps UTC, client renders event timezone. Mutations require auth token and idempotency key for uploads/payments, rate limiting, server-side Zod validation, origin/CORS policy. Errors code canonical: `EVENT_NOT_LIVE`, `PAYMENT_PENDING`, `GUEST_LIMIT_EXCEEDED`, `EVENT_QUOTA_EXCEEDED`, `UPLOAD_INTENT_EXPIRED`, `UNAUTHORIZED`, `MEDIA_NOT_APPROVED`, `REVEAL_NOT_STARTED`, `INVALID_FRAME`, `RATE_LIMITED`.

### Event admin endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/organizations/current` | tenant context, entitlements |
| GET/POST | `/events` | list / create draft |
| GET/PATCH | `/events/:id` | detail / mutate allowed metadata |
| POST | `/events/:id/publish` | validate paid + settings and publish revision |
| POST | `/events/:id/pause` / `resume` / `close` | operations |
| GET/PATCH | `/events/:id/settings/draft` | read/update draft schema |
| POST | `/events/:id/settings/publish` | immutable settings revision |
| GET/POST | `/events/:id/frames` | list/create template |
| POST | `/frames/:id/revisions` | save draft revision |
| POST | `/frames/:id/revisions/:ver/publish` | finalize frame immutable |
| GET | `/events/:id/qr-kit` | signed/download QR and poster |
| GET | `/events/:id/usage` | budget/remaining and counters |
| GET | `/events/:id/media` | paginated authorized list |
| POST | `/events/:id/moderation/batch` | approve/hide/reject |
| POST | `/events/:id/exports` | create authorized export job |
| GET | `/exports/:id` | status, temporary download |
| POST | `/events/:id/display-tokens` | create/revoke LED display scope |

### Guest endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/public/events/:slug/bootstrap` | sanitized public config/modes (no private refs) |
| POST | `/public/events/:slug/sessions` | issue scoped guest session after terms notice |
| POST | `/public/events/:slug/guest/verify` | invited guest identity if strict mode |
| GET | `/guest/me/limits` | mode quotas and remaining |
| POST | `/guest/capture-sessions` | session + frame snapshot |
| POST | `/guest/exposures/reserve` | atomic lease for disposable |
| POST | `/guest/media/intents` | authorize quota reservation and signed upload |
| POST | `/guest/media/:intentId/finalize` | object verify; mark once and enqueue |
| POST | `/guest/wishes` | validated text/card/audio references |
| GET | `/guest/gallery` | authorized and reveal-filtered pages |
| GET | `/guest/media/:id/access` | short-lived signed URL under policy |
| POST | `/guest/media/:id/report` | report abuse |

### Orders
`POST /orders`, `GET /orders/:id`, `POST /orders/:id/payment-proof` (signed upload), `POST /admin/payments/:id/approve|reject`. Gateway webhook only after provider chosen; verify signature and status transactionally.

## 5. Example upload intent payload
```json
{
  "eventId": "EVENT_UUID",
  "captureSessionId": "SESSION_UUID",
  "kind": "photostrip",
  "mimeType": "image/jpeg",
  "sizeBytes": 1048576,
  "idempotencyKey": "client-uuid-v4",
  "frameRevisionId": "FRAME_REV_UUID",
  "privacy": "private_owner"
}
```
Reply: `{intentId, objectKey, uploadUrl, expiresAt, maxBytes}` only if authorized. Guest must not choose arbitrary R2 objectKey. Server uploads finalize independent of trusting client JSON size; verify actual object.

## 6. Authorization policy examples
- Guest can create own media in event with active token and mode and quota; cannot enumerate other media or list tenant users.
- Owner/client may read event media of assigned event, including pre-reveal; client cannot change subscription/billing unless permitted.
- Operator may moderate assigned event but cannot view payment method/proofs.
- Public gallery returns ONLY approved/public eligible items, reveal date past, not deleted; signed URL TTL short.
- Display token scope `approved_live_wall_only`, audience-specific, revocable and bounded.
- Superadmin cross-tenant actions logged with reason. No browser client has Supabase service_role key.

## 7. Suggested migration order
Organization/membership > catalog/entitlements > event/settings/themes > frames/revisions > guest/session > media intent/counters > wishes/gallery/moderation > order/payment > exports/usage/audit. Write SQL constraints & RLS as migrations, seed **dev only**, backfill indexes. Use ephemeral test DB per migration smoke. Avoid schema-breaking changes during active pilot without migration plan.

## 8. Reconciliation & observability
Schedulers find expired reservations, completed-but-unfinalized objects, orphan storage keys, stalled workers, incorrect storage counters; act idempotently. Alert if pending processing > threshold or export failures. Daily billing/cost summary by event records GB-month usage and storage operations estimate. Never expose signed media URLs or bearer tokens in logs.
