/**
 * Shared Groq API client for scripts.
 * Same formula as app: key rotation + retry on 429.
 * Supports GROQ_API_KEYS (comma-separated) or GROQ_API_KEY.
 */

const https = require('https');

function getKeys() {
  const multi = process.env.GROQ_API_KEYS?.trim();
  if (multi) {
    return multi.split(',').map(k => k.trim()).filter(k => k && k !== 'mock-key');
  }
  const single = process.env.GROQ_API_KEY?.trim();
  if (single && single !== 'mock-key') return [single];
  return [];
}

let roundRobinIndex = 0;

function getNextKey() {
  const keys = getKeys();
  if (keys.length === 0) return null;
  const key = keys[roundRobinIndex % keys.length];
  roundRobinIndex += 1;
  return key;
}

/**
 * Call Groq chat completions with key rotation + retry on 429.
 * postData: object with model, messages, temperature, max_tokens
 * Returns Promise<{ choices: [{ message: { content } }] }>
 */
async function callGroqChat(postData) {
  const keys = getKeys();
  if (keys.length === 0) {
    throw new Error('GROQ_API_KEY or GROQ_API_KEYS not configured');
  }

  function doRequest(apiKey) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(postData);
      const req = https.request(
        {
          hostname: 'api.groq.com',
          path: '/openai/v1/chat/completions',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            'Content-Length': Buffer.byteLength(data),
          },
        },
        (res) => {
          let body = '';
          res.on('data', chunk => (body += chunk));
          res.on('end', () => {
            if (res.statusCode === 200) {
              try {
                resolve(JSON.parse(body));
              } catch (e) {
                reject(new Error('Failed to parse response'));
              }
            } else if (res.statusCode === 429 && keys.length > 1) {
              reject({ rateLimited: true });
            } else {
              reject(new Error(`API error (${res.statusCode}): ${body}`));
            }
          });
        }
      );
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  let lastError;
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const apiKey = getNextKey();
    if (!apiKey) break;
    try {
      return await doRequest(apiKey);
    } catch (err) {
      lastError = err;
      if (err.rateLimited) continue;
      throw err;
    }
  }
  throw lastError || new Error('No Groq keys available');
}

module.exports = { callGroqChat, getKeys };
