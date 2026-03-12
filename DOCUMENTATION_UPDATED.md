# Documentation Update Summary

## Scope

Documentation has been comprehensively updated for both developers and coding agents.
The updates prioritize operational clarity, consistent terminology, and reliable validation workflows.

## Updated Files

1. `README.md`
2. `docs/DEVELOPER_GUIDE.md`
3. `docs/CODING_AGENT_GUIDE.md`
4. `.github/copilot-instructions.md`

## What Improved

### 1. Onboarding and Navigation

- Added role-based documentation map in README.
- Clarified where developers vs coding agents should start.

### 2. Architecture Clarity

- Consolidated runtime flow descriptions.
- Clarified source-of-truth files and integration contract.

### 3. Test and Validation Coverage

- Added/standardized lookup validation matrix:
  - fauna common-name lookup
  - fauna scientific fallback
  - flora scientific lookup
  - invalid species handling
- Added/standardized Export to PDF validation steps.

### 4. Agent Operational Guidance

- Strengthened invariants that must not change.
- Added required pre-edit checks.
- Added deterministic execution and handoff procedure.

### 5. Terminology Consistency

- Updated docs to use Export to PDF terminology.
- Removed stale references to older button naming in AI instructions.

## Expected Outcome

Contributors and coding agents now have a consistent, end-to-end guide for:

- making safe changes
- testing behavior thoroughly
- reporting outcomes with clear caveats
- preserving critical lookup and rendering behavior
