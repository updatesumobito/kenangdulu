# Komukuna Booth Album --- Color Palette

Palet ini diambil dari referensi backdrop dengan tirai **burgundy merah
tua**, kain **olive gelap**, dan aksen **ivory hangat**. Nilai warna
disesuaikan sedikit agar tetap nyaman dipakai pada antarmuka web.

## 1. Palet Utama

  -----------------------------------------------------------------------
  Nama warna              HEX                     Peran warna
  ----------------------- ----------------------- -----------------------
  Stage Black Olive       `#150F03`               Latar utama paling
                                                  gelap

  Deep Olive Shadow       `#1B1C06`               Latar panel dan area
                                                  navigasi

  Drapery Olive           `#2A2B0F`               Olive utama dari tirai

  Olive Fold              `#38371C`               Permukaan sekunder

  Muted Olive             `#4C4A2C`               Border, divider, dan
                                                  elemen nonaktif

  Sage Olive              `#686D42`               Aksen olive yang lebih
                                                  terlihat

  Moss Highlight          `#97A069`               Aksen kecil atau hover
                                                  olive

  Burgundy Black          `#270202`               Burgundy paling gelap

  Deep Burgundy           `#41050A`               Burgundy untuk state
                                                  pressed

  Curtain Burgundy        `#560B14`               Burgundy utama

  Burgundy Fold           `#6F1621`               Hover dan aksen
                                                  burgundy terang

  Warm Ivory              `#FAF4E8`               Teks utama di atas
                                                  latar gelap

  Soft Cream              `#EBE6D9`               Latar terang alternatif
                                                  atau teks sekunder

  Champagne Beige         `#D7C5AB`               Aksen hangat, ikon, dan
                                                  detail dekoratif

  Floral Wine             `#662117`               Aksen merah bunga yang
                                                  redup
  -----------------------------------------------------------------------

## 2. Design Tokens

``` css
:root {
  /* Background */
  --color-background: #150F03;
  --color-background-secondary: #1B1C06;
  --color-surface: #2A2B0F;
  --color-surface-elevated: #38371C;

  /* Brand */
  --color-primary: #560B14;
  --color-primary-hover: #6F1621;
  --color-primary-pressed: #41050A;
  --color-primary-deep: #270202;

  /* Olive accents */
  --color-secondary: #686D42;
  --color-secondary-hover: #97A069;
  --color-border: #4C4A2C;

  /* Text */
  --color-text-primary: #FAF4E8;
  --color-text-secondary: #EBE6D9;
  --color-text-muted: #C4C0A7;

  /* Decorative accents */
  --color-accent-warm: #D7C5AB;
  --color-accent-floral: #662117;
}
```

## 3. Penerapan Warna

  Elemen web album            Warna
  --------------------------- -----------
  Latar halaman utama         `#150F03`
  Navigasi dan panel          `#1B1C06`
  Kartu album / permukaan     `#2A2B0F`
  Border dan pemisah          `#4C4A2C`
  Tombol utama / CTA          `#560B14`
  Hover tombol utama          `#6F1621`
  Teks utama                  `#FAF4E8`
  Teks sekunder               `#EBE6D9`
  Teks redup                  `#C4C0A7`
  Ikon dan detail dekoratif   `#D7C5AB`
  Aksen olive                 `#686D42`
  Aksen olive saat hover      `#97A069`

## 4. Aturan Penggunaan Warna

-   Gunakan **olive gelap** sebagai identitas pendamping dan
    **burgundy** sebagai aksen utama agar nuansa backdrop tetap terasa.
-   Gunakan `#FAF4E8` untuk teks utama di atas latar gelap; hindari teks
    burgundy gelap di atas latar gelap.
-   Gunakan champagne beige secukupnya untuk ikon atau detail penting,
    bukan sebagai warna dominan.
-   Jangan memakai burgundy, olive, dan beige dengan intensitas yang
    sama pada satu area. Utamakan latar gelap, teks ivory, lalu satu
    aksen utama.
-   Untuk area konten foto, biarkan warna foto tetap dominan; gunakan
    bingkai dan kontrol antarmuka dengan warna palet ini.
