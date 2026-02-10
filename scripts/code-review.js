#!/usr/bin/env node

/**
 * 🐢 Simple Code Reviewer
 * Reviews your code changes before deployment
 * Uses Groq API (free & fast)
 */

const { execSync } = require('child_process');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Load .env file
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
};

// Check if Groq API key is set
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  log.error('GROQ_API_KEY not found in environment variables');
  log.info('Please add your Groq API key to .env file');
  log.info('Get a free API key from: https://console.groq.com/keys');
  process.exit(1);
}

// Get git diff
function getGitChanges() {
  log.info('Analyzing your code changes...');

  let staged = '';
  let unstaged = '';
  let untracked = '';

  try {
    // Get staged changes
    try {
      staged = execSync('git diff --cached', { encoding: 'utf-8' });
    } catch (e) {
      staged = '';
    }

    // Get unstaged changes
    try {
      unstaged = execSync('git diff', { encoding: 'utf-8' });
    } catch (e) {
      unstaged = '';
    }

    // Get untracked files
    try {
      const untrackedFiles = execSync('git ls-files --others --exclude-standard', { encoding: 'utf-8' }).trim();
      if (untrackedFiles) {
        untracked = `\n\nNew untracked files:\n${untrackedFiles}`;
      }
    } catch (e) {
      untracked = '';
    }

    let allChanges = (staged + '\n' + unstaged).trim();

    if (!allChanges) {
      log.warning('No changes detected. Make some changes first!');
      log.info('Or use: npm run review -- --all  (to review all code)');
      process.exit(0);
    }

    // Clean up the diff (remove problematic characters)
    allChanges = allChanges
      .replace(/\r\n/g, '\n')  // Normalize line endings
      .replace(/\0/g, '')       // Remove null bytes
      .trim();

    // Limit diff size to avoid API limits (max 50KB for safety)
    const maxSize = 50000;
    if (allChanges.length > maxSize) {
      log.warning(`Changes are large (${Math.round(allChanges.length / 1024)}KB). Truncating to ${Math.round(maxSize / 1024)}KB...`);
      return allChanges.substring(0, maxSize) + '\n\n... [truncated for review]';
    }

    return allChanges + untracked;
  } catch (error) {
    log.error(`Error: ${error.message}`);
    log.error('Make sure git is installed and you\'re in a git repository');
    process.exit(1);
  }
}

// Call Groq API for code review
async function reviewCode(diff) {
  log.info('🤖 AI is reviewing your code...\n');

  const prompt = `You are a senior software engineer reviewing code for deployment. Analyze this git diff and provide:

1. 🐛 **Critical Issues** (bugs, security vulnerabilities, breaking changes)
2. ⚠️  **Warnings** (performance issues, bad practices, potential bugs)
3. 💡 **Suggestions** (improvements, best practices)
4. ✅ **Ready for Deployment?** (Yes/No with brief reason)

Be concise but thorough. Focus on issues that could break production.

GIT DIFF:
\`\`\`diff
${diff}
\`\`\``;

  return new Promise((resolve, reject) => {
    let data;
    try {
      data = JSON.stringify({
        model: 'llama-3.3-70b-versatile', // Fast and smart model
        messages: [
          {
            role: 'system',
            content: 'You are an expert code reviewer. Provide clear, actionable feedback.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });
    } catch (error) {
      reject(new Error('Failed to create JSON request: ' + error.message));
      return;
    }

    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Length': data.length,
      },
    };

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(body);
            resolve(response.choices[0].message.content);
          } catch (error) {
            reject(new Error('Failed to parse API response'));
          }
        } else {
          reject(new Error(`API error (${res.statusCode}): ${body}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Main function
async function main() {
  log.title('🐢 Code Review - Pre-Deployment Check');

  try {
    // Get changes
    const diff = getGitChanges();

    log.success(`Found ${Math.round(diff.length / 1024)}KB of changes`);

    // Review code
    const review = await reviewCode(diff);

    // Display review
    log.title('📋 Code Review Results');
    console.log(review);
    console.log('\n' + '='.repeat(80) + '\n');

    // Check if ready for deployment
    const readyForDeploy = review.toLowerCase().includes('ready for deployment?')
      && (review.toLowerCase().includes('yes') || review.toLowerCase().includes('✅'));

    if (readyForDeploy) {
      log.success('Code looks good! Ready to deploy 🚀');
      process.exit(0);
    } else {
      log.warning('Review the issues above before deploying');
      log.info('Fix issues and run: npm run review');
      process.exit(1);
    }

  } catch (error) {
    log.error(`Review failed: ${error.message}`);
    process.exit(1);
  }
}

// Run
main();
