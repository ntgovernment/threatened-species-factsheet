# Threatened Species Factsheet

Redistributable JavaScript and CSS bundles for rendering threatened species factsheets on NT.GOV.AU pages.

This component is designed for NT Base host pages and provides:

- factsheet content rendering
- sidebar media and related information
- Export to PDF modal and download workflow

## Who Should Read What

- Developers: `docs/DEVELOPER_GUIDE.md`
- Coding agents: `docs/CODING_AGENT_GUIDE.md`
- AI instruction baseline: `.github/copilot-instructions.md`

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Run local development server

```bash
npm run serve
```

Local URLs:

- `http://localhost:8080/example.html`
- `http://localhost:8080/example.html?species=Northern+Quoll`
- `http://localhost:8080/example.html?species=Freycinetia+excelsa`

### 3. Build distributable bundles

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
npm run clean    # remove dist/ (bash rm -rf)
```

## Architecture Snapshot

- Main class: `ThreatenedSpeciesFactsheet` in `src/index.js`
- Styles: `src/styles/main.scss`
- Local data source: `get-threatened-plant-species.json`
- Integration harness: `example.html`

Auto-initialization runs on `DOMContentLoaded` when `#content_area` exists.

High-level runtime flow:

1. Resolve environment and data URL.
2. Read `?species=` URL parameter.
3. Fetch species with category-aware lookup.
4. Render factsheet and sidebar.
5. Wire Export to PDF modal behavior.

## Species Lookup Rules

The lookup behavior is intentionally category-aware.

- Fauna: match `common_name` first, then fallback to `scientific_name`
- Flora: match `scientific_name` only
- Missing `?species=`: load first species in dataset

Examples:

```text
?species=Northern+Quoll
?species=Dasyurus+hallucatus
?species=Freycinetia+excelsa
```

## Title Display Rules

Title rendering is category-aware. The `update()` method in `src/index.js` determines what appears in the page `<h1>`, breadcrumb, and document title.

| Aspect | Fauna | Flora |
| --- | --- | --- |
| **H1** | `common_name` (non-italic) if present, else italic `scientific_name` | Italic `scientific_name` always |
| **`.factsheet-subtitle`** | Italic `scientific_name` shown below H1 when H1 uses `common_name` | Never shown |
| **Breadcrumb** | Matches H1 | Italic `scientific_name` |
| **Document title** | `displayName - Factsheet \| NT.GOV.AU` | `scientific_name - Factsheet \| NT.GOV.AU` |

Flora species may have a `common_name` in the data but it is intentionally ignored for all title rendering.

## Host Integration Contract

Expected host DOM:

- `#content_area`
- `.col-md-4.my-4.d-print-none`
- `<h1>`
- `.breadcrumb-item.active`

Required assets in host page:

- `threatened-species-factsheet.css`
- `threatened-species-factsheet.js`
- Bootstrap JavaScript for modal support

## Security Model

- HTML is escaped by default.
- `allowHtml` should only be used with trusted, sanitized content.
- Never inject unsanitized user-provided HTML into rendering paths.

## Localhost Caveat for PDF Export

PDF generation can fail on localhost if cross-origin image capture is blocked.

Common symptom:

- alert: `An error occurred while generating the PDF. Please try again.`

Recommended validation split:

- Localhost: validate modal open, preview, and pagination.
- DEV environment: validate final PDF generation and download.

## Branching and Deployment

- Development branch: `dev`
- Production branch: `main`
- Squiz DEV tracks `dev`
- Squiz PROD tracks `main`
- Release path: merge `dev` to `main`

CloudFlare caching can delay visible updates after deployment.

## Definition of Done for Changes

1. Source changes are in `src/`.
2. Build succeeds with `npm run build`.
3. Expected runtime behavior is verified in `example.html`.
4. No regressions in species lookup, sidebar rendering, or Export to PDF modal.
5. Relevant docs are updated when behavior or assumptions change.

## License

ISC
