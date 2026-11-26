# Timeouts

Use this page to find the default timeouts and to override one for a single call. All defaults are defined once, by
category, in `TIMEOUTS` in `playwright/constants/timeouts.js`. `playwright.config.js` and the `apiRequest` fixture map
them onto Playwright's settings.

## Defaults

- **`uiCommand`** (4 s) — `use.actionTimeout`: locator actions such as `click` and `fill`.
- **`uiAssertion`** (3 s) — `expect.timeout`: the retry window of web-first matchers such as `toHaveText`.
- **`pageLoad`** (10 s) — `use.navigationTimeout`: `page.goto`, `page.goBack`, `page.reload`.
- **`apiResponse`** (5 s) — the `apiRequest` fixture timeout: every API command call.
- **`fileUpload`**, **`fileDownload`** (10 s) — pass explicitly where a spec waits for a file.

A wait slower than its budget fails the test, so slow responses surface as failures instead of being hidden by a
permissive timeout. Change a default in `playwright/constants/timeouts.js` only when the whole suite needs it.

The test timeout (60 s in `playwright.config.js`) also bounds every `test.beforeAll`, which in a serial spec holds
the setup and the action of a whole When.

## Overriding one call

Import `TIMEOUTS` and pass `{ timeout }` when one step needs a different category, such as a list that renders after
an API round trip:

```javascript
import { TIMEOUTS } from '../../constants/timeouts';

await expect(page.locator(cartPage.items)).toHaveCount(examples.indicesOfProducts.length, { timeout: TIMEOUTS.apiResponse });
```

For API commands, pass `restOptions: { timeout }` in the example request object. Keep the override on the one call
that needs it: raising a global default slows every failing test in the suite.

## Waiting for data

Wait with a web-first matcher, or with `page.waitForResponse()` started before the click that sends the request:

```javascript
const bookingLoaded = page.waitForResponse((response) => response.url().includes('/booking/'));
await page.locator(cartPage.checkout).click();
await bookingLoaded;
```

A fixed `page.waitForTimeout()` is too short on a slow environment and wastes time on a fast one. The
`playwright/no-wait-for-timeout` lint rule reports it.
