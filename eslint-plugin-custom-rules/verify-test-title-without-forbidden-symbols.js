const { classify, getNodeTitle, isSpecFile } = require('./_test-blocks.js');

// Defined at module scope so the regex object is compiled once per ESLint
// process.  The explicit lastIndex reset before each exec-loop makes it safe
// to share the instance across multiple checkTitle() calls.
const INVALID_CHARACTERS_PATTERN = /[!@#$%^&*()+={}[\]|\\;"'<>?/]/g;

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'verify describe and context (nested test.describe) titles do not have trailing whitespace, leading whitespace, or special characters',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [], // no options
  },
  create(context) {
    if (!isSpecFile(context.filename)) return {};
    function checkTitle(node) {
      const title = getNodeTitle(node);
      if (title) {
        if (title.trim() !== title) {
          context.report({
            node,
            message: `Title "${title}" has leading or trailing whitespace.`,
          });
        } else {
          const invalidCharacters = [];
          let match;
          // Explicit reset ensures a shared module-level g-flag regex always
          // starts from position 0, regardless of previous call history.
          INVALID_CHARACTERS_PATTERN.lastIndex = 0;
          while ((match = INVALID_CHARACTERS_PATTERN.exec(title)) !== null) {
            invalidCharacters.push({ char: match[0], index: match.index });
          }
          if (invalidCharacters.length > 0) {
            const invalidCharsString = invalidCharacters.map((ic) => `"${ic.char}" at position ${ic.index}`).join(', ');
            context.report({
              node,
              message: `Title "${title}" contains invalid characters: ${invalidCharsString}.`,
            });
          }
        }
      }
    }

    return {
      CallExpression(node) {
        const block = classify(node, context.sourceCode);
        if (block && (block.level === 'describe' || block.level === 'context')) checkTitle(node);
      },
    };
  },
};
