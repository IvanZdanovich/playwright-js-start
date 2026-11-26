import { test, expect } from '../../support/fixtures';
import { req } from '../../support/req';
import { loginPage, inventoryPage, cartPage, headerComp } from '../../selectors/selectors';
import { l10n } from '../../support/l10n';
import { pages, external } from '../../support/urls';
import { userRoles } from '../../constants/user-roles';
import { getUserDataByRole } from '../../support/users';
import { headerComp__logOut, headerComp__verifyCartBadge } from '../../commands/ui/header-comp.ui.commands';
import { inventoryPage__addProductToCart } from '../../commands/ui/inventory-page.ui.commands';
import { loginPage__logIn } from '../../commands/ui/login-page.ui.commands';
import { inventoryPageHeader__examples as examples } from '../../integration-examples/ui/inventory-page.header.ui.examples';

test.describe('InventoryPage: Given STANDARD user on Inventory page, Header component', () => {
  test.describe.configure({ mode: 'serial' });
  let page;
  let standardUser;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    standardUser = getUserDataByRole(userRoles.STANDARD);
    await page.goto('/');
    await loginPage__logIn(page, standardUser);
  });
  test.afterAll(async () => {
    await page.close();
  });

  test.describe('InventoryPage.Header.STANDARD: When user reviews the Header', () => {
    test('InventoryPage.Header.STANDARD: Then Title is displayed', async () => {
      await expect(page.locator(headerComp.title)).toHaveText(l10n['header.title']);
      await expect(page.locator(headerComp.title)).toBeVisible();
    });
    test('InventoryPage.Header.STANDARD: Then Cart button is displayed', async () => {
      await expect(page.locator(headerComp.openCart)).toBeVisible();
    });
    test('InventoryPage.Header.STANDARD: Then Sidebar button is displayed', async () => {
      await expect(page.locator(headerComp.sidebar.open)).toBeVisible();
    });
    test('InventoryPage.Header.STANDARD: Then Sidebar is not displayed', async () => {
      await expect(page.locator(headerComp.sidebar.container)).toBeHidden();
    });
    test('InventoryPage.Header.STANDARD: Then Cart badge is not displayed', async () => {
      await expect(page.locator(headerComp.cartBadge)).toHaveCount(0);
    });
  });

  test.describe('InventoryPage.Header.STANDARD: When user opens the Sidebar', () => {
    test.beforeAll(async () => {
      await page.locator(headerComp.sidebar.open).click();
    });
    test('InventoryPage.Header.STANDARD: Then Sidebar is displayed', async () => {
      await expect(page.locator(headerComp.sidebar.container)).toBeVisible();
    });
    test('InventoryPage.Header.STANDARD: Then Close button is displayed', async () => {
      await expect(page.locator(headerComp.sidebar.close)).toBeVisible();
    });
    test('InventoryPage.Header.STANDARD: Then Inventory option is displayed', async () => {
      await expect(page.locator(headerComp.sidebar.openInventory)).toHaveText(l10n['header.sidebar.inventory']);
      await expect(page.locator(headerComp.sidebar.openInventory)).toBeVisible();
    });
    test('InventoryPage.Header.STANDARD: Then About option is displayed with external link', async () => {
      await expect(page.locator(headerComp.sidebar.openAbout)).toHaveText(l10n['header.sidebar.about']);
      await expect(page.locator(headerComp.sidebar.openAbout)).toHaveAttribute('href', external.about);
      await expect(page.locator(headerComp.sidebar.openAbout)).toBeVisible();
    });
    test('InventoryPage.Header.STANDARD: Then Reset App State option is displayed', async () => {
      await expect(page.locator(headerComp.sidebar.resetAppState)).toHaveText(l10n['header.sidebar.resetAppState']);
      await expect(page.locator(headerComp.sidebar.resetAppState)).toBeVisible();
    });
    test('InventoryPage.Header.STANDARD: Then Logout option is displayed', async () => {
      await expect(page.locator(headerComp.sidebar.logout)).toHaveText(l10n['header.sidebar.logout']);
      await expect(page.locator(headerComp.sidebar.logout)).toBeVisible();
    });
  });

  test.describe('InventoryPage.Header.STANDARD: When user closes the Sidebar', () => {
    test.beforeAll(async () => {
      await page.locator(headerComp.sidebar.close).click();
    });
    test('InventoryPage.Header.STANDARD: Then user remains on the same page', async () => {
      await expect(page).toHaveURL(pages.inventory);
    });
    test('InventoryPage.Header.STANDARD: Then Sidebar button is displayed', async () => {
      await expect(page.locator(headerComp.sidebar.open)).toBeVisible();
    });
    test('InventoryPage.Header.STANDARD: Then Sidebar is not displayed', async () => {
      await expect(page.locator(headerComp.sidebar.container)).toBeHidden();
    });
  });

  test.describe('InventoryPage.Header.STANDARD: When user adds products to cart', () => {
    test.beforeAll(async () => {
      await inventoryPage__addProductToCart(page, examples.addedProductIndex);
    });
    test('InventoryPage.Header.STANDARD: Then Cart badge displays count of added products', async () => {
      await headerComp__verifyCartBadge(page, examples.cartBadgeCounts.oneProduct);
    });
  });

  test.describe('InventoryPage.Header.STANDARD: When user clicks Reset App State', () => {
    test.beforeAll(async () => {
      await page.locator(headerComp.sidebar.open).click();
      await page.locator(headerComp.sidebar.resetAppState).click();
      await page.locator(headerComp.sidebar.close).click();
    });
    test('InventoryPage.Header.STANDARD: Then Cart badge is not displayed', async () => {
      await expect(page.locator(headerComp.cartBadge)).toHaveCount(0);
    });
    test('InventoryPage.Header.STANDARD: Then Sidebar is not displayed', async () => {
      await expect(page.locator(headerComp.sidebar.container)).toBeHidden();
    });
    test('InventoryPage.Header.STANDARD: Then Remove buttons remain unchanged', req({ bugs: ['BUG-HEADER-001'] }), async () => {
      await expect(page.locator(inventoryPage.cards).nth(examples.addedProductIndex).locator(inventoryPage.card.remove)).toBeVisible();
    });
  });

  test.describe('InventoryPage.Header.STANDARD: When user clicks on Cart button', () => {
    test.beforeAll(async () => {
      await page.locator(headerComp.openCart).click();
    });
    test('InventoryPage.Header.STANDARD: Then user is redirected to the Cart page URL', async () => {
      await expect(page).toHaveURL(pages.cart);
    });
    test('InventoryPage.Header.STANDARD: Then Cart page title is displayed', async () => {
      await expect(page.locator(cartPage.title)).toHaveText(l10n['cartPage.title']);
    });
    test('InventoryPage.Header.STANDARD: Then Cart button is displayed', async () => {
      await expect(page.locator(headerComp.openCart)).toBeVisible();
    });
    test('InventoryPage.Header.STANDARD: Then Sidebar button is displayed', async () => {
      await expect(page.locator(headerComp.sidebar.open)).toBeVisible();
    });
    test('InventoryPage.Header.STANDARD: Then Sidebar is not displayed', async () => {
      await expect(page.locator(headerComp.sidebar.container)).toBeHidden();
    });
  });

  test.describe('InventoryPage.Header.STANDARD: When user clicks on Inventory option', () => {
    test.beforeAll(async () => {
      await page.locator(headerComp.sidebar.open).click();
      await page.locator(headerComp.sidebar.openInventory).click();
    });
    test('InventoryPage.Header.STANDARD: Then user is redirected to the Inventory page URL', async () => {
      await expect(page).toHaveURL(pages.inventory);
    });
    test('InventoryPage.Header.STANDARD: Then Inventory page title is displayed', async () => {
      await expect(page.locator(inventoryPage.title)).toHaveText(l10n['inventoryPage.title']);
    });
    test('InventoryPage.Header.STANDARD: Then Cart button is displayed', async () => {
      await expect(page.locator(headerComp.openCart)).toBeVisible();
    });
    test('InventoryPage.Header.STANDARD: Then Sidebar button is displayed', async () => {
      await expect(page.locator(headerComp.sidebar.open)).toBeVisible();
    });
    test('InventoryPage.Header.STANDARD: Then Sidebar is not displayed', async () => {
      await expect(page.locator(headerComp.sidebar.container)).toBeHidden();
    });
  });

  test.describe('InventoryPage.Header.STANDARD: When user logs out', () => {
    test.beforeAll(async () => {
      await headerComp__logOut(page);
    });
    test('InventoryPage.Header.STANDARD: Then user is redirected to the Login page URL', async () => {
      await expect(page).toHaveURL(pages.login);
    });
    test('InventoryPage.Header.STANDARD: Then Login page title is displayed', async () => {
      await expect(page.locator(loginPage.title)).toHaveText(l10n['loginPage.title']);
    });
  });
});
