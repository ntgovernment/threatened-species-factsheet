# threatened-species-factsheet
Resources for the paint layout of the threatened species section of NT.GOV.AU

## Overview

This package provides redistributable JavaScript and CSS resources for displaying threatened species factsheets on NT.GOV.AU.

## Installation

```bash
npm install
```

## Building

Build the redistributable JS and CSS files:

```bash
npm run build
```

This will generate:
- `dist/threatened-species-factsheet.js` - Minified JavaScript bundle
- `dist/threatened-species-factsheet.css` - Minified CSS bundle

For development with file watching:

```bash
npm run dev
```

## Usage

Include the built CSS and JS files in your HTML:

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="dist/threatened-species-factsheet.css">
</head>
<body>
  <div id="factsheet"></div>
  
  <script src="dist/threatened-species-factsheet.js"></script>
  <script>
    // Initialize the factsheet with plain text content (secure by default)
    const factsheet = new ThreatenedSpeciesFactsheet({
      element: document.getElementById('factsheet'),
      data: {
        title: 'Northern Quoll',
        content: 'The Northern Quoll is a threatened species...'
      }
    });

    // Or with HTML content (requires allowHtml: true)
    // WARNING: Only use allowHtml with trusted/sanitized content
    const factsheetWithHtml = new ThreatenedSpeciesFactsheet({
      element: document.getElementById('factsheet'),
      allowHtml: true, // Enable HTML rendering
      data: {
        title: 'Northern Quoll',
        content: '<p>The Northern Quoll is a threatened species...</p>'
      }
    });
  </script>
</body>
</html>
```

### Security

By default, the factsheet escapes all HTML in the content field to prevent XSS attacks. If you need to render HTML content:

1. Set `allowHtml: true` in the constructor options
2. Ensure the content is from a trusted source or properly sanitized
3. Never render user-generated content with `allowHtml: true` without sanitization

## Development

The source code is located in the `src/` directory:
- `src/index.js` - Main JavaScript module
- `src/styles/main.scss` - SCSS styles

## Output

The webpack build produces UMD-compatible bundles that can be used in:
- Browser via `<script>` tag (exposes `ThreatenedSpeciesFactsheet` global)
- CommonJS modules (Node.js)
- AMD modules
- ES6 modules

