import { test, expect } from '@playwright/test';
import { enterDemo } from './helpers/auth.js';
import { navigateTo, waitForPageReady } from './helpers/navigation.js';

test.describe('Smoke Test — All Pages Load', () => {
  test.beforeEach(async ({ page }) => {
    await enterDemo(page);
  });

  test('landing page shows when no cookie', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');
    await expect(page.locator('text=Try Live Demo').first()).toBeVisible({ timeout: 10000 });
  });

  test('dashboard loads after demo entry', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);
    await expect(page.locator('main')).toBeVisible();
  });

  test('team matrix page loads', async ({ page }) => {
    await navigateTo(page, 'Team Matrix');
    await waitForPageReady(page);
    await expect(page.locator('main')).toBeVisible();
  });

  test('evolution page loads', async ({ page }) => {
    await navigateTo(page, 'Evolution');
    await waitForPageReady(page);
    await expect(page.locator('main')).toBeVisible();
  });

  test('settings page loads', async ({ page }) => {
    // Settings is only visible when authenticated — demo mode auto-authenticates
    await page.goto('/settings');
    await waitForPageReady(page);
    await expect(page.locator('main')).toBeVisible();
  });

  test('no unexpected console errors on navigation', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await waitForPageReady(page);
    await navigateTo(page, 'Team Matrix');
    await waitForPageReady(page);
    await navigateTo(page, 'Evolution');
    await waitForPageReady(page);

    const realErrors = errors.filter(e =>
      !e.includes('Download the React DevTools') &&
      !e.includes('Warning:') &&
      !e.includes('favicon')
    );

    expect(realErrors).toHaveLength(0);
  });
});
