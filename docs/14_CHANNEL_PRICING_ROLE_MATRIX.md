# CHANNEL, PACKAGING & ROLE/ENTITLEMENTS MATRIX — v2
**Sumber kebenaran untuk SKU, alur penjualan, kuota, role dan hak edit. Harga dan limit awal adalah hipotesis internal yang editable oleh admin.**

## A. Dua kanal penjualan (jangan dicampur)
### A1. `DIRECT_MANAGED` — Pembeli sendiri / calon mempelai
- Calon mempelai melihat landing, demo, harga, membeli paket, mengisi brief event (nama, tanggal, lokasi opsional, kontak, tema/warna bila paket mendukung), mengunggah referensi/asset, bukti pembayaran, melihat status.
- **Pekerjaan editing ada di platform admin/Komukuna operator**, bukan pelanggan. Halaman pelanggan berisi `Order Saya`, `Kirim Bahan`, `Preview`, `Minta Revisi`, `Setujui Preview`, `Galeri`, `Unduh`, `Dukungan`, bukan editor frame atau Advanced Settings.
- Mini Rp99rb: customer bahkan **tidak ditawari pilihan frame**; form hanya identitas event dan preferensi teks/foto cover sederhana. Operator memakai desain standar/event theme yang ditetapkan platform. No paid custom frame.
- Pihak internal dapat berperan sebagai `platform_fulfillment_admin`/`designer` dan punya work queue: New → Awaiting Payment → Paid → Needs Assets → In Design → Preview Ready → Revision Requested → Approved → Scheduled/Live → Complete.
- Revisi paket dibatasi lewat `revision_entitlement` (usulan Mini 0, Classic 1, Celebration 2, Signature 3); perubahan copy/data yang salah akibat kesalahan operator tidak dihitung revisi berbayar.
- Approve preview bukan persetujuan biaya tambahan; upsell add-on selalu perlu konfirmasi eksplisit.

### A2. `PARTNER_SELF_SERVICE` — WO / vendor / EO / fotografer
- Partner login, onboarding organisasi, mengisi brand, membeli event credit atau paket per event, membuat event dan **mengedit sendiri** tema, frame, layout, mode, QR, guest access, moderasi dan galeri sesuai entitlements.
- Partner tidak boleh edit template global Komukuna, harga platform, data tenant lain, atau mengubah kuota via devtools. Source of truth ada di server.
- Partner boleh assign operator dan client gallery viewers per event; tidak otomatis memiliki role global superadmin.
- B2B harga reseller wholesale/diskon tetap `configurable` dan `UNDECIDED`, bukan otomatis sama dengan tarif direct. Untuk demo, tampilkan harga retail sebagai referensi dan opsi **Hubungi Admin untuk Harga Mitra** bila aturan wholesale belum diisi; jangan munculkan nominal sembarang.
- Direct dan partner memakai engine capture, media, billing, plan entitlements yang sama; **perbedaan UI berasal dari channel + permission**, bukan menduplikasi backend.

## B. Matriks paket retail — starting offer, user-facing plan descriptors
| SKU | Mini Memories | Classic Photo | Celebration | Signature |
|---|---:|---:|---:|---:|
| Harga/event | **Rp99.000** | Rp150.000 | Rp299.000 | Rp499.000 |
| Frame/strip | **TIDAK ADA** | 1 frame/strip | 3 frame/strip | 6 frame/strip |
| Disposable per guest | **15** | 15 | 24 | 36 |
| Identitas disposable max | 30 | 50 | 100 | 200 |
| Total saved photo outputs per event | 450 | 800 | 2.000 | 5.000 |
| Voice max / durasi | 50 × 30s | 100 × 30s | 300 × 45s | 800 × 60s |
| Video wishes max / durasi | **10 × 15s** | 20 × 15s | 50 × 30s | 120 × 30s |
| Notes teks max | 200 | 500 | 1.000 | 3.000 |
| Limit bytes total | 2 GiB | 4 GiB | 12 GiB | 35 GiB |
| Live slideshow | Tidak | Ya | Ya | Ya |
| Film reveal | Ya | Ya | Ya | Ya |
| Photo filters | 4 film style | 6 style | 10 style | Full curated set |
| Video/GIF creative mode | Video wishes only | Video wishes only | Boomerang/GIF | Boomerang/GIF |
| Memory Book | Tidak | Tidak | Template book | Enhanced book |
| Masa submit sesudah event | H+2 | H+3 | H+7 | H+14 |
| Guest gallery access | 30 hari | 60 hari | 90 hari | 90 hari |
| Owner export window | 90 hari | 90 hari | 90 hari | 90 hari |
| Direct managed revisions | 0 | 1 | 2 | 3 |
| QR export | PNG/SVG | PNG/SVG | PNG/SVG/PDF | PNG/SVG/PDF |

**PENTING: "15 foto" = 15 jepretan tersimpan untuk SETIAP tamu teridentifikasi, bukan 15 total event.** Maksimal 30 identitas pada Mini. Semua foto di seluruh mode tunduk `photo_outputs_total` (450 pada Mini), jadi tidak ada perhitungan foto ganda. Video/voice mengonsumsi kuota masing-masing **dan** storage bytes. Notes teks harus dimoderasi/sanitized.

**Kondisi identitas:** bila event `public_unverified`, batas 15 hanya per sesi/perangkat dan **tidak boleh dipromosikan sebagai anti-reset ketat**; untuk jaminan per tamu, gunakan kode undangan/OTP (opsional karena ongkos dan privasi). Admin memilih mode identitas, dan UX harus menyatakan keterbatasannya.

**Mini no-frame behavior**:
- Tidak tampil tab Photo Strip, frame picker, watermark frame, editor, template picker, frame thumbnail di menu tamu maupun form pemesanan.
- Di guest UI hanya `Kamera 15 Foto`, `Pesan Suara`, `Kirim Video`, `Tulis Ucapan`, `Galeri` (jika enabled) — semuanya template gaya netral bawaan, bukan custom frame.
- Kamera dapat memiliki preset color film 4 pilihan, timestamp dan counter; tidak diberi layer dekoratif frame/strip.
- Admin dapat mengganti headline/cover/color theme Mini sebatas preset, bukan membuat custom frame sebagai layanan gratis. Bila pelanggan butuh frame, upgrade ke Classic.

## C. Hak edit — matriks permission
| Aksi | Direct purchaser | Platform admin/designer | Partner owner/admin | Partner operator | Invited client | Guest |
|---|---|---|---|---|---|---|
| Buat order | Ya | Ya | Ya | Tidak | Tidak | Tidak |
| Buat/publish event | Tidak | Ya | Ya untuk event dibayar | Operator jika delegated | Tidak | Tidak |
| Edit frame/tema | Tidak | Ya sesuai plan | Ya sesuai plan | Jika delegated | Tidak | Tidak |
| Edit settings event | Tidak | Ya | Ya | Subset jika delegated | Tidak | Tidak |
| Lihat preview | Ya event milik sendiri | Ya | Ya | Ya assigned | Ya assigned | Preview publik saja |
| Request revision | Ya | Review/fulfill | Ya internal | Opsional | Terbatas | Tidak |
| Aktifkan event tanpa payment | Tidak | Hanya override dengan alasan audit | Tidak | Tidak | Tidak | Tidak |
| Moderasi media | Jika assigned by policy | Ya | Ya | Jika delegated | Opsional preview | Tidak |
| Download private media | Ya event sendiri | Ya beralasan/izin | Ya dalam tenant | Sesuai scope | Sesuai izin | Hanya yang published |
| Kelola harga, tenant, token global | Tidak | Ya (superadmin) | Tidak | Tidak | Tidak | Tidak |

Teknis: channel melekat pada `orders.sales_channel`; ownership/managing actor melekat pada `events.managing_organization_id` + `events.customer_account_id`; jangan menyamakan customer account dengan owner tenant. `organization_type` (`platform`, `partner`) dan event memberships harus enforced di DB/API.

## D. Order & fulfillment state
`draft -> awaiting_payment -> payment_review -> paid -> assets_requested -> in_preparation -> preview_ready -> revision_requested -> client_approved -> scheduled -> live -> closed`; optional path langsung dari `paid` ke `preview_ready` untuk Mini yang templatized. Event `draft/scheduled/live/closed` adalah lifecycle terpisah dari order fulfillment; jangan satu enum untuk semua.

## E. Billing guards & upgrade
- Price/entitlements snapshot pada order dan event. Revisi harga katalog tidak mengubah order sudah dibayar.
- Cash/payment proof diverifikasi manual awal; double approval idempotent dan audit.
- Tidak boleh otomatis mengirim SMS/WA atau mengenakan charge tanpa approval user.
- Partner kredit wajib reserved/redeemed transactionally bila dipakai, refund/pembatalan diaudit.
- Expired/timezone `Asia/Jakarta` default, tetapi `events.timezone` bisa berbeda.
- Setiap SKU backend-configurable; UI harus membaca dari DB, bukan hardcode 99k hanya dalam frontend.
