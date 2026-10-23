# FULL ACCEPTANCE SCENARIOS — Given / When / Then (v2)

## Payment and channels
**DIR-01:** GIVEN public visitor selects Mini Rp99.000, WHEN checkout opens, THEN frame picker/editor/strip/layout fields are absent from payload and UI, visible modes list 15-shot disposable, voice, video, text notes, and gallery.
**DIR-02:** GIVEN buyer pays and proof awaits verification, WHEN buyer tries to publish via API, THEN HTTP 403; payment verification only by approved admin.
**DIR-03:** GIVEN paid managed Mini, WHEN assigned Komukuna designer opens work queue, THEN can configure event theme/identity/privacy within plan, send preview for client approval and publish without frame feature.
**DIR-04:** GIVEN buyer opens `/akun/...`, WHEN they attempt to modify frame/event settings directly or via HTTP, THEN denied; can submit data/correction, approve preview, and view their own gallery/export.
**DIR-05:** GIVEN correction request exceeds SKU allowance, WHEN buyer submits, THEN system explains entitlement; admin may fix operator typo separately with audit.
**VEN-01:** GIVEN vendor purchases Classic, WHEN logged into their workspace, THEN can create event and edit one frame, 15 shots/guest, time and modes, send preview, publish QR and export.
**VEN-02:** GIVEN vendor buys Mini, THEN vendor self-edits event copy/date/film style but **frame tools/strip route not available**, enforced at backend.
**VEN-03:** GIVEN partner A guesses partner B event ID, THEN list, edit, export, media signed URL and team endpoints deny access.
**VEN-04:** GIVEN vendor operator permission only media_moderate, THEN cannot edit price, plan, billing or event frame.

## Capture/media
**MINI-01:** GIVEN 1 identified Mini guest with 0 saved, WHEN 15 disposable shots finalize, THEN remaining 0; 16th denied with correct code and no extra stored asset.
**MINI-02:** GIVEN 30 Mini guest IDs, WHEN all have 15 photos, THEN event has 450 photo outputs and further photo intents denied. Same global cap applies if mixed modes through API bypass.
**MINI-03:** GIVEN anonymous public session without identity verification, THEN UX clearly says limits tied to session/device; it does not promise per-human enforcement.
**MINI-04:** GIVEN Mini guest, WHEN recording a video >15s or submitting 11th video to 10-cap event, THEN server rejects with meaningful error. Valid 15s video playable in gallery after processing.
**MINI-05:** GIVEN Mini event, WHEN loading network/js bundles, THEN frame editor library not present on guest welcome page; no frame selector visible.
**STR-01:** GIVEN Classic four-cut, WHEN retake pose #2 three times and finalize, THEN stored strip uses latest #2 and photo counter increments exactly one.
**STR-02:** GIVEN an active capture under frame revision 3, WHEN admin publishes revision 4, THEN active capture remains r3 while new session uses r4.
**DSP-01:** GIVEN 14/15 shots, WHEN two requests race for last slot, THEN only one finalization succeeds; expired reservation releases quota.
**VOI-01:** GIVEN voice default private, WHEN tamu records ≤30s, THEN owner can listen but public gallery/livewall cannot.
**WIS-01:** GIVEN a text note contains HTML/script, THEN it renders as sanitized text with no script execution.
**UPL-01:** GIVEN network interrupted at upload, WHEN retry same idempotency key, THEN one finalized media record and no quota duplication.
**MED-01:** GIVEN user deletes/hides asset, THEN no newly issued signed read token is usable; already issued tokens expire in their bounded TTL.
**GAL-01:** GIVEN media pending/not consented for public display, THEN not present in public gallery or slideshow.
**FILM-01:** GIVEN reveal_at tomorrow, THEN unauthenticated and guest signed asset access prohibited before reveal, not just blurred UI.
**LIVE-01:** GIVEN live wall disconnects, THEN resumable authenticated polling restores approved media without showing owner-only media.
**EXP-01:** GIVEN owner requests ZIP, THEN async job returns files they are authorized to export, with manifest and warnings for failed items.

## UI, test and scale
**DES-01:** GIVEN audited BOOKING, THEN `tokens.source.json` contains real color/font source references and rendered dashboard screenshot matches validated design principles; if audit unavailable, fallback explicitly labeled.
**PERF-01:** GIVEN Mini welcome, THEN camera/editor/video heavy chunks not downloaded until relevant mode and performance report presents sizes + LCP/INP/CLS measurements/limitations.
**E2E-01:** GIVEN clean test workspace, WHEN install/browser commands completed, THEN `pnpm exec playwright --version` works and browser suite runs with documented actual PASS/FAIL.
**MOB-01:** GIVEN iOS/Android real device unavailable, THEN report marks camera/mobile recording `NOT_TESTED_REAL_DEVICE`; no unsupported pass claims.
**WEB-01:** GIVEN full web release, THEN routes have wired user actions (no dead buttons), DB migrations and startup scripts, working dev preview and admin/partner/direct seeded flows; only native Windows sync may remain deferred.
