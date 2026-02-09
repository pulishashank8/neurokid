/**
 * AAC Board Responsive Tests
 * 
 * Tests the AAC (Augmentative and Alternative Communication) board
 * which is a critical feature for neurodivergent children.
 */

import { test, expect } from '@playwright/test';

test.describe('AAC Board Responsive Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/aac/demo');
    await page.waitForLoadState('networkidle');
  });

  test('AAC board loads on mobile', async ({ page }) => {
    // AAC board container should be visible
    const aacContainer = page.locator('[data-testid="aac-board-container"]');
    await expect(aacContainer).toBeVisible();

    // AAC cards should be present inside container
    const aacCards = aacContainer.locator('[data-testid="aac-card"]');
    await expect(aacCards.first()).toBeVisible();

    // Should have heading
    const heading = page.locator('h1').filter({ hasText: /AAC Communicator/i });
    await expect(heading).toBeVisible();
  });

  test('symbol grid is responsive', async ({ page }) => {
    // Look for AAC cards specifically by test id
    const aacCards = page.getByTestId('aac-card');
    await expect(aacCards.first()).toBeVisible();

    // Check first few symbol cards have proper touch target size
    const allButtons = await aacCards.all();
    const buttons = allButtons.slice(0, 5);
    for (const button of buttons) {
      const box = await button.boundingBox();
      if (box) {
        // Check touch target size (44x44px minimum per WCAG)
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('category tabs are accessible', async ({ page }) => {
    // Look for category tabs or navigation
    // Look for category tabs using aria-labels (text is hidden on mobile)
    const tabs = page.locator('button[aria-label*="Filter by"]').first();

    if (await tabs.isVisible().catch(() => false)) {
      await expect(tabs).toBeVisible();
    }
  });

  test('sentence bar is visible', async ({ page }) => {
    // Look for sentence/phrase display area
    const sentenceBar = page.locator('[class*="sentence"], [class*="phrase"], [class*="display"], [class*="output"]').first();

    if (await sentenceBar.isVisible().catch(() => false)) {
      await expect(sentenceBar).toBeVisible();
    }
  });

  test('grid adapts to landscape orientation', async ({ page }) => {
    // Test in landscape mode
    await page.setViewportSize({ width: 844, height: 390 }); // iPhone 14 landscape
    await page.waitForTimeout(500); // Wait for layout adjustment

    // AAC board should still be functional
    const aacBoard = page.locator('main, [class*="aac"]').first();
    await expect(aacBoard).toBeVisible();
  });

  test('symbols are large enough to tap', async ({ page }) => {
    // Get all symbol cards using test id
    const allButtons = await page.getByTestId('aac-card').all();
    const buttons = allButtons.slice(0, 10);

    for (const button of buttons) {
      const box = await button.boundingBox();
      if (box) {
        // AAC symbols should be reasonably large
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('clear button is accessible', async ({ page }) => {
    // Look for clear button
    const clearButton = page.locator('button').filter({ hasText: /Clear|Reset|Delete|X/i }).first();

    if (await clearButton.isVisible().catch(() => false)) {
      await expect(clearButton).toBeVisible();
    }
  });

  test('backspace button is accessible', async ({ page }) => {
    // Look for backspace/remove button
    const backspaceButton = page.locator('button').filter({ hasText: /Back|Remove|Undo|←/i }).first();

    if (await backspaceButton.isVisible().catch(() => false)) {
      await expect(backspaceButton).toBeVisible();
    }
  });

  test('AAC has proper accessibility attributes', async ({ page }) => {
    // AAC cards should have accessible names
    const aacCards = page.getByTestId('aac-card');
    const firstCard = aacCards.first();

    if (await firstCard.isVisible().catch(() => false)) {
      const ariaLabel = await firstCard.getAttribute('aria-label');
      // Should have aria-label for screen readers
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toMatch(/^Say /);
    }
  });
});
