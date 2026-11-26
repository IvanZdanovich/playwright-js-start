const { classify, getNodeTitle, isSpecFile } = require('./_test-blocks.js');

const PATTERNS = {
  describe: /^([A-Z][a-zA-Z]+\.){0,5}([A-Z][a-zA-Z]+): Given .{1,200}(?<!\s)$/,
  context: /^([A-Z][a-zA-Z]+\.){1,6}[A-Z]{1,15}: When .{1,200}(?<!\s)$/,
  it: /^([A-Z][a-zA-Z]+\.){1,6}[A-Z]{1,15}: Then .{1,200}(?<!\s)$/,
};

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'verify Given/When/Then titles: top test.describe = Given, nested test.describe = When, test = Then',
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
        const pattern = block && PATTERNS[block.level];
        if (!pattern) return;
        const title = getNodeTitle(node);
        if (!title) return;
        if (block.level === 'context' && title.startsWith('STATE:')) return;
        if (!pattern.test(title)) {
          context.report({ node, message: `Title "${title}" does not follow the pattern. \nPattern: ${pattern}.` });
        }
      },
    };
  },
};
