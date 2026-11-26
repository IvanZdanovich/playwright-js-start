const { classify, callbackOf, getNodeTitle, isSpecFile } = require('./_test-blocks.js');

const isEmptyBody = (callback) =>
  callback.body.type === 'BlockStatement' &&
  callback.body.body.every((statement) => statement.type === 'EmptyStatement' || (statement.type === 'ExpressionStatement' && statement.expression.type === 'Literal' && typeof statement.expression.value === 'string'));

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'disallow empty test and nested test.describe (context) blocks; skipped tests may stay empty as coverage placeholders',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
  },
  create(context) {
    if (!isSpecFile(context.filename)) return {};
    return {
      CallExpression(node) {
        const block = classify(node, context.sourceCode);
        if (!block || !['it', 'context'].includes(block.level)) return;
        // A skipped test without implementation records a not-yet-automated requirement.
        if (block.level === 'it' && (block.modifier === 'skip' || block.modifier === 'fixme')) return;
        // Empty contexts titled 'STATE:' are phase separators in long scenarios.
        if (block.level === 'context' && getNodeTitle(node)?.startsWith('STATE:')) return;

        const callback = callbackOf(node);
        if (!callback) {
          context.report({ node, message: 'Test or context block without a body is not allowed.' });
        } else if (isEmptyBody(callback)) {
          context.report({ node, message: 'Empty test or context block is not allowed.' });
        }
      },
    };
  },
};
