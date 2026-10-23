# ROADMAP — CONTINUOUS ONE-PASS WEB IMPLEMENTATION (v2)

**Instruksi utama:** Agent harus **mengerjakan seluruh workstream web sampai selesai dalam satu pelaksanaan berkelanjutan**, tanpa menunggu user mengetik "lanjut" pada tiap langkah. Checkpoint adalah untuk catatan dan pemulihan, bukan titik berhenti. **Source repo read-only, Windows-last**. Bila API credential/deployment diblokir, lanjutkan seluruh bagian yang dapat dijalankan dan laporkan kekurangan riil.

## W0 Audit source + immediate scaffold
- Verify path Mokabooth dan BOOKING; capture initial Git status; read package config, relevant code, fonts, assets, tests, licensing, iframe etc.
- Generate `docs/audit/MOKABOOTH_REUSE_MATRIX.md` with compatible/incompatible and direct file references. `docs/audit/BOOKING_DESIGN_EXTRACTION.md` with verified token HEX + file:line. `docs/audit/REUSE_DECISIONS.md` and dependency/license warnings.
- Create separate `komukuna-virtual` workspace; install dependencies; **install @playwright/test and download browsers NOW** even though comprehensive E2E runs later.

## W1 Foundation, roles and catalogue
- Auth & onboarding; DB schema+RLS, org/roles, plan_catalog/event snapshot, two distinct sales channels; landing/price/FAQ, basic dashboard shells, event model, fixed status flows, tenant isolation.
- Migrate and seed local dev fixture 4 SKUs, DIRECT & PARTNER users, operator/admin, test guests; no production seed.

## W2 DIRECT_MANAGED fully functional
- Direct checkout with Rp99k minimum, NO frame editor/chooser; proof flow/manual verify; admin fulfillment/work queue; file request; preview/revision/approve; publish & QR; buyer event detail/gallery/export; no edit settings for buyer.

## W3 PARTNER_SELF_SERVICE fully functional
- Partner workspace, org profiles, event SKU purchase/credit path if enabled, event wizard, advanced settings, frame design for Classic+, duplicate, operator invite, QR, publish, gallery, moderation, billings and tenant audit.

## W4 Guest engines & media
- Browser capture, disposable 15 shots/guest and server idempotency, 4 film presets Mini, classic photo strip frame 1–6, screenshot-consistent renderer, filters, guest identity, event theme, voice 30s and video 15s Mini, notes, gallery upload with intent/reserve/finalize and worker thumbnail/transcode. Guest media must actually persist and be authorized.

## W5 Gallery, premium, operations
- Gallery private/public/invited, moderation and live wall, delayed reveal, multi-media search/lightbox, async ZIP exports; boomerang/GIF for entitled tier, cards/Memory Book for selected tiers, usage and storage limits, add-ons, ops health, rate limit, audit, retention policy and logs.
- Source=physical_booth manual media import works in admin. **No Windows rewrite**.

## W6 Performance & Playwright validation
- Analyze first-party JS route bundles, lazy load camera and editor, LCP/INP/CLS measured where possible, media bytes/cost ceilings.
- Run `pnpm exec playwright test` with Chromium/WebKit/Firefox across role flows and network/failure cases; maintain tests with reproducible fixtures. Run typecheck/lint/build and targeted concurrency/RLS tests; avoid redundant complete suites throughout W0-W5. Real-device QA checklist for iOS Safari and Android Chrome. A single final hardening cycle fixes failures then reruns affected suites and comprehensive final tests once more.
- Pilot staging/demo across direct Mini, direct Classic and partner Classic with realistic fixtures; no fake payments/production charge.

## W7 Windows Mokabooth integration (DEFERRED — only after web complete)
- Finalized-result one-way sync possible via adapter contract and offline queue later; no DSLR SDK, printer or Tauri build required to call web release complete. Do not change original repo. If user requires native integration in a later pass, isolate into new worktree and get explicit authorization.

## Finish condition (not merely 100% tickets checked)
- Each package checkout entitlement matches `14_CHANNEL_PRICING_ROLE_MATRIX`; Mini no frame; direct buyer no edit; partner self edit; audio/video notes truly work and obey duration/storage.
- All migrations/run scripts work in a clean local environment; seeded demo separate from prod; event from order to gallery can run.
- Playwright installed, config/test fixtures pass in available browsers; genuine fail states reported.
- No cross-tenant leaks, unauthorized frame editing, client-side-only limits, signed URL leaks or unapproved live content.
- `FINAL_REPORT.md` includes: function matrix `IMPLEMENTED/TESTED/NOT_TESTED/BLOCKED`, commands, URLs, screenshots, perf budgets, device caveats, next operational credentials.
- **Never** claim deployment/production readiness if not deployed/tested. "Semua fitur selesai" is a goal with evidence; do not fabricate.
