# Threatened Species Factsheet - AI Coding Guidelines

## Project Overview

A redistributable JavaScript/CSS component for displaying threatened species factsheets on NT.GOV.AU. Builds UMD bundles (JS + CSS) that integrate seamlessly into NT.GOV.AU's NT Base design system without adding custom borders/backgrounds.

## Documentation Map

- `README.md`: high-level project entrypoint and commands
- `docs/DEVELOPER_GUIDE.md`: architecture, test workflows, troubleshooting, release flow
- `docs/CODING_AGENT_GUIDE.md`: coding-agent workflow, invariants, and handoff format

## Architecture & Key Components

### Data Flow

- **Data Source**: `get-threatened-plant-species.json` (localhost) or API endpoint (production)
- **Component**: `ThreatenedSpeciesFactsheet` class (`src/index.js`)
- **Initialization**: Auto-mounts on `DOMContentLoaded` to `#content_area` element
- **URL Pattern**: Category-aware species lookup
  - **Fauna** (animals): `?species=CommonName` (e.g., `?species=Northern+Quoll`) or `?species=ScientificName` for fallback
  - **Flora** (plants): `?species=ScientificName` (e.g., `?species=Freycinetia+excelsa`)
  - Omitted: fetches first species
- **Sidebar**: Auto-populates from `fetch(/api)` with alphabetically sorted species list

### Security Model (Critical)

- **Default**: All content HTML-escaped to prevent XSS
- **allowHtml Flag**: Only enable for trusted/pre-sanitized content (set during initialization)
- Methods use `escapeHtml()` internally; never trust API content directly
- Example: `<p>` tags in JSON are preserved but rendered safely by default

## Build & Development

### Key Commands

```bash
npm run dev      # Watch mode (src/ → dist/) with live reload
npm run build    # Production minify (src/ → dist/)
npm run serve    # Dev server on http://localhost:8080 with auto-open
npm run clean    # Remove dist/ folder
```

### Webpack Configuration

- **Entry**: `src/index.js` → UMD bundle
- **Output**: `dist/threatened-species-factsheet.{js,css}`
- **Global Name**: `ThreatenedSpeciesFactsheet` (browser window)
- **CSS Extraction**: SCSS → CSS via `mini-css-extract-plugin`
- **Dev Server**: Port 8080 with hot reload; serves from project root
- **Minification**: Enabled in production to reduce bundle size for storage/traffic costs

### Deployment & Environments

- **Distribution**: `dist/` files imported into Squiz Matrix via Git File Bridge
- **Environments**: Two Squiz Matrix environments with corresponding branches
  - **DEV**: References `dev` branch—use for testing and validation
  - **PROD**: References `main` branch—production-ready code only
  - **Production Deployment**: Merge pull request from `dev` → `main` branch
- **CDN/Caching**: CloudFlare handles caching and CDN delivery
  - Monitor cache behavior; CloudFlare will cache `dist/` files based on headers
  - Bundle changes are auto-synced via Git File Bridge when branches update
- **Storage/Traffic**: Organization charged per usage—bundle sizes directly impact costs
  - Current output: Single JS + single CSS file (minimal overhead)
  - Keep dependencies to a minimum; avoid adding external libraries
  - Monitor bundle size after changes; test with `npm run build` to verify minification

## Critical Patterns & Conventions

### Data Schema (JSON)

Each species object has these key fields (see `get-threatened-plant-species.json`):

```
scientific_name, common_name, family_name, category,
conservation_status_nt, conservation_status_australia,
description, distribution, ecology_and_life_history,
threatening_processes, conservation_objectives_and_management, references,
map_image_name, image_credit, related_information
```

**Critical for species lookup:**

- `category`: "Fauna" or "Flora" — determines lookup strategy (common name vs scientific name)
- `scientific_name`: unique identifier for all species
- `common_name`: optional but essential for fauna queries

### Component Methods

- `getSpeciesFromUrl()`: Extract `?species=` param and decode
- `fetchSpeciesData(speciesName)`: **Category-aware species lookup** (see Species Lookup Strategy below)
  - For Fauna: searches common_name first, then scientific_name
  - For Flora: searches scientific_name only
- `fetchAllSpecies()`: Fetch full list (defined but not used in default init flow)
- `populateSidebarNavigation(speciesData)`: Renders sidebar media (PDF button, image, map, related info) for the given species
- `renderContent(html, allowHtml)`: Safe content rendering with optional HTML pass-through
- `updatePageMetadata(displayName, isScientificName, scientificName)`: Update document title, h1, breadcrumb, and conditionally insert/remove `.factsheet-subtitle`
- `generateFactsheetHTML(data)`: Render full factsheet (conservation status, description, accordion sections)
- `generatePrintableHTML(data)`: Render flat (non-accordion) HTML for the PDF modal preview
- `generatePDF()`: Capture modal pages via html2canvas → jsPDF → download

### Species Lookup Strategy (Category-Aware)

**Fauna (animals):**

```javascript
?species=Northern+Quoll       // searches common_name → finds Dasyurus hallucatus
?species=Dasyurus+hallucatus  // no common_name match → searches scientific_name → finds it
```

**Flora (plants):**

```javascript
?species=Freycinetia+excelsa   // searches scientific_name → finds it
?species=Freycinetia           // no match (looks for exact "Freycinetia", not common_name)
```

**Implementation location:** [../src/index.js](../src/index.js) `fetchSpeciesData()` method

### Title Display Rules (Category-Aware)

Title rendering is category-aware and governed by `update()` calling `updatePageMetadata()`:

**Flora:**
- H1: italic `scientific_name` always — `common_name` is ignored for the title
- Breadcrumb: italic `scientific_name`
- Document title: `scientific_name - Factsheet | NT.GOV.AU`
- `.factsheet-subtitle`: never shown

**Fauna:**
- H1: `common_name` (non-italic) when present; italic `scientific_name` if no `common_name`
- Breadcrumb: matches H1 formatting
- Document title: uses the display name (common or scientific)
- `.factsheet-subtitle`: italicised `scientific_name` inserted below H1 when H1 shows `common_name`

**Implementation location:** [../src/index.js](../src/index.js) `update()` and `updatePageMetadata()` methods

### State Methods

- `showLoading()`, `showError(msg)`, `showNotFound(name)`: Display states
- `generateFactsheetHTML(data)`: Render species data with conditional sections
- `update(data)`: Update both content and page metadata

## Integration Points

### HTML Template

The component expects this DOM structure (see `example.html`):

- `#content_area`: Main content mount point
- `.col-md-4.my-4.d-print-none`: Sidebar mount point
- `<h1>`: Updated with species name
- `.breadcrumb-item.active`: Updated with species name
- External CSS: `link[href="dist/threatened-species-factsheet.css"]`
- External JS: `script[src="dist/threatened-species-factsheet.js"]`

### NT Base Integration

- Uses NT.GOV.AU's Bootstrap-based design system
- No custom component styling; inherits page typography
- Status badges: `.status-{vulnerable|endangered|critically-endangered|not-listed}`
- Respects NT Base utility classes (`.d-print-none`, `.col-md-*`, etc.)

## Styling Approach

### SCSS Structure (`src/styles/main.scss`)

- No borders/shadows on container—seamless page integration
- Inherits font-size, line-height, font-family from parent
- Spacing via `$spacing-unit: 1rem`
- Colors: `$primary-color: #2c5f2d`, `$secondary-color: #97bc62`
- Status badge colors: green (Vulnerable) → red (Critically Endangered)
- States: Loading spinner, Error alert, Not Found alert (Bootstrap-styled)

## Common Development Tasks

### Adding a New Section

1. Add field to JSON schema
2. Call `renderSection(title, content, cssClass)` in `generateFactsheetHTML()`
3. Add SCSS styling in `.factsheet-content` for the new class

### Modifying Content Rendering

- For plain text only: use `escapeHtml()`
- For HTML (e.g., `<p>` tags from API): use `renderContent(content, this.allowHtml)`
- Remove empty paragraphs via regex in `renderContent()`

### Testing Build Output

1. `npm run build` → generates `dist/` files
2. Open `example.html` in browser
3. Verify CSS loads at `dist/threatened-species-factsheet.css`
4. Verify JS executes (check sidebar, click species link)
5. **Verify fauna common name lookup:** `?species=Northern+Quoll` loads the Northern Quoll (Dasyurus hallucatus)
6. **Verify fauna fallback:** `?species=Dasyurus+hallucatus` loads the same species (scientific name fallback)
7. **Verify flora title:** `?species=Freycinetia+excelsa` → H1 shows *Freycinetia excelsa* (italic), no `.factsheet-subtitle` element
8. **Verify fauna subtitle:** `?species=Northern+Quoll` → H1 shows "Northern Quoll" (non-italic), `.factsheet-subtitle` shows *Dasyurus hallucatus*
9. Verify `Export to PDF` opens modal and map updates when species changes via `?species=` URL param

### Localhost PDF Export Caveat

- PDF download can fail on localhost due to cross-origin image capture restrictions when generating canvas/PDF
- Typical symptom: alert with `An error occurred while generating the PDF. Please try again.`
- For release confidence, validate full PDF download behavior in DEV environment where domain and CORS are production-like

## Debugging Tips

- Check browser console for fetch errors (network tab shows `/get-threatened-plant-species.json` on localhost)
- Species not found: Verify `?species=` param is URL-encoded (spaces as `+`)
- Sidebar not rendering: Check `#content_area` exists in DOM
- Styles not applied: Ensure webpack built CSS and `<link>` tag references correct path
- CloudFlare caching issues: Hard refresh (Ctrl+Shift+R) or clear browser cache; changes from `main` branch may take a few minutes to propagate

## Performance & Optimization

### Cost Considerations

Given per-usage storage/traffic charges, minimize bundle sizes:

- **Runtime dependencies**: `jspdf` and `html2canvas` are required for PDF export — these are intentional and bundled into the JS output
- **Bundle size targets**: Keep bundles lean; monitor after dependency or feature additions
- **Test after changes**: Run `npm run build` and check dist file sizes before committing

### Production Checklist

1. All changes tested in DEV Squiz environment (via `dev` branch)
2. Run `npm run build` and verify minification occurred
3. Check dist file sizes with `du -h dist/*` or similar
4. Verify no console errors in DEV environment
5. Create pull request from `dev` → `main` branch for production deployment
6. After merge, verify in PROD Squiz environment (CloudFlare caching may take minutes)

### Future Optimization Opportunities

- If adding map images: Consider lazy-loading with `loading="lazy"`
- If expanding data: Evaluate whether API responses should be cached client-side
- Gzip compression: Ensure web server serving dist files enables gzip (reduces transfer by ~60%)
