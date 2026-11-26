import { test, expect } from '../../support/fixtures';
import { req } from '../../support/req';
import { inventoryPage, cartPage, headerComp, footerComp, productPage } from '../../selectors/selectors';
import { l10n } from '../../support/l10n';
import { pages, external } from '../../support/urls';
import { userRoles } from '../../constants/user-roles';
import { getUserDataByRole } from '../../support/users';
import { cartPage__validateChosenProductTitles } from '../../commands/ui/cart-page.ui.commands';
import { footerComp__verifyCopyright } from '../../commands/ui/footer-comp.ui.commands';
import { headerComp__resetAppState, headerComp__verifyCartBadge } from '../../commands/ui/header-comp.ui.commands';
import { inventoryPage__selectSortOption, inventoryPage__verifySortingDropdown, inventoryPage__addProductToCart, inventoryPage__removeProductFromCart, inventoryPage__verifyProductImages } from '../../commands/ui/inventory-page.ui.commands';
import { loginPage__logIn } from '../../commands/ui/login-page.ui.commands';
import { inventoryPage__examples as examples } from '../../integration-examples/ui/inventory-page.ui.examples';
import { DEFAULT_SORT, PRICE_FORMAT, PRODUCT_COUNT, SORT_OPTIONS } from '../../constants/ui/inventory-page.ui.constraints';

test.describe('InventoryPage: Given STANDARD user on Inventory page, no products are added to cart', () => {
  test.describe.configure({ mode: 'serial' });
  let page;
  let standardUser;
  const chosenProducts = [];

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

  test.describe('InventoryPage.STANDARD: When user visits the page', () => {
    test('InventoryPage.STANDARD: Then page URL should be displayed', async () => {
      await expect(page).toHaveURL(pages.inventory);
    });
    test('InventoryPage.STANDARD: Then page title should be displayed', async () => {
      await expect(page.locator(inventoryPage.title)).toHaveText(l10n['inventoryPage.title']);
    });
    test('InventoryPage.STANDARD: Then default sorting dropdown with default value', async () => {
      await inventoryPage__verifySortingDropdown(page, DEFAULT_SORT);
    });
    test('InventoryPage.Footer.STANDARD: Then LinkedIn icon with link should be displayed', async () => {
      await expect(page.locator(footerComp.linkedin)).toHaveAttribute('href', external.linkedin);
      await expect(page.locator(footerComp.linkedin)).toHaveAttribute('target', '_blank');
      await expect(page.locator(footerComp.linkedin)).toBeVisible();
    });
    test('InventoryPage.Footer.STANDARD: Then Twitter icon with link should be displayed', async () => {
      await expect(page.locator(footerComp.x)).toHaveAttribute('href', external.x);
      await expect(page.locator(footerComp.x)).toHaveAttribute('target', '_blank');
      await expect(page.locator(footerComp.x)).toBeVisible();
    });
    test('InventoryPage.Footer.STANDARD: Then Facebook icon with link should be displayed', async () => {
      await expect(page.locator(footerComp.facebook)).toHaveAttribute('href', external.facebook);
      await expect(page.locator(footerComp.facebook)).toHaveAttribute('target', '_blank');
      await expect(page.locator(footerComp.facebook)).toBeVisible();
    });
    test('InventoryPage.Footer.STANDARD: Then the Copyright notice with actual year should be displayed', async () => {
      await footerComp__verifyCopyright(page);
    });
    test.skip('InventoryPage.Footer.STANDARD: Then Terms Of Service link should be displayed', req({ bugs: ['BUG-FOOTER-002'] }), async () => {});
    test.skip('InventoryPage.Footer.STANDARD: Then Privacy Policy link should be displayed', req({ bugs: ['BUG-FOOTER-003'] }), async () => {});
    test('InventoryPage.STANDARD: Then default number of product cards should be displayed', async () => {
      await expect(page.locator(inventoryPage.cards)).toHaveCount(PRODUCT_COUNT);
    });
    test('InventoryPage.Card.STANDARD: Then each product card Title should be displayed', req({ bugs: ['BUG-INVENTORY-001'] }), async () => {
      for (const title of await page.locator(inventoryPage.card.title).all()) {
        await expect(title).not.toBeEmpty();
        await expect(title).toBeVisible();
      }
    });
    test('InventoryPage.Card.STANDARD: Then each product card Description should be displayed', req({ bugs: ['BUG-INVENTORY-002'] }), async () => {
      for (const description of await page.locator(inventoryPage.card.description).all()) {
        await expect(description).not.toBeEmpty();
        await expect(description).toBeVisible();
      }
    });
    test('InventoryPage.Card.STANDARD: Then each product card icon should be displayed', async () => {
      await inventoryPage__verifyProductImages(page);
    });
    test('InventoryPage.Card.STANDARD: Then each product card Price should be displayed in currency format', async () => {
      for (const price of await page.locator(inventoryPage.card.price).all()) {
        await expect(price).toBeVisible();
        await expect(price).toHaveText(PRICE_FORMAT);
      }
    });
    test('InventoryPage.Card.STANDARD: Then each product card add to cart button should be displayed', async () => {
      await expect(page.locator(inventoryPage.card.add)).toHaveText(Array(PRODUCT_COUNT).fill(l10n['inventoryPage.addToCart']));
      for (const add of await page.locator(inventoryPage.card.add).all()) {
        await expect(add).toBeVisible();
      }
    });
    test('InventoryPage.Card.STANDARD: Then all products should be sorted by default parameter', async () => {
      const titles = await page.locator(inventoryPage.card.title).allInnerTexts();
      await expect(page.locator(inventoryPage.card.title)).toHaveText([...titles].sort());
    });
  });

  test.describe('InventoryPage.STANDARD: When user clicks on sorting dropdown', () => {
    test.beforeAll(async () => {
      await page.locator(inventoryPage.sorting.container).click();
    });
    test('InventoryPage.STANDARD: Then sorting dropdown is displayed', async () => {
      await expect(page.locator(inventoryPage.sorting.dropdown)).toBeVisible();
    });
    test('InventoryPage.STANDARD: Then name ascending sorting option is marked as chosen', async () => {
      await inventoryPage__verifySortingDropdown(page, SORT_OPTIONS.nameAscending);
      await expect(page.locator(inventoryPage.sorting.options.nameAscending)).toHaveText(l10n['inventoryPage.sort.options.nameAscending']);
      await expect(page.locator(inventoryPage.sorting.options.nameAscending)).toBeAttached();
    });
    test('InventoryPage.STANDARD: Then name descending sorting option is displayed', async () => {
      await expect(page.locator(inventoryPage.sorting.options.nameDescending)).toHaveText(l10n['inventoryPage.sort.options.nameDescending']);
      await expect(page.locator(inventoryPage.sorting.options.nameDescending)).toBeAttached();
    });
    test('InventoryPage.STANDARD: Then price ascending sorting option is displayed', async () => {
      await expect(page.locator(inventoryPage.sorting.options.priceAscending)).toHaveText(l10n['inventoryPage.sort.options.priceAscending']);
      await expect(page.locator(inventoryPage.sorting.options.priceAscending)).toBeAttached();
    });
    test('InventoryPage.STANDARD: Then price descending sorting option is displayed', async () => {
      await expect(page.locator(inventoryPage.sorting.options.priceDescending)).toHaveText(l10n['inventoryPage.sort.options.priceDescending']);
      await expect(page.locator(inventoryPage.sorting.options.priceDescending)).toBeAttached();
    });
  });

  test.describe('InventoryPage.STANDARD: When user clicks on name descending sorting option', () => {
    test.beforeAll(async () => {
      await inventoryPage__selectSortOption(page, SORT_OPTIONS.nameDescending);
    });
    test('InventoryPage.STANDARD: Then sorting dropdown shows name descending as selected option', async () => {
      await inventoryPage__verifySortingDropdown(page, SORT_OPTIONS.nameDescending);
    });
    test('InventoryPage.STANDARD: Then products are sorted by name descending', async () => {
      const titles = await page.locator(inventoryPage.card.title).allInnerTexts();
      await expect(page.locator(inventoryPage.card.title)).toHaveText([...titles].sort().reverse());
    });
  });

  test.describe('InventoryPage.STANDARD: When user clicks on price ascending sorting option', () => {
    test.beforeAll(async () => {
      await inventoryPage__selectSortOption(page, SORT_OPTIONS.priceAscending);
    });
    test('InventoryPage.STANDARD: Then sorting dropdown shows price ascending as selected option', async () => {
      await inventoryPage__verifySortingDropdown(page, SORT_OPTIONS.priceAscending);
    });
    test('InventoryPage.STANDARD: Then products are sorted by price ascending', async () => {
      const prices = (await page.locator(inventoryPage.card.price).allInnerTexts()).map((text) => parseFloat(text.replace('$', '')));
      expect(prices).toEqual([...prices].sort((a, b) => a - b));
    });
  });

  test.describe('InventoryPage.STANDARD: When user clicks on price descending sorting option', () => {
    test.beforeAll(async () => {
      await inventoryPage__selectSortOption(page, SORT_OPTIONS.priceDescending);
    });
    test('InventoryPage.STANDARD: Then sorting dropdown shows price descending as selected option', async () => {
      await inventoryPage__verifySortingDropdown(page, SORT_OPTIONS.priceDescending);
    });
    test('InventoryPage.STANDARD: Then products are sorted by price descending', async () => {
      const prices = (await page.locator(inventoryPage.card.price).allInnerTexts()).map((text) => parseFloat(text.replace('$', '')));
      expect(prices).toEqual([...prices].sort((a, b) => a - b).reverse());
    });
  });

  test.describe('InventoryPage.STANDARD: When user clicks on Name ascending sorting option', () => {
    test.beforeAll(async () => {
      await inventoryPage__selectSortOption(page, SORT_OPTIONS.nameAscending);
    });
    test('InventoryPage.STANDARD: Then sorting dropdown shows name ascending as selected option', async () => {
      await inventoryPage__verifySortingDropdown(page, SORT_OPTIONS.nameAscending);
    });
    test('InventoryPage.STANDARD: Then products are sorted by name ascending', async () => {
      const titles = await page.locator(inventoryPage.card.title).allInnerTexts();
      await expect(page.locator(inventoryPage.card.title)).toHaveText([...titles].sort());
    });
  });

  test.describe('InventoryPage.STANDARD: When user clicks on add to cart button for first random product', () => {
    test.beforeAll(async () => {
      await inventoryPage__addProductToCart(page, examples.productIndices.firstAdded);
      chosenProducts.push({ title: await page.locator(inventoryPage.cards).nth(examples.productIndices.firstAdded).locator(inventoryPage.card.title).innerText() });
    });
    test('InventoryPage.Header.STANDARD: Then the Cart button with an appropriate number on the badge is displayed', async () => {
      await headerComp__verifyCartBadge(page, examples.cartBadgeCounts.oneProduct);
    });
    test('InventoryPage.Card.STANDARD: Then the add to cart button is changed to remove button', async () => {
      await expect(page.locator(inventoryPage.cards).nth(examples.productIndices.firstAdded).locator(inventoryPage.card.remove)).toHaveText(l10n['inventoryPage.remove']);
      await expect(page.locator(inventoryPage.cards).nth(examples.productIndices.firstAdded).locator(inventoryPage.card.remove)).toBeVisible();
    });
  });

  test.describe('InventoryPage.STANDARD: When user clicks on add to cart button for second random product', () => {
    test.beforeAll(async () => {
      await inventoryPage__addProductToCart(page, examples.productIndices.secondAdded);
      chosenProducts.push({ title: await page.locator(inventoryPage.cards).nth(examples.productIndices.secondAdded).locator(inventoryPage.card.title).innerText() });
    });
    test('InventoryPage.Header.STANDARD: Then the Cart button with an appropriate number on the badge is displayed', async () => {
      await headerComp__verifyCartBadge(page, examples.cartBadgeCounts.twoProducts);
    });
    test('InventoryPage.Card.STANDARD: Then the add to cart button is changed to remove button', async () => {
      await expect(page.locator(inventoryPage.cards).nth(examples.productIndices.secondAdded).locator(inventoryPage.card.remove)).toHaveText(l10n['inventoryPage.remove']);
      await expect(page.locator(inventoryPage.cards).nth(examples.productIndices.secondAdded).locator(inventoryPage.card.remove)).toBeVisible();
    });
  });

  test.describe('InventoryPage.STANDARD: When user clicks on Cart button', () => {
    test.beforeAll(async () => {
      await page.locator(headerComp.openCart).click();
    });
    test('InventoryPage.STANDARD: Then user should be redirected to the Cart page URL', async () => {
      await expect(page).toHaveURL(pages.cart);
    });
    test('InventoryPage.STANDARD: Then Cart page title is displayed', async () => {
      await expect(page.locator(cartPage.title)).toHaveText(l10n['cartPage.title']);
    });
    test('InventoryPage.Card.STANDARD: Then appropriate products are presented in the table', req({ bugs: ['BUG-INVENTORY-001'] }), async () => {
      await cartPage__validateChosenProductTitles(page, chosenProducts, examples.buggyProductData);
    });
    test('InventoryPage.Card.STANDARD: Then the total number of products is correct', async () => {
      await expect(page.locator(cartPage.items)).toHaveCount(examples.cartBadgeCounts.twoProducts);
    });
  });

  test.describe('InventoryPage.STANDARD: When user navigates back from Cart page using back command', () => {
    test.beforeAll(async () => {
      await page.goBack();
    });
    test('InventoryPage.STANDARD: Then user should be redirected to the Inventory page URL', async () => {
      await expect(page).toHaveURL(pages.inventory);
    });
    test('InventoryPage.STANDARD: Then Inventory page title is displayed', async () => {
      await expect(page.locator(inventoryPage.title)).toHaveText(l10n['inventoryPage.title']);
    });
    test('InventoryPage.Header.STANDARD: Then the Cart button with an appropriate number on the badge is displayed', async () => {
      await headerComp__verifyCartBadge(page, examples.cartBadgeCounts.twoProducts);
    });
    test('InventoryPage.Card.STANDARD: Then the remove button is displayed for the products added to the cart', async () => {
      await expect(page.locator(inventoryPage.cards).nth(examples.productIndices.firstAdded).locator(inventoryPage.card.remove)).toHaveText(l10n['inventoryPage.remove']);
      await expect(page.locator(inventoryPage.cards).nth(examples.productIndices.firstAdded).locator(inventoryPage.card.remove)).toBeVisible();
      await expect(page.locator(inventoryPage.cards).nth(examples.productIndices.secondAdded).locator(inventoryPage.card.remove)).toHaveText(l10n['inventoryPage.remove']);
      await expect(page.locator(inventoryPage.cards).nth(examples.productIndices.secondAdded).locator(inventoryPage.card.remove)).toBeVisible();
    });
  });

  test.describe('InventoryPage.STANDARD: When user clicks on remove button for first random product', () => {
    test.beforeAll(async () => {
      await inventoryPage__removeProductFromCart(page, examples.productIndices.firstAdded);
    });
    test('InventoryPage.Header.STANDARD: Then the Cart button with an appropriate number on the badge is displayed', async () => {
      await headerComp__verifyCartBadge(page, examples.cartBadgeCounts.oneProduct);
    });
    test('InventoryPage.Card.STANDARD: Then the remove button is changed to add button', async () => {
      await expect(page.locator(inventoryPage.cards).nth(examples.productIndices.firstAdded).locator(inventoryPage.card.add)).toHaveText(l10n['inventoryPage.addToCart']);
      await expect(page.locator(inventoryPage.cards).nth(examples.productIndices.firstAdded).locator(inventoryPage.card.add)).toBeVisible();
    });
  });

  test.describe('InventoryPage.STANDARD: When user clicks on add to cart button for first random product again', () => {
    test.beforeAll(async () => {
      await inventoryPage__addProductToCart(page, examples.productIndices.firstAdded);
    });
    test('InventoryPage.Header.STANDARD: Then the Cart button with an appropriate number on the badge is displayed', async () => {
      await headerComp__verifyCartBadge(page, examples.cartBadgeCounts.twoProducts);
    });
    test('InventoryPage.Card.STANDARD: Then the add to cart button is changed to remove button', async () => {
      await expect(page.locator(inventoryPage.cards).nth(examples.productIndices.firstAdded).locator(inventoryPage.card.remove)).toHaveText(l10n['inventoryPage.remove']);
      await expect(page.locator(inventoryPage.cards).nth(examples.productIndices.firstAdded).locator(inventoryPage.card.remove)).toBeVisible();
    });
  });

  test.describe('InventoryPage.STANDARD: When user clicks on Title of product card that was not added to cart', () => {
    let productForReview;

    test.beforeAll(async () => {
      const title = await page.locator(inventoryPage.card.title).nth(examples.productIndices.notAdded).innerText();
      if (title !== examples.buggyProductData.wrongTitle) {
        productForReview = { title };
      }
      await page.locator(inventoryPage.cards).nth(examples.productIndices.notAdded).locator(inventoryPage.card.title).click();
    });
    test('InventoryPage.STANDARD: Then user should be redirected to the Product page URL', async () => {
      await expect(page).toHaveURL((url) => url.href.includes(pages.item));
    });
    test('InventoryPage.STANDARD: Then Product title should be displayed', req({ bugs: ['BUG-INVENTORY-001'] }), async () => {
      const title = await page.locator(productPage.title).innerText();
      // eslint-disable-next-line playwright/no-conditional-in-test -- the mistitled product (BUG-INVENTORY-001) cannot be matched by title
      if (title === examples.buggyProductData.wrongTitle) {
        return;
      }
      await expect(page.locator(productPage.title)).toHaveText(productForReview.title);
    });
  });

  test.describe('InventoryPage.STANDARD: When user navigates back from Product page using back command', () => {
    test.beforeAll(async () => {
      await page.goBack();
    });
    test('InventoryPage.STANDARD: Then user should be redirected to the Inventory page URL', async () => {
      await expect(page).toHaveURL(pages.inventory);
    });
    test('InventoryPage.STANDARD: Then Inventory page title is displayed', async () => {
      await expect(page.locator(inventoryPage.title)).toHaveText(l10n['inventoryPage.title']);
    });
    test('InventoryPage.Header.STANDARD: Then the Cart button with an appropriate number on the badge is displayed', async () => {
      await headerComp__verifyCartBadge(page, examples.cartBadgeCounts.twoProducts);
    });
    test('InventoryPage.Card.STANDARD: Then the remove button is displayed for the products added to the cart', async () => {
      await expect(page.locator(inventoryPage.cards).nth(examples.productIndices.firstAdded).locator(inventoryPage.card.remove)).toHaveText(l10n['inventoryPage.remove']);
      await expect(page.locator(inventoryPage.cards).nth(examples.productIndices.firstAdded).locator(inventoryPage.card.remove)).toBeVisible();
      await expect(page.locator(inventoryPage.cards).nth(examples.productIndices.secondAdded).locator(inventoryPage.card.remove)).toHaveText(l10n['inventoryPage.remove']);
      await expect(page.locator(inventoryPage.cards).nth(examples.productIndices.secondAdded).locator(inventoryPage.card.remove)).toBeVisible();
    });
  });

  test.describe('InventoryPage.STANDARD: When user clicks remove on all the added cards', () => {
    test.beforeAll(async () => {
      await inventoryPage__removeProductFromCart(page, examples.productIndices.firstAdded);
      await inventoryPage__removeProductFromCart(page, examples.productIndices.secondAdded);
    });
    test('InventoryPage.Header.STANDARD: Then the Cart button badge is not existed', async () => {
      await headerComp__verifyCartBadge(page, examples.cartBadgeCounts.empty);
    });
    test('InventoryPage.Card.STANDARD: Then the all the product cards have add to cart buttons', async () => {
      await expect(page.locator(inventoryPage.card.add)).toHaveCount(PRODUCT_COUNT);
    });
  });
});
