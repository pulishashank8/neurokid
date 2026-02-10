/**
 * Centralized Sanitization Service
 * 
 * Provides XSS protection and HTML sanitization using DOMPurify.
 * All user input should be sanitized before storage or display.
 */

import DOMPurify from "isomorphic-dompurify";
import { createLogger } from "@/lib/logger";

const logger = createLogger({ context: "sanitization" });

export interface SanitizeOptions {
  /** Allow specific HTML tags (default: none) */
  allowedTags?: string[];
  /** Allow specific HTML attributes (default: none) */
  allowedAttributes?: string[];
  /** Strip all HTML tags (default: false) */
  stripTags?: boolean;
  /** Add rel="noopener noreferrer" to links (default: true) */
  safeLinks?: boolean;
}

const DEFAULT_ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "a",
  "blockquote",
  "code",
  "pre",
];

const DEFAULT_ALLOWED_ATTRIBUTES = ["href", "title", "target"];

class SanitizationService {
  private static instance: SanitizationService | null = null;

  static getInstance(): SanitizationService {
    if (!SanitizationService.instance) {
      SanitizationService.instance = new SanitizationService();
    }
    return SanitizationService.instance;
  }

  /**
   * Sanitize HTML content to prevent XSS attacks
   * 
   * @param html The HTML content to sanitize
   * @param options Sanitization options
   * @returns Sanitized HTML string
   */
  sanitizeHtml(html: string | null | undefined, options: SanitizeOptions = {}): string {
    if (!html) return "";

    try {
      const {
        allowedTags = DEFAULT_ALLOWED_TAGS,
        allowedAttributes = DEFAULT_ALLOWED_ATTRIBUTES,
        stripTags = false,
        safeLinks = true,
      } = options;

      if (stripTags) {
        // Strip all HTML tags
        return DOMPurify.sanitize(html, {
          ALLOWED_TAGS: [],
          ALLOWED_ATTR: [],
        });
      }

      let sanitized = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: allowedTags,
        ALLOWED_ATTR: allowedAttributes,
      });

      // Add safe link attributes
      if (safeLinks) {
        sanitized = this.enforceSafeLinks(sanitized);
      }

      return sanitized;
    } catch (error) {
      logger.error({ error }, "HTML sanitization failed");
      // Return empty string on failure to be safe
      return "";
    }
  }

  /**
   * Sanitize plain text - removes ALL HTML
   * Use for titles, usernames, etc.
   * 
   * @param text The text to sanitize
   * @returns Plain text with no HTML
   */
  sanitizeText(text: string | null | undefined): string {
    return this.sanitizeHtml(text, { stripTags: true });
  }

  /**
   * Sanitize content for posts/comments
   * Allows rich text formatting but removes dangerous content
   * 
   * @param content The content to sanitize
   * @returns Sanitized content safe for storage
   */
  sanitizeContent(content: string | null | undefined): string {
    if (!content) return "";

    // First apply DOMPurify
    let sanitized = this.sanitizeHtml(content, {
      allowedTags: DEFAULT_ALLOWED_TAGS,
      allowedAttributes: DEFAULT_ALLOWED_ATTRIBUTES,
      safeLinks: true,
    });

    // Additional safety: limit length to prevent DoS
    const MAX_LENGTH = 50000; // 50KB limit
    if (sanitized.length > MAX_LENGTH) {
      logger.warn(`Content exceeded maximum length (${sanitized.length} > ${MAX_LENGTH}), truncating`);
      sanitized = sanitized.substring(0, MAX_LENGTH);
    }

    return sanitized;
  }

  /**
   * Sanitize a title - plain text only, no HTML
   * 
   * @param title The title to sanitize
   * @returns Sanitized title
   */
  sanitizeTitle(title: string | null | undefined): string {
    if (!title) return "";
    
    // Remove all HTML, then trim
    const sanitized = this.sanitizeText(title).trim();
    
    // Limit length
    const MAX_TITLE_LENGTH = 255;
    if (sanitized.length > MAX_TITLE_LENGTH) {
      return sanitized.substring(0, MAX_TITLE_LENGTH);
    }
    
    return sanitized;
  }

  /**
   * Enforce safe link attributes
   * Adds rel="noopener noreferrer" to all links
   */
  private enforceSafeLinks(html: string): string {
    return html.replace(/<a\s+([^>]*?)>/gi, (match, attrs) => {
      const hasRel = /\brel\s*=/.test(attrs);
      const normalizedAttrs = hasRel ? attrs : `${attrs} rel="noopener noreferrer"`;
      return `<a ${normalizedAttrs}>`;
    });
  }

  /**
   * Validate that content doesn't contain suspicious patterns
   * Returns true if content appears safe
   */
  validateContent(content: string | null | undefined): {
    valid: boolean;
    reason?: string;
  } {
    if (!content) return { valid: true };

    // Check for excessive links (potential spam)
    const linkCount = (content.match(/https?:\/\//g) || []).length;
    if (linkCount > 10) {
      return {
        valid: false,
        reason: `Too many links (${linkCount}). Maximum 10 links allowed.`,
      };
    }

    // Check for script tags (should be caught by DOMPurify, but defense in depth)
    if (/<script\b/i.test(content)) {
      return {
        valid: false,
        reason: "Script tags are not allowed",
      };
    }

    // Check for event handlers
    if (/\s+on\w+\s*=/i.test(content)) {
      return {
        valid: false,
        reason: "Event handlers are not allowed",
      };
    }

    // Check for data:text/html URLs
    if (/data:text\/html/i.test(content)) {
      return {
        valid: false,
        reason: "Data URLs are not allowed",
      };
    }

    return { valid: true };
  }

  /**
   * Sanitize and validate content in one step
   * Returns sanitized content or throws if validation fails
   */
  sanitizeAndValidate(
    content: string | null | undefined,
    options: SanitizeOptions & { maxLinks?: number } = {}
  ): { sanitized: string; valid: boolean; reason?: string } {
    const sanitized = this.sanitizeContent(content);
    
    // Additional validation
    const maxLinks = options.maxLinks ?? 10;
    const linkCount = (sanitized.match(/https?:\/\//g) || []).length;
    
    if (linkCount > maxLinks) {
      return {
        sanitized,
        valid: false,
        reason: `Too many links (${linkCount}). Maximum ${maxLinks} links allowed.`,
      };
    }

    return { sanitized, valid: true };
  }
}

// Export singleton instance
export const sanitizationService = SanitizationService.getInstance();

// Backward compatibility: Export individual functions
export const sanitizeHtml = (html: string | null | undefined, options?: SanitizeOptions): string =>
  sanitizationService.sanitizeHtml(html, options);

export const sanitizeText = (text: string | null | undefined): string =>
  sanitizationService.sanitizeText(text);

export const sanitizeContent = (content: string | null | undefined): string =>
  sanitizationService.sanitizeContent(content);

export const sanitizeTitle = (title: string | null | undefined): string =>
  sanitizationService.sanitizeTitle(title);

export const validateContent = (content: string | null | undefined): { valid: boolean; reason?: string } =>
  sanitizationService.validateContent(content);
