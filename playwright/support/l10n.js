import path from 'path';
import { loadFlatMap } from './flat-map';

/**
 * Localized UI strings for the language selected by `LANGUAGE` (default `en`).
 * Read keys as literals: `l10n['cartPage.title']`. An unknown key throws.
 * @type {Readonly<Record<import('./l10n-keys').L10nKey, string>>}
 */
export const l10n = loadFlatMap({
  dir: path.join(__dirname, '..', 'localization'),
  suffix: '-localization.json',
  envVar: 'LANGUAGE',
  referenceCode: 'en',
});
