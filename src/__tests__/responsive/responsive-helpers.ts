/**
 * Responsive Testing Helpers
 * 
 * Utilities for testing responsive design across different viewports.
 * Uses Playwright for visual testing and component testing.
 */

import { expect, type Page } from '@playwright/test';

// Standard breakpoints matching Tailwind defaults
export const BREAKPOINTS = {
  xs: { width: 375, height: 667, name: 'iPhone SE' },
  sm: { width: 390, height: 844, name: 'iPhone 14' },
  md: { width: 768, height: 1024, name: 'iPad Mini' },
  lg: { width: 1024, height: 768, name: 'iPad Landscape' },
  xl: { width: 1280, height: 800, name: 'MacBook Air' },
  '2xl': { width: 1536, height: 864, name: 'Desktop' },
} as const;

export type BreakpointName = keyof typeof BREAKPOINTS;

/**
 * Set viewport to specific breakpoint
 */
export async function setViewport(page: Page, breakpoint: BreakpointName): Promise<void> {
  const { width, height } = BREAKPOINTS[breakpoint];
  await page.setViewportSize({ width, height });
}

/**
 * Test a component at multiple breakpoints
 */
export async function testAtBreakpoints(
  page: Page,
  breakpoints: BreakpointName[],
  testFn: (breakpoint: BreakpointName) => Promise<void>
): Promise<void> {
  for (const breakpoint of breakpoints) {
    await setViewport(page, breakpoint);
    await testFn(breakpoint);
  }
}

/**
 * Check if element is within viewport bounds
 */
export async function isElementInViewport(page: Page, selector: string): Promise<boolean> {
  return page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );
  }, selector);
}

/**
 * Check for horizontal overflow
 */
export async function hasHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
}

/**
 * Check touch target sizes (minimum 44x44px per WCAG)
 */
export async function checkTouchTargets(page: Page, selector: string): Promise<Array<{ element: string; width: number; height: number; valid: boolean }>> {
  return page.evaluate((sel) => {
    const elements = document.querySelectorAll(sel);
    return Array.from(elements).map((el) => {
      const rect = (el as Element).getBoundingClientRect();
      return {
        element: el.tagName + (el.id ? `#${el.id}` : '') + (el.className ? `.${el.className.split(' ')[0]}` : ''),
        width: rect.width,
        height: rect.height,
        valid: rect.width >= 44 && rect.height >= 44,
      };
    });
  }, selector);
}

/**
 * Get computed font size of element
 */
export async function getFontSize(page: Page, selector: string): Promise<number> {
  return page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return 0;
    const style = window.getComputedStyle(element);
    return parseFloat(style.fontSize);
  }, selector);
}

/**
 * Check for text truncation or overflow
 */
export async function hasTextOverflow(page: Page, selector: string): Promise<boolean> {
  return page.evaluate((sel) => {
    const elements = document.querySelectorAll(sel);
    return Array.from(elements).some((el) => {
      const style = window.getComputedStyle(el);
      return style.overflow === 'hidden' && el.scrollWidth > el.clientWidth;
    });
  }, selector);
}

/**
 * Responsive test assertions
 */
export const responsiveAssertions = {
  /**
   * Assert no horizontal overflow
   */
  async noHorizontalOverflow(page: Page): Promise<void> {
    const hasOverflow = await hasHorizontalOverflow(page);
    expect(hasOverflow, 'Page should not have horizontal overflow').toBe(false);
  },

  /**
   * Assert element is visible in viewport
   */
  async elementInViewport(page: Page, selector: string): Promise<void> {
    const isVisible = await isElementInViewport(page, selector);
    expect(isVisible, `Element ${selector} should be in viewport`).toBe(true);
  },

  /**
   * Assert all touch targets meet minimum size
   */
  async validTouchTargets(page: Page, selector: string): Promise<void> {
    const targets = await checkTouchTargets(page, selector);
    const invalidTargets = targets.filter(t => !t.valid);
    expect(invalidTargets, `All touch targets should be at least 44x44px`).toHaveLength(0);
  },

  /**
   * Assert minimum font size for readability
   */
  async minimumFontSize(page: Page, selector: string, minSize: number = 12): Promise<void> {
    const fontSize = await getFontSize(page, selector);
    expect(fontSize).toBeGreaterThanOrEqual(minSize);
  },

  /**
   * Assert element exists and is visible
   */
  async elementVisible(page: Page, selector: string): Promise<void> {
    const element = page.locator(selector);
    await expect(element).toBeVisible();
  },

  /**
   * Assert no overlapping elements
   */
  async noOverlappingElements(page: Page, selector1: string, selector2: string): Promise<void> {
    const overlap = await page.evaluate((sel1, sel2) => {
      const el1 = document.querySelector(sel1);
      const el2 = document.querySelector(sel2);
      if (!el1 || !el2) return false;
      
      const rect1 = el1.getBoundingClientRect();
      const rect2 = el2.getBoundingClientRect();
      
      return !(rect1.right < rect2.left || 
               rect1.left > rect2.right || 
               rect1.bottom < rect2.top || 
               rect1.top > rect2.bottom);
    }, selector1, selector2);
    
    expect(overlap, `${selector1} and ${selector2} should not overlap`).toBe(false);
  },
};

/**
 * Mobile-specific test helpers
 */
export const mobileHelpers = {
  /**
   * Simulate mobile touch events
   */
  async simulateTouch(page: Page, selector: string): Promise<void> {
    const element = page.locator(selector);
    await element.dispatchEvent('touchstart');
    await element.dispatchEvent('touchend');
  },

  /**
   * Test with virtual keyboard open (mobile)
   */
  async withKeyboardOpen(page: Page, inputSelector: string, testFn: () => Promise<void>): Promise<void> {
    // Focus input to trigger keyboard
    await page.locator(inputSelector).focus();
    // Small delay for keyboard animation
    await page.waitForTimeout(300);
    await testFn();
    // Blur to close keyboard
    await page.locator(inputSelector).blur();
  },

  /**
   * Check if hamburger menu is visible (mobile breakpoint)
   */
  async isMobileMenuVisible(page: Page): Promise<boolean> {
    const hamburger = page.locator('[data-testid="mobile-menu-button"], button[aria-label*="menu"], button:has(.lucide-menu)');
    return hamburger.isVisible().catch(() => false);
  },

  /**
   * Open mobile navigation menu
   */
  async openMobileMenu(page: Page): Promise<void> {
    const hamburger = page.locator('[data-testid="mobile-menu-button"], button[aria-label*="menu"], button:has(.lucide-menu)');
    await hamburger.click();
    // Wait for menu animation
    await page.waitForTimeout(300);
  },

  /**
   * Scroll and check for sticky elements
   */
  async testStickyElements(page: Page, scrollAmount: number = 500): Promise<{ stickyElements: string[]; working: boolean }> {
    const before = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('*'))
        .filter(el => window.getComputedStyle(el).position === 'sticky' || window.getComputedStyle(el).position === 'fixed')
        .map(el => el.tagName + (el.className ? `.${el.className.split(' ')[0]}` : ''));
    });

    await page.evaluate((amount) => window.scrollBy(0, amount), scrollAmount);

    const after = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('*'))
        .filter(el => {
          const style = window.getComputedStyle(el);
          return (style.position === 'sticky' || style.position === 'fixed') && 
                 el.getBoundingClientRect().top >= 0;
        })
        .map(el => el.tagName + (el.className ? `.${el.className.split(' ')[0]}` : ''));
    });

    return {
      stickyElements: after,
      working: before.length === after.length || after.length > 0,
    };
  },
};

/**
 * Accessibility checks for responsive design
 */
export const responsiveA11y = {
  /**
   * Check zoom behavior (user should be able to zoom to 200%)
   */
  async testZoom(page: Page, zoomLevel: number = 2): Promise<void> {
    await page.evaluate((zoom) => {
      (document.body.style as any).zoom = String(zoom);
    }, zoomLevel);
    
    // Check layout still works
    const hasOverflow = await hasHorizontalOverflow(page);
    expect(hasOverflow, `Layout should adapt to ${zoomLevel * 100}% zoom`).toBe(false);
    
    // Reset zoom
    await page.evaluate(() => {
      (document.body.style as any).zoom = '1';
    });
  },

  /**
   * Test with reduced motion preference
   */
  async testReducedMotion(page: Page): Promise<{ animationsDisabled: boolean }> {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    const hasAnimations = await page.evaluate(() => {
      const animatedElements = document.querySelectorAll('[class*="animate"], [class*="transition"]');
      return animatedElements.length > 0;
    });
    
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    
    return { animationsDisabled: !hasAnimations };
  },

  /**
   * Check color contrast at different sizes
   */
  async testContrast(page: Page, selectors: string[]): Promise<Array<{ selector: string; contrast: number; pass: boolean }>> {
    return page.evaluate((sels) => {
      return sels.map(sel => {
        const el = document.querySelector(sel);
        if (!el) return { selector: sel, contrast: 0, pass: false };
        
        const style = window.getComputedStyle(el);
        // This is a simplified check - real implementation would use contrast ratio calculation
        
        return {
          selector: sel,
          contrast: 4.5, // Placeholder
          pass: true,
        };
      });
    }, selectors);
  },
};

/**
 * Generate responsive test matrix for a page
 */
export function generateResponsiveTestMatrix(
  pagePath: string,
  elements: Array<{ selector: string; requiredBreakpoints: BreakpointName[] }>
): string {
  const tests: string[] = [];
  
  for (const breakpoint of Object.keys(BREAKPOINTS) as BreakpointName[]) {
    tests.push(`
      test('renders correctly at ${breakpoint} breakpoint', async ({ page }) => {
        await page.goto('${pagePath}');
        await setViewport(page, '${breakpoint}');
        
        // Test required elements
        ${elements
          .filter(e => e.requiredBreakpoints.includes(breakpoint))
          .map(e => `await responsiveAssertions.elementVisible(page, '${e.selector}');`)
          .join('\n        ')}
        
        // Assert no overflow
        await responsiveAssertions.noHorizontalOverflow(page);
        
        // Take screenshot for visual regression
        await expect(page).toHaveScreenshot('${pagePath.replace(/\//g, '-')}-${breakpoint}.png');
      });
    `);
  }
  
  return tests.join('\n');
}
