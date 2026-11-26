import { getEnvironment } from '../../config/environments';

const { baseUrl, baseAPIUrl } = getEnvironment();

export const api = {
  auth: `${baseAPIUrl}/auth`,
  booking: `${baseAPIUrl}/booking`,
  ping: `${baseAPIUrl}/ping`,
};

export const pages = {
  login: `${baseUrl}/`,
  inventory: `${baseUrl}/inventory.html`,
  cart: `${baseUrl}/cart.html`,
  item: `${baseUrl}/inventory-item.html`,
  checkout: `${baseUrl}/checkout-step-one.html`,
};

export const external = {
  about: 'https://saucelabs.com/',
  linkedin: 'https://www.linkedin.com/company/sauce-labs/',
  linkedinBase: 'https://www.linkedin.com/',
  facebook: 'https://www.facebook.com/saucelabs',
  x: 'https://x.com/saucelabs',
};
