#!/usr/bin/env node
// One-way sync: pulls the current state of
// services/ui-app/packages/uar-e2e from a local andromedasec/voyager
// checkout into this repo. voyager is the source of truth — this never
// pushes back. Never touches .git/ or .claude/ (this repo's own skill).

import { cpSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const voyagerRoot = process.argv[2] || process.env.VOYAGER_REPO_PATH;
if (!voyagerRoot) {
  console.error('Usage: node scripts/sync-from-voyager.mjs <path-to-local-voyager-checkout>');
  console.error('   or: VOYAGER_REPO_PATH=<path> node scripts/sync-from-voyager.mjs');
  process.exit(1);
}

const srcDir = resolve(voyagerRoot, 'services/ui-app/packages/uar-e2e');
if (!existsSync(srcDir)) {
  console.error(`Not found: ${srcDir} — is this really a voyager checkout?`);
  process.exit(1);
}

const destDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const EXCLUDE = new Set([
  'node_modules',
  '.playwright',
  '.milkyway-auth-profile',
  '.testenv-auth-profile',
  '.env',
  '.git',
  '.claude',
]);

cpSync(srcDir, destDir, {
  recursive: true,
  filter: (src) => {
    const base = src.split(/[\\/]/).pop() ?? '';
    if (EXCLUDE.has(base)) return false;
    if (base.endsWith('.scratch-run.log')) return false;
    if (base.startsWith('.scratch')) return false;
    return true;
  },
});

console.log('Synced from', srcDir);
console.log('Review the result: git status / git diff — then commit if it looks right.');
