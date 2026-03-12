# Threatened Species Factsheet

Redistributable JavaScript and CSS bundles for threatened species factsheets on NT.GOV.AU.

The component is designed for NT Base pages and renders:

- species factsheet content
- a media sidebar (photo, distribution map, related information)
- a PDF preview modal with downloadable export

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Start local development server

```bash
npm run serve
```

Open:

- `http://localhost:8080/example.html`
- `http://localhost:8080/example.html?species=Freycinetia+excelsa`

### 3. Build distributable assets

```bash
npm run build
```

Build output:

- `dist/threatened-species-factsheet.js`
- `dist/threatened-species-factsheet.css`

## Documentation Index

- `docs/DEVELOPER_GUIDE.md`: architecture, workflows, deployment, troubleshooting
- `docs/CODING_AGENT_GUIDE.md`: operational guardrails and workflow for coding agents
- `.github/copilot-instructions.md`: condensed AI-focused project instructions

## Repository Structure

- `src/index.js`: main component class and auto-initialization logic
- `src/styles/main.scss`: component styling
- `example.html`: local integration template and test harness
- `get-threatened-plant-species.json`: local data source for development
- `dist/`: generated distributable bundles for deployment

## Runtime Behavior

On `DOMContentLoaded`, the bundle auto-initializes when `#content_area` is present:

1. Detect local vs production host.
2. Resolve API URL.
3. Read `?species=` from URL.
4. Fetch species data.
5. Render factsheet content into `#content_area`.
6. Render sidebar media into `.col-md-4.my-4.d-print-none`.
7. Attach PDF modal button behavior.

## Environment Data Source

- Localhost (`localhost` or `127.0.0.1`): `/get-threatened-plant-species.json`
- Non-localhost: production API endpoint configured in `src/index.js`

## Commands

```bash
npm run dev      # webpack watch mode
npm run serve    # webpack dev server (port 8080)
npm run build    # production build
npm run clean    # remove dist (bash rm -rf)
```

Note: `npm run clean` uses `rm -rf` and is intended for bash-compatible shells.

## Security Model

- Content is escaped by default to reduce XSS risk.
- `allowHtml` is enabled in auto-init for trusted, pre-sanitized API content.
- Do not pass unsanitized user input to `allowHtml` rendering paths.

## Integration Requirements

The component expects these page elements to exist:

- `#content_area` as the main content mount
- `.col-md-4.my-4.d-print-none` as the sidebar mount
- `<h1>` and `.breadcrumb-item.active` for metadata updates

Required assets in the page:

- CSS: `threatened-species-factsheet.css`
- JS: `threatened-species-factsheet.js`

## Known Local Testing Caveat

PDF export may fail on localhost when cross-origin images are blocked by CORS (for assets hosted on `https://nt.gov.au`).

Symptoms:

- alert: `An error occurred while generating the PDF. Please try again.`
- console: `Invalid argument passed to jsPDF.scale`

Recommendation:

- validate map and PDF modal open/preview locally
- validate actual PDF generation on the DEV environment where asset hosting/CORS matches deployment

## Branch and Deployment Workflow

- Active development branch: `dev`
- Production branch: `main`
- Squiz Matrix DEV tracks `dev`
- Squiz Matrix PROD tracks `main`
- Production release: merge `dev` into `main`

CloudFlare caching can delay visibility of deployed updates.

## Contribution Checklist

1. Make source changes in `src/`.
2. Run `npm run build`.
3. Verify `example.html` behavior for target species.
4. Confirm no console/runtime regressions relevant to your changes.
5. Check generated `dist/` outputs.
6. Commit source and required built artifacts.

## License

ISC
