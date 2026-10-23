# PERFORMANCE & MEDIA EFFICIENCY BUDGET — Komukuna Virtual v2
**Tujuan: QR membuka web ringan pada jaringan seluler; kamera dan video tetap responsif.** Angka target engineering, harus dibuktikan dengan profiler dan laporan lab/field; bukan jaminan tanpa uji.

## 1. Runtime loading profile
| Route | Requirement | Budget/goal |
|---|---|---|
| Guest `/e/[slug]` welcome | SSR/static shell, no camera/editor import | initial transferred first-party compressed JS target ≤ 180KB (stretch; adjust with measured baseline) |
| Guest disposable | lazy import capture and lightweight Canvas2D, 4 CSS/canvas film presets | no Konva/editor/FFmpeg initial |
| Guest voice | lazy load recorder when tapped | microphone not requested until user gesture |
| Guest video | lazy load media recorder + upload only in mode | video transcoding server worker, not bundling FFmpeg.wasm globally |
| Strip mode Classic+ | frame engine only on entry | editor not part of guest bundle |
| Partner/admin frame editor | chunk-split Konva and designer assets | no editor in buyer/guest Mini route |
| Gallery | page-wise thumbnails, lazy images, signed full-resolution on demand | virtualized/paginated for >100 images |

## 2. Web Vital goals & measurable acceptance
- p75 **LCP ≤2.5s**, **INP ≤200ms**, **CLS ≤0.1** on representative supported mobile where measured; do not claim lab numbers as real RUM.
- Capture feedback after shutter near-immediate to user even if upload proceeds in background; requestAnimationFrame/timer cancellation, prevent duplicate capture on double tap.
- Mobile cold view target optimized photos ≤250KB thumbnail/hero where possible; responsive images `srcset`, no raw media as hero background.
- Avoid eager import `konva`, photo editor, chart libraries, waveform/video renderer, icon packs as giant modules. Tree shake per icon. Decorative animations disabled for reduced motion.
- Upload service and preview must not depend on livewall connection. Pause expensive UI while page hidden and stop camera tracks.
- Monitor bundle analyzer, Lighthouse mobile, real browser Performance panel, worker memory and object storage egress/operations per event; save results in `PERFORMANCE_REPORT.md`.

## 3. Asset & storage budget
- Photo output: adaptive max edge 1600–2400px depending frame/output needs, JPEG/AVIF/WebP only if compatibility proven; aim typical 0.4–1.5MB; EXIF/GPS strip for shared files; do not upscale source and call it HD.
- Photo original retention optional; don't store original + multiple full-size copies by default in cheap tiers. Keep one final export + thumb (transparent frame PNG only where necessary).
- Mini: 450 photos + 50×30s voice + 10×15s video under **2 GiB** total. Hard enforce bytes max; in-video compression bounded to fit cap, otherwise show upgrade/fail without silent loss.
- Video: limit 15s for Mini/Classic, 30s higher; adaptive recording 480p/720p, bitrate e.g. 0.5–1.5Mbps target, platform-specific MIME negotiated. Server validates actual duration, MIME, size and content; upload progress/resume. No arbitrary 4K streaming accepted.
- Audio: typical compressed media, cap MIME/bytes and total 30/45/60s per plan; record original + derivative only if playback compatibility requires it.
- Prefer direct private object store upload with presigned PUT for small files and S3 multipart compatible pattern for large video R2; do not falsely assume R2 accepts Supabase TUS protocol. Use signed read, not public bucket.
- Thumb: responsive 240/480 widths, generated async; audio uses poster waveform/light UI with no full audio download until play.
- Export ZIP async stream/worker, expires; avoid serverless in-memory giant ZIP.

## 4. Low-cost infrastructure
SSR route caching only for public sanitized configs. RLS-controlled personalization not cacheable across tenants/users. Browser retries use idempotency keys and bounded exponential backoff; reserve bytes/guest shot transactionally. Avoid per-frame writes to DB or synchronous real-time broadcaster from camera preview. Use one worker for pilot and split when proven required. Autoscaled video jobs need hard limit to protect cost. Keep observability redacted.

## 5. Performance regressions fail gate
- Direct Mini guest downloads editor/Konva/FFmpeg on first view: FAIL.
- Loading gallery fetches all original-size photos: FAIL.
- Browser recording writes GB objects to memory or app server: FAIL.
- Changing an event theme mutates existing image asset bytes: FAIL.
- Persistent camera stream after leaving mode: FAIL.
- No perf report after final build: mark NOT VERIFIED, do not claim lightweight achieved.
