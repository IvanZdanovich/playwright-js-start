/**
 * Requirement metadata for a `test` or `test.describe`, stored as Playwright annotations so it appears in the
 * HTML and JSON reports and in the sign-off report.
 *
 *   test('Page.ROLE: Then ...', req({ p: 'P1', bugs: ['BUG-LOGIN-001'] }), async () => { ... });
 *
 * Fields: `p` ('P1' | 'P3'; 'P2' is the default and is omitted), `preconditions`, `refs` (URLs),
 * `bugs` (BUG-CONTEXT-NNN ids or tracker URLs), `note` (why the check is shaped this way).
 * The `custom/verify-req-config` lint rule validates the same schema statically.
 */
const FIELD_TO_TYPE = Object.freeze({
  p: 'priority',
  preconditions: 'precondition',
  refs: 'ref',
  bugs: 'bug',
  note: 'note',
});

export function req(fields = {}) {
  const unknown = Object.keys(fields).filter((key) => !(key in FIELD_TO_TYPE));
  if (unknown.length > 0) throw new Error(`req(): unknown field(s) ${unknown.join(', ')}`);

  const annotation = [];
  for (const [field, type] of Object.entries(FIELD_TO_TYPE)) {
    const value = fields[field];
    if (value === undefined) continue;
    for (const description of [value].flat()) annotation.push({ type, description });
  }
  return { annotation };
}
