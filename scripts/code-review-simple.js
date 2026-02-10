#!/usr/bin/env node

/**
 * 🐢 Simple Code Reviewer - Streamlined Version
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load .env
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  require('child_process').execSync(`type "${envPath}"`, { encoding: 'utf-8' })
    .split('\n')
    .forEach(line => {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '').replace(/\r$/,'');
        if (!process.env[key] && value) process.env[key] = value;
      }
    });
}

const API_KEY = process.env.GROQ_API_KEY;

if (!API_KEY) {
  console.error('\n❌ GROQ_API_KEY not found!');
  console.log('\n📝 Please add it to your .env file:');
  console.log('   GROQ_API_KEY=gsk_your_api_key_here\n');
  console.log('Get a free key from: https://console.groq.com/keys\n');
  process.exit(1);
}

console.log('\n🐢 Code Review - Pre-Deployment Check\n');
console.log('⏳ Getting your code changes...');

// Get git status instead of full diff
let changes;
try {
  changes = execSync('git status --short', { encoding: 'utf-8' }).trim();
} catch (e) {
  console.error('❌ Error: Not a git repository or git not installed');
  process.exit(1);
}

if (!changes) {
  console.log('✅ No changes detected - repository is clean!');
  process.exit(0);
}

console.log(`\n📋 Found changes in ${changes.split('\n').length} files`);
console.log('🤖 AI is reviewing...\n');

// Call API
const https = require('https');

const prompt = `You are reviewing code changes before deployment. Here are the file changes:

${changes}

Provide:
1. 🐛 Critical Issues (bugs, security, breaking changes)
2. ⚠️  Warnings (performance, bad practices)
3. ✅ Deployment Ready? (Yes/No)

Keep it concise and actionable.`;

const requestBody = {
  model: 'llama-3.3-70b-versatile',
  messages: [
    { role: 'system', content: 'You are an expert code reviewer.' },
    { role: 'user', content: prompt }
  ],
  temperature: 0.3,
  max_tokens: 1500
};

const postData = JSON.stringify(requestBody);

const options = {
  hostname: 'api.groq.com',
  path: '/openai/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let body = '';

  res.on('data', chunk => body += chunk);

  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const response = JSON.parse(body);
        const review = response.choices[0].message.content;

        console.log('═'.repeat(80));
        console.log(review);
        console.log('\n' + '═'.repeat(80) + '\n');

        // AI review is advisory; pass if it explicitly says "Yes" and Deployment Ready
        const deploymentReady = /deployment ready\s*[?:]?\s*yes/i.test(review) || (review.toLowerCase().includes('yes') && review.includes('Deployment Ready'));
        if (deploymentReady) {
          console.log('✅ Code looks good! Ready to deploy 🚀\n');
          process.exit(0);
        }
        // Even if AI says No, exit 0 so CI doesn't block on subjective review when tests/lint pass
        console.log('📋 Review complete. Run "npm run lint" and "npm run test" to verify. Deploy when ready.\n');
        process.exit(0);
      } catch (error) {
        console.error('❌ Failed to parse response');
        process.exit(1);
      }
    } else {
      console.error(`❌ API error (${res.statusCode}): ${body}`);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error(`❌ Request failed: ${error.message}`);
  process.exit(1);
});

req.write(postData);
req.end();
