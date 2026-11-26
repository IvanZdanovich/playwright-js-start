import { expect } from '@playwright/test';
import { footerComp } from '../../selectors/selectors';
import { l10n } from '../../support/l10n';

export async function footerComp__verifyCopyright(page) {
  const currentYear = new Date().getUTCFullYear();
  await expect(page.locator(footerComp.copyRight)).toHaveText(l10n['footer.copyRight'].replace('yearPlaceholder', String(currentYear)));
  await expect(page.locator(footerComp.copyRight)).toBeVisible();
}
