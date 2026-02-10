import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Responsive and E2E Testing
 * 
 * This configuration covers:
 * - Mobile responsive testing (iPhone, Android)
 * - Tablet responsive testing (iPad)
 * - Desktop responsive testing
 * - Cross-browser testing (Chromium, Firefox, WebKit)
 * - Visual regression testing
 * 
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './src/__tests__/e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use */
  reporter: 'html',
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5000',
    
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'on-first-retry',
  },

  /* Configure projects for major browsers and devices */
  projects: [
    // ==========================================
    // MOBILE DEVICES (Critical for NeuroKid)
    // ==========================================
    
    // iPhone SE (smallest screen - 375x667)
    {
      name: 'Mobile - iPhone SE',
      use: { 
        ...devices['iPhone SE'],
        viewport: { width: 375, height: 667 },
      },
    },
    
    // iPhone 12/13/14 (standard phone - 390x844)
    {
      name: 'Mobile - iPhone 12/13/14',
      use: { 
        ...devices['iPhone 12'],
        viewport: { width: 390, height: 844 },
      },
    },
    
    // iPhone 14 Pro Max (large phone - 430x932)
    {
      name: 'Mobile - iPhone 14 Pro Max',
      use: { 
        ...devices['iPhone 14 Pro Max'],
        viewport: { width: 430, height: 932 },
      },
    },
    
    // Android Small (320x640) - Minimum supported size
    {
      name: 'Mobile - Android Small',
      use: { 
        ...devices['Pixel 5'],
        viewport: { width: 320, height: 640 },
      },
    },
    
    // Pixel 7 (standard Android - 412x915)
    {
      name: 'Mobile - Pixel 7',
      use: { 
        ...devices['Pixel 7'],
        viewport: { width: 412, height: 915 },
      },
    },

    // ==========================================
    // TABLET DEVICES
    // ==========================================
    
    // iPad Mini (portrait - 768x1024)
    {
      name: 'Tablet - iPad Mini Portrait',
      use: { 
        ...devices['iPad Mini'],
        viewport: { width: 768, height: 1024 },
      },
    },
    
    // iPad Mini (landscape - 1024x768)
    {
      name: 'Tablet - iPad Mini Landscape',
      use: { 
        ...devices['iPad Mini landscape'],
        viewport: { width: 1024, height: 768 },
      },
    },
    
    // iPad Pro 11 (portrait - 834x1194)
    {
      name: 'Tablet - iPad Pro 11 Portrait',
      use: { 
        ...devices['iPad Pro 11'],
        viewport: { width: 834, height: 1194 },
      },
    },

    // ==========================================
    // DESKTOP DEVICES
    // ==========================================
    
    // Desktop Chrome (1280x720)
    {
      name: 'Desktop - Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    
    // Desktop Firefox
    {
      name: 'Desktop - Firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
      },
    },
    
    // Desktop Safari
    {
      name: 'Desktop - Safari',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
      },
    },
    
    // Large Desktop (1920x1080)
    {
      name: 'Desktop - Large (1920x1080)',
      use: { 
        browserName: 'chromium',
        viewport: { width: 1920, height: 1080 },
      },
    },

    // ==========================================
    // ACCESSIBILITY TESTING
    // ==========================================
    
    // High contrast mode
    {
      name: 'Accessibility - High Contrast',
      use: { 
        ...devices['Desktop Chrome'],
        contextOptions: {
          forcedColors: 'active',
        },
      },
    },
    
    // Reduced motion
    {
      name: 'Accessibility - Reduced Motion',
      use: { 
        ...devices['Desktop Chrome'],
        contextOptions: {
          reducedMotion: 'reduce',
        },
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5000',
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000, // 3 minutes for cold start
  },
});
