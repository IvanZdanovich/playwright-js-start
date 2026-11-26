---
paths:
  - 'playwright/commands/**/*.commands.js'
---

# Reasoning Principles

EXTRACT_ONLY_REPEATED_SEQUENCES — Extract a command only for a multi-step flow, a multi-assertion check, or setup and teardown that repeats across specs.
A single `click()`, `fill()`, `clear()`, one-step navigation, or one-line assertion stays inline in the spec. A wrapper around one action adds a name to learn and removes no duplication.

CHOOSE_FILE_BY_OWNER — Choose the file by asking, in order, which page or component owns the command, which domain concept, and which layer.
One owner per file keeps each command findable, so it is not written twice. A body shared by two or more pages moves to a domain file. The files are listed below.

```
API page   playwright/commands/api/module-name.api.commands.js       one module
UI page    playwright/commands/ui/page-name.ui.commands.js           one page or component
domain     playwright/commands/ui/domain-name.ui.commands.js         one concept, several pages
common     playwright/commands/{api,ui}/common.{api,ui}.commands.js  protocol level, no domain owner
```

KEEP_OWNERSHIP_AT_ORIGIN — Keep a command that starts on one page in that page's file, even when another page's spec calls it.
The call site does not move ownership. Moving it scatters one page's actions across files.

KEEP_FIXTURES_FOR_LIFECYCLE — Write a command as a plain exported function, and add a fixture to `playwright/support/fixtures.js` only for a resource with setup, teardown, or a per-worker cache.
A fixture hides where a value comes from and needs the test to request it by name. The two fixtures today are `apiRequest` and `apiToken`.

# Output Shape

EXPORT_COMMAND_AS_FUNCTION — Export each command as `export async function <owner>__<action>(...)`, and keep helpers it uses unexported.
Specs import commands by name, so a typo fails in lint instead of at run time. The naming lint rules check every exported function in a command file.

NAME_COMMAND_BY_OWNER — Name each command `<owner>__<action>`, and add `__METHOD` only for a command that sends an HTTP request.
The owner prefix tells the reader which file holds the command. The lint rules check the shape, but not that the prefix matches the owner.

```
file kind  file                            name shape                       example
API        restful-booker.api.commands.js  apiResource__operation__METHOD   restfulBooker__createBooking__POST
UI page    login-page.ui.commands.js       pageNamePage__action             loginPage__logIn
UI comp    header-comp.ui.commands.js      componentName__action            headerComp__resetAppState
```

NAME_OPERATIONS_PRECISELY — Name the API operation as verb, then target, then qualifier, matching the endpoint.
Use CRUD verbs (`create`, `get`, `update`, `partialUpdate`, `delete`) for CRUD endpoints and domain verbs (`bulkDelete`, `assign`) otherwise. A vague `update` on a move endpoint hides what it does.

NAME_UI_ACTIONS_BY_GESTURE — Name each UI action by the user gesture or check it performs, then the element, as `selectSortOption`, `fillDeliveryInfo`, or `verifyCartBadge`.
A vague `handle` or `process` hides what the user does. Rename an existing command only with `scripts/rename-commands.js`, which also updates every import and caller.

PASS_CLIENT_FIRST — Take the Playwright object the command drives as the first parameter: `request` (an `APIRequestContext`) for API commands, `page` for UI commands.
The spec owns the client and the page, so the command never reaches for a global one that could belong to another test.

ACCEPT_WHOLE_REQUEST_EXAMPLE — Accept one pre-composed example request object after the client, `(request, { token, bookingId, body, qs, restOptions })`, and destructure it inside.
The spec then reads as "who sends which request". The examples file groups these objects by operation, so a command never needs field picking at the call.

ACCEPT_WHOLE_UI_EXAMPLE — Accept the complete example instance after `page`, `(page, example)`, and destructure it inside.
A UI command takes no user or token: the spec logged in already, and a second source could disagree with it.

BUILD_REQUEST_INSIDE_COMMAND — Build the URL, headers, auth, and wire-format body inside the API command from the example.
Examples stay camelCase, and each header or field mismatch lives in one place, as `mapBookingFields` does. A negative test that needs a broken header passes it through `restOptions`.

RETURN_READ_RESPONSE — Return `{ status, headers, body }` from every API command through `readResponse` in `playwright/support/api-response.js`.
The body must be read while the request context is alive, and one shape lets every spec assert `response.status` first.

SPREAD_REST_OPTIONS_LAST — Spread `restOptions` last into the fetch options, for per-call overrides such as `timeout` or `headers`.
Spreading earlier lets the defaults overwrite the caller's override.

LOCATE_WITH_SELECTOR_VARIABLES — Use selector variables imported from `playwright/selectors/selectors.js` in UI commands, never literal CSS or attribute strings.
For a locator that depends on a value, add a selector function to `selectors.js`. A literal breaks without warning when the markup changes.

MATCH_TEXT_THROUGH_L10N — Match and choose visible labels through `l10n['key']` imported from `playwright/support/l10n.js`, never literal UI text.
A literal label breaks on the first language switch or copy change. Load the localization-testing skill before adding a new key.

WAIT_ON_RESPONSE_OR_STATE — Wait on `page.waitForResponse()` started before the click, or on a retrying matcher, never on `page.waitForTimeout()`.
A fixed wait is too short on a slow run and wastes time on a fast one.

RETURN_RESULT_TO_SPEC — Return the value the spec needs next from a UI command, such as the products read from cards or a created ID.
The spec then asserts or stores the result, and the command holds no state of its own. A command that pushes into an array the spec passed in hides who owns the data.

ASSERT_WITH_EXPECT_INSIDE_VERIFY — Assert inside a command only when its name opens with `verify` or `validate`, and use `expect` from `@playwright/test`.
The name tells the spec reader that the call is a check. Other commands act and return.

IMPORT_ASSERTION_BOUNDARIES — Import constraint constants for boundary values used inside command assertions.
A copied literal drifts from the constraint when the rule changes.

# Validation

EXTRACT_ONLY_REPEATED_SEQUENCES_CHECK — Verify each command wraps a multi-step flow, a multi-assertion check, or shared setup or teardown, and not a single action.
CHOOSE_FILE_BY_OWNER_CHECK — Confirm each command sits in the file of its page, module, domain, or `common`.
NAME_COMMAND_BY_OWNER_CHECK — Confirm each command prefix matches its owner file and only HTTP commands end in `__METHOD`.
PASS_CLIENT_FIRST_CHECK — Confirm every API command takes `request` first and every UI command takes `page` first.
RETURN_READ_RESPONSE_CHECK — Verify every API command returns the result of `readResponse`.
SPREAD_REST_OPTIONS_LAST_CHECK — Confirm `...restOptions` is the last property of every fetch options object.
LOCATE_WITH_SELECTOR_VARIABLES_CHECK — Confirm UI commands reference selector variables and contain no raw selector strings.
MATCH_TEXT_THROUGH_L10N_CHECK — Confirm no UI command compares or chooses a visible label by a literal string.
WAIT_ON_RESPONSE_OR_STATE_CHECK — Run `npm run lint` and confirm `playwright/no-wait-for-timeout` reports nothing.
RETURN_RESULT_TO_SPEC_CHECK — Verify no command writes into an array or object the spec passed in.
NAMING_LINT_CHECK — Run `npm run lint` and confirm `custom/verify-api-command-naming` and `custom/verify-ui-command-naming` report nothing.
