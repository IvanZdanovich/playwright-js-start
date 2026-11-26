---
paths:
  - 'playwright/integration/ui/*.spec.js'
---

# Reasoning Principles

LIMIT_SPEC_TO_ONE_PAGE — Limit an integration UI spec to the visible behaviour of one page or component after an action.
Otherwise integration coverage drifts into end-to-end workflow testing. Multi-page cross-functional journeys belong in `playwright/e2e/ui/`.

CREATE_PRECONDITIONS_THROUGH_API — Create preconditions through API commands when the app has an API, and use the UI only for the behaviour under test.
Slow UI setup fails for reasons unrelated to the visible outcome. SauceDemo has no API, so its specs log in through `loginPage__logIn` in the top `test.beforeAll`.

# Output Shape

PLACE_SPEC_BY_PAGE — Place each spec at `playwright/integration/ui/<page-name>[.<component>].ui.spec.js`, adding dot segments only when they clarify the scope.
Spec-specific examples mirror the spec name. The related paths are listed below.

```
examples      playwright/integration-examples/ui/<page-name>[.<component>].ui.examples.js
selectors     playwright/selectors/selectors.js
UI commands   playwright/commands/ui/<page-or-aspect>.ui.commands.js     reusable interactions
API commands  playwright/commands/api/<module-or-aspect>.api.commands.js     setup and cleanup
constraints   playwright/constants/{api,ui}/<page-or-module-name>.{api,ui}.constraints.js
```

NEST_DESCRIBES_FOR_GIVEN_WHEN — Nest exactly one top `test.describe` (Given) per file, then sequential nested `test.describe` blocks (When), then `test` blocks (Then).
This shape lets the report read as the page states and user actions under test. The lint rules read the level from the nesting depth. A second top-level `test.describe` is a second scenario: give it its own spec file. `custom/enforce-single-describe` reports it, and a `test` outside a nested `test.describe`.

RUN_FILE_IN_SERIAL_MODE — Call `test.describe.configure({ mode: 'serial' })` first inside the top `test.describe`.
Each When builds on the state the previous one left, so the tests must run in order in one worker. The cost: after a failure, Playwright skips the rest of the file, and the sign-off report shows those checks as not executed.

SHARE_ONE_PAGE_PER_FILE — Declare `let page;`, create it in the top `test.beforeAll(async ({ browser }) => { page = await browser.newPage(); })`, and close it in the top `test.afterAll`.
The built-in `page` fixture is new for every test, so it cannot carry the session and page state from one When to the next.

SET_UP_IN_BEFORE_ALL — Set up in the top `test.beforeAll`: read users with `getUserDataByRole`, run cleanup, create API data, open the page, and log in.
Each nested `test.beforeAll` does the action or navigation of its When. Setup inside `test` bodies hides preconditions among outcomes.

FORMAT_TITLES_AS_GIVEN_WHEN_THEN — Format titles in the three Given, When, and Then forms below.
A fixed form lets a reader find the precondition, action, and outcome without reading the code.

```
Page.Component: Given preconditions, created data
Page.Component.USER_ROLE: When condition
Page.Component.USER_ROLE: Then expected result
```

KEEP_TITLES_UNIQUE — Keep titles unique within a When and prefixed with their scope, with no parentheses or square brackets, stating value meaning over literal values.
Duplicate or literal titles make the report ambiguous.

STATE_REQUIREMENT_IN_TITLE — State the requirement in the Given/When/Then title, and use `req()` only to classify, link, and scope it.
A long `note` duplicates the title, and the two versions then disagree.

RECORD_FACTS_IN_REQ — Record requirement facts with `req({ p, preconditions, refs, bugs, note })` from `playwright/support/req.js` as the second argument, not in comments.
`req()` stores them as Playwright annotations that the lint rule, the HTML report, and the sign-off report read. Inline `// P1`, `// TODO`, or Jira comments are invisible to tooling.

OMIT_EMPTY_REQ_FIELDS — Omit empty `req()` fields, and set `p` only for `'P1'` or `'P3'`, because `'P2'` is the default.
Keep tickets in `refs`, tracked bugs in `bugs`, and the behaviour reason in `note`.

PLACE_REQ_ON_NEAREST_BLOCK — Place `req()` on the smallest block it is true for, and leave parent metadata off its children.
Use `test` for one outcome, a nested `test.describe` for one action and all its outcomes, and the top `test.describe` for every block in the file.

NAME_ENTITIES_BY_PATTERN — Name created entities `SpecFileAbbr.EntityAbbr.ActionOrIntent.${randomSuffix}`.
The shared prefix lets cleanup find every record the spec made.

CLEAN_UP_BY_PREFIX — Clean up by name prefix through the API in the top `test.beforeAll` and `test.afterAll`, with data independent of other files.
Leftovers from crashed or earlier runs can make later specs pass falsely or fail at random. Where the app has no data to clean, reset its state instead, as `headerComp__resetAppState` does.

ASSIGN_SOURCE_ID_ONCE — Assign `examples.group.source.id = response.body.id` once, and expose `get id() { return examples.group.source.id; }` on dependents.
The source example owns the placeholder `id`, so one assignment updates every reader. Copied IDs fall out of step with the entity that was created.

REFERENCE_EXAMPLES_DIRECTLY — Reference `examples.group.instance` directly in commands and assertions, instead of local aliases.
Aliases make the asserted source harder to audit.

SOURCE_ASSERTED_VALUES — Source boundaries from constraints, displayed data from named examples, UI text from `l10n`, and theme colours from `colours`.
Inline literals are allowed only for attribute names, CSS property names, or structural states. An inline value drifts from its source and hides which rule it verifies.

IMPORT_SHARED_DATA — Import selectors, `l10n`, `colours`, urls, user roles, and commands by name at the top of the spec.
Imports let ESLint catch a misspelt name and let an editor jump to the source. Nothing in this framework is a global.

LOCATE_WITH_SELECTOR_VARIABLES — Locate elements with `page.locator(cartPage.title)` from `playwright/selectors/selectors.js`, never with a literal CSS string.
A literal breaks without warning when the selector changes, while purpose names stay valid when the markup changes.

SCOPE_LOCATORS_TO_PARENT — Chain a child locator from the parent of the component under test when practical, as `page.locator(cartPage.items).nth(i).locator(cartPage.item.remove)`.
A page-wide query can match a twin element elsewhere and pass for the wrong reason.

ASSERT_WITH_WEB_FIRST_MATCHERS — Assert page state with retrying matchers on a locator, such as `toHaveText`, `toHaveCount`, `toBeVisible`, `toHaveCSS`, and `toHaveURL`.
A value read once with `innerText()` and then compared does not wait for the page, so the test fails at random. `playwright/prefer-web-first-assertions` reports the common cases.

AWAIT_EVERY_PLAYWRIGHT_CALL — Await every locator action, matcher, and command call.
A missing `await` lets the test end before the step runs, so the step silently does not happen. `playwright/missing-playwright-await` reports it.

EXTRACT_REUSED_INTERACTIONS — Extract reused multi-step UI interactions into `<pageName>__<action>` or `<componentName>__<action>` commands.
One-off `click()`, `fill()`, `clear()`, and simple assertions stay inline. The cost is a command file to maintain.

OPEN_PAGE_WITH_PAGE_URLS — Open the page under test with `page.goto()` and a value from `pages` in `playwright/support/urls.js`, and click through menus only when navigation is the behaviour under test.
A chain of menu clicks breaks every page spec when the menu changes, although the page itself still works. SauceDemo answers interior routes with 404, so its specs open `/` and log in.

RESTORE_STATE_IN_AFTER_ALL — Restore in the nested `test.afterAll` any page state the next When does not expect, such as a typed field or an open banner.
Leftover state makes the next When pass or fail because of the previous one. Place the hook right after its `test.beforeAll`.

WAIT_ON_RESPONSE_OR_STATE — Wait for page data with `page.waitForResponse()` started before the click, or with a retrying matcher, never with `page.waitForTimeout()`.
A fixed wait is too short on a slow environment and wastes time on a fast one. `playwright/no-wait-for-timeout` reports it.

KEEP_RUNTIME_VALUES_IN_SPEC — Keep values measured during the run, such as products read from cards, in spec-scope `let` variables, and not on the examples object.
Runtime entity IDs are the exception and follow `ASSIGN_SOURCE_ID_ONCE`. A command returns the value, as `inventoryPage__collectAndAddProductsToCart` does, and the spec stores it.

KEEP_TEST_BODIES_SHORT — Keep each `test` body near five lines, with one verified outcome.
Add comments only when they add behaviour meaning. A long body hides which outcome failed.

# Validation

PAGE_SCOPE_CHECK — Confirm the spec drives one page or component only, or move multi-page journeys to `playwright/e2e/ui/`.
STRUCTURE_CHECK — Verify the spec holds exactly one top `test.describe` and nests it, nested `test.describe`, and `test`, with serial mode configured first.
SHARED_PAGE_CHECK — Confirm the page is created in the top `test.beforeAll` and closed in the top `test.afterAll`.
SEGMENTATION_CHECK — Verify each `test` asserts exactly one outcome.
TITLE_CHECK — Confirm every title is unique, prefixed with page or component, and in Given/When/Then form.
CLEANUP_CHECK — Confirm the top hooks clean up or reset state and the spec passes when run alone.
ID_OWNERSHIP_CHECK — Verify each runtime ID is assigned once to one instance, and any second assignment of that value is a getter instead.
SOURCE_CHECK — Confirm every asserted value resolves to a constraint, named example field, `l10n` key, or `colours` key, with no orphan literals.
SELECTOR_CHECK — Confirm every locator uses a selector variable and no literal CSS string remains.
WEB_FIRST_CHECK — Run `npm run lint` and confirm no `playwright/*` rule reports the spec.
REQ_METADATA_CHECK — Verify empty `req()` fields are omitted, links sit in `refs`, bugs in `bugs`, and `note` adds meaning beyond the title.
COMMENT_CHECK — Verify no inline priority, Jira, bug, or TODO comment remains where a `req()` field should carry it.
