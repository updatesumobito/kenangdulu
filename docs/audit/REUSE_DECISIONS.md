# Reuse decisions

This consolidates existing audit records; source repositories were not modified in this continuation.

- BOOKING: adapt documented palette, typography and layout patterns with source references in `BOOKING_DESIGN_EXTRACTION.md`. Fonts are installed independently; private assets are excluded.
- Mokabooth: implement browser geometry, crop, renderer and frame interactions independently from audited behavior. The `src/lib/mokabooth` directory names that behavioral origin; it is not a claim of verbatim licensed copying.
- Native Rust/Tauri camera and printer integration is excluded from the web implementation. Browser capture uses MediaDevices.
- Use independently installed qrcode and archiver packages for QR and exports. Source repository environment files, customer data, binaries and node_modules were not imported according to the retained origin manifest.
- No source root license grant was found in the earlier audit. Keep provenance and dependency notices; review FFmpeg/ffprobe licensing before distribution.

Evidence: `CODE_ORIGIN_MANIFEST.md`, `MOKABOOTH_REUSE_MATRIX.md`, `BOOKING_DESIGN_EXTRACTION.md`, `LICENSE_REVIEW.md`, and saved Git status-before/after files in this directory.
