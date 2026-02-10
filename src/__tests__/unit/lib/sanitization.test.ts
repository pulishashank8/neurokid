import { describe, it, expect, vi } from 'vitest';

// Use real implementation for this unit test file
vi.unmock('@/lib/sanitization');

import {
  sanitizationService,
  sanitizeHtml,
  sanitizeText,
  sanitizeContent,
  sanitizeTitle,
  validateContent,
} from '@/lib/sanitization';

describe('Sanitization Utilities', () => {
  describe('sanitizeHtml', () => {
    it('should allow safe HTML tags', () => {
      const input = '<p>Hello <strong>world</strong></p>';
      const result = sanitizeHtml(input);
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
    });

    it('should remove script tags', () => {
      const input = '<p>Hello</p><script>alert("xss")</script>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });

    it('should remove event handlers', () => {
      const input = '<p onclick="alert(\'xss\')">Click me</p>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('onclick');
    });

    it('should handle null/undefined', () => {
      expect(sanitizeHtml(null)).toBe('');
      expect(sanitizeHtml(undefined)).toBe('');
    });

    it('should add rel attributes to links', () => {
      const input = '<a href="https://example.com">Link</a>';
      const result = sanitizeHtml(input);
      expect(result).toContain('rel="noopener noreferrer"');
    });

    it('should strip all tags when stripTags option is set', () => {
      const input = '<p>Hello <strong>world</strong></p>';
      const result = sanitizeHtml(input, { stripTags: true });
      expect(result).toBe('Hello world');
      expect(result).not.toContain('<');
    });

    it('should allow custom tags when specified', () => {
      const input = '<div><p>Hello</p></div>';
      const result = sanitizeHtml(input, { allowedTags: ['p'] });
      expect(result).toContain('<p>');
      expect(result).not.toContain('<div>');
    });
  });

  describe('sanitizeText', () => {
    it('should remove all HTML tags', () => {
      const input = '<p>Hello <strong>world</strong></p>';
      const result = sanitizeText(input);
      expect(result).toBe('Hello world');
    });

    it('should handle script tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeText(input);
      expect(result).toBe('Hello');
    });

    it('should handle empty input', () => {
      expect(sanitizeText('')).toBe('');
      expect(sanitizeText(null)).toBe('');
      expect(sanitizeText(undefined)).toBe('');
    });
  });

  describe('sanitizeContent', () => {
    it('should allow rich text formatting', () => {
      const input = '<p>Hello <em>world</em></p><ul><li>Item 1</li></ul>';
      const result = sanitizeContent(input);
      expect(result).toContain('<p>');
      expect(result).toContain('<em>');
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>');
    });

    it('should remove dangerous content', () => {
      const input = '<p>Hello</p><script>alert("xss")</script>';
      const result = sanitizeContent(input);
      expect(result).not.toContain('<script>');
    });

    it('should truncate content exceeding max length', () => {
      const input = 'a'.repeat(60000);
      const result = sanitizeContent(input);
      expect(result.length).toBeLessThanOrEqual(50000);
    });

    it('should handle empty input', () => {
      expect(sanitizeContent('')).toBe('');
      expect(sanitizeContent(null)).toBe('');
      expect(sanitizeContent(undefined)).toBe('');
    });
  });

  describe('sanitizeTitle', () => {
    it('should remove HTML tags', () => {
      const input = '<strong>Bold Title</strong>';
      const result = sanitizeTitle(input);
      expect(result).toBe('Bold Title');
    });

    it('should trim whitespace', () => {
      const input = '  Title with spaces  ';
      const result = sanitizeTitle(input);
      expect(result).toBe('Title with spaces');
    });

    it('should limit to 255 characters', () => {
      const input = 'a'.repeat(300);
      const result = sanitizeTitle(input);
      expect(result.length).toBe(255);
    });

    it('should handle empty input', () => {
      expect(sanitizeTitle('')).toBe('');
      expect(sanitizeTitle(null)).toBe('');
      expect(sanitizeTitle(undefined)).toBe('');
    });
  });

  describe('validateContent', () => {
    it('should validate safe content', () => {
      const result = validateContent('This is safe content');
      expect(result.valid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should reject content with too many links', () => {
      const input = Array(12).fill('https://example.com').join(' ');
      const result = validateContent(input);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Too many links');
    });

    it('should reject content with script tags', () => {
      const result = validateContent('<script>alert("xss")</script>');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Script tags');
    });

    it('should reject content with event handlers', () => {
      const result = validateContent('<p onclick="evil()">Click</p>');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Event handlers');
    });

    it('should reject content with data URLs', () => {
      const result = validateContent('<a href="data:text/html,base64...">Link</a>');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Data URLs');
    });

    it('should handle null/undefined', () => {
      expect(validateContent(null).valid).toBe(true);
      expect(validateContent(undefined).valid).toBe(true);
    });
  });

  describe('SanitizationService', () => {
    describe('sanitizeAndValidate', () => {
      it('should return sanitized and valid content', () => {
        const input = '<p>Safe content</p>';
        const result = sanitizationService.sanitizeAndValidate(input);
        expect(result.sanitized).toContain('<p>');
        expect(result.valid).toBe(true);
      });

      it('should detect too many links after sanitization', () => {
        const input = Array(12).fill('<a href="http://example.com">link</a>').join(' ');
        const result = sanitizationService.sanitizeAndValidate(input, { maxLinks: 10 });
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('Too many links');
      });

      it('should respect custom maxLinks', () => {
        const input = Array(6).fill('<a href="http://example.com">link</a>').join(' ');
        const result = sanitizationService.sanitizeAndValidate(input, { maxLinks: 5 });
        expect(result.valid).toBe(false);
      });
    });

    it('should be a singleton', () => {
      const instance1 = sanitizationService;
      const instance2 = sanitizationService;
      expect(instance1).toBe(instance2);
    });
  });
});
