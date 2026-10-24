<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Preferensi pengguna

- Khusus acara `wahyu-novita`, pertahankan palet maroon, ivory, dan gold asli. Warna acara ini tidak mengikuti `design (3).md` atau palet Heritage Moss.
- Welcome tamu dan motion-nya harus tetap muncul saat halaman dibuka ulang, termasuk URL mode langsung. Jangan melewatinya otomatis berdasarkan `sessionStorage`; tetap hormati reduced motion. Label wizard yang terkunci harus tetap terbaca pada mode terang dan gelap.
- Auto-deploy Vercel dari Git diizinkan atas permintaan pengguna. Push ke branch yang terhubung boleh memicu deployment otomatis tanpa konfirmasi deploy terpisah. Gunakan preview lokal selama pengerjaan.
- Jalankan pemeriksaan hanya untuk error yang ditemukan/dilaporkan atau yang diwajibkan instruksi berprioritas lebih tinggi; jangan menjalankan suite, build lokal, lint, typecheck atau pemeriksaan browser rutin.
