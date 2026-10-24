# Code origin manifest

- C:/Users/user/Music/mokabooth/apps/admin-web/lib/frame-crop.ts
  - commit: 8a0944114c02607121f740988ad1d674cbf3f198
  - SHA256: b09c6527985dae3c305a06fb690d95e43ad01df7694e07e4de465b7f0016e09c
  - behavior audited; independent browser implementation; not copied
- C:/Users/user/Music/mokabooth/apps/admin-web/lib/frame-geometry.ts
  - commit: 8a0944114c02607121f740988ad1d674cbf3f198
  - SHA256: cf0e4209a0a10dd973746a9041c9d25a9a51f9bbd829b0237510635fa9fa0cd5
  - behavior audited; independent browser implementation; not copied
- C:/Users/user/Music/mokabooth/apps/admin-web/lib/frame-export.ts
  - commit: 8a0944114c02607121f740988ad1d674cbf3f198
  - SHA256: 0a4e6dfc8ae79c235093dc74191d4804d398eeb8fba244015cf4c50e4813fe59
  - behavior audited; independent browser implementation; not copied
- C:/Users/user/Music/mokabooth/apps/admin-web/components/frame-builder-shell.tsx
  - commit: 8a0944114c02607121f740988ad1d674cbf3f198
  - SHA256: a1848f7ab0a34f0d684ec2267c2a0ce1072babe785c5e408e079fe37e322d6e8
  - behavior audited; independent browser implementation; not copied
- C:/Users/user/Music/mokabooth/apps/desktop/src/kiosk/components/qr-code-plate.tsx
  - commit: 8a0944114c02607121f740988ad1d674cbf3f198
  - SHA256: d6c078b03bb1e6bb6b032919f20e911cd75adbb55b0cfdcdbeb3e210c3439590
  - behavior audited; independent browser implementation; not copied
- C:/Users/user/Music/mokabooth/crates/camera-core/src/webcam.rs
  - commit: 8a0944114c02607121f740988ad1d674cbf3f198
  - SHA256: 4c0764e4c83195bf84b65022deb555b828531a5c4c7c282e151c1279f62ddce3
  - native only; not copied
- C:/Users/user/Music/mokabooth/crates/rendering/src/lib.rs
  - commit: 8a0944114c02607121f740988ad1d674cbf3f198
  - SHA256: 67e7fe73344ea1a50d7b7307891b4fe7e630f6a53fc4cfe5c36e2d88e087909a
  - native only; not copied

No source repository environment, database, private customer media, node_modules, fonts, or binaries copied. Target code is newly implemented. Semantic design values and design patterns mapped with evidence.

## Continuation: 24 October 2026

Read-only capability/schema references: Mokabooth `apps/admin-web/components/frame-designer.tsx`, `lib/frame-layout.ts`, `lib/frame-export.ts`, and `moka-roadmap/PRD-Mokabooth-Frame-Builder-v2.md`. No source repository was written. New web document, renderer, portability, worker and Konva UI code live only in the target repository. Existing source provenance above remains historical; no new commit hash is inferred for it.

Bundled PDF fonts were obtained from the official notofonts repositories, with the accompanying SIL Open Font License files in `public/fonts/memory-book`:

- https://github.com/notofonts/noto-fonts/tree/main/hinted/ttf/NotoSans
- https://github.com/notofonts/noto-fonts/tree/main/hinted/ttf/NotoSansArabic
- https://github.com/notofonts/noto-cjk/tree/main/Sans/OTF/SimplifiedChinese

Implementation references include the installed Next.js 16.4.2 documentation under `node_modules/next/dist/docs`, the installed Konva Transformer implementation and https://konvajs.org/docs/react/Transformer.html. SQL isolation guidance: https://supabase.com/docs/guides/database/postgres/row-level-security. No arbitrary source asset URLs, source environment values, source databases or source customer media were imported.
