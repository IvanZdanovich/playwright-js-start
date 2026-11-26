# Custom ESLint Rules

This project ships a local ESLint plugin that enforces spec conventions no
off-the-shelf rule covers: title grammar, command naming, structure coverage,
data-loop bans, and dead-code detection.

## Where rules live

- **Implementations:** `eslint-plugin-custom-rules/<rule-name>.js`
- **Plugin export:** `eslint-plugin-custom-rules/index.js`
- **Registration:** `eslint.config.mjs`, under the `custom/` namespace. Every registered rule is enabled automatically
  as `error`, except `find-unused-examples` and `verify-req-config`, which are `warn`
- **Block classification:** `eslint-plugin-custom-rules/_test-blocks.js` — the top `test.describe` is Given, a nested
  `test.describe` is When, `test` is Then. The coverage and sign-off scripts use the same helper
- **Tests:** `eslint-plugin-custom-rules/__tests__/rules.test.js` (`npm run test:rules`) — every rule has a case that
  must fail
- **Structure data:** `eslint-plugin-custom-rules/app-structure/{modules,components,workflows}.json`

The spec rules (titles, structure, blank lines, loops, `req()`) run only on `playwright/{integration,e2e}/**/*.spec.js`
(`isSpecFile` in `_test-blocks.js`), so a `node:test` suite elsewhere is never treated as a spec. The other rules
self-limit by filename or path in their `create()` function. A reported `custom/*` violation means the file
matched that rule's scope gate, such as `.spec.js`, `.api.commands.js`, `/commands/ui/`, a `selectors.js` basename, or an
`-examples/` folder.

## Running lint

- `npm run lint` — runs `eslint . --fix`: applies every available fix (blank lines, title terminology, structure files,
  single-line unused selectors and examples), then reports the remaining violations.
- `npx eslint <path>` — reports violations for one file or folder without changing files.

## Rules by concern

**Titles and structure**

- `enforce-single-describe` — a spec file holds exactly one top-level `test.describe` (Given), and every `test`
  (Then) sits inside a nested `test.describe` (When). A second scenario goes to its own spec file.
- `verify-test-title-pattern` — top `test.describe` titles match `Module.Sub: Given …`; nested `test.describe` titles
  match `Module.Sub.ROLE: When …`; `test` titles match `Module.Sub.ROLE: Then …`. Descriptions are 1-200 characters
  with no trailing space. `STATE:`-prefixed nested blocks are exempt.
- `verify-test-title-without-forbidden-symbols` — top and nested `test.describe` titles have no leading/trailing
  whitespace and none of `! @ # $ % ^ & * ( ) + = { } [ ] | \ ; " ' < > ? /`.
- `prevent-duplicated-titles` — every top and nested `test.describe` title, including `.skip` and `.only`, is unique
  within the linted file. (The Cypress source docs called this suite-wide; the rule has always been per file.)
- `standardize-test-titles` — title terms normalize to canonical common, UI, and API vocabulary. The mapping arrays in
  `eslint-plugin-custom-rules/standardize-test-titles.js` are the wording glossary. This rule is fixable.
- `enforce-spec-blank-lines` — inside `test.describe` bodies, consecutive `test`/hook blocks have no blank line between
  them, and each nested `test.describe` has exactly one blank line before it. `playwright/consistent-spacing-between-blocks`
  is turned off because it demands the opposite. Non-test statements reset the tracker.
  This rule is fixable.
- `do-not-allow-empty-blocks` — `test` and nested `test.describe` bodies contain real statements, not only a title or
  comment. `test.skip` and `test.fixme` placeholders and `STATE:`-prefixed nested blocks may be empty.
- `verify-test-title-against-structure` — the dotted title prefix exists in the matching
  `eslint-plugin-custom-rules/app-structure/{modules,components,workflows}.json` file. `--fix` regenerates those files
  from current titles with additive, PascalCase-only, sorted entries.

**Naming**

- `verify-api-command-naming` — in `playwright/commands/api/*.api.commands.js`, every exported function name matches
  `<resource>__<action>__<METHOD>`. `resource` and `action` are camelCase; `METHOD` is `GET`, `POST`, `PUT`, `PATCH`, or
  `DELETE`.
- `verify-ui-command-naming` — in `playwright/commands/ui/*.ui.commands.js`, every exported function name has exactly
  two camelCase parts: `<page>__<action>`.
- `verify-req-config` — validates the object passed to `req()` as the second argument of a `test` or `test.describe`,
  and reports a Cypress-style `{ req: {...} }` details object, which Playwright would silently ignore.

**`req()` metadata schema**

`req()` in `playwright/support/req.js` stores the fields as Playwright annotations and allows only these fields:

- `p` — priority value `'P1'`, `'P2'`, or `'P3'`. `P2` is the default and is conventionally omitted.
- `preconditions` — non-empty array of non-empty strings.
- `refs` — non-empty array of valid HTTP/HTTPS URLs.
- `bugs` — non-empty array of bug IDs or valid URLs. Bug IDs use `BUG-[A-Z0-9]+-NNN`, for example `BUG-LOGIN-001`.
- `note` — non-empty string explaining the checks.

Unknown keys, empty arrays, and empty notes are errors. The rule validates field shape only; the spec-writing docs and
skills define what belongs in each field.

**Data and examples**

- `prevent-examples-loops` — inside `test.describe` and `test` blocks, no `.forEach`, `for...of`, or `for...in` over
  data-shaped operands such as names matching `testData`, `invalid`, `valid`, `Array`, `items`, `values`, or `data`.
  Hooks are excluded. Pick one randomized value in the examples file instead of looping in the spec.
- `find-unused-examples` — flags first-level exported instances unused by any spec or command, with import aliases
  resolved. Single-line unused entries are fixable; multi-line entries are removed by hand. It runs on
  `playwright/{integration,e2e}-examples/**/*.examples.js`. (In the Cypress source its gate still pointed at a
  `/test-data/` folder, so it never ran.)
- `find-unused-selectors` — selector keys in `playwright/selectors/selectors.js` must be referenced across integration,
  e2e, or command files. A parent selector survives if any child selector is used. Single-line and empty entries are
  fixable.

**Guardrails**

- `verify-todos-have-links` — `TODO`, `FIXME`, `ToDo`, and `FixMe` comments include a bug-tracker URL containing a
  `/browse/PROJ-123`-style key. Matching is case-sensitive, so Playwright's `test.fixme` is not a marker. In spec
  files, prefer `req({ bugs })` over inline TODOs.
- `verify-spec-file-paths` — every file under `playwright/integration/` and `playwright/e2e/` matches its folder:
  `playwright/integration/api/**/*.api.spec.js`, `playwright/integration/ui/**/*.ui.spec.js`, or
  `playwright/e2e/ui/**/*.ui.spec.js`, so a project `testMatch` collects it. Files ending in `.spec.skip.js` are excluded, and hidden files such as `.DS_Store`
  are ignored. Non-`.js` files are found by a directory scan and reported on the first linted spec in those folders.

## Suppressing custom rules

Use inline disables only for false positives or unavoidable constraints. Disable the specific rule with the `custom/`
prefix; Playwright plugin rules use the `playwright/` prefix. Inline disables do not count toward the warning/error ratios in
`scripts/thresholds.json`.

```js
// eslint-disable-next-line custom/find-unused-selectors
reservedForFutureUse: '[data-test="future-element"]';
```

## Adding or changing a rule

- Implement the rule in `eslint-plugin-custom-rules/<rule-name>.js`.
- Export it from `eslint-plugin-custom-rules/index.js`.
- Add a valid and an invalid case to `eslint-plugin-custom-rules/__tests__/rules.test.js` and see the invalid one fail.
- `eslint.config.mjs` enables it as `error`; add an override there only for a different severity.
- Keep the rule description on this page aligned with the implemented scope gate, exemptions, and fixability.
- Describe a rule as fixable only when its source provides a fixer. Current fixable custom rules are
  `enforce-spec-blank-lines`, `standardize-test-titles`, `verify-test-title-against-structure`, `find-unused-examples`,
  and `find-unused-selectors`.

## Related

- [Constraints → Examples → Specs](constraints-examples-specs-approach.md)
- [Coverage gap analysis](coverage-gap-analysis.md)
- [Pre-commit check](pre-commit-check.md)
