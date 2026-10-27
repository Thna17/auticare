#!/usr/bin/env node
/**
 * Fails if web code writes a colour directly instead of using a design token.
 *
 * Every colour lives in apps/web/src/app/design-system/styles/tokens.scss. The
 * brand is one teal scale there (--ac-brand-50 … --ac-brand-950, main colour
 * --ac-brand-500); every other brand-like token is an alias of it. Components
 * use var(--ac-…) only. For a see-through shade, mix a token:
 *
 *   color-mix(in srgb, var(--ac-brand-500) 20%, transparent)
 *
 * Caught: hex (#348c83), rgb()/rgba(), hsl()/hsla(), and the keywords white and
 * black used as a CSS value. tokens.scss is exempt — it is where colours are defined.
 */
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';

const PATTERNS = [
  { name: 'hex', re: /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g },
  { name: 'rgb/hsl', re: /\b(?:rgba?|hsla?)\(\s*[\d.]/g },
  { name: 'keyword', re: /(?:^|[\s;{])(?:color|background(?:-color)?|border(?:-color)?|fill|stroke)\s*:\s*(?:white|black)\b/g },
];
const EXEMPT = /design-system[\\/]styles[\\/]tokens\.scss$/;
// Hex in a URL fragment or an HTML entity is not a colour.
const NOT_COLOUR = /href="#|&#x?[0-9a-fA-F]+;/;

const files = [
  ...globSync('apps/web/src/app/**/*.ts'),
  ...globSync('apps/web/src/**/*.scss'),
].filter((f) => !EXEMPT.test(f) && !/\.spec\.ts$/.test(f));
const offences = [];

for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, index) => {
    if (NOT_COLOUR.test(line)) return;
    for (const { name, re } of PATTERNS) {
      for (const match of line.matchAll(re)) {
        offences.push({ file, line: index + 1, value: match[0].trim(), name });
      }
    }
  });
}

if (offences.length > 0) {
  console.error('\nRaw colours found. Use a token from tokens.scss instead:\n');
  for (const o of offences) {
    console.error(`  ${o.file}:${o.line}  ${o.value}  (${o.name})`);
  }
  console.error(
    `\n${offences.length} offence(s). Use var(--ac-…) from` +
      ' apps/web/src/app/design-system/styles/tokens.scss, or add a token there if the' +
      ' colour is genuinely new.\n',
  );
  process.exit(1);
}

console.log(`No raw colours in ${files.length} web files.`);
