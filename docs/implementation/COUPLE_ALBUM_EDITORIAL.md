# Album pengantin: editorial romantis

Implementasi untuk `/e/[slug]/pengantin` dan alias `/wahyu-novita/pengantin`.

- Hero melengkung menyapa nama acara dan mengucapkan terima kasih. Foto sampul opsional; mulai 1024 px hero membagi sambutan/foto menjadi 52%/48%. Teks berada di permukaan solid, dengan font lokal Fraunces dan Manrope.
- CSS dibatasi ke `.guest-shell.guest-page .couple-dashboard`. Token acara dipakai untuk mode terang/gelap; palet maroon, ivory, dan gold Wahyu–Novita dipertahankan. Informasi kecil dinaikkan menjadi minimal 12 px; input 16 px.
- Grid foto satu kolom di bawah 390 px, dua kolom pada 390–1023 px, tiga kolom mulai 1024 px. Ucapan, suara, dan video selebar koleksi pada mobile/tablet. Foto tetap contain; kartu tidak lagi mengulang dekorasi arch.
- Dock mobile/tablet memakai Album, Jenis, dan Akses. Sebelum masuk: Sambutan, Buka album, Panduan. Dock memperhitungkan safe area dan disembunyikan ketika input difokuskan atau dialog terbuka.
- Dialog native Jenis mendukung pilihan kategori yang sudah ada, Escape, klik backdrop, fokus pilihan aktif, dan pengembalian fokus. Album mempertahankan filter/pencarian; memilih Jenis mempertahankan pencarian dan kembali ke halaman pertama.
- Sambutan memakai tiga kelompok animasi 300 ms, stagger 60 ms, setiap mount halaman. Maksimal enam kartu pertama memakai entrance 200 ms dengan stagger 40 ms; polling tidak mengulang entrance. Dialog memakai transisi 200 ms. Reduced motion mengganti gerak dengan fade 160 ms tanpa stagger.
- Form kode memiliki placeholder singkat dan asosiasi pesan error. Respons API 401 menampilkan tautan masuk ulang; 410 menjelaskan masa penyimpanan. Endpoint, cookie, kode pengantin, dan database tidak diubah.

Pengerjaan menggunakan pembacaan kode dan diff. Tidak menjalankan build, lint, typecheck, tes browser, screenshot, atau suite tes. Belum memverifikasi tampilan/interaksi pada perangkat nyata atau mengklaim kelulusan kontras terukur. Tidak melakukan commit, push, atau deploy.
