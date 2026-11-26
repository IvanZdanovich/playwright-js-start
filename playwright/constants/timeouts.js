/**
 * Categorised timeout defaults (milliseconds) shared by `playwright.config.js`, commands, and specs.
 *
 * Values are production-level response budgets: a wait that exceeds one fails the test, so slow responses surface
 * as failures instead of being absorbed by a permissive timeout.
 *
 * CommonJS so `playwright.config.js` can `require` it; specs and commands `import { TIMEOUTS }`.
 * These are defaults only: a single call can still override one, e.g. `locator.click({ timeout })`,
 * `expect(locator).toBeVisible({ timeout })`, or `restOptions: { timeout }` on an API command.
 *
 * See docs/timeouts.md.
 */
const TIMEOUTS = Object.freeze({
  /** API request round trip (`request.fetch`, `page.waitForResponse`). Applied by every API command. */
  apiResponse: 5000,
  /** Locator action timeout (`click`, `fill`, ...); config `use.actionTimeout`. */
  uiCommand: 4000,
  /** Web-first assertion retry window (`expect(locator)...`); config `expect.timeout`. */
  uiAssertion: 3000,
  /** `page.goto` and navigation timeout; config `use.navigationTimeout`. */
  pageLoad: 10000,
  /** Wait for an attachment upload to finish. */
  fileUpload: 10000,
  /** Wait for a file download (e.g. report export) to finish. */
  fileDownload: 10000,
});

module.exports = { TIMEOUTS };
