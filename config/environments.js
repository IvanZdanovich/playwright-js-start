/**
 * Target environments. `TARGET_ENV` selects one (default `dev`).
 * Read by `playwright.config.js` (baseURL) and `playwright/support/urls.js` (API and page URLs).
 */
const ENVIRONMENTS = Object.freeze({
  dev: Object.freeze({
    envName: 'dev',
    baseUrl: 'https://www.saucedemo.com',
    baseAPIUrl: 'https://restful-booker.herokuapp.com',
  }),
  qa: Object.freeze({
    envName: 'qa',
    baseUrl: 'https://www.saucedemo.com',
    baseAPIUrl: 'https://restful-booker.herokuapp.com',
  }),
});

function getEnvironment(name = process.env.TARGET_ENV || 'dev') {
  const environment = ENVIRONMENTS[name];
  if (!environment) {
    throw new Error(`Invalid TARGET_ENV "${name}". Valid options: ${Object.keys(ENVIRONMENTS).join(', ')}`);
  }
  return environment;
}

module.exports = { ENVIRONMENTS, getEnvironment };
