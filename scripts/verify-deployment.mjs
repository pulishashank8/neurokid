#!/usr/bin/env node
/**
 * Deployment verification script.
 * Runs lint, TypeScript check, and build. Exits 0 only when all pass.
 * Use before deploying to confirm zero errors and production readiness.
 *
 * Usage: node scripts/verify-deployment.mjs
 *   Or:  npm run verify-deployment
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const results = { lint: false, tsc: false, build: false };
let lintErrors = 0;

function run(name, cmd, opts = {}) {
  try {
    const out = execSync(cmd, {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
      ...opts,
    });
    return { ok: true, out };
  } catch (e) {
    return { ok: false, out: (e.stdout || '') + (e.stderr || '') };
  }
}

console.log('\n=== Deployment verification ===\n');

// 1) Lint
const lint = run('lint', 'npm run lint 2>&1');
if (lint.ok) {
  results.lint = true;
  console.log('  Lint: PASS (0 errors)');
} else {
  const match = lint.out.match(/(\d+)\s+errors?/);
  lintErrors = match ? parseInt(match[1], 10) : 1;
  console.log('  Lint: FAIL (' + (lintErrors || '') + ' errors)');
  if (lint.out.includes('error')) {
    const lines = lint.out.split('\n').filter((l) => l.includes(' error '));
    lines.slice(0, 5).forEach((l) => console.log('    ' + l.trim()));
  }
}

// 2) TypeScript
const tsc = run('tsc', 'npx tsc --noEmit 2>&1');
if (tsc.ok) {
  results.tsc = true;
  console.log('  TypeScript: PASS');
} else {
  console.log('  TypeScript: FAIL');
  (tsc.out || '').split('\n').filter(Boolean).slice(0, 6).forEach((l) => console.log('    ' + l));
}

// 3) Build
console.log('  Build: running (this may take a minute)...');
const build = run('build', 'npm run build 2>&1', { timeout: 180000 });
if (build.ok && build.out.includes('Compiled successfully')) {
  results.build = true;
  console.log('  Build: PASS');
} else {
  console.log('  Build: FAIL');
  if (!build.ok && build.out) {
    const lines = build.out.split('\n').filter((l) => /error|Error|FAIL/i.test(l));
    lines.slice(0, 8).forEach((l) => console.log('    ' + l.trim()));
  }
}

const allPass = results.lint && results.tsc && results.build;

console.log('\n--- Result ---');
if (allPass) {
  console.log('  READY FOR DEPLOYMENT (zero errors: lint, TypeScript, build).');
  console.log('  Run tests with: npm run test\n');
  process.exit(0);
} else {
  console.log('  NOT READY FOR DEPLOYMENT. Fix the failures above.\n');
  process.exit(1);
}
