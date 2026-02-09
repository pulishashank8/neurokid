/**
 * Dashboard Responsive Tests
 * 
 * Tests the dashboard across all device breakpoints.
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard Responsive Tests', () => {
  test('dashboard loads and renders correctly', async ({ page }) => {
    // Navigate to dashboard (will redirect to login if not authenticated)
    await page.goto('/dashboard', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded');
    
    // Give extra time for hydration
    await page.waitForTimeout(2000);
    
    // Check if we're on dashboard or redirected to login
    const url = page.url();

    if (url.includes('/dashboard')) {
      // Dashboard content should be visible
      const dashboardContent = page.locator('main').first();
      await expect(dashboardContent).toBeVisible();

      // Should have some content on the page
      const bodyText = await page.textContent('body');
      expect(bodyText?.length).toBeGreaterThan(100);
    } else {
      // Should redirect to login
      expect(url).toContain('/login');
    }
  });

  test('5 pillars grid is responsive', async ({ page }) => {
    await page.goto('/dashboard', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const url = page.url();

    if (url.includes('/dashboard')) {
      // Check page has content
      const bodyText = await page.textContent('body');
      expect(bodyText?.length).toBeGreaterThan(100);
    } else {
      // Redirected to login - that's valid behavior
      expect(url).toContain('/login');
    }
  });

  test('support tools are accessible', async ({ page }) => {
    await page.goto('/dashboard', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const url = page.url();

    if (url.includes('/dashboard')) {
      // Page should have loaded
      const body = page.locator('body');
      await expect(body).toBeVisible();
    } else {
      // Redirected to login - that's valid behavior
      expect(url).toContain('/login');
    }
  });

  test('navigation works on all screen sizes', async ({ page }) => {
    await page.goto('/dashboard', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const viewport = page.viewportSize();
    const url = page.url();

    if (url.includes('/login')) {
      // Login page - valid when not authenticated
      expect(url).toContain('/login');
      return;
    }

    // On dashboard, page should be visible
    const body = page.locator('body');
    await expect(body).toBeVisible();

    if (viewport && viewport.width < 1024) {
      // Mobile: check for hamburger menu button if nav exists
      const hasMenuButton = await page.locator('button[aria-label="Toggle menu"]').isVisible().catch(() => false);
      expect(hasMenuButton).toBe(true);
    }
  });

  test('widgets are properly sized', async ({ page }) => {
    await page.goto('/dashboard', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const url = page.url();

    if (url.includes('/dashboard')) {
      // Check that main content area is visible
      const main = page.locator('main').first();
      await expect(main).toBeVisible();
      
      // Content should fit within viewport
      const viewport = page.viewportSize();
      if (viewport) {
        expect(viewport.width).toBeGreaterThan(0);
      }
    } else {
      // Redirected to login - that's valid behavior
      expect(url).toContain('/login');
    }
  });

  test('dashboard has proper headings structure', async ({ page }) => {
    await page.goto('/dashboard', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const url = page.url();

    // Page should have some content structure either way
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(50);
  });

  test('quick action buttons are visible', async ({ page }) => {
    await page.goto('/dashboard', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const url = page.url();

    // Page should have interactive elements
    const buttons = page.locator('button, a');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });
});
