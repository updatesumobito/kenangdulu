# Supabase Storage → Cloudflare R2

Status awal: storage aktif masih Supabase. R2 belum diaktifkan hanya dengan perubahan kode; kredensial dan deployment perlu disiapkan lebih dahulu.

## Progres aktivasi 24 Oktober 2026

- R2 akun sudah aktif. Bucket `kenangdulu-private` berhasil dibuat dengan kelas Standard, lokasi APAC, jurisdiction default.
- Konfigurasi bucket terkonfirmasi privat: domain `r2.dev` dinonaktifkan dan tidak ada custom domain.
- OAuth `workers-r2.write` dan `account-api-tokens.write` berhasil. Token Object Read & Write dibatasi ke bucket ini; secret disimpan di `.env.local` dan artefak privat yang diabaikan Git.
- Probe cloud berhasil: akses bucket, tulis/baca, signed GET, dan penolakan baca S3 anonim. Objek probe sudah dihapus.
- Seluruh 44 referensi objek production berhasil disalin dan diverifikasi ukuran serta SHA-256: 12.965.573 byte, 0 gagal. Tidak ada penghapusan sumber atau perubahan database.
- Secret production berhasil dikonfigurasi di Vercel. Deployment commit `e0a81ea71b06c1f6dd3839bbe567e5fc63482023` (`dpl_GYntfyFMue3xiLJQBKfXhS2UuXUb`) berstatus READY, dengan alias `kenangdulu.web.id` dan `kenangdulu.vercel.app`.
- Driver production sekarang `r2`, dengan `STORAGE_FALLBACK_DRIVER=supabase`. Token Supabase bridge dipertahankan. Commit hanya mencakup perubahan R2; pekerjaan UI mobile tidak ikut dipublikasikan.
- Inventaris sesudah deployment: 44 referensi, 44 objek tersedia di R2, 12.965.573 byte, 0 objek hilang. Tidak ada berkas tambahan yang perlu disalin pada saat inventaris ini.
- Pemeriksaan yang dijalankan pada aktivasi ini: probe akses R2 privat, verifikasi ukuran/SHA-256 selama penyalinan, status deployment Vercel, dan pencocokan inventaris sesudah perpindahan. Build cloud Vercel berhasil sebagai bagian deployment. Tidak menjalankan build lokal, lint, typecheck lokal, suite, browser, atau alur unggah/rekaman/ZIP dari UI. Pemeriksaan UI pada langkah 7 belum dilakukan; fallback tetap aktif.

## Perilaku aplikasi

- `STORAGE_DRIVER=r2` mengarahkan unggahan baru, thumbnail, dan ekspor ke bucket R2 privat. Jalur unggahan bertahap 1 MiB tetap digunakan agar kompatibel dengan klien yang sudah terbuka.
- R2 client dipakai ulang, memvalidasi konfigurasi, dan tidak jatuh diam-diam ke penyimpanan lokal jika nama driver salah.
- Foto/video dan unduhan satuan menggunakan signed GET URL 120 detik setelah izin aplikasi diperiksa. File privat tidak dibuka sebagai bucket publik. CSP mengizinkan origin R2 akun/bucket agar browser dapat menampilkan hasil redirect.
- `STORAGE_FALLBACK_DRIVER=supabase` mempertahankan pembacaan berkas lama jika objek tidak ditemukan (404) di R2. Error akses, jaringan, atau 5xx tidak disamarkan sebagai 404. Konfigurasi bridge Supabase tetap diperlukan selama transisi.
- Penghapusan yang memang diminta aplikasi menghapus kedua salinan saat fallback aktif agar berkas terhapus tidak muncul kembali. Skrip migrasi sendiri tidak menghapus berkas sumber.

## Urutan aktivasi

1. Hubungkan Cloudflare melalui MCP resmi `https://mcp.cloudflare.com/mcp`, lalu selesaikan OAuth dengan akun pemilik. Buat bucket privat khusus Kenang Dulu dan kredensial S3 Object Read & Write yang dibatasi ke bucket tersebut.
2. Simpan `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, dan `R2_BUCKET_NAME` sebagai secret lokal/deployment. Secret tidak boleh masuk Git atau chat.
3. Jalankan `node --import tsx scripts/prepare-r2.ts --probe` untuk memastikan akses tulis/baca, signed GET, dan penolakan akses anonim. Satu objek pemeriksaan acak dibersihkan setelahnya.
4. Jalankan `node --import tsx scripts/migrate-storage-r2.ts` untuk inventaris tanpa menyalin. Jalankan kembali dengan `--copy` untuk menyalin referensi media, thumbnail, aset frame/sampul, dokumen, bagian unggahan aktif, serta ekspor yang belum kedaluwarsa. Skrip membandingkan ukuran dan SHA-256 aktual sumber/tujuan. Objek tujuan yang berbeda tidak ditimpa.
5. Pertahankan nama/key objek; tidak ada migrasi schema atau perubahan key database. Salinan Supabase dipertahankan.
6. Setelah pemeriksaan berhasil, deploy kode beserta `STORAGE_DRIVER=r2` dan `STORAGE_FALLBACK_DRIVER=supabase`. Perpindahan kode/env harus dalam deployment yang sama. Selesaikan penyalinan ulang setelah perpindahan untuk menangkap berkas yang masuk selama migrasi.
7. Periksa satu alur foto/thumbnail, rekaman, unduh satuan, dan ZIP dari deployment aktif. Kode pengantin dan aturan privasi tetap berlaku. Fallback baru boleh dimatikan setelah semua referensi aktif terverifikasi.

## Batas dan pemulihan

- R2 free tier adalah 10 GB-month Standard per akun, bukan 10 GiB per acara. Pengaturan kuota aplikasi tidak menambah kapasitas provider. Sediakan ruang untuk unggahan sementara dan beberapa acara.
- Skrip menyalin objek per satu dan memverifikasi isinya. Jangan mengaktifkan pemindahan bila laporan masih mempunyai berkas gagal tanpa memastikan penyebabnya.
- Jangan mengganti driver kembali ke Supabase setelah ada unggahan baru di R2 tanpa menyalin balik objek tersebut. Untuk masalah kode, pertahankan konfigurasi R2 dan perbaiki deployment agar kiriman baru tidak hilang dari jalur baca.
- Worker saat ini tetap mengikuti mekanisme aplikasi yang sudah ada. Perpindahan storage ini belum membuktikan 400 pengguna mengunggah serentak dan tidak mencakup klaim uji beban tersebut.

## Pemeriksaan awal

- Pemeriksaan terarah signed URL/fallback: `node --import tsx scripts/check-r2-storage-regressions.ts` berhasil dengan kredensial tiruan dan tanpa panggilan cloud.
- Inventaris database baca saja menemukan 44 referensi objek saat persiapan. Ini bukan bukti bahwa seluruh sumber sudah disalin.
- Tidak menjalankan build, lint, typecheck, suite penuh, atau uji beban rutin. Catatan aktivasi cloud dan deployment ditambahkan setelah akses tersedia.
