/**
 * ESLint rule: verify-req-config
 *
 * When a `test()` / `test.describe()` block (including .skip, .only, .fixme variants) passes requirement metadata as
 * its second argument through `req({...})` from `playwright/support/req.js`, validates every field of that object.
 * `req()` is optional. A Cypress-style `{ req: {...} }` details object is reported: Playwright ignores it.
 *
 * Allowed fields inside `req` (all optional):
 *   - p             — 'P1' | 'P2' | 'P3'  (omit when P2 — that is the default)
 *   - preconditions — non-empty array of non-empty strings.
 *   - refs          — non-empty array of valid HTTP/HTTPS URLs.
 *   - bugs          — non-empty array of BUG-CONTEXT-NNN strings or valid URLs; context is uppercase alphanumeric.
 *   - note          — non-empty string comment about the checks in this block.
 *
 * Any field name other than the five above is reported as unknown.
 *
 * Valid examples:
 *   test('title', req({ p: 'P1' }), async () => {})
 *   test('title', req({ p: 'P1', preconditions: ['booking created via POST'] }), async () => {})
 *   test('title', req({ bugs: ['BUG-BOOKING-002'] }), async () => {})
 *   test('title', req({ refs: ['https://jira.example.com/browse/PROJ-123'] }), async () => {})
 *   test.describe('title', req({ note: 'asserts current behaviour pending BUG-BOOKING-002 fix' }), () => {})
 */
const { classify, isSpecFile } = require('./_test-blocks.js');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'When req({...}) is passed to a test or test.describe block, validates p, preconditions, refs, bugs and rejects unknown fields',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
  },
  create(context) {
    if (!isSpecFile(context.filename)) return {};
    const VALID_PRIORITIES = ['P1', 'P2', 'P3'];
    const KNOWN_FIELDS = ['p', 'preconditions', 'refs', 'bugs', 'note'];
    const BUG_ID_PATTERN = /^BUG-[A-Z0-9]+-\d{3}$/;
    const URL_PATTERN = /^https?:\/\/.+/;

    function getStaticValue(node) {
      if (!node) return undefined;
      if (node.type === 'Literal') return node.value;
      return undefined;
    }

    function checkReqConfigBlock(node) {
      const args = node.arguments;
      // Playwright signature: block(title, [details], fn); details is req({...}) or a TestDetails object.
      const details = args.length >= 3 ? args[1] : null;
      if (!details) return;

      if (details.type === 'ObjectExpression') {
        const legacy = details.properties.find((prop) => prop.key && (prop.key.name === 'req' || prop.key.value === 'req'));
        if (legacy) context.report({ node: legacy, message: 'Pass requirement metadata as req({...}) — Playwright ignores a { req: {...} } details key.' });
        return;
      }
      if (details.type !== 'CallExpression' || details.callee.type !== 'Identifier' || details.callee.name !== 'req') return;

      const reqProp = { value: details.arguments[0] || { type: 'ObjectExpression', properties: [] } };

      // ── req() takes one object literal ─────────────────────────────────────
      if (reqProp.value.type !== 'ObjectExpression') {
        context.report({
          node: details,
          message: "req() takes one object literal, e.g. req({ p: 'P1' }).",
        });
        return;
      }

      const reqProps = {};
      for (const prop of reqProp.value.properties) {
        const key = prop.key.name || prop.key.value;
        reqProps[key] = prop;
      }

      // ── Reject unknown fields ───────────────────────────────────────────────
      for (const key of Object.keys(reqProps)) {
        if (!KNOWN_FIELDS.includes(key)) {
          context.report({
            node: reqProps[key],
            message: `Unknown field "${key}" in req. Allowed fields: ${KNOWN_FIELDS.join(', ')}.`,
          });
        }
      }

      // ── Validate p (priority) ───────────────────────────────────────────────
      if (reqProps.p) {
        const pVal = getStaticValue(reqProps.p.value);
        if (pVal !== undefined && !VALID_PRIORITIES.includes(pVal)) {
          context.report({
            node: reqProps.p,
            message: `req.p must be one of: ${VALID_PRIORITIES.join(', ')}. Got: "${pVal}".`,
          });
        }
      }

      // ── Validate preconditions (non-empty array of non-empty string literals) ─
      if (reqProps.preconditions) {
        const precNode = reqProps.preconditions.value;
        if (precNode.type !== 'ArrayExpression') {
          context.report({
            node: reqProps.preconditions,
            message: "req.preconditions must be an array of strings, e.g. preconditions: ['booking created via POST'].",
          });
        } else if (precNode.elements.length === 0) {
          context.report({
            node: reqProps.preconditions,
            message: 'req.preconditions must not be an empty array.',
          });
        } else {
          for (const element of precNode.elements) {
            const val = getStaticValue(element);
            if (element.type !== 'Literal' || typeof val !== 'string') {
              context.report({
                node: element,
                message: 'Each entry in req.preconditions must be a string literal.',
              });
            } else if (val.trim() === '') {
              context.report({
                node: element,
                message: 'req.preconditions entries must not be empty strings.',
              });
            }
          }
        }
      }

      // ── Validate refs (non-empty array of valid HTTP/HTTPS URLs) ───────────
      if (reqProps.refs) {
        const refsNode = reqProps.refs.value;
        if (refsNode.type !== 'ArrayExpression') {
          context.report({
            node: reqProps.refs,
            message: "req.refs must be an array of URLs, e.g. refs: ['https://jira.example.com/browse/PROJ-123'].",
          });
        } else if (refsNode.elements.length === 0) {
          context.report({
            node: reqProps.refs,
            message: 'req.refs must not be an empty array.',
          });
        } else {
          for (const element of refsNode.elements) {
            const val = getStaticValue(element);
            if (element.type !== 'Literal' || typeof val !== 'string') {
              context.report({
                node: element,
                message: 'Each entry in req.refs must be a string literal URL.',
              });
            } else if (!URL_PATTERN.test(val)) {
              context.report({
                node: element,
                message: `req.refs entries must be valid HTTP/HTTPS URLs. Got: "${val}".`,
              });
            }
          }
        }
      }

      // ── Validate bugs (non-empty array of BUG-CONTEXT-NNN strings or URLs) ───
      if (reqProps.bugs) {
        const bugsNode = reqProps.bugs.value;
        if (bugsNode.type !== 'ArrayExpression') {
          context.report({
            node: reqProps.bugs,
            message: "req.bugs must be an array, e.g. bugs: ['BUG-BOOKING-002'].",
          });
        } else if (bugsNode.elements.length === 0) {
          context.report({
            node: reqProps.bugs,
            message: 'req.bugs must not be an empty array.',
          });
        } else {
          for (const element of bugsNode.elements) {
            const val = getStaticValue(element);
            if (val !== undefined && !BUG_ID_PATTERN.test(val) && !URL_PATTERN.test(val)) {
              context.report({
                node: element,
                message: `req.bugs entries must match BUG-CONTEXT-NNN format, where CONTEXT is uppercase alphanumeric, or be a valid URL. Got: "${val}".`,
              });
            }
          }
        }
      }

      // ── Validate note (non-empty string literal) ────────────────────────────
      if (reqProps.note) {
        const noteVal = getStaticValue(reqProps.note.value);
        if (reqProps.note.value.type !== 'Literal' || typeof noteVal !== 'string') {
          context.report({
            node: reqProps.note,
            message: "req.note must be a string literal, e.g. note: 'asserts current behaviour pending fix'.",
          });
        } else if (noteVal.trim() === '') {
          context.report({
            node: reqProps.note,
            message: 'req.note must not be an empty string.',
          });
        }
      }
    }

    return {
      CallExpression(node) {
        const block = classify(node, context.sourceCode);
        if (block && block.level !== 'hook') checkReqConfigBlock(node);
      },
    };
  },
};
