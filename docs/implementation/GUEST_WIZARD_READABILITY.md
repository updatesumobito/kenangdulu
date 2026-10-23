# Wizard tamu dan perbaikan keterbacaan

## Penyebab yang ditemukan

- Teks mobile lama berada pada 7–11 px di sejumlah label/tutorial.
- Selector global `body[data-app-mode='personal'] .card` memiliki specificity lebih tinggi daripada selector surface guest sebelumnya. Pada mode gelap, form tetap putih tetapi teks menjadi terang. Pemeriksaan browser menemukan rasio 1,08:1 untuk label/consent dan 1,77:1 untuk deskripsi di kartu yang terdampak.
- Selector tombol umum dengan banyak `:not(...)` dihapus agar tidak mengalahkan warna komponen spesifik. Selector surface guest diperkuat di sumbernya agar memakai token tema.

## Perubahan

- Entry tamu sekarang memakai `GuestWizard`: welcome → nama → foto → suara → video → ucapan → selesai. Hanya langkah yang diaktifkan event yang disertakan. Foto mengelompokkan disposable/strip/GIF melalui pilihan jenis foto; tidak memaksa tamu membuat setiap jenis foto.
- Satu tahap tampil pada satu waktu. Progress bernomor dan judul langkah selalu tersedia. Identitas dan persetujuan wajib; media/ucapan dapat dilewati. Sesi tamu yang masih aktif dapat dilanjutkan.
- Setiap media menggunakan capture/upload asli yang sudah tersedia. Callback berhasil hanya terjadi setelah server mengonfirmasi kiriman. UI menampilkan checkpoint sebelum melanjutkan. Halaman akhir membedakan berhasil dikirim, dilewati dan belum dikirim; melewati semua media tidak menghasilkan klaim kiriman berhasil.
- Saat merekam/meminta perangkat/mengunggah, navigasi tahap dikunci. Jika ada draf yang belum dikirim, konfirmasi diperlukan sebelum membuangnya untuk pindah tahap. Membatalkan konfirmasi mempertahankan draf. Peringatan sebelum reload hanya dipasang saat ada draf.
- Navigasi bebas bottom bar tidak ditampilkan dalam wizard agar tidak melompati urutan; halaman mode/galeri yang dibuka langsung tetap memakai navigasi lamanya. Header di wizard tidak menjadi tautan reload yang dapat membuang draf.
- Ukuran utama 14–16 px, teks bantuan 13 px, judul 32 px atau lebih. Label, placeholder, checkbox, select, filter, pose, tombol aktif/nonaktif, pesan error, kartu rekaman dan kartu ucapan diberi warna eksplisit. Kontrol nonaktif tidak diredupkan dengan opacity. Header menggunakan latar solid. Theme toggle dan preferensi tersimpan tetap berfungsi.
- Animasi hanya entrance pendek transform/opacity dengan reduced-motion fallback; tutorial kecil yang bergerak otomatis tidak lagi menjadi penghalang sebelum wizard.

## Pemeriksaan terarah karena error yang dilaporkan

Pemeriksaan lokal Chromium pada viewport 390×844, tema terang/gelap, reduced motion, menggunakan API sesi dan kiriman yang dimock untuk mencegah penulisan tamu asli. Tahap yang diperiksa: welcome, identitas, kamera, suara, video, ucapan, kegagalan kirim, checkpoint berhasil, dan selesai. Output: `artifacts/wizard-contrast-result.json`.

- Pemeriksaan warna teks dari computed styles terhadap background aktual: tidak ada kegagalan pada state yang diperiksa setelah perbaikan. Rasio terkecil yang tercatat: terang 6,07:1; gelap 7,96:1. Ini cakupan teks pada state fixture tersebut, bukan sertifikasi seluruh situs, semua konten pengguna, ikon, atau media.
- Tidak ada horizontal overflow pada state yang diperiksa.
- Form nama/consent wajib, urutan tahap, skip opsional, pembatalan buang draf, penanganan gagal kirim tanpa false success, retry kirim, ringkasan hanya untuk kiriman yang dikonfirmasi, dan pergantian tema diperiksa.
- Screenshot diagnosis diperiksa untuk welcome gelap dan form ucapan gelap. Kamera/mikrofon perangkat fisik dan transfer media nyata tidak diuji pada pemeriksaan ini.

Tidak menjalankan suite rutin, build lokal, lint atau typecheck terpisah. Pemeriksaan diulang hanya untuk kegagalan yang ditemukan: locator pemeriksaan textarea diperbaiki, lalu background kartu gelap yang masih gagal diperbaiki dan diperiksa ulang. Build Vercel diperlukan untuk publikasi.

## Publikasi

Deployment produksi `dpl_qxcSmL81rmRGSFqJAgY3W8YN3RCn` sudah `READY`, domain `kenangdulu.web.id` terpasang, dan `aliasError=null`. Log Vercel mengonfirmasi build selesai. Entry publik tetap `https://kenangdulu.web.id/wahyu-novita`. Tidak melakukan commit atau push Git otomatis.
