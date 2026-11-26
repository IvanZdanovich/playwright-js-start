import { test, expect } from '../../support/fixtures';
import { inventoryPage, cartPage, headerComp, checkoutPage, checkoutOverviewPage, checkoutCompletePage } from '../../selectors/selectors';
import { l10n } from '../../support/l10n';
import { pages } from '../../support/urls';
import { userRoles } from '../../constants/user-roles';
import { getUserDataByRole } from '../../support/users';
import { cartPage__validateProductDetails } from '../../commands/ui/cart-page.ui.commands';
import { checkoutOverviewPage__validatePriceSummary } from '../../commands/ui/checkout-overview-page.ui.commands';
import { checkoutPage__fillDeliveryInfo } from '../../commands/ui/checkout-page.ui.commands';
import { headerComp__resetAppState } from '../../commands/ui/header-comp.ui.commands';
import { inventoryPage__collectAndAddProductsToCart } from '../../commands/ui/inventory-page.ui.commands';
import { loginPage__logIn } from '../../commands/ui/login-page.ui.commands';
import { completePurchase__examples as examples } from '../../e2e-examples/ui/purchasing.complete-purchase.ui.examples';
import { PRICE_DECIMAL_PLACES } from '../../constants/ui/checkout-overview-page.ui.constraints';

test.describe('CompletePurchase: Given No preconditions', () => {
  test.describe.configure({ mode: 'serial' });
  let page;
  let standardUser;
  let chosenProducts;

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

  test.describe('CompletePurchase.STANDARD: When user adds multiple products to the shopping cart', () => {
    test.beforeAll(async () => {
      chosenProducts = await inventoryPage__collectAndAddProductsToCart(page, examples.indicesOfProducts, examples.buggyProductData);
      await page.locator(headerComp.openCart).click();
    });
    test('CompletePurchase.STANDARD: Then all selected products should appear in the cart with correct titles, descriptions and prices', async () => {
      await cartPage__validateProductDetails(page, chosenProducts, examples.buggyProductData);
    });
  });

  test.describe('CompletePurchase.STANDARD: When user proceeds to checkout and completes the delivery information form', () => {
    test.beforeAll(async () => {
      await page.locator(cartPage.checkout).click();
      await checkoutPage__fillDeliveryInfo(page, examples.deliveryInfo);
      await page.locator(checkoutPage.continue).click();
    });
    test('CompletePurchase.STANDARD: Then user should see an order summary page with product details', async () => {
      await cartPage__validateProductDetails(page, chosenProducts, examples.buggyProductData);
    });
    test('CompletePurchase.STANDARD: Then user should see total price calculation', async () => {
      await checkoutOverviewPage__validatePriceSummary(page, chosenProducts, PRICE_DECIMAL_PLACES);
    });
  });

  test.describe('CompletePurchase.STANDARD: When user reviews order summary and confirms purchase by clicking Finish button', () => {
    test.beforeAll(async () => {
      await page.locator(checkoutOverviewPage.finish).click();
    });
    test('CompletePurchase.STANDARD: Then user should see a thank you notification title', async () => {
      await expect(page.locator(checkoutCompletePage.confirmation.title)).toHaveText(l10n['checkoutCompletePage.messageTitle']);
    });
    test('CompletePurchase.STANDARD: Then user should see an order confirmation message', async () => {
      await expect(page.locator(checkoutCompletePage.confirmation.message)).toHaveText(l10n['checkoutCompletePage.message']);
    });
  });

  test.describe('CompletePurchase.STANDARD: When user clicks the Back Home button on the order confirmation page', () => {
    test.beforeAll(async () => {
      await page.locator(checkoutCompletePage.backHome).click();
    });
    test('CompletePurchase.STANDARD: Then user should be redirected to the Inventory page URL', async () => {
      await expect(page).toHaveURL(pages.inventory);
    });
    test('CompletePurchase.STANDARD: Then Inventory page title with product catalog is displayed', async () => {
      await expect(page.locator(inventoryPage.title)).toHaveText(l10n['inventoryPage.title']);
    });
    test('CompletePurchase.STANDARD: Then shopping cart is reset and Cart badge is not displayed', async () => {
      await expect(page.locator(headerComp.cartBadge)).toHaveCount(0);
    });
  });
});
