import { expect } from '@playwright/test';
import { inventoryPage } from '../../selectors/selectors';
import { l10n } from '../../support/l10n';
import { SORT_OPTIONS } from '../../constants/ui/inventory-page.ui.constraints';

const SORT_L10N_KEY = {
  [SORT_OPTIONS.nameAscending]: 'inventoryPage.sort.options.nameAscending',
  [SORT_OPTIONS.nameDescending]: 'inventoryPage.sort.options.nameDescending',
  [SORT_OPTIONS.priceAscending]: 'inventoryPage.sort.options.priceAscending',
  [SORT_OPTIONS.priceDescending]: 'inventoryPage.sort.options.priceDescending',
};

export async function inventoryPage__selectSortOption(page, sortOptionValue) {
  await page.locator(inventoryPage.sorting.dropdown).selectOption(sortOptionValue);
}

export async function inventoryPage__verifySortingDropdown(page, expectedValue) {
  await expect(page.locator(inventoryPage.sorting.dropdown)).toHaveValue(expectedValue);
  await expect(page.locator(inventoryPage.sorting.currentOption)).toHaveText(l10n[SORT_L10N_KEY[expectedValue]]);
}

export async function inventoryPage__addProductToCart(page, productIndex) {
  await page.locator(inventoryPage.cards).nth(productIndex).locator(inventoryPage.card.add).click();
}

export async function inventoryPage__removeProductFromCart(page, productIndex) {
  await page.locator(inventoryPage.cards).nth(productIndex).locator(inventoryPage.card.remove).click();
}

export async function inventoryPage__verifyProductImages(page) {
  for (const image of await page.locator(inventoryPage.card.image).all()) {
    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute('src', /.+/);
  }
}

/**
 * Adds the products at `indices` to the cart and returns what each card showed: `{ title, description, price }`.
 * The known mistitled product (BUG-INVENTORY-001) is recorded under its correct title with no description.
 */
export async function inventoryPage__collectAndAddProductsToCart(page, indices, buggyProductData) {
  const chosenProducts = [];
  for (const index of indices) {
    const card = page.locator(inventoryPage.cards).nth(index);
    const title = await card.locator(inventoryPage.card.title).innerText();
    const description = await card.locator(inventoryPage.card.description).innerText();
    const priceText = await card.locator(inventoryPage.card.price).innerText();
    const isBuggy = title === buggyProductData.wrongTitle;
    chosenProducts.push({
      title: isBuggy ? buggyProductData.correctTitle : title,
      description: isBuggy ? undefined : description,
      price: parseFloat(priceText.replace('$', '')),
    });
    await card.locator(inventoryPage.card.add).click();
  }
  return chosenProducts;
}
