#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

function findMarkdownFiles(dir) {
  const files = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    if (entry === 'node_modules' || entry === '.git' || entry === 'dist' || entry === '.angular') {
      continue;
    }
    const fullPath = path.join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...findMarkdownFiles(fullPath));
    } else if (entry.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

const mdFiles = [...findMarkdownFiles('docs'), ...findMarkdownFiles('.')].filter(
  (f, index, self) => self.indexOf(f) === index,
);

console.log(`Checking internal links in ${mdFiles.length} Markdown files...`);

const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
const brokenLinks = [];

for (const filePath of mdFiles) {
  const content = readFileSync(filePath, 'utf-8');
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const rawLink = match[2].trim();

    // Skip external http/https, mailto, tel, conversation, and hash-only links
    if (
      rawLink.startsWith('http://') ||
      rawLink.startsWith('https://') ||
      rawLink.startsWith('mailto:') ||
      rawLink.startsWith('tel:') ||
      rawLink.startsWith('conversation://') ||
      rawLink.startsWith('#')
    ) {
      continue;
    }

    // Split target path and fragment anchor
    const [targetPath] = rawLink.split('#');
    if (!targetPath) continue;

    const resolvedPath = path.resolve(path.dirname(filePath), targetPath);
    if (!existsSync(resolvedPath)) {
      brokenLinks.push({
        sourceFile: filePath,
        linkText: match[1],
        target: rawLink,
        resolvedPath,
      });
    }
  }
}

if (brokenLinks.length > 0) {
  console.error('\n❌ Broken links found:');
  for (const b of brokenLinks) {
    console.error(
      `  In ${b.sourceFile}: "[${b.linkText}](${b.target})" -> File not found: ${b.resolvedPath}`,
    );
  }
  process.exit(1);
}

console.log('✅ All internal documentation links are valid.');
process.exit(0);
