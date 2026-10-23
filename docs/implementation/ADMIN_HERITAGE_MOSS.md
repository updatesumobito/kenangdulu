# Admin Heritage Moss & homepage Kenang Dulu

Scope: tampilan workspace untuk superadmin/designer, termasuk `/pribadi`, serta homepage `/`. Referensi: `design (3).md`.

- Token Heritage Moss di `src/app/admin-design.css` hanya aktif di `.kd-theme`; styling dashboard dibatasi `.workspace.admin-console`.
- Manrope dan Fraunces disimpan lokal di `public/fonts`, beserta lisensi OFL. Tidak ada dependency baru atau permintaan font eksternal dari browser.
- Pola sidebar, metric card, badge, table, tabs, empty state dan preview template mengadaptasi referensi komponen shadcn ke stack React/CSS yang sudah ada. Tidak memasang atau mengklaim menggunakan paket shadcn.
- Ringkasan alur pesanan menggunakan data pesanan pada halaman aktif, dengan keterangan cakupan tersebut. Tidak menambahkan request, endpoint, atau angka contoh.
- Sidebar mempertahankan menu, URL, urutan, dan permission. Kontrol keluar dan kembali ke beranda tetap tersedia di layar kecil.
- Form, event handler, validasi, API, autentikasi, database, serta logic transaksi tidak diubah.
- Homepage mendapat hero coming soon dengan animasi masuk album dan waveform terbatas, memakai CSS transform/opacity. `prefers-reduced-motion` menonaktifkan gerak dekoratif. Section fitur, panduan, paket, vendor, FAQ, dan CTA tetap tersedia.
- Redirect homepage ke `/pribadi` pada mode personal dilepas agar homepage baru dapat dilihat pada `/`. Dashboard `/pribadi` tetap tersedia.
- Header/Footer memakai branding Kenang Dulu hanya ketika prop `heritage` diberikan. Penggunaan lain tetap memakai branding sebelumnya.
- File halaman tamu `/wahyu-novita`, komponen guest, pengantin, dan stylesheet keduanya tidak diedit dalam pekerjaan ini. Perubahan file tersebut yang telah ada di working tree dipertahankan.
- Tidak deploy atau publish. Tidak menjalankan build, lint, typecheck, tes, atau pemeriksaan browser, sesuai preferensi pengguna. Tampilan dan motion belum diverifikasi secara visual di browser.

Referensi komponen: https://ui.shadcn.com/docs/components/base/sidebar dan https://ui.shadcn.com/blocks?category=dashboard.
