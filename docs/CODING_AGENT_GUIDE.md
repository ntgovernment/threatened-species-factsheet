# Coding Agent Guide

## Goal

Define how coding agents should operate in this repository with low risk, high verification quality, and clear handoffs.

## Repository Context

- Runtime: browser component bundled with webpack
- Main logic: `src/index.js`
- Styles: `src/styles/main.scss`
- Build outputs: `dist/threatened-species-factsheet.js`, `dist/threatened-species-factsheet.css`
- Local test data: `get-threatened-plant-species.json`
- Integration harness: `example.html`

## Core Invariants

Do not violate these without explicit instruction:

1. Keep auto-initialization on `DOMContentLoaded`.
2. Keep mount selector `#content_area`.
3. Keep sidebar selector `.col-md-4.my-4.d-print-none`.
4. Preserve metadata updates for document title, H1, and breadcrumb.
5. Preserve safe escaped rendering by default.
6. Preserve category-aware lookup:
   - Fauna: `common_name` then `scientific_name`
   - Flora: `scientific_name` only
7. Preserve Export to PDF modal behavior.
8. Preserve category-aware title rules:
   - Flora H1 is always italic scientific name, with no subtitle.
   - Fauna H1 uses common name when present, with scientific subtitle.

## Required Pre-Edit Checks

Before any edits:

1. Read relevant code in `src/index.js` and styles in `src/styles/main.scss`.
2. Check git status and avoid reverting unrelated user changes.
3. Identify whether docs require updates for this change.
4. If lookup/title logic is touched, plan full matrix validation.
5. If PDF behavior is touched, include localhost caveat in validation notes.

## Standard Execution Procedure

1. Implement source changes only in `src/` unless instructed otherwise.
2. Run `npm run build`.
3. Validate behavior in `example.html` with required scenario URLs.
4. Update docs when behavior, selectors, workflows, or assumptions changed.
5. Report outcomes with explicit pass/fail checks and caveats.

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
2. Confirm content renders.
3. Confirm sidebar renders.
4. Confirm selected species map behavior is correct.

### Lookup Validation

1. `?species=Northern+Quoll` validates fauna common-name lookup.
2. `?species=Dasyurus+hallucatus` validates fauna scientific fallback.
3. `?species=Freycinetia+excelsa` validates flora scientific lookup.
4. `?species=InvalidSpeciesName` validates not-found state.

### Title and Subtitle Validation

1. `?species=Freycinetia+excelsa` shows italic scientific H1 and no subtitle.
2. `?species=Luisia+corrugata` shows italic scientific H1 and no subtitle.
3. `?species=Northern+Quoll` shows common-name H1 and scientific subtitle.
4. Breadcrumb and document title match expected display behavior.

### Export to PDF Validation

1. Sidebar button label is Export to PDF.
2. Modal opens.
3. Preview content matches selected species.
4. Download button is enabled when idle.

### Localhost Caveat Handling

If PDF download fails locally due to CORS/image capture:

1. Mark as environment-specific unless reproduced in DEV.
2. Confirm modal and preview behavior still pass.
3. Recommend DEV validation for full download confidence.

## Documentation Update Rules

When change scope affects behavior or contract, update:

1. `README.md`
2. `docs/DEVELOPER_GUIDE.md`
3. `docs/CODING_AGENT_GUIDE.md`
4. `.github/copilot-instructions.md` only if AI workflow assumptions changed

Terminology rule:

- Use Export to PDF consistently across all docs and handoff notes.

## Common Failure Modes

1. Breaking selectors used by mount/sidebar logic.
2. Regressing fauna common-name lookup fallback.
3. Using flora `common_name` for H1 display.
4. Rendering `.factsheet-subtitle` for flora species.
5. Editing `dist/` manually instead of building.
6. Ignoring localhost vs DEV differences for final PDF generation.

## Response and Handoff Template

Agent responses should always include:

1. What changed and why.
2. Files changed.
3. Commands executed.
4. Validation results.
5. Caveats or limitations.
6. Lookup matrix pass/fail if lookup logic touched.
7. Title/subtitle matrix pass/fail if title logic touched.
8. PDF matrix pass/fail if modal or export logic touched.

## Stop Conditions

Only stop when:

1. Requested change is implemented.
2. Validation is complete or blocked with explicit reason.
3. Documentation updates are complete for impacted behavior.
4. Final response includes concrete evidence of outcomes.
