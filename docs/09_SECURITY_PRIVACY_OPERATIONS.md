# SECURITY, PRIVACY, ORDER OPERATIONS — v2 ADDITIONS

## Different operational responsibilities
- Direct buyer: orders and preview only, managed-service worker permissions. Client data may contain full names/voice/video; minimize PII. Upload materials for team must remain private.
- WO/vendor: full event management **only in own tenant**. Invite operators restricted; revocations immediate for new signed access. Display client workspaces do not inherit organization admin permissions.
- Mini no-frame enforced at server. A malicious buyer/partner cannot unlock strip/frame via hidden URL or API payload.
- Payment proof private; admin manual verify and audit reason; no automatic real-money charge or refunds without authorized process. Store payment/order/plan snapshots and activity logs.
- Short video allowed on Mini: enforce actual 15s duration, limited bytes, mime/content validation, queue size and worker sandbox, playback transcode, idempotent upload, signed links. A bad media file may not block entire event. Avoid capturing faces for identity matching; verification codes only when needed.
- Consent modal states whether guest media is private or displayed publicly. Audio/video private by default; livewall may only show admin-approved media with separate opt-in. Do not silently publish voice/video.
- Support rights requests/retention with storage purge and signed URL expiry; event metadata and billing retention rules separated from media. Legal/policy review before paid production launch.
- Monitoring: task queue backlog/transcode time, bytes per Mini event, 4xx media limits, cross-tenant denial logs (without leaking tokens), unexpected direct buyer editor requests, upload/finalize orphan intents.

---

## TECHNICAL REFERENCE (v1 details; use only where consistent with v2)

# SECURITY, PRIVACY, RETENTION & RUNBOOKS
**For event photos, voices, and videos (personal media). Legal review required before public sale.**

## 1. Threat model
Assets include private guest photos, voice wishes, raw-ish captures, invite tokens, admin accounts, payment proofs and event client data. Threats: guessing public QR/media object key, one tenant accessing other tenant files, token reuse, forged usage counters, storage exhaustion, malicious file upload including active SVG, video bombs, spam/abuse on live wall, accidental public display of private audio, leaking signed media URL in analytics/referrers, compromised device token (M6).

## 2. Access and privacy default
All events private owner-only media by default. Consent records for media upload separate from permission to show in public gallery/LED; voice/video private owner by default. Public gallery toggled explicitly. User receives notice identifying purpose, visibility, retention and contact. QR is a **discoverability link**, not an authorization grant to full gallery. Image/media download through signed short-lived URL, validated each request. Mask/strip EXIF GPS, don't track face biometrics. Avoid sharing phone/identity in gallery.

## 3. Technical defenses
- DB RLS by organization membership and event; API checks scope as well; verify with cross-tenant tests.
- Event guest session short TTL, secret random signed, revoke support; invite codes stored as hash, one-time where desired.
- Rate limiting per token/IP composite (respect shared venue NAT), upload caps by MIME bytes/dimensions/duration, malware scanning where feasible.
- CORS narrow for R2 PUT, bucket private, object key random opaque path, signed GET restricted.
- Storage finalize verifies actual R2 object by HEAD+sniff/worker, checks object size not trusting client claims; rejected files deleted.
- Browser render sanitized fonts/text, URL whitelist, disallow user HTML; SVG sanitize or rasterize before showing/uploading from unknown sources.
- Passwords via trusted auth provider, MFA for admins recommended, CSRF protection cookie actions, webhook signature verification later.
- Secrets in deployment secrets, never in frontend or logs; avoid preserving personal media in debug/error logs.
- Moderation queue auto/manual based on policy; live wall public only approved and consented entries.

## 4. Retention policy proposal (must appear at purchase/consent)
- Essential guest-facing gallery 30 days, Celebration 60, Signature 90; owner export accessible up to H+90 by default.
- H = event end in event's IANA timezone, not server UTC calendar date.
- Close guest submissions H+3/H+7/H+14 by plan. Plan extensions independent and auditable.
- Before eligible irreversible deletion notify owner via verified channel (e.g., 14 days and 3 days prior), then soft-delete and grace workflow, legal hold overrides delete.
- Media from physical booth only copies uploaded to platform may be deleted under platform policy; local Mokabooth originals remain untouched.
- Backups: maintain DB daily snapshots, test restore; object-storage backup/versioning according to cost and policy; purge semantics documented including backup retention.
- Event and records data may have distinct accounting/legal retention from guest media. Do not promise instant complete deletion of all backups.

## 5. Operational observability
Metrics by event: upload attempts/completions, storage bytes, thumbnail processing lag, queue failures, moderation backlog, realtime active displays, guest camera error distribution, signed URL errors, order/payments, cost estimates by tenant/event. Structured request ID trace across upload intent/finalize/worker; no tokens/URLs/private payloads in logs. Set alerts for queue backlog, bucket quota and cross-tenant denial anomalies.

## 6. Venue/operator runbook
**Before event:** confirm payment/activation, URL + QR (test 2 different phones), HTTPS, camera permission, frame, usage limits, internet stability, fallback upload, live wall screen approved-only, event end/reveal timezone, operator account, backup ZIP policy. Print A3 poster QR with generous quiet zone and test at intended print size.

**During event:** operator checks dashboard heartbeat and upload success; can pause public display; if malicious asset appears, hide immediately and revoke display token; if connection unstable, tell guest to download locally and retry cloud upload; do not promise unsent media exists in gallery. Increase quotas through authorized action only.

**After event:** close submissions when scheduled, export validation sample (photo and audio), client handover instructions, privacy/retention reminder; reconcile orphan intents and queue failures; log incident summary.

## 7. Incident response
- **Private content leaked:** disable public links/display tokens, revoke signing credentials as appropriate, halt affected media distribution, inspect logs/extent, contact responsible owner/support and execute notification obligations after legal assessment, keep audit record.
- **Upload failures spike:** disable heavy video capture if isolated, leave strip local save; surface venue message, replay idempotent queue, no silent quota charges.
- **Malicious content on display:** hot hide/revoke and moderate; caches must honor revocation for future accesses; short signed URL TTL minimizes stale access window.
- **Unexpected costs:** turn on event soft warning at 75/90/100% storage, stop over-quota media intents, rate limit oversized assets, report measured API operation volumes.

## 8. Cost model and capacity planning
R2 Standard official published pricing as of Oct 2026: $0.015/GB-month, Class A $4.50/million, Class B $0.36/million, egress without fee in R2; **total app bills also include compute, workers, database, payment, bandwidth outside R2 and support**. Do not derive quote from storage alone. Source: https://developers.cloudflare.com/r2/pricing/

Per-event cost calculator inputs: final photo count*compressed bytes, disposable asset count, audio duration/bitrate, video duration/bitrate, thumbnail multiplier, exported ZIP temporary storage, average retention days, storage PUT/GET ops, transcoding CPU, vendor support hours. Measure actual distribution during Komukuna pilot; tune package entitlements from data. `unlimited` if offered means sessions/shutter allowance under fair-use, not unlimited storage or processing.

## 9. Legal/business review checklist
Review applicable Indonesian personal data protections and consent, rights to use Komukuna assets, client contract covering guest media and licensing, data processor responsibilities for vendor tenants, minimum age/family policy, takedown requests, consent for public event LED, retention/deletion notices, payment tax/invoicing obligations, authorization to display guest content. Consult counsel for final terms; do not present this document as legal approval.
