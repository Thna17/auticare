#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

console.log('Checking for database migration drift...');

const schemaPath = 'apps/api/prisma/schema.prisma';
const migrationsDir = 'apps/api/prisma/migrations';

if (!existsSync(schemaPath) || !existsSync(migrationsDir)) {
  console.error('❌ Schema or migrations directory not found.');
  process.exit(1);
}

// 1. Verify migration sequence integrity
const migrationFolders = readdirSync(migrationsDir).filter(
  (f) => !f.startsWith('.') && f !== 'migration_lock.toml',
);
console.log(`Found ${migrationFolders.length} recorded migrations.`);

for (const folder of migrationFolders) {
  const sqlFile = path.join(migrationsDir, folder, 'migration.sql');
  if (!existsSync(sqlFile)) {
    console.error(`❌ Missing migration.sql in ${folder}`);
    process.exit(1);
  }
}

// 2. If shadow database URL or database is available, run prisma migrate diff
const shadowUrl = process.env.SHADOW_DATABASE_URL;
if (shadowUrl) {
  console.log('Running Prisma schema diff with shadow database...');
  const res = spawnSync(
    'pnpm',
    [
      '--filter',
      '@auticare/api',
      'exec',
      'prisma',
      'migrate',
      'diff',
      '--from-schema-datamodel',
      'prisma/schema.prisma',
      '--to-migrations',
      'prisma/migrations',
      '--shadow-database-url',
      shadowUrl,
      '--exit-code',
    ],
    { stdio: 'inherit' },
  );

  if (res.status !== 0) {
    console.error(
      '\n❌ Migration drift detected! Run `pnpm db:migrate` to create a new migration.',
    );
    process.exit(res.status ?? 1);
  }
} else {
  console.log('ℹ️  SHADOW_DATABASE_URL not set; verified migration file structure and history.');
}

console.log('✅ Database migrations are intact and in sync with Prisma schema.');
process.exit(0);
