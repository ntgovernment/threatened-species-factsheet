# Documentation Update Summary

## Scope

Documentation has been reorganized and expanded to better support both human developers and coding agents.

Updated files:

1. `README.md`
2. `docs/DEVELOPER_GUIDE.md`
3. `docs/CODING_AGENT_GUIDE.md`
4. `DOCUMENTATION_UPDATED.md`

## What Was Improved

### 1. Clearer Onboarding and Navigation

1. Added a role-based documentation map in README.
2. Clarified where developers and coding agents should start.
3. Added concise project purpose and component behavior summary.

### 2. Stronger Architecture and Contract Clarity

1. Standardized runtime flow descriptions across docs.
2. Clarified source-of-truth files and responsibilities.
3. Documented host page DOM and asset integration contract.

### 3. Expanded Validation Guidance

1. Standardized lookup validation matrix:
   - fauna common-name lookup
   - fauna scientific-name fallback
   - flora scientific-name lookup
   - invalid species not-found behavior
2. Standardized title/subtitle validation scenarios.
3. Standardized Export to PDF modal and preview checks.

### 4. Better Agent Operational Guidance

1. Documented non-negotiable invariants.
2. Added required pre-edit checks and execution procedure.
3. Added explicit handoff template and stop conditions.

### 5. Consistent Terminology and Caveats

1. Standardized Export to PDF wording.
2. Preserved localhost CORS caveat guidance for PDF export.
3. Clarified when DEV environment validation is required.

## Expected Outcome

Developers and coding agents should now be able to:

1. onboard faster
2. make safer changes
3. validate behavior consistently
4. hand off work with clear pass/fail evidence
