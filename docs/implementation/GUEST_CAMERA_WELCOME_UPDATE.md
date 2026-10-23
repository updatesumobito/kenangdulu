# Guest camera, voice note, welcome dan penutup

Perubahan 23 Oktober 2026 di aplikasi `komukuna-virtual`, bukan paket PRD di VIRTUAL.

- Welcome guest kini menggunakan tutorial fullscreen dengan simulasi layar HP; gaya amplop sudah diganti sesuai revisi pengguna. Nama, tanggal, hashtag tetap berasal dari event yang dipublikasikan. Tutorial mengikuti mode event aktif: isi nama, jepret foto, pesan suara, video ucapan, tulis doa, lalu kirim.
- Simulasi nama diketik, kamera countdown 3-2-1 dan shutter, waveform suara, kartu ucapan, serta konfirmasi terkirim. Semuanya diberi label simulasi; tutorial tidak meminta akses kamera/mikrofon dan tidak mengirim data. Contoh nama/doa bukan data tamu asli.
- Tutorial menyediakan masuk langsung, Escape, pemilihan langkah, jeda pergantian langkah, dan tombol lihat cara pakai lagi setelah masuk. Perpindahan otomatis setiap 4 detik berhenti di langkah terakhir atau saat halaman disembunyikan. Reduced motion memakai langkah manual, menghilangkan typing/shutter/gerakan dan tetap menampilkan seluruh informasi. Scroll dipulihkan dan fokus dipindahkan ke heading setelah masuk.
- Status masuk memakai sessionStorage per event dengan versi tutorial baru agar revisi ini tetap terlihat bagi pengunjung yang telah melihat pembuka amplop sebelumnya. Tujuan motion: explanation untuk onboarding pertama; CSS transform/opacity, curve `.23,1,.32,1` dan `.77,0,.175,1`, transisi layar 300 ms, masuk acara 220 ms (reduced motion 120 ms). Tidak menambahkan dependency.
- Kamera meminta facing depan/belakang secara exact, lalu ideal bila perangkat tidak menyediakan facing tersebut. Permintaan izin yang ditolak tidak diulang otomatis. Stream lama dihentikan sebelum pergantian dan respons izin terlambat dibersihkan saat halaman disembunyikan/ditinggalkan.
- Resolusi diminta dari browser/perangkat (ideal sisi 4096 untuk foto; video dibatasi sisi 3840 sesuai validator server yang sudah ada). Resolusi aktual ditampilkan. Foto memakai dimensi frame stream, mempertahankan rasio, tanpa upscale, dengan batas canvas 12 megapiksel untuk penggunaan memori. File foto mengikuti batas canvas yang sama. GIF lebih kecil untuk efisiensi. Ini bukan akses ke resolusi sensor penuh/48MP yang mungkin tersedia hanya melalui aplikasi kamera native. Preview menggunakan contain supaya area foto terlihat utuh.
- Video ucapan juga memiliki pilihan kamera depan/belakang sebelum merekam. Voice note meminta mikrofon saja; menyediakan timer, stop otomatis sesuai batas event, dengar ulang, rekam ulang, buang, unggah, dan status kiriman. Format dipilih berdasarkan dukungan MediaRecorder.
- Recorder mencegah start ganda, mempertahankan chunk terakhir sebelum melepaskan stream, membuang rekaman gagal/terlalu besar, serta menyimpan ID upload agar kegagalan asosiasi foto dapat dicoba kembali tanpa upload ulang.
- Ucapan terima kasih muncul di akhir welcome dan setelah foto, suara/video, atau ucapan teks berhasil dikirim. Tersedia tautan pesan suara dan doa/ucapan sesuai mode event. Privasi dan moderasi tetap mengikuti izin publik yang sudah ada.

## Pemeriksaan yang benar-benar dijalankan

Pemeriksaan Node terarah dengan mock perangkat dan lifecycle recorder untuk bug ketukan ganda/pending permission: permintaan facing, resolusi adaptif, batas video, fallback OverconstrainedError, tidak mengulang izin ditolak; satu mikrofon untuk ketukan ganda, final chunk saat background, dan pelepasan stream dari izin yang datang terlambat. Seluruh assertion pemeriksaan ini berhasil.

Tidak menjalankan build, typecheck, lint, suite/E2E, browser/screenshot atau perangkat fisik. Tampilan motion dan hasil kamera/mikrofon Android/iPhone belum diverifikasi langsung (`NOT_TESTED_REAL_DEVICE`).

Referensi API yang dibaca: [facingMode](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints/facingMode), [getCapabilities](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/getCapabilities).

## Revisi tutorial fullscreen

Revisi mengganti intro amplop dengan tutorial dilakukan tanpa menjalankan build, typecheck, lint, tes rutin atau browser/screenshot, sesuai preferensi pengguna. Pemeriksaan mock yang dicatat di atas berlaku untuk perubahan kamera/recorder sebelumnya; bukan verifikasi tampilan tutorial baru.
