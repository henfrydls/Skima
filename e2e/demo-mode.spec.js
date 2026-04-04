import { test, expect } from '@playwright/test';
import { enterDemo } from './helpers/auth.js';
import { navigateTo, waitForPageReady } from './helpers/navigation.js';

test.describe('Demo Mode — Restrictions', () => {
  test.beforeEach(async ({ page }) => {
    await enterDemo(page);
  });

  test('cookie persists after page refresh', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);
    await page.reload();
    await waitForPageReady(page);
    // Should still be on dashboard, not landing
    // Landing has "Try Demo" text — dashboard does not
    const tryDemoVisible = await page.locator('text=Try Demo').first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(tryDemoVisible).toBe(false);
  });

  test('settings page accessible in demo', async ({ page }) => {
    await navigateTo(page, 'Settings');
    await waitForPageReady(page);
    await expect(page.locator('main')).toBeVisible();
  });
});
