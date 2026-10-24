> Reconciliation 24 October 2026: current implementation and actual verification are in [PRD execution](implementation/PRD_EXECUTION_2026-10-24.md) and its requirement/parity matrices. The latest user instructions override older routine testing/build requirements; design (3).md governs platform visuals, with the wahyu-novita exception. Historical requirements and test evidence below are not a new PASS claim.

# DESIGN.md — KOMUKUNA VIRTUAL 2.0
**UI/UX contract v2 | BOOKING is mandatory verified source, wedding fallback provisional**

## V2 essential differences
- There are **two visibly different dashboards**: **Direct Client Portal** with status, asset upload, preview, revision request, QR/gallery only (NO frame/theme/event settings editor), and **Vendor/WO Workspace** with self-edit builder, frame studio, admin-like management for assigned events. The internal **Komukuna Fulfillment Console** handles all direct buyer editing and approvals.
- **Mini Rp99.000 NO FRAME**: no photo strip, no frame picker, no editor links in marketing checkout, buyer form or guest camera, no huge decorative frame in camera UI. Use a minimalist disposable camera shell (shutter, guest shot counter, four film looks). Guest home entry buttons are `Kamera 15 Foto`, `Pesan Suara`, `Kirim Video`, `Tulis Ucapan`, `Galeri`. Every menu should function; avoid visual clutter.
- Direct checkout includes a compare-card for 4 SKUs and explicit copy "Kami bantu siapkan halaman acara Anda"; vendor CTA says "Kelola & desain event sendiri". Do not claim all buyers can self-edit.
- Client portal tasks: `Kirim Bahan` `Lihat Preview` `Minta Revisi` `Setujui Tampilan` `Unduh QR`; show meaningful states, due date/time, and revision quota. No settings sidebar.
- Vendor portal tasks: `Buat Event` `Edit Tema` `Frame Studio`(Classic+) `Atur Kamera` `Kelola Tamu` `Live Galeri` `QR Kit` `Ekspor`; Mini hides and forbids Frame Studio. Accessible role-based menus.
- Admin fulfillment board: paid orders, priority/time-to-event, assigned designer, preview approval, payment reconciliation, event status. Public platform admin separate from event operator.
- **Mobile guest performance**: SSR HTML shell no mandatory client chart/editor, static event cover optimized, camera/voice/video chunks loaded only after user enters that mode. Sticky accessible main CTA; no obstructive ornaments on capture preview.
- **BOOKING-derived platform design** has precedence over provisional wedding palette. The maroon/ivory wedding styling is only an event theme candidate. Do not blindly copy a JADENSA or Mokabooth brand palette.
- Keep 44x44 tap targets, min 16px input text, `prefers-reduced-motion`, actual contrast checks AA, loading skeletons, offline/failure/retry states, minimum supported width 360px, iPhone safe areas.

## V2 screen inventory (must implement)
Marketing: Home, Pricing, Features, Demo, Vendor Landing, Legal.
Direct customer: purchase wizard, payment proof, dashboard orders, event detail, asset requests, preview, revision, approve, QR, gallery/export.
Vendor/WO: onboarding/login, org/dashboard, events list, create wizard, frame builder (eligible), theme settings, guest config, live wall, media/moderation, analytics, billing and roles.
Platform admin: payments, order fulfillment, designer queue, catalog editor, partner management, global audit, media report/incident, storage/worker health.
Guest: welcome, disposable, photo strip eligible, voice, video, notes/wishes, gallery, result, share; public display screen only eligible.

## Theme/document provenance
The CSS fallback palette `#F9F6F0` ivory / `#6A0C12` wine is **not confirmed BOOKING palette**. Agent extracts true values with file path and line evidence; replace provisional semantic tokens after audit. Visual screenshot comparisons and style acceptance required.

---

## TECHNICAL REFERENCE (v1 details; use only where consistent with v2)

# DESIGN.md — KOMUKUNA VIRTUAL UI/UX & DESIGN SYSTEM
**Design system v1.0 | Default editorial light | Mobile guest first | Status: PENDING BOOKING SOURCE AUDIT**

## 0. Mandatory design source policy
**PENTING:** Semua brand token *final* untuk admin/marketing harus didapat dari `C:\Users\user\Music\BOOKING` (alias `KomukunaBooking`). Agent **harus membaca** file seperti `design.md`, `globals.css`, `tailwind.config.*`, `app/layout.*`, `components/ui`, style variables, font loaders, aset logo, contoh halaman nyata, dan screenshot lokal bila ada. Jangan menyatakan fallback di bawah sebagai warna BOOKING yang pasti. Tulis `docs/audit/BOOKING_DESIGN_EXTRACTION.md` lengkap: token/HEX asli + source path:line, font, radius, shadow, button/card/input/nav, responsive. Bawa design language BOOKING **tanpa** mengimpor dependency booking bisnis yang tidak relevan. Jangan edit repo BOOKING.

Acuan terpisah yang pernah disusun untuk **galeri Komukuna** memakai tema *Maroon Romance / Elegant Editorial Wedding*: `#F9F6F0` ivory, `#FFFDFC` surface, `#391716` ink, `#6A0C12` primary maroon, `#711820` hover, `#E3D6C8` border, `#520305` hero, `#D9BC8E` champagne; font Cormorant Garamond/DM Sans. Itu **tema galeri wedding**, bukan verifikasi identitas global BOOKING. Jika desain BOOKING berbeda, **BOOKING menang** untuk shell platform; tema maroon boleh tetap tersedia sebagai template wedding opsional.

## 1. Prinsip estetika
1. **Elegant, editorial, modern & professional:** bukan gamified yang ramai; foto dan momen menjadi pusat.
2. **Readable and breathable:** background terang, whitespace, elemen form kontras, alur cepat.
3. **Camera-first:** UI kamera mendapat area layar maksimal, akses tombol dapat dijangkau ibu jari.
4. **Compositional consistency:** shell marketing/admin mengikuti BOOKING; identitas event mengikuti tema pilihan klien.
5. **No decoration overload:** maksimal 1 motif dekoratif utama per section; hindari gradient tajam, gold metalik, shadow berat, ikon dekoratif setiap card.
6. **User-controlled motion:** transisi halus, 150–220 ms; hormati `prefers-reduced-motion`; animasi countdown jelas.
7. **Never distort photos:** preview photostrip pakai contain; komposisi slot dirender sesuai crop yang disetujui; hasil HD tidak diberi overlay yang tidak dipilih.
8. **No fake data in production:** album, tanggal, username, status dan count berasal dari API.

## 2. Token precedence & CSS architecture
Priority ordered:
A) exact verified BOOKING design tokens (source documented);
B) mapped semantic tokens in `packages/ui/tokens.css`;
C) per-event theme variables in `eventTheme`, applied only inside guest/event pages;
D) **provisional fallback** below only when A unavailable during scaffold.

### Provisional fallback (NOT asserted as BOOKING tokens)
| Semantic | HEX | Usage |
|---|---|---|
| `--kv-bg` | `#F9F6F0` | light page base |
| `--kv-surface` | `#FFFDFC` | cards/dialogs |
| `--kv-ink` | `#391716` | titles/body |
| `--kv-muted` | `#75645F` | hints |
| `--kv-primary` | `#6A0C12` | buttons/action |
| `--kv-primary-hover` | `#711820` | hovered action |
| `--kv-border` | `#E3D6C8` | quiet outlines |
| `--kv-hero` | `#520305` | event wedding hero |
| `--kv-accent` | `#D9BC8E` | ornament only |
| `--kv-on-dark` | `#FFFCF8` | text on hero |
| `--kv-success` | `#2F684A` | success labels |
| `--kv-danger` | `#A32735` | errors |

```css
/* TEMPORARY. Overwrite/map after BOOKING extraction, preserve semantic names. */
:root {
  --kv-bg: #F9F6F0; --kv-surface: #FFFDFC;
  --kv-ink: #391716; --kv-muted: #75645F;
  --kv-primary: #6A0C12; --kv-primary-hover: #711820;
  --kv-border: #E3D6C8; --kv-hero: #520305;
  --kv-accent: #D9BC8E; --kv-on-dark: #FFFCF8;
  --kv-success: #2F684A; --kv-danger: #A32735;
}
```

**Token audit reconciliation rule:** when BOOKING final extraction returns e.g. new primary, replace its actual semantic value, do not overwrite every hex across files. Add `tokens.source.json` with `verified: true`, `source_project`, `source_file`, `retrieved_at`; cannot falsely mark verified.

## 3. Fonts / typography
- **Source of truth:** BOOKING font families and weights. Do not infer from project name.
- Provisional event wedding: **Cormorant Garamond** display, **DM Sans** for body/UI. Great Vibes only optional couple-names, if licensed/available and actually selected by event.
- Interface use 1 or 2 families total (sans for UI, editorial serif for title only), display 44–72 desktop / 34–48 mobile, H2 28–40 desktop / 25–32 mobile, H3 20–24, body 15–16, hint 12–14, label 13–14.
- `font-display: swap`, local/next-font recommended; load smallest weights and subset; do not send font binaries from previous projects without license audit.

## 4. Layout & spacing specifications
- Spacing scale: 4/8/12/16/20/24/32/40/48/64/80.
- Desktop max content 1200–1280 px; dashboard content max 1440px where appropriate. Sidebar 240–272 px, topbar 64–72px, content gutter 24–32px.
- Guest mobile layout optimized for 360–430 px with zero horizontal overflow; viewport safe-areas using `env(safe-area-inset-bottom)`.
- Tap target >=44×44 px; minimum 8px gap between neighboring controls; focus-ring visible 2px offset.
- Cards radius 12–20 px as BOOKING final preference; soft borders; shadows nearly none. Inputs height 44–48px. Dialog should not cover camera permissions UI.
- Desktop: responsive 12-col shell; mobile: full-width one column. Camera bottom dock has sticky action controls, never covers photo preview.

## 5. Component specification
### Primitive components
`Button` (primary/secondary/outline/ghost/destructive/loading/disabled); `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Toggle`, `Tabs`, `Badge` (status only), `Card`, `Dialog`, `Sheet`, `Tooltip`, `Progress`, `Skeleton`, `Toast`, `FileDropzone`, `AudioRecorder`, `VideoRecorder`, `CameraView`, `FramePreview`, `FilmCounter`, `GalleryCard`, `MediaViewer`, `QRPoster`, `ThemeSelector`, `StepWizard`, `SettingsToggleRow`, `QuotaMeter`.

**Button:** text + meaningful verb; no gratuitous gradient; loading state cannot create duplicate charges/submits. **Inputs:** labels persist, error copy near field, placeholder not label. **Camera:** disabled controls explain why; permission denied fallback clear. **Thumbnail:** `object-fit:contain` for photo output, `cover` only decorative hero. **Gallery:** per-media status + privacy indication; no unauthorized hover/download action.

### Icons, ornaments and pattern
Use consistent Lucide stroke, ~1.75–2px. Only event wedding theme may use thin botanical/sparkle SVG; no 3D icons, loud stickers on core admin pages. Patterns never occlude face, contrast targets or CTA. Preserve Komukuna original logo/mascots from verified local assets only; don't fabricate logo.

## 6. Theme engine — separate from platform design
Themes (starter templates): `wedding-ivory`, `maroon-romance`, `botanical-sage`, `graduation-navy`, `birthday-pastel`, `corporate-minimal`.
Each theme JSON includes `id`, `version`, `displayName`, `palette`, `fontRoles`, `background`, `ornaments`, `heroLayout`, `cardLayout`, `buttonStyle`, `framePresets`, `assetRefs`, `safeContrastSettings`. **Never let untrusted tenant CSS execute globally**; validate token subset and CSS-safe values. Event themes scoped to `[data-event-theme]` container only. Admin dashboard brand stays BOOKING-derived.

## 7. Screen-level design directions
### 7.1 Public marketing
Nav desktop: logo left; `Fitur`, `Cara Kerja`, `Template`, `Harga`, `FAQ`; right `Coba Demo`, `Masuk`. Mobile nav sheet. Hero: eyebrow "SATU QR, BANYAK KENANGAN", heading "Setiap tamu punya cara sendiri untuk mengabadikan momen.", subtitle concise, CTA `Coba Demo` and `Lihat Paket`; actual example photo montage; no dark full-page. Sections: how works 3 steps, six experience demos, template showcase, plan compare, use cases, trust/pilot results only when real, FAQ, bottom CTA and footer. Use BOOKING composition conventions after audit.

### 7.2 Event wizard (desktop)
Progress 5 steps left/top with visible stage: `Detail Acara`, `Tema & Frame`, `Pengalaman Tamu`, `Pratinjau`, `Aktivasi`. Workspace 2-column 60/40 form and live guest preview where space; 1-col stacked mobile. Save draft automatically with explicit saved indicator. No 20-field mega-form.

### 7.3 Guest welcome
Event hero name, date and theme ornaments; one sentence and 1–6 mode cards depending toggles. If only one enabled mode, allow direct CTA. Privacy notice before submission. Brand footer subtle. No forced login.

### 7.4 Camera flow
Header top: back, event label, camera switch; central 3:4 camera stage responsive with ratio capped; next row: filter carousel (one row, horizontal scroll), thumbnails of slots, bottom: large shutter/control dock. Timer overlay accessible, visual shutter feedback, progress `Pose 2 dari 4`; ensure browser gestures. Output preview has `Ulangi` / `Simpan & Lihat Hasil`. Camera permissions requested **only** after user taps begin.

### 7.5 Disposable flow
Distinct vintage/film UI but high contrast. Top `Sisa 14 / 15 jepretan`, viewfinder, shutter, film filter; confirm save; before reveal only show mystery preview and status; never leak unapproved image via preloaded URLs.

### 7.6 Voice and wishes
Audio record centered with large mic, countdown, listening preview, discard/retry, guest name and private/public consent controls. Wishes template browser + simple editor with strong text contrast.

### 7.7 Gallery
Desktop tabs & cards, mobile 2-column thumbnails or 1 if metadata complex; filter by mode, photo lightbox fullscreen, `Unduh` and `Bagikan`, placeholder skeleton, no photo cropping. Clearly label media locked/pending, don't hint hidden private assets.

### 7.8 Live Wall
Display-only 16:9/9:16, scalable typographic title, approved-only assets, pause/play and QR overlay controlled in operator view, warm transitions and fallback "Menunggu momen berikutnya".

### 7.9 Vendor dashboard
Sidebar Overview, Events, Themes & Frames, Gallery/Moderation, Analytics, Orders/Billing, Team, Settings. Event detail tabs `Overview`, `Guest Experience`, `Frames`, `Media`, `Live Wall`, `QR & Display`, `Analytics`, `Settings`. Information density moderate; purposeful color status; not generic copy of commercial dashboard.

## 8. Exact UI states per critical control
- Empty, loading, success, denied, disabled, uploading, retryable failure, quota exhausted, event not live, gallery reveal pending, expired, pending moderation, payment reviewing.
- Every state has human-language copy in Indonesian and recovery action when possible; never blank screen.
- Error examples: `Izin kamera belum diberikan. Kamu tetap bisa memilih foto dari galeri jika diizinkan penyelenggara.`; `Koneksi terputus. Foto masih tersimpan sementara di perangkat ini—coba unggah ulang.`; `Jatah fotomu sudah habis. Terima kasih sudah meramaikan acara.`

## 9. Accessibility, localization & performance
- WCAG AA target; main text contrast >=4.5:1 and large text >=3:1; check actual colors with automated or measured contrast.
- Keyboard on all web dashboard controls, screen-reader labels, skip links, drag handles with accessible alternatives, reduced motion, no audio autoplay, caption/transcript option as future work.
- Content ID primary, time zone `Asia/Jakarta` event-configurable; date/localization `id-ID`, optional en-US later.
- Guest initial load lean: lazy-load Konva editor or heavy assets until needed; WebP/AVIF thumbs when supported; gallery paginate; don't ship 30 filters JS just for welcome page.

## 10. Design acceptance checklist
- [ ] Extract real BOOKING tokens, screenshot comparison and map shared components with source evidence.
- [ ] No unverified hardcoded brand palette after integration.
- [ ] Marketing, admin and guest visually coherent but don't share identical layouts.
- [ ] Camera and submit controls visible at 360px and with notch safe area.
- [ ] All screen states have empty/loading/error/retry.
- [ ] Real photo preview 6x4, 4x6, strip and 4R shows **full uncropped** output.
- [ ] Accessible focus, contrast, button sizes, font loading and responsive typography.
- [ ] At least 6 event themes customizable; default based on approved BOOKING design.
