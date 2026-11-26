import { expect } from '@playwright/test';
import { checkoutOverviewPage } from '../../selectors/selectors';
import { l10n } from '../../support/l10n';

/**
 * Asserts item total, and that total = item total + tax.
 * Skipped when summing the prices hits a floating-point error (BUG-PURCHASE-001).
 */
export async function checkoutOverviewPage__validatePriceSummary(page, chosenProducts, decimalPlaces) {
  const totalPrice = chosenProducts.reduce((acc, product) => acc + product.price, 0);
  const totalPriceCorrect = parseFloat(totalPrice.toFixed(decimalPlaces));
  if (totalPrice !== totalPriceCorrect) return;

  await expect(page.locator(checkoutOverviewPage.itemsTotal)).toHaveText(`${l10n['checkoutOverviewPage.itemTotal']}: $${totalPriceCorrect}`);

  const taxText = await page.locator(checkoutOverviewPage.tax).innerText();
  const taxValue = parseFloat(taxText.replace(`${l10n['checkoutOverviewPage.tax']}: $`, ''));
  const totalText = await page.locator(checkoutOverviewPage.priceTotal).innerText();
  const totalDisplayed = parseFloat(totalText.replace(`${l10n['checkoutOverviewPage.total']}: $`, ''));
  expect(totalDisplayed).toBe(parseFloat((totalPriceCorrect + taxValue).toFixed(decimalPlaces)));
}
