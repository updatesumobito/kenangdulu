# Kontrak dan runbook PRD — 24 Oktober 2026

## Preview lokal

`npm run dev:prd` menyiapkan fixture development pada `.data/prd-preview`, memakai PGlite/storage lokal dan membuka `http://127.0.0.1:3117`. Mode ini memaksa email, kredit dan purge otomatis nonaktif, serta tidak memakai DATABASE_URL remote. Build directory `.next-prd-preview` terpisah dari dev existing pada port 3107. Akun demo dan password development dicetak oleh seed; gunakan hanya pada stack lokal terisolasi ini.

Tidak ada deploy/push, database remote, email, transfer uang atau kredensial produksi yang diubah dalam pekerjaan ini.

## Data/migrasi

| Migrasi | Isi |
|---|---|
| 014 | `frames.version/updated_at`, immutable revision snapshots dan asset reference links |
| 015 | Deadline/priority/checklist, payment expiry dan payment adjustment log |
| 016 | Add-on catalogue, immutable credit grants/ledger, reservations, notification templates/outbox |
| 017 | Organization member read policies dan transactional order-status outbox trigger |
| 018 | Worker heartbeat dan system actor untuk expiry otomatis |
| 019 | Hak/RLS role `komukuna_backend` untuk tabel baru; larangan mutasi histori |
| 020 | QR PDF eksplisit pada katalog pembelian baru; audit versi/config; snapshot lama tetap |

Semua migrasi bersifat tambahan; tidak ada reset/drop data acara. `database()` hanya auto-migrate pada database lokal. Database remote yang tertinggal mengeluarkan pesan migration required. Perintah `npm run db:migrate` menggunakan opsi eksplisit, tetapi harus dijalankan melalui koneksi owner/operator yang memiliki hak DDL. Koneksi runtime privat tidak diasumsikan memiliki hak tersebut.

Urutan operator: ambil backup database dan inventory storage; tinjau SQL 014–020; terapkan pada database staging menggunakan koneksi owner; verifikasi grants `komukuna_backend`; tinjau hasil di staging; baru jadwalkan penerapan ke target yang disetujui. Jangan menjalankan seed demo di database acara asli. Pekerjaan ini tidak menjalankan tahapan remote tersebut.

Snapshot event/order/guest lama tidak dikonversi otomatis ke dokumen frame v2. Revisi frame baru memakai `expectedVersion`. Revisi/histori finansial dan credit ledger tidak dapat diubah melalui role runtime; trigger juga menolak mutasi histori.

## Dokumen frame

`FrameDocumentV2` memiliki `schemaVersion:2`, `page` dalam mm/DPI/preset/background, `layoutTypes`, `objects`, `assets`, `gif` dan `metadata`. Urutan `objects` adalah urutan render. `sourceIndex` bukan z-order; capture mengikuti sumber unik diurutkan menurut `captureOrder`. QR bukan sumber foto. Perhitungan piksel hanya dilakukan melalui `mmToPx/outputSize`.

Semua renderer memakai primitif compositing yang sama untuk objek. Editor menggambar bitmap objek melalui Konva; transform/grid/handles tidak menjadi bagian output. Frame v1 tetap memakai renderer asal ketika masih berada pada snapshot v1. Save dari studio secara eksplisit menyimpan dokumen v2. PNG strip mempertahankan format dan resolusi dokumen sampai 36 MP; proses media tidak lagi mengecilkan semua strip menjadi 2400 px.

JSON/ZIP/.moka memuat envelope native-readable dan `kenangDuluDocument` untuk round-trip lengkap. Asset bytes dimasukkan dengan path terbatas `assets/<id>.<ext>`. Import tidak mengeksekusi path, mengambil URL arbitrer, atau memanggil repo acuan. Referensi hilang meminta berkas pengganti; gambar diverifikasi/diubah ke PNG dan mendapat ID baru. Seluruh insert frame/aset/revisi bersifat transaksional; berkas dari import gagal dibersihkan. Sebelum upload, cleanup job durabel mereferensikan semua staging keys; commit frame menuntaskan job yang asetnya dipertahankan. Crash atau kegagalan cleanup tetap memiliki job retry yang hanya menghapus objek tanpa row aset.

Font sumber yang tidak tersedia memblok publish sampai pengguna memilih substitusi eksplisit. Beberapa versi Mokabooth memiliki batas delapan sumber dan representasi gambar/QR yang lebih sempit; export menyertakan compatibility warnings. Round-trip web menyimpan fitur dan metadata lengkap, tetapi penerimaan/hasil runtime sumber harus diperiksa pada versi konsumennya.

## API tambahan

Semua endpoint di bawah berawalan `/api/v1`. Endpoint existing tetap tersedia.

| Endpoint | Kontrak |
|---|---|
| `GET frame-capabilities` | Schema, preset, bentuk, format, batas renderer |
| `GET frame-library?q=&page=` | Library acara scoped actor/tenant; 20 baris + hasMore; schema/version/capabilities/validation |
| `GET events/:event/frames` | Daftar frame acara yang boleh diedit |
| `POST events/:event/frames` | `{id?,name,schema,expectedVersion?}`; expectedVersion wajib untuk update; konflik 409 |
| `GET events/:event/frames/:frame` | Frame dengan schemaVersion, version, capabilities dan validation |
| `GET .../:frame/revisions` | Hingga 20 snapshot immutable terbaru; restore UI menjadi draft baru |
| `GET .../:frame/preview` | Document/validation/version untuk renderer browser bersama |
| `GET .../:frame/validate` | Validator yang sama dengan publish |
| `GET .../:frame/export?format=json|zip|moka` | Dokumen atau paket aset privat |
| `POST events/:event/frames/import?id=&expectedVersion=` | Raw JSON/ZIP/.moka; preflight UI; transaksi import ke draft server |
| `GET/POST events/:event/frame-assets` | Pustaka acara / upload raster 5 MiB; hasil PNG maksimal 8 MiB; kuota storage server |
| `GET admin/modules/:module?q=&status=&sort=&page=` | Daftar per modul; izin designer/administrator berbeda; paginasi server |
| `GET admin/team` | Identitas tim desain untuk assignment, bukan seluruh admin/system |
| `PATCH admin/tasks/:order` | Deadline, priority, checklist dan assignment yang berizin; audit |
| `POST admin/payments/:order/adjustments` | Cancel/expire/refund manual; idempotencyKey dan alasan; refund perlu referensi transfer |
| `GET catalog/addons` | Add-on enabled; harga mitra boleh null |
| `GET/POST admin/addons` | Kelola katalog dan versi add-on |
| `GET events/:event/upgrade-options` | Pilihan berdasarkan tingkat paket, terpisah dari kuota storage add-on |
| `POST events/:event/upgrade-order` / `POST events/:event/apply-upgrade` | Harga paket penuh, paid-order guard, idempotency, add-on dan hak snapshot yang sudah diperoleh dipertahankan |
| `POST events/:event/addon-order` | Snapshot harga/delta/quantity; tidak mengubah entitlement sebelum dibayar |
| `POST events/:event/apply-addon` | Admin, paid order cocok, idempotent entitlement_changes |
| `GET/POST partner/organizations/:org/members` | Owner mengelola akun terdaftar dengan permission eksplisit |
| `GET partner/organizations/:org/credits` | Feature status, grant snapshot, saldo ledger, reservasi |
| `POST .../:org/credits` | Reservasi satu kredit dari grant; TTL 30 menit; idempotencyKey |
| `POST .../:org/credits/:reservation/redeem|release|refund` | Transaksi/idempotency; refund kredit oleh admin, acara belum terbit |
| `GET admin/credits/status` / `POST admin/credits/grants` | Feature flag dan pemberian beralasan oleh admin; tidak ada charge otomatis |
| `GET/POST admin/notifications` | Status konfigurasi, template/version dan outbox; edit template tidak otomatis menyalakan provider |
| `POST admin/notifications/:id/retry` | Antre ulang pesan gagal; flag pengiriman tetap dihormati |
| `GET exports/:job/download?part=N` | Authorize setiap permintaan; part index tervalidasi; object keys tidak dikirim dalam status job |

`events/:event/publish` memvalidasi seluruh frame sebelum membuat snapshot baru. Mini tetap ditolak pada API frame/aset dan tidak memuat studio.

## Menu dan penambahan modul

Registry: `src/lib/admin-modules.ts`. Menu final: Ringkasan, Pekerjaan, Pembayaran, Acara, Frame & Template, Mitra & Pengguna, Paket & Add-on, Moderasi, Analitik, Operasional. Alias lama dipertahankan.

Untuk menambah modul: buat panel sendiri dan endpoint/query scoped; tambahkan ID, label, description, icon, route, aliases, roles, featureFlag dan loadPanel pada registry; masukkan flag pada bootstrap dashboard bila diperlukan. Sidebar, breadcrumb, active state dan outlet membaca registry. API tetap harus memeriksa permission/flag sendiri. Dashboard besar tidak perlu ditambah cabang panel baru.

List panel memakai cache di workspace yang sedang terpasang, background refresh dan query key termasuk filter/page; tidak menyimpan snapshot admin di storage browser. Navigation memakai browser history/Next path subscription. Direct URL, refresh dan deep link dipertahankan oleh route catch-all. Frame library memakai `#frame=<id>` untuk memilih studio/dokumen yang tepat.

## Recovery frame

Draft IndexedDB dipisahkan menurut user/tenant/event/frame dan didebounce dua detik. Navigasi keluar juga berusaha menyelesaikan write draft. Saat dibuka kembali, pengguna memilih recover atau memakai server. Jangan menghapus storage browser untuk mendiagnosis draft yang belum diekspor.

Jika offline atau save gagal: ekspor JSON/ZIP untuk cadangan, pertahankan draft, kemudian coba save kembali. Jika 409: muat versi terbaru dengan draft lokal tetap tersedia, atau simpan salinan bila entitlement frame masih cukup. Saat slot frame paket penuh, ekspor draft tetap tersedia. Restore revisi bukan publish: simpan draft baru, tinjau preview, kemudian publish event secara terpisah.

## Feature flags dan provider

| Variabel | Default/perilaku |
|---|---|
| `VENDOR_CREDITS_ENABLED` | Hanya string `true` mengaktifkan grant/reserve/redeem/refund; default nonaktif |
| `NOTIFICATIONS_ENABLED` | Hanya `true` mengaktifkan worker pengiriman; template punya enabled terpisah |
| `EMAIL_PROVIDER_URL` / `EMAIL_PROVIDER_TOKEN` | Kontrak HTTPS POST JSON `{to,subject,text}`, Bearer token, Idempotency-Key stabil; provider harus diverifikasi pemilik |
| `RETENTION_AUTO_PURGE_ENABLED` | Hanya `true` menjadwalkan purge otomatis setelah exportDays + 14 hari; legal hold selalu diperiksa |
| `EXPORT_PART_MAX_BYTES` | Default 256 MiB; batas objek storage ikut membatasi |
| `STORAGE_MAX_OBJECT_BYTES` | Batas objek aktual provider; jangan mengarang nilai produksi |
| `STORAGE_COST_PER_GB_MONTH` | Estimasi dari penggunaan aktual; kosong berarti biaya belum dikonfigurasi |
| `WORKER_EMBEDDED` | `0` memakai worker CLI terpisah; preview terisolasi memakai embedded worker |
| `KV_PREVIEW_DIST_DIR` | Build/dev directory khusus preview; tidak digunakan untuk deploy |

Worker memiliki heartbeat, retry, outbox idempotency, expired reservation release, payment expiry, pengingat retensi dan cleanup ekspor 24 jam. Supervision dan alert delivery produksi memerlukan konfigurasi operator. Template default tidak diaktifkan. Tidak ada pesan keluar yang dikirim dalam pekerjaan ini.

## Ekspor dan font

PDF menggunakan font Noto yang dibundel, subset fontkit, word wrapping dan pembagian volume maksimal 300 kiriman per volume. Semua kiriman masuk volume berikutnya; tidak dibuang hanya karena melebihi satu buku. Glyph di luar cakupan font dicatat pada hasil dan manifest, dengan teks asli tetap disimpan.

ZIP memakai part berdasarkan ukuran objek yang dikonfigurasi dan menyertakan manifest lengkap, source labels, ID/consent/timestamps serta failed items. Teks dan ekstensi media dipertahankan. Download selalu melewati permission dan expiry job. Data besar, limit aktual provider dan worker time budget belum menjalani acceptance kapasitas.

Font source/license: `public/fonts/memory-book/OFL.txt`, `OFL-CJK.txt`; Noto Sans dan Arabic dari repositori `notofonts/noto-fonts`, Noto Sans CJK dari `notofonts/noto-cjk`. Font ini tidak mengubah tema acara.

## Backup, restore, dan incident handoff

Backup database dan storage harus konsisten dengan manifest objek privat. Pemilik dapat menggunakan `pg_dump` custom format dan inventory provider pada koneksi owner. Rehearsal restore wajib menuju database/storage terisolasi dengan nama tujuan yang ditinjau; jangan mengarahkan `pg_restore` ke database acara aktif. Setelah restore, verifikasi migrations ledger, runtime grants, event/frame revisions, media object references, legal hold dan expiry. Backup/restore nyata belum dijalankan di sesi ini.

Untuk insiden: pause event atau worker bila perlu; catat audit/job ID; pertahankan objek dan legal hold; periksa heartbeat/job error; ulangi hanya pekerjaan idempotent yang diketahui. Jangan mengubah ledger kredit atau revisi immutable untuk memperbaiki saldo; gunakan transaksi release/refund yang tercatat. Jangan mereset database untuk memperbaiki migrasi yang belum diterapkan.

## Batas acceptance

Build/lint/typecheck/full E2E tidak dijalankan. Perangkat nyata, benchmark 45 fps/CWV, tenant matrix penuh, kapasitas ekspor/cloud, koneksi provider email, operational restore dan supervision belum diverifikasi. Seluruh batas ini tetap terbuka pada matriks; tidak boleh ditandai PASS hanya dari keberadaan kode.
