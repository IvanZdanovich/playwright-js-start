/**
 * Classifies Playwright test calls into the three requirement levels the rules check:
 *
 *   test.describe(...) at the top of the file   → 'describe'  (Given)
 *   test.describe(...) nested in another one    → 'context'   (When)
 *   test(...), test.skip/only/fixme/fail(title) → 'it'        (Then)
 *   test.beforeAll/afterAll/beforeEach/afterEach → 'hook'
 *
 * `test.describe.configure(...)`, `test.use(...)`, `test.step(...)`, and a conditional `test.skip(condition)`
 * without a title are not blocks and return null.
 */
const MODIFIERS = new Set(['skip', 'only', 'fixme', 'fail', 'serial', 'parallel']);
const HOOKS = new Set(['beforeAll', 'afterAll', 'beforeEach', 'afterEach']);
const TEST_OBJECT = 'test';

/** Returns the dotted callee path, e.g. ['test', 'describe', 'skip'], or null. */
function calleePath(callee) {
  const parts = [];
  let node = callee;
  while (node && node.type === 'MemberExpression' && !node.computed && node.property.type === 'Identifier') {
    parts.unshift(node.property.name);
    node = node.object;
  }
  if (!node || node.type !== 'Identifier') return null;
  parts.unshift(node.name);
  return parts;
}

function hasTitle(node) {
  const arg = node.arguments[0];
  return Boolean(arg) && (arg.type === 'Literal' ? typeof arg.value === 'string' : arg.type === 'TemplateLiteral');
}

/** Raw call kind without depth: 'describe' | 'it' | 'hook' | null, plus the modifier. */
function callKind(node) {
  if (!node || node.type !== 'CallExpression') return null;
  const parts = calleePath(node.callee);
  if (!parts || parts[0] !== TEST_OBJECT) return null;
  const [, second, third] = parts;

  if (parts.length === 1) return hasTitle(node) ? { kind: 'it', modifier: null } : null;
  if (second === 'describe') {
    if (parts.length === 2) return { kind: 'describe', modifier: null };
    if (parts.length === 3 && MODIFIERS.has(third) && hasTitle(node)) return { kind: 'describe', modifier: third };
    return null;
  }
  if (parts.length === 2 && HOOKS.has(second)) return { kind: 'hook', modifier: second };
  if (parts.length === 2 && MODIFIERS.has(second) && hasTitle(node)) return { kind: 'it', modifier: second };
  return null;
}

/** Number of enclosing `test.describe` blocks around `node`. */
function describeDepth(node, sourceCode) {
  return sourceCode.getAncestors(node).filter((ancestor) => callKind(ancestor)?.kind === 'describe').length;
}

/**
 * Full classification with depth: { level: 'describe' | 'context' | 'it' | 'hook', modifier } or null.
 * @param {import('eslint').Rule.Node} node
 * @param {import('eslint').SourceCode} sourceCode
 */
function classify(node, sourceCode) {
  const kind = callKind(node);
  if (!kind) return null;
  if (kind.kind === 'describe') {
    return { level: describeDepth(node, sourceCode) === 0 ? 'describe' : 'context', modifier: kind.modifier };
  }
  return { level: kind.kind, modifier: kind.modifier };
}

/** The test body: the last function argument. */
function callbackOf(node) {
  const last = node.arguments[node.arguments.length - 1];
  return last && (last.type === 'ArrowFunctionExpression' || last.type === 'FunctionExpression') ? last : null;
}

function getNodeTitle(node) {
  const arg = node.arguments[0];
  if (!arg) return null;
  if (arg.type === 'Literal' && typeof arg.value === 'string') return arg.value;
  if (arg.type === 'TemplateLiteral' && arg.expressions.length === 0) return arg.quasis[0].value.cooked;
  return null;
}

/**
 * Spec rules apply only to Playwright spec files. Other files may call a function named `test` too, such as
 * `node:test` suites in `bin/__tests__/`, and their titles are not requirements.
 */
const SPEC_FILE = /[\\/]playwright[\\/](integration|e2e)[\\/].*\.spec\.js$/;
function isSpecFile(filename) {
  return SPEC_FILE.test(filename || '');
}

module.exports = { classify, callKind, callbackOf, getNodeTitle, calleePath, isSpecFile };
