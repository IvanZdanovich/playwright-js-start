const { classify, isSpecFile } = require('./_test-blocks.js');

/**
 * ESLint rule: enforce-single-describe
 *
 * A spec file holds exactly one top-level `test.describe` (the Given). Its nested `test.describe` blocks are the
 * When steps and `test` blocks the Then outcomes. A second top-level describe is a second scenario with its own
 * state and setup: it belongs in its own spec file, so each file stays one live requirement with one owner.
 */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'allow exactly one top-level test.describe (Given) per spec file, with nested test.describe (When) and test (Then) blocks',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      secondDescribe: 'Only one top-level test.describe is allowed per spec file. Move "{{title}}" to its own spec file.',
      testOutsideDescribe: 'Place test "{{title}}" inside a nested test.describe (When) under the top-level test.describe (Given).',
    },
  },
  create(context) {
    if (!isSpecFile(context.filename)) return {};
    let topLevelCount = 0;
    return {
      CallExpression(node) {
        const block = classify(node, context.sourceCode);
        if (!block) return;
        const title = node.arguments[0]?.value ?? node.arguments[0]?.quasis?.[0]?.value.cooked ?? '';
        if (block.level === 'describe') {
          topLevelCount += 1;
          if (topLevelCount > 1) context.report({ node, messageId: 'secondDescribe', data: { title } });
        }
        if (block.level === 'it') {
          const depth = context.sourceCode.getAncestors(node).filter((ancestor) => classify(ancestor, context.sourceCode)?.level === 'describe' || classify(ancestor, context.sourceCode)?.level === 'context').length;
          if (depth < 2) context.report({ node, messageId: 'testOutsideDescribe', data: { title } });
        }
      },
    };
  },
};
