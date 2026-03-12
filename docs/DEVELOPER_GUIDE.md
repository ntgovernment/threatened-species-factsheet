# Developer Guide

## Purpose

This guide is the operational reference for human contributors.
Use it to understand the repository quickly, make safe changes in the right source files, validate the behavior that matters, and ship with confidence.

## System Overview

This project builds redistributable UMD assets:

- `dist/threatened-species-factsheet.js`
- `dist/threatened-species-factsheet.css`

Those artifacts are consumed by NT.GOV.AU pages through Squiz Matrix and Git File Bridge.

Primary source files:

- `src/index.js`: component logic, data lookup, metadata updates, sidebar rendering, modal preview, PDF generation
- `src/styles/main.scss`: styling for the factsheet, sidebar media, accordions, states, print preview, and print output
- `get-threatened-plant-species.json`: local development dataset
- `example.html`: local integration harness
- `webpack.config.js`: webpack build and dev-server configuration

## Runtime Flow

On `DOMContentLoaded`:

1. Locate `#content_area`.
2. Instantiate `ThreatenedSpeciesFactsheet` with `allowHtml: true`.
3. Resolve the data endpoint.
   - localhost and `127.0.0.1` use `/get-threatened-plant-species.json`
   - all other hosts use the production API URL embedded in `src/index.js`
4. Parse the `?species=` URL query.
5. Fetch species data and resolve the selected record.
6. Render factsheet content into `#content_area`.
7. Update document title, H1, breadcrumb, and fauna subtitle.
8. Render sidebar media and initialize Export to PDF behavior.

## File Responsibilities

### `src/index.js`

Main responsibilities:

- endpoint selection for localhost versus production
- category-aware species lookup
- safe content rendering and HTML escaping
- page metadata updates
- sidebar image, map, and related-information rendering
- loading, error, and not-found states
- main factsheet render path
- printable/modal render path
- PDF generation

Important methods and why they matter:

- `getSpeciesFromUrl()`: decodes `+` to spaces and returns the raw species query
- `fetchSpeciesData()`: the source of truth for fauna common-name lookup and flora scientific-name lookup
- `populateSidebarNavigation()`: owns sidebar rendering and PDF button initialization
- `updatePageMetadata()`: owns H1, `.factsheet-subtitle`, breadcrumb, and document title behavior
- `generateFactsheetHTML()`: main page markup, including the Conservation status info alert and accordion sections
- `generatePrintableHTML()`: modal preview markup, including a simplified printable Conservation status section
- `generatePDF()`: browser-side PDF export workflow using `html2canvas` and `jsPDF`

### `src/styles/main.scss`

Main responsibilities:

- content spacing and typography
- fauna subtitle styling
- Conservation status styling and alert wrapper styling
- sidebar media styles
- accordion styles
- modal preview styles
- print media rules
- state styles for loading, error, and not-found views

### `webpack.config.js`

What it controls:

- entry: `./src/index.js`
- output: `dist/threatened-species-factsheet.js`
- CSS extraction: `dist/threatened-species-factsheet.css`
- UMD library export: `ThreatenedSpeciesFactsheet`
- automatic cleaning of `dist/` on build via `output.clean`
- local dev server at port `8080`

## Data Contract

### Fields Required for Lookup

- `category`
- `scientific_name`
- `common_name` for fauna common-name lookup

### Fields Used by Rendering

- `scientific_name`
- `common_name`
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

### Data Assumptions Worth Preserving

- `scientific_name` is effectively the canonical identifier.
- `category` controls lookup and title logic.
- Flora title display ignores `common_name` even if it exists.
- HTML in content fields is only safe when the source is trusted and `allowHtml` is enabled.

## Category-Aware Behavior Rules

These are functional contracts, not just current implementation details.

### Species Lookup Rules

1. Missing `?species=`: load the first record.
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

1. H1: `common_name` when available.
2. H1 fallback: italic `scientific_name` when no `common_name` exists.
3. `.factsheet-subtitle`: italic `scientific_name` shown below H1 only when H1 uses `common_name`.
4. Breadcrumb and document title mirror the displayed H1 behavior.

Note: The printable modal preview title uses `common_name || scientific_name` by design and should not be confused with the page H1 rules.

## UI Structure and Render Paths

### Main Factsheet Path

`generateFactsheetHTML()` renders:

1. Conservation status at the top of the page in an info-style alert wrapper.
2. Description as a standard content section.
3. Distribution through References as accordion sections.

Important details:

- Conservation status is not accordion-based.
- Australia appears before Northern Territory.
- Status items use semantic `role="status"` markup and `data-severity`.
- `.status-text` is intentionally stronger than surrounding body copy.

### Printable and Modal Path

`generatePrintableHTML()` renders:

1. a print header with species title
2. a first-page two-column layout
3. a simplified Conservation status block using paragraph markup
4. continuous section flow for the rest of the content

Important details:

- The printable view is a separate render path.
- Changes to section order or content often need to be applied in both render methods.
- Print and PDF behavior are style-sensitive, especially around page breaks and images.

## Host Integration Contract

Required host DOM:

- `#content_area`
- `.col-md-4.my-4.d-print-none`
- `<h1>`
- `.breadcrumb-item.active`

Required host assets:

- factsheet CSS bundle
- factsheet JS bundle
- Bootstrap JavaScript for modal support

If these selectors or assumptions change, the component will appear broken even when the JS bundle itself is fine.

## Security Requirements

1. Default rendering must remain escaped.
2. `allowHtml` is only for trusted and sanitized content.
3. Never pass unsanitized user HTML into render methods.
4. Prefer changing `renderContent()` behavior only with extreme care because it affects many sections at once.

## Development Workflow

### Commands

```bash
npm install
npm run serve
npm run dev
npm run build
```

Notes:

- `npm run serve` opens the site with webpack-dev-server on port `8080`.
- `npm run clean` uses `rm -rf`, so it is easiest from Git Bash or another compatible shell on Windows.
- `npm run build` is the only supported way to refresh `dist/`.

### Standard Change Flow

1. Update source in `src/`.
2. Build with `npm run build`.
3. Validate behavior in `example.html` using scenario URLs.
4. Check browser console for regressions.
5. Update docs if behavior, selectors, workflows, or assumptions changed.

## Common Change Recipes

### Adjusting factsheet content sections

Check both:

- `generateFactsheetHTML()`
- `generatePrintableHTML()`

If you update section order, heading text, or field usage in only one path, the modal preview and PDF export will drift from the main page.

### Adjusting metadata behavior

Check:

- `update()`
- `updatePageMetadata()`
- `.factsheet-subtitle` styling in `src/styles/main.scss`

### Adjusting Conservation status styling

Check:

- main markup in `generateFactsheetHTML()`
- printable markup in `generatePrintableHTML()`
- `.conservation-status-section`
- `.conservation-status-alert`
- `.status-text`
- print rules in `src/styles/main.scss`

### Adjusting sidebar image or map behavior

Check both the main sidebar renderer and printable sidebar helpers because the modal uses separate HTML generation.

## Validation Matrix

### Baseline Runtime

1. Open `http://localhost:8080/example.html`.
2. Confirm factsheet content renders.
3. Confirm sidebar media region renders.
4. Confirm map behavior matches the selected species.
5. Confirm the Conservation status alert renders cleanly at the top of the page.

### Lookup Scenarios

1. `?species=Northern+Quoll` resolves fauna by `common_name`.
2. `?species=Dasyurus+hallucatus` resolves the same fauna via `scientific_name` fallback.
3. `?species=Freycinetia+excelsa` resolves flora by `scientific_name`.
4. `?species=InvalidSpeciesName` shows not-found UI.

### Title and Subtitle Scenarios

1. `?species=Freycinetia+excelsa` shows italic scientific name in H1 and no subtitle element.
2. `?species=Luisia+corrugata` shows italic scientific name in H1 and no subtitle element.
3. `?species=Northern+Quoll` shows common name in H1 and a scientific subtitle.
4. Breadcrumb and document title match expected display behavior.

### Export to PDF Scenarios

1. Sidebar button text is Export to PDF.
2. Modal opens successfully.
3. Preview content corresponds to the selected species.
4. Download button is enabled when idle.
5. Conservation status remains readable in the preview.

## Localhost Caveat

Final PDF generation can fail on localhost due to CORS and image capture restrictions.

If this occurs:

1. Treat it as environment-specific unless reproduced in DEV.
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
4. Monitor output size after large features or broad style changes.

## Troubleshooting

### Species not found

1. Confirm `?species=` is URL encoded with `+` for spaces.
2. Confirm the species exists in the dataset or API.
3. Confirm `category` and `scientific_name` are present.
4. For fauna, confirm `common_name` exists if you expect common-name lookup.

### Sidebar missing

1. Confirm `.col-md-4.my-4.d-print-none` exists on the page.
2. Confirm the JS bundle loads and runs after DOM readiness.
3. Confirm `populateSidebarNavigation()` is still called from `update()`.

### Page heading wrong

1. Check `update()` category logic.
2. Check `updatePageMetadata()` subtitle insertion and removal.
3. Verify the species `category` value is what you think it is.

### Modal not opening

1. Confirm Bootstrap JS is loaded.
2. Confirm the sidebar rendered before modal interaction.
3. Confirm the PDF button was initialized after sidebar render.

### PDF fails on localhost

1. Inspect console and network output for CORS failures.
2. Validate the full export in DEV.

### Dist appears stale

1. Run `npm run build`.
2. Confirm the correct branch and environment were deployed.
3. Hard refresh the browser to bypass cache.
4. Do not edit `dist/` by hand.

## Definition of Done

1. Lookup behavior passes all four lookup scenarios.
2. Title and subtitle behavior pass category-aware scenarios.
3. Conservation status remains correct and readable in page and preview paths.
4. Export to PDF modal still works.
5. Production build succeeds.
6. No obvious console regressions are introduced.
7. Documentation is updated if contracts changed.
