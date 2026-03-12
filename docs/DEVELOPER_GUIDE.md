# Developer Guide

## Purpose

This guide helps developers make safe, verifiable changes to the Threatened Species Factsheet component.

## What This Project Builds

A UMD JavaScript bundle and CSS bundle that can be dropped into NT.GOV.AU pages to render threatened species factsheets.

Output artifacts:

- `dist/threatened-species-factsheet.js`
- `dist/threatened-species-factsheet.css`

## Architecture

### Core class

- `ThreatenedSpeciesFactsheet` in `src/index.js`

### Initialization flow

On `DOMContentLoaded`:

1. Find `#content_area`.
2. Instantiate `ThreatenedSpeciesFactsheet` with `allowHtml: true`.
3. Detect API URL by hostname.
4. Read `?species=` URL parameter.
5. Fetch species data.
6. Render main content.
7. Render sidebar media and PDF button.

### Rendering model

Main content:

- conservation status section
- description section
- accordion sections for distribution, ecology, threats, conservation, references

Sidebar:

- `View PDF` button
- species image
- distribution map
- related information

PDF workflow:

1. Open Bootstrap modal from sidebar button.
2. Generate printable HTML.
3. Paginate content into page containers.
4. Render each page with `html2canvas`.
5. Add rendered image to `jsPDF`.
6. Download generated PDF.

## Data Contract

Primary fields consumed by rendering logic:

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
- `image_credit`
- `related_information` (optional)

Notes:

- map/image URLs are currently derived from `scientific_name` by replacing spaces with `-` and appending `.webp`
- missing images/maps are hidden via `onerror`

## Local Development

Install:

```bash
npm install
```

Run watch build:

```bash
npm run dev
```

Run local web server:

```bash
npm run serve
```

Production build:

```bash
npm run build
```

Clean generated files (bash shell):

```bash
npm run clean
```

## Sanity Test Procedure

### Map behavior

1. Open `http://localhost:8080/example.html`.
2. Confirm map appears for default species.
3. Navigate to a specific species URL, for example:
   `http://localhost:8080/example.html?species=Macrotis+lagotis`
4. Confirm map image source updates to the selected species.

### PDF button behavior

1. Click `View PDF` in sidebar.
2. Confirm modal title and content match current species.
3. Confirm pagination controls show current page count.
4. Confirm `Download PDF` button is enabled when idle.

### PDF generation caveat on localhost

Depending on browser and CORS policy, localhost may block cross-origin image capture for PDF generation.

Possible symptom:

- alert: `An error occurred while generating the PDF. Please try again.`

If that occurs:

- validate modal open/preview locally
- validate PDF download in DEV environment where hosting and CORS match deployment

## Integration Contract for Host Page

Expected DOM elements:

- `#content_area`
- `.col-md-4.my-4.d-print-none`
- `<h1>`
- `.breadcrumb-item.active`

Required scripts/styles:

- Factsheet CSS
- Factsheet JS
- Bootstrap JS (for modal behavior)

## Security Expectations

- default rendering escapes HTML
- `allowHtml` should only be used with trusted/sanitized content
- never route unsanitized user-generated HTML directly into rendering paths

## Branching and Release

- develop on `dev`
- release by merging `dev` into `main`
- DEV Squiz Matrix tracks `dev`
- PROD Squiz Matrix tracks `main`
- CloudFlare caching may delay visible updates

## Bundle Size and Cost Guardrails

Because storage and traffic are billed:

- avoid unnecessary runtime dependencies
- run production builds before merge
- review `dist` sizes after significant changes

## Troubleshooting

### Species not found

- verify query parameter encoding (`+` for spaces)
- verify species exists in data source and exact case-insensitive match

### Sidebar missing

- verify sidebar container class exists exactly as expected

### Modal not opening

- verify Bootstrap JS is loaded and `window.bootstrap.Modal` is available

### Build warnings for bundle size

- expected with current PDF/image stack
- treat as optimization signals, not automatic failure

### Dist output appears stale

- rerun `npm run build`
- verify correct branch/environment deployment
- hard refresh and check CloudFlare cache behavior

## Change Checklist

1. Edit source files in `src/`.
2. Keep style and behavior aligned with NT Base patterns.
3. Run `npm run build`.
4. Test with `example.html`.
5. Confirm no regressions in map and PDF modal behavior.
6. Document behavior changes in README or this guide when relevant.
