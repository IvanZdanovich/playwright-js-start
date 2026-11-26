import path from 'path';
import { loadFlatMap } from './flat-map';

/**
 * Theme colours for the theme selected by `COLOUR_THEME` (default `default`).
 * Read keys as literals: `colours['text.error']`. An unknown key throws.
 * @type {Readonly<Record<import('./colours-keys').ColourKey, string>>}
 */
export const colours = loadFlatMap({
  dir: path.join(__dirname, '..', 'colours'),
  suffix: '-theme-colours.json',
  envVar: 'COLOUR_THEME',
  referenceCode: 'default',
});
