# Coding Agent Guide

## Goal

Define how coding agents should operate in this repository with low risk, high verification quality, and useful handoffs for the next human or agent.

This repo is small, but it has several behavior contracts that are easy to break if an agent edits only one render path, ignores category-aware title rules, or forgets the host-page selector contract.

## Repository Context

- Runtime: browser component bundled with webpack
- Main logic: `src/index.js`
- Styles: `src/styles/main.scss`
- Build outputs: `dist/threatened-species-factsheet.js`, `dist/threatened-species-factsheet.css`
- Local dataset: `get-threatened-plant-species.json`
- Local harness: `example.html`
- Main build config: `webpack.config.js`

## Core Invariants

Do not violate these without explicit instruction:

1. Keep auto-initialization on `DOMContentLoaded`.
2. Keep the mount selector `#content_area`.
3. Keep the sidebar selector `.col-md-4.my-4.d-print-none`.
4. Preserve metadata updates for document title, H1, breadcrumb, and fauna subtitle.
5. Preserve escaped rendering by default.
6. Preserve category-aware lookup.
   - Fauna: `common_name` first, then `scientific_name`
   - Flora: `scientific_name` only
7. Preserve Export to PDF modal behavior.
8. Preserve category-aware title rules.
   - Flora H1 is always italic scientific name, with no subtitle.
   - Fauna H1 uses common name when present, with scientific subtitle.
9. Preserve the split render model.
   - `generateFactsheetHTML()` for the main page
   - `generatePrintableHTML()` for the modal preview and PDF source
10. Preserve the Conservation status section near the top of the factsheet and keep it readable in both page and printable views.

## Code Hotspots

Agents should know where the risky areas live.

### `src/index.js`

High-risk methods:

- `fetchSpeciesData()`: lookup rules and endpoint behavior
- `populateSidebarNavigation()`: sidebar rendering and PDF-button lifecycle
- `updatePageMetadata()`: H1, subtitle, breadcrumb, document title
- `generatePrintableHTML()`: printable content and modal-preview layout
- `generatePDF()`: export workflow and UI state
- `generateFactsheetHTML()`: main factsheet HTML and accordion structure
- `update()`: the glue between render, metadata, and sidebar updates

### `src/styles/main.scss`

High-risk areas:

- `.factsheet-subtitle`
- `.conservation-status-section`
- `.conservation-status-alert`
- `.status-text`
- accordion rules
- print-preview rules
- `@media print` rules

## Required Pre-Edit Checks

Before any edits:

1. Read the relevant code in `src/index.js` and styles in `src/styles/main.scss`.
2. Check git status and avoid reverting unrelated user changes.
3. Identify whether both render paths need the same change.
4. Identify whether docs require updates.
5. If lookup or title logic is touched, plan the full matrix validation.
6. If PDF behavior is touched, include the localhost caveat in the validation notes.

## Standard Execution Procedure

1. Implement source changes in `src/` unless the task explicitly requires more.
2. Do not hand-edit `dist/`; run `npm run build` instead.
3. Validate behavior in `example.html` with the required scenario URLs.
4. Update docs when behavior, selectors, workflows, or assumptions changed.
5. Report outcomes with explicit pass, fail, or blocked statements.

## Agent Change Heuristics

Use these as fast checks while editing:

1. If a change affects displayed content sections, inspect both `generateFactsheetHTML()` and `generatePrintableHTML()`.
2. If a change affects the page title or subtitle, inspect both `update()` and `updatePageMetadata()`.
3. If a change affects the sidebar, confirm the PDF button still initializes after the sidebar render.
4. If a change affects styling around print or modal preview, inspect both normal styles and `@media print` rules.
5. If a change affects species lookup, never rely on flora `common_name` behavior.

## Required Validation Matrix

### Build Validation

```bash
npm run build
```

Pass criteria:

1. Build completes successfully.
2. No new compile errors from agent changes.

### Runtime Baseline Validation

1. Open `http://localhost:8080/example.html`.
2. Confirm factsheet content renders.
3. Confirm sidebar renders.
4. Confirm map behavior is correct for the selected species.
5. Confirm the Conservation status block looks correct if present.

### Lookup Validation

1. `?species=Northern+Quoll` validates fauna common-name lookup.
2. `?species=Dasyurus+hallucatus` validates fauna scientific fallback.
3. `?species=Freycinetia+excelsa` validates flora scientific lookup.
4. `?species=InvalidSpeciesName` validates the not-found state.

### Title and Subtitle Validation

1. `?species=Freycinetia+excelsa` shows italic scientific H1 and no subtitle.
2. `?species=Luisia+corrugata` shows italic scientific H1 and no subtitle.
3. `?species=Northern+Quoll` shows common-name H1 and scientific subtitle.
4. Breadcrumb and document title match expected display behavior.

### Export to PDF Validation

1. Sidebar button label is Export to PDF.
2. Modal opens.
3. Preview content matches the selected species.
4. Download button is enabled when idle.
5. Conservation status remains legible in preview if present.

### Localhost Caveat Handling

If PDF download fails locally due to CORS or image capture:

1. Mark it as environment-specific unless reproduced in DEV.
2. Confirm modal and preview behavior still pass.
3. Recommend DEV validation for full download confidence.

## Documentation Update Rules

When a change affects behavior or contract, update:

1. `README.md`
2. `docs/DEVELOPER_GUIDE.md`
3. `docs/CODING_AGENT_GUIDE.md`
4. `.github/copilot-instructions.md` only if AI workflow assumptions or persistent project rules changed

Terminology rule:

- Use Export to PDF consistently across docs and handoff notes.

Consistency rule:

- Keep README, developer docs, and agent docs aligned when behavior changes.

## Common Failure Modes

1. Breaking selectors used by mount or sidebar logic.
2. Regressing fauna common-name lookup fallback.
3. Using flora `common_name` for H1 display.
4. Rendering `.factsheet-subtitle` for flora species.
5. Updating only the main render path and forgetting the printable render path.
6. Editing `dist/` manually instead of rebuilding.
7. Ignoring localhost versus DEV differences for final PDF generation.
8. Breaking print layout with seemingly harmless spacing or wrapper changes.

## Expected Handoff Content

Agent responses should include:

1. What changed and why.
2. Files changed.
3. Commands executed.
4. Validation results.
5. Caveats or limitations.
6. Lookup matrix pass or fail if lookup logic was touched.
7. Title and subtitle matrix pass or fail if title logic was touched.
8. PDF matrix pass or fail if modal or export logic was touched.
9. Documentation updates made, if any.

## Stop Conditions

Only stop when:

1. The requested change is implemented.
2. Validation is complete or blocked with an explicit reason.
3. Documentation updates are complete for impacted behavior.
4. The final response contains concrete evidence of outcomes rather than assumptions.
