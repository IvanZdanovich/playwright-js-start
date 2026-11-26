# Migration from cypress-start

This framework is a port of cypress-start (`main` at commit f6006bb, version 2.10.0) to Playwright. Read this page to
map a Cypress habit to its Playwright form, or to learn why a piece of the source was changed or removed.

## What carried over unchanged

- The Constraints → Examples → Specs method, file layout, and naming (`cypress/` became `playwright/`).
- All 225 tests (now in 6 spec files): 309 Given/When/Then titles, identical in text and order, and all 35 `req` metadata blocks.
- Constraints, examples, selectors, locale and theme files, and the bug log.
- The custom ESLint plugin (15 rules, plus `enforce-single-describe`), the l10n and colours CLIs, coverage gap analysis, the flaky ledger format, the
  sign-off report and its template, and the pre-commit hook with ratio thresholds.
- 7 path-scoped rules and 12 skills in `.claude/`. Five skills (agent, rule, skill, and documentation authoring, and
  functional JavaScript) are copied word for word.

## Decisions

- **Serial specs with one shared page.** Cypress kept state between `it` blocks with `testIsolation: false`. Here each
  spec calls `test.describe.configure({ mode: 'serial' })` and opens one page in the top `test.beforeAll`. Trade-off:
  after a failure Playwright skips the rest of the file, and a CI retry re-runs the whole file. The sign-off report
  shows the skipped checks as `Not Executed`.
- **Imports instead of globals.** Selectors, `l10n`, `colours`, urls, user roles, and commands are imported by name, so
  ESLint's `no-undef` works and an editor resolves every name.
- **Commands are exported functions** with the same `<owner>__<action>` names. They take `page` or `request` first.
- **Two fixtures only**, both worker-scoped, in `playwright/support/fixtures.js`: `apiRequest` and `apiToken(role)`.
  A fixture is used only for a resource with setup, teardown, or a per-worker cache.
- **`req()` writes Playwright annotations.** The fields are unchanged; the reports read them from the JSON report.
- **No login setup project.** The specs never used the source's session command; SauceDemo has no API and answers
  interior routes with 404, so every UI spec logs in through the page in its top `test.beforeAll`.
- **No active-map copy step.** `playwright/support/l10n.js` and `colours.js` load the file selected by `LANGUAGE` or
  `COLOUR_THEME` at worker start and throw on an unknown key.

## Concept mapping

```text
describe(t, { testIsolation: false })   test.describe(t) + test.describe.configure({ mode: 'serial' }) + shared page
context(t) / it(t) / it.skip(t)         nested test.describe(t) / test(t) / test.skip(t)
before / after                          test.beforeAll / test.afterAll (worker fixtures only: browser, apiRequest, apiToken)
it(t, { req: {...} }, fn)               test(t, req({...}), fn)
Cypress.Commands.add('a__b', fn)        export async function a__b(page, example) { ... }
cy.request(...) + failOnStatusCode      request.fetch(...) never throws on 4xx/5xx; assert response.status first
cy.session                              apiToken fixture (per worker); UI login in beforeAll
cy.get(s).should('have.text', x)        await expect(page.locator(s)).toHaveText(x)
should('contain' / 'not.exist')         toContainText / toHaveCount(0)
have.css / have.attr / have.value       toHaveCSS / toHaveAttribute / toHaveValue
cy.url().should('eq', u)                await expect(page).toHaveURL(u)
.each / .within / .eq(i)                locator.all() / parent.locator(child) / .nth(i)
cy.intercept + cy.wait('@a')            page.waitForResponse(...) started before the click
Cypress.expose('baseUrl')               config/environments.js + use.baseURL
defaultCommandTimeout etc.              use.actionTimeout / use.navigationTimeout / expect.timeout
SPEC_PATTERN                            --project=integration-api | integration-ui | e2e-ui
parallel runner script + Xvfb           workers + --shard + merge-reports
mochawesome JSON                        json reporter (reports/results.json)
screenshot renaming                     per-test test-results/ folders and report attachments
mobile-viewports.json                   Playwright devices
eslint-plugin-cypress, chai-friendly    eslint-plugin-playwright
```

## Defects found in the source, and their guards

Each item was verified on the source `main` and fixed in the port. The guard keeps it from coming back.

- **Guidance named things the code did not have**: globals and commands copied from another product, a wrong url-file
  path, `npm run validate`, and a coverage script under the wrong name. Guard: `npm run validate`
  (`scripts/validate-guidance.js`), run by the pre-commit hook. It checks every cited path, npm script, command, and
  rule glob.
- **A rule and a skill disagreed** on freezing constraint objects. Settled on the code's practice: freeze grouped
  exports.
- **A rule described a parameter order the code did not use.** The rule now describes the code: one example request
  object after the client.
- **The unused-examples lint rule never ran**: its gate pointed at a removed folder. Fixed, and proven failing in
  `eslint-plugin-custom-rules/__tests__/rules.test.js`.
- **Spec rules had no file scope.** They fired on any call named `it`/`test`. In Playwright that includes `node:test`
  suites, and `eslint --fix` rewrote CLI test titles. Rules now run only on `playwright/{integration,e2e}/**/*.spec.js`,
  and a rule test proves a `node:test` file is left alone.
- **No lint rule had a test.** Every custom rule now has a case that must fail (`npm run test:rules`).
- **Typed l10n and colour keys were said to fail loudly, but `checkJs` was off.** The loaders now throw on an unknown key.
- **The duplicate-titles rule was documented as suite-wide but checks one file.** The docs now say per file.
- **A command pushed into an array owned by the spec.** The command now returns the collected products.
- **The inventory spec had two top-level describes**, against its own one-describe-per-file rule. The Header scenario
  now lives in `playwright/integration/ui/inventory-page.header.ui.spec.js`, with unchanged titles. Guard:
  `custom/enforce-single-describe`.
- **A typo in eight API command names** (a doubled "l"). Fixed in the port.
- **Accidental complexity**: a 594-line parallel runner, screenshot renaming, session caching, and two environment
  config files. Replaced by Playwright features.

## Scaffolder

`bin/playwright-start.js` is the port of `create-cypress-start` with its 41 tests (`node --test 'bin/__tests__/*.test.js'` in the template repository). The template
URL variable is `PLAYWRIGHT_START_TEMPLATE_URL`, and the manifest file is `.playwright-start-manifest.json`.

## Not ported

- The parallel-runner module of the scaffolder. Playwright workers and shards replace it; the CLI offers a small
  guidance-check module instead.
- Electron as a browser choice. `BROWSER` accepts chromium, chrome, edge, firefox, and webkit.
