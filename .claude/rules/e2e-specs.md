---
paths:
  - 'playwright/e2e/ui/*.spec.js'
---

# Reasoning Principles

LIMIT_SPEC_TO_JOURNEY — Limit an E2E spec to one user journey that spans several pages or steps.
Page-level checks belong in integration UI specs. Mixing them hides which journey a failure breaks.

REUSE_ENTITIES_ACROSS_STEPS — Reuse entities created in earlier steps across create, modify, verify, and complete.
Otherwise the test exercises isolated actions rather than the journey. The cost is that a failed step blocks the later ones.

ORDER_STEPS_BY_JOURNEY — Order the nested `test.describe` blocks the way a real user lives the workflow, with explicit state for each step.
Convenience ordering stops the spec from documenting the requirement.

MATCH_ASSERTIONS_TO_TITLE — Match the title, example, action, and assertion to one verified business outcome.
A spec that asserts less than its title claims gives false confidence.

# Output Shape

PLACE_SPEC_BY_WORKFLOW — Place each spec at `playwright/e2e/ui/<workflow-name>.ui.spec.js`, named in kebab-case after the business flow.
The related paths are listed below.

```
examples      playwright/e2e-examples/ui/<workflow-name>.ui.examples.js
selectors     playwright/selectors/selectors.js
UI commands   playwright/commands/ui/*.ui.commands.js     reusable workflow interactions
API commands  playwright/commands/api/*.api.commands.js    setup and cleanup
constraints   playwright/constants/{api,ui}/*.{api,ui}.constraints.js
registry      eslint-plugin-custom-rules/app-structure/workflows.json
```

NEST_DESCRIBE_PER_STEP — Nest exactly one top `test.describe` (Given) per file, then one nested `test.describe` per workflow step (When), then `test` blocks (Then).
This shape lets the report read as the steps of the journey. A second top-level `test.describe` is a second scenario: give it its own spec file. `custom/enforce-single-describe` reports it, and a `test` outside a nested `test.describe`.

RUN_FILE_IN_SERIAL_MODE — Call `test.describe.configure({ mode: 'serial' })` first inside the top `test.describe`.
Each step hands its state to the next, so the steps must run in order in one worker. A failed step stops the later ones, which is the true outcome of a broken journey.

SHARE_ONE_PAGE_PER_FILE — Declare `let page;`, create it in the top `test.beforeAll` from `browser.newPage()`, and close it in the top `test.afterAll`.
The built-in `page` fixture is new for every test, so it cannot carry the session and cart from one step to the next.

SET_UP_IN_BEFORE_ALL — Set up in the top `test.beforeAll`: read users, run cleanup, create API data, open the page, and log in.
Each step's `test.beforeAll` performs the step's action. Setup inside `test` bodies hides preconditions among outcomes.

FORMAT_TITLES_AS_GIVEN_WHEN_THEN — Format titles in the three Given, When, and Then forms below.
A fixed form lets a reader find the precondition, step, and outcome without reading the code.

```
Flow.SubFlow: Given preconditions, created data
Flow.SubFlow.USER_ROLE: When condition
Flow.SubFlow.USER_ROLE: Then expected result
```

KEEP_TITLES_UNIQUE — Keep titles unique within a step and prefixed with their flow, with no parentheses or square brackets, stating value meaning over literal values.
Duplicate or literal titles make the report ambiguous.

STATE_REQUIREMENT_IN_TITLE — State the requirement in the Given/When/Then title, and use `req()` only to classify, link, and scope it.
A long `note` duplicates the title, and the two versions then disagree.

RECORD_FACTS_IN_REQ — Record requirement facts with `req({ p, preconditions, refs, bugs, note })` as the second argument, not in comments.
Inline `// P1`, `// TODO`, or Jira comments are invisible to the lint rule and the reports.

PLACE_REQ_ON_NEAREST_BLOCK — Place `req()` on the smallest block it is true for, and leave parent metadata off its children.
Use `test` for one outcome, a step `test.describe` for one step, and the top `test.describe` for the whole journey.

CLEAN_UP_BY_PREFIX — Clean up through the API in the top hooks, or reset the app state where it has no API, as `headerComp__resetAppState` does.
Leftovers from crashed or earlier runs can make later specs pass falsely or fail at random.

ASSIGN_SOURCE_ID_ONCE — Assign a created ID once on its source example, and expose a getter on dependents.
Copied IDs fall out of step with the entity that was created.

KEEP_WORKFLOW_DATA_IN_EXAMPLES — Keep setup, execution, and verification values in the E2E examples file.
Values typed into the spec fork from the examples and hide what the journey verifies.

ALIGN_SETUP_WITH_ASSERTIONS — Align setup values with verification values by taking both from the same instance or the same command result.
Otherwise the assertion verifies a state the setup never produced.

REFERENCE_EXAMPLES_DIRECTLY — Reference `examples.group.instance` directly in commands and assertions, instead of local aliases.
Aliases make the asserted source harder to audit.

SOURCE_ASSERTED_VALUES — Source boundaries from constraints, displayed data from named examples, UI text from `l10n`, and theme colours from `colours`.
Inline literals are allowed only for attribute names, CSS property names, or structural states.

LOCATE_WITH_SELECTOR_VARIABLES — Locate elements with selector variables imported from `playwright/selectors/selectors.js`, never with literal CSS strings.
A literal breaks without warning when the selector changes.

ASSERT_WITH_WEB_FIRST_MATCHERS — Assert page state with retrying locator matchers, and await every Playwright call.
A value read once does not wait for the page, and a missing `await` lets the step silently not happen.

EXTRACT_REUSED_WORKFLOW_ACTIONS — Extract reused multi-step workflow actions into `<pageName>__<action>` or `<componentName>__<action>` commands named in business terms.
One-off `click()`, `fill()`, and simple assertions stay inline. The cost is a command file to maintain.

WAIT_ON_RESPONSE_OR_STATE — Wait for page data with `page.waitForResponse()` or a retrying matcher, never with `page.waitForTimeout()`.
A journey adds up every fixed wait, and each one is too short on a slow environment.

KEEP_TEST_BODIES_SHORT — Keep each `test` body near five lines, with one verified outcome.
A long body hides which outcome failed.

# Validation

WORKFLOW_SCOPE_CHECK — Confirm the spec spans several user steps or pages and reuses workflow state, or move it to `playwright/integration/ui/`.
STRUCTURE_CHECK — Verify the spec holds exactly one top `test.describe` and nests it, one nested `test.describe` per step, and `test`, with serial mode configured first.
SHARED_PAGE_CHECK — Confirm the page is created in the top `test.beforeAll` and closed in the top `test.afterAll`.
FLOW_CHECK — Confirm the steps follow the business order of the user journey.
SEGMENTATION_CHECK — Verify each `test` asserts exactly one outcome.
TITLE_CHECK — Confirm every title is unique, flow-prefixed, and in Given/When/Then form.
CLEANUP_CHECK — Confirm the top hooks clean up or reset state and the spec passes when run alone.
ALIGNMENT_CHECK — Verify every assertion reads the same example instance or command result that the setup used.
SOURCE_CHECK — Confirm every asserted value resolves to a constraint, named example field, `l10n` key, or `colours` key, with no orphan literals.
SELECTOR_CHECK — Confirm every locator uses a selector variable and no literal CSS string remains.
REQ_METADATA_CHECK — Verify empty `req()` fields are omitted, links sit in `refs`, bugs in `bugs`, and `note` adds meaning beyond the title.
