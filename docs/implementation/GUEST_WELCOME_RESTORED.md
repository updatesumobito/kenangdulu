# Welcome dan navigasi sebelum wizard dikembalikan

Revisi ini menggantikan keputusan wizard dalam `GUEST_WIZARD_READABILITY.md` sesuai instruksi terbaru pengguna.

- Entry tamu kembali menampilkan `GuestOpening` fullscreen dengan tutorial bergerak dan tombol masuk/lewati, lalu halaman acara dengan pilihan pengalaman bebas. Tidak ada wizard wajib yang memaksa urutan foto/suara/video/ucapan.
- Isi nama/persetujuan kembali berada pada halaman pengalaman ketika sesi belum tersedia; kiriman tetap memakai kamera, recorder dan API yang sudah ada.
- Halaman, komponen welcome, dan shell dipulihkan dari snapshot aplikasi sebelum wizard. Versi status welcome dinaikkan agar pengunjung lama dapat melihat welcome kembali.
- Desktop kembali menggunakan komposisi welcome dua kolom dan layout halaman acara desktop sebelumnya. Bottom bar dan header lengket hanya berlaku pada viewport mobile (maksimal 760px); desktop tidak memakai navigasi native mobile atau layout wizard.
- Mode terang/gelap dan perbaikan kontras kartu, input, placeholder, tombol/filter/pose, pesan error dan teks bantuan dipertahankan. Tombol tutorial dan teks ilustrasi memakai warna eksplisit agar tidak terpengaruh warna tombol umum atau tema halaman.
- Komponen wizard dan pembentuk langkah yang tidak lagi dipakai dihapus. Callback opsional pada komponen media tidak mengubah alur mandiri yang dipulihkan.

Tidak menjalankan tes, browser/screenshot, lint, typecheck atau build lokal baru untuk rollback ini. Hasil pemeriksaan wizard sebelumnya adalah catatan versi lama, bukan bukti pemeriksaan ulang UI yang dipulihkan. Build Vercel diperlukan untuk publikasi.

Deployment produksi `dpl_4Ei9d5o6QpkjoqYFaJ6iSpRfGBaG` sudah `READY`, alias `kenangdulu.web.id` aktif, dan `aliasError=null`. Pemeriksaan TypeScript bawaan build Vercel selesai tanpa error. Halaman tamu tetap `https://kenangdulu.web.id/wahyu-novita`. Tidak melakukan commit atau push Git otomatis.

## Revisi nomor dan autoplay

Nomor tutorial menggunakan grid kolom sama lebar, lingkaran 28×28 px, dan ruang label dua baris yang seragam. Tombol jeda dihapus. Pergantian langkah otomatis setiap empat detik dan berulang dari terakhir ke pertama; memilih nomor tidak menghentikan autoplay. Saat tab kembali terlihat, autoplay berjalan kembali. Preferensi reduced motion tetap mengurangi gerakan visual tanpa menghentikan pergantian langkah.

Pemeriksaan Chromium terarah karena laporan nomor tidak sejajar: pada lebar 390 dan 1280 px, keenam lingkaran memiliki koordinat atas yang sama dan ukuran 28×28 px, serta tidak ada tombol jeda. Perulangan otomatis terakhir-ke-pertama diperiksa pada viewport mobile. Tidak menjalankan suite rutin, lint, typecheck atau build lokal.

Revisi ini sudah dipublikasikan melalui deployment `dpl_5HW9ReDZQfbPMcnrHSVikp8fywpK`, berstatus `READY` dengan alias `kenangdulu.web.id` dan `aliasError=null`; build Vercel selesai.
