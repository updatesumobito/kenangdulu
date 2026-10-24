# Kelanjutan UI tamu mobile — 24 Oktober 2026

Acuan pekerjaan: `updatemobile.md` dan perubahan UI yang sudah ada di working tree. Perubahan R2 tidak dilanjutkan pada sesi ini.

## Implementasi

- Form nama memakai ilustrasi kecil, judul responsif, dan placeholder nama/panggilan.
- Kamera menampilkan jumlah foto terpakai dan sisa pilihan secara eksplisit. Tombol foto terakhir membuka area draft; filter pertama bernama “Tanpa filter”.
- Bingkai tegak memiliki lebar minimum agar shutter, balik kamera, dan thumbnail tetap memiliki ruang pada layar pendek. Seluruh gambar dipertahankan dalam bingkai.
- Preview kamera memakai preferensi 1920 × 1080 / 30 fps. Pada perangkat dengan pointer sentuh, jepret mengambil frame preview utuh agar proses foto native tidak menghentikan preview. Desktop tetap memakai `ImageCapture` jika tersedia, dengan batas waktu dan fallback frame. Dimensi dan kelancaran aktual bergantung perangkat/browser.
- Kegagalan permintaan kamera lama tidak boleh menghentikan stream dari permintaan penggantinya.
- Panel unggah foto/suara/video mempunyai panduan tiga langkah, batas format/ukuran, preview, tombol coba lagi, dan pilihan optimasi untuk foto/video. Mengganti pilihan suara/video mengganti pilihan sebelumnya.
- Video tetap dibatasi maksimal 30 detik, atau batas sesi bila lebih kecil. Pilihan format 1:1 dan 9:16 tersedia.
- Pengiriman memakai modal progres dengan animasi masuk. Halaman terima kasih mempunyai transisi bertahap dan dekorasi bergerak. Reduced motion menghentikan gerak tambahan.
- Review tidak menawarkan unduhan; halaman terima kasih menyediakan unduhan file terpisah serta tombol tiap file. Tidak ada unduhan otomatis atau ZIP. Video yang masih diproses menunggu hasil siap.
- Warna memakai token acara; palet khusus `wahyu-novita` dan alur welcome dipertahankan.

## Pemeriksaan yang dijalankan

`node scripts/check-guest-camera-regression.mjs` selesai: React terisolasi dengan stream tiruan memastikan kegagalan permintaan lama tidak menghentikan stream pengganti, stop eksplisit melepaskan track, dan preferensi video 1080p/30 fps terkirim.

Tidak menjalankan build, lint, typecheck, full suite, browser aplikasi, screenshot, atau pengujian kamera/mikrofon perangkat nyata. Kelancaran kamera, tampilan perangkat nyata, dan izin unduhan banyak file belum diverifikasi. Tidak ada push/deploy pada kelanjutan ini.

Referensi constraint kamera: [MDN — Capabilities, constraints, and settings](https://developer.mozilla.org/en-US/docs/Web/API/Media_Capture_and_Streams_API/Constraints).

## Perbaikan jepret Android dan pemeriksaan pengiriman

- Laporan pengguna: tombol jepret tidak berfungsi pada Android/Chrome. Permintaan native `takePhoto()` yang tidak pernah selesai direproduksi dengan driver tiruan: sebelum perbaikan, shutter terus menunggu. Kondisi yang sama pada perangkat pengguna tidak dapat diamati langsung.
- Kamera sentuh sekarang mengambil frame video yang sedang tampil tanpa memanggil foto native. Desktop membatasi tunggu native menjadi 2 detik, lalu memakai frame yang disimpan sebelum native dapat menghentikan preview. Permintaan native macet tidak diulang pada track yang sama. Encode/decode foto juga mempunyai batas waktu, dan UI mengumumkan status persiapan foto.
- `node scripts/check-guest-photo-regression.mjs`: berhasil untuk desktop dan mobile touch, termasuk native berhasil, ditolak, hasil kosong, macet, tidak tersedia, jepret berulang, dan track yang telah berhenti.
- `node scripts/check-guest-mobile-flow.mjs`: berhasil di Chromium emulasi Pixel 5 dengan kamera/mikrofon sintetis dan database/storage demo lokal. Dua foto (termasuk filter dan rasio tegak), suara, video, dan ucapan terkirim melalui API asli. Kelima kiriman siap di album pengantin; pembukaan/pindah foto dan pemutaran suara/video berhasil.
- `node scripts/check-guest-import-flow.mjs`: berhasil untuk pemilih foto, suara, dan video dari perangkat, ditambah ucapan. Keempat kiriman siap dan dapat dibaca melalui akses pengantin.
- Pemeriksaan baca production Nava–Akhsan berhasil untuk kode pengantin, galeri privat, foto, thumbnail, suara, video, dan ucapan. Media menggunakan signed R2 URL dan mendukung Range dengan HTTP 206. Tidak membuat kiriman sintetis di album production. Data media production yang diperiksa berstatus siap, tanpa job gagal.
- Tidak menjalankan full suite, lint, typecheck, atau build lokal. Perangkat Android fisik, Safari fisik, dan jaringan seluler pengguna belum diuji.

Referensi perilaku native yang dapat menghentikan stream sementara: [W3C MediaStream Image Capture](https://www.w3.org/TR/image-capture/#dom-imagecapture-takephoto).
