# Mokabooth compatibility audit

| Feature | Actual source | Dependencies | Decision / target |
|---|---|---|---|
| Camera | crates/camera-core/src/webcam.rs; apps/desktop/src/kiosk | Rust, Tauri invoke, native providers | Cannot reuse in browser; src/components/guest-camera.tsx uses MediaDevices |
| Frame editor | apps/admin-web/components/frame-builder-shell.tsx | React, Konva, desktop schema in mm | Behavior adapted; independent normalized browser studio with keyboard fields, drag, undo/redo |
| Crop | apps/admin-web/lib/frame-crop.ts:1 | pure TypeScript | Portable logic, no explicit repository license found; independent standard cover/contain implementation in renderer.ts |
| Geometry | apps/admin-web/lib/frame-geometry.ts:1 | pure TS, center-pivot mm | Portable concepts adapted to normalized coordinates; no literal code copied |
| Renderer | crates/rendering/src/lib.rs | Rust/image | Native excluded; Canvas2D renderer is independently written |
| Filters | kiosk review-screen.tsx, native rendering | booth engine state | Curated CSS/Canvas filters implemented independently; no native SDK |
| QR | apps/desktop/src/kiosk/components/qr-code-plate.tsx:2 | @tauri-apps/api invoke booth_qr | Not portable as-is; qrcode MIT library produces SVG/PNG/PDF server-side |
| Export | apps/admin-web/lib/frame-export.ts:1 | custom ZIP STORE | Audited only; archiver MIT used instead |

No source license grant file was found. User authorizes auditing and compatible reuse, but no private code is redistributed wholesale. Clean browser implementations retain behavioral ideas and provenance. Both source Git statuses preserved. Native Windows/Rust/Tauri unchanged.
