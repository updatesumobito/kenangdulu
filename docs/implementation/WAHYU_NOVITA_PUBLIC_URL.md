# Alamat publik Wahyu & Novita

Alamat tamu yang ditetapkan: `https://kenangdulu.web.id/wahyu-novita`.

- Alias kini merender welcome tanpa redirect ke `/e/`.
- Navigasi tamu memakai `/wahyu-novita/disposable`, `/photo`, `/voice`, `/video`, `/notes`, `/gallery`, dan mode lain yang diaktifkan. Rewrite internal memakai handler event yang sudah ada; pengecekan izin, sesi, dan fitur tetap di handler tersebut.
- `/wahyu-novita/pengantin` tetap memakai handler album pengantin dengan kode akses yang sudah tersedia.
- Link lama `/e/wahyu-novita/...` dan `/u/wahyu-novita/...` mendapat redirect permanen ke alamat pendek dengan suffix dipertahankan.
- QR, tombol salin link, halaman pengelola, tautan album pengantin dan penutup memakai helper `src/lib/guest-path.ts`. Event lain tetap memakai `/e/[slug]`.

Target deployment adalah proyek Vercel `kenangdulu` (`prj_BQAESAvQDU3eC046KYolGeq7mfu3`), domain terverifikasi `kenangdulu.web.id`. Proyek lama `komukuna-virtual-wahyu-novita` tidak dipakai sebagai target perubahan ini. Deployment dikirim dari snapshot file kerja; tidak melakukan commit atau push Git otomatis.

Pemeriksaan sebelum deployment mengonfirmasi link pendek sebelumnya berubah ke `/e/wahyu-novita`. Tidak menjalankan build lokal, lint, typecheck, suite atau browser. Build Vercel merupakan bagian deployment yang diperlukan.

## Hasil publikasi

Deployment produksi `dpl_FEzrBkMmacHET78afiCv5Kc8SBmA` berstatus `READY`, alias `kenangdulu.web.id` aktif dan `aliasError=null`. Build Vercel selesai.

Pemeriksaan HTTP terarah setelah publikasi:

- `/wahyu-novita`: 200, tanpa redirect; HTML memuat tutorial baru dan link voice `/wahyu-novita/voice`.
- `/wahyu-novita/voice`: 200, tanpa redirect.
- `/e/wahyu-novita` dan `/u/wahyu-novita`: 308 ke `/wahyu-novita/` (slash akhir dinormalisasi Next.js).
- `/u/wahyu-novita/voice`: 308 ke `/wahyu-novita/voice`.

Pemeriksaan ini mengonfirmasi routing, bukan pengujian kamera, mikrofon atau kiriman media di perangkat nyata.
