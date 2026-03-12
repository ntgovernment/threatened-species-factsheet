# Coding Agent Guide

## Goal

This guide defines how coding agents should operate in this repository with minimal risk and high verification quality.

## Project Context

- Runtime type: browser component bundled with webpack
- Main logic: `src/index.js`
- Styles: `src/styles/main.scss`
- Build outputs: `dist/threatened-species-factsheet.js`, `dist/threatened-species-factsheet.css`
- Local test data: `get-threatened-plant-species.json`

## Non-Negotiable Invariants

1. Keep auto-initialization on DOMContentLoaded.
2. Keep main mount selector: `#content_area`.
3. Keep sidebar mount selector: `.col-md-4.my-4.d-print-none`.
4. Preserve metadata updates for page title, `<h1>`, and breadcrumb.
5. Preserve default safe HTML rendering.
6. Preserve category-aware lookup:
   - Fauna: `common_name` first, then `scientific_name`
   - Flora: `scientific_name` only
7. Preserve Export to PDF modal behavior.

## Required Pre-Edit Checks

1. Read relevant logic in `src/index.js` and related styles in `src/styles/main.scss`.
2. Check for uncommitted changes and do not revert unrelated work.
3. Confirm whether the change requires rebuilding dist assets.
4. If touching lookup, confirm data still provides `category` and `scientific_name`.

## Execution Procedure

1. Change source files in `src/`.
2. Build with `npm run build`.
3. Validate behavior in `example.html`.
4. Update documentation if behavior or contract changed.
5. Summarize outcomes with explicit limitations.

## Validation Requirements

### Build

```bash
npm run build
```

### Runtime Baseline

1. Open `http://localhost:8080/example.html`.
2. Confirm content and sidebar render.
3. Confirm map renders for the selected species.

### Species Lookup Matrix

1. `?species=Northern+Quoll` validates fauna common-name lookup.
2. `?species=Dasyurus+hallucatus` validates fauna scientific fallback.
3. `?species=Freycinetia+excelsa` validates flora scientific lookup.
4. `?species=InvalidSpeciesName` validates not-found handling.

### Export to PDF Matrix

1. Sidebar button label is Export to PDF.
2. Modal opens successfully.
3. Preview content corresponds to selected species.
4. Download button is enabled when not generating.

### Localhost Caveat Handling

If PDF download fails due to CORS/image capture on localhost:

- report this as environment-specific
- confirm modal/preview behavior still works
- recommend DEV environment validation for full export

## Documentation Rules for Agents

Update docs when the change affects behavior, assumptions, selectors, or workflows.

Primary docs:

- `README.md`
- `docs/DEVELOPER_GUIDE.md`
- `docs/CODING_AGENT_GUIDE.md`
- `.github/copilot-instructions.md` when AI workflow assumptions change

## Frequent Failure Modes

- changing selectors used for mount points
- breaking fauna common-name fallback logic
- assuming flora records always have common names
- editing dist manually instead of building
- ignoring localhost vs DEV environment differences for PDF export

## Handoff Template for Agent Responses

Always include:

1. What changed and why.
2. Files changed.
3. Build and test commands executed.
4. Validation outcomes.
5. Known caveats or environment-specific limitations.
6. If lookup changed, explicit pass/fail status for all four lookup scenarios.

## Model Identity

If asked what model is in use, respond with GPT-5.3-Codex.
