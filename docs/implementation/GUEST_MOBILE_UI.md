# Kelanjutan UI tamu mobile — 24 Oktober 2026

Acuan pekerjaan: `updatemobile.md` dan perubahan UI yang sudah ada di working tree. Perubahan R2 tidak dilanjutkan pada sesi ini.

## Implementasi

- Form nama memakai ilustrasi kecil, judul responsif, dan placeholder nama/panggilan.
- Kamera menampilkan jumlah foto terpakai dan sisa pilihan secara eksplisit. Tombol foto terakhir membuka area draft; filter pertama bernama “Tanpa filter”.
- Bingkai tegak memiliki lebar minimum agar shutter, balik kamera, dan thumbnail tetap memiliki ruang pada layar pendek. Seluruh gambar dipertahankan dalam bingkai.
- Preview kamera memakai preferensi 1920 × 1080 / 30 fps; foto tetap memakai `ImageCapture` jika tersedia. Dimensi dan kelancaran aktual bergantung perangkat/browser.
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
