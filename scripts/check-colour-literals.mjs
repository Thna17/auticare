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

const GRANDFATHERED = new Set([
  '#059669',
  '#065f46',
  '#06b6d4',
  '#0b6b3a',
  '#0f2c3b',
  '#115e59',
  '#15803d',
  '#166534',
  '#194b61',
  '#1c3644',
  '#1d4ed8',
  '#1e40af',
  '#1e4a5a',
  '#1f3d22',
  '#24404e',
  '#245764',
  '#334e5c',
  '#34434a',
  '#47758b',
  '#4ba3b8',
  '#4c575c',
  '#4d5f3d',
  '#4f412d',
  '#586369',
  '#586947',
  '#63899b',
  '#68737a',
  '#6a747b',
  '#6a7486',
  '#6b4a12',
  '#6b8494',
  '#6e2e26',
  '#707b84',
  '#759bad',
  '#7b8fa0',
  '#7d1f1f',
  '#7ea563',
  '#8a5a00',
  '#8a6414',
  '#8b3d3d',
  '#8b5cf6',
  '#8da0aa',
  '#991b1b',
  '#9a6a00',
  '#9bc6d8',
  '#9cc5d6',
  '#9ec9d8',
  '#a4691a',
  '#a8bcc7',
  '#a8d5e2',
  '#b04343',
  '#b6dceb',
  '#b7cbd4',
  '#b7d8bd',
  '#b9d6e5',
  '#bfe3cd',
  '#c0e8fe',
  '#c3ccce',
  '#c5e7fb',
  '#c64c4c',
  '#c8e1ed',
  '#c9d0d5',
  '#c9e5f1',
  '#d5eaf3',
  '#d6e0e2',
  '#d97706',
  '#dbe5e8',
  '#dc2626',
  '#dceaf0',
  '#dcfce7',
  '#e2efe3',
  '#e2f3ff',
  '#e3edf2',
  '#e5f6ff',
  '#e6eef3',
  '#e6f4f2',
  '#e7f3f7',
  '#e8eff4',
  '#e8f7ee',
  '#ec4899',
  '#edf1f5',
  '#eef1f0',
  '#eef1f2',
  '#eef2f6',
  '#eef3f6',
  '#eef3f7',
  '#eefaff',
  '#f0f7fa',
  '#f0f9ff',
  '#f0fdf4',
  '#f2f9ff',
  '#f3d9d5',
  '#f4fbfd',
  '#f6e6c8',
  '#f6ecd4',
  '#fbe9e9',
  '#fbeaea',
  '#fbfdfe',
  '#fdf3e2',
  '#fecaca',
  '#fee2e2',
  '#fef3c7',
  '#ffebee',
  '#fff4e5',
]);

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
