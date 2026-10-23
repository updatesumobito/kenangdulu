# Album pengantin

Halaman `/e/[slug]/pengantin` dan alias `/wahyu-novita/pengantin` menggunakan `CoupleAlbumView` di dalam `GuestShell`. Tautan brand kembali ke album. Tema terang/gelap mengikuti pilihan shell tamu.

- Form kode memakai endpoint sesi yang sudah ada, tombol tampil/sembunyikan kode, dan status proses masuk. Panel akses menyediakan tombol kunci album dan tautan halaman tamu.
- Koleksi menyediakan pencarian nama/ucapan, filter jenis kiriman, perbarui, pagination, kondisi memuat, kosong, dan gagal. Tombol sebelumnya tetap tersedia ketika halaman lanjutan kosong.
- Audio/video memakai kontrol native; memutar media lain menjeda pemutar sebelumnya. Foto utama dan foto pendamping ucapan membuka dialog pratinjau dengan tautan simpan. Scroll latar dikunci selama dialog terbuka dan dikembalikan saat ditutup.
- Bottom bar khusus mobile menyediakan Album, Foto, Suara, Ucapan, dan Akses setelah masuk; sebelum masuk tersedia Cerita kita, Buka album, dan Panduan. Filter Video, Photo strip, GIF, dan Booth tersedia di koleksi. Desktop menggunakan layout lebar.
- Aksen lengkung berada di atas kartu, sementara gambar menggunakan object-fit contain.

Kelanjutan ini memperbaiki kondisi pagination kosong dan menyambungkan foto pendamping ke dialog. Pemeriksaan dilakukan melalui pembacaan kode; belum menjalankan tes interaksi, build, typecheck, lint, atau browser. Belum melakukan deploy.
