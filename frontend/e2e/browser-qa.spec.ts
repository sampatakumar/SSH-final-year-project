import { test, expect } from '@playwright/test';

test.describe('Smart Skill Hub — Production Browser QA & Route Audit', () => {

  // ========================================================================
  // 1. PUBLIC ROUTES & LANDING PAGE INTEGRITY
  // ========================================================================
  test.describe('Public Navigation & Route Rendering', () => {
    test('renders landing page with navigation, hero section, and CTAs without console errors', async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto('/');
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Verify page title
      await expect(page).toHaveTitle(/Smart Skill Hub/i);

      // Verify core landing body
      await expect(page.locator('body')).toBeVisible();

      // Verify navigation links / CTA existence
      const authLinks = page.locator('a[href*="/login"], a[href*="/register"], button:has-text("Get Started"), a:has-text("Sign In"), a:has-text("Get Started")');
      const count = await authLinks.count();
      expect(count).toBeGreaterThan(0);

      // Verify no fatal console errors occurred
      const fatalErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('Download the React DevTools'));
      expect(fatalErrors).toHaveLength(0);
    });

    test('renders login page with functional credentials form', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');

      // Check form fields
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();

      // Check submit button
      const submitBtn = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Log In")');
      await expect(submitBtn.first()).toBeVisible();

      // Check links to register and password reset
      const registerLink = page.locator('a[href*="/register"]').first();
      const forgotLink = page.locator('a[href*="/forgot-password"]').first();
      await expect(registerLink).toBeVisible();
      await expect(forgotLink).toBeVisible();
    });

    test('renders register page with registration form inputs', async ({ page }) => {
      await page.goto('/register');
      await page.waitForLoadState('domcontentloaded');

      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      await expect(emailInput).toBeVisible();
      expect(await passwordInput.count()).toBeGreaterThanOrEqual(1);

      const signInLink = page.locator('a[href*="/login"]').first();
      await expect(signInLink).toBeVisible();
    });

    test('renders forgot password recovery form', async ({ page }) => {
      await page.goto('/forgot-password');
      await page.waitForLoadState('domcontentloaded');

      const emailInput = page.locator('input[type="email"], input[name="email"]');
      await expect(emailInput).toBeVisible();

      const backLink = page.locator('a[href*="/login"], button:has-text("Back to Sign In"), a:has-text("Sign In")');
      expect(await backLink.count()).toBeGreaterThan(0);
    });

    test('renders 404 page for unknown deep links with recovery button', async ({ page }) => {
      await page.goto('/non-existent-route-for-testing-404');
      await page.waitForLoadState('domcontentloaded');

      const notFoundHeading = page.locator('text=/404|not found|page not found/i');
      await expect(notFoundHeading.first()).toBeVisible();

      const homeLink = page.locator('a[href="/"], a:has-text("Home"), button:has-text("Home")');
      expect(await homeLink.count()).toBeGreaterThan(0);
    });
  });

  // ========================================================================
  // 2. AUTHENTICATION BOUNDARIES & ROUTE GUARDS
  // ========================================================================
  test.describe('Protected Route Guards & Access Control', () => {
    const protectedRoutes = [
      '/dashboard',
      '/dashboard/mentor',
      '/dashboard/skills',
      '/dashboard/gaps',
      '/dashboard/roadmap',
      '/dashboard/edutube',
      '/dashboard/coding',
      '/dashboard/github',
      '/dashboard/resumes',
      '/dashboard/projects',
      '/dashboard/portfolios',
      '/dashboard/profile',
      '/dashboard/analytics',
      '/dashboard/settings',
      '/dashboard/admin/analytics',
      '/onboarding',
    ];

    for (const route of protectedRoutes) {
      test(`unauthenticated visit to ${route} redirects to login with returnTo`, async ({ page }) => {
        await page.goto(route);
        await page.waitForURL(/\/login/, { timeout: 10000 });

        expect(page.url()).toContain('/login');
        const urlObj = new URL(page.url());
        expect(urlObj.searchParams.get('returnTo')).toBeTruthy();
      });
    }
  });

  // ========================================================================
  // 3. LAZY-LOADING, ASSET DELIVERY & REHYDRATION
  // ========================================================================
  test.describe('Lazy-Loading & Client-Side Rehydration', () => {
    test('direct deep link to /login survives page reload without blank screen', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      const emailBefore = page.locator('input[type="email"], input[name="email"]');
      await expect(emailBefore).toBeVisible();

      // Trigger hard refresh
      await page.reload();
      await page.waitForLoadState('domcontentloaded');

      const emailAfter = page.locator('input[type="email"], input[name="email"]');
      await expect(emailAfter).toBeVisible();
    });

    test('browser back and forward navigation works seamlessly between pages', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');
      expect(page.url()).toContain('/login');

      await page.goBack();
      await page.waitForLoadState('domcontentloaded');
      expect(page.url()).not.toContain('/login');

      await page.goForward();
      await page.waitForLoadState('domcontentloaded');
      expect(page.url()).toContain('/login');
    });

    test('verifies static assets (CSS, JS chunks, and fonts) return HTTP 200', async ({ page }) => {
      const failedRequests: string[] = [];

      page.on('response', (response) => {
        const url = response.url();
        if ((url.endsWith('.js') || url.endsWith('.css') || url.includes('/assets/')) && !url.includes('google-analytics')) {
          if (response.status() >= 400) {
            failedRequests.push(`${response.status()} ${url}`);
          }
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      expect(failedRequests).toHaveLength(0);
    });
  });

  // ========================================================================
  // 4. RESPONSIVE VIEWPORT TESTING
  // ========================================================================
  test.describe('Responsive Viewports & Overflow Guard', () => {
    const viewports = [
      { name: 'Desktop (1440x900)', width: 1440, height: 900 },
      { name: 'Laptop (1280x800)', width: 1280, height: 800 },
      { name: 'Tablet (768x1024)', width: 768, height: 1024 },
      { name: 'Mobile (390x844)', width: 390, height: 844 },
    ];

    for (const vp of viewports) {
      test(`verifies zero horizontal overflow at ${vp.name}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // Check horizontal overflow
        const overflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        expect(overflow).toBe(false);
      });

      test(`verifies login form visibility and layout at ${vp.name}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto('/login');
        await page.waitForLoadState('domcontentloaded');

        const emailInput = page.locator('input[type="email"], input[name="email"]');
        await expect(emailInput).toBeVisible();

        const overflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        expect(overflow).toBe(false);
      });
    }
  });

  // ========================================================================
  // 5. ACCESSIBILITY & KEYBOARD NAVIGATION
  // ========================================================================
  test.describe('Accessibility & Interactive Controls', () => {
    test('verifies semantic heading hierarchy and page landmarks', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      const headings = page.locator('h1, h2, h3');
      const count = await headings.count();
      expect(count).toBeGreaterThan(0);

      // Verify at least one primary h1 exists
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThanOrEqual(1);
    });

    test('supports keyboard Tab navigation through login form controls', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');

      // Focus email input and Tab to next
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      await emailInput.focus();
      await expect(emailInput).toBeFocused();

      await page.keyboard.press('Tab');
      // Should focus password or show password toggle
      const focusedElementTag = await page.evaluate(() => document.activeElement?.tagName.toLowerCase());
      expect(['input', 'button', 'a']).toContain(focusedElementTag);
    });

    test('all interactive buttons have accessible text names', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');

      const buttons = page.locator('button');
      const count = await buttons.count();

      for (let i = 0; i < count; i++) {
        const btn = buttons.nth(i);
        if (await btn.isVisible()) {
          const text = (await btn.innerText()).trim();
          const ariaLabel = await btn.getAttribute('aria-label');
          const title = await btn.getAttribute('title');
          const hasAccessibleName = Boolean(text || ariaLabel || title);
          expect(hasAccessibleName).toBe(true);
        }
      }
    });
  });
});
