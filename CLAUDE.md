# Project notes for Claude

Playwright test framework using Constraints → Examples → Specs: a requirement is a spec title, and every asserted value
traces from `playwright/constants/` through a named example in `playwright/*-examples/` to the spec.

Path-scoped rules in `.claude/rules/` load when you read the files they govern (specs, commands, constraints,
examples, guidance). Skills in `.claude/skills/` load by task: start with `constraints-examples-specs-approach`.

Before finishing a change, run:

```bash
npm run lint && npm run test:rules && npm run validate && npm test
```

Facts that differ from Playwright defaults:

- Specs run in serial mode with one page shared per file; the built-in `page` fixture is not used in UI specs.
- Nothing is global: import selectors, `l10n`, `colours`, urls, and commands by name.
- API commands never throw on 4xx or 5xx; assert `response.status` first.
- Requirement metadata goes through `req()` from `playwright/support/req.js`, never through comments.
