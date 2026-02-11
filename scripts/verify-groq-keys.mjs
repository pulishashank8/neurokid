#!/usr/bin/env node
/**
 * Verify Groq API keys are loaded and count.
 * Run: node scripts/verify-groq-keys.mjs
 * (Requires dotenv or run from Next.js env context)
 */
import { config } from 'dotenv';
config();

const multi = process.env.GROQ_API_KEYS?.trim();
const single = process.env.GROQ_API_KEY?.trim();

let keys = [];
if (multi) {
  keys = multi.split(',').map(k => k.trim()).filter(k => k && k !== 'mock-key');
} else if (single && single !== 'mock-key') {
  keys = [single];
}

console.log('Groq API keys loaded:', keys.length);
if (keys.length === 0) {
  console.log('No keys found. Set GROQ_API_KEYS=key1,key2,... or GROQ_API_KEY=key1 in .env');
  process.exit(1);
}
if (keys.length >= 2) {
  console.log('Key rotation: when one hits 429/limit, the next key will be tried automatically.');
}
console.log('OK');
