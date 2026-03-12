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
5. Fetch species data using category-aware lookup (see **Species Lookup** section).
6. Render main content.
7. Render sidebar media and PDF button.

### Species Lookup

The `fetchSpeciesData(speciesName)` method implements category-aware species resolution:

**Search strategy:**

1. If `speciesName` is null, return first species in dataset.
2. Convert input to lowercase for case-insensitive matching.
3. For fauna (category = "Fauna"):
   - First, search for matching `common_name`
   - If not found, search for matching `scientific_name`
4. For flora and other categories:
   - Search for matching `scientific_name`

**Examples:**

| Query | Category | Match Type | Result |
|-------|----------|-----------|--------|
| `Northern Quoll` | Fauna | common_name | Dasyurus hallucatus |
| `Dasyurus hallucatus` | Fauna | scientific_name | Dasyurus hallucatus (fallback) |
| `Freycinetia excelsa` | Flora | scientific_name | Freycinetia excelsa |

**Data contract:**

Species objects must have:
- `category`: "Fauna" or "Flora" (determines lookup strategy)
- `scientific_name`: unique identifier, always present
- `common_name`: optional, used for fauna lookup only

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

Primary fields consumed by rendering and lookup logic:

**Lookup fields:**
- `category`: "Fauna" or "Flora" — determines search strategy (mandatory for correct lookup)
- `scientific_name`: unique species identifier, case-insensitive search (always present)
- `common_name`: common name for fauna, null/empty for most flora (optional but critical for fauna queries)

**Display fields:**
- `family_name`: taxonomic or general classification (mammals, birds, plants, etc.)
- `conservation_status_nt`: NT conservation status (e.g., "Endangered", "Vulnerable")
- `conservation_status_australia`: Australian conservation status
- `description`: species description paragraph(s)
- `distribution`: geographic distribution text
- `ecology_and_life_history`: habitat and behavioral information
- `threatening_processes`: threats to species survival
- `conservation_objectives_and_management`: management priorities
- `references`: citations and links
- `image_credit`: attribution for photo (optional)
- `related_information`: supplementary links and info (optional)

**Media notes:**

- map/image URLs are derived from `scientific_name` by replacing spaces with `-` and appending `.webp`
- missing images/maps are hidden via `onerror` event handler
- both fauna and flora use scientific name for media file naming

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

### Default species and map behavior

1. Open `http://localhost:8080/example.html`.
2. Confirm the first species from data source loads (no query parameter).
3. Confirm map appears for default species.
4. Verify species title, scientific name, and description display correctly.

### Fauna species—common name lookup

1. Navigate to: `http://localhost:8080/example.html?species=Northern+Quoll`
2. Confirm factsheet loads with title "Northern Quoll" and scientific name "Dasyurus hallucatus".
3. Verify status badges, image, and map display correctly.

### Fauna species—scientific name lookup (fallback)

1. Navigate to: `http://localhost:8080/example.html?species=Dasyurus+hallucatus`
2. Confirm same factsheet loads as above (validates common name → scientific name fallback).

### Flora species—scientific name lookup

1. Navigate to: `http://localhost:8080/example.html?species=Freycinetia+excelsa`
2. Confirm fauna-specific behavior does not interfere with flora lookup.
3. Verify flora factsheet displays correctly.

### Map image update on species change

1. Start on default species.
2. Navigate to a different species via query string.
3. Confirm map image `src` updates to reflect new species name.
4. (Note: media files use scientific names regardless of lookup method)

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

### Species not found

1. Navigate to: `http://localhost:8080/example.html?species=InvalidSpeciesName`
2. Confirm "Species Not Found" alert displays with useful message.
3. Verify alert suggests checking species name spelling.

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
