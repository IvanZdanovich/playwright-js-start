import { test as base, expect } from '@playwright/test';
import { TIMEOUTS } from '../constants/timeouts';
import { getUserDataByRole } from './users';
import { restfulBooker__getAuthToken__POST } from '../commands/api/restful-booker.api.commands';

/**
 * Fixtures exist only for resources with a lifecycle (setup, teardown, per-worker caching).
 * Plain data (constraints, examples, selectors, l10n, urls) is imported; actions are imported command functions.
 *
 * Both fixtures are worker-scoped so `test.beforeAll` / `test.afterAll` can use them for setup and cleanup.
 */
export const test = base.extend({
  /** API client shared by every test and hook in the worker. */
  apiRequest: [
    async ({ playwright }, use) => {
      const context = await playwright.request.newContext({ timeout: TIMEOUTS.apiResponse });
      await use(context);
      await context.dispose();
    },
    { scope: 'worker' },
  ],

  /** `apiToken(role)` → auth token for the role, requested once per worker. */
  apiToken: [
    async ({ apiRequest }, use) => {
      const tokens = new Map();
      await use(async (role) => {
        if (!tokens.has(role)) {
          const response = await restfulBooker__getAuthToken__POST(apiRequest, { body: getUserDataByRole(role) });
          if (!response.body?.token) throw new Error(`No token for role ${role}: ${response.status} ${JSON.stringify(response.body)}`);
          tokens.set(role, response.body.token);
        }
        return tokens.get(role);
      });
    },
    { scope: 'worker' },
  ],
});

export { expect };
