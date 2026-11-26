import { test, expect } from '../../support/fixtures';
import { req } from '../../support/req';
import { loginPage, inventoryPage } from '../../selectors/selectors';
import { l10n } from '../../support/l10n';
import { colours } from '../../support/colours';
import { pages } from '../../support/urls';
import { userRoles } from '../../constants/user-roles';
import { getUserDataByRole } from '../../support/users';
import { headerComp__logOut } from '../../commands/ui/header-comp.ui.commands';
import { loginPage__logIn } from '../../commands/ui/login-page.ui.commands';
import { loginPage__examples as examples } from '../../integration-examples/ui/login-page.ui.examples';

test.describe('LoginPage: Given authenticate page opened', () => {
  test.describe.configure({ mode: 'serial' });
  let page;
  let standardUser, lockedUser;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    standardUser = getUserDataByRole(userRoles.STANDARD);
    lockedUser = getUserDataByRole(userRoles.LOCKED);
    await page.goto('/');
  });

  test.describe('LoginPage.STANDARD: When user reviews the page', () => {
    test('LoginPage.STANDARD: Then login page title text matches the localization value', async () => {
      await expect(page.locator(loginPage.title)).toHaveText(l10n['loginPage.title']);
      await expect(page.locator(loginPage.title)).toBeVisible();
    });
    test('LoginPage.STANDARD: Then username field placeholder matches the localization value and is empty', async () => {
      await expect(page.locator(loginPage.username)).toHaveAttribute('placeholder', l10n['loginPage.form.username']);
      await expect(page.locator(loginPage.username)).toHaveValue(examples.formField.emptyValue);
      await expect(page.locator(loginPage.username)).toBeVisible();
    });
    test('LoginPage.STANDARD: Then password field placeholder matches the localization value, has password type and is empty', async () => {
      await expect(page.locator(loginPage.password)).toHaveAttribute('placeholder', l10n['loginPage.form.password']);
      await expect(page.locator(loginPage.password)).toHaveAttribute('type', examples.formField.passwordType);
      await expect(page.locator(loginPage.password)).toHaveValue(examples.formField.emptyValue);
      await expect(page.locator(loginPage.password)).toBeVisible();
    });
    test('LoginPage.STANDARD: Then authenticate button matches the localization value and is enabled', async () => {
      await expect(page.locator(loginPage.login)).toHaveValue(l10n['loginPage.form.login']);
      await expect(page.locator(loginPage.login)).toBeVisible();
      await expect(page.locator(loginPage.login)).toBeEnabled();
    });
  });

  test.describe('LoginPage.STANDARD: When user logs in with valid credentials', () => {
    test.beforeAll(async () => {
      await loginPage__logIn(page, standardUser);
    });
    test('LoginPage.STANDARD: Then URL changes to the Inventory page', async () => {
      await expect(page).toHaveURL(pages.inventory);
    });
    test('LoginPage.STANDARD: Then Inventory page title is displayed', async () => {
      await expect(page.locator(inventoryPage.title)).toHaveText(l10n['inventoryPage.title']);
      await expect(page.locator(inventoryPage.title)).toBeVisible();
    });
  });

  test.describe('LoginPage.STANDARD: When user logs out', () => {
    test.beforeAll(async () => {
      await headerComp__logOut(page);
    });
    test('LoginPage.STANDARD: Then login page title text matches the localization value', async () => {
      await expect(page.locator(loginPage.title)).toHaveText(l10n['loginPage.title']);
      await expect(page.locator(loginPage.title)).toBeVisible();
    });
    test('LoginPage.STANDARD: Then username field placeholder matches the localization value and is empty', async () => {
      await expect(page.locator(loginPage.username)).toHaveAttribute('placeholder', l10n['loginPage.form.username']);
      await expect(page.locator(loginPage.username)).toHaveValue(examples.formField.emptyValue);
      await expect(page.locator(loginPage.username)).toBeVisible();
    });
    test('LoginPage.STANDARD: Then password field placeholder matches the localization value, has password type and is empty', async () => {
      await expect(page.locator(loginPage.password)).toHaveAttribute('placeholder', l10n['loginPage.form.password']);
      await expect(page.locator(loginPage.password)).toHaveAttribute('type', examples.formField.passwordType);
      await expect(page.locator(loginPage.password)).toHaveValue(examples.formField.emptyValue);
      await expect(page.locator(loginPage.password)).toBeVisible();
    });
    test('LoginPage.STANDARD: Then authenticate button matches the localization value and is enabled', async () => {
      await expect(page.locator(loginPage.login)).toHaveValue(l10n['loginPage.form.login']);
      await expect(page.locator(loginPage.login)).toBeVisible();
      await expect(page.locator(loginPage.login)).toBeEnabled();
    });
    test('LoginPage.STANDARD: Then error notification is not displayed', async () => {
      await expect(page.locator(loginPage.errorMessage)).toHaveCount(0);
    });
  });

  test.describe('LoginPage.STANDARD: When user clicks on the authenticate without passing credentials', () => {
    test.beforeAll(async () => {
      await page.locator(loginPage.login).click();
    });
    test('LoginPage.STANDARD: Then error message text says username is required', async () => {
      await expect(page.locator(loginPage.errorMessage)).toHaveText(l10n['loginPage.errors.usernameIsRequired']);
      await expect(page.locator(loginPage.errorMessage)).toBeVisible();
    });
    test('LoginPage.STANDARD: Then error banner background is error colour', async () => {
      await expect(page.locator(loginPage.error)).toHaveCSS('background-color', colours['text.error']);
    });
    test('LoginPage.STANDARD: Then error collapse button is displayed', async () => {
      await expect(page.locator(loginPage.errorClose)).toBeVisible();
      await expect(page.locator(loginPage.errorClose)).toBeEnabled();
    });
    test('LoginPage.STANDARD: Then username field border is highlighted with error colour', async () => {
      await expect(page.locator(loginPage.username)).toHaveCSS('border-bottom-color', colours['text.error']);
    });
    test('LoginPage.STANDARD: Then username field contains error icon', async () => {
      await expect(page.locator(loginPage.username).locator('..').locator(loginPage.errorIcon)).toBeVisible();
    });
    test('LoginPage.STANDARD: Then password field border is highlighted with error colour', async () => {
      await expect(page.locator(loginPage.password)).toHaveCSS('border-bottom-color', colours['text.error']);
    });
    test('LoginPage.STANDARD: Then password field contains error icon', async () => {
      await expect(page.locator(loginPage.password).locator('..').locator(loginPage.errorIcon)).toBeVisible();
    });
  });

  test.describe('LoginPage.STANDARD: When user clicks on error collapse button', () => {
    test.beforeAll(async () => {
      await page.locator(loginPage.errorClose).click();
    });
    test('LoginPage.STANDARD: Then error notification is not displayed', async () => {
      await expect(page.locator(loginPage.errorMessage)).toHaveCount(0);
    });
    test('LoginPage.STANDARD: Then username field border is not highlighted with error colour', async () => {
      await expect(page.locator(loginPage.username)).not.toHaveCSS('border-bottom-color', colours['text.error']);
    });
    test('LoginPage.STANDARD: Then username field does not contain error icon', async () => {
      await expect(page.locator(loginPage.username).locator('..').locator(loginPage.errorIcon)).toHaveCount(0);
    });
    test('LoginPage.STANDARD: Then password field border is not highlighted with error colour', async () => {
      await expect(page.locator(loginPage.password)).not.toHaveCSS('border-bottom-color', colours['text.error']);
    });
    test('LoginPage.STANDARD: Then password field does not contain error icon', async () => {
      await expect(page.locator(loginPage.password).locator('..').locator(loginPage.errorIcon)).toHaveCount(0);
    });
  });

  test.describe('LoginPage.STANDARD: When user types actual username without password', () => {
    test.beforeAll(async () => {
      await page.locator(loginPage.username).fill(standardUser.username);
      await page.locator(loginPage.login).click();
    });
    test.afterAll(async () => {
      await page.locator(loginPage.username).clear();
    });
    test('LoginPage.STANDARD: Then error message text says password is required', async () => {
      await expect(page.locator(loginPage.errorMessage)).toHaveText(l10n['loginPage.errors.passwordIsRequired']);
      await expect(page.locator(loginPage.errorMessage)).toBeVisible();
    });
    test('LoginPage.STANDARD: Then error banner background is error colour', async () => {
      await expect(page.locator(loginPage.error)).toHaveCSS('background-color', colours['text.error']);
    });
    test('LoginPage.STANDARD: Then error collapse button is displayed', async () => {
      await expect(page.locator(loginPage.errorClose)).toBeVisible();
      await expect(page.locator(loginPage.errorClose)).toBeEnabled();
    });
    test('LoginPage.STANDARD: Then username field border is highlighted with error colour', req({ bugs: ['BUG-LOGIN-001'] }), async () => {
      await expect(page.locator(loginPage.username)).toHaveCSS('border-bottom-color', colours['text.error']);
    });
    test('LoginPage.STANDARD: Then username field contains error icon', req({ bugs: ['BUG-LOGIN-001'] }), async () => {
      await expect(page.locator(loginPage.username).locator('..').locator(loginPage.errorIcon)).toBeVisible();
    });
    test('LoginPage.STANDARD: Then password field border is highlighted with error colour', async () => {
      await expect(page.locator(loginPage.password)).toHaveCSS('border-bottom-color', colours['text.error']);
    });
    test('LoginPage.STANDARD: Then password field contains error icon', async () => {
      await expect(page.locator(loginPage.password).locator('..').locator(loginPage.errorIcon)).toBeVisible();
    });
  });

  test.describe('LoginPage.STANDARD: When user types actual password without username', () => {
    test.beforeAll(async () => {
      await page.locator(loginPage.password).fill(standardUser.password);
      await page.locator(loginPage.login).click();
    });
    test.afterAll(async () => {
      await page.locator(loginPage.password).clear();
    });
    test('LoginPage.STANDARD: Then error message text says username is required', async () => {
      await expect(page.locator(loginPage.errorMessage)).toHaveText(l10n['loginPage.errors.usernameIsRequired']);
      await expect(page.locator(loginPage.errorMessage)).toBeVisible();
    });
    test('LoginPage.STANDARD: Then error banner background is error colour', async () => {
      await expect(page.locator(loginPage.error)).toHaveCSS('background-color', colours['text.error']);
    });
    test('LoginPage.STANDARD: Then error collapse button is displayed', async () => {
      await expect(page.locator(loginPage.errorClose)).toBeVisible();
      await expect(page.locator(loginPage.errorClose)).toBeEnabled();
    });
    test('LoginPage.STANDARD: Then username field border is highlighted with error colour', async () => {
      await expect(page.locator(loginPage.username)).toHaveCSS('border-bottom-color', colours['text.error']);
    });
    test('LoginPage.STANDARD: Then username field contains error icon', async () => {
      await expect(page.locator(loginPage.username).locator('..').locator(loginPage.errorIcon)).toBeVisible();
    });
    test('LoginPage.STANDARD: Then password field border is highlighted with error colour', req({ bugs: ['BUG-LOGIN-002'] }), async () => {
      await expect(page.locator(loginPage.password)).toHaveCSS('border-bottom-color', colours['text.error']);
    });
    test('LoginPage.STANDARD: Then password field contains error icon', req({ bugs: ['BUG-LOGIN-002'] }), async () => {
      await expect(page.locator(loginPage.password).locator('..').locator(loginPage.errorIcon)).toBeVisible();
    });
  });

  test.describe('LoginPage.STANDARD: When user types valid username and invalid password', () => {
    test.beforeAll(async () => {
      await loginPage__logIn(page, { username: standardUser.username, password: examples.invalidCredentials.password });
    });
    test.afterAll(async () => {
      await page.locator(loginPage.username).clear();
      await page.locator(loginPage.password).clear();
    });
    test('LoginPage.STANDARD: Then error message text says credentials do not match any existing user', async () => {
      await expect(page.locator(loginPage.errorMessage)).toHaveText(l10n['loginPage.errors.userNotFound']);
      await expect(page.locator(loginPage.errorMessage)).toBeVisible();
    });
    test('LoginPage.STANDARD: Then error banner background is error colour', async () => {
      await expect(page.locator(loginPage.error)).toHaveCSS('background-color', colours['text.error']);
    });
    test('LoginPage.STANDARD: Then error collapse button is displayed', async () => {
      await expect(page.locator(loginPage.errorClose)).toBeVisible();
      await expect(page.locator(loginPage.errorClose)).toBeEnabled();
    });
    test('LoginPage.STANDARD: Then username field border is highlighted with error colour', async () => {
      await expect(page.locator(loginPage.username)).toHaveCSS('border-bottom-color', colours['text.error']);
    });
    test('LoginPage.STANDARD: Then username field contains error icon', async () => {
      await expect(page.locator(loginPage.username).locator('..').locator(loginPage.errorIcon)).toBeVisible();
    });
    test('LoginPage.STANDARD: Then password field border is highlighted with error colour', async () => {
      await expect(page.locator(loginPage.password)).toHaveCSS('border-bottom-color', colours['text.error']);
    });
    test('LoginPage.STANDARD: Then password field contains error icon', async () => {
      await expect(page.locator(loginPage.password).locator('..').locator(loginPage.errorIcon)).toBeVisible();
    });
  });

  test.describe('LoginPage.LOCKED: When user tries to use locked account', () => {
    test.beforeAll(async () => {
      await loginPage__logIn(page, lockedUser);
    });
    test('LoginPage.LOCKED: Then error message text says user is locked out', async () => {
      await expect(page.locator(loginPage.errorMessage)).toHaveText(l10n['loginPage.errors.userIsLockedOut']);
      await expect(page.locator(loginPage.errorMessage)).toBeVisible();
    });
    test('LoginPage.LOCKED: Then error banner background is error colour', async () => {
      await expect(page.locator(loginPage.error)).toHaveCSS('background-color', colours['text.error']);
    });
    test('LoginPage.LOCKED: Then error collapse button is displayed', async () => {
      await expect(page.locator(loginPage.errorClose)).toBeVisible();
      await expect(page.locator(loginPage.errorClose)).toBeEnabled();
    });
    test('LoginPage.LOCKED: Then username field border is highlighted with error colour', async () => {
      await expect(page.locator(loginPage.username)).toHaveCSS('border-bottom-color', colours['text.error']);
    });
    test('LoginPage.LOCKED: Then username field contains error icon', async () => {
      await expect(page.locator(loginPage.username).locator('..').locator(loginPage.errorIcon)).toBeVisible();
    });
    test('LoginPage.LOCKED: Then password field border is highlighted with error colour', async () => {
      await expect(page.locator(loginPage.password)).toHaveCSS('border-bottom-color', colours['text.error']);
    });
    test('LoginPage.LOCKED: Then password field contains error icon', async () => {
      await expect(page.locator(loginPage.password).locator('..').locator(loginPage.errorIcon)).toBeVisible();
    });
  });

  test.describe('LoginPage.STANDARD: When user tries to navigate to Inventory page without authentication', () => {
    test.beforeAll(async () => {
      await page.goto(pages.inventory);
    });
    test.afterAll(async () => {
      await page.locator(loginPage.errorClose).click();
    });
    test('LoginPage.STANDARD: Then URL is the authenticate page', async () => {
      await expect(page).toHaveURL(pages.login);
    });
    test('LoginPage.STANDARD: Then login page title text matches the localization value', async () => {
      await expect(page.locator(loginPage.title)).toHaveText(l10n['loginPage.title']);
      await expect(page.locator(loginPage.title)).toBeVisible();
    });
    test('LoginPage.STANDARD: Then error message text says access to page is denied', async () => {
      await expect(page.locator(loginPage.errorMessage)).toHaveText(l10n['loginPage.errors.accessToPageDenied']);
      await expect(page.locator(loginPage.errorMessage)).toBeVisible();
    });
    test('LoginPage.STANDARD: Then error banner background is error colour', async () => {
      await expect(page.locator(loginPage.error)).toHaveCSS('background-color', colours['text.error']);
    });
    test('LoginPage.STANDARD: Then error collapse button is displayed', async () => {
      await expect(page.locator(loginPage.errorClose)).toBeVisible();
      await expect(page.locator(loginPage.errorClose)).toBeEnabled();
    });
    test('LoginPage.STANDARD: Then username field border is highlighted with error colour', async () => {
      await expect(page.locator(loginPage.username)).toHaveCSS('border-bottom-color', colours['text.error']);
    });
    test('LoginPage.STANDARD: Then username field contains error icon', async () => {
      await expect(page.locator(loginPage.username).locator('..').locator(loginPage.errorIcon)).toBeVisible();
    });
    test('LoginPage.STANDARD: Then password field border is highlighted with error colour', async () => {
      await expect(page.locator(loginPage.password)).toHaveCSS('border-bottom-color', colours['text.error']);
    });
    test('LoginPage.STANDARD: Then password field contains error icon', async () => {
      await expect(page.locator(loginPage.password).locator('..').locator(loginPage.errorIcon)).toBeVisible();
    });
  });

  test.afterAll(async () => {
    await page.close();
  });
});
