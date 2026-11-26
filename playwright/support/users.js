import fs from 'fs';
import path from 'path';
import { getEnvironment } from '../../config/environments';
import { userRoles } from '../constants/user-roles';

let users;

/**
 * Credentials for a role from `playwright/sensitive-data/<TARGET_ENV>-users.json` (git-ignored).
 * Copy `env-users.example.json` to `dev-users.json` to run locally; CI writes it from a secret.
 */
export function getUserDataByRole(role) {
  if (!Object.values(userRoles).includes(role)) throw new Error(`Invalid user role: ${role}`);
  if (!users) {
    const file = path.join(__dirname, '..', 'sensitive-data', `${getEnvironment().envName}-users.json`);
    if (!fs.existsSync(file)) throw new Error(`Sensitive data not provided: ${file} (copy env-users.example.json)`);
    users = JSON.parse(fs.readFileSync(file, 'utf8'));
  }
  const user = users[role];
  if (!user) throw new Error(`User data not found for role: ${role}`);
  return user;
}
