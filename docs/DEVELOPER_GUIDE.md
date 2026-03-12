# Developer Guide

## Purpose

This guide is the primary operational reference for human contributors.
Use it to understand architecture, make changes safely, validate behavior, and release with confidence.

## Build Outputs

This project builds redistributable UMD assets:

- `dist/threatened-species-factsheet.js`
- `dist/threatened-species-factsheet.css`

These files are consumed by NT.GOV.AU pages through Squiz Matrix and Git File Bridge.

## Source of Truth Files

- `src/index.js`: component logic and runtime behavior
- `src/styles/main.scss`: styles for content, sidebar, states, and print modal
- `get-threatened-plant-species.json`: local development/test data
- `example.html`: local integration harness

## Runtime Architecture

### Initialization Flow

On DOMContentLoaded:

1. Locate `#content_area`.
2. Instantiate `ThreatenedSpeciesFactsheet`.
3. Resolve local or production API endpoint.
4. Parse `?species=` from URL.
5. Fetch and resolve species data.
6. Render content and sidebar.
7. Initialize Export to PDF modal behavior.

### Render Responsibilities

- Main column: statuses, core sections, accordion content
- Sidebar: Export to PDF button, species image, map, related information
- Metadata updates: document title, page `<h1>`, breadcrumb active node

### Title and Metadata Display Rules

Title rendering is category-aware. The `update()` method checks `data.category` before calling `updatePageMetadata()`.

**Flora (`category === "Flora"`):**
- H1: italic `scientific_name` — `common_name` field is ignored for all title rendering
- Breadcrumb: italic `scientific_name`
- Document title: `scientific_name - Factsheet | NT.GOV.AU`
- `.factsheet-subtitle` element: never created

**Fauna (all other categories):**
- H1: `common_name` (non-italic) when present; italic `scientific_name` when no `common_name`
- Breadcrumb: mirrors H1 formatting
- Document title: `displayName - Factsheet | NT.GOV.AU`
- `.factsheet-subtitle`: italic `scientific_name` inserted immediately after `<h1>` only when H1 shows a common name

Note: The PDF modal title (`generateModalHTML`) and PDF preview header (`generatePrintableHTML`) use `common_name || scientific_name` regardless of category — this is intentional and separate from the page H1 behavior.

### Species Lookup Rules

Species lookup is category-aware and must stay stable.

1. No query parameter: use first species in dataset.
2. Fauna: search `common_name`, then fallback to `scientific_name`.
3. Flora: search `scientific_name` only.
4. Matching is case-insensitive.

Lookup examples:

| Query                          | Expected behavior                 |
| ------------------------------ | --------------------------------- |
| `?species=Northern+Quoll`      | Fauna by common name              |
| `?species=Dasyurus+hallucatus` | Fauna by scientific name fallback |
| `?species=Freycinetia+excelsa` | Flora by scientific name          |
| `?species=InvalidSpeciesName`  | Not-found state                   |

## Data Contract

### Required for Lookup

- `category`: differentiates Fauna vs Flora lookup behavior
- `scientific_name`: global unique species key
- `common_name`: required for fauna common-name queries

### Used for Rendering

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
- `related_information`

### Media Behavior Notes

- Image/map file naming is based on `scientific_name`.
- Missing images are hidden by runtime error handlers.
- Media naming behavior is independent from lookup behavior.

## Development Workflow

### Commands

```bash
npm install
npm run serve
npm run dev
npm run build
```

### Typical Change Flow

1. Update source in `src/`.
2. Build with `npm run build`.
3. Validate in `example.html` with target species queries.
4. Confirm no regression in sidebar, map, accordion, or PDF modal.
5. Update docs if behavior or assumptions changed.

## Validation Matrix

### Core Runtime

1. Open `http://localhost:8080/example.html`.
2. Confirm default species loads.
3. Confirm sidebar and map render.

### Lookup Coverage

1. `?species=Northern+Quoll` resolves fauna by common name.
2. `?species=Dasyurus+hallucatus` resolves same fauna via fallback.
3. `?species=Freycinetia+excelsa` resolves flora by scientific name.
4. `?species=InvalidSpeciesName` shows not-found UI.

### Title and Subtitle Coverage

1. `?species=Freycinetia+excelsa` → H1 shows *Freycinetia excelsa* (italic); no `.factsheet-subtitle` element present.
2. `?species=Luisia+corrugata` → H1 shows *Luisia corrugata* (italic); no `.factsheet-subtitle` (even though JSON has `common_name`).
3. `?species=Northern+Quoll` → H1 shows "Northern Quoll" (non-italic); `.factsheet-subtitle` shows *Dasyurus hallucatus* in italic.
4. Breadcrumb and document title match H1 display name in all cases.

### Export to PDF Coverage

1. Confirm sidebar button label is Export to PDF.
2. Open modal and verify preview content matches selected species.
3. Verify pagination controls are functional.
4. Verify Download PDF button is enabled when idle.

### Localhost Caveat

On localhost, cross-origin image restrictions can break final PDF generation.
Treat this as environment-specific unless reproduced in DEV.

## Integration Contract for Host Pages

### Required DOM Targets

- `#content_area`
- `.col-md-4.my-4.d-print-none`
- `<h1>`
- `.breadcrumb-item.active`

### Required Assets

- factsheet CSS bundle
- factsheet JS bundle
- Bootstrap JavaScript for modal support

## Security Requirements

- Default rendering must stay escaped.
- `allowHtml` is for trusted/sanitized content only.
- Never feed unsanitized user HTML into render paths.

## Deployment and Release

- Working branch: `dev`
- Production branch: `main`
- DEV environment tracks `dev`
- PROD environment tracks `main`
- Standard release: merge `dev` to `main`

CloudFlare propagation may delay visible updates.

## Cost and Bundle Guardrails

Because storage and traffic are billed:

- avoid unnecessary dependencies
- verify production build before merge
- monitor dist size after significant changes

## Troubleshooting Guide

### Species Not Found

- verify URL encoding for spaces (`+`)
- confirm species exists in data source
- confirm category fields are present and correct

### Sidebar Missing

- verify required sidebar selector exists in host template

### Modal Not Opening

- verify Bootstrap JS is loaded
- verify modal initialization runs after sidebar render

### PDF Fails on Localhost

- confirm map/image CORS behavior in devtools
- validate full PDF export in DEV environment

### Dist Looks Stale

- rebuild with `npm run build`
- verify deployed branch/environment
- hard refresh to bypass cache

## Definition of Done

1. Behavior is correct for all lookup scenarios.
2. Export to PDF modal still opens and previews correctly.
3. Build succeeds.
4. No obvious console regressions.
5. Documentation is updated for any behavior change.
