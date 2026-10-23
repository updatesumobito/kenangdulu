# Vercel and private Supabase Storage ? 23 October 2026

The current Vercel project is `komukuna-virtual-wahyu-novita` (`prj_0EpZsmZowKSjrSMmb82U6KIt2Aw1`) in team `team_jbWLYN0Ylf8KfB2lgKjky7eH`. The former project returned 404 and was absent from the team project list, so it was recreated under the same name.

## Runtime

- Next.js, Node 22, serverless region `bom1`.
- PostgreSQL uses the Supabase transaction pooler and dedicated backend role. Prepared statements are disabled and schema auto-migration is disabled.
- Production has `APP_MODE=personal`, `AUTH_PROVIDER=supabase`, `STORAGE_DRIVER=supabase`, and demo data disabled.
- Temporary processing files use `/tmp/komukuna-virtual`. Durable files live in the private `komukuna-private` bucket.
- Supabase service credentials stay inside the `komukuna-storage` Edge Function. Vercel receives a separate server-only bridge token and the dedicated database credential. Neither credential is public or prefixed with `NEXT_PUBLIC_`.
- Background jobs run through Next.js `after()` on API requests. There is no continuously running worker or external scheduler on Vercel. Request-independent scheduled processing would need a separate worker/scheduler.
- The current bucket allows objects up to 50 MiB; large ZIP exports are subject to this limit.

## Data

The existing published event is `wahyu-novita` (`335ee918-5e72-4713-8c97-d41f4c4453fd`). It contains no media, event assets or frame assets at deployment time. The configured local media directory contains no files, so the migration command copied zero objects. Existing development fixtures in `.data/private` were not imported into the real event.

## Deployment fixes

- Changed the throwing `fail()` helper to a function declaration so TypeScript narrows nullable values at call sites.
- Kept the admin bootstrap provider user separate from the sign-in session type, since sign-up may return a null session.
- Allowed install scripts only for the locked versions of FFmpeg, Linux ffprobe, esbuild and unrs-resolver needed by deployment. npm skips unapproved lifecycle scripts by default; see [npm install-script approvals](https://docs.npmjs.com/cli/v11/commands/npm-install-scripts/).
- Fixed the MCP helper to read deployment responses nested under `deployment`.
- Regenerated the deployment manifest from all source files, public assets and migrations; the previous manifest omitted four newer source files.

## Checks

The observed TypeScript errors were reproduced with `npx tsc --noEmit --incremental false`. After correction, that command exited successfully. `npx tsx scripts/migrate-storage.ts` confirmed the private bucket is available and reported zero source files. No browser checks, E2E tests or full test suite were run.

Vercel reported **READY** for production deployment `dpl_GBDA69SC7cPR2sFHhKR3K1wLn4xu`, with no alias error. Its build compiled successfully and completed TypeScript checking.

- Production: https://komukuna-virtual-wahyu-novita.vercel.app
- Guest event: https://komukuna-virtual-wahyu-novita.vercel.app/e/wahyu-novita
- Immutable deployment: https://komukuna-virtual-wahyu-novita-mfvqmgwa9.vercel.app

Runtime login, camera, upload and export flows were not tested in a browser.
