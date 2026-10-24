# Kode pengantin mengikuti pengaturan acara

- Sumber kode tetap `event_couple_access`, yang diubah melalui pengaturan acara dashboard. Kode tidak mengikuti snapshot publish, sehingga perubahan langsung berlaku tanpa publish ulang.
- Dashboard menyediakan tambah/ganti kode, nonaktifkan akses, dan hapus kode. Penghapusan memakai DELETE endpoint yang memeriksa izin edit acara dan mencatat audit tanpa kode/hash.
- Validasi format tambah/ganti kode dibagi antara dashboard dan server: 8–64 karakter, huruf, angka, serta tanda hubung. Kode peka huruf besar/kecil, disimpan sebagai salted hash, dan tidak dikirim kembali ke browser.
- Kode salah ditolak dan cookie pengantin pada browser yang mencoba masuk dihapus. Kode tidak tersedia/nonaktif juga ditolak.
- Mengganti kode menghasilkan hash baru; sesi lama tidak lagi cocok dengan konfigurasi terbaru. Menonaktifkan atau menghapus kode juga menolak sesi lama pada pemeriksaan berikutnya. Membuat ulang kode yang sama tetap tidak menghidupkan kembali sesi terdahulu.
- Endpoint koleksi/ZIP dan pemeriksaan akses berkas tetap memeriksa akses server. Saat pemuatan/polling album menerima 401, pratinjau ditutup dan halaman disegarkan ke form kode. Polling album yang terlihat berjalan setiap 10 detik; konten yang sudah diterima perangkat tidak dapat ditarik kembali.

Pemeriksaan terarah `node --import tsx scripts/check-couple-access-regressions.ts` berhasil untuk tambah kode, penolakan kode salah/beda kapital, ganti kode, nonaktifkan, hapus, buat ulang, pencabutan sesi lama, dan isolasi acara. Tes memakai PGlite dalam memori, fungsi hash asli, dan cookie request tiruan. Assertion awal disesuaikan untuk objek lintas konteks VM; pemeriksaan ulang berhasil.

Kode/konfigurasi acara sebenarnya tidak diubah. Tidak menjalankan browser, build, lint, typecheck, atau suite penuh. Alur klik dashboard dan login melalui HTTP nyata belum diuji pada perubahan ini. Tidak melakukan deploy.
