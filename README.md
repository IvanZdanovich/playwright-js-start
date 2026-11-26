# Playwright Testing Framework

A Playwright starter built on the Constraints → Examples → Specs approach: every requirement is an executable
Given/When/Then spec whose asserted values trace back to one named constraint. It is a port of
[cypress-start](https://github.com/IvanZdanovich/cypress-start); see [Migration from cypress-start](docs/migration-from-cypress.md).

## Quick Start

Prerequisites: Node.js 24 or newer, npm, Git.

### Create a project with the CLI

```bash
npx create-playwright-start my-project
```

- **Full setup** clones the template, starts a fresh git history, seeds `dev-users.json` and `qa-users.json` from the
  example, and runs `npm install`.
- **Specific files** copies only the modules you select (ESLint rules, docs, Claude skills, guidance check, GitHub
  workflows, test reports, Docker) into an existing project and merges their scripts into `package.json`.
- **Update** in an existing project applies the latest template, removes files the template dropped, and keeps your
  credentials and project data files. A `.playwright-start-manifest.json` file records what the template installed.

Set `PLAYWRIGHT_START_TEMPLATE_URL` to scaffold from a fork or a local clone. In the template repository the CLI lives
in `bin/` and its tests run with `node --test 'bin/__tests__/*.test.js'`; scaffolded projects do not include it.

### Clone directly

```bash
npm install
npx playwright install --with-deps chromium
cp playwright/sensitive-data/env-users.example.json playwright/sensitive-data/dev-users.json
npm test
```

`npm install` also installs the pre-commit hook (`npm run hooks:setup` installs it again).

## Overview

The framework includes example tests for two public demo applications:

- Integration and E2E UI tests for the [Swag Labs demo application](https://www.saucedemo.com/).
- Integration API tests for the [Restful Booker API playground](https://restful-booker.herokuapp.com/apidoc/).

## Project Structure

```text
playwright/
  constants/{api,ui}/          # *.constraints.js — boundaries, formats, enums; timeouts.js, user-roles.js
  integration-examples/        # *.examples.js — named test data for integration specs
  e2e-examples/                # *.examples.js — named test data for E2E specs
  integration/{api,ui}/        # integration specs (*.api.spec.js, *.ui.spec.js)
  e2e/ui/                      # E2E specs (*.ui.spec.js)
  commands/{api,ui}/           # exported command functions for reused flows
  selectors/                   # selector objects
  localization/                # locale files (<lang>-localization.json)
  colours/                     # theme files (<theme>-theme-colours.json)
  sensitive-data/              # per-environment users (not committed)
  support/                     # fixtures, req(), l10n and colours loaders, urls, users, utils
config/environments.js         # dev and qa targets
playwright.config.js           # projects, workers, reporters, timeouts
eslint-plugin-custom-rules/    # project ESLint rules and their tests
scripts/                       # reports, l10n, colours, guidance check, git hooks
bin/                           # create-playwright-start CLI and its tests
bug-log/                       # logged product bugs referenced from specs
docs/                          # feature and convention docs
.claude/                       # Claude Code skills and path-scoped rules
```

## What Makes This Framework Different

- **The spec is the requirement.** Boundary values live in constraint files, named data in example files, and
  requirements as Given/When/Then titles in spec files. No separate requirement documents or mapping matrices.
  ([docs](docs/constraints-examples-specs-approach.md))
- **No extra abstraction layers.** No Page Object Model and no BDD framework. Selectors are plain objects, reused flows
  are exported functions, and Given/When/Then lives in test titles. The reasons are in the [FAQ](docs/faq.md).
- **Conventions enforced by tools.** Custom ESLint rules check title grammar, spec paths, command names, and `req()`
  metadata. Each rule has a test that proves it can fail. `npm run validate` fails when guidance or docs cite a path,
  script, or command the repository does not have.
- **Fast feedback.** Setup runs once per block in `test.beforeAll`, spec files run in parallel workers, and CI shards.
- **AI-ready.** [Claude Code](https://claude.ai/code) skills under `.claude/skills/` and path-scoped rules under
  `.claude/rules/` teach an agent the project conventions.

## Running Tests

```bash
npm test                                   # all projects
npm run test:api                           # integration API only
npm run test:ui                            # integration UI and E2E
npm run test:parallel                      # PARALLEL_STREAMS workers (default 3)
npm run debug                              # Playwright UI mode
npx playwright show-report reports/html    # open the last HTML report
```

Environment variables:

- `TARGET_ENV` — `dev` (default) or `qa`, from `config/environments.js`.
- `LANGUAGE` — locale file code, default `en`.
- `COLOUR_THEME` — theme file code, default `default`.
- `BROWSER` — `chromium` (default), `chrome`, `edge`, `firefox`, or `webkit`.
- `PARALLEL_STREAMS` — worker count.

```bash
TARGET_ENV=qa LANGUAGE=en BROWSER=firefox npm test
```

## Reports

```bash
npm run report:coverage    # coverage gaps against app-structure → reports/coverage-gaps.md
npm run report:signoff     # manual sign-off checklist from the last run → reports/signoff-report.html
npm run report:flaky       # flaky-test analysis from the CI ledger → reports/flaky-tests.md
```

## Other Commands

```bash
npm run lint               # ESLint with auto-fix
npm run test:rules         # custom lint rule tests
npm run validate           # guidance and docs reference only existing things
npm run l10n -- help       # localization CLI
npm run colours -- help    # colour theme CLI
```

## Documentation

- [Constraints → Examples → Specs](docs/constraints-examples-specs-approach.md)
- [CES vs. traditional RM tools](docs/comparison-spec-vs-rm-tool.md)
- [FAQ](docs/faq.md)
- [Migration from cypress-start](docs/migration-from-cypress.md)
- [Parallel execution](docs/parallel-execution.md)
- [Timeouts](docs/timeouts.md)
- [Localization](docs/localization-testing.md)
- [Colour theme testing](docs/colour-theme-testing.md)
- [Coverage gap analysis](docs/coverage-gap-analysis.md)
- [Flaky test analysis](docs/flaky-test-analysis.md)
- [Sign-off report](docs/signoff-report.md)
- [Custom ESLint rules](docs/eslint-custom-rules.md)
- [Pre-commit check](docs/pre-commit-check.md)
- [Git strategy](docs/git-strategy.md)

## Troubleshooting

- **Sensitive data not provided** — copy `playwright/sensitive-data/env-users.example.json` to `<TARGET_ENV>-users.json`.
- **Many tests did not run after one failure** — specs run in serial mode; fix the first failure in the file.
- **`Unknown key` error** — a spec reads an `l10n` or `colours` key that the reference file does not declare.
- **Lint errors** — run `npm run lint` to see and auto-fix them.

## License

MIT
