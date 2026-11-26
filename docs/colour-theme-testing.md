# Colour theme testing

Tests assert CSS colour values through the `colours` map imported from `playwright/support/colours.js`, never hardcoded `rgb(…)` strings.
Keys are flat and dot-namespaced, and the key string is the contract with the application.

```javascript
import { colours } from '../../support/colours';

await expect(page.locator(loginPage.error)).toHaveCSS('background-color', colours['text.error']);
```

## How it works

- One flat JSON per theme at `playwright/colours/{theme}-theme-colours.json` (`"dotted.key": "rgb(…)"`, no nesting). These are the files you edit.
- `playwright/support/colours.js` reads the file selected by `COLOUR_THEME` when a worker starts, checks that it holds every key
  of the reference `default-theme-colours.json`, and freezes it. Reading a key the reference does not declare throws, so a typo fails the
  test that uses it instead of comparing against `undefined`.
- `npm run colours:gen-types` writes the key union to `playwright/support/colours-keys.d.ts` (git-ignored) for editor
  completion. Per-theme drift is reported by `npm run colours:validate` and `npm run sync:colours -- --check`.

```bash
COLOUR_THEME=default npm test         # run against one theme
npm run colours:gen-types             # regenerate the key union for the editor
npm run colours:add -- <key> <value>  # add a key to every theme file (interactive if no args)
npm run colours:remove -- <key>       # remove a key from every theme file
npm run sync:colours                  # align theme files (add missing, sort)
```

All operations run through the single `scripts/colours.js` CLI (`node scripts/colours.js help`).

## Source of truth

The [colour-theme-testing skill](../.claude/skills/colour-theme-testing/SKILL.md) governs key grammar, scopes, and the add, rename, remove, and
dedupe procedures. Follow it when touching keys; this page is only a human orientation.

## Related

- [Localization](localization-testing.md)
- [Constraints → Examples → Specs](constraints-examples-specs-approach.md)
