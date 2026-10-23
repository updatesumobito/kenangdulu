# Pembaruan UI tamu mobile dan desktop

23 Oktober 2026. Melanjutkan implementasi yang sudah ada di working tree.

- Desktop mulai 1000px memakai identitas acara di kiri dan pilihan pengalaman di kanan. Kartu identitas tetap terlihat saat menggulir pilihan. Tablet memakai susunan vertikal dengan pilihan dua kolom.
- Kartu pilihan memakai judul 15–16px, deskripsi 13–14px, dan label 11–12px. Pada layar hingga 360px pilihan menjadi satu kolom. Nama acara dan konten panjang dapat membungkus.
- Navigasi acara tersedia di bawah header desktop dan tetap menjadi bottom bar di mobile. Suara dan Video memiliki tautan terpisah saat keduanya diaktifkan. Kamera tetap menandai mode foto/strip/GIF sebagai aktif. Padding bawah tidak lagi disisakan untuk shell yang mematikan navigasi.
- Halaman pengalaman memiliki judul, deskripsi singkat, dan ikon. Form identitas memakai placeholder, pengantar, informasi privasi, serta field nonaktif selama permintaan sesi berlangsung. Komponen yang dimuat dinamis mendapat indikator loading bersama.
- Kontrol kamera membungkus sesuai ruang, viewfinder mempertahankan rasio, dan tindakan hasil foto/rekaman dapat tersusun pada mobile. Area filter tetap dapat digulir horizontal.
- Filter galeri tersusun horizontal di desktop dan vertikal di mobile. Galeri memakai tiga/dua/satu kolom sesuai lebar; pagination membungkus dan teks ucapan panjang dapat berpindah baris.
- Palet terang/gelap mengikuti token guest yang sudah ada. Welcome tutorial tetap memakai komposisi tersendiri.

## Pemeriksaan dan status

Meninjau sumber komponen, aturan CSS yang terkait, panduan CSS Next.js lokal, dan diff perubahan. Tidak menjalankan tes otomatis, build, typecheck, lint, screenshot, atau pemeriksaan browser sesuai preferensi pengguna. Tampilan dan interaksi pada perangkat belum diverifikasi. Tidak melakukan deploy, commit, atau push.

Perubahan utama berada pada `src/app/guest-responsive.css`, diimpor setelah stylesheet guest sebelumnya. Komponen terkait: `guest-shell.tsx`, `guest-experience.tsx`, dan halaman acara `src/app/e/[slug]/page.tsx`.
