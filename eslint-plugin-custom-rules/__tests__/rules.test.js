/**
 * One valid and at least one invalid case per custom rule, so every rule is seen failing ("red first").
 * Run: npm run test:rules
 */
const path = require('path');
const { describe, it } = require('node:test');
const { RuleTester } = require('eslint');
const plugin = require('../index.js');

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ROOT = path.resolve(__dirname, '..', '..');
const at = (relative) => path.join(ROOT, relative);
const UI_SPEC = at('playwright/integration/ui/cart-page.ui.spec.js');
const API_SPEC = at('playwright/integration/api/restful-booker.booking.api.spec.js');

const tester = new RuleTester({ languageOptions: { ecmaVersion: 'latest', sourceType: 'module' } });
// Spec rules run only on Playwright spec files, so a case without its own filename is linted as a UI spec.
const asSpec = (item) => ({ filename: UI_SPEC, ...item });
const run = (name, cases) => tester.run(name, plugin.rules[name], { valid: cases.valid.map(asSpec), invalid: cases.invalid.map(asSpec) });

const spec = (body) => `test.describe('CartPage: Given a cart', () => {\n${body}\n});`;

run('verify-test-title-pattern', {
  valid: [{ code: spec("  test.describe('CartPage.STANDARD: When user opens it', () => {\n    test('CartPage.STANDARD: Then title is shown', async () => {});\n  });") }],
  invalid: [
    { code: "test.describe('cart page', () => {});", errors: 1 },
    { code: spec("  test.describe('CartPage.STANDARD: Then wrong keyword', () => {});"), errors: 1 },
    { code: spec("  test('CartPage.STANDARD: When wrong keyword', async () => {});"), errors: 1 },
  ],
});

run('verify-test-title-without-forbidden-symbols', {
  valid: [{ code: "test.describe('CartPage: Given a cart', () => {});" }],
  invalid: [
    { code: "test.describe('CartPage: Given a cart!', () => {});", errors: 1 },
    { code: "test.describe(' CartPage: Given a cart', () => {});", errors: 1 },
  ],
});

run('prevent-duplicated-titles', {
  valid: [{ code: spec("  test.describe('CartPage.STANDARD: When A', () => {});\n  test.describe('CartPage.STANDARD: When B', () => {});") }],
  invalid: [{ code: spec("  test.describe('CartPage.STANDARD: When A', () => {});\n  test.describe('CartPage.STANDARD: When A', () => {});"), errors: 1 }],
});

run('do-not-allow-empty-blocks', {
  valid: [{ code: spec("  test.skip('CartPage.STANDARD: Then later', async () => {});") }, { code: spec("  test('CartPage.STANDARD: Then x', async () => { await check(); });") }],
  invalid: [
    { code: spec("  test('CartPage.STANDARD: Then x', async () => {});"), errors: 1 },
    { code: spec("  test.describe('CartPage.STANDARD: When y', () => {});"), errors: 1 },
  ],
});

run('enforce-spec-blank-lines', {
  valid: [{ code: spec("  test('A.B.R: Then a', async () => { a(); });\n  test('A.B.R: Then b', async () => { b(); });\n\n  test.describe('A.B.R: When c', () => {});"), filename: UI_SPEC }],
  invalid: [
    {
      code: spec("  test('A.B.R: Then a', async () => { a(); });\n\n  test('A.B.R: Then b', async () => { b(); });"),
      output: spec("  test('A.B.R: Then a', async () => { a(); });\n  test('A.B.R: Then b', async () => { b(); });"),
      filename: UI_SPEC,
      errors: 1,
    },
    {
      code: spec("  test('A.B.R: Then a', async () => { a(); });\n  test.describe('A.B.R: When c', () => {});"),
      output: spec("  test('A.B.R: Then a', async () => { a(); });\n\n  test.describe('A.B.R: When c', () => {});"),
      filename: UI_SPEC,
      errors: 1,
    },
  ],
});

run('standardize-test-titles', {
  valid: [{ code: "test('CartPage.STANDARD: Then button is displayed', async () => { a(); });", filename: UI_SPEC }],
  invalid: [{ code: "test('CartPage.STANDARD: Then btn is shown', async () => { a(); });", output: "test('CartPage.STANDARD: Then button is displayed', async () => { a(); });", filename: UI_SPEC, errors: 1 }],
});

run('prevent-examples-loops', {
  valid: [{ code: spec('  test.beforeAll(async () => { for (const item of examples.validItems) await create(item); });') }],
  invalid: [{ code: spec("  test('A.B.R: Then x', async () => { examples.validItems.forEach((item) => check(item)); });"), errors: 1 }],
});

run('verify-req-config', {
  valid: [{ code: "test('A.B.R: Then x', req({ p: 'P1', bugs: ['BUG-CART-001'] }), async () => { a(); });" }],
  invalid: [
    { code: "test('A.B.R: Then x', req({ p: 'P4' }), async () => { a(); });", errors: 1 },
    { code: "test('A.B.R: Then x', req({ owner: 'me' }), async () => { a(); });", errors: 1 },
    { code: "test('A.B.R: Then x', req({ bugs: ['bug-1'] }), async () => { a(); });", errors: 1 },
    { code: "test('A.B.R: Then x', { req: { p: 'P1' } }, async () => { a(); });", errors: 1 },
  ],
});

run('verify-api-command-naming', {
  valid: [{ code: 'export async function booking__create__POST(request, example) {}\nconst helper = () => {};', filename: at('playwright/commands/api/booking.api.commands.js') }],
  invalid: [
    { code: 'export async function createBooking(request, example) {}', filename: at('playwright/commands/api/booking.api.commands.js'), errors: 1 },
    { code: 'export async function booking__create__SEND(request, example) {}', filename: at('playwright/commands/api/booking.api.commands.js'), errors: 1 },
  ],
});

run('verify-ui-command-naming', {
  valid: [{ code: 'export async function loginPage__logIn(page, user) {}', filename: at('playwright/commands/ui/login-page.ui.commands.js') }],
  invalid: [
    { code: 'export async function logIn(page, user) {}', filename: at('playwright/commands/ui/login-page.ui.commands.js'), errors: 1 },
    { code: 'export const loginPage__log__In = async (page) => {};', filename: at('playwright/commands/ui/login-page.ui.commands.js'), errors: 1 },
  ],
});

run('verify-todos-have-links', {
  valid: [{ code: '// TODO: fix - https://company.atlassian.net/browse/PROJ-123\ntest.fixme();' }],
  invalid: [{ code: '// TODO: fix later', errors: 1 }],
});

run('find-unused-examples', {
  valid: [{ code: 'export const cartPage__examples = {\n  indicesOfProducts: [],\n};', filename: at('playwright/integration-examples/ui/cart-page.ui.examples.js') }],
  invalid: [
    {
      code: 'export const cartPage__examples = {\n  neverReferencedAnywhere: 1,\n};',
      output: 'export const cartPage__examples = {\n};',
      filename: at('playwright/integration-examples/ui/cart-page.ui.examples.js'),
      errors: 1,
    },
  ],
});

run('find-unused-selectors', {
  valid: [{ code: 'export const cartPage = {\n  title: \'[data-test="title"]\',\n};', filename: at('playwright/selectors/selectors.js') }],
  invalid: [
    {
      code: "export const cartPage = {\n  title: '[data-test=\"title\"]',\n  neverReferencedAnywhere: '.x',\n};",
      output: 'export const cartPage = {\n  title: \'[data-test="title"]\',\n};',
      filename: at('playwright/selectors/selectors.js'),
      errors: 1,
    },
  ],
});

run('verify-spec-file-paths', {
  valid: [{ code: 'export {};', filename: UI_SPEC }],
  invalid: [{ code: 'export {};', filename: at('playwright/integration/ui/cart-page.api.spec.js'), errors: 1 }],
});

run('verify-test-title-against-structure', {
  valid: [{ code: "test.describe('RestfulBooker.Booking: Given no preconditions', () => {});", filename: API_SPEC }],
  invalid: [],
});

run('enforce-single-describe', {
  valid: [{ code: spec("  test.describe('CartPage.STANDARD: When a', () => {\n    test('CartPage.STANDARD: Then b', async () => { a(); });\n  });"), filename: UI_SPEC }],
  invalid: [
    { code: `${spec('')}\n${spec('')}`, filename: UI_SPEC, errors: [{ messageId: 'secondDescribe' }] },
    { code: spec("  test('CartPage.STANDARD: Then b', async () => { a(); });"), filename: UI_SPEC, errors: [{ messageId: 'testOutsideDescribe' }] },
  ],
});

run('verify-test-title-pattern', {
  // Outside playwright/{integration,e2e}/ a `test()` call (for example a node:test suite) is not a spec block.
  valid: [{ code: "test('any free-form title', async () => {});", filename: at('bin/__tests__/playwright-start.test.js') }],
  invalid: [{ code: "test('any free-form title', async () => {});", errors: 1 }],
});
