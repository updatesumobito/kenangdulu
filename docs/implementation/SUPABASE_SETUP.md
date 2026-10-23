# Supabase setup and PRD continuation — 23 October 2026

## Active project and access

- Project: `xpwhpeolndmprzmdkldm`.
- URL: `https://xpwhpeolndmprzmdkldm.supabase.co`.
- MCP connection: `supabase-komukuna`, authenticated with OAuth.
- Existing MCP `supabase` still points to its original, different project and was not modified or migrated.
- The new project connection was verified through `get_project_url` before any database write. A local transport helper, `scripts/supabase-mcp.py`, calls the project-scoped tools through Codex's authenticated app-server transport; it starts no model turns and does not export OAuth credentials.
- Official Supabase skills `supabase` and `supabase-postgres-best-practices` were installed with the skill-installer helper.

## Database work actually completed

The remote public schema was empty on initial inspection. The following application migrations were applied through MCP and recorded in both the Supabase migration history and `public.migrations`:

| Migration | Purpose |
|---|---|
| 001_core | Core application tables, event/media/quota/job schema and policies |
| 002_security | Platform organization, tenant ownership and additional RLS |
| 003_templates | Frame assets and global template library |
| 004_legal_hold | Entitlement changes and legal hold |
| 005_consent | Guest consent metadata |
| 006_provider_identity | Supabase Auth subject mapping, indexes, RLS for catalogue/migration metadata |
| 007_foreign_key_indexes | Missing foreign-key indexes reported by the advisor |
| 008_resumable_uploads | Expected input bytes and durable upload-part metadata |
| 009_staff_invitations | Expiring, revocable invitations for operators and client viewers |
| 010_event_assets_previews | Cover assets and revocable design preview snapshots |

Separate hosted-only migrations revoke public API access to application tables/functions and scope the existing policies to the appropriate Supabase API role. A dedicated `komukuna_backend` LOGIN role has CRUD access to application tables through its own policies, without postgres/admin credentials or schema migration privileges. It is a trusted server role: per-user authorization remains in the Node API. Do not expose its connection string to browsers.

Remote verification recorded **30 public application tables, 30 with RLS enabled, and zero application-table grants to `anon` or `authenticated`**. Catalogue bootstrap inserted four SKUs and two usable layout templates. The project contains one real admin account and zero events; no demo customers/media/events were imported. Earlier local PGlite data remains under `.data`.

The performance advisor's missing foreign-key indexes and overlapping backend/API policies were addressed. Final advisor results are saved in [supabase-final-verification.jsonl](../../artifacts/supabase-final-verification.jsonl):

- Security: one warning, `auth_leaked_password_protection`; Supabase's leaked-password protection is disabled. [Official remediation](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). The feature is available on Pro and above; no plan upgrade or purchase was performed.
- Performance: only informational unused-index findings on the new database. Indexes were retained rather than removed before real traffic exists.

## Runtime and administrator

Configuration is stored in ignored `.env.local`:

- Supabase PostgreSQL connection using the dedicated backend role and TLS.
- `AUTH_PROVIDER=supabase`, project URL and publishable key.
- `DATABASE_AUTO_MIGRATE=0`: runtime refuses unapplied migrations instead of trying to alter the deployed schema.
- `DATA_DIR=.data-supabase`, `STORAGE_DRIVER=local`, `ENABLE_DEMO=false`.

Private media is currently on local disk. Supabase PostgreSQL/Auth are active; this does **not** mean R2 or Supabase Storage was configured. No privileged provider key was placed in browser code. Temporary role-provisioning files containing the generated database password were removed after provisioning; the runtime secret remains only in ignored environment configuration.

Administrator: `updatesumobito@gmail.com`. Its Supabase identity is linked to the application's `superadmin` role. The user confirmed its email, and the database confirmation status was independently observed as true. The user also confirmed saving the Auth Site URL and redirects for `/masuk` and `/pulihkan-akun` on port 3107.

Preview: http://127.0.0.1:3107/masuk

During the cutover, the existing dev server briefly used its cached PGlite connection after environment reload, causing an `auth_provider_id` missing-column error. Restarting that process resolved the stale connection. The affected login then returned HTTP 200 with role `superadmin`, and the authorized system endpoint reported `database: Postgres`. These were targeted checks of the observed cutover error, not an E2E suite.

Standalone scripts now load `.env.local` while preserving shell-supplied values. Demo seeding against external databases is refused unless explicitly opted in for a disposable test database. The isolated production-preview helper explicitly selects local DB/auth settings so it cannot accidentally seed the configured Supabase project.

## PRD implementation added in this continuation

- Stable Supabase provider subject mapping, registration redirects, provider login and admin provisioning.
- Email password recovery UI/API; provider-token validation, provider sign-out and application-session removal after password reset.
- Chunked upload retry from the persisted byte offset, with guest ownership, expected-size checks, checksum conflict detection, serialized per-intent writes and worker cleanup. Uploaded chunks are streamed into the final object. It resumes while the user retains the local Blob/File; it does not silently retain private files across browser restarts.
- Operator/client invitation links with seven-day expiry, email matching on acceptance, hashed tokens, scoped permissions and revocation. No invitation email was sent to third parties; the owner shares the generated link.
- Organization branding edit and authorized workspace filtering; monthly event schedule.
- Guest note preview and three card styles for Classic+, with Mini limited to the plain style at the API boundary. Notes and recordings can associate the guest's saved photos; attachment queries enforce both assets' privacy/moderation rules.
- Cover uploads for all tiers, sanitized image output, tenant checks and quota accounting that includes cover/frame assets and reservations.
- Snapshot-based preview links valid for 24 hours, revocable by editors. Buyer previews render the actual welcome copy, theme and frame composition without loading the editor or granting edit access.
- Local PNG/JPG strip download selection. Persisted server photo processing continues to normalize images.
- Celebration/Signature Memory Book layouts, bounded owner-selected 1–300 entries, QR access to authorized recordings, omission counts, and an explicit complete-ZIP alternative.
- Actual long-running external worker CLI for PostgreSQL, optional embedded worker, job heartbeat, upload-part cleanup and retention cleanup of design assets/preview tokens.

These new feature paths were implemented and wired. They were **not** subjected to routine build/typecheck/lint/E2E/browser runs, following the user's instruction to test only found/reported errors. The earlier 38/40 Playwright artifact and prior targeted resize/WebKit reruns describe earlier code; they do not validate all of this new Supabase/PRD work.

## Remaining external setup and limits

- R2 endpoint/bucket/credentials are absent; media remains private local storage. Configure the adapter before a hosted multi-instance deployment. No alternative cloud-storage success is claimed.
- Manual-transfer bank details, partner prices and customer-support contact details require the owner's values. They remain unset; no arbitrary values or real payment actions were introduced.
- Hosting, HTTPS/domain, worker supervision, backups/restore, delivery-email operations and production load/device QA remain outstanding.
- Full package-capacity export/transcode load is unmeasured. ZIP uses streaming object reads and file upload; PDF intentionally has an explicit entry limit. Font handling still substitutes characters outside the standard PDF font repertoire.
- Recovery email delivery and newly added capture/upload/invitation/preview/book UI paths have no new end-to-end acceptance result in this continuation. Physical iPhone/Android validation remains unperformed.
- Voice/video and wishes now support associating the guest's saved photos, with same-guest/event checks and independent publication/moderation gates. Broader support/contact content and production incident procedures still need owner configuration and operational verification.
- Native Windows DSLR/printer synchronization stays deferred by scope.

The PRD work has advanced substantially, but this handoff does **not** declare every PRD requirement accepted or the service production-ready.
