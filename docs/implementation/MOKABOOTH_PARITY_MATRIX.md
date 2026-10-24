# Mokabooth parity matrix: AC-01 through AC-57

Updated 24 October 2026. Source: `C:/Users/user/Music/mokabooth/moka-roadmap/PRD-Mokabooth-Frame-Builder-v2.md` (read-only). Implementation paths below are under `src/components` or `src/lib`.

`PARTIAL_VERIFICATION` describes only focused evidence, never an acceptance PASS. `NOT_TESTED` means the scenario was not executed. UI, touch, real devices and source-runtime compatibility remain unverified. Hardware/DSLR/printer/native device sync are outside web scope; device/price metadata is retained for round-trip.

| AC | Source scenario | Implementation | Evidence status | Exact limit of evidence |
|---|---|---|---|---|
| AC-01 | Pilih rectangle | frame-artboard.tsx / frame-editing.ts / use-frame-editor.ts | NOT_TESTED | Code supplies eight handles; visible UI not exercised. |
| AC-02 | Tarik atas pada rotasi 0° | frame-artboard.tsx / frame-editing.ts / use-frame-editor.ts | PARTIAL_VERIFICATION | 192 pure geometry combinations cover anchor/ratio/zoom/pan/rotation invariants. Actual Konva pointer/touch acceptance was not run. |
| AC-03 | Tarik bawah | frame-artboard.tsx / frame-editing.ts / use-frame-editor.ts | PARTIAL_VERIFICATION | 192 pure geometry combinations cover anchor/ratio/zoom/pan/rotation invariants. Actual Konva pointer/touch acceptance was not run. |
| AC-04 | Tarik kiri | frame-artboard.tsx / frame-editing.ts / use-frame-editor.ts | PARTIAL_VERIFICATION | 192 pure geometry combinations cover anchor/ratio/zoom/pan/rotation invariants. Actual Konva pointer/touch acceptance was not run. |
| AC-05 | Tarik kanan | frame-artboard.tsx / frame-editing.ts / use-frame-editor.ts | PARTIAL_VERIFICATION | 192 pure geometry combinations cover anchor/ratio/zoom/pan/rotation invariants. Actual Konva pointer/touch acceptance was not run. |
| AC-06 | Empat sudut | frame-artboard.tsx / frame-editing.ts / use-frame-editor.ts | PARTIAL_VERIFICATION | 192 pure geometry combinations cover anchor/ratio/zoom/pan/rotation invariants. Actual Konva pointer/touch acceptance was not run. |
| AC-07 | Zoom 25/50/100/200% dengan pan | frame-artboard.tsx / frame-editing.ts / use-frame-editor.ts | PARTIAL_VERIFICATION | 192 pure geometry combinations cover anchor/ratio/zoom/pan/rotation invariants. Actual Konva pointer/touch acceptance was not run. |
| AC-08 | Slot rotasi 30° dan 90° | frame-artboard.tsx / frame-editing.ts / use-frame-editor.ts | PARTIAL_VERIFICATION | 192 pure geometry combinations cover anchor/ratio/zoom/pan/rotation invariants. Actual Konva pointer/touch acceptance was not run. |
| AC-09 | Tarik melewati minimum | frame-artboard.tsx / frame-editing.ts / use-frame-editor.ts | PARTIAL_VERIFICATION | 192 pure geometry combinations cover anchor/ratio/zoom/pan/rotation invariants. Actual Konva pointer/touch acceptance was not run. |
| AC-10 | Kunci rasio dan Shift | frame-artboard.tsx / frame-editing.ts / use-frame-editor.ts | PARTIAL_VERIFICATION | 192 pure geometry combinations cover anchor/ratio/zoom/pan/rotation invariants. Actual Konva pointer/touch acceptance was not run. |
| AC-11 | Circle dan QR | frame-artboard.tsx / frame-editing.ts / use-frame-editor.ts | PARTIAL_VERIFICATION | 192 pure geometry combinations cover anchor/ratio/zoom/pan/rotation invariants. Actual Konva pointer/touch acceptance was not run. |
| AC-12 | Inspector X/Y/W/H/rotasi | frame-artboard.tsx / frame-editing.ts / use-frame-editor.ts | NOT_TESTED | UI/API path is implemented; this acceptance scenario was not run. |
| AC-13 | Lock/hide | frame-artboard.tsx / frame-editing.ts / use-frame-editor.ts | NOT_TESTED | UI/API path is implemented; this acceptance scenario was not run. |
| AC-14 | Resize lalu save/reload | frame-artboard.tsx / frame-editing.ts / use-frame-editor.ts | PARTIAL_VERIFICATION | Backend CAS checked; gesture save/reload UI not exercised. |
| AC-15 | 20 resize berulang | frame-artboard.tsx / frame-editing.ts / use-frame-editor.ts | PARTIAL_VERIFICATION | Geometry calculations checked; twenty interactive resizes not exercised. |
| AC-16 | Cover dengan foto landscape/portrait | frame-renderer.ts / frame-document.ts / guest-camera.tsx | PARTIAL_VERIFICATION | Circle clipping and shared source checked on one isolated canvas; cover/contain device matrix not exercised. |
| AC-17 | Crop Enter/Escape | frame-renderer.ts / frame-document.ts / guest-camera.tsx | NOT_TESTED | UI/API path is implemented; this acceptance scenario was not run. |
| AC-18 | Dua slot source index sama | frame-renderer.ts / frame-document.ts / guest-camera.tsx | PARTIAL_VERIFICATION | Two slots sharing one source checked in model and isolated canvas. |
| AC-19 | Reorder Layer | frame-renderer.ts / frame-document.ts / guest-camera.tsx | PARTIAL_VERIFICATION | Source mapping remains independent of object array ordering in model check. |
| AC-20 | Multi-select align/distribute | frame-editing.ts / use-frame-editor.ts | NOT_TESTED | UI/API path is implemented; this acceptance scenario was not run. |
| AC-21 | Snap pada zoom berbeda | frame-editing.ts / use-frame-editor.ts | NOT_TESTED | UI/API path is implemented; this acceptance scenario was not run. |
| AC-22 | Undo/redo gesture | frame-editing.ts / use-frame-editor.ts | NOT_TESTED | Gesture commits once in code; interactive undo/redo not exercised. |
| AC-23 | Shortcut saat mengetik nama | frame-editing.ts / use-frame-editor.ts | NOT_TESTED | Form-target guard exists; typing acceptance not exercised. |
| AC-24 | Upload PNG alpha dan JPEG EXIF | frame-renderer.ts / frame-service.ts / frame-inspector.tsx | NOT_TESTED | UI/API path is implemented; this acceptance scenario was not run. |
| AC-25 | Overlay di atas foto | frame-renderer.ts / frame-service.ts / frame-inspector.tsx | NOT_TESTED | UI/API path is implemented; this acceptance scenario was not run. |
| AC-26 | Export saat zoom/pan berbeda | frame-renderer.ts / frame-service.ts / frame-inspector.tsx | PARTIAL_VERIFICATION | 1200 x 1800 output checked. Zoom/pan UI export comparison not exercised. |
| AC-27 | Export/preview | frame-renderer.ts / frame-service.ts / frame-inspector.tsx | PARTIAL_VERIFICATION | Final renderer has no Konva/editor nodes; isolated canvas only. |
| AC-28 | QR sesi | frame-renderer.ts / frame-service.ts / frame-inspector.tsx / frame-artboard.tsx | PARTIAL_VERIFICATION | Isolated React/Konva regression reproduces stale bitmaps before the fix and verifies repaint after event/gallery URL changes. QR decoding and application-page acceptance not exercised. |
| AC-29 | Teks/font | frame-renderer.ts / frame-service.ts / frame-inspector.tsx | PARTIAL_VERIFICATION | Legacy long-caption bounds checked within 1 px; full font matrix not exercised. |
| AC-30 | Auto-detect dua lubang transparan | frame-auto-detect.tsx / frame-detect.worker.ts | NOT_TESTED | UI/API path is implemented; this acceptance scenario was not run. |
| AC-31 | Auto-detect warna terpilih | frame-auto-detect.tsx / frame-detect.worker.ts | NOT_TESTED | UI/API path is implemented; this acceptance scenario was not run. |
| AC-32 | Save gagal/offline | frame-drafts.ts / use-frame-editor.ts / frame-service.ts | NOT_TESTED | IndexedDB debounce/recovery wired; offline and quota failures not exercised. |
| AC-33 | Edit selama save berlangsung | frame-drafts.ts / use-frame-editor.ts / frame-service.ts | NOT_TESTED | Save snapshot signature is tracked separately; editing remains available while save is pending. Request-race UI not exercised. |
| AC-34 | Revision conflict | frame-drafts.ts / use-frame-editor.ts / frame-service.ts | PARTIAL_VERIFICATION | Stale expectedVersion rejected in memory DB; recovery choices UI not exercised. |
| AC-35 | Layout legacy | frame-document.ts / frame-portability.ts / frame-service.ts | PARTIAL_VERIFICATION | Read adapter does not mutate input; legacy caption canvas checked. Full source fixture not exercised. |
| AC-36 | Device/event/private | frame-document.ts / frame-portability.ts / frame-service.ts | NOT_TESTED | Web event/tenant asset guards implemented; device metadata preserved. Native device enforcement OUT_OF_WEB_SCOPE. |
| AC-37 | Harga null vs 0 | frame-document.ts / frame-portability.ts / frame-service.ts | NOT_TESTED | Compatibility metadata retained. Explicit null-vs-zero consumer fixture not exercised. |
| AC-38 | Ganti ukuran/orientasi/DPI | frame-document.ts / frame-portability.ts / frame-service.ts | NOT_TESTED | UI/API path is implemented; this acceptance scenario was not run. |
| AC-39 | 1366×768 dan 1024×768 | frame-studio.css / frame-artboard.tsx | NOT_TESTED | UI/API path is implemented; this acceptance scenario was not run. |
| AC-40 | Tablet touch/pointer cancel | frame-studio.css / frame-artboard.tsx | NOT_TESTED | UI/API path is implemented; this acceptance scenario was not run. |
| AC-41 | Runtime adapter | validateFrame / renderer / capability API | NOT_TESTED | Validator blocks publish for missing/unsupported features. Full runtime compatibility fixtures not exercised. |
| AC-42 | Benchmark 10 slot + 10 objek | validateFrame / renderer / capability API | NOT_MEASURED | NOT_MEASURED: no 45 fps benchmark or physical device profile was run. |
| AC-43 | Buka fixture existing 102×152 mm | toFrameDocument / frameDocumentSchema | PARTIAL_VERIFICATION | 102 x 152 mm legacy model preserved in focused check. |
| AC-44 | Inspector mm → save/reload 20 kali | toFrameDocument / frameDocumentSchema | PARTIAL_VERIFICATION | Twenty document/package round-trips checked at 29.5/7/43/54 mm. Twenty server UI saves not exercised. |
| AC-45 | Checkbox rasio lama aktif | toFrameDocument / frameDocumentSchema | NOT_TESTED | Legacy aspect_ratio is adapted to ratioLock; UI unlock not exercised. |
| AC-46 | Zoom 165% pada 1366×768 | frame-studio.css / frame-renderer.ts / frame-inspector.tsx | NOT_TESTED | UI/API path is implemented; this acceptance scenario was not run. |
| AC-47 | Several textures below/above + opacity | frame-studio.css / frame-renderer.ts / frame-inspector.tsx | NOT_TESTED | Multiple textures retain ordering, opacity and legacy metadata; source pixel fixture not exercised. |
| AC-48 | Texture scope per layout type | frame-studio.css / frame-renderer.ts / frame-inspector.tsx | NOT_TESTED | Render filters by layoutTypes without deleting other variants; not exercised. |
| AC-49 | Multi-select layout_types | frame-studio.css / frame-renderer.ts / frame-inspector.tsx | NOT_TESTED | Multi-select layoutTypes preserved in schema/envelope; source consumer not exercised. |
| AC-50 | Foto unik/duplikasi/capture order/panduan | frame-document.ts / frame-service.ts / frame-portability.ts | PARTIAL_VERIFICATION | Unique source/capture-order mapping checked partially; guide UI not exercised. |
| AC-51 | Upload limit/quota existing | frame-document.ts / frame-service.ts / frame-portability.ts | NOT_TESTED | Asset library is independent of layer removal; upload/quota UI not exercised. |
| AC-52 | Restore revisi existing | frame-document.ts / frame-service.ts / frame-portability.ts | NOT_TESTED | Immutable revisions, preview and restore-to-draft are wired; interactive restore not exercised. |
| AC-53 | Slot transparan, Slot QR, QR lama | frame-document.ts / frame-service.ts / frame-portability.ts | NOT_TESTED | Separate transparent photo slot, QR slot and standalone QR representations retained; consumer fixture not exercised. |
| AC-54 | Panel inspector selected | frame-inspector.tsx / frame-artboard.tsx / use-frame-editor.ts | NOT_TESTED | UI/API path is implemented; this acceptance scenario was not run. |
| AC-55 | Guide overlay view | frame-inspector.tsx / frame-artboard.tsx / use-frame-editor.ts | NOT_TESTED | Transparent guide view is separate from final compositing; UI not exercised. |
| AC-56 | Validation/save messages | frame-inspector.tsx / frame-artboard.tsx / use-frame-editor.ts | NOT_TESTED | UI/API path is implemented; this acceptance scenario was not run. |
| AC-57 | Toolbar/read-only save states | frame-inspector.tsx / frame-artboard.tsx / use-frame-editor.ts | NOT_TESTED | New unsaved documents are dirty; local/server states and saving are separate. UI races not exercised. |
