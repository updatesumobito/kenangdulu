# License and dependency review

Source roots do not expose a root LICENSE in the audited file inventories. Source code has therefore not been literally copied. Design token values and implementation patterns are adapted under the user's request; proprietary logos and customer assets are excluded.

Target packages: Next.js/React/TypeScript/Playwright/Zod/PGlite/postgres/qrcode/archiver/AWS SDK/lucide are independently installed npm dependencies, with their package licenses retained in node_modules and exact versions in package-lock.json. Fonts: Plus Jakarta Sans and Playfair Display via @fontsource-variable packages (SIL OFL). FFmpeg binary is distributed by ffmpeg-static under GPL; ffprobe-static package/binary licensing must be included in any distribution. This project does not redistribute a desktop executable.

Initial npm latest resolution failed (playwright@1.64.1 unavailable). Pinned @playwright/test 1.63.0; install browsers completed. Audit detected critical Next.js 16.3.8 advisories; upgraded target only to 16.4.2. Remaining development-only ESLint/glob advisories are documented in final npm audit output. No npm audit --force downgrade performed.
