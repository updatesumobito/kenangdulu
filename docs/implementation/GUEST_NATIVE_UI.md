# Guest UI: mode terang/gelap dan mobile

Pembaruan untuk halaman tamu `kenangdulu.web.id/wahyu-novita` beserta kamera, suara, video, ucapan, galeri dan album pengantin.

- `GuestShell` menyediakan header dan tombol tema. Tema awal mengikuti preferensi perangkat; pilihan manual disimpan dalam localStorage, dipakai kembali saat navigasi, dan disinkronkan antartab. Skrip awal mengatur atribut tema sebelum konten tamu ditampilkan. Palet hanya berlaku di shell tamu, tidak mengubah dashboard/admin.
- Mode terang memakai ivory, surface putih hangat dan aksen maroon; mode gelap memakai burgundy gelap, teks ivory dan aksen rose. Field, kartu, notice, kontrol kamera, recorder, galeri dan penutup memakai token yang sama. Warna antarmuka browser mengikuti tema saat shell aktif.
- Mobile memakai header lengket, kartu pengalaman dua kolom, area sentuh minimal 44px, input 16px, radius lebih halus, dan jarak untuk notch/home indicator. Bottom bar menampilkan Acara, Suara (atau Video jika suara tidak tersedia), Kamera, Ucapan, dan Galeri sesuai fitur event. Kamera menjadi tombol utama; halaman aktif ditandai `aria-current`. Semua pengalaman tetap dapat diakses dari kartu halaman acara.
- Welcome tutorial kini mengikuti palet terang/gelap. Identitas acara dan tanggal berada di atas, simulasi dan petunjuk di tengah, tombol mulai selalu tersedia di bawah pada mobile. Layout desktop menggunakan dua kolom. Bottom bar/header latar belakang tidak interaktif selama tutorial terbuka. Tutorial bisa dilewati, dijeda, dipilih langkahnya, dan dibuka ulang; reduced motion tetap didukung. Versi sessionStorage diperbarui agar pengunjung lama melihat welcome yang baru.
- Album pengantin memakai shell dan kontrol tema yang sama, dengan bottom bar dimatikan. Mekanisme kode akses tidak diubah.

Tidak menjalankan tes rutin, build lokal, typecheck, lint, screenshot atau browser sesuai preferensi pengguna. Build pada Vercel diperlukan untuk publikasi. Tampilan pada perangkat fisik belum diverifikasi.

## Publikasi

Deployment `dpl_CJc3hLS36jP8BXUHrtqnd6BctgDm` di proyek `kenangdulu` sudah `READY` dengan alias `kenangdulu.web.id` dan `aliasError=null`. Log Vercel mengonfirmasi kompilasi berhasil dan pemeriksaan TypeScript bawaan build selesai. Halaman tamu tetap `https://kenangdulu.web.id/wahyu-novita`.

Status ini mengonfirmasi publikasi build, bukan verifikasi visual atau interaksi pada Android/iPhone. Tidak melakukan commit atau push Git otomatis.
