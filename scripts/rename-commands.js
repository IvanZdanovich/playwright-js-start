const fs = require('fs');
const path = require('path');

// Mapping of old command names to new command names (fill in, run `node scripts/rename-commands.js`, then clear)
const commandMappings = {
  actualCommandName: 'expectedCommandName',
};

// Function to escape special regex characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Commands are exported functions, so a rename is an identifier rename: the export, every import specifier,
// and every call site. Word boundaries keep `loginPage__logIn` from matching inside `loginPage__logInAsAdmin`.
function replaceCommandInContent(content, oldName, newName) {
  return content.replace(new RegExp(`\\b${escapeRegExp(oldName)}\\b`, 'g'), newName);
}

// Pure: apply every mapping to the content and report which ones changed it
function applyMappings(content, mappings) {
  const changes = [];
  let updated = content;

  for (const [oldName, newName] of Object.entries(mappings)) {
    const next = replaceCommandInContent(updated, oldName, newName);
    if (next !== updated) {
      changes.push(`${oldName} → ${newName}`);
      updated = next;
    }
  }

  return { content: updated, changes };
}

// Function to process a single file
function processFile(filePath) {
  const relativePath = filePath.replace(path.join(__dirname, '..'), '');
  const { content, changes } = applyMappings(fs.readFileSync(filePath, 'utf8'), commandMappings);

  if (changes.length > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ${relativePath}`);
    for (const change of changes) console.log(`  ${change}`);
  }
}

// Function to recursively find all .js files in a directory
function getAllFiles(dirPath) {
  return fs
    .readdirSync(dirPath, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
    .map((entry) => path.join(entry.parentPath, entry.name));
}

// Main execution
const playwrightDir = path.join(__dirname, '..', 'playwright');
console.log('Renaming commands to follow naming convention...\n');

// Get all relevant files
const allFiles = getAllFiles(playwrightDir);
console.log(`Processing ${allFiles.length} files...\n`);

// Process each file
for (const file of allFiles) processFile(file);

console.log('\nCommand renaming complete!');
console.log('\nTransformations applied.');
