# Pemeriksaan album per tamu — 24 Oktober 2026

- Memperbaiki encoding komponen album yang menyebabkan HTTP 500 (`Unexpected character`) serta karakter teks yang rusak.
- Menangani tanggal kosong/tidak valid tanpa `toISOString()` melempar error. Tanggal acara dan kiriman memakai zona waktu acara, dengan fallback Asia/Jakarta jika zona tidak valid. Tanggal acara Wahyu–Novita yang dibaca dari database valid; error tanggal sebelumnya tidak berhasil direproduksi pada data tersebut.
- Menyamakan akses berkas tersembunyi dengan koleksi pengantin/pengelola. Pemeriksaan hak akses dan masa retensi tetap berlaku. Publik tetap tidak dapat mengakses kiriman tersembunyi/privat; kiriman terhapus atau belum siap tetap ditolak.
- Menambahkan fallback dari thumbnail kiriman ke foto asli jika thumbnail gagal dimuat.

Pemeriksaan yang dijalankan khusus temuan ini:

- `node --import tsx scripts/check-couple-album-regressions.ts`: berhasil. Mencakup tanggal/zona waktu, matriks akses dengan dependensi autentikasi tiruan, pengelompokan identitas tamu bernama sama, pemilihan sampul kamera, filter, paginasi 27 album tanpa duplikasi, serta ZIP berisi 26 ucapan melampaui satu halaman. Fixture memakai PGlite dalam memori dan tidak mengubah database acara.
- Query baca database acara: satu album, 10 kiriman siap dengan moderasi pending, empat thumbnail, dan tidak ada tanggal album tidak valid.
- Satu foto asli dan thumbnail dari penyimpanan berhasil dibaca, masing-masing HTTP 200 dengan tipe image/jpeg dan image/webp.
- GET lokal `/wahyu-novita/pengantin` setelah perbaikan encoding: HTTP 200, tanggal 24 Oktober 2026 dan input kode tersedia.

Tidak menjalankan build, lint, typecheck, suite penuh, atau pemeriksaan browser. Login kode pengantin melalui browser dan unduhan ZIP dari penyimpanan hosted belum diuji. Tidak melakukan commit, push, atau deploy.

## Verifikasi lanjutan setelah laporan album tidak muncul

Pemeriksaan browser lokal dilakukan khusus untuk laporan ini, menggunakan akses pengantin yang valid pada viewport desktop dan mobile 390 × 844:

- Endpoint album mengembalikan HTTP 200. Satu kartu album Komukuna muncul dan dapat diklik. Jumlah identitas tamu dan kiriman dicocokkan dengan query baca database: satu tamu dengan 10 kiriman, terdiri atas empat foto, dua suara, dua video, dan dua ucapan.
- Sampul album dan empat gambar kiriman selesai dimuat dengan dimensi gambar valid. Klik foto membuka dialog dan foto aslinya selesai dimuat.
- Dua audio dan dua video berhasil memuat metadata melalui pemutar. Pemeriksaan ini tidak menilai suara atau isi rekaman secara manual.
- Tombol Semua album tamu berhasil mengembalikan tampilan ke kartu album. Tidak ditemukan error JavaScript halaman.
- Tidak diperlukan perubahan kode tambahan untuk alur yang diperiksa; error HTTP 500 akibat encoding sudah diperbaiki pada pengerjaan sebelumnya. Jumlah satu album sesuai data acara saat pemeriksaan, bukan batas jumlah tamu.

Pengujian ini memakai sesi pengantin valid tanpa mengubah kode akses. Pengisian kode pada form login, deployment produksi, dan unduhan ZIP hosted belum diuji. Tidak menjalankan build, lint, typecheck, atau suite penuh.
