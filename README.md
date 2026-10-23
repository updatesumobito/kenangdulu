# Komukuna Virtual 2.0

Full-stack local web implementation. Read [the final report](docs/implementation/FINAL_REPORT.md) for verification and deployment limits.

Supabase is now configured for project `xpwhpeolndmprzmdkldm` in ignored `.env.local`. See [Supabase handoff](docs/implementation/SUPABASE_SETUP.md). The existing local PGlite database is preserved. Current private media storage is still local; R2 and bank details require operator configuration.

```powershell
npm ci
npx playwright install chromium firefox webkit
npm run db:migrate
npm run db:seed
npm run dev
```

The seed command above is for a fresh isolated local database. Do not run it against the configured Supabase project. External demo seeding is refused unless an operator explicitly enables it for a disposable test database.

Preview: http://127.0.0.1:3107. If changing the dev port, update APP_URL and PLAYWRIGHT_BASE_URL too. Database and private objects persist in `.data`, excluded from Git. Seed is development only. Stop web server before migrations/seeding with PGlite. Next.js and standalone `tsx` database scripts read `.env.local`; shell-supplied environment values take precedence.

Fixture logins: `admin`, `designer`, `buyer`, `partner`, `partner-b`, `operator` at `@demo.komukuna.test`; password `KomukunaDemo2026!`. Never seed production. Public demos: `/e/demo-mini`, `/e/demo-classic`, `/e/demo-signature`.

Bank account, R2, custom production SMTP and hosting are not preconfigured. Supabase PostgreSQL/Auth are configured as described in the handoff. No real payment occurs. Partner pricing is unset until superadmin configures it. Sources BOOKING and mokabooth are read-only references.

For a fresh local-auth environment without demo users, run `npm run db:migrate`, `npm run db:catalog`, then set ADMIN_EMAIL and ADMIN_PASSWORD (at least 16 characters) in the operator shell and run `npm run admin:create`. Do this before starting the PGlite web server. Use external PostgreSQL for a separate worker process; local PGlite uses the worker embedded in the web process.

For Supabase admin bootstrap, supply ADMIN_EMAIL and ADMIN_PASSWORD in the operator shell and run `npm run admin:provision-supabase`. The requested account has already been provisioned; do not create another bootstrap administrator without an explicit operator decision.

Run tests only to investigate a reported or observed error. The two previously failing cases were rerun individually on 23 October 2026; the earlier full report remains in `artifacts/playwright-results.json` with its original failures preserved.
