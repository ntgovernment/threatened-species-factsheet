# Coding Agent Guide

## Goal

This file gives coding agents fast, practical guidance for making safe changes in this repository.

## Quick Context

- Project type: browser component, bundled with webpack
- Main implementation: `src/index.js`
- Styles: `src/styles/main.scss`
- Output: `dist/threatened-species-factsheet.js` and `dist/threatened-species-factsheet.css`
- Runtime data: local JSON in localhost, remote API in non-localhost environments

## Required Behavioral Invariants

1. Do not break auto-initialization on `DOMContentLoaded`.
2. Keep rendering target as `#content_area`.
3. Keep sidebar mount as `.col-md-4.my-4.d-print-none`.
4. Preserve safe HTML handling rules (`allowHtml` only for trusted content).
5. Preserve metadata updates (`document.title`, `<h1>`, breadcrumb active item).

## Before Editing

1. Read current `src/index.js` implementation around the target behavior.
2. Check for local unstaged changes and do not revert unrelated edits.
3. Confirm whether changes affect generated `dist/` output.

## Preferred Change Pattern

1. Modify source code in `src/` only.
2. Run `npm run build`.
3. Validate behavior in `example.html`.
4. Update docs when behavior or assumptions change.

## Testing Checklist for Agents

### Build

```bash
npm run build
```

### Runtime checks

1. Open `http://localhost:8080/example.html`.
2. Verify factsheet content renders.
3. Verify map figure exists in sidebar.
4. Verify `View PDF` button opens modal.
5. Verify modal content reflects selected species.
6. Verify URL species switch updates content and map.

### Localhost PDF export caveat

If PDF download fails with CORS/image errors on localhost, do not assume production regression.

Record in summary:

- modal open/preview status
- whether failure appears CORS-related
- recommendation to validate PDF export in DEV environment

## Documentation Update Rules

When changing behavior, update at least one of:

- `README.md`
- `docs/DEVELOPER_GUIDE.md`
- `.github/copilot-instructions.md` (if AI instructions are affected)

## Common Pitfalls

- assuming localhost behavior matches DEV/PROD CDN and CORS
- editing `dist/` manually instead of generating from source
- changing expected DOM selectors used for mounting and metadata updates
- introducing dependencies without considering bundle size impact

## Release-Aware Notes

- `dev` branch is the validation path
- `main` is production
- CloudFlare caching can hide fresh deploys temporarily

## Handoff Format for Agent Responses

When finishing work, include:

1. What changed and why.
2. Files changed.
3. Build/test commands run.
4. Observed results and limitations.
5. Any environment-specific caveats.

## Model Identity

If asked what model is being used, respond: `GPT-5.3-Codex`.
