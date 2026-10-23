# PRODUCT REQUIREMENTS DOCUMENT — KOMUKUNA VIRTUAL
**Version 2.0 — 23 October 2026 | Target: Complete Web Release dalam satu implementasi berkesinambungan**

## 0. Ringkasan eksekutif
Komukuna Virtual adalah **web-based virtual photobooth + disposable camera + digital wishes + voice/video guestbook + event gallery** yang bisa diakses tamu melalui QR tanpa install aplikasi. **Dua model pembeli wajib selesai:** (A) pembeli langsung/mempelai memesan dan **tim Komukuna mengedit/menyelesaikan event**; (B) WO/vendor membeli akses event lalu **mengedit dan mengelola semuanya sendiri** sesuai paket. Admin platform mengelola pesanan, tenant, template, kuota dan keamanan.

**Harga retail awal dari Rp99.000**, dengan empat tier sesuai `14_CHANNEL_PRICING_ROLE_MATRIX.md`. Nama kerja Komukuna Virtual; brand final menunggu keputusan owner. Komukuna Booth menjadi channel partner serta pilot. Komponen reusable dari Mokabooth & BOOKING **wajib diaudit read-only**, tanpa mengubah sumber. Semua komponen web yang feasible harus berfungsi, bukan mockup.

## 1. Product goals, audience, dan definisi selesai
- Tamu dapat scan QR → buka event → pilih mode → kamera/mikrofon → simpan → memperoleh hasil/ucapan di galeri yang tepat.
- Pengantin dapat **membeli tanpa harus mengoperasikan editor**; menerima preview dan meminta revisi terstruktur.
- Vendor/WO dapat **mendaftar, membeli event, membuat dan edit event sendiri**, membagikan QR, moderasi hasil dan ekspor.
- Operator Komukuna mengerjakan pesanan managed-service dari dashboard fulfillment yang efisien.
- Admin dapat mengubah SKU, entitlement, konten, template, reassign desainer, memantau usage/biaya dan audit.
- Semua fitur web yang termasuk in-scope produk v2 selesai dalam **continuous one-pass build**; gate keamanan/test tetap berlaku, tidak memerlukan permintaan "lanjut fase berikutnya" dari user.
- Tidak boleh mengklaim READY tanpa bukti runnable backend, migrations, storage, browser tests dan real device pending status. External production credential yang tidak tersedia harus dinyatakan sebagai blocker terlokalisasi, bukan diganti dummy.

## 2. Scope aplikasi
### 2.1 Public marketing & storefront
Home, fitur, demo event aman, semua paket (99k/150k/299k/499k), perbandingan fitur, FAQ, panduan, kontak Komukuna, legal/consent, SEO/OG, CTA **Pesan untuk Pengantin** dan **Saya WO/Vendor** menuju jalur berbeda. Tidak ada pembayaran uang asli tersembunyi pada demo.

### 2.2 Checkout dan direct managed (`DIRECT_MANAGED`)
- Order form: nama pelanggan/kontak, nama pasangan/event, tanggal/jam/timezone, lokasi opsional, paket, request teks/tema, cover asset bila diperlukan, terms, bukti pembayaran.
- Rp99k tanpa frame: jangan tampilkan pilihan frame, layout, jumlah strip, custom frame, editor, atau upload foto untuk frame (cover logo opsional tidak sama dengan frame).
- Dashboard pembeli: status order/event, material checklist, preview tamu, minta revisi sesuai entitlement, approve preview, unduh QR setelah publish, galeri privat dan export. **Tidak ada hak edit UI event, frame, pengaturan teknis.**
- Dashboard admin fulfillment: triage pesanan; validasi payment; assign operator; form brief; event dari template; edit sesuai paket; kirim preview; tanggapi revisi; publish setelah approval/override tercatat; notifikasi status via UI/email bila configured.
- Revisi dibatasi SKU, konten typo akibat kesalahan internal boleh dibetulkan tanpa memotong jatah. Track seluruh request and resolution.

### 2.3 WO/vendor self-serve (`PARTNER_SELF_SERVICE`)
- Register/login, org onboarding, workspace switching authorized, branding tenant, team invites, roles, plans/credits/orders, event list/calendar sederhana, duplicate event from templates.
- Wizard create-event: detail → enabled modes/guest identity → tema/frame (skip bila Mini) → limits/visibility → preview → payment/publish/QR.
- Full editor sesuai tier: theme, frame builder, overlay, photo slot cropping, filter set, welcome copy, mode toggles, disposable counts, gallery, reveal, voice/video limits (tidak boleh melebihi SKU), QR kit, live wall, client invite, exports.
- Owner dapat membuat operator terbatas, contoh `media_moderate`, `live_wall_view`, `event_edit` by explicit delegation.
- Harga mitra dapat ditetapkan admin, **belum dipatok**; tidak membuat margin/promo tersembunyi. Event credit hanya jika admin aktifkan.

### 2.4 Event builder / template system
`events` scoped tenant, global-safe slug, optional alias on slug rename; scheduling timezone; lifecycle separate order; draft/published immutable revisions; preview token; role-specific navigation. Template global read-only to vendor, vendor can clone. No frame or frame setting loaded for Mini. QR SVG/PNG; PDF-ready print asset pada paket yang berhak.

### 2.5 Guest modes — all core web scope
1. **Mini Disposable (baseline)**: 15 exposures **per guest identity**, max guest/cap event as SKU, 4 lightweight film presets, date/time option, camera switch, counter, film reveal; no frame overlay, no photo-strip layout. Tamu boleh merekam ulang sebelum final save, shot sudah disimpan tidak otomatis refund ketika dihapus.
2. **Photo Strip/Camera** (Classic+): 1/2/3/4/6 slots, 2x2, portrait/landscape 4R, Polaroid/Story; timer, retake per slot, mirror, front/back, crop, layout preview, publish version snapshot, export PNG/JPG; result strip counts as 1 output.
3. **Voice Guestbook**: request mic on user gesture, preview/rerecord, upload, optional photo association, owner-private default, package duration limit.
4. **Video Wishes**: browser record or allowed gallery upload, 15/30 sec by SKU, supported MIME negotiation and fallback, retry/progress, player, upload byte constraints. **Video wajib pada paket Mini Rp99k**, bukan ditunda ke P1.
5. **Text Note/Wishes Card**: text length max, name, edit preview before send, moderation, simple card visual on Classic+, plain elegant note on Mini. No scriptable HTML.
6. **Gallery**: source-labelled media, hide/approve/report, search/filter, invite/private/public access, delayed reveal, generated thumbnails, pagination/infinite scroll, authorized download, owner ZIP export.
7. **Live Wall** (Classic+): only approved + opt-in media, landscape and vertical screen, reconnect/polling fallback, authenticated revocable display token.
8. **Creative extras** (Celebration+): boomerang, GIF, stickers, advanced curated film looks; Signature / designated tiers Memory Book generator; implement to working level, feature gates controlled by plan.

### 2.6 Platform admin / backoffice
Stats, customer order queues, payment/manual verification, managed design work queue, client revisions, tenant/vendor users, role grants, events cross-tenant under audited admin privilege, media incident moderation, plan catalog, quotas/add-ons, branded templates and assets, retention policy, system health, worker jobs, file export failures and actual usage reports.

### 2.7 Mokabooth / Komukuna Booth collaboration
Physical photobooth media can be **manual-imported with `source=physical_booth`** in this web release. Reuse verified web camera/frame/schema; device desktop sync, DSLR SDK, Rust/Tauri builds, drivers and printers **post-web final stage**, remain isolated and cannot block complete web release. Do not modify original Mokabooth. Unified gallery accepts varied media source.

## 3. Packages and entitlement contracts
**ALL package specifications reside in `14_CHANNEL_PRICING_ROLE_MATRIX.md`**. Summary: Rp99k Mini (no frame, 15 photos/guest, voice/video/note); Rp150k Classic (1 frame); Rp299k Celebration (3 frames + advanced); Rp499k Signature (6 frames + premium). SKU ceilings are checks server-side; frontend hides disabled mode, server rejects bypass. Photo outputs share event total cap. Concurrent reservations, storage bytes, max identities, recording limits, retention separately enforced. All plan configurations DB-editable with immutable snapshot per purchase. Identity strength surfaced clearly.

## 4. Experience rules & critical edge cases
- Camera/mic permission only on click over HTTPS; no-camera fallback uploads only if enabled; browser capture progressive enhancement; no automatic public listing.
- No login for casual guest by default. Strict per-person limit requires trustworthy guest code/verification, else treat session limits as best-effort.
- `15 photos per guest` not equivalent to 15 media across all guests. Client cookie/localStorage cannot be sole server-side quota source.
- Idempotent `reserve → upload → finalize`, TTL expiration releases reservations, finalization transaction increments once, rejects over storage/limit.
- Media consent record and `private_owner` default; live wall requires `approved AND share_opt_in`.
- Frame and settings versions immutable when session starts. Existing result never silently changes with frame update.
- Film reveal enforced by signed media read policy, not hiding image under blur.
- Closing event disables new upload subject to submission grace; gallery/view/export retention schedule separate; client owner export 90-day proposal.
- Export job asynchronous; ZIP manifest, authorized originals/derivatives, failed item list; no public raw bucket URLs.
- User may submit wishes with attachment or without; cancelled/unuploaded videos cannot appear saved.
- For missing external credential: produce functional local stack/dev fixtures, leave integrations blocked with explicit instruction and evidence; **no fake success status**.

## 5. Nonfunctional requirements
### Performance & lightweight
Read `16_PERFORMANCE_AND_MEDIA_BUDGET.md`. Guest landing fast with Server Components and minimal JS; imports of `Konva`, image filters, audio recorder and video composer only when opened; only 1 camera stream active; terminate tracks and object URLs on unmount; thumbs first, signed originals on demand; realtime only while appropriate. Baseline measured goal p75 LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 on applicable field/lab conditions; budgets adjustable after measurement.
### Reliability
Slow/intermittent network retriable; 100 concurrent active guests simulated; test rate limit, queue retries, storage failures; no phantom saved toast; own event and tenant permissions always validated. Browser WebKit simulated != real iPhone tested.
### Accessibility & UI
Mobile width 360px+, camera controls 44px targets, contrast AA, prefers-reduced-motion support, 16px inputs to avoid iOS auto-zoom, readable buttons, clear failed upload and permission instructions.
### Privacy/security
Consent before public display, private signed media access, no biometric identity, EXIF strip, untrusted file validation, trace audit, per-event retention, backup/recovery and incident runbook; avoid expensive third-party AI by default.

## 6. Acceptance (also see `18_ACCEPTANCE_SCENARIOS.md`)
- A direct Mini customer pays/provides proof and cannot see any frame picker/editor, can see status/preview; Komukuna admin creates/publishes event; tamu gets 15 exposures/identity + audio + **video** + notes with plan ceilings.
- WO owner buys/activates self-service package and can set up theme/frame/modes by entitlements, invite operator, publish QR, moderate/export; no cross-tenant leakage.
- 4-cut strip retake count = 1 final output, published frame version immutable.
- Two racing last-disposable-shot uploads finalize max one exposure.
- Audio/video MIME fallback works, rejected recording shows recoverable error; external FFmpeg job bounded.
- Published live wall never exposes pending/owner-only media.
- Package upgrade changes entitlement snapshot only after authorized order/approval, not via client request.
- `pnpm exec playwright --version` works, browser binaries installed, suite runs real multi-role flows via test fixtures; launch report distinguishes PASS/FAIL/NOT_TESTED.
- Scoped permissions protected by both UI and API/DB, not UI only.
- No fake empty buttons, no permanently hard-coded dummy event in production.

## 7. Delivery definition
**One continuous build pass** includes functional marketing, all four SKU, direct managed, vendor self service, guest photo/voice/video/note, frame editor for eligible tier, storage, gallery, live wall, manual payments, exports, admin, performance optimizations, Playwright suite, migrations, docs, and runnable local preview. Windows native sync deferred last as optional integration workstream, not blocking web complete. No claim full production launch until real devices, credentials, security/performance and pilots satisfy documented gates.
