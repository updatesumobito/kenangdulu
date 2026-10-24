# Pelaksanaan PRD Kenang Dulu — 24 Oktober 2026

Kode dan acceptance dibedakan. Pekerjaan ini menambahkan jalur UI/API nyata; laporan ini **bukan pernyataan seluruh acceptance lolos atau siap produksi**. Kebijakan pengguna “tes hanya kalau ada error” mengalahkan permintaan suite/build/screenshot rutin pada dokumen lama.

## Acuan dan keputusan yang berlaku

Urutan acuan: instruksi pengguna/AGENTS.md, plan yang disetujui, `design (3).md` untuk visual, PRD 14 untuk paket/kanal, PRD 01 untuk produk, kontrak Mokabooth untuk kompatibilitas, kemudian rincian dokumen lain. Palet acara `wahyu-novita` dan kemunculan welcome tetap dipertahankan. Repo Mokabooth dan BOOKING tidak ditulis.

- Koordinat dokumen v2: mm; DPI menentukan ukuran output. 4×6 inci = 101,6×152,4 mm; 4R lama = 102×152 mm.
- 18 sumber foto, 20 slot termasuk slot QR, 100 objek, 36 MP. Frame paket tetap 0/1/3/6, terpisah dari capture/slot.
- Opening legacy menggunakan adapter; server tetap menyimpan versi asal sampai Save. Published event dan guest session memakai snapshotnya sendiri.
- JSON/ZIP/.moka membawa metadata kompatibilitas dan dokumen web lengkap. Envelope native tersedia; perbedaan dukungan konsumen Mokabooth dilaporkan, termasuk kontrol sumber yang masih dibatasi 8 pada versi sumber yang diaudit.
- QR PDF menjadi entitlement eksplisit untuk pembelian baru sesuai PRD 14. Snapshot pembelian lama tidak ditulis ulang dan tetap memperoleh perilaku QR sebelumnya.
- Kredit dan pengiriman notifikasi default nonaktif. Tidak ada pembayaran otomatis, rekening, harga mitra, kontak, kredensial atau tarif provider rekaan.

## Peta implementasi

| Tahap plan | UI dan backend yang terhubung | Bukti / acceptance |
|---|---|---|
| 1. Rekonsiliasi | Matriks requirement, prioritas dokumen dan matriks AC Mokabooth | Lihat dua matriks di bawah; laporan lama ditandai historis |
| 2. Model/renderer | `frame-document.ts`, adapter v1/Mokabooth, renderer bersama, capture mapping, snapshot tetap | Pemeriksaan model dan canvas terbatas selesai |
| 3. Editor/portabilitas | Konva, delapan handles, rotasi/rasio, zoom/pan, layer, selection, align/distribute, snapping, crop, teks, QR, tekstur, worker detect, GIF, IndexedDB, CAS/revisi, library dan import/export | Sebagian invariant diperiksa; UI/touch/offline penuh NOT_TESTED |
| 4. Admin | Registry 10 modul; ringkasan/pekerjaan/pembayaran/acara terpisah; server search/filter/sort/page; assignment, deadline, priority, checklist | Query pembayaran terfilter diperiksa; navigasi UI NOT_TESTED |
| 5. Pembayaran/katalog | Review transaksional, bukti ulang dengan penjagaan terminal state, cancel/expiry/refund, add-on/perpanjangan, upgrade, ledger kredit | Refund idempotency, terminal state, credit race/redeem diperiksa |
| 6. Vendor/organisasi | Wizard enam langkah, anggota organisasi, delegated permission, switching, branding, duplikasi berbayar, kalender/billing existing | Integrasi UI baru NOT_TESTED; undangan per acara tetap menggunakan alur existing |
| 7. Portal pembeli | Checklist, timeline/audit, koreksi/revisi/approval existing, preview menggunakan komponen tamu sebenarnya, QR/galeri/ekspor | Preview tidak membuat sesi atau mengirim media; alur portal penuh NOT_TESTED |
| 8. Tamu/media | Frame v2, capture unik/retake, GIF overlay, hasil strip tetap satu output; jalur 36 MP/PNG; resume/idempotency/progress dan rekaman ringan existing dipertahankan | Renderer terbatas diperiksa; perangkat nyata NOT_TESTED_REAL_DEVICE |
| 9. Galeri/premium | Moderation/reveal/access existing; live wall orientasi/QR; Memory Book Unicode dan volume; ZIP dibagi dengan manifest lengkap | PDF Latin/Mandarin/Arab diperiksa; ekspor besar/cloud NOT_TESTED |
| 10. Operasional | Template/outbox/retry, retensi/pengingat, legal hold existing, purge terjadwal opt-in, cleanup ekspor, heartbeat, estimasi biaya dari tarif konfigurasi | Migrasi/izin backend diperiksa; email, supervision dan operasi produksi NOT_TESTED |
| 11. Marketing | Perbandingan paket, dua jalur CTA existing, OG image/metadata, noindex portal/preview, bantuan/legal existing, sisa copy tim diperbarui | Render marketing dan OG NOT_TESTED |
| 12. Handoff | Kontrak API/data, matriks 57 AC, instruksi migrasi/recovery dan penambahan modul | Acceptance produksi belum ditutup |

Dokumen rinci: [Requirement matrix](PRD_REQUIREMENTS_MATRIX.md), [57 AC Mokabooth](MOKABOOTH_PARITY_MATRIX.md), [runbook dan kontrak](PRD_RUNBOOK.md).

## Kelanjutan pekerjaan terakhir

Review terakhir menutup regresi bitmap QR pada artboard: optimasi render sebelumnya tidak memantau perubahan `eventUrl`/`galleryUrl`, sehingga QR dapat tetap memakai URL lama. Dependensi effect sekarang mencakup keduanya. Pemeriksaan React/Konva terisolasi mereproduksi kegagalan sebelum perbaikan, lalu selesai setelah perbaikan untuk perubahan URL acara dan galeri. Pemeriksaan ini tidak membuka halaman aplikasi dan tidak membuktikan QR dapat didekode atau acceptance gesture selesai.

Perbaikan upgrade berdasarkan tingkat paket, pelestarian add-on/hak snapshot, serta pan crop yang tidak mengubah geometri slot sudah tersedia pada perubahan sebelumnya. Pemeriksaan commerce dan transform yang sudah selesai tidak dijalankan ulang pada kelanjutan ini. Tidak ada build, lint, typecheck, suite rutin, migrasi remote, push atau deploy tambahan.

## Pemeriksaan yang benar-benar dijalankan

| Perintah | Alasan konkret | Hasil dan batas |
|---|---|---|
| `node scripts/check-frame-bitmap-context-regression.mjs` | Bitmap QR tetap memakai URL lama setelah konteks acara/galeri berubah | Gagal sebelum perbaikan, selesai setelah perbaikan pada React/Konva terisolasi. Bitmap berubah untuk URL acara dan galeri; decode QR dan halaman aplikasi NOT_TESTED |
| `npx tsx scripts/check-frame-regressions.ts` | Regresi konversi/baseline, round-trip dan konflik hak QR lama/baru | Selesai: mm/px, legacy tidak dimutasi, shared source, 20 round-trip, migrasi/RLS, katalog QR baru tidak mengubah snapshot order lama |
| `node scripts/check-frame-renderer-regressions.mjs` | Teks alphabetic dapat terpotong ketika dipindahkan ke bitmap | Selesai: satu canvas Chromium terisolasi; caption legacy panjang dalam toleransi 1 px, hasil 1200×1800, shared source dan circle clipping. Tidak membuka halaman aplikasi |
| `npx tsx scripts/check-frame-transform-regression.ts` | Konva tidak mempertahankan rasio pada side handles secara otomatis | Selesai: 192 kombinasi geometri; 8 handles, empat skala, pan, rotasi 0/30/90°, rasio/minimum/opposite anchor. Gesture UI belum diuji |
| `npx tsx scripts/check-commerce-regressions.ts` | Race kredit, terminal payment state, kehilangan add-on saat upgrade dan teks Unicode sebelumnya diganti `?` | Selesai pada DB memori: CAS frame, refund/redeem idempotency, race satu kredit, ledger immutable, add-on tetap 10 GiB di atas paket hasil upgrade, filtered query, PDF Latin/Mandarin/Arab. Tidak membayar atau mengirim email |
| `npx tsx scripts/check-runtime-grants-regression.ts` | Role privat existing belum memiliki hak pada tabel baru | Selesai pada DB memori: backend membaca tabel baru, mutasi histori ditolak, anon/authenticated tidak membaca tabel privat |
| `npm run dev:prd` | Menyediakan preview lokal terisolasi | Seed demo lokal selesai; Next dev melaporkan Ready di `http://127.0.0.1:3117`. Halaman aplikasi tidak dibuka sebagai smoke/E2E |

Tidak dijalankan: build produksi, lint, typecheck, full suite, E2E multi-role/multi-browser, screenshot, benchmark 45 fps, pengukuran CWV, uji beban/kapasitas storage, pengiriman email, provider cloud, restore produksi, pengujian kamera/mikrofon fisik. Tidak ada klaim PASS untuk bagian tersebut.

## Preview dan migrasi

Jalankan ulang preview dengan `npm run dev:prd`. Preview memakai `.data/prd-preview`, `.next-prd-preview`, auth/storage lokal dan fixture demo. Akun demo tercetak oleh script seed; kredensial demo bukan akun produksi. Server ini terpisah dari port 3107 dan database acara asli.

Migrasi tambahan **014–020 belum diterapkan ke remote** dalam pekerjaan ini. Startup aplikasi tidak menerapkan migrasi remote otomatis. Gunakan koneksi owner/operator dan proses migrasi eksplisit setelah meninjau SQL dan backup; kredensial role runtime tidak diasumsikan memiliki hak DDL. Tidak ada push/deploy pada pekerjaan ini.

## Batas verifikasi dan konfigurasi pemilik

Seluruh UI yang baru tidak mendapat browser acceptance aplikasi pada sesi ini. Kesiapan produksi masih memerlukan acceptance aktual, perangkat nyata, penetapan harga mitra/rekening/kontak yang benar, konfigurasi provider/worker, backup-restore serta pengukuran kapasitas. Glyph di luar cakupan font PDF dilaporkan; teks asli tetap berada dalam manifest. Ekspor pada batas storage/provider dan kompatibilitas aktual konsumen Mokabooth tetap memerlukan pemeriksaan targetnya.

Hardware, DSLR, driver, printer, device sync native tetap di luar scope web.
