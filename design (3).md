# KENANG DULU --- Design System & UI Guidelines

**Versi:** 1.0\
**Arah brand:** Heritage Moss --- Modern Memory Archive\
**Tagline:** *Rayakan Sekarang, Kenang Selamanya.*

## 1. Tujuan dan batasan

Dokumen ini adalah acuan pembaruan visual Kenang Dulu. UI saat ini masih
memakai warna Komukuna; ganti identitas visualnya menjadi Heritage Moss
secara konsisten.

**Aturan utama: ubah tampilan saja, jangan mengubah fungsi yang sudah
ada.**

-   Jangan mengubah business logic, route, URL, API, database/schema,
    autentikasi, otorisasi, permission, integrasi, state management,
    event handler, validasi, maupun alur pengguna.
-   Jangan menghapus, mengganti nama, atau menonaktifkan fitur, halaman,
    komponen, tombol, form, menu, maupun interaksi yang sudah ada.
-   Jangan membuat ulang aplikasi dari nol, melakukan refactor besar,
    atau menambahkan dependency hanya untuk styling.
-   Pertahankan framework, struktur project, library, pola styling,
    responsive behavior, dan mekanisme light/dark mode yang sudah
    digunakan.
-   Pertahankan loading, empty, error, success, disabled, focus, dan
    seluruh state yang sudah tersedia.
-   Copywriting fungsional tetap seperti semula. Tagline di dokumen ini
    hanya digunakan di area branding yang sesuai.
-   Jika terjadi konflik, fungsi yang sudah berjalan harus tetap utuh;
    cari solusi visual alternatif.

**Scope:** warna, font, skala tipografi, spacing visual, border, radius,
shadow, hover/focus states, responsive styling, dan konsistensi
light/dark mode.

## 2. Fondasi brand

**Brand:** Kenang Dulu\
**Kategori:** Virtual Photobooth & Digital Guestbook\
**Konsep:** Modern Memory Archive\
**Kepribadian:** timeless, warm, elegant, calm, modern.\
**Tagline:** **Rayakan Sekarang, Kenang Selamanya.**

Kenang Dulu harus terasa seperti album kenangan premium dalam bentuk
digital: hangat dan personal, elegan tanpa mencolok, serta modern dan
mudah digunakan. Foto dan cerita pengguna harus menjadi fokus utama,
bukan dekorasi UI.

## 3. Palet warna utama --- Heritage Moss

Gunakan HEX di bawah secara konsisten. Jangan memakai kembali warna
Komukuna sebagai warna brand utama atau sekunder.

### Core palette

  ----------------------------------------------------------------------------
  Token                Nama              HEX               Peran
  -------------------- ----------------- ----------------- -------------------
  `--kd-forest`        Forest Slate      `#4B5A52`         Primary brand,
                                                           tombol utama light
                                                           mode

  `--kd-moss-deep`     Deep Moss         `#39443E`         Hover/active
                                                           primary

  `--kd-linen`         Fog Linen         `#F2EEE8`         Background light
                                                           mode

  `--kd-mist`          Soft Mist         `#E5E8E2`         Background sekunder

  `--kd-copper`        Muted Copper      `#B98B6A`         Aksen
                                                           premium/dekoratif

  `--kd-copper-soft`   Dust Copper       `#D8B8A1`         Aksen lembut,
                                                           terutama dark mode

  `--kd-charcoal`      Charcoal Olive    `#2B312E`         Heading dan teks
                                                           utama

  `--kd-moss-gray`     Moss Gray         `#6B746E`         Teks sekunder

  `--kd-stone`         Pale Stone        `#D7D8D2`         Border dan divider

  `--kd-white`         Warm White        `#FCFBF8`         Surface/card light
                                                           mode
  ----------------------------------------------------------------------------

### Skala Forest Slate

  Shade   HEX         Penggunaan
  ------- ----------- ---------------------------
  50      `#F4F6F5`   Background sangat lembut
  100     `#E7ECE9`   Area tinted
  200     `#CDD7D1`   Border tinted
  300     `#AEBCAF`   Ilustrasi/elemen sekunder
  400     `#8A9B90`   Ikon dekoratif
  500     `#6E8075`   Elemen pendukung
  600     `#4B5A52`   Primary brand
  700     `#39443E`   Hover/active
  800     `#2C332F`   Elemen gelap
  900     `#1D2320`   Dasar dark mode

### Skala Muted Copper

  Shade   HEX         Penggunaan
  ------- ----------- -----------------------------------
  50      `#FBF7F4`   Aksen background lembut
  100     `#F3E5DC`   Highlight lembut
  200     `#E9D0C0`   Surface dekoratif
  300     `#D8B8A1`   Aksen lembut
  400     `#CB9D7F`   Ikon/ornamen
  500     `#B98B6A`   Muted Copper
  600     `#9F7358`   Aksen lebih kuat
  700     `#7D5945`   Teks aksen pada background terang
  800     `#5B4031`   Detail gelap
  900     `#403027`   Detail sangat gelap

Copper adalah aksen, bukan warna dominan. Untuk teks kecil di background
terang, pilih `#7D5945` atau warna teks utama jika `#B98B6A` tidak
memenuhi kontras.

## 4. Theme tokens

Gunakan token semantik dan sistem theme yang sudah ada. Jangan menulis
HEX berulang di setiap komponen bila bisa memakai token global.

### Light mode

  Token                          Nilai
  ------------------------------ --------------------------
  `--color-bg`                   `#F2EEE8`
  `--color-bg-subtle`            `#E5E8E2`
  `--color-surface`              `#FCFBF8`
  `--color-surface-raised`       `#FFFFFF`
  `--color-primary`              `#4B5A52`
  `--color-primary-hover`        `#39443E`
  `--color-primary-active`       `#2C332F`
  `--color-primary-foreground`   `#FFFFFF`
  `--color-text`                 `#2B312E`
  `--color-text-secondary`       `#59635C`
  `--color-text-muted`           `#6B746E`
  `--color-border`               `#D7D8D2`
  `--color-border-strong`        `#BFC5BD`
  `--color-accent`               `#B98B6A`
  `--color-accent-strong`        `#7D5945`
  `--color-focus`                `#7D5945`
  `--color-overlay`              `rgba(29, 35, 32, 0.48)`

### Dark mode

Dark mode harus hijau-abu gelap dan hangat, bukan hitam pekat.

  Token                          Nilai
  ------------------------------ -----------------------
  `--color-bg`                   `#1D2320`
  `--color-bg-subtle`            `#252D29`
  `--color-surface`              `#2C332F`
  `--color-surface-raised`       `#343D37`
  `--color-primary`              `#B98B6A`
  `--color-primary-hover`        `#CB9D7F`
  `--color-primary-active`       `#D8B8A1`
  `--color-primary-foreground`   `#1D2320`
  `--color-text`                 `#F4EFE8`
  `--color-text-secondary`       `#D3D7D2`
  `--color-text-muted`           `#A7B0A9`
  `--color-border`               `#3A443F`
  `--color-border-strong`        `#56635A`
  `--color-accent`               `#D8B8A1`
  `--color-accent-strong`        `#E5C8B4`
  `--color-focus`                `#D8B8A1`
  `--color-overlay`              `rgba(0, 0, 0, 0.60)`

Pada dark mode, gunakan copper untuk tombol utama dengan teks gelap.
Jangan gunakan copper terang sebagai teks kecil pada background linen.

### Contoh CSS tokens

``` css
:root {
  color-scheme: light;
  --kd-forest: #4B5A52;
  --kd-moss-deep: #39443E;
  --kd-linen: #F2EEE8;
  --kd-mist: #E5E8E2;
  --kd-copper: #B98B6A;
  --kd-copper-soft: #D8B8A1;
  --kd-charcoal: #2B312E;
  --kd-moss-gray: #6B746E;
  --kd-stone: #D7D8D2;
  --kd-white: #FCFBF8;

  --color-bg: var(--kd-linen);
  --color-bg-subtle: var(--kd-mist);
  --color-surface: var(--kd-white);
  --color-primary: var(--kd-forest);
  --color-primary-hover: var(--kd-moss-deep);
  --color-primary-foreground: #FFFFFF;
  --color-text: var(--kd-charcoal);
  --color-text-secondary: #59635C;
  --color-text-muted: var(--kd-moss-gray);
  --color-border: var(--kd-stone);
  --color-accent: var(--kd-copper);
}

[data-theme="dark"],
.dark {
  color-scheme: dark;
  --color-bg: #1D2320;
  --color-bg-subtle: #252D29;
  --color-surface: #2C332F;
  --color-surface-raised: #343D37;
  --color-primary: #B98B6A;
  --color-primary-hover: #CB9D7F;
  --color-primary-foreground: #1D2320;
  --color-text: #F4EFE8;
  --color-text-secondary: #D3D7D2;
  --color-text-muted: #A7B0A9;
  --color-border: #3A443F;
  --color-accent: #D8B8A1;
}
```

Sesuaikan selector dark mode dengan implementasi yang sudah ada. Jangan
menambah theme toggle baru jika project sudah memiliki kontrol tema.

## 5. Tipografi

### Font utama

-   **Fraunces:** headline/display dan judul editorial.
-   **Manrope:** UI, body text, navigasi, tombol, form, tabel, angka,
    label, dan dashboard.
-   **Logo:** gunakan aset logo Kenang Dulu yang disetujui. Bodoni XT
    dapat menjadi referensi wordmark; pastikan lisensi sesuai untuk
    penggunaan komersial. Logo final sebaiknya berupa SVG dengan huruf
    yang sudah menjadi outline/path agar konsisten di semua perangkat.

### Font roles

  --------------------------------------------------------------------------
  Peran              Font                            Weight Catatan
  ------------------ ---------------- --------------------- ----------------
  Wordmark           Aset logo final            Sesuai logo Jangan mengganti
                                                            aset dengan teks
                                                            biasa jika logo
                                                            tersedia

  Hero headline      Fraunces                      500--600 Editorial,
                                                            besar, tidak
                                                            terlalu
                                                            dekoratif

  Page title         Fraunces                      500--600 Jelas dan
                                                            berkarakter

  Section heading    Fraunces                      500--600 Gunakan secara
                                                            terukur

  Card heading       Manrope                       600--700 UI yang ringkas

  Body text          Manrope                            400 Paragraf dan
                                                            instruksi

  Navigation         Manrope                       500--600 Mudah dipindai

  Button             Manrope                            600 Label jelas

  Form label         Manrope                            600 Mudah dibaca

  Helper text        Manrope                       400--500 Kecil tetapi
                                                            tetap kontras

  Eyebrow/overline   Manrope                            600 Tracking ringan

  Table/data/price   Manrope                       500--700 Fokus
                                                            keterbacaan

  Tagline brand      Manrope                            500 Boleh uppercase
                                                            dan tracking
                                                            lega
  --------------------------------------------------------------------------

### Type scale

  Token        Ukuran
  ------------ --------------------------------------------
  Display      `clamp(2.75rem, 5.5vw, 4.75rem)`
  H1           `clamp(2.25rem, 4vw, 3.5rem)`
  H2           `clamp(1.75rem, 3vw, 2.5rem)`
  H3           `1.5rem` desktop / `1.375rem` mobile
  H4           `1.25rem` desktop / `1.125rem` mobile
  Body large   `1.125rem` desktop / `1rem` mobile
  Body         `1rem`
  Body small   `0.875rem`
  Caption      `0.75rem`, hanya untuk informasi pendukung

### Line-height dan spacing

-   Display/headline: `1.08–1.18`.
-   Heading UI: `1.25–1.4`.
-   Body: `1.55–1.7`.
-   Button/navigation: `1.2–1.4`.
-   Tagline uppercase: `letter-spacing: 0.12em–0.20em`, sesuaikan
    panjang teks.
-   Hindari body text dengan tracking lebar atau weight 300 untuk teks
    UI kecil.
-   Jangan memakai serif dekoratif untuk tabel, form, label data padat,
    atau navigasi.

### Contoh pemuatan font

``` css
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Manrope:wght@400;500;600;700&display=swap');

:root {
  --font-display: "Fraunces", Georgia, serif;
  --font-ui: "Manrope", "Segoe UI", sans-serif;
}

body,
button,
input,
select,
textarea {
  font-family: var(--font-ui);
}

h1,
.hero-title,
.editorial-heading {
  font-family: var(--font-display);
  font-weight: 500;
  letter-spacing: -0.025em;
}
```

Gunakan import ini hanya jika sesuai dengan kebijakan jaringan/CSP
project. Jika project memakai font lokal atau self-hosted, pertahankan
cara yang ada. Jangan sampai font gagal dimuat merusak layout.

## 6. Layout, spacing, radius, dan shadow

Prinsip visual: ruang kosong lega, hierarki jelas, garis tipis, dekorasi
terbatas, dan foto pengguna sebagai fokus. Gunakan grid dan breakpoint
yang sudah ada; jangan mengubah struktur halaman hanya untuk mengikuti
mockup.

### Spacing scale

  Token            Nilai Contoh
  -------------- ------- -------------------------
  `--space-1`        4px Jarak ikon kecil
  `--space-2`        8px Jarak kontrol
  `--space-3`       12px Field/helper text
  `--space-4`       16px Padding standar
  `--space-5`       20px Antar elemen
  `--space-6`       24px Padding card
  `--space-8`       32px Antar kelompok
  `--space-10`      40px Jarak section
  `--space-12`      48px Section spacing
  `--space-16`      64px Antar section marketing

### Radius dan shadow

  ----------------------------------------------------------------------------------
  Token                   Nilai                              Penggunaan
  ----------------------- ---------------------------------- -----------------------
  `--radius-sm`           6px                                Badge/input kecil

  `--radius-md`           10px                               Button dan input

  `--radius-lg`           14px                               Card

  `--radius-xl`           20px                               Panel besar

  `--radius-pill`         999px                              Chip/tombol pill jika
                                                             sesuai

  `--shadow-sm`           `0 1px 2px rgba(29,35,32,.05)`     Shadow sangat halus

  `--shadow-md`           `0 8px 24px rgba(29,35,32,.08)`    Popover/dialog

  `--shadow-lg`           `0 16px 40px rgba(29,35,32,.12)`   Overlay penting, secara
                                                             terbatas
  ----------------------------------------------------------------------------------

Hindari shadow kuat, glow, bevel, emboss, dan efek 3D.

## 7. Aturan komponen

### Buttons

-   Light mode primary: Forest Slate `#4B5A52`, teks putih; hover Deep
    Moss `#39443E`.
-   Dark mode primary: Muted Copper `#B98B6A`, teks gelap `#1D2320`.
-   Secondary: Soft Mist/surface dengan teks Charcoal Olive.
-   Ghost: transparan, hover dengan surface halus.
-   Pertahankan label, action, loading, disabled, submit, focus, dan
    click behavior.

### Form controls

-   Gunakan surface yang jelas, border tipis, focus ring yang terlihat.
-   Pertahankan validasi, mask, value, name, event handler, error,
    disabled, dan required states.
-   Jangan mengubah urutan field atau submit flow.

### Cards/panels

-   Light: Warm White di atas Fog Linen.
-   Dark: `#2C332F` di atas `#1D2320`.
-   Gunakan border/shadow secukupnya; jangan membungkus setiap elemen
    dalam card.

### Navigation/sidebar

-   Pertahankan route, urutan, label, dan permission.
-   Gunakan primary untuk active state; active state tetap perlu
    dibedakan selain warna saja.
-   Hover harus lembut dan kontras tetap cukup.

### Dialog/dropdown/popover/toast

-   Surface raised, border halus, radius konsisten.
-   Pertahankan z-index, focus trap, Escape, outside click, keyboard
    navigation, dan dismissal behavior.
-   Jangan mengubah kapan komponen muncul atau menghilang.

### Badge/chip/tabs

-   Warna netral untuk status umum; primary untuk active/selected.
-   Jangan menghilangkan perbedaan success, warning, error, dan info.
-   Pertahankan wrap dan ukuran mobile.

### Tables/data

-   Manrope, border tipis, row spacing rapi, hover lembut.
-   Jangan mengubah sorting, pagination, filter, urutan kolom, atau
    interaksi tabel.

### Photo/gallery/media

-   Foto pengguna menjadi fokus; jangan memberi filter warna global pada
    foto.
-   Pertahankan rasio, crop, preview, play, download, zoom, selection,
    dan akses media.
-   Jangan menambahkan overlay yang mengurangi kualitas gambar.

### Loading/empty/error/success

-   Gunakan token theme yang sama.
-   Pertahankan ilustrasi, pesan, retry action, skeleton, dan state
    transition.
-   Jangan menyembunyikan error demi estetika.

## 8. Dark mode dan interaksi

-   Pertahankan theme mechanism yang sudah ada.
-   Semua background, surface, text, border, input, dialog, table,
    tooltip, disabled, hover, dan focus states harus mengikuti theme
    aktif.
-   Hindari hardcoded colors di komponen bila dapat memakai token
    semantik.
-   Jangan mengubah warna foto/media.
-   Transisi visual ringan dapat memakai `150–220ms`; jangan menambah
    animasi dekoratif besar.
-   Hormati `prefers-reduced-motion`.
-   Jangan menambah toggle theme jika belum ada.

## 9. Aksesibilitas

-   Targetkan WCAG AA: kontras 4.5:1 untuk teks normal dan 3:1 untuk
    teks besar serta batas/kontrol visual yang relevan.
-   Jangan memakai Muted Copper `#B98B6A` untuk teks kecil di atas Fog
    Linen tanpa pengecekan kontras; gunakan `#7D5945` atau warna teks
    utama.
-   Jangan mengandalkan warna saja untuk error, success, active, atau
    status penting.
-   Pertahankan semantic HTML, label form, accessible name, alt text,
    keyboard support, dan focus ring.
-   Jangan menghapus outline tanpa pengganti yang jelas.
-   Pastikan zoom dan pembesaran teks tidak memotong konten.

## 10. Logo dan aset brand

-   Gunakan aset logo Kenang Dulu yang sudah disetujui.
-   Logo utama: ikon album/foto dengan siluet K--D, wordmark serif, dan
    palet Heritage Moss.
-   Light mode: Forest Slate/Deep Moss dengan aksen Muted Copper di atas
    Fog Linen/Warm White.
-   Dark mode: elemen logo Fog Linen atau warna terang dengan aksen
    copper.
-   Jangan meregangkan logo, mengubah proporsi, menambahkan 3D, glow,
    gradient berlebihan, atau shadow kuat.
-   Berikan ruang kosong di sekitar logo.
-   Untuk ukuran kecil, gunakan simbol saja jika wordmark/tagline tidak
    terbaca.
-   Tagline tidak wajib muncul di setiap penggunaan logo; gunakan lockup
    tagline saat ruang cukup.

## 11. Do / Don't

### Do

-   Gunakan Forest Slate dan Fog Linen sebagai fondasi.
-   Gunakan copper dengan hemat.
-   Gunakan Fraunces untuk headline dan Manrope untuk UI.
-   Jaga whitespace, hirarki, radius, dan jarak.
-   Periksa desktop, tablet, dan mobile.
-   Gunakan token semantik untuk kedua theme.

### Don't

-   Jangan sisakan warna Komukuna sebagai primary/secondary brand.
-   Jangan memakai banyak warna aksen dalam satu layar.
-   Jangan memakai copper terang untuk teks kecil dengan kontras rendah.
-   Jangan memakai serif dekoratif di form/tabel/dashboard padat.
-   Jangan menambah gradient kuat, tekstur, 3D, glow, atau ornamen
    berlebihan.
-   Jangan mengubah perilaku komponen demi mengikuti mockup.
-   Jangan menghapus fitur, route, tombol, field, validasi, atau state.

## 12. Instruksi implementasi

1.  Periksa sistem styling/theme yang sudah digunakan project.
2.  Temukan token warna Komukuna, termasuk HEX hardcoded di komponen dan
    stylesheet.
3.  Buat/perbarui token global berdasarkan bagian 3--4.
4.  Ganti warna brand lama pada UI dengan token Kenang Dulu; pertahankan
    warna status semantik yang diperlukan.
5.  Terapkan Fraunces dan Manrope sesuai bagian 5 tanpa merusak layout.
6.  Terapkan token ke komponen yang sudah ada: page shell, nav/sidebar,
    button, form, card, modal, dropdown, table, badge, toast, gallery,
    dan seluruh state UI.
7.  Pastikan light/dark mode memakai theme mechanism yang sudah ada.
8.  Periksa desktop dan mobile; perbaiki hanya masalah visual yang
    timbul.
9.  Jalankan pemeriksaan ringan yang sesuai workflow project untuk
    mendeteksi error relevan. Jangan menambah rangkaian test berat tanpa
    kebutuhan.
10. Laporkan file yang berubah dan konfirmasikan bahwa tidak ada
    perubahan fungsi, API, database, route, atau business logic.

### Batas scope

**Termasuk:** warna, font, typography scale, spacing visual, border,
radius, shadow, hover/focus states, responsive styling, light/dark mode.

**Tidak termasuk:** fitur baru/penghapusan fitur, business logic, flow,
data, database schema, API, autentikasi, otorisasi, integrasi, validasi,
dan perubahan perilaku.

Jika dokumen ini bertentangan dengan kebutuhan fungsi yang sudah
berjalan, pertahankan fungsi yang ada dan cari solusi visual alternatif.

## 13. Acceptance checklist

### Brand

-   [ ] Warna Komukuna tidak lagi menjadi warna brand utama/sekunder
    pada UI yang diperbarui.
-   [ ] Heritage Moss digunakan melalui token yang konsisten.
-   [ ] Forest Slate, Fog Linen, dan Muted Copper digunakan sesuai
    peran.
-   [ ] Tidak ada dekorasi/gradient berlebihan.

### Typography

-   [ ] Fraunces digunakan untuk headline/editorial.
-   [ ] Manrope digunakan untuk UI, body, button, form, nav, dan data.
-   [ ] Hierarki heading/body jelas.
-   [ ] Font fallback tidak merusak layout.
-   [ ] Aset logo digunakan bila tersedia.

### Themes/responsive

-   [ ] Light mode konsisten.
-   [ ] Dark mode konsisten.
-   [ ] Form, modal, dropdown, table, toast, tooltip, dan semua state
    terbaca.
-   [ ] Tidak ada horizontal overflow akibat styling.
-   [ ] Keyboard focus dan kontras dapat digunakan.

### Functional preservation

-   [ ] Semua route/navigasi tetap bekerja.
-   [ ] Semua tombol/interaksi tetap bekerja.
-   [ ] Form, validasi, dan submit flow tidak berubah.
-   [ ] Tidak ada perubahan API, database, auth, permission, atau
    business logic.
-   [ ] Loading, empty, error, dan success states tetap tersedia.
-   [ ] Tidak ada fitur yang dihapus/disembunyikan.

------------------------------------------------------------------------

**Ringkasan final:** Kenang Dulu menggunakan **Heritage Moss**: Forest
Slate `#4B5A52`, Deep Moss `#39443E`, Fog Linen `#F2EEE8`, Soft Mist
`#E5E8E2`, Muted Copper `#B98B6A`, dengan **Fraunces + Manrope**.
Terapkan sebagai pembaruan visual saja; seluruh fungsi existing wajib
tetap utuh.

## 14. Status implementasi — 24 Oktober 2026

Audit kode menemukan bahwa implementasi sebelumnya baru mencakup beranda
dan sebagian admin. Styling global, halaman tamu, portal pelanggan/vendor,
dan mode personal masih menggunakan palet serta font lama.

Sudah dilengkapi pada kode:

- Token Heritage Moss global beserta skala warna, spacing, radius, shadow,
  dan tipografi di `src/app/heritage-tokens.css`.
- Fraunces untuk judul/editorial dan Manrope untuk UI, menggunakan font
  lokal yang sudah tersedia tanpa dependency atau layanan font baru.
- Palet bersama untuk halaman publik, autentikasi, checkout, workspace,
  admin, personal, tamu, galeri, album pengantin, live wall, serta state UI.
- Mode terang/gelap mengikuti mekanisme `data-guest-theme` yang sudah ada;
  selector `.dark` dan `data-theme="dark"` tetap didukung tanpa toggle baru.
- Kontrol form, tombol, border, fokus keyboard, tabel, badge, dialog,
  pesan error, dan reduced motion menggunakan token yang konsisten.
- Import stylesheet dipusatkan di root layout agar urutannya konsisten
  saat berpindah halaman.
- Identitas Kenang Dulu pada wordmark, header/footer, dan judul browser.
  Aset logo final SVG yang disetujui belum ditemukan di repository;
  wordmark/ikon existing dipertahankan sebagai representasi sementara.

Perbaikan kontras yang diperiksa secara numerik:

| Pasangan warna | Rasio setelah perbaikan |
| --- | --- |
| Helper light di atas linen | 5,40:1 |
| Teks interaktif dark di atas raised surface | 7,09:1 |
| Label tombol primary dark | 5,30:1 |
| Border input light / dark terhadap surface input | 3,58:1 / 3,30:1 |

Token `--color-text-muted` dan `--color-primary` tetap mengikuti spesifikasi.
Untuk teks kecil, gunakan secondary text dan `--color-interactive-text`
agar kontrasnya cukup pada surface terkait.

Route, API, database, auth, permission, validasi, state, serta alur submit
tidak diubah. Pilihan tema acara, warna frame/overlay dari data pengguna,
dan hasil media tetap dipertahankan. Font artwork frame lama dipertahankan
secara khusus agar preview artwork tidak ikut berganti font UI.

Belum diverifikasi melalui browser: seluruh ukuran layar, zoom, rendering
font fallback, dan interaksi end-to-end pada semua halaman. Checklist
acceptance di atas bukan laporan hasil tes. Tidak menjalankan build,
lint, typecheck, suite/E2E, atau deploy, sesuai preferensi pengguna.
