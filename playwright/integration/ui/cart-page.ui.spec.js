import { test, expect } from '../../support/fixtures';
import { req } from '../../support/req';
import { inventoryPage, cartPage, headerComp, footerComp, checkoutPage } from '../../selectors/selectors';
import { l10n } from '../../support/l10n';
import { pages, external } from '../../support/urls';
import { userRoles } from '../../constants/user-roles';
import { getUserDataByRole } from '../../support/users';
import { cartPage__validateProductDetails, cartPage__verifyProductRemoved } from '../../commands/ui/cart-page.ui.commands';
import { footerComp__verifyCopyright } from '../../commands/ui/footer-comp.ui.commands';
import { headerComp__resetAppState, headerComp__verifyCartBadge } from '../../commands/ui/header-comp.ui.commands';
import { inventoryPage__collectAndAddProductsToCart } from '../../commands/ui/inventory-page.ui.commands';
import { loginPage__logIn } from '../../commands/ui/login-page.ui.commands';
import { cartPage__examples as examples } from '../../integration-examples/ui/cart-page.ui.examples';

test.describe('CartPage: Given STANDARD user on Cart page and no products are added to cart', () => {
  test.describe.configure({ mode: 'serial' });
  let page;
  let standardUser;
  let chosenProducts;
  let removedProductTitle;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    standardUser = getUserDataByRole(userRoles.STANDARD);
    await page.goto('/');
    await loginPage__logIn(page, standardUser);
    await headerComp__resetAppState(page);
  });
  test.afterAll(async () => {
    await headerComp__resetAppState(page);
    await page.close();
  });

  test.describe('CartPage.STANDARD: When user visits the page', () => {
    test.beforeAll(async () => {
      await page.locator(headerComp.openCart).click();
    });
    test('CartPage.STANDARD: Then Cart page URL should be displayed', async () => {
      await expect(page).toHaveURL(pages.cart);
    });
    test('CartPage.STANDARD: Then Cart page title should be displayed', async () => {
      await expect(page.locator(cartPage.title)).toHaveText(l10n['cartPage.title']);
    });
    test('CartPage.STANDARD: Then no items should be displayed', async () => {
      await expect(page.locator(cartPage.items)).toHaveCount(0);
    });
    test('CartPage.STANDARD: Then Continue Shopping button is displayed', async () => {
      await expect(page.locator(cartPage.continueShopping)).toHaveText(l10n['cartPage.continueShopping']);
      await expect(page.locator(cartPage.continueShopping)).toBeVisible();
      await expect(page.locator(cartPage.continueShopping)).toBeEnabled();
    });
    test('CartPage.STANDARD: Then Checkout button is displayed', async () => {
      await expect(page.locator(cartPage.checkout)).toHaveText(l10n['cartPage.checkout']);
      await expect(page.locator(cartPage.checkout)).toBeVisible();
      await expect(page.locator(cartPage.checkout)).toBeEnabled();
    });
    test('CartPage.Footer.STANDARD: Then LinkedIn icon with link should be displayed', async () => {
      await expect(page.locator(footerComp.linkedin)).toHaveAttribute('href', external.linkedin);
      await expect(page.locator(footerComp.linkedin)).toHaveAttribute('target', '_blank');
      await expect(page.locator(footerComp.linkedin)).toBeVisible();
    });
    test('CartPage.Footer.STANDARD: Then Twitter icon with link should be displayed', async () => {
      await expect(page.locator(footerComp.x)).toHaveAttribute('href', external.x);
      await expect(page.locator(footerComp.x)).toHaveAttribute('target', '_blank');
      await expect(page.locator(footerComp.x)).toBeVisible();
    });
    test('CartPage.Footer.STANDARD: Then Facebook icon with link should be displayed', async () => {
      await expect(page.locator(footerComp.facebook)).toHaveAttribute('href', external.facebook);
      await expect(page.locator(footerComp.facebook)).toHaveAttribute('target', '_blank');
      await expect(page.locator(footerComp.facebook)).toBeVisible();
    });
    test('CartPage.Footer.STANDARD: Then the Copyright notice with actual year should be displayed', async () => {
      await footerComp__verifyCopyright(page);
    });
    test.skip('CartPage.Footer.STANDARD: Then Terms Of Service link should be displayed', req({ bugs: ['BUG-FOOTER-002'] }), async () => {});
    test.skip('CartPage.Footer.STANDARD: Then Privacy Policy link should be displayed', req({ bugs: ['BUG-FOOTER-003'] }), async () => {});
    test('CartPage.STANDARD: Then Quantity table header should be displayed', async () => {
      await expect(page.locator(cartPage.quantityLabel)).toHaveText(l10n['cartPage.quantity']);
      await expect(page.locator(cartPage.quantityLabel)).toBeVisible();
    });
    test('CartPage.STANDARD: Then Description table header should be displayed', async () => {
      await expect(page.locator(cartPage.descriptionLabel)).toHaveText(l10n['cartPage.description']);
      await expect(page.locator(cartPage.descriptionLabel)).toBeVisible();
    });
  });

  test.describe('CartPage.STANDARD: When user clicks Continue Shopping button', () => {
    test.beforeAll(async () => {
      await page.locator(cartPage.continueShopping).click();
    });
    test('CartPage.STANDARD: Then user should be redirected to the Inventory page URL', async () => {
      await expect(page).toHaveURL(pages.inventory);
    });
    test('CartPage.STANDARD: Then Inventory page title is displayed', async () => {
      await expect(page.locator(inventoryPage.title)).toHaveText(l10n['inventoryPage.title']);
    });
  });

  test.describe('CartPage.STANDARD: When user adds random products and clicks Cart button', () => {
    test.beforeAll(async () => {
      chosenProducts = await inventoryPage__collectAndAddProductsToCart(page, examples.indicesOfProducts, examples.buggyProductData);
      await page.locator(headerComp.openCart).click();
    });
    test('CartPage.STANDARD: Then user should be redirected to the Cart page URL', async () => {
      await expect(page).toHaveURL(pages.cart);
    });
    test('CartPage.STANDARD: Then Cart page title is displayed', async () => {
      await expect(page.locator(cartPage.title)).toHaveText(l10n['cartPage.title']);
    });
    test('CartPage.STANDARD: Then number of items should correspond to the number of chosen products', async () => {
      await expect(page.locator(cartPage.items)).toHaveCount(examples.indicesOfProducts.length);
    });
    test('CartPage.STANDARD: Then the Cart button with an appropriate number on the badge is displayed', async () => {
      await headerComp__verifyCartBadge(page, examples.indicesOfProducts.length);
    });
    test('CartPage.STANDARD: Then Checkout button is displayed', async () => {
      await expect(page.locator(cartPage.checkout)).toHaveText(l10n['cartPage.checkout']);
      await expect(page.locator(cartPage.checkout)).toBeVisible();
      await expect(page.locator(cartPage.checkout)).toBeEnabled();
    });
    test('CartPage.STANDARD: Then Continue Shopping button is displayed', async () => {
      await expect(page.locator(cartPage.continueShopping)).toHaveText(l10n['cartPage.continueShopping']);
      await expect(page.locator(cartPage.continueShopping)).toBeVisible();
      await expect(page.locator(cartPage.continueShopping)).toBeEnabled();
    });
    test('CartPage.STANDARD: Then Quantity table header should be displayed', async () => {
      await expect(page.locator(cartPage.quantityLabel)).toHaveText(l10n['cartPage.quantity']);
      await expect(page.locator(cartPage.quantityLabel)).toBeVisible();
    });
    test('CartPage.STANDARD: Then Description table header should be displayed', async () => {
      await expect(page.locator(cartPage.descriptionLabel)).toHaveText(l10n['cartPage.description']);
      await expect(page.locator(cartPage.descriptionLabel)).toBeVisible();
    });
    test('CartPage.STANDARD: Then on each item delete button should be displayed', async () => {
      await expect(page.locator(cartPage.item.remove)).toHaveText(Array(examples.indicesOfProducts.length).fill(l10n['cartPage.remove']));
      for (const removeButton of await page.locator(cartPage.item.remove).all()) {
        await expect(removeButton).toBeVisible();
        await expect(removeButton).toBeEnabled();
      }
    });
    test('CartPage.STANDARD: Then on each item should have appropriate title, description and price', async () => {
      await cartPage__validateProductDetails(page, chosenProducts, examples.buggyProductData);
    });
  });

  test.describe('CartPage.STANDARD: When user clicks delete button on random item', () => {
    test.beforeAll(async () => {
      const removedItem = page.locator(cartPage.items).nth(examples.removedProductIndex);
      removedProductTitle = await removedItem.locator(cartPage.item.title).innerText();
      await removedItem.locator(cartPage.item.remove).click();
    });
    test('CartPage.STANDARD: Then the number of products is decreased', async () => {
      await expect(page.locator(cartPage.items)).toHaveCount(examples.indicesOfProducts.length - 1);
    });
    test('CartPage.STANDARD: Then the Cart button with an appropriate number on the badge is displayed', async () => {
      await headerComp__verifyCartBadge(page, examples.indicesOfProducts.length - 1);
    });
    test('CartPage.STANDARD: Then the removed product is not displayed', async () => {
      await cartPage__verifyProductRemoved(page, removedProductTitle, examples.indicesOfProducts.length - 1);
    });
  });

  test.describe('CartPage.STANDARD: When user clicks Checkout button', () => {
    test.beforeAll(async () => {
      await page.locator(cartPage.checkout).click();
    });
    test('CartPage.STANDARD: Then user should be redirected to the Checkout page URL', async () => {
      await expect(page).toHaveURL(pages.checkout);
    });
    test('CartPage.STANDARD: Then Checkout page title is displayed', async () => {
      await expect(page.locator(checkoutPage.title)).toHaveText(l10n['checkoutPage.title']);
    });
  });
});
