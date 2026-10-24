# Matriks requirement — kode, UI/API, dan bukti

Tanggal 24 Oktober 2026. `WIRED` berarti jalur implementasi tersedia, bukan acceptance lolos. `PARTIAL_VERIFICATION` hanya merujuk pemeriksaan terbatas yang disebutkan. `NOT_TESTED` dan `EXTERNAL_CONFIGURATION` bukan PASS.

## Rekonsiliasi dokumen 00–21

| Dokumen | Kedudukan pada implementasi ini |
|---|---|
| 00 | Index spesifikasi; hasil terkini berada di laporan pelaksanaan, bukan klaim kit sudah selesai |
| 01 | Scope produk dan dua kanal menjadi requirement utama |
| 02 | Interaksi tetap; warna/font platform mengikuti `design (3).md`; pengecualian acara mengikuti AGENTS |
| 03 | State order, fulfillment, event dan guest tetap terpisah |
| 04 | Next/Node existing dipertahankan; editor browser lazy; driver native tidak ditambahkan |
| 05 | Endpoint existing tetap; endpoint modul/frame/commerce ditambahkan; RLS dan API authorization berlapis |
| 06 | Sumber read-only; tidak memindahkan env, DB atau media pelanggan dari repo acuan |
| 07 | Milestone implementasi terpisah dari acceptance; tidak mengubah NOT_TESTED menjadi selesai diverifikasi |
| 08 | Prompt lama tidak mengalahkan scope dan kebijakan pemeriksaan pengguna terbaru |
| 09 | Consent, private defaults, retensi, legal hold dan audit dipertahankan; konfigurasi produksi memerlukan pemilik |
| 10 | Perbandingan kompetitor menjadi referensi kemampuan, bukan klaim paritas sudah terukur |
| 11 | Checklist produk dipetakan pada tabel requirement di bawah |
| 12 | Token provisional tidak mengalahkan Heritage Moss; tidak diterapkan pada wahyu-novita |
| 13 | Placeholder env tetap tanpa kredensial rekaan; variabel baru dijelaskan di runbook |
| 14 | Paket/kanal/role normatif. QR PDF eksplisit untuk pembelian baru; hak snapshot lama tetap |
| 15 | Dependensi Playwright tetap ada; suite rutin tidak dijalankan karena instruksi pengguna terbaru |
| 16 | Budget media tetap; strip v2 hingga 36 MP, output tidak lagi diperkecil otomatis ke 2400 px; performa belum diukur |
| 17 | Workstream diteruskan tanpa meminta izin tiap fase; klaim tetap sesuai bukti |
| 18 | Skenario end-to-end belum dijalankan ulang, status NOT_TESTED |
| 19 | Provenance kode dan font dicatat; tidak mengklaim source runtime sudah diuji |
| 20 | Installer browser tidak dijalankan ulang; pemeriksaan canvas memakai Chromium yang sudah terpasang |
| 21 | Template tes bukan bukti hasil tes dan tidak masuk kompilasi aplikasi |

## Requirement wajib dan opsional

| ID | Requirement | UI | API / penyimpanan | Status / bukti |
|---|---|---|---|---|
| F-01 | Dokumen mm, DPI, preset legacy berbeda | Halaman/inspector | `frame-document.ts` | WIRED; model diperiksa |
| F-02 | Legacy read tanpa rewrite | Studio, library | `toFrameDocument`, versi schema asal | PARTIAL_VERIFICATION |
| F-03 | 18 sumber/20 slot/100 objek/36 MP | Usage/statusbar | schema + validator server | WIRED; seluruh batas belum diuji lewat UI |
| F-04 | Delapan handles, local-axis resize, rasio/minimum | Konva Transformer | `constrainTransformBox` | 192 invariant geometri; UI NOT_TESTED |
| F-05 | Zoom/pan, fit, grid/guides | Artboard toolbar | viewport terpisah dari dokumen | WIRED; UI NOT_TESTED |
| F-06 | Rectangle/round/circle/transparent/QR | Add/inspector | object discriminated schema | Circle canvas diperiksa; sisanya NOT_TESTED |
| F-07 | Mapping capture terpisah dari z-order | Source/order/guide inspector | `captureSources`, renderer dan GuestCamera | PARTIAL_VERIFICATION |
| F-08 | Crop langsung, cover/contain, focal/zoom, commit/cancel | Crop mode | `photoPlacement`, draft transaction | WIRED; UI NOT_TESTED |
| F-09 | Rename/reorder/duplicate/delete/hide/lock/opacity | Layer panel | doc object array; pustaka aset tetap | WIRED; UI NOT_TESTED |
| F-10 | Multi-select, clipboard, align/distribute/equal size | Artboard/inspector/keyboard | `frame-editing.ts` | WIRED; UI NOT_TESTED |
| F-11 | 100 undo, satu gesture satu transaksi | Topbar/keyboard | `use-frame-editor.ts` | WIRED; UI NOT_TESTED |
| F-12 | Teks/font, style, logo/alpha | Add/inspector | renderer menunggu fonts; asset server | Baseline/canvas sebagian diperiksa |
| F-13 | QR statis/runtime dan quiet zone | QR inspector | QR renderer; event/gallery context | PARTIAL_VERIFICATION: bitmap artboard diperbarui saat URL acara/galeri berubah; decode runtime NOT_TESTED |
| F-14 | Tekstur multi-layer dan scope layout | Assets/layers/inspector | layer order, opacity, layoutTypes | WIRED; source fixture NOT_TESTED |
| F-15 | Auto-detect alpha/warna worker, preview/koreksi/cancel/undo | Detect dialog | bounded worker + satu change transaction | WIRED; NOT_TESTED |
| F-16 | GIF overlay transparan, contoh, play/pause, hasil tamu | Usage/GIF, kamera | asset ref; renderer GIF, plan gate | WIRED; NOT_TESTED |
| F-17 | Compositing editor/preview/output sama | Canvas/preview/thumbnail | `renderObjectBitmap` + `renderFrameDocument` | Satu fixture canvas diperiksa |
| F-18 | Output sesuai halaman, tanpa chrome editor | Preview/PNG/JPG | ukuran dokumen, bukan Stage | 1200×1800 diperiksa; semua preset NOT_TESTED |
| F-19 | Capture unik/retake di semua slot sumber sama | GuestCamera | session frame snapshot | Shared source canvas diperiksa; alur guest NOT_TESTED |
| F-20 | Draft IndexedDB 2 detik scoped actor/tenant/event/frame | Recovery/status | `frame-drafts.ts` | WIRED; offline/navigation NOT_TESTED |
| F-21 | Save CAS/409 dan edit selama request tetap dirty | Save/conflict controls | version + event/frame row lock | CAS backend diperiksa; UI NOT_TESTED |
| F-22 | Revisi immutable, preview, restore ke draft | Riwayat | `frame_revisions`, server guards | Histori/izin sebagian diperiksa; restore UI NOT_TESTED |
| F-23 | JSON/ZIP/.moka + laporan import | Portability dialog | bounded archive, ID remap, rollback/cleanup | Round-trip model diperiksa; file upload UI NOT_TESTED |
| F-24 | Aset hilang diganti; tanpa fetch URL arbitrer | Import replacement inputs | bytes-only package import + Sharp | WIRED; adversarial archive NOT_TESTED |
| F-25 | Library frame/template, metadata perangkat/harga | Library + global templates | `frame-library`, templates, compatibility envelope | Metadata round-trip diperiksa; consumer Mokabooth NOT_TESTED |
| A-01 | Sepuluh modul admin dari registry | Sidebar/breadcrumb/outlet | `admin-modules.ts`, permission/flags | WIRED; navigation E2E NOT_TESTED |
| A-02 | Query/search/filter/sort/page per modul | Daftar terpisah | `admin/modules/*` | Filter payment query diperiksa; UI NOT_TESTED |
| A-03 | Assignment, deadline, priority, checklist | Task modal + portal | `admin/tasks/:id`, order fields + audit | WIRED; UI NOT_TESTED |
| P-01 | Reject/proof ulang/terminal guard | Portal + queue | transaction-locked proof/review | Terminal state diperiksa |
| P-02 | Cancel/expiry/manual refund/idempotency | Payment adjustments | immutable `payment_adjustments` | Refund retry/terminal state diperiksa |
| P-03 | Add-on/perpanjangan/upgrade manual | Katalog/portal/event | addon snapshot + entitlement_changes | PARTIAL_VERIFICATION: add-on tetap setelah upgrade/idempotent retry; alur UI NOT_TESTED |
| P-04 | Kredit vendor append-only/reserve/redeem/refund | VendorCredits/CreditAdmin | grants/reservations/ledger | OPSIONAL NONAKTIF; race/redeem/immutability diperiksa |
| V-01 | Wizard detail→modes→desain→privasi→preview→aktivasi | Penyiapan bertahap | settings/frame/publish existing | WIRED; Mini melewati studio; UI NOT_TESTED |
| V-02 | Anggota organisasi/delegated permission/switching | Organisasi & tim | members + scoped access/dashboard/calendar | WIRED; tenant role acceptance NOT_TESTED |
| V-03 | Branding, billing, kalender, duplicate order | Workspace existing | organization/order/calendar APIs | WIRED; NOT_TESTED pada sesi ini |
| D-01 | Pembeli read-only, revisi/koreksi/approval | Portal | owner checks dan fulfillment | WIRED; NOT_TESTED pada sesi ini |
| D-02 | Checklist/timeline/preview tamu sebenarnya | OrderProgress/ExperiencePreview | order audit + read-only snapshots | WIRED; preview tidak upload; UI NOT_TESTED |
| G-01 | Disposable/strip/voice/video/note per paket | Wizard existing + strip v2 | guest intent/finalize/session APIs | WIRED; paket E2E NOT_TESTED |
| G-02 | Resume/progress/retry/MIME/duration/bytes | Upload/recorder existing | intents/upload_parts/media jobs | Dipertahankan; NOT_TESTED pada sesi ini |
| G-03 | Mini tanpa frame dan video tetap ada | Paket/guest/wizard | entitlement server | WIRED; bypass/limit acceptance NOT_TESTED |
| M-01 | Private/public/invite, consent/moderation/reveal | Gallery existing | signed media/gallery policy | Dipertahankan; NOT_TESTED pada sesi ini |
| M-02 | Live wall portrait/landscape/QR/reconnect | LiveWall | display token + approved/opt-in query | WIRED; display acceptance NOT_TESTED |
| M-03 | Unicode PDF dan pembagian volume | Export controls | fontkit/Noto + book volumes | PDF Latin/Mandarin/Arab diperiksa; volume besar NOT_TESTED |
| M-04 | ZIP dibagi, manifest lengkap, download privat | ExportStatus | `event-exports.ts`, authorized part download | WIRED; cloud/kapasitas NOT_TESTED |
| O-01 | Notification templates/outbox/retry | Operations | templates/outbox/worker | OPSIONAL NONAKTIF; trigger antrean diperiksa; pengiriman NOT_TESTED |
| O-02 | Pengingat retensi/legal hold/scheduled purge | RetentionAdmin | scheduler + retention job | WIRED; purge otomatis opt-in; NOT_TESTED produksi |
| O-03 | Cleanup ekspor/heartbeat/retry | System/jobs/health | cleanup, worker_health, job retry | WIRED; operasi produksi NOT_TESTED |
| O-04 | Usage dan estimasi biaya tanpa tarif rekaan | Analitik | actual media bytes + configured rate | WIRED; pengukuran biaya produksi NOT_TESTED |
| B-01 | Perbandingan paket, CTA dua kanal, bantuan/legal | Home/plans/public pages | DB catalogue + existing checkout | WIRED; render NOT_TESTED pada sesi ini |
| B-02 | SEO/OG dan noindex portal/preview | Metadata/OG image | Next metadata conventions | WIRED; crawler/OG render NOT_TESTED |
| S-01 | Tenant API + RLS + private backend role | Role-specific UI | migrations 014–020 + guards | Query role backend/anon diperiksa; full tenant suite NOT_TESTED |
| S-02 | Migrasi tambahan tanpa startup remote mutation | Setup/runbook | explicit migrate option, local-only auto migration | DB memori + isolated preview; remote NOT_APPLIED |
| X-01 | Harga mitra/rekening/email/contact/provider/domain | Config status | env/katalog pemilik | EXTERNAL_CONFIGURATION; tidak diisi angka/kontak palsu |
| X-02 | Real devices/performance/backup-restore/pilot | Acceptance/runbook | Infrastructure pemilik | NOT_TESTED / NOT_TESTED_REAL_DEVICE |
| N-01 | DSLR/printer/USB/Tauri/native sync | Tidak ditambahkan | Repo sumber read-only | OUT_OF_WEB_SCOPE |

## Acceptance paket/role

| Kanal/role | Mini | Classic | Celebration | Signature | Bukti sesi ini |
|---|---|---|---|---|---|
| Pembeli langsung | Tanpa editor/frame | Tim mengelola 1 frame | Tim mengelola 3 frame | Tim mengelola 6 frame | Jalur UI/API ada; keseluruhan order→publish NOT_TESTED |
| Vendor owner | Tanpa studio | Self-edit 1 frame | Self-edit 3 frame/GIF/book | Self-edit 6 frame/premium | Wizard/members/commerce terhubung; acceptance NOT_TESTED |
| Designer | Assigned managed jobs | Sama | Sama | Sama | Server checks ada; full denial matrix NOT_TESTED |
| Operator/member | Izin eksplisit | Izin eksplisit | Izin eksplisit | Izin eksplisit | API checks + RLS; cross-tenant acceptance NOT_TESTED |
| Tamu | Foto/voice/video/note | Tambah strip/live wall | Tambah GIF/book milik owner | Premium sesuai snapshot | Renderer terbatas saja; media/quota E2E NOT_TESTED |

Skenario dokumen 18, race kuota terakhir media, approval/publish multi-role, consent/reveal, rekaman perangkat, ekspor kapasitas penuh dan retensi/legal hold belum dijalankan ulang. Tes race satu kredit tidak dianggap menggantikan tes race kuota foto terakhir.
