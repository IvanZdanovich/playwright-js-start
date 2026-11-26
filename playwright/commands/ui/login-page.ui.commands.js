import { loginPage } from '../../selectors/selectors';

export async function loginPage__logIn(page, user) {
  const { username, password } = user;
  await page.locator(loginPage.username).fill(username);
  await page.locator(loginPage.password).fill(password);
  await page.locator(loginPage.login).click();
}
