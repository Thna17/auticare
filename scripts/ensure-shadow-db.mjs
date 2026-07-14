import { spawnSync } from 'node:child_process';

const rootPassword = process.env.MYSQL_ROOT_PASSWORD;

if (!rootPassword) {
  console.error('MYSQL_ROOT_PASSWORD is required. Copy .env.example to .env first.');
  process.exit(1);
}

const sql =
  'CREATE DATABASE IF NOT EXISTS auticare_shadow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;';

const result = spawnSync(
  'docker',
  ['compose', 'exec', '-T', 'mysql', 'mysql', '-uroot', `-p${rootPassword}`, '-e', sql],
  { stdio: 'inherit' },
);

if (result.status !== 0) {
  console.error('Could not create Prisma shadow database. Confirm Docker is running.');
  process.exit(result.status ?? 1);
}
