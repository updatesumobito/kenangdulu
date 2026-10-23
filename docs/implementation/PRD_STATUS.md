# Current PRD status

This is an implementation map, not a claim that every acceptance scenario has passed. Latest remote setup evidence is in [SUPABASE_SETUP.md](SUPABASE_SETUP.md). The previous browser results predate the newest features.

| PRD workstream | Current implementation | Remaining acceptance / external dependency |
|---|---|---|
| Source audit and BOOKING design | Target audit/provenance records; independent browser implementation and mapped design tokens | No new parity screenshots in the Supabase continuation |
| Catalogue and channels | Four DB-backed SKUs, immutable order/event snapshots, direct managed vs partner self service | Owner must set partner prices; none invented |
| Database and access | Ten applied migrations, 30 RLS tables, private backend role, public API grants revoked | Hosted backup/restore and tenant acceptance reruns not performed |
| Authentication | Supabase registration/login, stable subject links, confirmed superadmin, recovery path | End-to-end recovery delivery not exercised; leaked-password protection warning remains |
| Direct fulfillment | Brief/material/proof uploads, assignment, payment review, revision/correction/approval, publish, readonly design preview | Bank/support details and operational pilot need owner configuration |
| Partner workspace | Organizations/branding/switching, monthly schedule, orders, duplication, event editor, operator/client invitations and permissions | New workspace/invitation UI paths not E2E-tested in this continuation |
| Theme and frame studio | Themes, sanitized cover, presets/slots/crop/rotation/layers/templates/undo/redo; Mini gating; expiring revocable design previews | New cover/token paths not browser-tested; earlier resize regression passed before later additions |
| Guest capture | Disposable, strip, retake, timers, mirror, filters, timestamp, JPG/PNG local output; versioned sessions | Physical-device QA and new upload path acceptance remain unperformed |
| Wishes and recordings | Voice/video, MIME/duration checks, text/card previews, optional saved-photo associations, independent publication consent | New attachment/card/recovery flows lack new acceptance results |
| Upload and processing | Idempotent reservations/finalize, resumable byte chunks, checksums, metadata validation, processing/retries/heartbeats | R2 credentials absent; media remains private local storage; browser restart does not retain local Blob/File automatically |
| Gallery and display | Private/public/invited access through permissions, moderation, search/pagination, reveal gate, display tokens/live wall, source labels | Hosted multi-instance storage and display acceptance not rerun |
| Exports and premium | Streaming ZIP with manifest; bounded Celebration/Signature books, recording QR links, omission reporting | PDF has explicit 1–300-entry limit and standard-font repertoire; maximum package-capacity load is unmeasured |
| Operations and retention | Catalogue/admin UI, audit/jobs, manual booth import, legal hold, asset/media/token cleanup, independent PostgreSQL worker CLI | Production supervision, restore/incident drills, billing cost measurements and real-device validation outstanding |
| Native Windows | Deliberately excluded from the web implementation | Optional later DSLR/printer/sync work, per PRD |

No real money was transferred, no partner price was selected, no source repository was modified, and no public production deployment occurred. R2, bank details, production hosting/domain and operational credentials remain localized external blockers. These outstanding items and unperformed acceptance checks prevent a 100%-accepted/production-ready claim.
