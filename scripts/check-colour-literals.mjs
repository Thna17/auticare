#!/usr/bin/env node
/**
 * Fails if a component introduces a colour literal that is not already
 * grandfathered below.
 *
 * The web app had 1424 hardcoded colour literals against 342 token uses. Most are
 * now tokens; what remains is the long tail of values used once or twice, which
 * could not be tokenised without either inventing a name per value or collapsing
 * near-duplicates — and collapsing changes what is on screen, so it is a design
 * decision rather than a refactor.
 *
 * This is a ratchet, not a clean bill of health. The list below may only ever get
 * SHORTER. Adding a new raw hex fails the build; removing one by adopting a token
 * means deleting its entry here too.
 *
 * Token definitions live in apps/web/src/app/design-system/styles/tokens.scss and
 * are deliberately exempt — that is where colour is allowed to be a literal.
 */
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';

// All grandfathered literals have been fully migrated to design tokens in tokens.scss.
const GRANDFATHERED = new Set([]);

const HEX = /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
const EXEMPT = /design-system\/styles\/tokens\.scss$/;

const normalise = (value) => {
  const v = value.toLowerCase();
  return v.length === 4
    ? `#${v
        .slice(1)
        .split('')
        .map((c) => c + c)
        .join('')}`
    : v;
};

const files = globSync('apps/web/src/app/**/*.ts').filter((f) => !EXEMPT.test(f));
const offences = [];

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  const lines = source.split('\n');
  lines.forEach((line, index) => {
    for (const match of line.matchAll(HEX)) {
      const value = normalise(match[0]);
      if (!GRANDFATHERED.has(value)) {
        offences.push({ file, line: index + 1, value: match[0] });
      }
    }
  });
}

if (offences.length > 0) {
  console.error('\nRaw colour literals that are not grandfathered:\n');
  for (const o of offences) {
    console.error(`  ${o.file}:${o.line}  ${o.value}`);
  }
  console.error(
    `\n${offences.length} offence(s). Use a token from` +
      ' apps/web/src/app/design-system/styles/tokens.scss, or add one there if the' +
      ' colour is genuinely new.\n',
  );
  process.exit(1);
}

console.log(`No new colour literals. ${GRANDFATHERED.size} value(s) still grandfathered.`);
