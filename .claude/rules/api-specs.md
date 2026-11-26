---
paths:
  - 'playwright/integration/api/*.spec.js'
---

# Reasoning Principles

LIMIT_SPEC_TO_API_CONTRACT — Limit an API spec to the request and response contract, status, payload, headers, error cases, or CRUD lifecycle of an endpoint.
UI behaviour belongs in UI specs. Mixing layers hides which contract a failure breaks.

ASSERT_ASSUMED_OUTCOME — Assert the assumed outcome of a named example or business rule.
Otherwise a failing assertion points at brittle test data rather than a real contradiction.

# Output Shape

PLACE_SPEC_BY_DOMAIN — Place each spec at `playwright/integration/api/<kebab-domain>[.<kebab-scenario>].api.spec.js`, with one or more dot-separated segments.
Spec-specific examples mirror the spec name. The related paths are listed below.

```
examples     playwright/integration-examples/api/<kebab-domain>[.<kebab-scenario>].api.examples.js
constraints  playwright/constants/api/<module-name>.api.constraints.js
commands     playwright/commands/api/<module-or-aspect>.api.commands.js
urls         playwright/support/urls.js
fixtures     playwright/support/fixtures.js       apiRequest, apiToken
registry     eslint-plugin-custom-rules/app-structure/modules.json
```

NEST_DESCRIBES_FOR_GIVEN_WHEN — Nest exactly one top `test.describe` (Given) per file, then sequential nested `test.describe` blocks (When), then `test` blocks (Then).
This shape lets the report read as the states or lifecycle steps of the endpoint under test. A second top-level `test.describe` is a second scenario: give it its own spec file. `custom/enforce-single-describe` reports it, and a `test` outside a nested `test.describe`.

RUN_FILE_IN_SERIAL_MODE — Call `test.describe.configure({ mode: 'serial' })` first inside the top `test.describe`.
Created IDs pass from one When to the next, so the tests must run in order in one worker. The cost: after a failure, the rest of the file is not executed.

IMPORT_TEST_FROM_FIXTURES — Import `test` and `expect` from `playwright/support/fixtures.js`, not from `@playwright/test`.
Only that `test` provides the worker-scoped `apiRequest` client and the `apiToken(role)` function that hooks and tests need.

SET_UP_IN_BEFORE_ALL — Set up in the top `test.beforeAll(async ({ apiRequest, apiToken }) => ...)` by getting a token, running cleanup, and creating API data.
Each nested `test.beforeAll` does the setup for its When. Setup inside `test` bodies hides preconditions among outcomes.

TAKE_CLIENT_FROM_FIXTURE — Take the API client as `async ({ apiRequest }) =>` in each `test` and pass it as the first command argument.
A client stored in a spec variable outlives its fixture and fails once the worker disposes it.

FORMAT_TITLES_AS_GIVEN_WHEN_THEN — Format titles in the three Given, When, and Then forms below.
A fixed form lets a reader find the precondition, request, and outcome without reading the code.

```
Module.Submodule: Given preconditions, created data
Module.Submodule.Operation.METHOD: When condition
Module.Submodule.Operation.METHOD: Then expected result
```

KEEP_TITLES_UNIQUE — Keep titles unique within a When and prefixed with their scope, with no parentheses or square brackets, stating value meaning over literal values.
Duplicate or literal titles make the report ambiguous.

STATE_REQUIREMENT_IN_TITLE — State the requirement in the Given/When/Then title, and use `req()` only to classify, link, and scope it.
A long `note` duplicates the title, and the two versions then disagree.

RECORD_FACTS_IN_REQ — Record requirement facts with `req({ p, preconditions, refs, bugs, note })` from `playwright/support/req.js` as the second argument, not in comments.
`req()` stores them as Playwright annotations that the lint rule and both reports read. Inline `// P1`, `// TODO`, or Jira comments are invisible to tooling.

OMIT_EMPTY_REQ_FIELDS — Omit empty `req()` fields, and set `p` only for `'P1'` or `'P3'`, because `'P2'` is the default.
Keep tickets in `refs`, tracked bugs in `bugs`, and the behaviour reason in `note`.

PLACE_REQ_ON_NEAREST_BLOCK — Place `req()` on the smallest block it is true for, and leave parent metadata off its children.
Use `test` for one outcome, a nested `test.describe` for one request and all its outcomes, and the top `test.describe` for every block.

ORDER_WHENS_BY_DEPENDENCY — Order the nested `test.describe` blocks by dependency, with explicit state for each.
A hidden dependency makes the spec fail when one When is skipped or moved.

NAME_ENTITIES_BY_PATTERN — Name created entities with the spec's `namePrefix` and a random suffix.
The shared prefix lets cleanup find every record the spec made.

CLEAN_UP_BY_PREFIX — Clean up through the API in the top `test.beforeAll` and `test.afterAll`, as `restfulBooker__bulkDelete__DELETE` does, with data independent of other files.
Leftovers from crashed or earlier runs can make later specs pass falsely or fail at random.

MOVE_INSTANCE_THROUGH_LIFECYCLE — Move one named instance through create, retrieve, update, partial update, and delete when the endpoint lifecycle requires it.
Separate instances per step multiply calls and stop the spec from proving the lifecycle.

ASSIGN_SOURCE_ID_ONCE — Assign `examples.group.source.bookingId = response.body.bookingid` once, and expose a getter on dependents.
The source example owns the placeholder, so one assignment updates every reader. Copied IDs fall out of step with the entity that was created.

PASS_REQUEST_INSTANCE_UNCHANGED — Pass the pre-composed example request instance to the command unchanged.
Request data built in the spec forks from the constraint-backed data. Examples are a `const body = {...}`, a spread, or an inline object of IDs.

REFERENCE_EXAMPLES_DIRECTLY — Reference `examples.group.instance` directly, instead of local aliases.
Aliases make the asserted source harder to audit.

SOURCE_ASSERTED_VALUES — Source boundaries from constraints and expected response data from named examples.
Inline literals are allowed only for property or header names and structural states. An inline value drifts from its source and hides which rule it verifies.

ASSERT_STATUS_FIRST — Assert `response.status` as the first expectation of every response the spec verifies.
Playwright never throws on a 4xx or 5xx response, so without this line an error body with similar fields can pass the field checks.

COMPARE_TO_EXPECTED_OBJECT — Compare a response part with many expected fields to one expected object from the example with `toMatchObject` or `toEqual`.
Long runs of one `expect` per field hide the case under repetition, and the first failure stops the test before the others show.

FIND_LIST_ITEMS_BY_KEY — Find an item in a response list by its ID or name with `.find()`, unless the order is the asserted behaviour.
An index breaks or reads the wrong item when the server changes its sort order. The cost is a longer lookup expression.

KEEP_TEST_BODIES_SHORT — Keep each `test` body near five lines, with one verified outcome.
Add comments only when they add behaviour meaning. A long body hides which outcome failed.

# Validation

STRUCTURE_CHECK — Verify the spec holds exactly one top `test.describe` and nests it, nested `test.describe`, and `test`, with serial mode configured first.
FIXTURE_CHECK — Confirm `test` is imported from `playwright/support/fixtures.js` and every test takes `apiRequest` from its arguments.
SEGMENTATION_CHECK — Verify each `test` asserts exactly one outcome.
TITLE_CHECK — Verify every title is unique, constraint-backed, and in Given/When/Then form.
CLEANUP_CHECK — Confirm the top hooks both run cleanup by name prefix and the spec passes when run alone.
ID_OWNERSHIP_CHECK — Verify each runtime ID is assigned once to one instance, and any second assignment of that value is a getter instead.
REQUEST_SOURCE_CHECK — Verify path params, query, headers, and body come from the named example instance and none is a rebuilt literal.
SOURCE_CHECK — Confirm every asserted value resolves to a constraint or named example field, with no orphan literals.
ASSERT_STATUS_FIRST_CHECK — Confirm every verified response asserts `response.status` before any other expectation.
FIND_LIST_ITEMS_BY_KEY_CHECK — Verify every array index on a response list is either part of an order assertion or replaced by a lookup on ID or name.
REQ_METADATA_CHECK — Verify empty `req()` fields are omitted, links sit in `refs`, bugs in `bugs`, and `note` adds meaning beyond the title.
COMMENT_CHECK — Verify no inline priority, Jira, bug, or TODO comment remains where a `req()` field should carry it.
