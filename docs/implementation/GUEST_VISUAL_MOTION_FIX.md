# Animasi visual welcome tamu

23 Oktober 2026. Koreksi scope: pengguna meminta ilustrasi bergerak otomatis, bukan perubahan interval pergantian langkah. Perubahan interval sebelumnya dikembalikan.

- Ponsel melayang naik/turun 20px, bergeser 10px, dan bergoyang dari -5 hingga 1 derajat dalam loop 6 detik. Kartu dekoratif memakai loop gerakan terpisah dengan fase berbeda.
- Token easing ditetapkan pada selector welcome yang sama dengan animasi agar selalu tersedia. BOM pada awal `guest-opening.css` dinormalisasi; karakter tersebut dapat membuat selector token awal tidak cocok saat stylesheet digabung sebagai teks.
- Mode reduced motion memakai perubahan opacity lembut otomatis, tanpa gerakan posisi/rotasi. Tombol jeda menghentikan seluruh animasi turunan welcome dan melanjutkannya kembali. Tab tersembunyi juga menjeda animasi.

Pemeriksaan terarah: komponen `GuestOpening` asli pada fixture lokal dengan stylesheet aplikasi, tanpa API/data acara. Chromium 390×844 dan 1280×800: nilai computed transform ponsel dan kedua kartu berubah otomatis tanpa klik. Chromium 390×844 reduced motion: opacity berubah otomatis, tanpa transform. Nilai animasi membeku setelah jeda dan berubah lagi setelah lanjut pada ketiga kondisi; tidak ada page error.

Hasil: `artifacts/welcome-visual-motion-result.json`; skrip: `artifacts/check-welcome-visual-motion.mjs`. Tidak menjalankan full suite, build Next.js, lint, typecheck, deploy, atau verifikasi perangkat fisik. Pemeriksaan autoplay dari percobaan sebelumnya tidak mewakili perilaku final.
