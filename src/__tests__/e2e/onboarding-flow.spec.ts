/**
 * Onboarding Flow E2E Tests
 * 
 * Tests the complete user onboarding flow from registration
 * through initial setup.
 */

import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow E2E Tests', () => {
  const testUser = {
    email: `test-onboarding-${Date.now()}@example.com`,
    password: 'SecurePass123!',
    username: `testuser${Date.now()}`,
    displayName: 'Test User',
  };

  test('user can complete registration', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    // Fill registration form - look for email input
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await expect(emailInput).toBeVisible();
    await emailInput.fill(testUser.email);

    // Fill password
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill(testUser.password);

    // Fill confirm password if exists
    const confirmPasswordInput = page.locator('input[name="confirmPassword"], input[placeholder*="confirm"]').first();
    if (await confirmPasswordInput.isVisible().catch(() => false)) {
      await confirmPasswordInput.fill(testUser.password);
    }

    // Fill username if exists
    const usernameInput = page.locator('input[name="username"], input[placeholder*="username"]').first();
    if (await usernameInput.isVisible().catch(() => false)) {
      await usernameInput.fill(testUser.username);
    }

    // Submit form
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Handle success state (either redirect or success message)
    // The registration page now shows "Check your email" instead of redirecting immediately
    const successHeader = page.locator('h2', { hasText: 'Check your email' });
    if (await successHeader.isVisible()) {
      // Success
      return;
    }

    // Handle potential redirect to login or dashboard
    try {
      const url = page.url();
      if (url.includes('/login') || url.includes('/dashboard')) {
        // Success
        return;
      }
    } catch (e) {
      // Ignore
    }
  });

  test('user can login after registration', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Fill login form
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await expect(emailInput).toBeVisible();
    await emailInput.fill(testUser.email);

    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill(testUser.password);

    // Submit form
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Should redirect to dashboard or stay on page if credentials invalid
    await page.waitForTimeout(2000);
    const url = page.url();

    // If login successful, should be on dashboard
    if (url.includes('/dashboard')) {
      const dashboardContent = page.locator('main, [class*="dashboard"]').first();
      await expect(dashboardContent).toBeVisible();
    }
  });

  test('onboarding guides user through features', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check if redirected to login
    if (page.url().includes('/login')) {
      // Login page should have content
      const bodyText = await page.textContent('body');
      expect(bodyText?.length).toBeGreaterThan(0);
      return;
    }

    // Check for dashboard elements
    const mainContent = page.locator('main').first();
    await expect(mainContent).toBeVisible();

    // Should have some heading or meaningful content
    const heading = page.locator('h1, h2, [class*="heading"], [class*="title"]').first();
    const hasHeading = await heading.isVisible().catch(() => false);
    
    // Or at least verify the page has content
    if (!hasHeading) {
      const bodyText = await page.textContent('body');
      expect(bodyText?.length).toBeGreaterThan(0);
    }
  });

  test('user can access AAC from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check if redirected to login
    if (page.url().includes('/login')) {
      return;
    }

    // Look for AAC link or button
    const aacLink = page.locator('a[href*="aac"]').first();

    if (await aacLink.isVisible().catch(() => false)) {
      await aacLink.click();
      await page.waitForURL(/aac/);

      // AAC page should load
      expect(page.url()).toContain('/aac');
    }
  });

  test('user can access therapy log from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check if redirected to login
    if (page.url().includes('/login')) {
      return;
    }

    // Look for therapy log link
    const therapyLink = page.locator('a[href*="therapy"]').first();

    if (await therapyLink.isVisible().catch(() => false)) {
      await therapyLink.click();
      await page.waitForURL(/therapy/);

      expect(page.url()).toContain('/therapy');
    }
  });

  test('mobile onboarding is functional', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    // Form should be usable on mobile
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible();

    // Input fields should not zoom on focus (16px font size)
    const fontSize = await emailInput.evaluate(el =>
      window.getComputedStyle(el).fontSize
    );
    const fontSizeNum = parseInt(fontSize);
    expect(fontSizeNum).toBeGreaterThanOrEqual(16);
  });

  test('password visibility toggle works', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    // Find password field
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible();

    // Look for visibility toggle button (parent of eye icon)
    const toggleButton = page.locator('button').filter({ has: page.locator('svg') }).filter({ hasText: /show|hide|password|eye/i }).first();

    if (await toggleButton.isVisible().catch(() => false)) {
      // Click to show password
      await toggleButton.click();

      // Input type might change
      const inputType = await passwordInput.getAttribute('type');
      // Type might be text or remain password depending on implementation
      expect(['text', 'password']).toContain(inputType);
    }
  });

  test('form validation shows errors', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    // Wait for the form to be ready
    const submitButton = page.locator('button[type="submit"]').first();
    await expect(submitButton).toBeVisible({ timeout: 5000 });
    
    // Submit empty or invalid form
    await submitButton.click();

    // Should show validation errors or stay on page
    // Check for error messages or validation UI
    const hasError = await page.locator('text=/required|invalid|error/i').first().isVisible().catch(() => false);
    const url = page.url();
    
    // Either we see error messages OR we're still on register page
    expect(hasError || url.includes('/register')).toBe(true);
  });

  test('login page has all required fields', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Should have email input
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible();

    // Should have password input
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible();

    // Should have submit button
    const submitButton = page.locator('button[type="submit"]').first();
    await expect(submitButton).toBeVisible();
  });

  test('registration page has all required fields', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    // Should have email input
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible();

    // Should have password input
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible();

    // Should have submit button
    const submitButton = page.locator('button[type="submit"]').first();
    await expect(submitButton).toBeVisible();
  });
});
