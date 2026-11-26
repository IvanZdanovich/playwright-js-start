const { classify, getNodeTitle, isSpecFile } = require('./_test-blocks.js');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'disallow duplicated describe and context (nested test.describe) titles within one spec file',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
  },
  create(context) {
    if (!isSpecFile(context.filename)) return {};
    const titles = new Set();
    return {
      CallExpression(node) {
        const block = classify(node, context.sourceCode);
        if (!block || !['describe', 'context'].includes(block.level)) return;
        const title = getNodeTitle(node);
        if (!title) return;
        if (titles.has(title)) context.report({ node, message: `Duplicate title "${title}" is not allowed.` });
        else titles.add(title);
      },
    };
  },
};
