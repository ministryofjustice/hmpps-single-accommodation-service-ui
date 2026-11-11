# Update the eligibility graph preview

Use these instructions with an AI coding assistant to maintain the preview after
changes to eligibility cards, statuses or API data. Inspect the repository and
make the necessary changes, rather than only suggesting them.

## Review and update

1. Inspect the working-tree changes and relevant card builders, actions, status
   tags, Nunjucks macros and styles. If a comparison branch or commit is supplied,
   also inspect that diff. Preserve unrelated edits.
2. Trace how those changes affect `server/eligibilityGraphPreview/` and
   `script/status-card-preview/generate.js`. Most presentation changes should
   flow through the existing generator without additional preview code.
3. Update graph status mappings and synthetic fixtures only where required.
   Keep example application, booking and submission states consistent with the
   selected status. Reuse real UI builders, templates and styles; do not duplicate
   eligibility rules, card labels or presentation logic.
4. Keep preview-only configuration, logging and template adapters isolated from
   production infrastructure. Preserve the graph's global functions
   `statusCardPreview`, `statusActionPreview` and `statusCardTag`, disabled links,
   scoped styles and explicit errors for unsupported input. Do not introduce
   runtime server dependencies, credentials or external assets.
5. Add or update tests for affected scenarios and parity with real UI rendering.
   Keep existing size and readability checks. If generation cannot support a new
   template or dynamic CSS pattern, fix its discovery or safelist as appropriate
   rather than maintaining a second implementation.

## Validate

Run:

```shell
npm run generate:status-card-preview
npm run test:ci -- --runTestsByPath server/eligibilityGraphPreview/statusCardPreview.test.ts --coverage=false
npm run typecheck
npx eslint server/eligibilityGraphPreview script/status-card-preview/generate.js --max-warnings 0
```

Also lint any other changed code and run targeted production tests if shared
runtime code was changed. Do not hand-edit or commit the ignored generated HTML.
Preserve the output filename and source-commit header used by API artifact
verification. Update directly affected documentation and workflow references if
paths or interfaces change; do not dispatch remote workflows or open PRs.

Summarize what changed, which checks passed or failed, and any remaining
limitations. If no supporting-code changes are needed, say so rather than making
unnecessary edits.
