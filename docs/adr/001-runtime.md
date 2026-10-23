# Runtime and deviations

Update 23 October 2026: current runtime uses Supabase PostgreSQL/Auth with a dedicated server role. See `docs/implementation/SUPABASE_SETUP.md`. The local PGlite option is preserved. ZIP export now streams object reads into an archive on disk and uses `storage.putFile`; the older buffering limitation below has been superseded. The standalone worker is now a long-running PostgreSQL worker rather than an authenticated HTTP tick.

A single Next.js App Router application is used to keep the pilot small. Node runtime, PostgreSQL schema, API permissions, local private object storage and durable SQL jobs are functional without cloud credentials. PGlite is real embedded PostgreSQL persisted to .data/postgres; never run two processes against this directory. DATABASE_URL selects external Postgres using postgres.js. Migration authority is checked-in infra/migrations SQL.

Local authentication uses scrypt password hashes, opaque hashed sessions, HttpOnly SameSite cookies, expiration and Origin verification. Supabase production Auth is not pretended: deployment requires either approved local-auth operations or configuring the provider adapter. No credentials from the source repos are used.

Storage is private local by default. STORAGE_DRIVER=r2 selects real S3 SDK calls to configured R2. Uploads are bounded 30MB and flow through the authorized Node endpoint; retries repeat the same intent, not TUS. Multipart/resumable cloud upload remains an explicitly documented scaling limitation.

Persistent jobs are claimed transactionally; local Node worker wakes every 3s and retries at most three attempts. FFmpeg runs as a bounded child process, not in the browser or Edge. For serverless deployment an external long-lived worker and external Postgres are mandatory. ZIP is assembled on disk but final storage write currently buffers the completed archive; large exports require streaming production adapter before scaling to Signature maximum capacity.

Mini routes do not import FrameStudio; guest welcome is a Server Component. Camera, recorder, gallery, and editor are independently lazy-loaded. Native integration deferred.
