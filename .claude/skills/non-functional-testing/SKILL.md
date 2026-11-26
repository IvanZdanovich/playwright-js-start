---
name: non-functional-testing
description: Use when designing or reviewing Playwright checks for performance, security, accessibility, or reliability inside functional flows.
---

# Intent

Produce guarded non-functional assertions for performance, security, accessibility, and reliability that run inside functional flows only when CI enables them.
When entries conflict or none applies, choose the option that keeps the functional verdict separate from the quality verdict.

# Reasoning Principles

ASK_WHAT_BREAKS_QUALITY — Ask what would make the system slow, insecure, or unreliable, then check what the tests miss.
Forward coverage alone misses the quality rule that nobody asserted.

EMBED_CHECKS_IN_FLOWS — Embed non-functional checks in functional automation as guarded assertions, not in a separate suite.
A quality rule kept outside the flow that exercises it drifts from that flow. The cost is a guard in every check.

ISOLATE_IN_OWN_TEST — Isolate each non-functional assertion in its own spec-declared `test` block.
Otherwise a slow response fails the same verdict as a wrong response and breaks the functional flow.

GATE_TIMING_CHECKS_OFF — Gate timing and environment-sensitive checks off by default and run them in a dedicated CI stage.
Always-on latency assertions turn green suites red on network noise.

MATCH_DEPTH_TO_OPERATION — Match threshold and depth to the operation under test.
Holding a read to the latency of a write, or a happy path to the depth of a boundary, gets both wrong.

# Output Shape

ENABLE_WITH_NFR_FLAG — Enable the checks with `NFR_CHECKS=true` from CI, and leave them disabled by default.
A CI run looks like `NFR_CHECKS=true TARGET_ENV=qa npm test`.

GUARD_INSIDE_COMMANDS — Guard reusable assertion commands internally with `if (process.env.NFR_CHECKS !== 'true') return;`, so callers never manage the flag.
A guard at every call site is forgotten in at least one of them.

IMPORT_THRESHOLDS — Import limits from frozen constraint exports such as `PERF.MAX_RESPONSE_MS` and `SECURITY.SENSITIVE_FIELDS`.
A hardcoded threshold drifts from the agreed limit without anyone noticing.

DECLARE_TESTS_IN_SPECS — Declare `test.describe` and `test` blocks in specs only, and keep commands to guarded assertions.
Playwright collects tests when the spec file loads, so a test declared inside a command call throws.

SHAPE_NFR_WHEN — Shape coverage as a spec-declared nested `test.describe('... — non-functional')` with focused `test` blocks that call guarded `nfr__` commands.
The suffix lets a reader and a report tell quality failures from functional ones.

FAIL_WITH_MESSAGE — Fail with an `expect(value, message)` assertion that carries a descriptive message.
A bare assertion failure gives no hint which quality rule broke.

PREFIX_SHARED_COMMANDS — Prefix shared non-functional assertion commands with `nfr__` so any spec or command can call them.
The prefix marks the guard and keeps these commands out of functional command lists.

PLACE_COMMANDS_BY_LAYER — Place API checks in `playwright/commands/api/` and UI checks in `playwright/commands/ui/`.
Consumers look for layer-specific helpers in those folders only.

SCOPE_API_CHECKS — Scope API commands to response duration, payload size, sensitive fields, status code ranges, and header presence.
These are the attributes a single response can prove.

SCOPE_UI_CHECKS — Scope UI commands to element alignment, colour contrast, focus visibility, aria attributes, and render timing.
These are the attributes a single element can prove.

CALL_FOR_LAYERED_CHECKS — Call assertion commands for layered checks, such as `nfr__<assertResponsePerformance>(response)` after an API command.
On UI elements pass the locator, as `nfr__<assertElementAccessibility>(page.locator(selector))`. One check then serves every flow.

ACCEPT_RESPONSE_IN_API_COMMANDS — Accept the `{ status, headers, body, duration }` result and an optional threshold in API `nfr__` commands, guard on the flag, and assert with descriptive messages.
They cover response duration, payload size, headers, or the absence of sensitive fields.

ACCEPT_LOCATOR_IN_UI_COMMANDS — Accept a locator in UI `nfr__` commands and return without asserting when the flag is off.
The calling step then runs unchanged in a normal run.

ASSERT_RESPONSE_TIME — Measure each request with `Date.now()` around `request.fetch` in the API command, and assert `duration < threshold` separately for each endpoint.
Playwright's API response has no duration of its own, and a combined measurement cannot show which endpoint is slow.

ASSERT_PAYLOAD_SIZE — Assert `JSON.stringify(response.body).length < MAX_PAYLOAD_BYTES`.
Payload growth slows every client long before a timeout appears.

CHECK_PAGINATION_SEPARATELY — Check list responses against their own list threshold.
A list held to a single-item threshold fails on normal data growth.

ASSERT_ACCESS_DENIAL — Assert that unauthorized requests fail and role-based access is denied, not only that the happy path works.
A missing negative check lets an open endpoint pass.

PROBE_AUTH_BY_LAYER — Probe auth at the transport, then resource, then field level.
A check at one layer misses a leak at another.

VERIFY_AUTH_FIRST — Verify that auth is required before testing the feature behind it.
Feature tests on an unprotected endpoint pass while hiding the larger defect.

ASSERT_NO_SENSITIVE_FIELDS — Assert the response body excludes password, token, and secret fields.
A leaked secret is a security defect even when every functional assertion passes.

PROVE_UNSAFE_INPUT_REJECTED — Prove that invalid and boundary input is rejected at auth, input, and file-upload boundaries.
These are the boundaries attackers probe first.

VERIFY_NO_STACK_TRACES — Verify that error responses carry no stack traces.
A stack trace exposes internals to any caller.

ASSERT_STATE_AFTER_FAILURE — Assert that invalid input is rejected and state stays consistent after a failure.
A partial write after a rejected request corrupts later tests and real data.

VERIFY_RETRY_SAFETY — Verify concurrent-edit handling and safe retry behaviour.
Unsafe retries duplicate records when the network is slow.

OBSERVE_WITH_WAIT_FOR_RESPONSE — Observe network behaviour with `page.waitForResponse()` or `page.on('response')` without changing the response.
A response changed with `page.route()` tests the stub, not the system.

ASSERT_ACCESSIBLE_NAME — Assert that interactive elements expose an accessible name through visible text, a label, `aria-label`, or `aria-labelledby`.
Prefer native naming and treat ARIA as a fallback. Without a name, screen readers announce the control as unlabelled.

ASSERT_CONTRAST_COLOUR — Assert the `color` CSS value against the expected colour.
Low contrast makes text unreadable for many users.

ASSERT_FOCUS_AND_ALIGNMENT — Assert focus visibility and element alignment.
Keyboard users cannot work a page where focus is invisible.

EXCLUDE_DEDICATED_TOOLING — Exclude dedicated load testing, penetration testing, and visual regression from this scope.
Those need their own tools, and functional specs cannot run them reliably.

# Validation

COVERAGE_CHECK — Verify security and performance When blocks exist for every endpoint named by the requirement, changed flow, or risk note.
THRESHOLD_CHECK — Confirm every threshold is imported from constraints and none is a copied literal.
AUTH_CHECK — Verify every protected endpoint is tested with invalid and missing tokens.
ISOLATION_CHECK — Confirm non-functional assertions sit in spec-declared `test` blocks, commands declare no `test.describe` or `test`, and functional flow is unaffected.
SCOPE_CHECK — Verify the checks stay within functional automation and overlap no load or penetration test.
