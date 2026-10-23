# PLAYWRIGHT AUTOMATION — installation, config & final acceptance
**v2 — browser automation wajib dipasang dalam REPO TARGET Windows, bukan hanya disebut di PRD.**

## 1. Install in `C:\Users\user\Music\komukuna-virtual`
Use the audited package manager. If pnpm selected:
```powershell
cd C:\Users\user\Music\komukuna-virtual
pnpm add -D @playwright/test
pnpm exec playwright install chromium firefox webkit
pnpm exec playwright --version
```
For Windows if browser install fails, log exact failure and attempt `pnpm exec playwright install` again; do not silently skip Firefox/WebKit and claim all passed. On Linux CI: `pnpm exec playwright install --with-deps chromium webkit firefox` as supported by environment. Avoid downloading browsers every tiny code change; cache binaries in CI. Official: https://playwright.dev/docs/intro and https://playwright.dev/docs/test-projects

## 2. Scripts expected
`test:e2e`: `playwright test`; `test:e2e:ui`: `playwright test --ui`; `test:e2e:smoke`: `playwright test --grep @smoke`; `test:e2e:report`: `playwright show-report`.

## 3. Example `playwright.config.ts` — adjust host/project path only after audit
```ts
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // shared event/quota fixtures need isolation
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'android-emulated', use: { ...devices['Pixel 5'] } },
    { name: 'webkit-mobile', use: { ...devices['iPhone 13'] } },
    { name: 'firefox-desktop', use: { ...devices['Desktop Firefox'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```
**Note:** fixtures needing real camera may be run using Chromium `--use-fake-device-for-media-stream` plus `--use-fake-ui-for-media-stream` in a **separate project/test fixture**, while UI/permissions can be mocked. Don't force these flags globally; browser/WebKit behavior differs. Do not treat fake camera test as real iPhone certification.

## 4. Seeded test fixtures, isolation and assertions
Seed test tenants `org_direct_test`, `org_vendor_A`, `org_vendor_B`, admin/designer, buyer, partner owner/operator, guest with invite token, sample event per plan, one pending payment, one approved, private/approved/rejected media. Use **test credentials only**, never real customer data. Tests must reset DB state per suite/event to prevent shared photo counters/races.

### Critical E2E groups
- `@smoke` landing loads + pricing visible 99/150/299/499 + two distinct CTAs.
- Direct Mini order flow with form no frame controls; payment proof → admin verify → fulfillment → preview → client approval → publish. Buyer attempt GET or PATCH event settings returns 403.
- Partner onboarding + purchase + event editor present for Classic; own template clone; partner in Mini no frame editor. Partner A access to B’s event returns 403/404, not leak.
- Mini guest with 15 exposures uses camera fake fixture; 16th finalized request blocked; race last exposure finalizes once; 10 video clips x15s cap, 11th denied; note and voice cap validated. Hardware capture mocked for browser E2E and separately test real device manually.
- Classic 4-cut retake slot #2 and save = 1 photo output; frame revision snapshot preserved after admin publish v2.
- Voice/media/video upload: permission rejection, transcoding processing, retry upload ID same, no phantom saved state, expired intent cleanup.
- Gallery default private; approved opt-in published only; no public/anonymous direct object access; film reveal not bypassable with signed URL; live wall pending invisible.
- Bundle/route budget checks & accessibility scan, test mobile 360/390 and desktop 1440, no horizontal overflow.
- Order duplicate approval / rejected proof / upgrade, expired event, ZIP export, retentions and media authorization.

## 5. Testing run policy aligned with low token cost
- While implementing: targeted Vitest/unit and `tsc --noEmit`, Playwright one `@smoke` path if necessary; **do not constantly run entire Playwright suite per component**.
- Once all web features code complete: DB migrations from clean state, one broad multi-browser suite, RLS/auth/quota tests, representative load test, a fix pass and final regression. Report command & actual results.
- Record `playwright-report/` HTML as artifact path in repo; never store secrets in trace/video; use fake dummy customer content; `.gitignore` test results if required.

## 6. Manual cross-device checklist (not replaceable by emulation)
Real iPhone Safari and Android Chrome: getUserMedia permission allow/deny; front/back switching; page background/resume; mic voice MIME; video 15sec playable; canvas/export orientation, memory impact; photo save/upload on venue mobile data; QR camera scanner; share sheet. Mark `NOT_TESTED_REAL_DEVICE` if devices unavailable, never mark PASS based on WebKit emulation only.

## 7. Completion proof
Screenshot or trace for Direct Mini no-frame + guest gallery, Partner self-edit + saved output, admin fulfillment; output of `pnpm exec playwright --version`, full suite summary per browser, failed/skipped with reasons, HTML report directory, timestamp and commit id. Empty tests / green with only placeholder assertions are not acceptable.
