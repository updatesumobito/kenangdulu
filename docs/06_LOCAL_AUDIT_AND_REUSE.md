# LOCAL AUDIT & CODE REUSE — v2 REQUIREMENTS

## New contract
- **Source repos are not to be edited**: `C:\Users\user\Music\mokabooth` and `C:\Users\user\Music\BOOKING`. Audit `git status`, package/runtime metadata, lockfiles, license, source modules (camera-web, frame-editor, canvas renderer, filters, QR) and proven BOOKING token files. Do not copy whole folders or private assets.
- **Complete web build must follow audit immediately**; do not stop after preparing audit docs or preview as if finished. Copy/adapt only web-compatible reusable TS/React with licensing provenance; native SDK/Windows Rust/Tauri remains last.
- Inspect BOOKING actual nav, button, table, form, card, font and color tokens, record source path and line. Brand tokens may differ from separate wedding gallery theme; fallback is not proof.
- Distinguish direct buyer (no editor), assigned platform designer (editor), partner owner/admin (frame editor entitled), partner Mini (no frame), guest Mini (no frame). Reuse component must not accidentally expose editor to buyer or bundle heavy JS into Mini.
- E2E tooling is installed in target new repo, never in source; note Playwright separately from browser bundle (dev-only).
- Evidence files: `MOKABOOTH_REUSE_MATRIX.md`, `BOOKING_DESIGN_EXTRACTION.md`, `LICENSE_REVIEW.md`, `CODE_ORIGIN_MANIFEST.md` with path:line/commit/hash if available and risk.

---

## TECHNICAL REFERENCE (v1 details; use only where consistent with v2)

# LOCAL AUDIT & SAFE REUSE SOP — MOKABOOTH + KOMUKUNABOOKING

## 0. Immutable rule
**DO NOT** alter, move, delete, reset, reformat or build-release source projects in:
`C:\Users\user\Music\mokabooth` and `C:\Users\user\Music\BOOKING` without explicit separate user permission. **Read-only inspection first.** Never copy environment secrets, auth tokens, `.env`, `.git`, compiled binaries, private customer photos, proprietary licensed assets without checking rights. User supplied paths may be inaccessible to remote environments; report evidence honestly.

## 1. Verify paths, source status and tools
PowerShell commands for agent on Windows:
```powershell
$Moka = 'C:\Users\user\Music\mokabooth'
$Booking = 'C:\Users\user\Music\BOOKING'
Test-Path $Moka; Test-Path $Booking
Get-ChildItem $Moka -Force | Select-Object -First 35 Name,Mode
Get-ChildItem $Booking -Force | Select-Object -First 35 Name,Mode
```
If multiple nested workspace roots exist, locate `package.json`, `pnpm-workspace.yaml`, `Cargo.toml`, `src-tauri`, `next.config.*`, `vite.config.*`, `tailwind.config.*`, `app/globals.css`, `src/index.css`, `design.md`, `docs`. Record SHA and path for reused files, no secret content in report. Check `git status` read-only and record dirty status without modifying it. Do not run recursive command on all `node_modules`/build outputs.

## 2. Audit Mokabooth candidates
Inventory in `docs/audit/MOKABOOTH_REUSE_MATRIX.md` with columns: `feature`, `actual source path`, `language/framework`, `dependencies`, `license`, `portable as-is / adapter / rewrite`, `estimated risk`, `selected plan`, `test fixture`.

Checklist:
- Camera abstraction for webcam / OBS / Camo virtual camera; distinguish desktop SDK-specific code (must stay Windows).
- Welcome screen & capture flow state machines and any React UI.
- Frame layout builder, drag handles, crop, multiple layers, z-order, undo/redo/save.
- Renderer or canvas engine: exported dimensions, resize, photo slot geometry and transparent overlays.
- QR generation/result/download, clip/media outputs and gallery interface.
- Printer, USB drivers, Canon/Sony/Nikon native SDK, Rust/Tauri: **DO NOT migrate into browser**.
- Licensing & asset provenance; if no clear reuse rights do not copy, implement independently and record reasoning.
- Decide between (a) extract shared TS package with source map, (b) adapt into new wrapper, (c) reimplement around browser Media APIs. Avoid importing entire desktop app.

For each chosen module write a behavioral test/visual reference first: e.g., same frame schema + same images => same pixel arrangement/crop at known dimensions. Do not blindly migrate broken UI if its UX does not match DESIGN.

## 3. Audit BOOKING design source of truth
Create `docs/audit/BOOKING_DESIGN_EXTRACTION.md` with:
- Actual brand palette HEX/HSL from CSS & config; mark `verified` and exact source file.
- Font families and actual loading/sizes/weights; icon system, spacing, radius, shadows, border.
- Actual sample screenshots of landing, dashboard, forms, cards, modal, mobile nav at widths >= 360/768/1280 (if browser can run).
- UI primitives that can be adapted without carrying business booking domain logic.
- Interaction patterns (button, toast, empty/loading, calendar wizard, error messaging, breakpoints).
- Contrast audit for new photobooth contexts.
- Semantic token mapping: `sourceToken` -> `--kv-*` and event theme unaffected.

**Critical:** `BOOKING` is not JADENSA, and the Komukuna Gallery wedding palette is not proof of `BOOKING` global palette. Do not substitute either by assumption. If source unreadable, use fallback noted as provisional, and call out the deviation in audit summary. Never claim 1:1 styling without visual comparison.

## 4. Required evidence deliverables
```text
docs/audit/
  AUDIT_SUMMARY.md
  SOURCE_TREE_BOOKING.md
  SOURCE_TREE_MOKABOOTH.md
  BOOKING_DESIGN_EXTRACTION.md
  MOKABOOTH_REUSE_MATRIX.md
  REUSE_DECISIONS.md
  LICENSE_AND_DEPENDENCY_RISKS.md
  BEFORE_AFTER_UI_NOTES.md
```
For actual reuse: record exact source project relative path, source commit hash if Git exists, destination file, edits/adapters needed, tests and license. If task cannot inspect source, set `NOT_VERIFIED` and avoid premature extraction.

## 5. Safe project creation rules
- New destination suggested `C:\Users\user\Music\komukuna-virtual` (unless already exists; preserve existing directory).
- If existing repo, work in branch/worktree, no destructive reset, no overwriting user modifications.
- Copy only files needed; use `git diff --stat` and verify untouched source repos remain unchanged.
- Do not reuse `.env`, credentials, cloud project IDs, real guest media, `node_modules`, bundled compiled packages, local browser profiles or private database dumps.
- Adapt source UI to guest-mobile and BOOKING design; don't perpetuate original rough layouts blindly.

## 6. Exit gate M0
M0 is complete only if path verification, audit docs, source-to-target mapping, stack decision ADR, draft verified design tokens, and working preview of one reused/adapted component exist. If original sources unavailable, explicitly mark M0 blocked for reuse; independent scaffolding may proceed only with documented provisional design.
