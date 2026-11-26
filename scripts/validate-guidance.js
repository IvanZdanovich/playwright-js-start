#!/usr/bin/env node
/**
 * validate-guidance.js — `npm run validate`
 *
 * Fails when guidance or docs cite something the repository does not have. In the Cypress source these drifted
 * silently: rules named globals and commands from another project, docs named npm scripts that never existed.
 *
 * Checks every Markdown file in `.claude/`, `docs/`, plus `README.md` and `CLAUDE.md`:
 *   PATHS     — a backticked repo path (`playwright/support/l10n.js`) exists. Tokens with placeholders
 *               (`<name>`, `*`, `{a,b}`, `[x]`, `...`) are patterns, not paths, and are skipped.
 *   SCRIPTS   — every `npm run <name>` names a script in package.json.
 *   COMMANDS  — every backticked double-underscore identifier (a command such as loginPage__logIn, or an examples
 *               export) outside fenced examples is exported somewhere under `playwright/`. Fenced code blocks may
 *               show illustrative names.
 *   RULE_GLOBS — every `paths:` glob in `.claude/rules/*.md` frontmatter matches at least one file, so no rule
 *               is scoped to files that do not exist.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TOP_LEVEL = new Set(fs.readdirSync(ROOT).filter((name) => !name.startsWith('.') || name === '.claude' || name === '.github'));
const PLACEHOLDER = /[<>*{}[\]]|\.\.\./;
// Locations created on demand (by an authoring skill) or by a run (reports); they may not exist yet.
const CREATED_ON_DEMAND = ['.claude/agents/', 'reports/', 'test-results/'];

const glob = (pattern) => fs.globSync(pattern, { cwd: ROOT, exclude: (name) => name === 'node_modules' || name === '.git' });

function markdownFiles() {
  return [...glob('.claude/**/*.md'), ...glob('docs/**/*.md'), 'README.md', 'CLAUDE.md'].filter((file) => fs.existsSync(path.join(ROOT, file)));
}

function stripFences(text) {
  return text.replace(/```[\s\S]*?```/g, (block) => block.replace(/[^\n]/g, ' '));
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

function exportedCommands() {
  const names = new Set();
  for (const file of glob('playwright/**/*.js')) {
    for (const match of fs.readFileSync(path.join(ROOT, file), 'utf8').matchAll(/export\s+(?:async\s+)?(?:function|const)\s+(\w+)/g)) names.add(match[1]);
  }
  return names;
}

// Rule ids such as `custom/x` or `playwright/y` look like paths. The plugins are optional: a project scaffolded
// without the ESLint module still runs this check.
function lintRuleIds() {
  const ids = new Set();
  const load = (name) => {
    try {
      return require(name);
    } catch {
      return null;
    }
  };
  for (const rule of Object.keys(load('../eslint-plugin-custom-rules')?.rules || {})) ids.add(`custom/${rule}`);
  for (const rule of Object.keys(load('eslint-plugin-playwright')?.rules || {})) ids.add(`playwright/${rule}`);
  return ids;
}
const LINT_RULE_IDS = lintRuleIds();

function looksLikeRepoPath(token) {
  if (PLACEHOLDER.test(token) || /\s/.test(token) || token.startsWith('http') || LINT_RULE_IDS.has(token)) return false;
  if (CREATED_ON_DEMAND.some((dir) => token.startsWith(dir))) return false;
  const first = token.replace(/^\.\//, '').split('/')[0];
  if (!token.includes('/')) return TOP_LEVEL.has(first) && /\.\w+$/.test(first);
  return TOP_LEVEL.has(first);
}

function frontmatterGlobs(text) {
  const frontmatter = text.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatter) return [];
  return [...frontmatter[1].matchAll(/^\s*-\s*'([^']+)'/gm)].map((match) => match[1]);
}

function main() {
  const scripts = new Set(Object.keys(JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).scripts || {}));
  const commands = exportedCommands();
  const problems = [];

  for (const file of markdownFiles()) {
    const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const prose = stripFences(text);
    const report = (index, message) => problems.push(`${file}:${lineOf(text, index)}  ${message}`);

    for (const match of text.matchAll(/npm run ([\w:-]+)/g)) {
      if (!scripts.has(match[1])) report(match.index, `npm script "${match[1]}" is not defined in package.json`);
    }
    for (const match of prose.matchAll(/`([^`\n]+)`/g)) {
      const token = match[1].trim().replace(/:\d+(:\d+)?$/, '');
      if (looksLikeRepoPath(token) && !fs.existsSync(path.join(ROOT, token))) report(match.index, `path "${token}" does not exist`);
      if (PLACEHOLDER.test(token)) continue;
      for (const ident of token.matchAll(/\b([a-z][a-zA-Z0-9]*__[a-zA-Z0-9]+(?:__[A-Z]+)?)\b/g)) {
        if (!commands.has(ident[1])) report(match.index, `command "${ident[1]}" is not exported from any file under playwright/`);
      }
    }
    if (file.startsWith('.claude/rules/')) {
      for (const pattern of frontmatterGlobs(text)) {
        if (glob(pattern).length === 0 && !CREATED_ON_DEMAND.some((dir) => pattern.startsWith(dir))) report(0, `paths glob '${pattern}' matches no file`);
      }
    }
  }

  if (problems.length > 0) {
    console.error(`FAIL guidance references ${problems.length} thing(s) the repository does not have:\n`);
    problems.forEach((problem) => console.error(`  ${problem}`));
    process.exit(1);
  }
  console.log(`OK   ${markdownFiles().length} guidance and doc file(s) reference only existing paths, scripts, and commands.`);
}

main();
