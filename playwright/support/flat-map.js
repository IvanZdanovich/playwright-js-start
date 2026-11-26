import fs from 'fs';
import path from 'path';

/**
 * Loads one flat dot-namespaced JSON map (a locale or a theme) selected by an env var.
 * The map is frozen and wrapped so that reading a key the reference file does not declare throws.
 * A typo or a removed key then fails the test that uses it, instead of asserting against `undefined`.
 */
export function loadFlatMap({ dir, suffix, envVar, referenceCode }) {
  const code = process.env[envVar] || referenceCode;
  const read = (fileCode) => {
    const file = path.join(dir, `${fileCode}${suffix}`);
    if (!fs.existsSync(file)) throw new Error(`${envVar}="${fileCode}": file ${file} does not exist.`);
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  };
  const active = Object.freeze(read(code));
  const referenceKeys = new Set(Object.keys(code === referenceCode ? active : read(referenceCode)));
  const missing = [...referenceKeys].filter((key) => !(key in active));
  if (missing.length > 0) throw new Error(`${envVar}="${code}" is missing keys: ${missing.join(', ')}`);

  // Names that runtimes probe on any object (promise check, JSON, inspection) must not throw.
  const probes = new Set(['then', 'toJSON', 'constructor', 'asymmetricMatch', '$$typeof', 'nodeType']);
  return new Proxy(active, {
    get(target, key) {
      if (typeof key === 'symbol' || probes.has(key)) return target[key];
      if (!referenceKeys.has(key)) throw new Error(`Unknown key "${key}" (not in ${referenceCode}${suffix})`);
      return target[key];
    },
  });
}
