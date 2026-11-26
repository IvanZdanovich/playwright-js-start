import { expect } from '@playwright/test';
import { headerComp } from '../../selectors/selectors';

export async function headerComp__resetAppState(page) {
  await page.locator(headerComp.sidebar.open).click();
  await page.locator(headerComp.sidebar.resetAppState).click();
  await page.locator(headerComp.sidebar.close).click();
  await page.reload();
}

export async function headerComp__logOut(page) {
  await page.locator(headerComp.sidebar.open).click();
  await page.locator(headerComp.sidebar.logout).click();
}

export async function headerComp__verifyCartBadge(page, expectedCount) {
  if (expectedCount === 0) {
    await expect(page.locator(headerComp.cartBadge)).toHaveCount(0);
    return;
  }
  await expect(page.locator(headerComp.cartBadge)).toHaveText(String(expectedCount));
  await expect(page.locator(headerComp.cartBadge)).toBeVisible();
}
