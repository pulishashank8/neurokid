#!/usr/bin/env node
/**
 * Comprehensive smoke tests for NeuroKind API
 * Usage: node scripts/test-smoke.mjs
 */

const BASE_URL = 'http://localhost:3000';

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('🧪 NeuroKind API Smoke Tests\n');
  console.log('=' .repeat(50));
  
  for (const { name, fn } of tests) {
    process.stdout.write(`${name}... `);
    try {
      await fn();
      console.log('✅');
      passed++;
    } catch (error) {
      console.log('❌');
      console.error(`   Error: ${error.message}`);
      failed++;
    }
  }
  
  console.log('=' .repeat(50));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

// ==============================================================
// TESTS
// ==============================================================

test('GET /api/health', async () => {
  const res = await fetch(`${BASE_URL}/api/health`);
  const data = await res.json();
  if (!res.ok || data.status !== 'ok') {
    throw new Error(`Health check failed: ${JSON.stringify(data)}`);
  }
});

test('GET /api/categories', async () => {
  const res = await fetch(`${BASE_URL}/api/categories`);
  const data = await res.json();
  if (!res.ok || !Array.isArray(data.categories)) {
    throw new Error('Categories endpoint failed');
  }
  if (data.categories.length === 0) {
    throw new Error('No categories found - database may not be seeded');
  }
});

test('GET /api/tags', async () => {
  const res = await fetch(`${BASE_URL}/api/tags`);
  const data = await res.json();
  if (!res.ok || !Array.isArray(data.tags)) {
    throw new Error('Tags endpoint failed');
  }
});

test('GET /api/posts', async () => {
  const res = await fetch(`${BASE_URL}/api/posts?limit=5`);
  const data = await res.json();
  if (!res.ok || !Array.isArray(data.posts)) {
    throw new Error('Posts endpoint failed');
  }
});

test('GET /api/posts?sort=new', async () => {
  const res = await fetch(`${BASE_URL}/api/posts?limit=5&sort=new`);
  if (!res.ok) {
    throw new Error('Posts sorting failed');
  }
});

test('GET /api/posts?sort=top', async () => {
  const res = await fetch(`${BASE_URL}/api/posts?limit=5&sort=top`);
  if (!res.ok) {
    throw new Error('Posts sorting failed');
  }
});

test('GET /api/posts?sort=hot', async () => {
  const res = await fetch(`${BASE_URL}/api/posts?limit=5&sort=hot`);
  if (!res.ok) {
    throw new Error('Posts sorting failed');
  }
});

test('POST /api/posts (unauthorized)', async () => {
  const res = await fetch(`${BASE_URL}/api/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Test Post',
      content: 'Test content',
      categoryId: 'test-id',
    }),
  });
  
  // Should return 401 without auth
  if (res.status !== 401) {
    throw new Error(`Expected 401, got ${res.status}`);
  }
});

test('POST /api/posts (validation)', async () => {
  const res = await fetch(`${BASE_URL}/api/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'ab', // Too short
      content: 'short', // Too short
    }),
  });
  
  const data = await res.json();
  
  // Should return 400 or 401
  if (res.status === 401) {
    // OK - not authenticated
    return;
  }
  
  if (res.status !== 400) {
    throw new Error(`Expected 400, got ${res.status}`);
  }
  
  if (!data.fieldErrors && !data.details) {
    throw new Error('Expected validation errors');
  }
});

test('GET /api/auth/session', async () => {
  const res = await fetch(`${BASE_URL}/api/auth/session`);
  if (!res.ok) {
    throw new Error('Session endpoint failed');
  }
});

test('GET /api/auth/csrf', async () => {
  const res = await fetch(`${BASE_URL}/api/auth/csrf`);
  if (!res.ok) {
    throw new Error('CSRF endpoint failed');
  }
});

runTests();
