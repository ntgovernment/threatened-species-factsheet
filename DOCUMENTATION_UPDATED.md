# Documentation Update Summary

## Scope

Documentation has been rewritten to be more useful as an operational reference for both human developers and coding agents.

Updated files:

1. `README.md`
2. `docs/DEVELOPER_GUIDE.md`
3. `docs/CODING_AGENT_GUIDE.md`
4. `DOCUMENTATION_UPDATED.md`

## What Was Improved

### 1. Better onboarding and navigation

1. Clarified which document each audience should read first.
2. Expanded the README into a practical repository overview instead of a short project blurb.
3. Documented the project structure and the role of each source file.

### 2. Stronger architecture and contract clarity

1. Documented the real runtime flow from `DOMContentLoaded` through factsheet render, metadata update, sidebar render, modal preview, and PDF generation.
2. Added file-responsibility guidance for `src/index.js`, `src/styles/main.scss`, and `webpack.config.js`.
3. Documented the host-page selector contract and why those selectors are risky to change.

### 3. More useful behavior guidance

1. Preserved and clarified category-aware lookup rules.
2. Preserved and clarified category-aware title and subtitle rules.
3. Added explicit notes on the split between the main factsheet render path and the printable modal render path.
4. Added guidance for the Conservation status alert section and its readable status typography.

### 4. Better workflow and validation guidance

1. Expanded local development notes and command expectations.
2. Added change recipes for common edits so contributors know which files and methods to inspect together.
3. Kept a consistent validation matrix for lookup, metadata, sidebar, and Export to PDF behavior.
4. Kept the localhost PDF caveat explicit and connected it to DEV validation.

### 5. Better coding-agent guidance

1. Expanded the agent guide beyond invariants into code hotspots, pre-edit checks, change heuristics, and common failure modes.
2. Clarified when agents must update both render paths.
3. Clarified what a useful handoff should contain.

## Expected Outcome

Developers and coding agents should now be able to:

1. onboard faster
2. understand where behavior lives before editing
3. make safer changes in both screen and printable render paths
4. validate the right scenarios consistently
5. hand off work with fewer hidden assumptions
