# Threatened Species Factsheet

Redistributable JavaScript and CSS bundles for rendering threatened species factsheets on NT.GOV.AU pages.

This project is designed to embed into NT Base host pages with minimal visual disruption and predictable runtime behavior.

## Documentation Map

Use the docs by role:

- Developers: [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md)
- Coding agents: [docs/CODING_AGENT_GUIDE.md](docs/CODING_AGENT_GUIDE.md)
- AI baseline and constraints: [.github/copilot-instructions.md](.github/copilot-instructions.md)

## What This Component Does

1. Fetches species data from local JSON or API endpoint.
2. Resolves target species from the `?species=` URL query.
3. Applies category-aware lookup rules (Fauna vs Flora).
4. Renders factsheet content and sidebar media.
5. Updates page metadata (`<title>`, `<h1>`, breadcrumb).
6. Provides an Export to PDF modal and download workflow.

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Start local server

```bash
npm run serve
```

Open one of these URLs:

- `http://localhost:8080/example.html`
- `http://localhost:8080/example.html?species=Northern+Quoll`
- `http://localhost:8080/example.html?species=Freycinetia+excelsa`

### 3. Build production bundles

```bash
npm run build
```

Build artifacts:

- `dist/threatened-species-factsheet.js`
- `dist/threatened-species-factsheet.css`

## Commands

```bash
npm run dev      # webpack watch mode
npm run serve    # webpack dev server (port 8080)
npm run build    # production build
npm run clean    # remove dist/
```

## Architecture Snapshot

- Main class: `ThreatenedSpeciesFactsheet` in `src/index.js`
- Styles: `src/styles/main.scss`
- Local dataset: `get-threatened-plant-species.json`
- Integration harness: `example.html`

Auto-initialization runs on `DOMContentLoaded` when `#content_area` exists.

## Species Lookup Rules

Lookup behavior is intentionally category-aware:

1. No `?species=` parameter: load first species in dataset.
2. Fauna: match `common_name` first, then fallback to `scientific_name`.
3. Flora: match `scientific_name` only.
4. Matching is case-insensitive.

Examples:

```text
?species=Northern+Quoll
?species=Dasyurus+hallucatus
?species=Freycinetia+excelsa
```

## Title and Subtitle Rules

Title rendering is category-aware and drives `<h1>`, breadcrumb, and document title.

| Aspect | Fauna | Flora |
| --- | --- | --- |
| H1 | `common_name` (non-italic) when present, else italic `scientific_name` | Italic `scientific_name` always |
| `.factsheet-subtitle` | Shown in italic with `scientific_name` only when H1 uses `common_name` | Never shown |
| Breadcrumb | Mirrors H1 formatting | Italic `scientific_name` |
| Document title | `displayName - Factsheet | NT.GOV.AU` | `scientific_name - Factsheet | NT.GOV.AU` |

Flora `common_name` values may exist in data, but are intentionally ignored for title display.

## Host Page Contract

Required DOM targets:

- `#content_area` for main factsheet rendering
- `.col-md-4.my-4.d-print-none` for sidebar media and Export to PDF controls
- `<h1>` for dynamic page heading
- `.breadcrumb-item.active` for breadcrumb label

Required host assets:

- `dist/threatened-species-factsheet.css`
- `dist/threatened-species-factsheet.js`
- Bootstrap JavaScript (modal support)

## Security Model

1. Content is escaped by default to prevent XSS.
2. `allowHtml` is only for trusted and sanitized HTML.
3. Never inject unsanitized user-provided HTML into render paths.

## Testing Checklist

Before merge, verify:

1. Build succeeds with `npm run build`.
2. Lookup matrix passes:
   - `?species=Northern+Quoll`
   - `?species=Dasyurus+hallucatus`
   - `?species=Freycinetia+excelsa`
   - `?species=InvalidSpeciesName`
3. Title/subtitle rendering matches category rules.
4. Sidebar, map, and related information render.
5. Export to PDF modal opens and preview is correct.

## Localhost PDF Caveat

PDF download can fail on localhost due to cross-origin image capture restrictions.

Typical symptom:

- `An error occurred while generating the PDF. Please try again.`

Recommended split:

1. Localhost: validate modal open, preview, and pagination.
2. DEV environment: validate full PDF download behavior.

## Deployment Model

- Working branch: `dev`
- Production branch: `main`
- Squiz DEV tracks `dev`
- Squiz PROD tracks `main`
- Release flow: merge `dev` to `main`

CloudFlare caching can delay visible updates after deployment.

## Cost and Bundle Considerations

Because storage and traffic are billed:

1. Keep dependencies minimal.
2. Run production build before merge.
3. Monitor `dist/` size after large changes.

## Definition of Done

1. Source changes are in `src/`.
2. Build succeeds.
3. Runtime behavior is validated in `example.html`.
4. No regressions in lookup, metadata, sidebar, or PDF modal.
5. Docs are updated when behavior or assumptions change.

## License

ISC
