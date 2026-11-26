import { checkoutPage } from '../../selectors/selectors';

export async function checkoutPage__fillDeliveryInfo(page, deliveryInfo) {
  const { firstName, lastName, zip } = deliveryInfo;
  await page.locator(checkoutPage.firstName).fill(firstName);
  await page.locator(checkoutPage.lastName).fill(lastName);
  await page.locator(checkoutPage.zip).fill(zip);
}
