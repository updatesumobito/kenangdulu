# PROVENANCE, LIMITATIONS & V2 CHANGELOG

## Superseded specification
v1.0 ZIP `KOMUKUNA_VIRTUAL_PRD_DESIGN_TECH_CODEX_2026.zip` had a single retail Essential Rp150k starter, vendor scaling in later roadmap, video restricted to higher tiers, and workstream pausing after milestones. **v2 explicitly supersedes those decisions** across all documents.

## v2 primary changes
- NEW Mini Rp99k standalone no frame/strip; 15 photos per guest; short voice/video/notes; bounded quotas/2GiB.
- NEW Classic Rp150k and existing Celebration Rp299k / Signature Rp499k updated limits.
- NEW direct buyer fulfillment (Komukuna editor only) vs vendor self-serve (authorized own editing).
- Moved video recording to core web release and Mini entitlement.
- Moved partner dashboard/roles to core web release, not future SaaS.
- Formal "continuous one-pass" build instructions, not proof project done.
- Playwright required install/fixtures/tests; reported coverage actual with device caveats.
- Lightweight budgets, media compression, deferred camera/editor import.
- Preserved source read-only and web-first Windows-last.

## Known unknowns / never fabricate
1. BOOKING actual palette, fonts or logo cannot be verified from Windows folder here: Codex MUST audit that path; CSS is fallback only. Komukuna wedding gallery has own documented maroon/ivory theme but cannot replace BOOKING globally without source evidence.
2. Mokabooth actual file structures/dependencies uninspected: reuse matrix is TODO for local agent, not a claim that modules are plug-and-play.
3. Payment gateway, vendor wholesale price, custom domain, SMS/WhatsApp API and real cloud credentials unselected/unauthorized; manual transfer verification is base.
4. Rp99/150/299/499 package limits and media budgets are proposed, not actual profitability model. Event cost per GB/operations transcode should be measured before scaling.
5. Browser Playwright download is a **local agent task**, not performed on user's Windows PC by this document generation. WebKit emulation is not a physical iOS Safari test.

## Official implementation references
- Playwright install: https://playwright.dev/docs/intro
- Playwright projects: https://playwright.dev/docs/test-projects
- Next.js bundling: https://nextjs.org/docs/app/guides/package-bundling
- MediaDevices: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
- MediaRecorder: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
- Supabase resumable uploads (Supabase only): https://supabase.com/docs/guides/storage/uploads/resumable-uploads
- Cloudflare R2 S3 API: https://developers.cloudflare.com/r2/api/s3/api/
