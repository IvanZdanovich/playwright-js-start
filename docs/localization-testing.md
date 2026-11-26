# Localization

Tests assert localized UI text through the `l10n` map imported from `playwright/support/l10n.js`, never hardcoded strings.
Keys are flat and dot-namespaced, and the key string is the contract with the application.

```javascript
import { l10n } from '../../support/l10n';

await expect(page.locator(inventoryPage.title)).toHaveText(l10n['inventoryPage.title']);
```

## How it works

- One flat JSON per language at `playwright/localization/{lang}-localization.json` (`"dotted.key": "Translated text"`, no nesting). These are the files you edit.
- `playwright/support/l10n.js` reads the file selected by `LANGUAGE` when a worker starts, checks that it holds every key
  of the reference `en-localization.json`, and freezes it. Reading a key the reference does not declare throws, so a typo fails the
  test that uses it instead of comparing against `undefined`.
- `npm run l10n:gen-types` writes the key union to `playwright/support/l10n-keys.d.ts` (git-ignored) for editor
  completion. Per-language drift is reported by `npm run l10n:validate` and `npm run sync:l10n -- --check`.

```bash
LANGUAGE=en npm test               # run against one language
npm run l10n:gen-types             # regenerate the key union for the editor
npm run l10n:add -- <key> <value>  # add a key to every language file (interactive if no args)
npm run l10n:remove -- <key>       # remove a key from every language file
npm run sync:l10n                  # align language files (add missing, sort)
```

All operations run through the single `scripts/l10n.js` CLI (`node scripts/l10n.js help`).

## Source of truth

The [localization-testing skill](../.claude/skills/localization-testing/SKILL.md) governs key grammar, scopes, and the add, rename, remove, and
dedupe procedures. Follow it when touching keys; this page is only a human orientation.

## Related

- [Colour theme testing](colour-theme-testing.md)
- [Constraints → Examples → Specs](constraints-examples-specs-approach.md)
