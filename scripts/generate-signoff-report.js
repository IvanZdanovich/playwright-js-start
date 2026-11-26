#!/usr/bin/env node

/**
 * Sign-off Report Generator
 *
 * Turns executable requirements and the latest Playwright results into a branded
 * manual-testing checklist (self-contained HTML): coverage metrics, a prioritised spec
 * list, failed-test evidence and per-spec check lists with sign-off blocks.
 *
 * Static data comes from every `playwright/**\/*.spec.js` (parsed with espree, the
 * same AST approach as `analyze-coverage-gaps.js`): suite/test titles, `.skip`
 * state and the `{ req: { p, refs, bugs, note, preconditions } }` config objects.
 * Runtime data comes from the Playwright JSON report. Both are joined on spec file
 * + test.describe titles + test title. Failure screenshots come from the test's attachments.
 *
 * Usage:
 *   node scripts/generate-signoff-report.js
 *   node scripts/generate-signoff-report.js --reports <file-or-dir> --output-dir <dir>
 *
 * Environment (all optional): TARGET_ENV, BROWSER, plus the CI variables read by
 * `collect-test-results.js` (Azure DevOps, GitHub Actions, ...).
 */

const fs = require('fs');
const path = require('path');
const { callKind } = require('../eslint-plugin-custom-rules/_test-blocks');
const { readPlaywrightReports } = require('./playwright-report-lib');
const espree = require('espree');
const { gitExecFileSync } = require('./git-exec-lib');
const { gitMeta, ciBuildId } = require('./collect-test-results');
const { renderReport, formatTimestamp } = require('./report-template/render');

const WORKSPACE = path.resolve(__dirname, '..');
const args = process.argv.slice(2);

function argValue(flag, fallback) {
  const index = args.indexOf(flag);
  return index !== -1 && args[index + 1] ? args[index + 1] : fallback;
}

const SPECS_DIR = path.join(WORKSPACE, 'playwright');
const REPORTS_PATH = path.resolve(WORKSPACE, argValue('--reports', 'reports/results.json'));
const OUTPUT_DIR = path.resolve(WORKSPACE, argValue('--output-dir', 'reports'));

const APP = {
  name: process.env.APP_NAME || 'Playwright Start',
  description: process.env.APP_DESCRIPTION || 'Executable Requirements',
};
const PRIORITY_RANK = { P1: 1, P2: 2, P3: 3 };
const DEFAULT_PRIORITY = 'P2';
// Stands in for each `${}` expression of a template-literal title; see `matchesTemplate()`.
const PLACEHOLDER = '${…}';
const RUNTIME_STATES = { passed: 'passed', failed: 'failed', pending: 'skipped' };

// ---------------------------------------------------------------------------
// Static analysis
// ---------------------------------------------------------------------------

function findSpecFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'reports' ? [] : findSpecFiles(fullPath);
    return entry.name.endsWith('.spec.js') ? [fullPath] : [];
  });
}

/** Same classification as the lint rules: test.describe → suite, test / test.skip / test.fixme → test. */
function getCallDescriptor(node) {
  const kind = callKind(node);
  if (!kind || kind.kind === 'hook') return null;
  return { name: kind.kind, skip: kind.modifier === 'skip' || kind.modifier === 'fixme' };
}

function getTitle(node) {
  const arg = node.arguments[0];
  if (arg?.type === 'Literal' && typeof arg.value === 'string') return arg.value;
  if (arg?.type === 'TemplateLiteral') return arg.quasis.map((quasi) => quasi.value.cooked).join(PLACEHOLDER);
  return null;
}

function getCallback(node) {
  return node.arguments.findLast((arg) => arg.type === 'FunctionExpression' || arg.type === 'ArrowFunctionExpression') || null;
}

function propertyKey(property) {
  if (property.key.type === 'Identifier') return property.key.name;
  return property.key.type === 'Literal' ? String(property.key.value) : null;
}

/** Converts a literal AST value (string, array of strings, object) to plain JS. */
function literalValue(node) {
  if (node.type === 'Literal') return node.value;
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) return node.quasis[0].value.cooked;
  if (node.type === 'ArrayExpression') return node.elements.filter(Boolean).map(literalValue);
  if (node.type === 'ObjectExpression') {
    const properties = node.properties.filter((property) => property.type === 'Property' && propertyKey(property));
    return Object.fromEntries(properties.map((property) => [propertyKey(property), literalValue(property.value)]));
  }
  return undefined;
}

/** The object literal passed to `req({...})`, directly or through a `const x = req({...})` binding. */
function reqCall(arg, consts) {
  const call = arg.type === 'Identifier' ? consts.get(arg.name) : arg;
  return call?.type === 'CallExpression' && call.callee.type === 'Identifier' && call.callee.name === 'req' ? call : null;
}

function getReq(node, consts) {
  const call = node.arguments
    .slice(1)
    .map((arg) => reqCall(arg, consts))
    .find(Boolean);
  const req = call?.arguments[0] ? literalValue(call.arguments[0]) : undefined;
  return req && typeof req === 'object' ? req : null;
}

function visitChildren(node, visit) {
  for (const key of Object.keys(node)) {
    const child = node[key];
    if (Array.isArray(child)) child.forEach((item) => item && typeof item.type === 'string' && visit(item));
    else if (child && typeof child.type === 'string') visit(child);
  }
}

/** `req(...)` calls bound to a name (`const pending = req({...})` passed to several blocks); names bound twice are ambiguous. */
function collectObjectBindings(node, consts) {
  if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier' && node.init?.type === 'CallExpression') {
    consts.set(node.id.name, consts.has(node.id.name) ? null : node.init);
  }
  visitChildren(node, (child) => collectObjectBindings(child, consts));
  return consts;
}

function collectChecks(node, scope, checks) {
  if (node.type !== 'CallExpression') {
    visitChildren(node, (child) => collectChecks(child, scope, checks));
    return;
  }
  const descriptor = getCallDescriptor(node);
  const title = getTitle(node);
  const callback = getCallback(node);
  if (descriptor && title !== null && descriptor.name === 'describe' && callback) {
    const suiteScope = { ...scope, path: [...scope.path, title], skipped: scope.skipped || descriptor.skip, reqs: [...scope.reqs, getReq(node, scope.consts)] };
    collectChecks(callback.body, suiteScope, checks);
    return;
  }
  if (descriptor && title !== null && descriptor.name === 'it') {
    checks.push({ path: scope.path, title, runtimeTitle: title, staticSkipped: scope.skipped || descriptor.skip || !callback, req: getReq(node, scope.consts), suiteReqs: scope.reqs });
    return;
  }
  visitChildren(node, (child) => collectChecks(child, scope, checks));
}

function parseSpecFile(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const ast = espree.parse(source, { ecmaVersion: 'latest', sourceType: 'module' });
  const checks = [];
  collectChecks(ast, { path: [], skipped: false, reqs: [], consts: collectObjectBindings(ast, new Map()) }, checks);
  return checks;
}

function toRepoPath(filePath) {
  const relative = path.isAbsolute(filePath) ? path.relative(WORKSPACE, filePath) : filePath;
  return relative.split(path.sep).join('/').replace(/^\/+/, '');
}

function parseStaticSpecs() {
  const specs = new Map();
  for (const filePath of findSpecFiles(SPECS_DIR)) {
    const file = toRepoPath(filePath);
    try {
      specs.set(file, parseSpecFile(filePath));
    } catch (error) {
      console.warn(`  WARNING: could not parse ${file}: ${error.message}`);
    }
  }
  return specs;
}

// ---------------------------------------------------------------------------
// Runtime results (Playwright JSON report)
// ---------------------------------------------------------------------------

function unique(values) {
  return [...new Set(values)];
}

function checkKey(file, suitePath, title) {
  return [file, ...suitePath, title].join(' › ');
}

function readRuntimeResults() {
  const runtime = { tests: new Map(), starts: [], reportCount: 0 };
  if (!fs.existsSync(REPORTS_PATH)) {
    console.warn(`  WARNING: report not found: ${REPORTS_PATH}`);
    return runtime;
  }
  const specs = readPlaywrightReports(REPORTS_PATH);
  runtime.reportCount = specs.length;
  for (const spec of specs) {
    if (spec.startTime) runtime.starts.push(spec.startTime);
    for (const test of spec.tests) {
      let status = 'notExecuted';
      if (test.executed) status = RUNTIME_STATES[test.state];
      else if (isDeclaredSkip(test)) status = 'skipped';
      runtime.tests.set(checkKey(spec.file, test.context, test.it), {
        file: spec.file,
        path: test.context,
        title: test.it,
        status,
        reason: status === 'notExecuted' ? 'not run: an earlier step of the serial spec or a hook failed' : '',
        duration: test.duration,
        message: test.err || '',
        stack: test.stack || '',
        attachments: test.attachments,
        startedAt: test.startTime || spec.startTime,
      });
    }
  }
  return runtime;
}

/** A `test.skip(...)` declaration carries Playwright's own `skip` annotation; a test stopped by a failure does not. */
function isDeclaredSkip(test) {
  return test.annotations.some((annotation) => annotation.type === 'skip' || annotation.type === 'fixme');
}

// ---------------------------------------------------------------------------
// Screenshots
// ---------------------------------------------------------------------------

/** Playwright attaches failure screenshots to the test result; each is inlined so the report stays one file. */
function findScreenshots(result) {
  return (result.attachments || [])
    .filter((attachment) => attachment.contentType === 'image/png' && attachment.path && fs.existsSync(attachment.path))
    .map((attachment) => ({ name: path.basename(attachment.path), dataUri: `data:image/png;base64,${fs.readFileSync(attachment.path).toString('base64')}` }));
}

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------

const MERGED_REQ_LISTS = ['refs', 'bugs', 'preconditions'];

/** `req` of the check merged over its enclosing blocks: identifier and precondition lists are combined, other fields overridden. */
function effectiveReq(check) {
  const reqs = [...(check.suiteReqs || []), check.req].filter(Boolean);
  const merged = reqs.reduce((acc, req) => ({ ...acc, ...req }), {});
  for (const key of MERGED_REQ_LISTS) {
    const values = unique(reqs.flatMap((req) => req[key] || []));
    if (values.length) merged[key] = values;
  }
  return merged;
}
function highestPriority(reqs) {
  const priorities = reqs.map((req) => req.p || DEFAULT_PRIORITY);
  return priorities.sort((a, b) => PRIORITY_RANK[a] - PRIORITY_RANK[b])[0] || DEFAULT_PRIORITY;
}

/** Whether a title written with `PLACEHOLDER`s could have evaluated to `value`. */
function matchesTemplate(template, value) {
  if (!template.includes(PLACEHOLDER)) return template === value;
  const parts = template.split(PLACEHOLDER);
  const head = parts[0];
  const tail = parts.at(-1);
  if (!value.startsWith(head) || !value.endsWith(tail)) return false;
  const end = value.length - tail.length;
  let position = head.length;
  for (const part of parts.slice(1, -1)) {
    const found = value.indexOf(part, position);
    if (found === -1 || found + part.length > end) return false;
    position = found + part.length;
  }
  return position <= end;
}

function isTemplateCheck(check) {
  return [...check.path, check.runtimeTitle].some((segment) => segment.includes(PLACEHOLDER));
}

function matchesCheck(check, test) {
  const segments = [...check.path, check.runtimeTitle];
  const values = [...test.path, test.title];
  return segments.length === values.length && segments.every((segment, index) => matchesTemplate(segment, values[index]));
}

function toCheck(check, result) {
  const status = result?.status || (check.staticSkipped ? 'skipped' : 'notExecuted');
  let reason = result?.reason || '';
  if (!result && status === 'notExecuted') reason = 'no result recorded for this run';
  return { ...check, effectiveReq: effectiveReq(check), status, reason, result };
}

/**
 * Runtime tests of template-titled checks, by static check index. A test is assigned only when exactly one
 * template check matches it; a template inside a loop can own several tests.
 */
function assignTemplateResults(staticChecks, candidates, unclaimed) {
  const assigned = staticChecks.map(() => []);
  for (const [key, test] of unclaimed) {
    const owners = candidates.filter((index) => matchesCheck(staticChecks[index], test));
    if (owners.length === 1) {
      assigned[owners[0]].push(test);
      unclaimed.delete(key);
    }
  }
  return assigned;
}

function joinChecks(file, staticChecks, runtime) {
  const unclaimed = new Map([...runtime.tests].filter(([, test]) => test.file === file));
  const exact = staticChecks.map((check) => {
    const key = checkKey(file, check.path, check.runtimeTitle);
    unclaimed.delete(key);
    return runtime.tests.get(key);
  });
  const candidates = staticChecks.flatMap((check, index) => (!exact[index] && isTemplateCheck(check) ? [index] : []));
  const assigned = assignTemplateResults(staticChecks, candidates, unclaimed);
  const checks = staticChecks.flatMap((check, index) => {
    if (exact[index] || !assigned[index].length) return [toCheck(check, exact[index])];
    const suffix = check.title.slice(check.runtimeTitle.length);
    return assigned[index].map((test) => toCheck({ ...check, path: test.path, title: `${test.title}${suffix}`, runtimeTitle: test.title }, test));
  });
  for (const result of unclaimed.values()) {
    checks.push({ path: result.path, title: result.title, runtimeTitle: result.title, req: null, effectiveReq: {}, suiteReqs: [], status: result.status, reason: result.reason, result });
  }
  return checks;
}
function countStatuses(checks) {
  const counts = { checks: checks.length, passed: 0, failed: 0, skipped: 0, notExecuted: 0 };
  for (const check of checks) counts[check.status] += 1;
  return counts;
}

function buildSpec(file, checks) {
  const reqs = checks.flatMap((check) => [...check.suiteReqs, check.req]).filter(Boolean);
  const counts = countStatuses(checks);
  let status = 'passed';
  if (counts.failed) status = 'failed';
  else if (counts.passed === 0 && counts.checks > 0) status = counts.skipped ? 'skipped' : 'notExecuted';
  const specReq = checks.find((check) => check.suiteReqs.length)?.suiteReqs[0] || null;
  return { file, checks, counts, status, priority: highestPriority(reqs), refs: unique(reqs.flatMap((req) => req.refs || [])), bugs: unique(reqs.flatMap((req) => req.bugs || [])), req: specReq };
}

function compareSpecs(a, b) {
  const failed = Number(b.counts.failed > 0) - Number(a.counts.failed > 0);
  if (failed) return failed;
  const manual = b.counts.checks - b.counts.passed - (a.counts.checks - a.counts.passed);
  if (manual) return manual;
  const priority = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  return priority || a.file.localeCompare(b.file);
}

function percent(part, total) {
  return total ? Math.round((part / total) * 1000) / 10 : 0;
}

function buildCoverage(specs) {
  const totals = specs.reduce(
    (acc, spec) => {
      for (const key of Object.keys(acc)) acc[key] += spec.counts[key];
      return acc;
    },
    { checks: 0, passed: 0, failed: 0, skipped: 0, notExecuted: 0 },
  );
  return { specs: specs.length, ...totals, automationPct: percent(totals.passed, totals.checks), manualPct: percent(totals.checks - totals.passed, totals.checks) };
}

function formatDuration(ms) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

function buildFailures(specs, environment) {
  return specs.flatMap((spec) =>
    spec.checks
      .filter((check) => check.status === 'failed')
      .map((check) => {
        return {
          file: spec.file,
          path: check.path,
          title: check.title,
          message: check.result.message,
          stack: check.result.stack,
          environment,
          refs: check.effectiveReq.refs || [],
          bugs: check.effectiveReq.bugs || [],
          timestamp: check.result.startedAt || '',
          duration: formatDuration(check.result.duration),
          screenshots: findScreenshots(check.result),
        };
      }),
  );
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

function gitValue(gitArgs) {
  try {
    return gitExecFileSync(gitArgs, { cwd: WORKSPACE, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

function repositoryName() {
  const fromCi = process.env.BUILD_REPOSITORY_NAME || process.env.GITHUB_REPOSITORY;
  if (fromCi) return fromCi;
  const remote = gitValue(['config', '--get', 'remote.origin.url']);
  return (
    remote
      .replace(/\.git$/, '')
      .split(/[/:]/)
      .slice(-2)
      .join('/') || 'unknown'
  );
}

function buildMetadata(runtime) {
  const generatedAt = new Date();
  const { branch, commit } = gitMeta();
  const started = runtime.starts.sort()[0];
  const environment = process.env.TARGET_ENV || 'unknown';
  const browser = process.env.BROWSER || 'unknown';
  return {
    reportId: `${commit}-${generatedAt.getTime()}`,
    environmentLabel: `${environment} / ${browser}`,
    meta: [
      { label: 'Application', value: `${APP.name} — ${APP.description}` },
      { label: 'Repository', value: repositoryName() },
      { label: 'Branch', value: branch },
      { label: 'Commit SHA', value: process.env.BUILD_SOURCEVERSION || process.env.GITHUB_SHA || commit },
      { label: 'Build', value: process.env.BUILD_BUILDNUMBER || ciBuildId() || 'local' },
      { label: 'Environment', value: environment },
      { label: 'Platform', value: `Web — ${browser}` },
      { label: 'Execution date/time', value: started ? formatTimestamp(started) : 'No runtime results' },
      { label: 'Report generated', value: formatTimestamp(generatedAt) },
    ],
  };
}

function buildModel() {
  const staticSpecs = parseStaticSpecs();
  const runtime = readRuntimeResults();
  const executedFiles = new Set([...runtime.tests.values()].map((test) => test.file));
  const files = executedFiles.size ? [...executedFiles] : [...staticSpecs.keys()];
  const specs = files.map((file) => buildSpec(file, joinChecks(file, staticSpecs.get(file) || [], runtime))).sort(compareSpecs);
  const metadata = buildMetadata(runtime);
  return {
    title: `${APP.name} Sign-off Report`,
    app: APP,
    reportId: metadata.reportId,
    meta: metadata.meta,
    coverage: buildCoverage(specs),
    specs,
    failures: buildFailures(specs, metadata.environmentLabel),
    reportCount: runtime.reportCount,
  };
}

async function main() {
  console.log('\nSign-off Report\n');
  console.log(`  Report:          ${REPORTS_PATH}`);

  const model = buildModel();
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const htmlPath = path.join(OUTPUT_DIR, 'signoff-report.html');
  fs.writeFileSync(htmlPath, renderReport(model));

  const { coverage } = model;
  console.log(`  Reports read:    ${model.reportCount}`);
  console.log(`  Specs: ${coverage.specs}, checks: ${coverage.checks} (passed ${coverage.passed}, failed ${coverage.failed}, skipped ${coverage.skipped}, not executed ${coverage.notExecuted})`);
  console.log(`  Report written:  ${path.relative(WORKSPACE, htmlPath)}\n`);
}

main().catch((error) => {
  console.error(`  Sign-off report failed: ${error.message}`);
  process.exit(1);
});
