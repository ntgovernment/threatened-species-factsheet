# Threatened Species Factsheet

Redistributable JavaScript and CSS bundles for rendering threatened species factsheets on NT.GOV.AU pages.

The component is designed to drop into NT Base host pages with predictable selectors, minimal styling conflict, and clear browser-side behavior. It fetches species data, resolves the target species from the URL, updates page metadata, renders sidebar media, and supports Export to PDF preview and download.

## Documentation Map

Use the docs by role:

- Developers: [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md)
- Coding agents: [docs/CODING_AGENT_GUIDE.md](docs/CODING_AGENT_GUIDE.md)
- AI baseline and repo constraints: [.github/copilot-instructions.md](.github/copilot-instructions.md)

## What This Component Does

1. Chooses a local JSON endpoint on localhost and the production API elsewhere.
2. Reads the `?species=` query parameter from the current page URL.
3. Applies category-aware lookup rules for fauna and flora.
4. Renders the main factsheet into `#content_area`.
5. Renders sidebar media and Export to PDF controls into `.col-md-4.my-4.d-print-none`.
6. Updates the document title, page H1, breadcrumb, and fauna subtitle.
7. Builds a printable modal preview and generates a PDF with `html2canvas` and `jsPDF`.

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Start the local server

```bash
npm run serve
```

Open one of these URLs:

- `http://localhost:8080/example.html`
- `http://localhost:8080/example.html?species=Northern+Quoll`
- `http://localhost:8080/example.html?species=Dasyurus+hallucatus`
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
npm run dev      # webpack watch mode for src/
npm run serve    # webpack dev server on port 8080
npm run build    # production bundle build
npm run clean    # remove dist/ (shell rm -rf, best run from Git Bash or compatible shell)
```

## Project Structure

- `src/index.js`: main browser component, data lookup, metadata updates, sidebar rendering, modal preview, PDF generation
- `src/styles/main.scss`: component styling, alert styling, sidebar media, accordion behavior, print and modal preview rules
- `get-threatened-plant-species.json`: local development dataset
- `example.html`: local integration harness that mirrors host-page expectations
- `dist/`: generated bundles only, never edit manually
- `docs/`: operational docs for developers and coding agents

## Architecture Snapshot

Main runtime entry point:

- `ThreatenedSpeciesFactsheet` in `src/index.js`

Important methods:

- `getSpeciesFromUrl()`: parses and decodes `?species=`
- `fetchSpeciesData()`: fetches data and applies category-aware lookup
- `populateSidebarNavigation()`: renders sidebar image, map, related information, and Export to PDF button
- `updatePageMetadata()`: updates document title, H1, breadcrumb, and fauna subtitle
- `generateFactsheetHTML()`: renders the main interactive factsheet view
- `generatePrintableHTML()`: renders the modal print-preview version
- `generatePDF()`: captures the preview and creates a PDF download

Auto-initialization runs on `DOMContentLoaded` when `#content_area` exists.

## Species Lookup Rules

Lookup behavior is intentionally category-aware and should be treated as a contract:

1. No `?species=` parameter: load the first species in the dataset.
2. Fauna: match `common_name` first, then fall back to `scientific_name`.
3. Flora: match `scientific_name` only.
4. Matching is case-insensitive.

Examples:

```text
?species=Northern+Quoll
?species=Dasyurus+hallucatus
?species=Freycinetia+excelsa
```

## Title and Subtitle Rules

Title rendering drives the document title, page H1, breadcrumb, and `.factsheet-subtitle`.

| Aspect | Fauna | Flora |
| --- | --- | --- |
| H1 | `common_name` when present, else italic `scientific_name` | Italic `scientific_name` always |
| `.factsheet-subtitle` | Shown in italic with `scientific_name` only when H1 uses `common_name` | Never shown |
| Breadcrumb | Mirrors H1 formatting | Italic `scientific_name` |
| Document title | `displayName - Factsheet | NT.GOV.AU` | `scientific_name - Factsheet | NT.GOV.AU` |

Flora `common_name` values may exist in data, but they are intentionally ignored for title display.

## Factsheet UI Notes

The top-level Conservation status block is rendered as an info-style alert and appears above the Description section.

Current behavior includes:

- Australia is listed before Northern Territory when both statuses exist.
- Main factsheet status items use semantic `role="status"` markup.
- Printable preview uses a simplified paragraph version of the same information.
- `.status-text` is intentionally larger and stronger than regular body text.

## Host Page Contract

Required DOM targets:

- `#content_area` for main factsheet rendering
- `.col-md-4.my-4.d-print-none` for sidebar media and Export to PDF controls
- `<h1>` for dynamic page heading
- `.breadcrumb-item.active` for breadcrumb label

Required host assets:

- `dist/threatened-species-factsheet.css`
- `dist/threatened-species-factsheet.js`
- Bootstrap JavaScript for modal support

Assumptions worth preserving:

- The page already provides NT Base typography and grid classes.
- The component should integrate without introducing a custom card shell around the entire factsheet.
- Sidebar selectors are hard-coded and are part of the integration contract.

## Security Model

1. Content is escaped by default to prevent XSS.
2. `allowHtml` should only be enabled for trusted, sanitized HTML from known sources.
3. `renderContent()` removes empty paragraphs but otherwise assumes the caller owns sanitization when HTML is allowed.
4. Never inject unsanitized user-provided HTML into render paths.

## Local Development Notes

- `npm run serve` serves the repo root through webpack-dev-server.
- Localhost uses `get-threatened-plant-species.json` instead of the production API.
- The production build uses webpack UMD output with `ThreatenedSpeciesFactsheet` as the global export.
- `webpack.config.js` already cleans `dist/` on build through `output.clean`, so `npm run clean` is optional convenience rather than a required step.

## Validation Checklist

Before merge, verify:

1. `npm run build` succeeds.
2. Lookup matrix passes:
   - `?species=Northern+Quoll`
   - `?species=Dasyurus+hallucatus`
   - `?species=Freycinetia+excelsa`
   - `?species=InvalidSpeciesName`
3. Title and subtitle rendering matches category rules.
4. Sidebar image, map, and related information render as expected.
5. Conservation status alert appears at the top of the factsheet and remains readable.
6. Export to PDF modal opens and preview content is correct.

## Localhost PDF Caveat

PDF download can fail on localhost due to cross-origin image capture restrictions.

Typical symptom:

- `An error occurred while generating the PDF. Please try again.`

Recommended split:

1. Localhost: validate modal open, preview content, pagination, and UI behavior.
2. DEV environment: validate full PDF download behavior.

## Deployment Model

- Working branch: `dev`
- Production branch: `main`
- Squiz DEV tracks `dev`
- Squiz PROD tracks `main`
- Release flow: merge `dev` into `main`

CloudFlare caching can delay visible updates after deployment.

## Cost and Bundle Considerations

Because storage and traffic are billed:

1. Keep dependencies minimal.
2. Avoid unnecessary runtime libraries.
3. Run production build before merge.
4. Monitor `dist/` size after large features or design changes.

## Definition of Done

1. Source changes are made in `src/`.
2. Build succeeds.
3. Runtime behavior is validated in `example.html` or an equivalent host page.
4. No regressions in lookup, metadata, sidebar, PDF modal, or print-preview behavior.
5. Developer and agent docs are updated when behavior, selectors, workflows, or assumptions change.

## License

ISC
