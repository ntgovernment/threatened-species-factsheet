# Developer Guide

## Purpose

This guide is the operational reference for human contributors.
Use it to make changes safely, validate behavior consistently, and ship with confidence.

## System Overview

This project builds redistributable UMD assets:

- `dist/threatened-species-factsheet.js`
- `dist/threatened-species-factsheet.css`

These artifacts are consumed by NT.GOV.AU pages through Squiz Matrix and Git File Bridge.

Primary source files:

- `src/index.js`: component logic, data lookup, metadata updates, PDF modal flow
- `src/styles/main.scss`: styling for content, states, sidebar media, and modal preview
- `get-threatened-plant-species.json`: local dataset for development and validation
- `example.html`: local integration harness

## Runtime Flow

On `DOMContentLoaded`:

1. Locate `#content_area`.
2. Instantiate `ThreatenedSpeciesFactsheet`.
3. Resolve local or production data endpoint.
4. Parse `?species=` URL query.
5. Fetch species data and resolve selected species.
6. Render factsheet content and sidebar media.
7. Update page metadata and wire Export to PDF behavior.

## Data Contract

### Fields Required for Lookup

- `category`
- `scientific_name`
- `common_name` (required for fauna common-name lookup)

### Fields Used by Rendering

- `family_name`
- `conservation_status_nt`
- `conservation_status_australia`
- `description`
- `distribution`
- `ecology_and_life_history`
- `threatening_processes`
- `conservation_objectives_and_management`
- `references`
- `map_image_name`
- `image_credit`
- `related_information`

## Category-Aware Behavior Rules

These rules are core behavior and should not change unintentionally.

### Species Lookup Rules

1. Missing `?species=`: load first record.
2. Fauna: search `common_name` first, then `scientific_name` fallback.
3. Flora: search `scientific_name` only.
4. Matching is case-insensitive.

### Title and Metadata Rules

`update()` applies category-aware title logic before metadata updates.

Flora (`category === "Flora"`):

1. H1: italic `scientific_name` always.
2. Breadcrumb: italic `scientific_name`.
3. Document title: `scientific_name - Factsheet | NT.GOV.AU`.
4. `.factsheet-subtitle`: never rendered.

Fauna (all other categories):

1. H1: `common_name` (non-italic) when available.
2. H1 fallback: italic `scientific_name` when no `common_name`.
3. `.factsheet-subtitle`: italic `scientific_name` shown below H1 only when H1 uses `common_name`.
4. Breadcrumb and document title mirror display name behavior.

Note: The modal title and printable preview title use `common_name || scientific_name` by design and are separate from H1 rules.

## Host Integration Contract

Required host DOM:

- `#content_area`
- `.col-md-4.my-4.d-print-none`
- `<h1>`
- `.breadcrumb-item.active`

Required host assets:

- Factsheet CSS bundle
- Factsheet JS bundle
- Bootstrap JavaScript for modal support

## Security Requirements

1. Default rendering must remain escaped.
2. `allowHtml` is only for trusted and sanitized content.
3. Never pass unsanitized user HTML into render methods.

## Development Workflow

### Commands

```bash
npm install
npm run serve
npm run dev
npm run build
```

### Standard Change Flow

1. Update source in `src/`.
2. Build with `npm run build`.
3. Validate behavior in `example.html` using scenario URLs.
4. Check browser console for regressions.
5. Update docs if behavior, selectors, or assumptions changed.

## Validation Matrix

### Baseline Runtime

1. Open `http://localhost:8080/example.html`.
2. Confirm factsheet content renders.
3. Confirm sidebar media region renders.
4. Confirm map behavior matches selected species.

### Lookup Scenarios

1. `?species=Northern+Quoll` resolves fauna by `common_name`.
2. `?species=Dasyurus+hallucatus` resolves same fauna via `scientific_name` fallback.
3. `?species=Freycinetia+excelsa` resolves flora by `scientific_name`.
4. `?species=InvalidSpeciesName` shows not-found UI.

### Title and Subtitle Scenarios

1. `?species=Freycinetia+excelsa` shows italic scientific name in H1; no subtitle element.
2. `?species=Luisia+corrugata` shows italic scientific name in H1; no subtitle element.
3. `?species=Northern+Quoll` shows common name in H1 and scientific name subtitle.
4. Breadcrumb and document title match expected display behavior.

### Export to PDF Scenarios

1. Sidebar button text is Export to PDF.
2. Modal opens successfully.
3. Preview content corresponds to selected species.
4. Download button is enabled when idle.

## Localhost Caveat

Final PDF generation can fail on localhost due to CORS and image capture restrictions.

If this occurs:

1. Treat as environment-specific unless reproduced in DEV.
2. Verify modal and preview behavior locally.
3. Validate final PDF download in the DEV environment.

## Deployment and Release

- Working branch: `dev`
- Production branch: `main`
- Squiz DEV references `dev`
- Squiz PROD references `main`
- Release action: merge `dev` into `main`

CloudFlare caching may delay visible updates after deployment.

## Cost and Bundle Guardrails

Storage and traffic are billed, so:

1. Avoid unnecessary dependencies.
2. Keep generated bundles lean.
3. Run production build before merge.
4. Monitor output size after large features.

## Troubleshooting

### Species not found

1. Confirm `?species=` is URL encoded (`+` for spaces).
2. Confirm species exists in dataset/API.
3. Confirm `category` and `scientific_name` fields are present.

### Sidebar missing

1. Confirm `.col-md-4.my-4.d-print-none` exists on page.
2. Confirm JS bundle loads and runs after DOM readiness.

### Modal not opening

1. Confirm Bootstrap JS is loaded.
2. Confirm sidebar was rendered before modal interaction.

### PDF fails on localhost

1. Inspect console/network for CORS failures.
2. Validate full export in DEV environment.

### Dist appears stale

1. Run `npm run build`.
2. Confirm correct branch/environment was deployed.
3. Hard refresh browser to bypass cache.

## Definition of Done

1. Lookup behavior passes all four lookup scenarios.
2. Title/subtitle behavior passes category-aware scenarios.
3. Export to PDF modal still works.
4. Production build succeeds.
5. No obvious console regressions.
6. Documentation updated if contracts changed.
