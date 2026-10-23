# Komukuna Virtual — implementation handoff

Updated 23 October 2026. Workspace: `C:/Users/user/Music/komukuna-virtual`.

**Later update:** Supabase PostgreSQL/Auth are now configured for `xpwhpeolndmprzmdkldm`; ten application migrations and hosted access configuration were applied, and additional PRD features were implemented. Read [the Supabase continuation handoff](SUPABASE_SETUP.md) for current state, verification, remaining work and the final Auth advisor warning. The local-only assessment below is retained as historical evidence and does not describe all subsequent changes.

The local web implementation is available at http://127.0.0.1:3107. This is a development preview, not a cloud deployment or production-readiness certification. The earlier implementation already contains the main web flows. This continuation resolved the remaining resize interaction issue, made its diagnostic script use the configured preview URL, checked the two recorded failures individually, and completed this handoff.

## Verification and changes in this continuation

- The saved full Playwright report has **38 expected, 2 unexpected, 0 skipped, 0 flaky** results across 40 cases. It is preserved unchanged at [playwright-results.json](../../artifacts/playwright-results.json).
- The previous Frame Studio crash had already been addressed in the source by retaining the drag history snapshot before clearing `drag.current`. A targeted rerun confirmed resize, undo, redo and saving worked.
- Running the standalone diagnosis then exposed a separate issue: an enlarged selected slot could overlap its neighbor, which intercepted the resize pointer. The selected slot now has `z-index:1`, keeping its handles above neighboring slots. The diagnostic succeeded after that change: width `0.45507601351351346` → `0.5063851351351351`.
- The final targeted resize/undo/redo/save rerun passed after the CSS change: **1 passed (3.6s)**.
- The previously failing WebKit delayed-reveal/export case passed individually: **1 passed (13.9s)**. The old error was a full-page screenshot exceeding WebKit's 32767-pixel limit; the current dashboard already uses pagination with 12 items per page. No additional screenshot workaround was needed.
- `diagnose-resize.mjs` now defaults to port 3107, honors `PLAYWRIGHT_BASE_URL`, checks API responses and missing fixtures, and closes resources on failure. It changes only the unsaved browser preview.
- README now uses the actual preview port and documents catalogue/admin bootstrap without demo seeding.

Commands actually run for the reported failures:

```powershell
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:3107'
npx playwright test --project=chromium-camera --grep 'frame studio resizes' --reporter=list --output=artifacts/resize-recheck
npx playwright test --project=webkit-mobile --grep 'delayed reveal server gate' --reporter=list --output=artifacts/webkit-recheck
node scripts/diagnose-resize.mjs
```

The diagnostic initially failed on the overlapping-slot issue and passed after the CSS fix. The resize test was rerun after that fix. The full suite, build, typecheck, lint, security scan and performance collection were **not rerun in this continuation**, following the user's instruction to test only observed/reported errors. Thus the combined evidence is an earlier 38/40 run plus successful targeted reruns, **not a new 40/40 full-suite run**. See [continuation record](../../artifacts/continuation-2026-10-23.json).

## Feature and entitlement evidence

“Earlier tested” below refers to actual results in the preserved full Playwright report, not fresh verification of every path in this session.

| Area | Implementation / entitlement | Evidence and limits |
|---|---|---|
| Storefront | Two sales channels; Mini Rp99k, Classic Rp150k, Celebration Rp299k, Signature Rp499k | Earlier tested on Chromium, Android emulation, WebKit mobile and Firefox |
| Direct managed | Checkout, brief, proof, payment review, designer assignment, corrections/revisions, preview approval, publish | Earlier UI and API tests; buyer editing denied at API level |
| Partner self service | Registration, organization, manual purchase, self editor, operator access, immutable plan snapshots | Earlier contracts and tenant/operator denial tests; partner price must be configured by admin |
| Mini | 30 identities, 15 photos per guest, 450 photos, no frames, 50 voice/10 video, notes, 2 GiB cap | Earlier quota, concurrency, mode-gate, storage-reservation and content-validation tests |
| Classic | One frame, 50 guests, 800 photo outputs, 6 filters, live wall entitlement | Earlier partner editor and four-cut capture/retake tests; resize retested in this continuation |
| Celebration | Three frames, 100 guests, 2000 photo outputs, 10 filters, creative and Memory Book | Shared entitlement code implemented; no dedicated complete Celebration purchase/capture test in the saved report |
| Signature | Six frames, 200 guests, 5000 photo outputs, 12 filters, creative and Memory Book | Earlier synthetic creative capture; ZIP/PDF and delayed reveal tested, WebKit case retested here; maximum-capacity load not tested |
| Frame studio | Presets 1/2/3/4/6, normalized geometry, crop focus/zoom, rotation, ordering, image/text layers, templates, undo/redo | Earlier private-asset/template and immutable published-frame contracts; targeted resize/undo/redo/save passed here |
| Guest media | Consent/session, disposable photo, strip, voice, video, note/card, eligible GIF; bounded upload intent/finalize | Earlier Chromium fake MediaDevices tests plus API MIME/duration, idempotency, cancellation and quota tests |
| Privacy/gallery | Private voice default, opt-in publication, moderation, revocation, reveal gate, authorized files | Earlier API/UI tests across configured browsers; gallery pagination implemented |
| Delivery | QR SVG/PNG/PDF per entitlement, asynchronous ZIP, eligible Memory Book | Earlier QR/ZIP/PDF checks; WebKit exports retested here |
| Operations | Plans/prices, audit, usage, monitoring UI, physical-booth manual import, retention and legal hold | Earlier import/retention contracts; no production incident drill or large-volume retention purge in this session |
| Cloud adapters | PostgreSQL, Supabase Auth, private R2 storage | Code paths implemented; live services not tested because deployment credentials are absent |
| Native Windows | DSLR/USB/Tauri/printer integration | Deferred by scope; original source repositories untouched by this continuation |

Exact package limits and snapshots are defined in `src/lib/domain.ts`; the table summarizes key distinctions rather than replacing that source.

## Runtime, database and setup

Single Next.js App Router application, Node runtime, React and TypeScript. Private local media and embedded PostgreSQL/PGlite persist under `.data`. `DATABASE_URL` selects external PostgreSQL; `STORAGE_DRIVER=r2` selects the R2 adapter. Five checked-in SQL migrations cover core schema, permissions, templates, legal hold and consent metadata. The app applies unapplied migrations when opening the database. Current local startup and API requests succeeded; a new clean-database migration rehearsal was not run here.

```powershell
Set-Location C:\Users\user\Music\komukuna-virtual
npm ci
npx playwright install chromium firefox webkit
npm run db:migrate
npm run db:seed
npm run dev
```

Those are reproducible setup instructions, not a claim that dependencies were reinstalled in this continuation. Next.js reads `.env.local`; supply environment variables in the shell for standalone `tsx` scripts. Stop the local server before running standalone PGlite DB scripts. Do not open the same PGlite directory in two processes. A separate worker process requires external PostgreSQL; local preview uses the web process's embedded worker.

Demo logins: `admin`, `designer`, `buyer`, `partner`, `partner-b`, `operator` at `@demo.komukuna.test`; password `KomukunaDemo2026!`. These are synthetic local fixtures. Guest demos: `/e/demo-mini`, `/e/demo-classic`, `/e/demo-signature`.

For an environment without demo data: `db:migrate`, `db:catalog`, then `admin:create` with `ADMIN_EMAIL` and a private `ADMIN_PASSWORD` of at least 16 characters. Catalogue insertion preserves existing rows. These bootstrap scripts were inspected, not executed against the active local database here.

Resolved dependency versions are locked in [package-lock.json](../../package-lock.json); the earlier [version inventory](../../artifacts/dependency-versions.json) records Next.js 16.4.2, React 19.3.0, Playwright 1.63.0, TypeScript 6.0.3 and PGlite 0.5.11. It also records two extraneous optional dependency entries; this continuation did not reinstall or clean them.

## Source audit and design

Existing audit evidence identifies BOOKING commit `91c4ccecdade7399c46c2bea13e11743da53088b` and Mokabooth commit `8a0944114c02607121f740988ad1d674cbf3f198`. File hashes, references and status-before/after records are retained in [the audit directory](../audit). This continuation only read target-project audit records and did not write either source repository.

BOOKING paper/ink/plum/purple/berry values and editorial layout patterns are mapped in [design extraction](../audit/BOOKING_DESIGN_EXTRACTION.md). Fonts come independently from Fontsource. Muted text is intentionally darkened for contrast; this is adaptation, not a pixel-parity certification. Optional wedding themes do not replace the console palette.

Mokabooth camera/native code is excluded. Browser geometry, crop and capture are independent implementations of audited behavior. See [reuse decisions](../audit/REUSE_DECISIONS.md), [origin manifest](../audit/CODE_ORIGIN_MANIFEST.md) and [license review](../audit/LICENSE_REVIEW.md). No wholesale source-code license grant was established. FFmpeg/ffprobe distribution licensing needs review before redistribution.

## Security and performance evidence

Earlier [RLS results](../../artifacts/rls-results.json) record six passing checks in fresh in-memory PGlite: buyer visibility, buyer edit denial, partner organization scope, cross-tenant denial, own-event updates and session-table denial. Earlier E2E contracts cover CSRF, missing consent, tenant isolation, invalid content/duration, concurrent quota reservations and immutable snapshots. These are local checks, not an independent security audit or hosted PostgreSQL verification.

The earlier [production dependency audit](../../artifacts/npm-audit-production.json) reported zero vulnerabilities at its collection time; it was not refreshed here. The saved lint artifact has 0 errors and 11 warnings; no new lint/typecheck/build result is claimed. Existing production output under `.next-production` predates this continuation and must be rebuilt before deployment.

Earlier production lab measurements show 137,508 bytes initial guest JavaScript, LCP 744–844 ms and CLS below 0.001 over three cold emulated runs. INP was not established. These numbers are historical localhost lab measurements, not real-device/RUM guarantees. See [performance report](PERFORMANCE_REPORT.md).

## Production blockers and capacity limits

- Configure hosting, HTTPS/domain, external PostgreSQL/backups, private object storage, bank details, partner pricing and an operated authentication/email/recovery process. No real payment or cloud deployment occurred.
- Validate Supabase and R2 against actual credentials, production migration/RLS roles, recovery and backup restore before accepting customers.
- Use a long-lived worker and production storage for hosted processing. Current uploads pass through Node with a 30 MB limit; multipart/TUS resume is not implemented.
- ZIP assembly uses disk, then buffers the completed archive for storage. Streaming delivery and capacity work remain necessary before serving Signature maximum-size exports. Full package-capacity load was not measured.
- Retention/legal-hold paths exist; schedule and verify operational retention and incident procedures. Current CSP permits inline scripts and eval; production policy tightening needs framework-compatible implementation and validation.
- Physical iPhone Safari and Android Chrome, real cameras/microphones, poor-network recovery, long recording sessions and hosted load remain untested. Browser emulation and fake devices do not replace these checks.

Cost analysis is limited to bounded package storage (2/4/12/35 GiB) and enforced count/duration limits. Actual provider rates, egress, request counts, transcode CPU time, archive peak memory and staff time have not been priced or measured. Use `stored GiB × storage rate + egress GiB × egress rate + requests × request rate + processing + staff time` with the chosen provider's actual billing. No profitability claim is made.

## Manual release checklist (not executed here)

- Confirm bank account, partner prices, non-demo admin access, recovery and customer notices.
- On physical iPhone and Android, scan QR, grant/deny permissions, capture/retake, record/play voice and video, retry interrupted upload, then confirm owner/gallery privacy.
- Complete one real staging direct Mini flow and one partner Classic flow with separate tenants and an operator.
- Exercise production backup restore, worker restart/retry, retention/legal hold, large export and signed-file access boundaries.
- Collect hosted mobile vitals and billing metrics; resolve capacity and production blockers above before public release.
