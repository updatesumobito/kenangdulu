# Logo Kenang Dulu

Folder `logo/` berisi sepuluh PNG transparan. Set pukul 01:34 dipakai untuk latar terang dan set pukul 03:17 untuk latar gelap. Nomor pada kedua set mempunyai fungsi yang sama:

| Nomor | Varian | Pemakaian |
| --- | --- | --- |
| 1 | Stacked | Logo vertikal tersedia untuk penempatan besar |
| 2 | Horizontal | Header situs, workspace, halaman tamu/pengantin, sambutan |
| 3 | Signature | Footer dengan slogan dan gambar pratinjau tautan |
| 4 | Mark | Favicon dan ikon Apple |
| 5 | Wordmark | Versi tulisan tersedia untuk penempatan ringkas |

`scripts/prepare-brand-assets.mjs` menyiapkan seluruh varian di `public/brand/` dengan nama yang jelas. Sumber tidak diubah; margin transparan dipangkas, rasio dipertahankan, dan keluaran logo memakai WebP lossless. Jalankan `node scripts/prepare-brand-assets.mjs` untuk membuat ulang aset.

`BrandLogo` memilih varian berdasarkan tema melalui CSS, termasuk preferensi sistem sebelum bootstrap tema. Header mobile berwarna gelap memakai logo versi gelap meskipun tema halaman terang. Warna acara Wahyu–Novita tetap maroon, ivory, dan gold; warna logo asli tidak dimodifikasi.

Favicon tersedia sebagai ICO dengan ukuran 16, 32, 48, dan 256 piksel; PNG terang/gelap 64 piksel didaftarkan dalam metadata. Pergantian tema tamu juga memperbarui pilihan favicon. `src/app/apple-icon.png` berukuran 180 piksel. Ikon memakai latar solid agar terbaca pada berbagai latar browser/perangkat.

Isi sepuluh sumber diperiksa melalui dimensi, transparansi, dan contact sheet. Skrip persiapan aset berhasil dijalankan. Tidak menjalankan tes, build, lint, typecheck, atau browser rutin. Belum memverifikasi tampilan baru di browser atau melakukan deploy.

## Koreksi logo mobile dan kontras pengantin

- Pada layar maksimal 760 piksel, seluruh penempatan `BrandLogo` memakai aset mark melalui `picture`, tanpa tulisan atau slogan. Ukuran header tamu 40 × 40 piksel (36 × 36 pada layar maksimal 360 piksel), dengan area tautan minimal 44 piksel.
- Header mobile maroon Wahyu–Novita memakai mark dengan garis ivory pada kedua tema. Desktop berlatar gelap memakai varian signature dengan ikon dan tulisan ivory; latar terang tetap memakai horizontal berwarna gelap. Aset sumber tidak diwarnai ulang.
- Pemeriksaan browser khusus laporan kontras dilakukan pada halaman lokal pengantin: mobile 390 piksel dan desktop 1280 piksel, masing-masing tema terang/gelap. Keempat kondisi memilih sumber gambar yang sesuai dan gambar berhasil dimuat. Tidak ditemukan error JavaScript halaman. Tidak menjalankan build, lint, typecheck, atau suite tes.
