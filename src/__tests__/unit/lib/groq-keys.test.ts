import { describe, it, expect } from 'vitest';
import {
  getNextGroqKey,
  hasGroqKeys,
  getGroqKeyCount,
  callGroqChat,
} from '@/lib/ai/groq-keys';

describe('groq-keys', () => {
  describe('getNextGroqKey', () => {
    it('returns a key or null depending on env config', () => {
      const key = getNextGroqKey();
      expect(key === null || typeof key === 'string').toBe(true);
      if (key) expect(key.length).toBeGreaterThan(0);
    });
  });

  describe('hasGroqKeys', () => {
    it('returns a boolean', () => {
      expect(typeof hasGroqKeys()).toBe('boolean');
    });
  });

  describe('getGroqKeyCount', () => {
    it('returns a non-negative number', () => {
      const count = getGroqKeyCount();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('callGroqChat', () => {
    it('throws when no keys configured', async () => {
      if (!hasGroqKeys()) {
        await expect(
          callGroqChat({ messages: [{ role: 'user', content: 'hi' }] })
        ).rejects.toThrow(/not configured/);
      }
    });
  });
});
