# KOMUKUNA VIRTUAL — COMPLETE PRODUCT & IMPLEMENTATION KIT
**Versi 2.0 — 23 Oktober 2026 | Status: specification, bukan aplikasi selesai | Bahasa: Indonesia**

## Perubahan yang dikunci pada v2
1. **Dua jalur pembelian berbeda**, bukan satu onboarding umum: (a) WO/vendor/reseller dapat mengelola dan mengedit event sendiri; (b) pembeli langsung/pasangan **tidak mengedit sendiri** — tim Komukuna/platform admin membuat dan mengedit atas nama pembeli. Pembeli dapat melihat progres, preview, mengirim bahan dan permintaan revisi terstruktur, serta membuka hasil dengan izin.
2. **Paket Rp99.000 (Mini Memories)** sebagai entry-level standalone, bukan lagi hanya diskon bundling. **Tanpa pemilihan frame dan tanpa editor frame**, memakai kamera disposable **15 hasil foto per tamu teridentifikasi** + voice message + video wishes pendek + note teks, dengan limit event dan batas penyimpanan. Tidak ada strip frame dan desain frame kustom pada paket ini.
3. **Rp150.000** tetap ada sebagai paket Classic Photo; premium di Rp299.000 dan Rp499.000 (harga dan kuota hipotesis, dapat diubah admin tanpa deploy).
4. **Complete Web Release / one continuous implementation pass**: agent membangun SELURUH modul web yang telah dispesifikasikan melalui workstream berurutan **tanpa berhenti menunggu izin/PRD baru di tiap milestone**. Milestone tetap ada sebagai checklist dan titik pemulihan. Integrasi **Windows/Rust/Tauri Mokabooth tetap paling akhir**, dan tidak boleh memblokir selesai-nya web.
5. **Playwright wajib menjadi devDependency di repo web dan browser binaries dipasang**, termasuk Chromium, WebKit dan Firefox; e2e multi-role, multi-browser dan visual smoke wajib dijalankan setelah fungsi web selesai. Emulator WebKit tidak membuktikan kamera iPhone asli sudah lolos.
6. **Ringan dan cepat**: guest landing minim JavaScript, editor/camera/FFmpeg lazy loaded, media bukan blob di DB, video baru diupload saat dipilih, bundle/performance budgets terukur.
7. Sumber read-only: `C:\Users\user\Music\mokabooth` (fungsi kamera/editor/frame/QR) dan `C:\Users\user\Music\BOOKING` (design system/warna/typography). **Jangan mengarang hasil audit, jangan ubah kedua repo**. Repo target: `C:\Users\user\Music\komukuna-virtual` (periksa existing sebelum membuat).

## Daftar file
- `00_README_START_HERE.md`: navigasi, keputusan, cara menjalankan.
- `01_PRD_MASTER.md`: tujuan, semua modul dan kontrak fungsional.
- `02_DESIGN.md`: BOOKING-derived platform UI, wedding/light fallback, performance design.
- `03_USER_FLOWS.md`: alur pasangan managed-service, vendor self-service, tamu, operator.
- `04_TECH_ARCHITECTURE.md`: stack, queue, capture, file processing, performance.
- `05_DATABASE_AND_API.md`: schema, role permissions, order fulfillment & entitlement endpoints.
- `06_LOCAL_AUDIT_AND_REUSE.md`: source audit, evidence, reuse safety.
- `07_ROADMAP_AND_ACCEPTANCE.md`: one-pass continuous build + readiness gates.
- `08_MASTER_PROMPT_CODEX.md`: prompt komprehensif siap ditempel.
- `09_SECURITY_PRIVACY_OPERATIONS.md`: privacy and incident ops.
- `10_COMPETITOR_FEATURE_MATRIX.md`: rujukan dan fitur gabungan.
- `11_IMPLEMENTATION_CHECKLIST.md`: complete feature checklist, evidence.
- `12_DESIGN_TOKENS_PROVISIONAL.css`: placeholder hingga BOOKING audit.
- `13_ENV_EXAMPLE.txt`: variable non-secret placeholder.
- `14_CHANNEL_PRICING_ROLE_MATRIX.md`: paket 99rb, 150rb, 299rb, 499rb + izin per kanal.
- `15_PLAYWRIGHT_TEST_STRATEGY.md`: instalasi, konfigurasi, test fixture dan E2E.
- `16_PERFORMANCE_AND_MEDIA_BUDGET.md`: batas JS, foto/video, pengukuran & fail-safe.
- `17_ONE_PASS_EXECUTION_CONTRACT.md`: prompt agent panjang, urutan continuous, lengkap/tested vs blocked.
- `18_ACCEPTANCE_SCENARIOS.md`: Given/When/Then skenario end-to-end.
- `19_PROVENANCE_AND_CHANGELOG.md`: keputusan v2 dan sumber yang belum diverifikasi.
- `20_INSTALL_PLAYWRIGHT_WINDOWS.ps1`: skrip instalasi Playwright yang aman di repo target Windows.
- `21_PLAYWRIGHT_CONFIG_TEMPLATE.ts`: template config test browser (sesuaikan root app).

## Cara penggunaan
1. Ekstrak paket; letakkan folder `docs` di dalam project target. **Tidak perlu membuat file PRD lain sebelum coding.**
2. Jalankan Codex/Antigravity di root project dan paste isi `08_MASTER_PROMPT_CODEX.md` (atau prompt singkat pada jawaban ChatGPT yang menunjuk ke file tersebut).
3. Agent membaca seluruh dokumen sesuai urutan, mengaudit repo asli secara read-only, lalu lanjut menyelesaikan web app secara kontinu.
4. Credential Supabase/R2/email/payment/deployment wajib dari user atau environment; **jangan membuat secret palsu atau melakukan transaksi asli tanpa izin**. Local dev / emulator dapat disiapkan tanpa secret produksi.
5. Agent wajib membuat `docs/implementation/FINAL_REPORT.md` dengan scope shipped, real tests, limitation, performance report, manual-device checklist, dan URL dev preview jika benar berjalan.

## Prioritas jika ada dokumen lama bertentangan
**v2 file terbaru menang**. Urutan sumber: `01_PRD_MASTER` → `14_CHANNEL_PRICING_ROLE_MATRIX` → `17_ONE_PASS_EXECUTION_CONTRACT` → `18_ACCEPTANCE_SCENARIOS` → domain files teknis. Section "v2 amendment" di atas file teknis mengalahkan section v1 legacy. Tidak boleh menafsirkan `P2 vendor dashboard later`: **vendor self-serve adalah core release v2**.

## Pernyataan jujur
Library + source reuse mempercepat pembangunan, **tidak menjamin seluruh sistem enterprise bisa selesai tanpa debugging/infrastruktur**. `One-pass` artinya agent mencoba menyelesaikan keseluruhan scope tanpa meminta instruksi fase demi fase; bukan melewatkan test, bukan memalsukan status, bukan mengabaikan credential atau masalah produksi.
