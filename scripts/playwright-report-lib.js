/**
 * playwright-report-lib.js
 *
 * Reads Playwright JSON reporter output (`reports/results.json` by default, or every `*.json` in a directory, e.g. one
 * file per CI shard) into one record per spec file:
 *
 *   { file, stats: { total, passed, failed, pending, skipped, duration },
 *     tests: [{ context: [suite titles], it, fullTitle, state, flaky, executed, duration, err, stack, annotations, attachments, startTime }] }
 *
 * `state` uses the mocha vocabulary the ledger and the sign-off report already speak: passed | failed | pending.
 * A test that failed and then passed on retry is `passed` with `flaky: true`. A test with no result at all (a serial
 * group stopped by an earlier failure, or a failed hook) is `pending` with `executed: false`.
 */
const fs = require('fs');
const path = require('path');

// Playwright error messages carry terminal colour codes; reports and the ledger store plain text.
// eslint-disable-next-line no-control-regex
const ANSI = /\u001b\[[0-9;]*m/g;
const plain = (text) => (text ? text.replace(ANSI, '') : text);

const STATE_BY_STATUS = {
  expected: 'passed',
  flaky: 'passed',
  unexpected: 'failed',
  skipped: 'pending',
};

function reportFiles(location) {
  if (!fs.existsSync(location)) return [];
  if (fs.statSync(location).isFile()) return [location];
  return fs
    .readdirSync(location)
    .filter((name) => name.endsWith('.json'))
    .map((name) => path.join(location, name));
}

function toTest(spec, suitePath, test) {
  const last = test.results?.[test.results.length - 1] ?? {};
  const state = test.status === 'expected' && last.status === 'skipped' ? 'pending' : (STATE_BY_STATUS[test.status] ?? 'failed');
  const firstError = test.results?.map((result) => result.error).find(Boolean) ?? null;
  return {
    context: suitePath,
    it: spec.title,
    fullTitle: [...suitePath, spec.title].join(' '),
    state,
    flaky: test.status === 'flaky',
    duration: (test.results ?? []).reduce((sum, result) => sum + (result.duration || 0), 0),
    executed: (test.results ?? []).length > 0 && last.status !== 'skipped',
    err: state === 'failed' ? (plain(firstError?.message) ?? null) : null,
    stack: state === 'failed' ? (plain(firstError?.stack) ?? '') : '',
    annotations: test.annotations ?? [],
    attachments: (test.results ?? []).flatMap((result) => result.attachments ?? []),
    startTime: last.startTime ?? null,
  };
}

function collect(suite, suitePath, acc) {
  const currentPath = suite.title && !suite.file?.endsWith(suite.title) ? [...suitePath, suite.title] : suitePath;
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) acc.push(toTest(spec, currentPath, test));
  }
  for (const child of suite.suites ?? []) collect(child, currentPath, acc);
  return acc;
}

function statsOf(tests) {
  const count = (state) => tests.filter((test) => test.state === state).length;
  return {
    total: tests.length,
    passed: count('passed'),
    failed: count('failed'),
    pending: count('pending'),
    skipped: 0,
    duration: tests.reduce((sum, test) => sum + test.duration, 0),
  };
}

/**
 * @param {string} location  JSON report file or a directory of them.
 * @returns {{ file: string, stats: object, tests: object[], startTime: string|null }[]}
 */
function readPlaywrightReports(location) {
  const bySpec = new Map();
  for (const file of reportFiles(location)) {
    let report;
    try {
      report = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (error) {
      console.error(`  Skipping ${path.basename(file)}: ${error.message}`);
      continue;
    }
    const rootDir = report.config?.rootDir ?? '';
    for (const fileSuite of report.suites ?? []) {
      const specFile = path
        .join(path.relative(process.cwd(), rootDir) || '.', fileSuite.file ?? fileSuite.title)
        .split(path.sep)
        .join('/');
      const tests = collect(fileSuite, [], []);
      const known = bySpec.get(specFile);
      bySpec.set(specFile, { file: specFile, tests: [...(known?.tests ?? []), ...tests], startTime: report.stats?.startTime ?? null });
    }
  }
  return [...bySpec.values()].map((spec) => ({ ...spec, stats: statsOf(spec.tests) }));
}

module.exports = { readPlaywrightReports };
