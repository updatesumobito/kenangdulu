> Reconciliation 24 October 2026: current implementation and actual verification are in [PRD execution](implementation/PRD_EXECUTION_2026-10-24.md) and its requirement/parity matrices. The latest user instructions override older routine testing/build requirements; design (3).md governs platform visuals, with the wahyu-novita exception. Historical requirements and test evidence below are not a new PASS claim.

# FULL BUILD CHECKLIST — KOMUKUNA VIRTUAL v2
**Complete web release in one continuous implementation run. Mark [x] only with actual code and evidence.**

## Audit and foundations
- [ ] Read-only inspect Mokabooth; list files/functions reusable with license and source refs.
- [ ] Read-only inspect BOOKING; extract true UI/design tokens with source file:line.
- [ ] Isolated repo and DB schema/RLS, build scripts, seeded test tenants.
- [ ] Install Playwright package/browser binaries in target and `--version` proof.
- [ ] 4 retail SKUs database/entitlements, event usage limits and revision snapshots.

## Sales channel DIRECT_MANAGED
- [ ] SEO marketing/feature/pricing pages, clear two CTA.
- [ ] Rp99k Mini purchase with **no frame choice**.
- [ ] Buyer order, brief/assets/proof payment upload; status and customer dashboard.
- [ ] Admin verify/reject payment, assignment and fulfillment pipeline.
- [ ] Komukuna editor, theme setup, client preview/approval/revision entitlement.
- [ ] Client is read-only for editor/settings at UI AND API.

## Sales channel PARTNER_SELF_SERVICE
- [ ] WO/vendor onboarding workspace, auth/roles/team.
- [ ] Order/entitlement/credit when configured.
- [ ] Event builder, theme and frame editor for Classic+.
- [ ] Mini vendor can edit event basics but NO frame/strip.
- [ ] Preview as guest, QR export, publish, live controls, gallery/export.
- [ ] Tenant isolation and delegated operator permissions.

## Guest capture and memories
- [ ] Single QR welcome with consent/permissions, responsive 360px+.
- [ ] Mini 15-shot per guest; counters server, 30 guest IDs/450 photo outputs.
- [ ] 4 lightweight filters; no frame library bundled in Mini.
- [ ] Classic+ photo strip (1/2/3/4/6), timer, mirror, retake, versioned output.
- [ ] Voice record and player, privacy owner default.
- [ ] **Video wishes for Mini** (15s), retry/progress, transcoded playback if required.
- [ ] Note and visual wishes cards eligible.
- [ ] Gallery, signed media read, pagination, moderation, film reveal and live wall eligible.
- [ ] ZIP exports and Memory Book premium where entitled.
- [ ] Private storage, worker, retry/idempotency, EXIF sanitization, rate limit.
- [ ] Manual import physical booth media source works; Windows code untouched.

## Operations, quality and complete report
- [ ] Admin plans/price edit, event/tenant monitoring, retention, audit, incidents.
- [ ] Mobile performance budget and bundle analysis report.
- [ ] Playwright direct/partner/guest admin coverage in Chromium, WebKit, Firefox.
- [ ] RLS/security/quota concurrency and normal negative cases tested.
- [ ] Real iPhone + Android validation marked actual pass/not tested.
- [ ] Final runnable preview URL, screenshots, complete feature/status matrix.
- [ ] All in-scope web features evidence-based finished; native Windows integration last/deferred.
