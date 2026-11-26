/**
 * l10n-lib.js
 *
 * Localization binding of the shared flat dot-namespaced map core
 * (scripts/flat-map-lib.js). Declares the localization file locations, key
 * grammar, and message wording, then re-exports the shared behaviour under the
 * localization-specific names consumed by scripts/l10n.js.
 *
 * Aligned with the localization-testing skill (grammar).
 */

const path = require('path');
const { createFlatMapLib } = require('./flat-map-lib');

const ROOT = path.join(__dirname, '..');

const lib = createFlatMapLib({
  dir: path.join(ROOT, 'playwright', 'localization'),
  typesFile: path.join(ROOT, 'playwright', 'support', 'l10n-keys.d.ts'),
  referenceFile: 'en-localization.json',
  referenceCode: 'en',
  placeholder: 'MISSING_TRANSLATION',
  fileSuffix: '-localization.json',
  depthHint: 'feature.area',
  minDepth: 2, // at least feature.area
  maxDepth: 5, // ceiling for table headers / option groups
  requiredValueMessage: 'An english value is required.',
  emptyValueMessage: 'The value must not be empty — assign a real translation string.',
  emptySyncHint: 'assign a proper translation string.',
  dirLabel: 'Localization',
  fileNoun: 'locale',
  syncLabel: 'Localization',
  cliScript: 'l10n.js',
  keysLabel: 'localization keys',
  regenerateHint: 'npm run l10n:gen-types',
  typeName: 'L10nKey',
  globalName: 'l10n',
  typesBaseName: 'l10n-keys.d.ts',
  codeRoot: path.join(ROOT, 'playwright'),
});

module.exports = {
  REFERENCE_CODE: lib.REFERENCE_CODE,
  PLACEHOLDER: lib.PLACEHOLDER,
  langCodeOf: lib.codeOf,
  localeFiles: lib.files,
  requireLocalizationDir: lib.requireDir,
  referenceKeys: lib.referenceKeys,
  generateTypes: lib.generateTypes,
  validateKey: lib.validateKey,
  validateValue: lib.validateValue,
  listKeys: lib.listKeys,
  addKey: lib.addKey,
  removeKeys: lib.removeKeys,
  renameKey: lib.renameKey,
  sync: lib.sync,
  ask: lib.ask,
  withPrompt: lib.withPrompt,
};
