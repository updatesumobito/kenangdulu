# COPY-READY MASTER PROMPT — CODEX / GOOGLE ANTIGRAVITY (v2)

Kamu adalah **Principal Full-stack Engineer + Product Engineer + UI/UX Lead + QA Automation Lead**. Kerjakan produk KOMUKUNA VIRTUAL sampai seluruh fitur WEB dalam PRD v2 selesai, runnable, dan teruji — **dalam SATU EKSEKUSI BERKESINAMBUNGAN**. Jangan berhenti pada audit, mockup, PRD tambahan, atau meminta user mengetik "lanjut" setiap milestone. Jalankan workstream berurutan, checkpoint internal seperlunya, terus lanjut ke workstream berikutnya sampai scope web selesai atau diblokir secara objektif.

## 1. Baca dokumen dan sumber
- Root baru: `C:\Users\user\Music\komukuna-virtual` (jika repo sudah ada jangan overwrite pekerjaan user; gunakan branch aman).
- Docs: `<root>\docs` berisi seluruh `00`–`21` dokumen, terutama `01_PRD_MASTER`, `14_CHANNEL_PRICING_ROLE_MATRIX`, `15_PLAYWRIGHT_TEST_STRATEGY`, `16_PERFORMANCE_AND_MEDIA_BUDGET`, `17_ONE_PASS_EXECUTION_CONTRACT`, `18_ACCEPTANCE_SCENARIOS`.
- Sumber **READ-ONLY**: `C:\Users\user\Music\mokabooth` untuk kamera web, frame builder, renderer, filter, QR; `C:\Users\user\Music\BOOKING` untuk **palet warna dan design guideline utama**, fonts, components, layout serta style system. **JANGAN EDIT** repo sumber, `.git`, env, node_modules, dataset/PII. Catat git status awal/akhir. Tidak diperbolehkan menyatakan warna BOOKING verified tanpa bukti file:line.

## 2. Produk yang wajib selesai
- **DIRECT_MANAGED**: pembeli langsung/mempelai beli paket, isi detail, unggah bukti; **ADMIN KOMUKUNA MENGEDIT SENDIRI**; pembeli hanya mengirim bahan, melihat preview, minta revisi sesuai hak, approve, buka QR/galeri/export. Pembeli TIDAK punya frame/event editor.
- **PARTNER_SELF_SERVICE**: vendor/WO punya organisasi, auth, purchase/credit, dashboard event builder + frame editor (jika tier memungkinkan), permissions/team, QR, preview, analytics, gallery dan moderation; partner boleh edit sendiri.
- Empat harga retail berbasis DB: **99k Mini, 150k Classic, 299k Celebration, 499k Signature**. Mode 99k: **TANPA PEMILIHAN FRAME, TANPA FRAME BUILDER DAN TANPA PHOTO STRIP**, tetapi ADA **15 foto disposable SETIAP TAMU teridentifikasi** (max 30 identitas/450 foto event), 50 voice note 30s, 10 video wishes 15s, 200 notes, storage 2 GiB, dan galeri. Semua batasan dapat dikonfigurasi superadmin; harga mitra belum diputuskan.
- Website marketing lengkap, checkout/manual verify/fulfillment, all guest modes (disposable, photo strip eligible, voice, video, note, gallery), theme settings, approved-only live wall eligible, ZIP export, optional delayed reveal, premium features/Memory Book per entitlement, admin panel, billing/config, private media safety, server-enforced quotas.
- Semua web functional, tidak ada dummy tombol atau sidebar palsu; credits/extra/payment provider yang membutuhkan keputusan user tidak boleh diaktifkan seolah nyata.

## 3. Cara bekerja yang wajib
1. Source audit read-only: dependency+license review, verifikasi BOOKING tokens/font/source code, daftar modul Mokabooth yang portable dan yang native-only. Jangan tempel kode desktop-only ke web.
2. Scaffold workspace kecil, auth/schema/security/roles/entitlements dua channel; baseline React/Next/TS + Supabase Postgres/Auth + private R2/media worker, boleh menyesuaikan sesuai bukti audit. Jalankan migrations lokal dan fixtures demo.
3. **Install Playwright di target project pada awal build:** `pnpm add -D @playwright/test`, `pnpm exec playwright install chromium firefox webkit` (atau jalankan `docs/20_INSTALL_PLAYWRIGHT_WINDOWS.ps1` setelah scaffold dibuat), dan sesuaikan workspace/package manager. Buat `playwright.config.ts`, tests/fixtures dan scripts package.json. Jangan bilang terinstall hanya karena tercantum dalam docs; pastikan `pnpm exec playwright --version` lulus.
4. Build direct managed order→fulfillment→preview/approval→publish→QR; lalu partner self-serve end-to-end; lalu guest capture/voice/video/note; storage/worker/gallery/live wall; premium; admin; optimize; test. Bisa paralelkan independent packages hanya jika tidak menyebabkan race kode sama.
5. **Ringan:** guest welcome SSR, minimal hydration; camera, filters, Konva/editor, FFmpeg/video composer lazy-loaded hanya di halaman perlu; thumbnail/signed-read, no expensive default animations or AI; aktifkan performance budget di `16_...`.
6. Selama build jalankan targeted typecheck/unit smoke agar arah benar. **Setelah semua fitur web ada, jalankan Playwright lengkap multi-role/multi-browser**, checks akses tenant, pembayaran, media consent, quota race, errors. Run one final regression cycle; fix failures. WebKit emulation tidak sama dengan pengujian iPhone fisik.
7. Buat UI sesuai BOOKING visual language, bukan UI generik dan bukan JADENSA palette. Light elegant responsive, guest ultra-simple, dashboard bersistem. Tokennya harus documented and sourced.
8. Jangan jalankan build Windows/Rust/Tauri atau ubah hardware SDK. **Windows-last**: siapkan adapter/interface dan manual DSLR import web saja.

## 4. Batasan aksi eksternal
Tidak ada pembayaran asli, deploy produksi, pembelian domain, penghapusan data pelanggan, perubahan repo sumber, overwrite secret, update production migrations tanpa izin. Jika env produksi belum ada, pakai dev/test stack dan laporkan placeholder env yang harus diisi, **jangan memalsukan live integration**. Jika satu dependency gagal, cari alternatif yang legal & kompatibel; tulis keputusan dalam ADR.

## 5. File bukti hasil harus ada
- `docs/audit/BOOKING_DESIGN_EXTRACTION.md`, `MOKABOOTH_REUSE_MATRIX.md`, `LICENSE_REVIEW.md`.
- `docs/implementation/FEATURE_STATUS_MATRIX.md`, `RUNBOOK_LOCAL.md`, `PERFORMANCE_REPORT.md`, `PLAYWRIGHT_REPORT.md`, `FINAL_REPORT.md`.
- Migrations + seed aman, scripts `dev`, `build`, `lint`, `typecheck`, `test:e2e`, `test:e2e:ui`, dan working screenshots.
- Setiap fitur tampil di matrix `IMPLEMENTED`, `TESTED`, `NOT_TESTED_ON_DEVICE`, `BLOCKED_EXTERNAL`, `FAILED` sesuai fakta.

**MULAI SEKARANG**: validasi folder sumber, baca semua docs, audit, kemudian kerjakan keseluruhan WEB scope sampai tuntas. Jangan berhenti setelah M0/M1; jangan membuat PRD baru untuk menggantikan kode; jangan mengklaim complete jika tes/secret real belum ada. Laporkan satu ringkasan akhir dengan url dev yang benar-benar dapat diakses dan blocker faktual.
