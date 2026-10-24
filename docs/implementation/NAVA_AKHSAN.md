# Nava & Akhsan — 25 Oktober 2026

Permintaan: salin pengalaman Wahyu & Novita menjadi acara tersendiri, dengan warna `design (5).md` dan hashtag `#akhsanavainlove`. Pekerjaan dashboard umum ditunda; perubahan admin dibatasi pada pengaturan acara yang diperlukan.

- Tamu: `/nava-akhsan`, termasuk welcome/tutorial berulang, kamera, suara, video, ucapan dan galeri melalui handler yang sama dengan acara sumber.
- Pengantin: `/nava-akhsan/pengantin`, termasuk kode masuk, album, pencarian/filter, dan unduhan yang sudah ada.
- Admin: `/admin/events/7cb515c6-9151-4b3a-a3d9-43a1fe1656b8`, tab **Pengalaman tamu** untuk nama, tanggal, hashtag, tema, mode, sampul dan kode pengantin. Perubahan pengalaman berikutnya tetap memakai alur simpan draft lalu publish.
- Tema `curtain-olive` memakai olive gelap, burgundy, ivory dan champagne sesuai design 5. Permukaan/header solid; mode terang memakai alternatif soft cream. Tema tersedia sebagai pilihan admin, bukan dipaksakan berdasarkan slug. Preferensi terang/gelap tersimpan tetap dihormati; tanpa preferensi tersimpan, acara ini dibuka gelap.
- Tanggal disimpan sebagai 25 Oktober 2026, pukul 00:00:00–23:59:59 WIB. Pengiriman dibuka sekarang mengikuti sumber.
- Acara baru dibuat pada database proyek `xpwhpeolndmprzmdkldm`: order complimentary terpisah, kuota 1.000 tamu/15 foto, satu frame Olive Moments, snapshot terbit/revisi awal, serta konfigurasi akses pengantin. Kode pengantin mengikuti kode sumber; sesi/cookie tetap dibatasi ID acara dan kode dapat diganti dari admin.
- Data konfigurasi sumber berformat JSON string dan memiliki karakter plan pada key numerik. Salinan baru menormalkan JSON serta memulihkan plan asli dan override kuotanya; data sumber tidak ditulis ulang. Frame disalin dengan ID baru dan teks pasangan baru. Tidak menyalin tamu, media, sesi, token layar atau pekerjaan ekspor.
- Provisioning tercatat di audit. SQL eksplisit yang dipakai ada di `scripts/provision-nava-akhsan.sql`; satu transaksi dan tidak mengubah acara target yang sudah ada pada pemanggilan ulang.

Konfirmasi database sesudah provisioning: nama/tanggal/hashtag/tema benar, snapshot berbentuk object, published theme `curtain-olive`, satu frame, akses pengantin aktif, nol media. Tidak menjalankan build, lint, typecheck, suite, screenshot atau pemeriksaan browser aplikasi. Kode halaman/tema belum dipush atau dideploy pada pekerjaan ini; gunakan server preview lokal port 3107.

## Perbaikan kontras setelah laporan pengguna

Pengguna melaporkan teks merah tidak terbaca dalam mode gelap. Empat belas deklarasi teks/ikon wizard memakai token warna tombol `--g-accent`, sehingga burgundy tetap menjadi warna teks pada permukaan olive gelap. Deklarasi tersebut sekarang memakai `--color-interactive-text`: champagne pada mode gelap dan burgundy pada permukaan terang. Warna isi tombol tetap burgundy dengan teks ivory. Label kecil pilihan rasio aktif mewarisi warna teks tombol, sehingga tidak lagi memakai teks olive gelap di atas burgundy pada mode terang. Aksen teks pada komponen tamu lama mengikuti token foreground yang sama.

`node scripts/check-nava-contrast.mjs` mereproduksi 12 kegagalan kontras sebelum perbaikan dan selesai setelahnya: 282 sampel teks/state memenuhi 4,5:1 untuk teks normal atau 3:1 untuk teks besar, dalam mode gelap/terang pada lebar 390 dan 1280 px. Fixture menggunakan urutan stylesheet aplikasi yang sebenarnya untuk welcome, identitas, pilihan kamera/filter/rasio, unggah, status rekaman, ucapan, review/pengiriman/unduhan, tombol aktif/nonaktif, navigasi terkunci, galeri, kode masuk dan kontrol album pengantin. Ini pemeriksaan regresi CSS terisolasi, bukan acceptance semua alur aplikasi atau media/perangkat nyata. Tidak menjalankan build, lint, typecheck, suite, screenshot, upload atau deploy.

## Penyamaan desktop dengan Wahyu–Novita

Laporan pengguna berikutnya meminta desktop sama dengan Wahyu–Novita dengan palet Nava. Aturan header kontras dan latar judul wizard pada tema Nava sebelumnya berlaku di semua ukuran. Keduanya kini dibatasi ke mobile (maksimal 760 px), mengikuti batas perlakuan header pada referensi. Desktop memakai header bersama yang menyatu dengan halaman, judul wizard tanpa blok kartu tambahan, serta layout/ukuran/jarak/tipografi/komponen bersama yang sama. Palet dan perbaikan kontras tetap dipertahankan.

`node scripts/check-nava-desktop-parity.mjs` mereproduksi delapan perbedaan hierarki permukaan sebelum perbaikan, lalu selesai dengan 376 perbandingan elemen pada lebar 1280/1440 px, mode terang/gelap. Fixture membandingkan geometri, tipografi, bentuk dan peran latar desktop dengan copy yang identik agar perbedaan nama/tanggal tidak memengaruhi hasil. Pemeriksaan kontras dijalankan kembali karena aturan latar berubah: 282 sampel tetap memenuhi ambang sebelumnya. Ini pembandingan stylesheet terisolasi, bukan screenshot atau acceptance halaman aplikasi. Tidak menjalankan build, lint, typecheck, suite, push atau deploy.
