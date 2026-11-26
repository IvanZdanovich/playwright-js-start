import { expect } from '@playwright/test';
import { cartPage } from '../../selectors/selectors';

export async function cartPage__validateProductDetails(page, chosenProducts, buggyProductData) {
  for (const product of chosenProducts) {
    if (product.title === buggyProductData.correctTitle) continue;
    const item = page.locator(cartPage.items).filter({ has: page.locator(cartPage.item.title, { hasText: product.title }) });
    await expect(item.locator(cartPage.item.title)).toHaveText(product.title);
    await expect(item.locator(cartPage.item.description)).toHaveText(product.description);
    await expect(item.locator(cartPage.item.price)).toHaveText(`$${product.price}`);
    await expect(item).toBeVisible();
  }
}

/** Asserts every cart item title is one of the chosen products. Skips the known mistitled product (BUG-INVENTORY-001). */
export async function cartPage__validateChosenProductTitles(page, chosenProducts, buggyProductData) {
  for (const title of await page.locator(cartPage.item.title).allInnerTexts()) {
    if (title === buggyProductData.wrongTitle) continue;
    expect(
      chosenProducts.some((product) => product?.title === title),
      `Product "${title}" should be in chosen products`,
    ).toBe(true);
  }
}

/** Asserts the removed product is gone; with `remainingCount` 0 the cart must be empty. */
export async function cartPage__verifyProductRemoved(page, removedTitle, remainingCount) {
  if (remainingCount === 0) {
    await expect(page.locator(cartPage.items)).toHaveCount(0);
    return;
  }
  await expect(page.locator(cartPage.items)).toHaveCount(remainingCount);
  expect(await page.locator(cartPage.item.title).allInnerTexts()).not.toContain(removedTitle);
}
