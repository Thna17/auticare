#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

console.log('Validating OpenAPI contract drift against Express routes...');

const result = spawnSync(
  'pnpm',
  [
    '--filter',
    '@auticare/api',
    'exec',
    'dotenv',
    '-e',
    '../../.env',
    '--',
    'vitest',
    'run',
    'src/tests/integration/openapi-drift.test.ts',
  ],
  { stdio: 'inherit' },
);

if (result.status !== 0) {
  console.error(
    '\n❌ OpenAPI drift validation failed. Ensure all Express endpoints are documented in openapi.ts.',
  );
  process.exit(1);
}

console.log('\n✅ OpenAPI documentation is in full sync with application endpoints.');
process.exit(0);
